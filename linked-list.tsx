import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ModuleLayout, LearningPanel, HistoryPanel } from "@/components/viz/LearningPanel";
import { colorFor } from "@/lib/viz/palette";

export const Route = createFileRoute("/linked-list")({
  head: () => ({
    meta: [
      { title: "Linked List Visualizer — AlgoViz" },
      { name: "description", content: "Singly, doubly, and circular linked lists with animated pointers." },
    ],
  }),
  component: LinkedListPage,
});

type Mode = "singly" | "doubly" | "circular";
type Node = { id: number; value: number };
let idGen = 0;
const mk = (v: number): Node => ({ id: ++idGen, value: v });

function LinkedListPage() {
  const [mode, setMode] = useState<Mode>("singly");
  const [nodes, setNodes] = useState<Node[]>([10, 20, 30].map(mk));
  const [value, setValue] = useState("");
  const [pos, setPos] = useState("");
  const [highlight, setHighlight] = useState<Set<number>>(new Set());
  const [op, setOp] = useState<string>();
  const [explain, setExplain] = useState<string>();
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const addH = (s: string) => setHistory(h => [...h, s]);
  const setHL = (ids: number[]) => setHighlight(new Set(ids));

  const insertHead = () => {
    const v = Number(value); if (Number.isNaN(v)) { setError("Enter a number"); return; }
    const n = mk(v); setNodes([n, ...nodes]); setHL([n.id]);
    setOp(`InsertHead(${v})`); setExplain(`New node ${v} linked as head.`);
    addH(`insertHead(${v})`); setValue(""); setError(null);
    setTimeout(() => setHL([]), 700);
  };
  const insertTail = () => {
    const v = Number(value); if (Number.isNaN(v)) { setError("Enter a number"); return; }
    const n = mk(v); setNodes([...nodes, n]); setHL([n.id]);
    setOp(`InsertTail(${v})`); setExplain(`Linked ${v} at tail.`);
    addH(`insertTail(${v})`); setValue(""); setError(null);
    setTimeout(() => setHL([]), 700);
  };
  const insertAt = () => {
    const v = Number(value), i = Number(pos);
    if (Number.isNaN(v) || Number.isNaN(i) || i < 0 || i > nodes.length) { setError("Bad input"); return; }
    const n = mk(v);
    setNodes([...nodes.slice(0, i), n, ...nodes.slice(i)]); setHL([n.id]);
    setOp(`Insert(${v}, ${i})`); setExplain(`Re-linked previous → new node → next.`);
    addH(`insertAt(${v}, ${i})`); setError(null);
    setTimeout(() => setHL([]), 700);
  };
  const removeAt = () => {
    const i = Number(pos);
    if (Number.isNaN(i) || i < 0 || i >= nodes.length) { setError("Bad index"); return; }
    const n = nodes[i]; setHL([n.id]);
    setOp(`Delete(${i})`); setExplain(`Bypass node ${n.value}, free it.`);
    addH(`deleteAt(${i}) → ${n.value}`); setError(null);
    setTimeout(() => { setNodes(ns => ns.filter((_, idx) => idx !== i)); setHL([]); }, 400);
  };
  const traverse = async () => {
    setOp("Traverse"); addH("traverse()");
    for (let i = 0; i < nodes.length; i++) {
      setHL([nodes[i].id]); setExplain(`Visit node[${i}] = ${nodes[i].value}.`);
      await new Promise(r => setTimeout(r, 500));
    }
    setHL([]); setExplain("Traversal complete.");
  };
  const reset = () => { setNodes([]); setHistory([]); setHL([]); setOp(undefined); setExplain(undefined); };
  const random = () => { setNodes(Array.from({ length: 5 }, () => mk(Math.floor(Math.random() * 90) + 10))); addH("random()"); };

  return (
    <ModuleLayout
      left={
        <>
          <div className="glass rounded-xl p-3 flex flex-wrap gap-1">
            {(["singly","doubly","circular"] as Mode[]).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`text-xs rounded-lg px-3 py-1.5 font-medium capitalize transition ${
                  mode === m ? "gradient-bg text-primary-foreground glow" : "hover:bg-secondary"
                }`}>{m}</button>
            ))}
          </div>

          <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-2">
            <input value={value} onChange={e => setValue(e.target.value)} type="number" placeholder="value" className="bg-input/60 rounded-lg px-3 py-2 text-sm w-24 outline-none focus:ring-2 focus:ring-primary" />
            <input value={pos} onChange={e => setPos(e.target.value)} type="number" placeholder="index" className="bg-input/60 rounded-lg px-3 py-2 text-sm w-24 outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={insertHead} className="gradient-bg text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium">Insert Head</button>
            <button onClick={insertTail} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Insert Tail</button>
            <button onClick={insertAt} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Insert @</button>
            <button onClick={removeAt} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Delete @</button>
            <button onClick={traverse} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Traverse</button>
            <div className="flex-1" />
            <button onClick={random} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Random</button>
            <button onClick={reset} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Reset</button>
          </div>
          {error && <div className="rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm px-3 py-2">{error}</div>}

          <div className="glass rounded-xl p-8 min-h-[280px] overflow-x-auto">
            <LayoutGroup>
              <div className="flex items-center gap-2 flex-wrap min-h-[120px]">
                {nodes.length === 0 && <div className="text-muted-foreground italic w-full text-center">List is empty (HEAD → null)</div>}
                <AnimatePresence>
                  {nodes.length > 0 && <motion.div layout className="text-xs font-mono text-primary">HEAD →</motion.div>}
                  {nodes.map((n, i) => {
                    const hl = highlight.has(n.id);
                    return (
                      <motion.div key={n.id} layout
                        initial={{ opacity: 0, scale: 0.5, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0,
                          boxShadow: hl ? "0 0 24px 6px var(--color-highlight)" : "0 4px 12px rgba(0,0,0,0.2)" }}
                        exit={{ opacity: 0, scale: 0.4 }}
                        transition={{ type: "spring", stiffness: 240, damping: 22 }}
                        className="flex items-center gap-2"
                      >
                        <div className="rounded-lg border-2 border-white/20 flex font-mono font-bold overflow-hidden" style={{ background: colorFor(i) }}>
                          {mode === "doubly" && <div className="px-2 py-2 text-xs bg-black/20">←</div>}
                          <div className="px-3 py-2">{n.value}</div>
                          <div className="px-2 py-2 text-xs bg-black/20">→</div>
                        </div>
                        {i < nodes.length - 1 && (
                          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} className="origin-left h-0.5 w-8 bg-primary/60" />
                        )}
                      </motion.div>
                    );
                  })}
                  {nodes.length > 0 && (
                    <motion.div layout className="text-xs font-mono text-muted-foreground">
                      {mode === "circular" ? "↻ HEAD" : "null"}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </LayoutGroup>
          </div>
        </>
      }
      right={
        <>
          <LearningPanel
            currentOp={op} explain={explain}
            content={{
              title: `Linked List · ${mode}`,
              definition: "A linear sequence of nodes where each node points to the next (and optionally previous).",
              working: "Each node holds a value plus a reference. Insertion/deletion is O(1) at known nodes, O(n) by index. No contiguous memory required.",
              realWorld: "Music playlists, undo chains, hash-table buckets, adjacency lists, polynomial representation.",
              pros: ["Dynamic size", "Cheap insert/delete at known nodes", "No reallocation"],
              cons: ["No random access", "Extra memory per pointer", "Cache unfriendly"],
              complexity: { best: "O(1)", avg: "O(n)", worst: "O(n)", space: "O(n)" },
            }}
          />
          <HistoryPanel history={history} />
        </>
      }
    />
  );
}
