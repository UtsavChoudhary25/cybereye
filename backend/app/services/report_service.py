import datetime
from typing import Dict, Any

class ReportService:
    @classmethod
    def generate_report_content(cls, investigation_id: int, target: str, collected_data: Dict[str, Any], risk_data: Dict[str, Any], ai_summary: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assembles a comprehensive, production-quality cyber intelligence investigation dossier.
        """
        now_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        
        return {
            "meta": {
                "platform": "CYBEREYE",
                "tagline": "See the signal. Understand the threat.",
                "report_id": f"CE-INTEL-{investigation_id}-{int(datetime.datetime.utcnow().timestamp())}",
                "generated_at": now_str,
                "classification": "TLP:AMBER - INTERNAL DEFENSIVE DOSSIER",
                "target": target
            },
            "risk_assessment": {
                "score": risk_data.get("score", 0),
                "level": risk_data.get("level", "LOW"),
                "formula": risk_data.get("formula_label", "CyberEye Risk Score — heuristic assessment"),
                "breakdown": risk_data.get("breakdown", []),
                "summary": risk_data.get("summary", "")
            },
            "executive_summary": ai_summary.get("executive_summary", ""),
            "target_overview": ai_summary.get("target_overview", ""),
            "observed_assets": ai_summary.get("observed_assets", []),
            "vulnerabilities": ai_summary.get("relevant_vulnerabilities", []),
            "potential_risks": ai_summary.get("potential_risks", []),
            "geographic_context": ai_summary.get("geographic_context", ""),
            "recommended_actions": ai_summary.get("recommended_defensive_actions", []),
            "confidence_and_limitations": ai_summary.get("confidence_and_limitations", ""),
            "raw_intelligence_summary": {
                "dns": collected_data.get("dns", {}).get("data", {}),
                "asn": collected_data.get("asn", {}).get("data", {}),
                "certificate": collected_data.get("certificate", {}).get("data", {}),
                "technology": collected_data.get("tech", {}).get("data", {}),
                "reputation": collected_data.get("reputation", {})
            },
            "disclaimer": (
                "This document is produced strictly for defensive cybersecurity situational awareness and educational analysis. "
                "Data has been gathered exclusively via legitimate public OSINT feeds, DNS queries, and passive observations. "
                "CyberEye prohibits offensive exploitation, malware distribution, or unauthorized access attempts."
            )
        }

