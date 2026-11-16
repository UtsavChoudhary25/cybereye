from typing import Dict, Any, List
from app.collectors.base import BaseCollector

class VulnerabilityCollector(BaseCollector):
    def __init__(self):
        super().__init__(name="VulnerabilityCollector", category="vuln")

    async def collect(self, target: str, is_active_authorized: bool = False) -> Dict[str, Any]:
        target = target.strip().lower()
        is_demo = True
        source = "NVD / Public CVE Advisory Repository (Demo Mode)"

        disclaimer = "Potentially relevant vulnerability — verification required. Mere existence of a CVE does not confirm active exploitability."

        vulnerabilities: List[Dict[str, Any]] = []

        if "acme" in target or "nginx" in target:
            vulnerabilities = [
                {
                    "cve_id": "CVE-2024-24919",
                    "title": "Nginx / Gateway Information Disclosure Flaw",
                    "description": "An improper input validation flaw allows potential arbitrary file reading under specific non-default legacy proxy configs.",
                    "severity": "CRITICAL",
                    "cvss": 9.8,
                    "published_date": "2024-05-28",
                    "affected_technology": "nginx <= 1.24.0 / Proxy Gateway",
                    "reference": "https://nvd.nist.gov/vuln/detail/CVE-2024-24919",
                    "status": "UNVERIFIED_HEURISTIC"
                },
                {
                    "cve_id": "CVE-2023-44487",
                    "title": "HTTP/2 Rapid Reset Denial of Service",
                    "description": "The HTTP/2 protocol stream cancellation race condition allows attackers to generate sustained denial of service loads.",
                    "severity": "HIGH",
                    "cvss": 7.5,
                    "published_date": "2023-10-10",
                    "affected_technology": "HTTP/2 Web Services",
                    "reference": "https://nvd.nist.gov/vuln/detail/CVE-2023-44487",
                    "status": "UNVERIFIED_HEURISTIC"
                },
                {
                    "cve_id": "CVE-2024-38475",
                    "title": "ModSecurity / Apache Filter Bypass",
                    "description": "Improper escaping in specific WAF rule sets allows evasion of inspection filters.",
                    "severity": "MEDIUM",
                    "cvss": 6.3,
                    "published_date": "2024-06-18",
                    "affected_technology": "ModSecurity 3.0",
                    "reference": "https://nvd.nist.gov/vuln/detail/CVE-2024-38475",
                    "status": "UNVERIFIED_HEURISTIC"
                }
            ]
        elif "fintech" in target:
            vulnerabilities = [
                {
                    "cve_id": "CVE-2024-22243",
                    "title": "Spring Framework URL Parsing SSRF Flaw",
                    "description": "UriComponentsBuilder in Spring Framework allows open redirection or server-side request forgery (SSRF) when host extraction fails.",
                    "severity": "HIGH",
                    "cvss": 8.1,
                    "published_date": "2024-02-22",
                    "affected_technology": "Spring Boot 3.2.0",
                    "reference": "https://nvd.nist.gov/vuln/detail/CVE-2024-22243",
                    "status": "UNVERIFIED_HEURISTIC"
                }
            ]
        else:
            vulnerabilities = [
                {
                    "cve_id": "CVE-2023-3824",
                    "title": "PHP Buffer Overflow in phar_dir_read",
                    "description": "A buffer overflow in PHP core when processing corrupted PHAR directory entries.",
                    "severity": "HIGH",
                    "cvss": 8.2,
                    "published_date": "2023-08-11",
                    "affected_technology": "PHP <= 8.1.20",
                    "reference": "https://nvd.nist.gov/vuln/detail/CVE-2023-3824",
                    "status": "UNVERIFIED_HEURISTIC"
                },
                {
                    "cve_id": "CVE-2023-25690",
                    "title": "Apache HTTP Server mod_proxy Request Splitting",
                    "description": "Some mod_proxy configurations allow HTTP request splitting via specially crafted Control-Chars in request line.",
                    "severity": "HIGH",
                    "cvss": 7.8,
                    "published_date": "2023-03-07",
                    "affected_technology": "Apache 2.4.52",
                    "reference": "https://nvd.nist.gov/vuln/detail/CVE-2023-25690",
                    "status": "UNVERIFIED_HEURISTIC"
                }
            ]

        return self.format_result(
            data={
                "vulnerabilities": vulnerabilities,
                "count": len(vulnerabilities),
                "disclaimer": disclaimer,
                "counts_by_severity": {
                    "CRITICAL": sum(1 for v in vulnerabilities if v["severity"] == "CRITICAL"),
                    "HIGH": sum(1 for v in vulnerabilities if v["severity"] == "HIGH"),
                    "MEDIUM": sum(1 for v in vulnerabilities if v["severity"] == "MEDIUM"),
                    "LOW": sum(1 for v in vulnerabilities if v["severity"] == "LOW")
                }
            },
            is_demo=is_demo,
            source=source
        )
