import ssl
import socket
import datetime
from typing import Dict, Any
from app.collectors.base import BaseCollector

class CertificateCollector(BaseCollector):
    def __init__(self):
        super().__init__(name="CertificateCollector", category="certificate")

    async def collect(self, target: str, is_active_authorized: bool = False) -> Dict[str, Any]:
        target = target.strip().lower()
        if target.startswith("http://") or target.startswith("https://"):
            from urllib.parse import urlparse
            target = urlparse(target).netloc or target
        target = target.split(":")[0]

        is_demo = True
        source = "CyberEye Live TLS Inspection"
        cert_data = {}

        # Safe passive TLS handshake attempt
        try:
            ctx = ssl.create_default_context()
            with socket.create_connection((target, 443), timeout=3.0) as sock:
                with ctx.wrap_socket(sock, server_hostname=target) as ssock:
                    cert = ssock.getpeercert()
                    cipher = ssock.cipher()
                    version = ssock.version()
                    
                    # Parse subject
                    subject_dict = dict(x[0] for x in cert.get("subject", ()))
                    issuer_dict = dict(x[0] for x in cert.get("issuer", ()))
                    
                    sans = [item[1] for item in cert.get("subjectAltName", []) if item[0] == "DNS"]
                    
                    not_before = cert.get("notBefore", "")
                    not_after = cert.get("notAfter", "")
                    
                    cert_data = {
                        "subject_cn": subject_dict.get("commonName", target),
                        "subject_org": subject_dict.get("organizationName", "Verified Entity"),
                        "issuer_cn": issuer_dict.get("commonName", "Let's Encrypt"),
                        "issuer_org": issuer_dict.get("organizationName", "Certificate Authority"),
                        "sans": sans[:10],
                        "valid_from": not_before,
                        "valid_to": not_after,
                        "serial_number": cert.get("serialNumber", ""),
                        "tls_version": version,
                        "cipher_suite": cipher[0] if cipher else "TLS_AES_256_GCM_SHA384",
                        "status": "VALID"
                    }
                    is_demo = False
        except Exception:
            pass

        if is_demo:
            source = "CyberEye Demonstration Intelligence Data"
            if "acme" in target:
                cert_data = {
                    "subject_cn": "acme-defense.org",
                    "subject_org": "Acme Global Defense Systems Inc.",
                    "issuer_cn": "DigiCert Global Root G2",
                    "issuer_org": "DigiCert Inc",
                    "sans": ["acme-defense.org", "api.acme-defense.org", "portal.acme-defense.org", "vpn.acme-defense.org"],
                    "valid_from": "May 10 00:00:00 2026 GMT",
                    "valid_to": "May 10 23:59:59 2027 GMT",
                    "serial_number": "0F38B92104D7AE91",
                    "tls_version": "TLSv1.3",
                    "cipher_suite": "TLS_AES_256_GCM_SHA384",
                    "status": "VALID"
                }
            elif "fintech" in target:
                cert_data = {
                    "subject_cn": "fintech-global.io",
                    "subject_org": "FinTech International Clearing Corp",
                    "issuer_cn": "Sectigo RSA Domain Validation Secure Server CA",
                    "issuer_org": "Sectigo Limited",
                    "sans": ["fintech-global.io", "pay.fintech-global.io", "gateway.fintech-global.io"],
                    "valid_from": "Jan 15 00:00:00 2026 GMT",
                    "valid_to": "Jan 15 23:59:59 2027 GMT",
                    "serial_number": "4B908A7C2314DF88",
                    "tls_version": "TLSv1.3",
                    "cipher_suite": "ECDHE-RSA-AES256-GCM-SHA384",
                    "status": "VALID"
                }
            else:
                cert_data = {
                    "subject_cn": target,
                    "subject_org": "Demonstration Entity",
                    "issuer_cn": "Let's Encrypt Authority X3",
                    "issuer_org": "Internet Security Research Group",
                    "sans": [target, f"www.{target}", f"api.{target}"],
                    "valid_from": "Aug 01 00:00:00 2026 GMT",
                    "valid_to": "Nov 01 23:59:59 2026 GMT",
                    "serial_number": "7E4C8A992D3F1B00",
                    "tls_version": "TLSv1.3",
                    "cipher_suite": "TLS_AES_128_GCM_SHA256",
                    "status": "VALID"
                }

        return self.format_result(
            data=cert_data,
            is_demo=is_demo,
            source=source
        )
