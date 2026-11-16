import socket
import httpx
from typing import Dict, Any, List
from app.collectors.base import BaseCollector

class DNSCollector(BaseCollector):
    def __init__(self):
        super().__init__(name="DNSCollector", category="dns")

    async def collect(self, target: str, is_active_authorized: bool = False) -> Dict[str, Any]:
        target = target.strip().lower()
        if target.startswith("http://") or target.startswith("https://"):
            from urllib.parse import urlparse
            target = urlparse(target).netloc or target
        target = target.split(":")[0]

        records: Dict[str, List[Any]] = {
            "A": [],
            "AAAA": [],
            "MX": [],
            "NS": [],
            "TXT": [],
            "CNAME": [],
            "SOA": [],
            "SPF": [],
            "DMARC": []
        }
        is_demo = True
        source = "CyberEye Public DNS Resolver (Live)"

        # Attempt live standard socket resolution for A records
        try:
            addr_info = socket.getaddrinfo(target, None)
            for item in addr_info:
                ip = item[4][0]
                if ":" in ip and ip not in records["AAAA"]:
                    records["AAAA"].append(ip)
                elif "." in ip and ip not in records["A"]:
                    records["A"].append(ip)
            if records["A"]:
                is_demo = False
        except Exception:
            pass

        # Attempt live DNS-over-HTTPS via Cloudflare DNS (Public RFC 8484)
        if not is_demo:
            try:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    for qtype in ["MX", "NS", "TXT"]:
                        resp = await client.get(
                            f"https://cloudflare-dns.com/dns-query?name={target}&type={qtype}",
                            headers={"Accept": "application/dns-json"}
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            for ans in data.get("Answer", []):
                                val = ans.get("data", "").strip('"')
                                if val:
                                    records[qtype].append(val)
            except Exception:
                pass

        # If live lookup failed or target is a demonstration target, use high-fidelity synthetic demo data
        if not records["A"] or is_demo:
            is_demo = True
            source = "CyberEye Demonstration Intelligence Data"
            if "acme" in target or "defense" in target:
                records["A"] = ["198.51.100.24", "198.51.100.25"]
                records["AAAA"] = ["2001:db8:85a3::8a2e:370:7334"]
                records["MX"] = ["10 mail.acme-defense.org", "20 backup-mail.acme-defense.org"]
                records["NS"] = ["ns1.cybercloud-dns.com", "ns2.cybercloud-dns.com"]
                records["TXT"] = ["v=spf1 include:_spf.google.com ~all", "google-site-verification=cybereye-token-9823"]
                records["CNAME"] = ["defense-cluster.edge-cdn.net"]
                records["SOA"] = ["ns1.cybercloud-dns.com hostmaster.acme-defense.org 2026090101 7200 3600 1209600 3600"]
                records["SPF"] = ["v=spf1 include:_spf.google.com ~all"]
                records["DMARC"] = ["v=DMARC1; p=reject; rua=mailto:dmarc-reports@acme-defense.org; pct=100"]
            elif "fintech" in target:
                records["A"] = ["203.0.113.88"]
                records["MX"] = ["5 mx1.fintech-global.io", "10 mx2.fintech-global.io"]
                records["NS"] = ["ns1.cloudflare.com", "ns2.cloudflare.com"]
                records["TXT"] = ["v=spf1 ip4:203.0.113.0/24 -all"]
                records["SPF"] = ["v=spf1 ip4:203.0.113.0/24 -all"]
                records["DMARC"] = ["v=DMARC1; p=quarantine; sp=reject"]
            elif target in ["8.8.8.8", "dns.google"]:
                records["A"] = ["8.8.8.8", "8.8.4.4"]
                records["AAAA"] = ["2001:4860:4860::8888", "2001:4860:4860::8844"]
                records["NS"] = ["ns1.google.com", "ns2.google.com"]
                records["TXT"] = ["v=spf1 -all"]
            else:
                # Deterministic synthetic generation for any test domain
                hash_val = sum(ord(c) for c in target) % 250
                records["A"] = [f"192.0.2.{hash_val}", f"198.51.100.{hash_val}"]
                records["MX"] = [f"10 mail.{target}", f"20 mx2.{target}"]
                records["NS"] = [f"ns1.global-dns-host.net", f"ns2.global-dns-host.net"]
                records["TXT"] = ["v=spf1 include:_spf.protection.outlook.com ~all"]
                records["SPF"] = ["v=spf1 include:_spf.protection.outlook.com ~all"]
                records["DMARC"] = ["v=DMARC1; p=none; rua=mailto:reports@" + target]

        return self.format_result(
            data={
                "target": target,
                "records": records,
                "record_counts": {k: len(v) for k, v in records.items()}
            },
            is_demo=is_demo,
            source=source
        )
