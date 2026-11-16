from typing import Dict, Any, List
from app.collectors.base import BaseCollector

class ReputationCollector(BaseCollector):
    def __init__(self):
        super().__init__(name="ReputationCollector", category="reputation")

    async def collect(self, target: str, is_active_authorized: bool = False) -> Dict[str, Any]:
        target = target.strip().lower()
        is_demo = True
        source = "CyberEye Threat Intelligence & Blocklist Feeds (Demo Mode)"

        rep_data = {
            "target": target,
            "reputation_score": 85,  # 0 to 100, higher is safer
            "threat_classification": "BENIGN",
            "blocklists_checked": 12,
            "blocklists_listed": 0,
            "threat_tags": ["legitimate-service", "active-dns"],
            "blocklist_details": [
                {"feed": "Spamhaus ZEN", "status": "CLEAN"},
                {"feed": "AbuseIPDB Verified", "status": "CLEAN"},
                {"feed": "AlienVault OTX Pulse", "status": "CLEAN"},
                {"feed": "SURBL Blacklist", "status": "CLEAN"},
                {"feed": "Tor Project Node List", "status": "NOT_LISTED"}
            ],
            "historical_incidents": 0
        }

        if "acme" in target or "198.51" in target:
            rep_data = {
                "target": target,
                "reputation_score": 72,
                "threat_classification": "ELEVATED_ATTENTION",
                "blocklists_checked": 15,
                "blocklists_listed": 1,
                "threat_tags": ["defense-sector", "frequent-scanner-target", "exposed-rdp-history"],
                "blocklist_details": [
                    {"feed": "Spamhaus ZEN", "status": "CLEAN"},
                    {"feed": "AbuseIPDB Verified", "status": "1_REPORT_30D"},
                    {"feed": "AlienVault OTX Pulse", "status": "OBSERVED_IN_SECTOR_PULSE"},
                    {"feed": "SURBL Blacklist", "status": "CLEAN"},
                    {"feed": "C2 Tracker Telemetry", "status": "CLEAN"}
                ],
                "historical_incidents": 2
            }
        elif "malware" in target or "bad" in target or "botnet" in target:
            rep_data = {
                "target": target,
                "reputation_score": 18,
                "threat_classification": "MALICIOUS",
                "blocklists_checked": 15,
                "blocklists_listed": 7,
                "threat_tags": ["active-c2", "cobalt-strike-beacon", "cryptominer", "phishing-host"],
                "blocklist_details": [
                    {"feed": "Spamhaus ZEN", "status": "LISTED_SBL"},
                    {"feed": "AbuseIPDB Verified", "status": "100%_CONFIDENCE_MALICIOUS"},
                    {"feed": "AlienVault OTX Pulse", "status": "MATCHED_PULSE_APT29"},
                    {"feed": "SURBL Blacklist", "status": "LISTED"},
                    {"feed": "C2 Tracker Telemetry", "status": "ACTIVE_BEACON"}
                ],
                "historical_incidents": 14
            }

        return self.format_result(
            data=rep_data,
            is_demo=is_demo,
            source=source
        )
