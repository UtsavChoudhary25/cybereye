import httpx
from typing import Dict, Any, List
from app.collectors.base import BaseCollector

class TechnologyCollector(BaseCollector):
    def __init__(self):
        super().__init__(name="TechnologyCollector", category="tech")

    async def collect(self, target: str, is_active_authorized: bool = False) -> Dict[str, Any]:
        target = target.strip().lower()
        if target.startswith("http://") or target.startswith("https://"):
            from urllib.parse import urlparse
            target = urlparse(target).netloc or target
        target = target.split(":")[0]

        is_demo = True
        source = "CyberEye HTTP/Header Observer"
        tech_data: Dict[str, Any] = {}

        # Safe passive header observation attempt
        try:
            url = f"https://{target}"
            async with httpx.AsyncClient(timeout=3.0, follow_redirects=True, verify=False) as client:
                resp = await client.head(url)
                if resp.status_code == 200 or resp.status_code < 500:
                    headers = {k.lower(): v for k, v in resp.headers.items()}
                    is_demo = False

                    # Detect server and CDN
                    server = headers.get("server", "Protected")
                    x_powered_by = headers.get("x-powered-by", "")
                    
                    technologies = []
                    if server:
                        technologies.append(f"Server: {server}")
                    if x_powered_by:
                        technologies.append(f"Engine: {x_powered_by}")
                    if "cloudflare" in server.lower() or "cf-ray" in headers:
                        technologies.append("CDN: Cloudflare")
                    if "akamai" in server.lower():
                        technologies.append("CDN: Akamai")

                    # Analyze security headers
                    sec_headers = {
                        "strict_transport_security": "strict-transport-security" in headers,
                        "content_security_policy": "content-security-policy" in headers,
                        "x_frame_options": "x-frame-options" in headers,
                        "x_content_type_options": "x-content-type-options" in headers,
                        "referrer_policy": "referrer-policy" in headers,
                        "permissions_policy": "permissions-policy" in headers
                    }

                    missing_sec = [k for k, present in sec_headers.items() if not present]
                    grade = "A" if len(missing_sec) <= 1 else ("B" if len(missing_sec) <= 2 else ("C" if len(missing_sec) <= 4 else "F"))

                    tech_data = {
                        "server": server,
                        "technologies": technologies or ["Standard Web Architecture"],
                        "security_headers": sec_headers,
                        "missing_security_headers": missing_sec,
                        "security_header_grade": grade,
                        "http_status": resp.status_code,
                        "raw_headers_sample": {k: v for k, v in list(headers.items())[:8]}
                    }
        except Exception:
            pass

        if is_demo:
            source = "CyberEye Demonstration Intelligence Data"
            if "acme" in target:
                tech_data = {
                    "server": "nginx/1.24.0 (Ubuntu)",
                    "technologies": [
                        "Server: nginx 1.24.0",
                        "WAF: ModSecurity v3",
                        "Framework: FastAPI / Python 3.12",
                        "Frontend: React 19",
                        "SSL: OpenSSL 3.0.13"
                    ],
                    "security_headers": {
                        "strict_transport_security": True,
                        "content_security_policy": False,
                        "x_frame_options": True,
                        "x_content_type_options": True,
                        "referrer_policy": True,
                        "permissions_policy": False
                    },
                    "missing_security_headers": ["content_security_policy", "permissions_policy"],
                    "security_header_grade": "B+",
                    "http_status": 200,
                    "raw_headers_sample": {
                        "server": "nginx/1.24.0 (Ubuntu)",
                        "strict-transport-security": "max-age=31536000; includeSubDomains",
                        "x-frame-options": "SAMEORIGIN",
                        "x-content-type-options": "nosniff",
                        "referrer-policy": "strict-origin-when-cross-origin"
                    }
                }
            elif "fintech" in target:
                tech_data = {
                    "server": "cloudflare",
                    "technologies": [
                        "CDN: Cloudflare Enterprise",
                        "WAF: Cloudflare WAF",
                        "Framework: Spring Boot 3.2",
                        "Cache: Redis 7.2"
                    ],
                    "security_headers": {
                        "strict_transport_security": True,
                        "content_security_policy": True,
                        "x_frame_options": True,
                        "x_content_type_options": True,
                        "referrer_policy": True,
                        "permissions_policy": True
                    },
                    "missing_security_headers": [],
                    "security_header_grade": "A+",
                    "http_status": 200,
                    "raw_headers_sample": {
                        "server": "cloudflare",
                        "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
                        "content-security-policy": "default-src 'self'",
                        "x-frame-options": "DENY"
                    }
                }
            else:
                tech_data = {
                    "server": "Apache/2.4.52 (Unix)",
                    "technologies": [
                        "Server: Apache 2.4.52",
                        "Language: PHP 8.1.2",
                        "TLS: OpenSSL 1.1.1"
                    ],
                    "security_headers": {
                        "strict_transport_security": False,
                        "content_security_policy": False,
                        "x_frame_options": True,
                        "x_content_type_options": False,
                        "referrer_policy": False,
                        "permissions_policy": False
                    },
                    "missing_security_headers": ["strict_transport_security", "content_security_policy", "x_content_type_options", "referrer_policy", "permissions_policy"],
                    "security_header_grade": "D",
                    "http_status": 200,
                    "raw_headers_sample": {
                        "server": "Apache/2.4.52 (Unix)",
                        "x-frame-options": "SAMEORIGIN"
                    }
                }

        return self.format_result(
            data=tech_data,
            is_demo=is_demo,
            source=source
        )
