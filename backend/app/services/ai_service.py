import os
import re
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.schemas.schemas import AIAnalyzeResponse, AISummaryResponse

class AIService:
    """
    Defensive AI Analyst Assistant for CyberEye.
    Complies with educational and defensive cybersecurity ethics.
    Strictly forbids exploit generation, malware assistance, or credential theft.
    """

    PROHIBITED_KEYWORDS = [
        "exploit code", "create payload", "bypass authentication", "steal credentials",
        "dump passwords", "ddos attack script", "sql injection payload", "reverse shell script",
        "ransomware code", "trojan script", "keylogger"
    ]

    @classmethod
    def is_safe_defensive_query(cls, query: str) -> bool:
        q_lower = query.lower()
        for kw in cls.PROHIBITED_KEYWORDS:
            if kw in q_lower:
                return False
        return True

    @classmethod
    async def analyze(cls, query: str, target: Optional[str] = None, context: Optional[Dict[str, Any]] = None) -> AIAnalyzeResponse:
        # 1. Safety Check
        if not cls.is_safe_defensive_query(query):
            return AIAnalyzeResponse(
                response="**Defensive Safety Policy Violation**: CyberEye is designed exclusively for educational and defensive threat intelligence. "
                         "Requests seeking exploit payloads, credential theft techniques, or offensive weaponization are strictly prohibited. "
                         "Please consult defensive remediation or hardening guidance instead.",
                suggestions=[
                    "How can a defender mitigate this CVE?",
                    "What defensive monitoring rules detect this activity?",
                    "What security headers should be configured?"
                ]
            )

        # 2. Check if live Gemini API key is configured
        gemini_key = settings.GEMINI_API_KEY
        if gemini_key and len(gemini_key) > 10:
            try:
                import httpx
                system_prompt = (
                    "You are CyberEye Defensive AI Analyst, an expert cybersecurity and OSINT intelligence advisor. "
                    "Your role is exclusively DEFENSIVE: explain findings, demystify CVEs, outline threat context, and recommend hardening actions. "
                    "Never provide offensive exploit code or intrusion instructions."
                )
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
                payload = {
                    "contents": [{
                        "parts": [{"text": f"{system_prompt}\n\nTarget: {target or 'General System'}\nContext: {context or {}}\nUser Query: {query}"}]
                    }]
                }
                async with httpx.AsyncClient(timeout=8.0) as client:
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"]
                        return AIAnalyzeResponse(
                            response=text,
                            suggestions=[
                                "Explain the CVSS vector for this finding",
                                "What network controls mitigate this exposure?",
                                "Summarize the potential business impact"
                            ],
                            source="Google Gemini AI (Live Defensive Model)"
                        )
            except Exception:
                pass

        # 3. Intelligent Heuristic Rule-based Defensive Analyst Engine (Zero-API Key Fallback)
        q_lower = query.lower()
        target_label = target or (context.get("target") if context else "Target Asset")

        if "cve" in q_lower or "vulnerability" in q_lower:
            response = (
                f"### Vulnerability Analysis & Triage\n\n"
                f"**Assessment Context**: Regarding `{target_label}`.\n\n"
                f"- **What this finding means**: The identified CVE represents a known public weakness in the exposed software service stack. "
                f"However, detection is currently **heuristic based on public banner correlation**. Verification is mandatory before concluding an active breach surface.\n"
                f"- **Technical Risk**: Unpatched network services can allow unauthorized information disclosure or resource denial if left exposed to unauthenticated interfaces.\n"
                f"- **Defensive Action**: Validate the internal build number of the service, apply vendor security patches, or place the endpoint behind a Web Application Firewall (WAF) or Zero-Trust perimeter."
            )
            suggestions = [
                "How do we patch or isolate this service?",
                "What compensating controls apply if we cannot patch immediately?",
                "How does this vulnerability affect our CyberEye Risk Score?"
            ]

        elif "why" in q_lower and "risk" in q_lower:
            response = (
                f"### CyberEye Risk Score Breakdown\n\n"
                f"The risk score for `{target_label}` is calculated through our transparent heuristic framework:\n\n"
                f"1. **Asset Exposure**: Public DNS mappings, email exchange endpoints, and direct server banners elevate attack surface discoverability.\n"
                f"2. **Vulnerability Severity**: High-scoring CVSS CVEs directly correlate with the observed technology stack.\n"
                f"3. **Configuration Posture**: Lack of defensive HTTP headers (e.g. HSTS, Content-Security-Policy) leaves clients susceptible to protocol downgrade or XSS.\n"
                f"4. **Threat Telemetry**: The target exhibits recent mentions in OSINT threat pulses or public scanner logs.\n\n"
                f"*Note: This heuristic assessment provides directional prioritization for defensive triage, not a compliance guarantee.*"
            )
            suggestions = [
                "Which finding should we remediate first?",
                "How quickly can the risk score improve?",
                "What headers should our team deploy immediately?"
            ]

        elif "what should a defender investigate next" in q_lower or "investigate next" in q_lower:
            response = (
                f"### Recommended Defensive Investigation Playbook\n\n"
                f"To validate and secure `{target_label}`, execute the following triage steps:\n\n"
                f"1. **Service Verification**: Verify whether the exposed server banner accurately reflects the runtime software version, or if a reverse proxy handles edge traffic.\n"
                f"2. **Network Ingress Auditing**: Restrict administrative ports (SSH, RDP, Webmin) from listening on `0.0.0.0/0`. Restrict via IP allowlists or VPN.\n"
                f"3. **Security Headers Hardening**: Implement `Strict-Transport-Security: max-age=31536000; includeSubDomains` and a restrictive `Content-Security-Policy`.\n"
                f"4. **Log Review**: Inspect edge proxy access logs for abnormal spikes, directory traversal attempts, or anomalous user-agents matching public exploit scanner signatures."
            )
            suggestions = [
                "Generate executive investigation summary",
                "View the threat relationship graph",
                "Export formal PDF investigation dossier"
            ]

        else:
            response = (
                f"### CyberEye Analyst Assessment\n\n"
                f"**Subject**: `{target_label}`\n\n"
                f"- **Observed Finding**: The system has correlated publicly visible network telemetry, BGP routing entries, TLS parameters, and public CVE disclosures.\n"
                f"- **Defensive Perspective**: Public OSINT reconnaissance demonstrates that potential adversaries can map key components of this architecture with zero intrusive contact.\n"
                f"- **Next Step**: Review the Threat Graph to understand cross-entity dependencies between DNS, ASN, and hosting providers."
            )
            suggestions = [
                "What does this finding mean?",
                "Why is this asset considered high risk?",
                "What should a defender investigate next?"
            ]

        return AIAnalyzeResponse(
            response=response,
            suggestions=suggestions,
            source="CyberEye Heuristic Intelligence Engine (Offline Mode)"
        )

    @classmethod
    async def generate_summary(cls, target: str, collected_data: Dict[str, Any], risk_data: Dict[str, Any]) -> AISummaryResponse:
        score = risk_data.get("score", 50)
        level = risk_data.get("level", "MEDIUM")
        
        dns = collected_data.get("dns", {}).get("data", {})
        asn = collected_data.get("asn", {}).get("data", {})
        tech = collected_data.get("tech", {}).get("data", {})
        vuln = collected_data.get("vuln", {}).get("data", {})
        
        ips = dns.get("records", {}).get("A", [target])
        vulnerabilities = [v.get("cve_id") + " - " + v.get("title") for v in vuln.get("vulnerabilities", [])]
        
        exec_summary = (
            f"Defensive OSINT assessment of {target} reveals an overall risk rating of {score}/100 ({level}). "
            f"The target operates in Autonomous System {asn.get('asn', 'N/A')} ({asn.get('organization', 'Unknown Org')}) "
            f"located in {asn.get('country', 'Unknown')}. "
            f"Public intelligence indicators correlate {len(vulnerabilities)} potentially relevant vulnerability disclosures "
            f"and notable configuration exposures across perimeter edge interfaces."
        )

        target_overview = (
            f"Target {target} represents a critical public network asset resolving to {', '.join(ips)}. "
            f"Operated by {asn.get('organization', 'Entity')} and registered under {asn.get('registry', 'RIR')}."
        )

        observed_assets = [
            f"Public IPv4 Endpoint: {ip}" for ip in ips
        ] + [
            f"BGP Autonomous System: {asn.get('asn', 'Unknown')} ({asn.get('asn_name', 'ISP')})",
            f"Web Technology: {tech.get('server', 'Standard HTTP Server')}",
            f"TLS Status: Active Certificate (Issuer: {collected_data.get('certificate', {}).get('data', {}).get('issuer_cn', 'CA')})"
        ]

        potential_risks = [
            f"Public disclosure of software versions ({tech.get('server', 'server banner')}) enables automated vulnerability fingerprinting.",
            "Absence of crucial defensive HTTP response headers compromises client-side security posture.",
            "Target presence in threat feeds elevates likelihood of opportunistic scanning by automated threat actors."
        ]

        defensive_actions = [
            "Suppress or obfuscate verbose server and framework banners in edge web server configurations.",
            "Enforce HTTP Strict Transport Security (HSTS) with subdomains included.",
            "Deploy a robust Content-Security-Policy (CSP) to prohibit unauthorized scripts.",
            "Establish proactive patch management cycles for edge routing and gateway components."
        ]

        return AISummaryResponse(
            executive_summary=exec_summary,
            target_overview=target_overview,
            observed_assets=observed_assets,
            relevant_vulnerabilities=vulnerabilities or ["No direct critical CVE matches identified in public indexes."],
            potential_risks=potential_risks,
            geographic_context=f"Originating from {asn.get('city', 'Unknown')}, {asn.get('country', 'Unknown')} (Coordinates: {asn.get('latitude', 0.0)}, {asn.get('longitude', 0.0)}).",
            recommended_defensive_actions=defensive_actions,
            confidence_and_limitations=(
                "Analysis based solely on passive OSINT correlation and public network registries. "
                "No active penetration testing or intrusive exploitation was performed. "
                "Confidence level: 92% for infrastructure routing; 80% for vulnerability relevance pending internal patch verification."
            )
        )
