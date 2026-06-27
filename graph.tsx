import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModuleLayout, LearningPanel, HistoryPanel } from "@/components/viz/LearningPanel";

export const Route = createFileRoute("/graph")({
  head: () => ({
    meta: [
      { title: "Graph Visualizer (BFS / DFS) — AlgoViz" },
      { name: "description", content: "Build a graph, drag nodes, connect edges, and watch BFS or DFS traverse." },
    ],
  }),
  component: GraphPage,
});

type GNode = { id: number; label: string; x: number; y: number };
type GEdge = { from: number; to: number };
let idGen = 0;

function GraphPage() {
  const [nodes, setNodes] = useState<GNode[]>([
    { id: ++idGen, label: "A", x: 120, y: 120 },
    { id: ++idGen, label: "B", x: 280, y: 80 },
    { id: ++idGen, label: "C", x: 420, y: 160 },
    { id: ++idGen, label: "D", x: 200, y: 260 },
    { id: ++idGen, label: "E", x: 400, y: 310 },
  ]);
  const [edges, setEdges] = useState<GEdge[]>([
    { from: 1, to: 2 }, { from: 1, to: 4 }, { from: 2, to: 3 }, { from: 3, to: 5 }, { from: 4, to: 5 },
  ]);
  const [connectFrom, setConnectFrom] = useState<number | null>(null);
  const [startId, setStartId] = useState<number | null>(1);
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [activeEdges, setActiveEdges] = useState<Set<string>>(new Set());
  const [op, setOp] = useState<string>();
  const [explain, setExplain] = useState<string>();
  const [history, setHistory] = useState<string[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const adj = (id: number) =>
    edges.filter(e => e.from === id || e.to === id).map(e => e.from === id ? e.to : e.from).sort((a, b) => a - b);

  const addNode = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      const rect = svgRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const label = String.fromCharCode(65 + nodes.length);
      setNodes(ns => [...ns, { id: ++idGen, label, x, y }]);
    }
  };

  const onNodeClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.altKey) { setNodes(ns => ns.filter(n => n.id !== id)); setEdges(es => es.filter(ed => ed.from !== id && ed.to !== id)); return; }
    if (connectFrom === null) setConnectFrom(id);
    else if (connectFrom !== id) {
      const exists = edges.some(ed => (ed.from === connectFrom && ed.to === id) || (ed.from === id && ed.to === connectFrom));
      if (!exists) setEdges(es => [...es, { from: connectFrom, to: id }]);
      setConnectFrom(null);
    } else setConnectFrom(null);
  };

  // dragging
  const dragRef = useRef<number | null>(null);
  const onMove = (e: React.MouseEvent) => {
    if (dragRef.current == null) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    setNodes(ns => ns.map(n => n.id === dragRef.current ? { ...n, x, y } : n));
  };

  const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

  const bfs = async () => {
    if (startId == null) return;
    const order: number[] = [];
    const seen = new Set<number>([startId]);
    const q: number[] = [startId];
    const ae = new Set<string>();
    setOp("BFS"); setHistory(h => [...h, `bfs(${labelOf(startId)})`]);
    setVisited(new Set()); setActiveEdges(new Set());
    while (q.length) {
      const cur = q.shift()!;
      order.push(cur);
      const newVisited = new Set(seen);
      setVisited(new Set(order));
      setExplain(`Visit ${labelOf(cur)}. Queue: [${q.map(labelOf).join(", ")}]`);
      await wait(550);
      for (const nb of adj(cur)) {
        if (!seen.has(nb)) {
          seen.add(nb); newVisited.add(nb); q.push(nb);
          ae.add(edgeKey(cur, nb)); setActiveEdges(new Set(ae));
          await wait(150);
        }
      }
    }
    setExplain(`Order: ${order.map(labelOf).join(" → ")}`);
  };

  const dfs = async () => {
    if (startId == null) return;
    const order: number[] = [];
    const seen = new Set<number>();
    const ae = new Set<string>();
    setOp("DFS"); setHistory(h => [...h, `dfs(${labelOf(startId)})`]);
    setVisited(new Set()); setActiveEdges(new Set());
    const visit = async (id: number, parent: number | null) => {
      seen.add(id); order.push(id); setVisited(new Set(order));
      if (parent !== null) { ae.add(edgeKey(parent, id)); setActiveEdges(new Set(ae)); }
      setExplain(`Visit ${labelOf(id)}. Path: ${order.map(labelOf).join(" → ")}`);
      await wait(500);
      for (const nb of adj(id)) if (!seen.has(nb)) await visit(nb, id);
    };
    await visit(startId, null);
    setExplain(`Order: ${order.map(labelOf).join(" → ")}`);
  };

  const labelOf = (id: number) => nodes.find(n => n.id === id)?.label ?? "?";
  const edgeKey = (a: number, b: number) => a < b ? `${a}-${b}` : `${b}-${a}`;

  const reset = () => { setVisited(new Set()); setActiveEdges(new Set()); setOp(undefined); setExplain(undefined); };
  const clearAll = () => { setNodes([]); setEdges([]); setVisited(new Set()); setActiveEdges(new Set()); setHistory([]); };

  return (
    <ModuleLayout
      left={
        <>
          <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-2">
            <div className="text-xs text-muted-foreground">
              Shift+click empty area = add node · Click node, click another = connect · Alt+click node = delete · Drag to move
            </div>
            <div className="flex-1" />
            <select value={startId ?? ""} onChange={e => setStartId(Number(e.target.value))}
              className="bg-input/60 rounded-lg px-2 py-2 text-sm outline-none">
              {nodes.map(n => <option key={n.id} value={n.id}>Start: {n.label}</option>)}
            </select>
            <button onClick={bfs} className="gradient-bg text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium">BFS</button>
            <button onClick={dfs} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">DFS</button>
            <button onClick={reset} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Reset Run</button>
            <button onClick={clearAll} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Clear</button>
          </div>

          <div className="glass rounded-xl p-2">
            <svg
              ref={svgRef} width="100%" height={500}
              onClick={addNode}
              onMouseMove={onMove}
              onMouseUp={() => { dragRef.current = null; }}
              onMouseLeave={() => { dragRef.current = null; }}
              className="rounded-lg cursor-crosshair select-none"
              style={{ background: "color-mix(in oklab, var(--color-background) 50%, transparent)" }}
            >
              {edges.map((e, i) => {
                const a = nodes.find(n => n.id === e.from)!;
                const b = nodes.find(n => n.id === e.to)!;
                if (!a || !b) return null;
                const active = activeEdges.has(edgeKey(e.from, e.to));
                return (
                  <motion.line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    animate={{ stroke: active ? "var(--color-primary)" : "var(--color-border)", strokeWidth: active ? 3 : 2 }}
                  />
                );
              })}
              {connectFrom !== null && (() => {
                const a = nodes.find(n => n.id === connectFrom);
                return a ? <circle cx={a.x} cy={a.y} r={28} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeDasharray="4 3" /> : null;
              })()}
              <AnimatePresence>
                {nodes.map(n => {
                  const vis = visited.has(n.id);
                  return (
                    <motion.g key={n.id}
                      initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1, x: n.x, y: n.y }} exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      onMouseDown={(e) => { e.stopPropagation(); dragRef.current = n.id; }}
                      onClick={(e) => onNodeClick(n.id, e)}
                      style={{ cursor: "grab" }}
                    >
                      <circle r={24} fill={vis ? "var(--color-success)" : "var(--color-primary)"} stroke="white" strokeWidth={2} />
                      <text textAnchor="middle" y={5} fill="white" fontWeight={700} fontFamily="JetBrains Mono" fontSize={14}>{n.label}</text>
                    </motion.g>
                  );
                })}
              </AnimatePresence>
            </svg>
          </div>
        </>
      }
      right={
        <>
          <LearningPanel
            currentOp={op} explain={explain}
            content={{
              title: "Graph · BFS / DFS",
              definition: "A graph is a set of nodes (vertices) connected by edges. Traversals explore reachable nodes.",
              working: "BFS uses a FIFO queue and explores level by level. DFS uses a stack (or recursion) and dives deep before backtracking.",
              realWorld: "Social networks, road maps, dependency resolution, web crawling, shortest paths.",
              pros: ["BFS finds shortest unweighted path", "DFS detects cycles & topo-orders"],
              cons: ["BFS uses more memory", "DFS may recurse deeply"],
              complexity: { best: "O(V+E)", avg: "O(V+E)", worst: "O(V+E)", space: "O(V)" },
            }}
          />
          <HistoryPanel history={history} />
        </>
      }
    />
  );
}
