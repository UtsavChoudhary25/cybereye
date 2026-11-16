# CYBEREYE Defensive Security & Ethical Boundaries

**CYBEREYE** is engineered explicitly for educational and defensive cybersecurity situational awareness. 

---

## 1. Ethical & Legal Policies

1. **No Weaponization**: CyberEye strictly contains zero automated exploit payloads, zero denial of service flooding engines, zero persistence implants, and zero credential theft modules.
2. **Passive by Default**: The intelligence collection engine utilizes exclusively public, standard, non-intrusive protocols:
   - DNS record queries (RFC 1035 / DoH RFC 8484)
   - BGP routing and Autonomous System registry queries (RDAP / WHOIS)
   - Public TLS certificate transparency logs (RFC 6962)
   - Standard HTTP HEAD request observation of publicly served headers
3. **Mandatory Authorization Barrier**: For any active defensive testing (such as HTTP header observation or TLS cipher verification), the user is required to confirm an explicit authorization statement:
   > *"I confirm I own or have explicit authorization to assess this target system."*
4. **Vulnerability Verification Guardrail**: CyberEye never asserts that a target is compromised merely because an associated CVE exists in public databases. All findings are labeled:
   > *"Potentially relevant vulnerability — verification required."*
5. **Private Systems Inviolability**: No attempt is ever made to access private CCTV networks, unauthenticated internal administrative cameras, or non-public intranet resources.

---

## 2. Platform Security Architecture

- **No Secrets in Frontend**: API keys (e.g. Gemini AI, NVD, Shodan) are managed exclusively in backend environment variables (`.env`) and never exposed over client network requests.
- **Input Sanitization**: Strict Pydantic v2 validation ensures targets are sanitized against command injection or path traversal before being queried.
- **Rate Limiting & Timeouts**: All outbound collector requests enforce strict connection and read timeouts (3.0s default) to prevent resource exhaustion.
- **Graceful Fallbacks**: If external third-party APIs fail or are unreachable, CyberEye automatically degrades to realistic synthetic demo fixtures without crashing or revealing stack traces.
