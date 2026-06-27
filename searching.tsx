import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModuleLayout, LearningPanel, HistoryPanel } from "@/components/viz/LearningPanel";
import { useVizEngine } from "@/lib/viz/useVizEngine";
import { VizControls } from "@/components/viz/VizControls";
import { colorFor } from "@/lib/viz/palette";

export const Route = createFileRoute("/searching")({
  head: () => ({
    meta: [
      { title: "Searching Visualizer — AlgoViz" },
      { name: "description", content: "Linear and binary search with animated comparisons." },
    ],
  }),
  component: SearchPage,
});

type Algo = "linear" | "binary";

function SearchPage() {
  const [algo, setAlgo] = useState<Algo>("binary");
  const [arr, setArr] = useState<number[]>([3, 9, 14, 21, 28, 35, 42, 56, 67, 71, 80]);
  const [target, setTarget] = useState("28");
  const [highlight, setHighlight] = useState<Set<number>>(new Set());
  const [range, setRange] = useState<[number, number] | null>(null);
  const [found, setFound] = useState<number | null>(null);
  const [op, setOp] = useState<string>();
  const [explain, setExplain] = useState<string>();
  const [history, setHistory] = useState<string[]>([]);
  const engine = useVizEngine();

  const run = () => {
    const t = Number(target); if (Number.isNaN(t)) return;
    setFound(null);
    const steps: { apply: () => void; explain: string; duration: number }[] = [];
    if (algo === "linear") {
      for (let i = 0; i < arr.length; i++) {
        steps.push({
          apply: () => { setHighlight(new Set([i])); setExplain(`arr[${i}]=${arr[i]} ${arr[i] === t ? "= target" : "≠ target"}`); if (arr[i] === t) setFound(i); },
          explain: `Check index ${i}`, duration: 450,
        });
        if (arr[i] === t) break;
      }
    } else {
      const sorted = [...arr].sort((a, b) => a - b);
      setArr(sorted);
      let lo = 0, hi = sorted.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const _lo = lo, _hi = hi, _mid = mid;
        steps.push({
          apply: () => { setRange([_lo, _hi]); setHighlight(new Set([_mid])); setExplain(`lo=${_lo}, hi=${_hi}, mid=${_mid} → ${sorted[_mid]}`); },
          explain: `Inspect mid ${mid}`, duration: 600,
        });
        if (sorted[mid] === t) { steps.push({ apply: () => setFound(mid), explain: "Found!", duration: 400 }); break; }
        if (sorted[mid] < t) lo = mid + 1; else hi = mid - 1;
      }
      if (lo > hi) steps.push({ apply: () => setExplain("Not found."), explain: "exhausted", duration: 300 });
    }
    setOp(`${algo} search(${t})`); setHistory(h => [...h, `${algo}(${t})`]);
    setRange(null);
    engine.load(steps);
  };

  const random = () => {
    const a = Array.from(new Set(Array.from({ length: 11 }, () => Math.floor(Math.random() * 90) + 10))).sort((x, y) => x - y);
    setArr(a); setFound(null); setHighlight(new Set()); setRange(null); engine.reset();
  };

  return (
    <ModuleLayout
      left={
        <>
          <div className="glass rounded-xl p-3 flex flex-wrap gap-1">
            {(["linear", "binary"] as Algo[]).map(a => (
              <button key={a} onClick={() => { setAlgo(a); engine.reset(); setHighlight(new Set()); setFound(null); setRange(null); }}
                className={`text-xs rounded-lg px-3 py-1.5 font-medium capitalize transition ${
                  algo === a ? "gradient-bg text-primary-foreground glow" : "hover:bg-secondary"
                }`}>{a}</button>
            ))}
          </div>
          <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-2">
            <input value={target} onChange={e => setTarget(e.target.value)} type="number" placeholder="target"
              className="bg-input/60 rounded-lg px-3 py-2 text-sm w-28 outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={run} className="gradient-bg text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium glow">Search</button>
            <button onClick={random} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Random</button>
          </div>

          <VizControls engine={engine} />

          <div className="glass rounded-xl p-8 min-h-[200px] flex items-center justify-center overflow-x-auto">
            <div className="flex items-end gap-2">
              <AnimatePresence>
                {arr.map((v, i) => {
                  const isHL = highlight.has(i);
                  const isFound = found === i;
                  const inRange = range && i >= range[0] && i <= range[1];
                  const bg = isFound ? "var(--color-success)" :
                    isHL ? "var(--color-highlight)" :
                    inRange ? "var(--color-primary)" :
                    "var(--color-muted)";
                  const op = inRange === false && algo === "binary" ? 0.4 : 1;
                  return (
                    <motion.div key={i} layout
                      animate={{ backgroundColor: bg, opacity: op,
                        boxShadow: isFound ? "0 0 30px 8px var(--color-success)" : isHL ? "0 0 24px 4px var(--color-highlight)" : "none" }}
                      className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-lg flex items-center justify-center font-mono font-bold border-2 border-white/20 text-foreground/95">{v}</div>
                      <div className="text-[10px] mt-1 text-muted-foreground font-mono">[{i}]</div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </>
      }
      right={
        <>
          <LearningPanel
            currentOp={op} explain={explain ?? engine.state.explain}
            content={{
              title: algo === "binary" ? "Binary Search" : "Linear Search",
              definition: algo === "binary"
                ? "Search a sorted array by halving the range each step."
                : "Scan each element from left to right until found.",
              working: algo === "binary"
                ? "Compare target with mid; eliminate the half that can't contain target; repeat."
                : "Compare each element to the target; stop on match.",
              realWorld: "Phone books, sorted databases, IP lookups, autocomplete.",
              pros: algo === "binary" ? ["Logarithmic time", "Few comparisons"] : ["Works on any array", "No sort needed"],
              cons: algo === "binary" ? ["Requires sorted array"] : ["Slow on big inputs"],
              complexity: algo === "binary"
                ? { best: "O(1)", avg: "O(log n)", worst: "O(log n)", space: "O(1)" }
                : { best: "O(1)", avg: "O(n)", worst: "O(n)", space: "O(1)" },
            }}
          />
          <HistoryPanel history={history} />
        </>
      }
    />
  );
}
