from typing import Dict, Any, List
from app.schemas.schemas import GraphNode, GraphEdge, ThreatGraphResponse

class ThreatGraphBuilder:
    """
    Constructs an interactive force-directed entity relationship graph
    mapping Target -> Domain -> IP -> ASN -> Org -> CVE -> Tech -> Events.
    """

    @classmethod
    def build(cls, target: str, collected_data: Dict[str, Any], investigation_id: int = None) -> ThreatGraphResponse:
        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []
        seen_node_ids = set()

        def add_node(node: GraphNode):
            if node.id not in seen_node_ids:
                nodes.append(node)
                seen_node_ids.add(node.id)

        def add_edge(edge: GraphEdge):
            edges.append(edge)

        # 1. Primary Target Node
        target_id = f"target_{target}"
        add_node(GraphNode(
            id=target_id,
            label=target,
            type="domain" if "." in target and not target.replace(".", "").isdigit() else ("ip" if target.replace(".", "").isdigit() else "org"),
            category="Target Investigation",
            risk_score=75,
            metadata={"primary": True, "target": target}
        ))

        # 2. DNS & IP Nodes
        dns_data = collected_data.get("dns", {}).get("data", {})
        records = dns_data.get("records", {})
        a_records = records.get("A", [])
        
        for ip in a_records:
            ip_id = f"ip_{ip}"
            add_node(GraphNode(
                id=ip_id,
                label=ip,
                type="ip",
                category="Infrastructure",
                metadata={"ip": ip}
            ))
            add_edge(GraphEdge(
                source=target_id,
                target=ip_id,
                relationship="resolves_to",
                confidence=1.0
            ))

        # 3. ASN & Organization Nodes
        asn_data = collected_data.get("asn", {}).get("data", {})
        asn_num = asn_data.get("asn")
        org_name = asn_data.get("organization")
        country = asn_data.get("country")

        if asn_num:
            asn_id = f"asn_{asn_num}"
            add_node(GraphNode(
                id=asn_id,
                label=f"{asn_num} ({asn_data.get('asn_name', 'BGP')})",
                type="asn",
                category="Autonomous System",
                metadata=asn_data
            ))
            # Connect IPs to ASN
            for ip in a_records or [target]:
                add_edge(GraphEdge(
                    source=f"ip_{ip}" if f"ip_{ip}" in seen_node_ids else target_id,
                    target=asn_id,
                    relationship="belongs_to",
                    confidence=0.95
                ))

        if org_name:
            org_id = f"org_{org_name.replace(' ', '_')}"
            add_node(GraphNode(
                id=org_id,
                label=org_name,
                type="org",
                category="Entity",
                metadata={"country": country, "organization": org_name}
            ))
            if asn_num and f"asn_{asn_num}" in seen_node_ids:
                add_edge(GraphEdge(
                    source=f"asn_{asn_num}",
                    target=org_id,
                    relationship="managed_by",
                    confidence=0.9
                ))
            add_edge(GraphEdge(
                source=target_id,
                target=org_id,
                relationship="associated_with",
                confidence=0.85
            ))

        # 4. Technologies
        tech_data = collected_data.get("tech", {}).get("data", {})
        for tech in tech_data.get("technologies", [])[:4]:
            tech_id = f"tech_{tech.replace(' ', '_').replace(':', '')}"
            add_node(GraphNode(
                id=tech_id,
                label=tech,
                type="tech",
                category="Software Stack",
                metadata={"tech": tech}
            ))
            add_edge(GraphEdge(
                source=target_id,
                target=tech_id,
                relationship="runs_service",
                confidence=0.9
            ))

        # 5. Vulnerabilities (CVEs)
        vuln_data = collected_data.get("vuln", {}).get("data", {})
        vulnerabilities = vuln_data.get("vulnerabilities", [])
        for v in vulnerabilities:
            cve_id = f"cve_{v.get('cve_id')}"
            add_node(GraphNode(
                id=cve_id,
                label=f"{v.get('cve_id')} (CVSS {v.get('cvss')})",
                type="cve",
                severity=v.get("severity"),
                category="Vulnerability",
                metadata=v
            ))
            add_edge(GraphEdge(
                source=target_id,
                target=cve_id,
                relationship="affected_by",
                confidence=0.8
            ))

        return ThreatGraphResponse(
            investigation_id=investigation_id,
            target=target,
            nodes=nodes,
            edges=edges
        )
