from typing import Dict, Any, List
from app.schemas.schemas import RiskFactor, RiskScoreResponse

class RiskScoringEngine:
    """
    Transparent Heuristic Risk Engine for CyberEye.
    Formula:
    Risk Score = Asset Exposure (0-25) 
               + Vulnerability Severity (0-35) 
               + Security Configuration (0-20) 
               + Intelligence Indicators (0-20)
    Normalized to 0 - 100 with clear human-readable factors.
    """

    @classmethod
    def calculate(cls, target: str, collected_data: Dict[str, Any]) -> RiskScoreResponse:
        factors: List[RiskFactor] = []
        
        # 1. Asset Exposure (0 to 25 pts)
        exposure_pts = 0
        dns_info = collected_data.get("dns", {}).get("data", {})
        records = dns_info.get("records", {})
        
        if len(records.get("A", [])) > 1:
            exposure_pts += 10
            factors.append(RiskFactor(
                category="Asset Exposure",
                name="Multiple Public IP Bindings",
                points=10,
                description=f"Target resolves to {len(records['A'])} distinct public IPv4 endpoints",
                severity="MEDIUM"
            ))
        elif len(records.get("A", [])) == 1:
            exposure_pts += 5
            factors.append(RiskFactor(
                category="Asset Exposure",
                name="Public Direct IP Resolution",
                points=5,
                description="Direct single IPv4 host exposure without cloud load-balancer masking",
                severity="LOW"
            ))

        if records.get("MX", []):
            exposure_pts += 5
            factors.append(RiskFactor(
                category="Asset Exposure",
                name="Public Mail Exchange (MX) Infrastructure",
                points=5,
                description=f"{len(records['MX'])} public mail servers mapped via DNS",
                severity="LOW"
            ))

        tech_info = collected_data.get("tech", {}).get("data", {})
        if tech_info.get("server") and "nginx" in tech_info.get("server", "").lower():
            exposure_pts += 10
            factors.append(RiskFactor(
                category="Asset Exposure",
                name="Direct Web Server Header Banner Exposed",
                points=10,
                description=f"Server exposes full software banner: {tech_info.get('server')}",
                severity="MEDIUM"
            ))
        exposure_pts = min(exposure_pts, 25)

        # 2. Vulnerability Severity (0 to 35 pts)
        vuln_pts = 0
        vuln_info = collected_data.get("vuln", {}).get("data", {})
        vulnerabilities = vuln_info.get("vulnerabilities", [])
        
        for v in vulnerabilities:
            sev = v.get("severity", "LOW").upper()
            if sev == "CRITICAL" and vuln_pts < 30:
                vuln_pts += 25
                factors.append(RiskFactor(
                    category="Vulnerability Severity",
                    name=f"Relevant Critical CVE: {v.get('cve_id')}",
                    points=25,
                    description=f"{v.get('title')} (CVSS {v.get('cvss')}) requires urgent defense review",
                    severity="CRITICAL"
                ))
            elif sev == "HIGH" and vuln_pts < 35:
                vuln_pts += 15
                factors.append(RiskFactor(
                    category="Vulnerability Severity",
                    name=f"Relevant High Severity CVE: {v.get('cve_id')}",
                    points=15,
                    description=f"{v.get('title')} (CVSS {v.get('cvss')})",
                    severity="HIGH"
                ))
            elif sev == "MEDIUM" and vuln_pts < 35:
                vuln_pts += 8
                factors.append(RiskFactor(
                    category="Vulnerability Severity",
                    name=f"Relevant Medium Advisory: {v.get('cve_id')}",
                    points=8,
                    description=f"{v.get('title')}",
                    severity="MEDIUM"
                ))
        vuln_pts = min(vuln_pts, 35)

        # 3. Security Configuration (0 to 20 pts)
        sec_pts = 0
        missing_sec = tech_info.get("missing_security_headers", [])
        if "strict_transport_security" in missing_sec:
            sec_pts += 8
            factors.append(RiskFactor(
                category="Security Configuration",
                name="Missing HSTS (HTTP Strict Transport Security)",
                points=8,
                description="Allows potential SSL-stripping and unencrypted protocol downgrade",
                severity="HIGH"
            ))
        if "content_security_policy" in missing_sec:
            sec_pts += 6
            factors.append(RiskFactor(
                category="Security Configuration",
                name="Missing Content-Security-Policy (CSP)",
                points=6,
                description="Elevates attack surface for cross-site scripting (XSS) and code injection",
                severity="MEDIUM"
            ))
        if "x_frame_options" in missing_sec or "permissions_policy" in missing_sec:
            sec_pts += 4
            factors.append(RiskFactor(
                category="Security Configuration",
                name="Missing Defensive UI Headers",
                points=4,
                description="Clickjacking or unconstrained browser API access permitted",
                severity="LOW"
            ))
        sec_pts = min(sec_pts, 20)

        # 4. Intelligence Indicators (0 to 20 pts)
        intel_pts = 0
        rep_info = collected_data.get("reputation", {}).get("data", {})
        if rep_info.get("threat_classification") == "MALICIOUS":
            intel_pts += 20
            factors.append(RiskFactor(
                category="Intelligence Indicators",
                name="Confirmed Malicious Blocklist Match",
                points=20,
                description="Flagged across multiple threat reputation feeds and blocklists",
                severity="CRITICAL"
            ))
        elif rep_info.get("threat_classification") == "ELEVATED_ATTENTION":
            intel_pts += 12
            factors.append(RiskFactor(
                category="Intelligence Indicators",
                name="Elevated Threat Telemetry & Scanner Attention",
                points=12,
                description="Listed in threat pulses and reported by network monitors in past 30 days",
                severity="HIGH"
            ))
        elif rep_info.get("blocklists_listed", 0) > 0:
            intel_pts += 8
            factors.append(RiskFactor(
                category="Intelligence Indicators",
                name="Historical Incident Telemetry",
                points=8,
                description="Target noted in historical abuse reports",
                severity="MEDIUM"
            ))
        intel_pts = min(intel_pts, 20)

        total_score = exposure_pts + vuln_pts + sec_pts + intel_pts
        total_score = max(0, min(100, total_score))

        if total_score >= 80:
            level = "CRITICAL"
            summary = "Target displays acute exposure, critical public vulnerabilities, and significant intelligence matches. Immediate defensive remediation recommended."
        elif total_score >= 60:
            level = "HIGH"
            summary = "Target possesses notable exposure and high-severity vulnerability associations. Priority patching and header hardening advised."
        elif total_score >= 30:
            level = "MEDIUM"
            summary = "Moderate risk profile with minor configuration gaps or medium-severity advisories. Standard hardening recommended."
        else:
            level = "LOW"
            summary = "Clean posture with minimal exposure and adequate defensive security configuration."

        return RiskScoreResponse(
            target=target,
            score=total_score,
            level=level,
            breakdown=factors,
            summary=summary
        )
