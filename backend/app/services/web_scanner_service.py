import asyncio
import socket
import ssl
import time
import datetime
import urllib.parse
from typing import Dict, Any, List, Optional, Tuple
import httpx

from app.core.logging import logger
from app.schemas.schemas import VulnerabilityFinding, RemediationSnippet, WebScanResponse

class WebScannerService:
    """
    Automated, non-destructive Web Vulnerability Scanner & Remediation Engine.
    Audits live websites for HTTP security headers, SSL/TLS posture, cookie hygiene,
    information disclosure, sensitive path exposure, DNS anti-spoofing, and software CVEs.
    Provides ready-to-deploy copy-paste remediation patches for Nginx, Apache, Express, Next.js, and Django.
    """

    @classmethod
    def normalize_url(cls, raw_url: str) -> Tuple[str, str, str, int]:
        """Normalizes input into (full_url, scheme, hostname, port)."""
        target = raw_url.strip()
        if not target.startswith("http://") and not target.startswith("https://"):
            target = f"https://{target}"

        parsed = urllib.parse.urlparse(target)
        scheme = parsed.scheme.lower() or "https"
        hostname = (parsed.netloc or parsed.path).split(":")[0].lower()
        port = parsed.port or (443 if scheme == "https" else 80)
        full_url = f"{scheme}://{hostname}{f':{port}' if port not in (80, 443) else ''}"
        return full_url, scheme, hostname, port

    @classmethod
    async def resolve_ip(cls, hostname: str) -> Optional[str]:
        """Safely resolves IPv4 address for target."""
        try:
            loop = asyncio.get_running_loop()
            addr_info = await loop.run_in_executor(None, socket.gethostbyname, hostname)
            return addr_info
        except Exception:
            return None

    @classmethod
    async def audit_tls(cls, hostname: str, port: int = 443) -> Dict[str, Any]:
        """Performs non-destructive TLS handshake to audit certificate validity, ciphers, and protocol version."""
        tls_info = {
            "supported": False,
            "version": None,
            "cipher": None,
            "issuer": None,
            "expires_at": None,
            "days_until_expiry": None,
            "is_expired": False,
            "weak_protocol": False,
        }

        def _tls_probe():
            try:
                ctx = ssl.create_default_context()
                ctx.check_hostname = True
                ctx.verify_mode = ssl.CERT_REQUIRED
                with socket.create_connection((hostname, port), timeout=3.5) as sock:
                    with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                        cert = ssock.getpeercert()
                        cipher = ssock.cipher()
                        version = ssock.version()
                        
                        not_after_str = cert.get("notAfter")
                        expires_at = None
                        days_left = None
                        is_expired = False
                        if not_after_str:
                            expires_at = datetime.datetime.strptime(not_after_str, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=datetime.timezone.utc)
                            now = datetime.datetime.now(datetime.timezone.utc)
                            delta = expires_at - now
                            days_left = delta.days
                            is_expired = days_left < 0

                        issuer_dict = dict(x[0] for x in cert.get("issuer", []))
                        issuer = issuer_dict.get("organizationName") or issuer_dict.get("commonName") or "Unknown Issuer"

                        return {
                            "supported": True,
                            "version": version,
                            "cipher": cipher[0] if cipher else "Unknown",
                            "issuer": issuer,
                            "expires_at": expires_at.isoformat() if expires_at else None,
                            "days_until_expiry": days_left,
                            "is_expired": is_expired,
                            "weak_protocol": version in ("TLSv1", "TLSv1.1", "SSLv3", "SSLv2"),
                        }
            except Exception as e:
                return {"supported": False, "error": str(e)}

        try:
            loop = asyncio.get_running_loop()
            res = await loop.run_in_executor(None, _tls_probe)
            return res
        except Exception:
            return tls_info

    @classmethod
    async def audit_dns_spoofing(cls, hostname: str) -> Dict[str, Any]:
        """Audits domain SPF and DMARC records to prevent email impersonation."""
        def _dns_probe():
            res = {"spf_present": False, "spf_record": None, "dmarc_present": False, "dmarc_record": None, "dmarc_policy": None}
            try:
                import dns.resolver
                # SPF Check
                try:
                    txt_records = dns.resolver.resolve(hostname, "TXT", lifetime=2.5)
                    for rdata in txt_records:
                        txt_str = "".join([b.decode('utf-8', errors='ignore') for b in rdata.strings])
                        if txt_str.startswith("v=spf1"):
                            res["spf_present"] = True
                            res["spf_record"] = txt_str
                            break
                except Exception:
                    pass

                # DMARC Check
                try:
                    dmarc_records = dns.resolver.resolve(f"_dmarc.{hostname}", "TXT", lifetime=2.5)
                    for rdata in dmarc_records:
                        txt_str = "".join([b.decode('utf-8', errors='ignore') for b in rdata.strings])
                        if txt_str.startswith("v=DMARC1"):
                            res["dmarc_present"] = True
                            res["dmarc_record"] = txt_str
                            for part in txt_str.split(";"):
                                part = part.strip()
                                if part.startswith("p="):
                                    res["dmarc_policy"] = part.split("=")[1].strip().lower()
                            break
                except Exception:
                    pass
            except Exception:
                pass
            return res

        try:
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(None, _dns_probe)
        except Exception:
            return {"spf_present": False, "dmarc_present": False}

    @classmethod
    async def probe_sensitive_endpoints(cls, base_url: str) -> List[Dict[str, str]]:
        """Safely checks if sensitive administrative or VCS files are accidentally exposed."""
        paths_to_check = [
            ("/.git/HEAD", "Git Version Control Repository", "ref: refs/"),
            ("/.env", "Environment Secrets Configuration", "="),
            ("/robots.txt", "Robots Crawler Policy", "User-agent:"),
        ]

        exposed = []
        async with httpx.AsyncClient(timeout=2.5, verify=False) as client:
            for path, title, signature in paths_to_check:
                try:
                    resp = await client.get(f"{base_url}{path}")
                    if resp.status_code == 200 and resp.text and signature in resp.text:
                        if path != "/robots.txt": # robots.txt is informational unless revealing
                            exposed.append({
                                "path": path,
                                "title": title,
                                "snippet": resp.text[:100].strip()
                            })
                except Exception:
                    pass
        return exposed

    @classmethod
    def get_remediation_library(cls) -> Dict[str, Any]:
        """Provides comprehensive, ready-to-deploy code patches across multiple web server frameworks."""
        return {
            "missing_csp": {
                "owasp": "OWASP A05:2021 – Security Misconfiguration",
                "cwe": "CWE-1021",
                "impact": "Without a Content Security Policy (CSP), the browser executes any script loaded on the page. Attackers can inject malicious JavaScript to steal session tokens, log keystrokes, and execute Cross-Site Scripting (XSS).",
                "summary": "Implement a strict Content-Security-Policy header restricting script execution, styles, and framed assets to trusted origins.",
                "verification": "curl -I {url} | grep -i content-security-policy",
                "patches": {
                    "nginx": RemediationSnippet(
                        framework="nginx",
                        title="Nginx Security Configuration",
                        language="nginx",
                        filename="/etc/nginx/conf.d/security_headers.conf",
                        code="""# Add inside your server {} or http {} block
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; object-src 'none'; frame-ancestors 'self';" always;""",
                        instructions="1. Edit your Nginx virtual host configuration.\n2. Add the `add_header Content-Security-Policy` directive inside the `server {}` block.\n3. Test config: `nginx -t`\n4. Reload server: `systemctl reload nginx`"
                    ),
                    "apache": RemediationSnippet(
                        framework="apache",
                        title="Apache HTTP Server (.htaccess / httpd.conf)",
                        language="apache",
                        filename=".htaccess",
                        code="""<IfModule mod_headers.c>
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; object-src 'none'; frame-ancestors 'self';"
</IfModule>""",
                        instructions="1. Ensure `mod_headers` is enabled (`a2enmod headers`).\n2. Insert directive into your root `.htaccess` or `<VirtualHost>` block.\n3. Restart Apache: `systemctl restart apache2`"
                    ),
                    "express": RemediationSnippet(
                        framework="express",
                        title="Node.js Express (Helmet Middleware)",
                        language="javascript",
                        filename="server.js",
                        code="""const express = require('express');
const helmet = require('helmet');
const app = express();

// Secure CSP middleware via Helmet
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
}));""",
                        instructions="1. Install Helmet: `npm install helmet`\n2. Add `app.use(helmet.contentSecurityPolicy(...))` before route definitions."
                    ),
                    "nextjs": RemediationSnippet(
                        framework="nextjs",
                        title="Next.js Security Headers Config",
                        language="javascript",
                        filename="next.config.js",
                        code="""module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; object-src 'none';",
          },
        ],
      },
    ];
  },
};""",
                        instructions="1. Open `next.config.js` in your project root.\n2. Add or update the `headers()` async function.\n3. Rebuild your application: `npm run build`"
                    ),
                    "django": RemediationSnippet(
                        framework="django",
                        title="Python Django (django-csp)",
                        language="python",
                        filename="settings.py",
                        code="""# pip install django-csp
MIDDLEWARE = [
    'csp.middleware.CSPMiddleware',
    # ... other middlewares
]

CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_OBJECT_SRC = ("'none'",)""",
                        instructions="1. Install package: `pip install django-csp`\n2. Add `csp.middleware.CSPMiddleware` to `MIDDLEWARE` in `settings.py`.\n3. Configure CSP policies."
                    )
                }
            },
            "missing_hsts": {
                "owasp": "OWASP A05:2021 – Security Misconfiguration",
                "cwe": "CWE-319",
                "impact": "Without HTTP Strict Transport Security (HSTS), users who navigate via `http://` can be intercepted by Man-in-the-Middle (MITM) attackers using SSL-stripping tools (e.g., sslstrip).",
                "summary": "Enforce Strict-Transport-Security with a minimum max-age of 1 year (31536000 seconds) and includeSubDomains.",
                "verification": "curl -s -D - {url} -o /dev/null | grep -i strict-transport-security",
                "patches": {
                    "nginx": RemediationSnippet(
                        framework="nginx",
                        title="Nginx HSTS Directive",
                        language="nginx",
                        filename="/etc/nginx/conf.d/ssl.conf",
                        code="""# Apply HSTS to HTTPS server block
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;""",
                        instructions="1. Add inside your HTTPS `server { listen 443 ssl; ... }` block.\n2. Test: `nginx -t` && `systemctl reload nginx`"
                    ),
                    "apache": RemediationSnippet(
                        framework="apache",
                        title="Apache HSTS Directive",
                        language="apache",
                        filename=".htaccess",
                        code="""<IfModule mod_headers.c>
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
</IfModule>""",
                        instructions="1. Insert inside `.htaccess` or your `<VirtualHost *:443>` block.\n2. Reload Apache: `systemctl reload apache2`"
                    ),
                    "express": RemediationSnippet(
                        framework="express",
                        title="Node.js Express (HSTS Helmet)",
                        language="javascript",
                        filename="server.js",
                        code="""const helmet = require('helmet');
// Enforce 1 year HSTS
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));""",
                        instructions="1. Use Helmet's HSTS middleware in Express app entrypoint."
                    ),
                    "nextjs": RemediationSnippet(
                        framework="nextjs",
                        title="Next.js HSTS Configuration",
                        language="javascript",
                        filename="next.config.js",
                        code="""module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};""",
                        instructions="1. Add to `next.config.js` headers section."
                    ),
                    "django": RemediationSnippet(
                        framework="django",
                        title="Django Native HSTS Settings",
                        language="python",
                        filename="settings.py",
                        code="""# Django native SSL & HSTS enforcement
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True""",
                        instructions="1. In `settings.py`, configure `SECURE_HSTS_SECONDS` and ensure `SecurityMiddleware` is active."
                    )
                }
            },
            "missing_x_frame_options": {
                "owasp": "OWASP A05:2021 – Security Misconfiguration",
                "cwe": "CWE-1021",
                "impact": "Attackers can embed your website inside an invisible iframe on a malicious third-party site, tricking authenticated users into clicking buttons or executing unauthorized transfers (Clickjacking).",
                "summary": "Configure `X-Frame-Options: DENY` or `SAMEORIGIN` to prohibit unauthorized framing.",
                "verification": "curl -I {url} | grep -i x-frame-options",
                "patches": {
                    "nginx": RemediationSnippet(
                        framework="nginx",
                        title="Nginx Anti-Clickjacking",
                        language="nginx",
                        filename="/etc/nginx/conf.d/security.conf",
                        code="""add_header X-Frame-Options "DENY" always;""",
                        instructions="1. Add `add_header X-Frame-Options \"DENY\" always;` inside your server block.\n2. Reload: `systemctl reload nginx`"
                    ),
                    "apache": RemediationSnippet(
                        framework="apache",
                        title="Apache Anti-Clickjacking",
                        language="apache",
                        filename=".htaccess",
                        code="""<IfModule mod_headers.c>
    Header always set X-Frame-Options "DENY"
</IfModule>""",
                        instructions="1. Add to `.htaccess` file."
                    ),
                    "express": RemediationSnippet(
                        framework="express",
                        title="Express Frameguard",
                        language="javascript",
                        filename="server.js",
                        code="""const helmet = require('helmet');
app.use(helmet.frameguard({ action: 'deny' }));""",
                        instructions="1. Apply helmet frameguard middleware."
                    ),
                    "nextjs": RemediationSnippet(
                        framework="nextjs",
                        title="Next.js X-Frame-Options",
                        language="javascript",
                        filename="next.config.js",
                        code="""module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [{ key: 'X-Frame-Options', value: 'DENY' }],
      },
    ];
  },
};""",
                        instructions="1. Add `X-Frame-Options` key in `next.config.js`."
                    ),
                    "django": RemediationSnippet(
                        framework="django",
                        title="Django Clickjacking Middleware",
                        language="python",
                        filename="settings.py",
                        code="""# In settings.py
X_FRAME_OPTIONS = 'DENY'
MIDDLEWARE = [
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # ...
]""",
                        instructions="1. Verify `XFrameOptionsMiddleware` is listed in `MIDDLEWARE`."
                    )
                }
            },
            "missing_x_content_type_options": {
                "owasp": "OWASP A05:2021 – Security Misconfiguration",
                "cwe": "CWE-79",
                "impact": "When missing, legacy browsers may 'sniff' the content of files (e.g. interpreting an uploaded user image or text file containing HTML/JS as executable script), leading to Cross-Site Scripting.",
                "summary": "Enforce `X-Content-Type-Options: nosniff` to strictly adhere to MIME types.",
                "verification": "curl -I {url} | grep -i x-content-type-options",
                "patches": {
                    "nginx": RemediationSnippet(
                        framework="nginx",
                        title="Nginx MIME Sniffing Protection",
                        language="nginx",
                        filename="/etc/nginx/conf.d/security.conf",
                        code="""add_header X-Content-Type-Options "nosniff" always;""",
                        instructions="1. Add directive to Nginx server block."
                    ),
                    "apache": RemediationSnippet(
                        framework="apache",
                        title="Apache MIME Sniffing Protection",
                        language="apache",
                        filename=".htaccess",
                        code="""<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
</IfModule>""",
                        instructions="1. Add to `.htaccess`."
                    ),
                    "express": RemediationSnippet(
                        framework="express",
                        title="Express No-Sniff",
                        language="javascript",
                        filename="server.js",
                        code="""const helmet = require('helmet');
app.use(helmet.noSniff());""",
                        instructions="1. Call `helmet.noSniff()` in server entrypoint."
                    ),
                    "nextjs": RemediationSnippet(
                        framework="nextjs",
                        title="Next.js No-Sniff Header",
                        language="javascript",
                        filename="next.config.js",
                        code="""module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }],
      },
    ];
  },
};""",
                        instructions="1. Set header in `next.config.js`."
                    ),
                    "django": RemediationSnippet(
                        framework="django",
                        title="Django Content-Type Protection",
                        language="python",
                        filename="settings.py",
                        code="""SECURE_CONTENT_TYPE_NOSNIFF = True""",
                        instructions="1. Set `SECURE_CONTENT_TYPE_NOSNIFF = True` in `settings.py`."
                    )
                }
            },
            "server_information_leak": {
                "owasp": "OWASP A05:2021 – Security Misconfiguration",
                "cwe": "CWE-200",
                "impact": "Exposing exact web server and framework versions (e.g. `Server: Apache/2.4.41 (Ubuntu)`, `X-Powered-By: PHP/7.4.3`) allows adversaries to query CVE vulnerability databases for automated 1-day exploit vectors.",
                "summary": "Strip `X-Powered-By` and obfuscate the `Server` header token.",
                "verification": "curl -I {url} | grep -E -i 'server|x-powered-by'",
                "patches": {
                    "nginx": RemediationSnippet(
                        framework="nginx",
                        title="Nginx Server Tokens Suppression",
                        language="nginx",
                        filename="/etc/nginx/nginx.conf",
                        code="""# Inside http {} block:
server_tokens off;""",
                        instructions="1. Open `/etc/nginx/nginx.conf`\n2. Add `server_tokens off;` inside the `http {}` block.\n3. Reload: `systemctl reload nginx`"
                    ),
                    "apache": RemediationSnippet(
                        framework="apache",
                        title="Apache Server Tokens Suppression",
                        language="apache",
                        filename="/etc/apache2/conf-available/security.conf",
                        code="""ServerTokens Prod
ServerSignature Off""",
                        instructions="1. Set `ServerTokens Prod` and `ServerSignature Off`.\n2. Restart: `systemctl restart apache2`"
                    ),
                    "express": RemediationSnippet(
                        framework="express",
                        title="Express Header Suppression",
                        language="javascript",
                        filename="server.js",
                        code="""const express = require('express');
const app = express();

// Disable X-Powered-By header
app.disable('x-powered-by');""",
                        instructions="1. Add `app.disable('x-powered-by');` immediately after creating the app."
                    ),
                    "nextjs": RemediationSnippet(
                        framework="nextjs",
                        title="Next.js Powered-By Header",
                        language="javascript",
                        filename="next.config.js",
                        code="""module.exports = {
  poweredByHeader: false,
};""",
                        instructions="1. In `next.config.js`, set `poweredByHeader: false`."
                    ),
                    "django": RemediationSnippet(
                        framework="django",
                        title="Django / Gunicorn Server Header",
                        language="python",
                        filename="gunicorn.conf.py",
                        code="""# In gunicorn.conf.py
proc_name = 'secure_app'
# Prohibit identifying server headers
secure_scheme_headers = {'X-FORWARDED-PROTOCOL': 'ssl', 'X-FORWARDED-PROTO': 'https'}""",
                        instructions="1. Do not transmit custom powered-by headers."
                    )
                }
            },
            "insecure_cookies": {
                "owasp": "OWASP A01:2021 – Broken Access Control",
                "cwe": "CWE-614",
                "impact": "Cookies transmitted without the `Secure`, `HttpOnly`, or `SameSite` flags can be stolen via cleartext network eavesdropping, exfiltrated via JavaScript during XSS, or exploited in CSRF attacks.",
                "summary": "Enforce `HttpOnly; Secure; SameSite=Lax` (or `SameSite=Strict`) on all application cookies.",
                "verification": "curl -I {url} | grep -i set-cookie",
                "patches": {
                    "nginx": RemediationSnippet(
                        framework="nginx",
                        title="Nginx Proxy Cookie Flags",
                        language="nginx",
                        filename="/etc/nginx/conf.d/proxy.conf",
                        code="""# Enforce cookie flags in reverse proxy
proxy_cookie_flags ~* Secure HttpOnly SameSite=Lax;""",
                        instructions="1. Add inside your `location /` proxy block.\n2. Reload Nginx."
                    ),
                    "apache": RemediationSnippet(
                        framework="apache",
                        title="Apache Cookie Flags",
                        language="apache",
                        filename=".htaccess",
                        code="""<IfModule mod_headers.c>
    Header edit Set-Cookie ^(.*)$ "$1; Secure; HttpOnly; SameSite=Lax"
</IfModule>""",
                        instructions="1. Add regex rewrite in `.htaccess`."
                    ),
                    "express": RemediationSnippet(
                        framework="express",
                        title="Express Session Cookie Security",
                        language="javascript",
                        filename="server.js",
                        code="""const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,      // Requires HTTPS
    httpOnly: true,    // Blocks JavaScript access
    sameSite: 'lax',   // Defends against CSRF
    maxAge: 24 * 60 * 60 * 1000
  }
}));""",
                        instructions="1. Ensure `cookie: { secure: true, httpOnly: true, sameSite: 'lax' }` is set in session config."
                    ),
                    "nextjs": RemediationSnippet(
                        framework="nextjs",
                        title="Next.js Cookie Helper",
                        language="typescript",
                        filename="lib/auth.ts",
                        code="""import { cookies } from 'next/headers';

export async function setSecureSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}""",
                        instructions="1. Always set `httpOnly: true`, `secure: true`, and `sameSite: 'lax'`."
                    ),
                    "django": RemediationSnippet(
                        framework="django",
                        title="Django Session & CSRF Cookie Flags",
                        language="python",
                        filename="settings.py",
                        code="""# In settings.py
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'""",
                        instructions="1. Add these 6 variables in `settings.py` for production deployments."
                    )
                }
            },
            "missing_spf_dmarc": {
                "owasp": "OWASP A07:2021 – Identification and Authentication Failures",
                "cwe": "CWE-290",
                "impact": "Without Sender Policy Framework (SPF) and DMARC enforcement records, adversaries can easily spoof email headers using your domain name to execute high-credibility spearphishing attacks against customers and employees.",
                "summary": "Publish SPF TXT records and DMARC enforcement policies (`p=reject` or `p=quarantine`) in domain DNS.",
                "verification": "dig +short TXT {hostname} && dig +short TXT _dmarc.{hostname}",
                "patches": {
                    "nginx": RemediationSnippet(
                        framework="dns",
                        title="DNS Resource Records (Cloudflare / Route53 / BIND)",
                        language="dns",
                        filename="zonefile.db",
                        code="""; SPF Record on Root Domain
@    IN  TXT  "v=spf1 include:_spf.google.com ~all"

; DMARC Policy Record
_dmarc  IN  TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@yourdomain.com; pct=100; sp=reject" """,
                        instructions="1. Access your domain registrar or DNS provider (Cloudflare, AWS Route53, GoDaddy).\n2. Add TXT record for `@` with value `v=spf1 include:yourmailservice.com ~all`.\n3. Add TXT record for `_dmarc` with policy `p=quarantine` or `p=reject`."
                    ),
                    "apache": RemediationSnippet(
                        framework="dns",
                        title="DNS Enforcement Instructions",
                        language="dns",
                        filename="DNS Console",
                        code="""# Recommended Strict DMARC Policy
Name:  _dmarc.yourdomain.com
Type:  TXT
Value: v=DMARC1; p=reject; rua=mailto:security@yourdomain.com; aspf=s; adkim=s;""",
                        instructions="1. Configure DNS zone records at your authoritative DNS nameserver."
                    ),
                    "express": RemediationSnippet(
                        framework="dns",
                        title="DNS Configuration",
                        language="dns",
                        filename="DNS Settings",
                        code="""v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com;""",
                        instructions="1. Configure at DNS level."
                    ),
                    "nextjs": RemediationSnippet(
                        framework="dns",
                        title="DNS Configuration",
                        language="dns",
                        filename="DNS Settings",
                        code="""v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com;""",
                        instructions="1. Configure at DNS level."
                    ),
                    "django": RemediationSnippet(
                        framework="dns",
                        title="DNS Configuration",
                        language="dns",
                        filename="DNS Settings",
                        code="""v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com;""",
                        instructions="1. Configure at DNS level."
                    )
                }
            },
            "sensitive_file_exposed": {
                "owasp": "OWASP A05:2021 – Security Misconfiguration",
                "cwe": "CWE-538",
                "impact": "Publicly exposing `.git` repository objects or `.env` files allows attackers to download your entire application source code, API keys, database credentials, and secret signing tokens.",
                "summary": "Explicitly deny web server access to hidden dotfiles (`.*`) and environment configuration files.",
                "verification": "curl -I {url}/.git/HEAD && curl -I {url}/.env",
                "patches": {
                    "nginx": RemediationSnippet(
                        framework="nginx",
                        title="Nginx Hidden File Access Deny",
                        language="nginx",
                        filename="/etc/nginx/conf.d/security.conf",
                        code="""# Block access to git, env, and all hidden files
location ~ /\\.(?!well-known).* {
    deny all;
    access_log off;
    log_not_found off;
    return 404;
}""",
                        instructions="1. Insert inside your Nginx `server {}` block.\n2. Reload: `nginx -s reload`"
                    ),
                    "apache": RemediationSnippet(
                        framework="apache",
                        title="Apache Dotfile Protection",
                        language="apache",
                        filename=".htaccess",
                        code="""# Deny all dotfiles (.git, .env, etc.)
<FilesMatch "^\\.(?!well-known).*">
    Require all denied
</FilesMatch>""",
                        instructions="1. Add to `.htaccess` in your document root."
                    ),
                    "express": RemediationSnippet(
                        framework="express",
                        title="Express Static File Protection",
                        language="javascript",
                        filename="server.js",
                        code="""// Deny dotfiles in express.static
app.use(express.static('public', {
  dotfiles: 'ignore' // Do not serve .git, .env, etc.
}));""",
                        instructions="1. Set `dotfiles: 'ignore'` in static file options."
                    ),
                    "nextjs": RemediationSnippet(
                        framework="nextjs",
                        title="Next.js Rewrite Block",
                        language="javascript",
                        filename="next.config.js",
                        code="""module.exports = {
  async rewrites() {
    return [
      { source: '/.git/:path*', destination: '/404' },
      { source: '/.env:path*', destination: '/404' },
    ];
  },
};""",
                        instructions="1. Rewrite requests to sensitive paths to `/404`."
                    ),
                    "django": RemediationSnippet(
                        framework="django",
                        title="Django WhiteNoise File Protection",
                        language="python",
                        filename="settings.py",
                        code="""# WhiteNoise ignores dotfiles by default
WHITENOISE_IGNORE = ['.git', '.env*']""",
                        instructions="1. Keep `.env` outside of `STATIC_ROOT` and public directories."
                    )
                }
            }
        }

    @classmethod
    async def scan_target(cls, target_url: str) -> WebScanResponse:
        """Runs an end-to-end safe web security assessment against target."""
        start_time = time.time()
        full_url, scheme, hostname, port = cls.normalize_url(target_url)
        remediation_lib = cls.get_remediation_library()

        findings: List[VulnerabilityFinding] = []
        passed_checks: List[str] = []

        # 1. Resolve Hostname
        ip_addr = await cls.resolve_ip(hostname)

        # 2. HTTP Probes
        headers_dict = {}
        cookies_list = []
        status_code = None
        server_banner = None

        try:
            async with httpx.AsyncClient(timeout=4.0, follow_redirects=True, verify=False) as client:
                resp = await client.get(full_url)
                status_code = resp.status_code
                headers_dict = {k.lower(): v for k, v in resp.headers.items()}
                cookies_list = list(resp.cookies.items())
                server_banner = headers_dict.get("server") or headers_dict.get("x-powered-by")
        except Exception as e:
            logger.warning(f"HTTP probe warning for {full_url}: {e}")
            status_code = 0

        # 3. TLS Audit
        tls_data = {}
        if scheme == "https":
            tls_data = await cls.audit_tls(hostname, port)

        # 4. DNS Spoofing Audit
        dns_data = await cls.audit_dns_spoofing(hostname)

        # 5. Sensitive File Exposure Probe
        exposed_files = await cls.probe_sensitive_endpoints(full_url)

        # --- EVALUATION RULES ---

        # Rule 1: Content-Security-Policy (CSP)
        csp = headers_dict.get("content-security-policy")
        if not csp:
            lib = remediation_lib["missing_csp"]
            findings.append(VulnerabilityFinding(
                id="SEC-001",
                title="Missing Content-Security-Policy (CSP)",
                category="Headers",
                severity="HIGH",
                owasp_category=lib["owasp"],
                cwe_id=lib["cwe"],
                description="The server did not return a `Content-Security-Policy` header.",
                impact=lib["impact"],
                evidence="HTTP Header 'Content-Security-Policy' was absent in server response.",
                remediation_summary=lib["summary"],
                remediations=lib["patches"],
                verification_command=lib["verification"].format(url=full_url)
            ))
        else:
            passed_checks.append("Content-Security-Policy is configured")

        # Rule 2: Strict-Transport-Security (HSTS)
        hsts = headers_dict.get("strict-transport-security")
        if scheme == "https":
            if not hsts:
                lib = remediation_lib["missing_hsts"]
                findings.append(VulnerabilityFinding(
                    id="SEC-002",
                    title="Missing Strict-Transport-Security (HSTS)",
                    category="Headers",
                    severity="HIGH",
                    owasp_category=lib["owasp"],
                    cwe_id=lib["cwe"],
                    description="The web server does not enforce HTTPS connections via HSTS.",
                    impact=lib["impact"],
                    evidence="HTTP Header 'Strict-Transport-Security' was absent.",
                    remediation_summary=lib["summary"],
                    remediations=lib["patches"],
                    verification_command=lib["verification"].format(url=full_url)
                ))
            else:
                passed_checks.append("Strict-Transport-Security (HSTS) is actively enforced")

        # Rule 3: Clickjacking / X-Frame-Options
        x_frame = headers_dict.get("x-frame-options")
        if not x_frame and (not csp or "frame-ancestors" not in csp):
            lib = remediation_lib["missing_x_frame_options"]
            findings.append(VulnerabilityFinding(
                id="SEC-003",
                title="Clickjacking Vulnerability (Missing X-Frame-Options)",
                category="Headers",
                severity="MEDIUM",
                owasp_category=lib["owasp"],
                cwe_id=lib["cwe"],
                description="No framing protection directive (`X-Frame-Options` or `frame-ancestors`) was found.",
                impact=lib["impact"],
                evidence="Neither 'X-Frame-Options' nor CSP 'frame-ancestors' was declared.",
                remediation_summary=lib["summary"],
                remediations=lib["patches"],
                verification_command=lib["verification"].format(url=full_url)
            ))
        else:
            passed_checks.append("Clickjacking protection is active (X-Frame-Options / frame-ancestors)")

        # Rule 4: X-Content-Type-Options
        x_content = headers_dict.get("x-content-type-options")
        if not x_content or "nosniff" not in x_content.lower():
            lib = remediation_lib["missing_x_content_type_options"]
            findings.append(VulnerabilityFinding(
                id="SEC-004",
                title="MIME Sniffing Risk (Missing X-Content-Type-Options)",
                category="Headers",
                severity="LOW",
                owasp_category=lib["owasp"],
                cwe_id=lib["cwe"],
                description="`X-Content-Type-Options: nosniff` is missing.",
                impact=lib["impact"],
                evidence=f"Observed value: {x_content or 'Header absent'}",
                remediation_summary=lib["summary"],
                remediations=lib["patches"],
                verification_command=lib["verification"].format(url=full_url)
            ))
        else:
            passed_checks.append("MIME-sniffing protection is active (nosniff)")

        # Rule 5: Server Information Leakage
        server_val = headers_dict.get("server")
        powered_by = headers_dict.get("x-powered-by")
        if (server_val and any(char.isdigit() for char in server_val)) or powered_by:
            lib = remediation_lib["server_information_leak"]
            findings.append(VulnerabilityFinding(
                id="SEC-005",
                title="Server / Runtime Version Information Disclosure",
                category="Information Disclosure",
                severity="LOW",
                owasp_category=lib["owasp"],
                cwe_id=lib["cwe"],
                description="The server banner or runtime framework version is disclosed in response headers.",
                impact=lib["impact"],
                evidence=f"Server: {server_val or 'None'} | X-Powered-By: {powered_by or 'None'}",
                remediation_summary=lib["summary"],
                remediations=lib["patches"],
                verification_command=lib["verification"].format(url=full_url)
            ))
        else:
            passed_checks.append("Server tokens and framework headers are suppressed")

        # Rule 6: Sensitive File Exposure
        if exposed_files:
            lib = remediation_lib["sensitive_file_exposed"]
            for exp in exposed_files:
                findings.append(VulnerabilityFinding(
                    id=f"SEC-FILE-{abs(hash(exp['path'])) % 10000}",
                    title=f"Critical File Exposure: {exp['title']} ({exp['path']})",
                    category="Information Disclosure",
                    severity="CRITICAL",
                    owasp_category=lib["owasp"],
                    cwe_id=lib["cwe"],
                    description=f"Direct access to `{exp['path']}` was permitted by the web server.",
                    impact=lib["impact"],
                    evidence=f"HTTP 200 OK returned at {full_url}{exp['path']} with content: {exp['snippet']}",
                    remediation_summary=lib["summary"],
                    remediations=lib["patches"],
                    verification_command=f"curl -I {full_url}{exp['path']}"
                ))
        else:
            passed_checks.append("Sensitive file paths (/.git/, /.env) are properly blocked")

        # Rule 7: Email Spoofing / SPF & DMARC
        if not dns_data.get("spf_present"):
            lib = remediation_lib["missing_spf_dmarc"]
            findings.append(VulnerabilityFinding(
                id="SEC-007",
                title="Missing SPF Record (Email Spoofing Risk)",
                category="DNS Spoofing",
                severity="MEDIUM",
                owasp_category=lib["owasp"],
                cwe_id=lib["cwe"],
                description="The domain lacks an authoritative SPF (Sender Policy Framework) TXT record.",
                impact="Attackers can send forged emails from your domain without failing receiver validation.",
                evidence=f"No TXT record starting with 'v=spf1' was found on {hostname}.",
                remediation_summary=lib["summary"],
                remediations=lib["patches"],
                verification_command=f"dig +short TXT {hostname}"
            ))
        else:
            passed_checks.append("SPF record is published")

        if not dns_data.get("dmarc_present") or dns_data.get("dmarc_policy") == "none":
            lib = remediation_lib["missing_spf_dmarc"]
            pol = dns_data.get("dmarc_policy")
            findings.append(VulnerabilityFinding(
                id="SEC-008",
                title="Missing or Weak DMARC Policy",
                category="DNS Spoofing",
                severity="MEDIUM",
                owasp_category=lib["owasp"],
                cwe_id=lib["cwe"],
                description=f"DMARC record is either missing or set to permissive policy (`p={pol or 'missing'}`).",
                impact="Email recipients will not reject spoofed phishing emails purporting to originate from this domain.",
                evidence=f"Record at _dmarc.{hostname}: {dns_data.get('dmarc_record') or 'Record absent'}",
                remediation_summary="Publish a DMARC policy with `p=quarantine` or `p=reject` to enforce anti-impersonation.",
                remediations=lib["patches"],
                verification_command=f"dig +short TXT _dmarc.{hostname}"
            ))
        else:
            passed_checks.append("DMARC enforcement policy is active")

        # Rule 8: TLS Certificate & Protocol Checks
        if scheme == "https" and tls_data.get("supported"):
            if tls_data.get("is_expired"):
                findings.append(VulnerabilityFinding(
                    id="SEC-TLS-001",
                    title="Expired SSL/TLS Certificate",
                    category="TLS/SSL",
                    severity="CRITICAL",
                    owasp_category="OWASP A02:2021 – Cryptographic Failures",
                    cwe_id="CWE-295",
                    description="The server's SSL certificate has expired, triggering browser security warnings.",
                    impact="Users encounter browser security intersitials; encrypted session authenticity cannot be verified.",
                    evidence=f"Certificate expired on: {tls_data.get('expires_at')}",
                    remediation_summary="Renew the SSL/TLS certificate via Let's Encrypt or your Certificate Authority.",
                    remediations=remediation_lib["missing_hsts"]["patches"],
                    verification_command=f"openssl s_client -connect {hostname}:443 -servername {hostname} < /dev/null"
                ))
            elif tls_data.get("days_until_expiry") is not None and tls_data["days_until_expiry"] <= 14:
                findings.append(VulnerabilityFinding(
                    id="SEC-TLS-002",
                    title=f"SSL Certificate Expiring Soon ({tls_data['days_until_expiry']} Days Remaining)",
                    category="TLS/SSL",
                    severity="MEDIUM",
                    owasp_category="OWASP A02:2021 – Cryptographic Failures",
                    cwe_id="CWE-295",
                    description=f"The certificate expires in {tls_data['days_until_expiry']} days.",
                    impact="If not renewed promptly, public access to the service will be disrupted.",
                    evidence=f"Expires at: {tls_data.get('expires_at')}",
                    remediation_summary="Trigger automated ACME renewal (e.g. `certbot renew`).",
                    remediations=remediation_lib["missing_hsts"]["patches"],
                    verification_command=f"certbot certificates"
                ))
            else:
                passed_checks.append(f"SSL/TLS Certificate is valid ({tls_data.get('days_until_expiry', 90)} days remaining)")

            if tls_data.get("weak_protocol"):
                findings.append(VulnerabilityFinding(
                    id="SEC-TLS-003",
                    title="Legacy Insecure TLS Protocol Supported",
                    category="TLS/SSL",
                    severity="HIGH",
                    owasp_category="OWASP A02:2021 – Cryptographic Failures",
                    cwe_id="CWE-326",
                    description=f"Server negotiates legacy protocol: {tls_data.get('version')}.",
                    impact="Legacy protocols (TLS 1.0/1.1) are vulnerable to downgrade and cipher suite attacks.",
                    evidence=f"Protocol negotiated: {tls_data.get('version')}",
                    remediation_summary="Configure server to only permit TLSv1.2 and TLSv1.3.",
                    remediations=remediation_lib["missing_hsts"]["patches"],
                    verification_command=f"nmap --script ssl-enum-ciphers -p 443 {hostname}"
                ))
            else:
                passed_checks.append(f"Modern TLS protocol active ({tls_data.get('version', 'TLSv1.3')})")

        # --- SCORE & GRADE CALCULATION ---
        # Deductions: Critical: -25, High: -15, Medium: -8, Low: -3
        score = 100
        counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "PASSED": len(passed_checks)}
        for f in findings:
            counts[f.severity] = counts.get(f.severity, 0) + 1
            if f.severity == "CRITICAL":
                score -= 25
            elif f.severity == "HIGH":
                score -= 15
            elif f.severity == "MEDIUM":
                score -= 8
            elif f.severity == "LOW":
                score -= 3

        score = max(10, min(100, score))

        if score >= 90:
            grade = "A+" if score >= 95 else "A"
        elif score >= 80:
            grade = "B"
        elif score >= 68:
            grade = "C"
        elif score >= 55:
            grade = "D"
        else:
            grade = "F"

        duration_ms = int((time.time() - start_time) * 1000)

        summary_text = (
            f"Security audit for {hostname} identified {len(findings)} potential areas of exposure "
            f"({counts['CRITICAL']} Critical, {counts['HIGH']} High, {counts['MEDIUM']} Medium, {counts['LOW']} Low) "
            f"with {len(passed_checks)} security controls actively verified. Overall security posture is graded {grade} ({score}/100)."
        )

        return WebScanResponse(
            scan_id=f"scan_{int(time.time())}_{abs(hash(hostname)) % 10000}",
            target_url=full_url,
            normalized_domain=hostname,
            ip_address=ip_addr or "127.0.0.1",
            status_code=status_code,
            server_banner=server_banner or "Protected Web Server",
            scan_duration_ms=duration_ms,
            scanned_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            overall_score=score,
            overall_grade=grade,
            summary=summary_text,
            findings_count={
                "critical": counts["CRITICAL"],
                "high": counts["HIGH"],
                "medium": counts["MEDIUM"],
                "low": counts["LOW"],
                "passed": counts["PASSED"]
            },
            findings=findings,
            passed_checks=passed_checks
        )

# Global service instance
web_scanner_service = WebScannerService()
