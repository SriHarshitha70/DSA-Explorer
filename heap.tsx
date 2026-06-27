import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModuleLayout, LearningPanel, HistoryPanel } from "@/components/viz/LearningPanel";
import { colorFor } from "@/lib/viz/palette";

export const Route = createFileRoute("/heap")({
  head: () => ({
    meta: [
      { title: "Heap Visualizer — AlgoViz" },
      { name: "description", content: "Min and max heap with animated swaps in both tree and array view." },
    ],
  }),
  component: HeapPage,
});

type Mode = "min" | "max";

function HeapPage() {
  const [mode, setMode] = useState<Mode>("max");
  const [arr, setArr] = useState<number[]>([]);
  const [value, setValue] = useState("");
  const [highlight, setHighlight] = useState<Set<number>>(new Set());
  const [history, setHistory] = useState<string[]>([]);
  const [op, setOp] = useState<string>();
  const [explain, setExplain] = useState<string>();

  const cmp = (a: number, b: number) => mode === "max" ? a > b : a < b;

  const animate = async (steps: { arr: number[]; hl: number[]; explain: string }[]) => {
    for (const s of steps) {
      setArr([...s.arr]); setHighlight(new Set(s.hl)); setExplain(s.explain);
      await new Promise(r => setTimeout(r, 450));
    }
    setHighlight(new Set());
  };

  const push = async () => {
    const v = Number(value); if (Number.isNaN(v)) return;
    const next = [...arr, v];
    const steps = [{ arr: [...next], hl: [next.length - 1], explain: `Append ${v} at index ${next.length - 1}.` }];
    let i = next.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (cmp(next[i], next[p])) {
        [next[i], next[p]] = [next[p], next[i]];
        steps.push({ arr: [...next], hl: [i, p], explain: `Swap with parent at ${p}.` });
        i = p;
      } else break;
    }
    setOp(`Push(${v})`); setHistory(h => [...h, `push(${v})`]); setValue("");
    await animate(steps);
  };

  const pop = async () => {
    if (arr.length === 0) return;
    const root = arr[0];
    const next = [...arr];
    setOp("Extract"); setHistory(h => [...h, `extract() → ${root}`]);
    const steps: { arr: number[]; hl: number[]; explain: string }[] = [];
    steps.push({ arr: [...next], hl: [0], explain: `Extract root = ${root}.` });
    const last = next.pop()!;
    if (next.length > 0) {
      next[0] = last;
      steps.push({ arr: [...next], hl: [0], explain: `Move last value to root.` });
      let i = 0;
      while (true) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let best = i;
        if (l < next.length && cmp(next[l], next[best])) best = l;
        if (r < next.length && cmp(next[r], next[best])) best = r;
        if (best === i) break;
        [next[i], next[best]] = [next[best], next[i]];
        steps.push({ arr: [...next], hl: [i, best], explain: `Sift down: swap with child ${best}.` });
        i = best;
      }
    }
    await animate(steps);
  };

  const heapify = async () => {
    const next = [...arr];
    const steps: { arr: number[]; hl: number[]; explain: string }[] = [{ arr: [...next], hl: [], explain: "Begin heapify." }];
    for (let i = Math.floor(next.length / 2) - 1; i >= 0; i--) {
      let k = i;
      while (true) {
        const l = 2 * k + 1, r = 2 * k + 2;
        let best = k;
        if (l < next.length && cmp(next[l], next[best])) best = l;
        if (r < next.length && cmp(next[r], next[best])) best = r;
        if (best === k) break;
        [next[k], next[best]] = [next[best], next[k]];
        steps.push({ arr: [...next], hl: [k, best], explain: `Sift down index ${k}.` });
        k = best;
      }
    }
    setOp("Heapify"); setHistory(h => [...h, "heapify()"]);
    await animate(steps);
  };

  const random = () => {
    setArr(Array.from({ length: 7 }, () => Math.floor(Math.random() * 90) + 10));
    setHistory(h => [...h, "random()"]);
  };
  const reset = () => { setArr([]); setHistory([]); setOp(undefined); setExplain(undefined); };

  const positions = useMemo(() => {
    const out: { v: number; i: number; x: number; y: number }[] = [];
    const levels = Math.floor(Math.log2(Math.max(arr.length, 1))) + 1;
    const W = Math.max(640, 2 ** (levels - 1) * 60);
    for (let i = 0; i < arr.length; i++) {
      const depth = Math.floor(Math.log2(i + 1));
      const indexInLevel = i - (2 ** depth - 1);
      const nodesInLevel = 2 ** depth;
      const x = ((indexInLevel + 0.5) / nodesInLevel) * W;
      out.push({ v: arr[i], i, x, y: depth * 80 + 30 });
    }
    return { items: out, width: W, height: levels * 80 + 30 };
  }, [arr]);

  return (
    <ModuleLayout
      left={
        <>
          <div className="glass rounded-xl p-3 flex flex-wrap gap-1">
            {(["max", "min"] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); reset(); }}
                className={`text-xs rounded-lg px-3 py-1.5 font-medium uppercase transition ${
                  mode === m ? "gradient-bg text-primary-foreground glow" : "hover:bg-secondary"
                }`}>{m}-Heap</button>
            ))}
          </div>
          <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-2">
            <input value={value} onChange={e => setValue(e.target.value)} type="number" placeholder="value"
              className="bg-input/60 rounded-lg px-3 py-2 text-sm w-28 outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={push} className="gradient-bg text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium">Insert</button>
            <button onClick={pop} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Extract {mode === "max" ? "Max" : "Min"}</button>
            <button onClick={heapify} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Heapify</button>
            <div className="flex-1" />
            <button onClick={random} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Random</button>
            <button onClick={reset} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Reset</button>
          </div>

          <div className="glass rounded-xl p-4 min-h-[360px] overflow-auto">
            {arr.length === 0 && <div className="text-center text-muted-foreground italic py-16">Empty heap</div>}
            <svg width={positions.width} height={positions.height} className="mx-auto block">
              {positions.items.map(({ i, x, y }) => {
                const l = 2 * i + 1, r = 2 * i + 2;
                return (
                  <g key={`e${i}`}>
                    {l < positions.items.length && <line x1={x} y1={y} x2={positions.items[l].x} y2={positions.items[l].y} stroke="var(--color-border)" strokeWidth={2} />}
                    {r < positions.items.length && <line x1={x} y1={y} x2={positions.items[r].x} y2={positions.items[r].y} stroke="var(--color-border)" strokeWidth={2} />}
                  </g>
                );
              })}
              <AnimatePresence>
                {positions.items.map(({ v, i, x, y }) => {
                  const hl = highlight.has(i);
                  return (
                    <motion.g key={i} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1, x, y }} exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 240, damping: 22 }}>
                      <circle r={22} fill={hl ? "var(--color-highlight)" : colorFor(i)} stroke="white" strokeWidth={2} />
                      <text textAnchor="middle" y={5} fill="white" fontFamily="JetBrains Mono" fontWeight={700} fontSize={13}>{v}</text>
                    </motion.g>
                  );
                })}
              </AnimatePresence>
            </svg>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Array view</div>
            <div className="flex gap-2 flex-wrap">
              {arr.length === 0 && <span className="italic text-muted-foreground text-sm">[]</span>}
              <AnimatePresence>
                {arr.map((v, i) => (
                  <motion.div key={i} layout
                    initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                    className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center font-mono font-bold border-2 border-white/20"
                      style={{ background: highlight.has(i) ? "var(--color-highlight)" : colorFor(i) }}>{v}</div>
                    <div className="text-[10px] mt-1 text-muted-foreground font-mono">[{i}]</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </>
      }
      right={
        <>
          <LearningPanel
            currentOp={op} explain={explain}
            content={{
              title: `${mode === "max" ? "Max" : "Min"} Heap`,
              definition: "Complete binary tree where each parent is " + (mode === "max" ? "greater" : "smaller") + " than its children.",
              working: "Stored as an array — children of index i live at 2i+1 and 2i+2. Insert sifts up, extract swaps root with last and sifts down.",
              realWorld: "Priority queues, Dijkstra/Prim, OS scheduling, top-K problems, heap sort.",
              pros: ["O(log n) push/pop", "Cache-friendly array storage", "O(n) build via heapify"],
              cons: ["Not sorted overall", "Search is O(n)", "Tree must stay complete"],
              complexity: { best: "O(1)", avg: "O(log n)", worst: "O(log n)", space: "O(n)" },
            }}
          />
          <HistoryPanel history={history} />
        </>
      }
    />
  );
}
