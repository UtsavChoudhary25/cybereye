import React, { useEffect, useRef, useState } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCcw, Pause, Play, 
  Search, X
} from 'lucide-react';
import { GraphNode, GraphEdge } from '../../types';

interface ThreatGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectNode?: (node: GraphNode) => void;
}

export const ThreatGraph: React.FC<ThreatGraphProps> = ({
  nodes: initialNodes,
  edges,
  onSelectNode
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPhysicsActive, setIsPhysicsActive] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Dragging state
  const isDraggingRef = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<GraphNode | null>(null);

  // Initialize node positions in circle
  useEffect(() => {
    if (!initialNodes || initialNodes.length === 0) return;

    const width = 800;
    const height = 500;
    const radius = Math.min(width, height) * 0.35;
    const count = initialNodes.length;

    const initialized = initialNodes.map((node, i) => {
      const angle = (i / count) * 2 * Math.PI;
      return {
        ...node,
        x: node.x || width / 2 + radius * Math.cos(angle) + (Math.random() - 0.5) * 40,
        y: node.y || height / 2 + radius * Math.sin(angle) + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
      };
    });

    setNodes(initialized);
  }, [initialNodes]);

  // Force-directed physics step
  useEffect(() => {
    if (!isPhysicsActive || nodes.length === 0) return;

    let animId: number;

    const stepSimulation = () => {
      setNodes((prevNodes) => {
        const nextNodes = prevNodes.map((n) => ({ ...n }));
        const nodeMap = new Map(nextNodes.map((n) => [n.id, n]));

        // 1. Repulsion between all pairs
        for (let i = 0; i < nextNodes.length; i++) {
          for (let j = i + 1; j < nextNodes.length; j++) {
            const a = nextNodes[i];
            const b = nextNodes[j];
            const dx = (b.x || 0) - (a.x || 0);
            const dy = (b.y || 0) - (a.y || 0);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist < 320) {
              const force = (320 - dist) / dist * 0.45;
              a.vx = (a.vx || 0) - dx * force * 0.05;
              a.vy = (a.vy || 0) - dy * force * 0.05;
              b.vx = (b.vx || 0) + dx * force * 0.05;
              b.vy = (b.vy || 0) + dy * force * 0.05;
            }
          }
        }

        // 2. Spring attraction along edges
        edges.forEach((edge) => {
          const source = nodeMap.get(edge.source);
          const target = nodeMap.get(edge.target);
          if (source && target) {
            const dx = (target.x || 0) - (source.x || 0);
            const dy = (target.y || 0) - (source.y || 0);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const desired = 130;
            const force = (dist - desired) * 0.015;
            source.vx = (source.vx || 0) + dx * force;
            source.vy = (source.vy || 0) + dy * force;
            target.vx = (target.vx || 0) - dx * force;
            target.vy = (target.vy || 0) - dy * force;
          }
        });

        // 3. Update positions with damping
        const canvas = canvasRef.current;
        const cx = canvas ? canvas.width / 2 : 400;
        const cy = canvas ? canvas.height / 2 : 300;

        nextNodes.forEach((node) => {
          if (draggedNodeRef.current?.id === node.id) return;
          // Center gravity pull
          node.vx = (node.vx || 0) + (cx - (node.x || cx)) * 0.002;
          node.vy = (node.vy || 0) + (cy - (node.y || cy)) * 0.002;

          node.vx = (node.vx || 0) * 0.85;
          node.vy = (node.vy || 0) * 0.85;
          node.x = (node.x || cx) + (node.vx || 0);
          node.y = (node.y || cy) + (node.vy || 0);
        });

        return nextNodes;
      });

      animId = requestAnimationFrame(stepSimulation);
    };

    animId = requestAnimationFrame(stepSimulation);
    return () => cancelAnimationFrame(animId);
  }, [isPhysicsActive, edges]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Apply pan & zoom
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Draw Edges
    edges.forEach((edge) => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (source && target && source.x && source.y && target.x && target.y) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Edge label
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.fillText(edge.relationship, midX + 4, midY - 4);
      }
    });

    // Draw Nodes
    nodes.forEach((node) => {
      if (!node.x || !node.y) return;
      if (activeFilter !== 'ALL' && node.type !== activeFilter.toLowerCase()) return;

      const isSelected = selectedNode?.id === node.id;
      const isMatched = searchTerm && node.label.toLowerCase().includes(searchTerm.toLowerCase());

      const colorMap: Record<string, string> = {
        domain: '#3b82f6', // Steel Blue
        ip: '#6366f1',     // Indigo Slate
        asn: '#0d9488',    // Teal Slate
        org: '#10b981',    // Forest Green
        cve: '#dc2626',    // Matte Crimson
        tech: '#d97706',   // Warm Amber
        event: '#64748b',  // Slate
      };
      const color = colorMap[node.type] || '#64748b';

      // Ring for selected or search matched
      if (isSelected || isMatched) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
        ctx.strokeStyle = isSelected ? '#ffffff' : '#f59e0b';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Node Body
      ctx.beginPath();
      ctx.arc(node.x, node.y, isSelected ? 15 : 11, 0, Math.PI * 2);
      ctx.fillStyle = '#0f121b';
      ctx.fill();
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.strokeStyle = color;
      ctx.stroke();

      // Node Label
      ctx.font = isSelected ? 'bold 11px JetBrains Mono, monospace' : '10px JetBrains Mono, monospace';
      ctx.fillStyle = isSelected ? '#ffffff' : '#cbd5e1';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + (isSelected ? 26 : 20));
    });

    ctx.restore();
  }, [nodes, edges, selectedNode, searchTerm, zoom, pan, activeFilter]);

  // Handle Drag & Click
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    // Check if clicked on a node
    const clicked = nodes.find((n) => {
      if (!n.x || !n.y) return false;
      const d = Math.sqrt((n.x - mouseX) ** 2 + (n.y - mouseY) ** 2);
      return d <= 18;
    });

    if (clicked) {
      draggedNodeRef.current = clicked;
      setSelectedNode(clicked);
      if (onSelectNode) onSelectNode(clicked);
    } else {
      isDraggingRef.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNodeRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      draggedNodeRef.current.x = mouseX;
      draggedNodeRef.current.y = mouseY;
    } else if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    draggedNodeRef.current = null;
    isDraggingRef.current = false;
  };

  return (
    <div className="relative w-full h-full bg-[#0b0d13] border border-slate-800/80 rounded overflow-hidden flex flex-col">
      {/* Top Toolbar */}
      <div className="h-11 bg-[#0f121a] border-b border-slate-800/80 px-4 flex items-center justify-between z-10">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono">
          {['ALL', 'Domain', 'IP', 'ASN', 'Org', 'CVE', 'Tech'].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                activeFilter === f
                  ? 'bg-slate-800 text-slate-100 font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Node Search */}
          <div className="relative w-40 hidden md:block">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Filter nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0c12] border border-slate-800 rounded pl-8 pr-2 py-1 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
            />
          </div>

          <button
            onClick={() => setIsPhysicsActive(!isPhysicsActive)}
            className="p-1 rounded bg-[#0a0c12] border border-slate-800 text-slate-400 hover:text-slate-200"
            title={isPhysicsActive ? 'Freeze physics' : 'Resume simulation'}
          >
            {isPhysicsActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
            className="p-1 rounded bg-[#0a0c12] border border-slate-800 text-slate-400 hover:text-slate-200"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
            className="p-1 rounded bg-[#0a0c12] border border-slate-800 text-slate-400 hover:text-slate-200"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="p-1 rounded bg-[#0a0c12] border border-slate-800 text-slate-400 hover:text-slate-200"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={1000}
          height={650}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-full block"
        />

        {/* Selected Node Inspector Flyout */}
        {selectedNode && (
          <div className="absolute bottom-4 right-4 z-10 matte-panel p-3.5 rounded border border-slate-800 w-72 shadow-xl space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                Entity Inspector
              </span>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-200 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Entity Label</span>
              <div className="text-xs font-bold text-slate-100 truncate">{selectedNode.label}</div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-300">
              <span className="text-slate-500">Node Type:</span>
              <span className="uppercase font-semibold text-blue-400">{selectedNode.type}</span>
            </div>
            {selectedNode.severity && (
              <div className="flex justify-between text-[11px] text-slate-300">
                <span className="text-slate-500">Severity:</span>
                <span className="text-red-400 font-semibold">{selectedNode.severity}</span>
              </div>
            )}
            {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
              <div className="pt-1.5 border-t border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase">Attributes</span>
                {Object.entries(selectedNode.metadata).slice(0, 3).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[10px] text-slate-400">
                    <span className="capitalize">{k}:</span>
                    <span className="text-slate-200 truncate max-w-[130px]">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
