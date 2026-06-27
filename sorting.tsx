import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ModuleLayout, LearningPanel, HistoryPanel } from "@/components/viz/LearningPanel";
import { useVizEngine } from "@/lib/viz/useVizEngine";
import { VizControls } from "@/components/viz/VizControls";

export const Route = createFileRoute("/sorting")({
  head: () => ({
    meta: [
      { title: "Sorting Visualizer — AlgoViz" },
      { name: "description", content: "Bubble, selection, insertion, merge, quick, and heap sort with animated comparisons." },
    ],
  }),
  component: SortingPage,
});

type Algo = "bubble" | "selection" | "insertion" | "merge" | "quick" | "heap";
type Bar = { id: number; value: number };
let idGen = 0;
const mk = (v: number): Bar => ({ id: ++idGen, value: v });

type Step = { arr: Bar[]; compare?: number[]; swap?: number[]; sorted?: number[]; pivot?: number; explain: string };

function bubble(initial: Bar[]): Step[] {
  const a = initial.map(b => ({ ...b }));
  const steps: Step[] = [];
  const n = a.length; const sorted: number[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({ arr: a.map(b => ({ ...b })), compare: [j, j + 1], sorted: [...sorted], explain: `Compare ${a[j].value} vs ${a[j+1].value}` });
      if (a[j].value > a[j + 1].value) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push({ arr: a.map(b => ({ ...b })), swap: [j, j + 1], sorted: [...sorted], explain: `Swap → ${a[j].value}, ${a[j+1].value}` });
      }
    }
    sorted.push(n - i - 1);
  }
  steps.push({ arr: a, sorted: a.map((_, i) => i), explain: "Sorted!" });
  return steps;
}
function selection(initial: Bar[]): Step[] {
  const a = initial.map(b => ({ ...b }));
  const steps: Step[] = []; const sorted: number[] = [];
  for (let i = 0; i < a.length; i++) {
    let m = i;
    for (let j = i + 1; j < a.length; j++) {
      steps.push({ arr: a.map(b => ({ ...b })), compare: [m, j], sorted: [...sorted], explain: `Min so far ${a[m].value} vs ${a[j].value}` });
      if (a[j].value < a[m].value) m = j;
    }
    if (m !== i) { [a[i], a[m]] = [a[m], a[i]]; steps.push({ arr: a.map(b => ({ ...b })), swap: [i, m], sorted: [...sorted], explain: `Place min at ${i}` }); }
    sorted.push(i);
  }
  steps.push({ arr: a, sorted: a.map((_, i) => i), explain: "Sorted!" }); return steps;
}
function insertion(initial: Bar[]): Step[] {
  const a = initial.map(b => ({ ...b })); const steps: Step[] = [];
  for (let i = 1; i < a.length; i++) {
    let j = i;
    while (j > 0 && a[j - 1].value > a[j].value) {
      steps.push({ arr: a.map(b => ({ ...b })), compare: [j - 1, j], explain: `Shift ${a[j-1].value} right` });
      [a[j - 1], a[j]] = [a[j], a[j - 1]];
      steps.push({ arr: a.map(b => ({ ...b })), swap: [j - 1, j], explain: `Move into place` });
      j--;
    }
  }
  steps.push({ arr: a, sorted: a.map((_, i) => i), explain: "Sorted!" }); return steps;
}
function merge(initial: Bar[]): Step[] {
  const a = initial.map(b => ({ ...b })); const steps: Step[] = [];
  function ms(l: number, r: number) {
    if (l >= r) return;
    const m = (l + r) >> 1;
    ms(l, m); ms(m + 1, r);
    const tmp: Bar[] = []; let i = l, j = m + 1;
    while (i <= m && j <= r) {
      steps.push({ arr: a.map(b => ({ ...b })), compare: [i, j], explain: `Merge: compare ${a[i].value} vs ${a[j].value}` });
      if (a[i].value <= a[j].value) tmp.push(a[i++]); else tmp.push(a[j++]);
    }
    while (i <= m) tmp.push(a[i++]); while (j <= r) tmp.push(a[j++]);
    for (let k = 0; k < tmp.length; k++) a[l + k] = tmp[k];
    steps.push({ arr: a.map(b => ({ ...b })), sorted: Array.from({ length: r - l + 1 }, (_, k) => l + k), explain: `Merged [${l}..${r}]` });
  }
  ms(0, a.length - 1);
  steps.push({ arr: a, sorted: a.map((_, i) => i), explain: "Sorted!" }); return steps;
}
function quick(initial: Bar[]): Step[] {
  const a = initial.map(b => ({ ...b })); const steps: Step[] = [];
  function qs(l: number, r: number) {
    if (l >= r) return;
    const pivot = a[r].value;
    let i = l;
    for (let j = l; j < r; j++) {
      steps.push({ arr: a.map(b => ({ ...b })), compare: [j, r], pivot: r, explain: `Compare ${a[j].value} with pivot ${pivot}` });
      if (a[j].value < pivot) {
        [a[i], a[j]] = [a[j], a[i]];
        steps.push({ arr: a.map(b => ({ ...b })), swap: [i, j], pivot: r, explain: `Move smaller left` });
        i++;
      }
    }
    [a[i], a[r]] = [a[r], a[i]];
    steps.push({ arr: a.map(b => ({ ...b })), swap: [i, r], pivot: i, explain: `Place pivot at ${i}` });
    qs(l, i - 1); qs(i + 1, r);
  }
  qs(0, a.length - 1);
  steps.push({ arr: a, sorted: a.map((_, i) => i), explain: "Sorted!" }); return steps;
}
function heapSort(initial: Bar[]): Step[] {
  const a = initial.map(b => ({ ...b })); const steps: Step[] = [];
  const n = a.length;
  const sift = (size: number, i: number) => {
    while (true) {
      const l = 2 * i + 1, r = 2 * i + 2; let big = i;
      if (l < size && a[l].value > a[big].value) big = l;
      if (r < size && a[r].value > a[big].value) big = r;
      if (big === i) return;
      steps.push({ arr: a.map(b => ({ ...b })), compare: [i, big], explain: `Sift down ${i} ↔ ${big}` });
      [a[i], a[big]] = [a[big], a[i]];
      steps.push({ arr: a.map(b => ({ ...b })), swap: [i, big], explain: `Swap` });
      i = big;
    }
  };
  for (let i = (n >> 1) - 1; i >= 0; i--) sift(n, i);
  const sorted: number[] = [];
  for (let end = n - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end], a[0]];
    sorted.unshift(end);
    steps.push({ arr: a.map(b => ({ ...b })), swap: [0, end], sorted: [...sorted], explain: `Move max to position ${end}` });
    sift(end, 0);
  }
  steps.push({ arr: a, sorted: a.map((_, i) => i), explain: "Sorted!" }); return steps;
}

const algoFn: Record<Algo, (a: Bar[]) => Step[]> = { bubble, selection, insertion, merge, quick, heap: heapSort };

const complexity: Record<Algo, { best: string; avg: string; worst: string; space: string }> = {
  bubble: { best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" },
  selection: { best: "O(n²)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" },
  insertion: { best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" },
  merge: { best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(n)" },
  quick: { best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)", space: "O(log n)" },
  heap: { best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(1)" },
};

function SortingPage() {
  const [algo, setAlgo] = useState<Algo>("quick");
  const [bars, setBars] = useState<Bar[]>(() => Array.from({ length: 14 }, () => mk(Math.floor(Math.random() * 90) + 10)));
  const [snapshot, setSnapshot] = useState<Step | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const engine = useVizEngine();

  const run = () => {
    const steps = algoFn[algo](bars);
    const vizSteps = steps.map(s => ({ apply: () => setSnapshot(s), explain: s.explain, duration: 250 }));
    setHistory(h => [...h, `${algo} sort`]);
    engine.load(vizSteps);
  };

  const random = (n = 14) => {
    setBars(Array.from({ length: n }, () => mk(Math.floor(Math.random() * 90) + 10)));
    setSnapshot(null); engine.reset();
  };
  const custom = (text: string) => {
    const arr = text.split(",").map(s => Number(s.trim())).filter(v => !Number.isNaN(v));
    if (arr.length) { setBars(arr.map(mk)); setSnapshot(null); engine.reset(); }
  };

  const view = snapshot ?? { arr: bars, explain: "Ready" };
  const max = useMemo(() => Math.max(...view.arr.map(b => b.value), 1), [view]);

  return (
    <ModuleLayout
      left={
        <>
          <div className="glass rounded-xl p-3 flex flex-wrap gap-1">
            {(Object.keys(algoFn) as Algo[]).map(a => (
              <button key={a} onClick={() => { setAlgo(a); engine.reset(); setSnapshot(null); }}
                className={`text-xs rounded-lg px-3 py-1.5 font-medium capitalize transition ${
                  algo === a ? "gradient-bg text-primary-foreground glow" : "hover:bg-secondary"
                }`}>{a}</button>
            ))}
          </div>
          <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-2">
            <button onClick={run} className="gradient-bg text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium glow">Run {algo}</button>
            <button onClick={() => random(8)} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Random 8</button>
            <button onClick={() => random(14)} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Random 14</button>
            <button onClick={() => random(24)} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Random 24</button>
            <input placeholder="custom: 5, 2, 9, 1"
              onKeyDown={e => { if (e.key === "Enter") custom((e.target as HTMLInputElement).value); }}
              className="flex-1 min-w-[200px] bg-input/60 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <VizControls engine={engine} />

          <div className="glass rounded-xl p-4 min-h-[340px] flex items-end justify-center gap-1.5 overflow-x-auto">
            <LayoutGroup>
              <AnimatePresence>
                {view.arr.map((b, i) => {
                  const isComp = view.compare?.includes(i);
                  const isSwap = view.swap?.includes(i);
                  const isSorted = view.sorted?.includes(i);
                  const isPivot = view.pivot === i;
                  const color = isSorted ? "var(--color-success)" : isPivot ? "var(--color-warning)" :
                    isSwap ? "var(--color-accent)" : isComp ? "var(--color-highlight)" : "var(--color-primary)";
                  return (
                    <motion.div key={b.id} layout
                      animate={{ height: (b.value / max) * 280 + 24, backgroundColor: color }}
                      transition={{ type: "spring", stiffness: 280, damping: 24 }}
                      className="w-7 sm:w-8 rounded-t-md flex items-end justify-center font-mono text-[10px] font-bold text-foreground/95 pb-1"
                    >{b.value}</motion.div>
                  );
                })}
              </AnimatePresence>
            </LayoutGroup>
          </div>
        </>
      }
      right={
        <>
          <LearningPanel
            currentOp={`${algo.charAt(0).toUpperCase() + algo.slice(1)} Sort`}
            explain={view.explain}
            content={{
              title: `${algo.charAt(0).toUpperCase() + algo.slice(1)} Sort`,
              definition: descriptionOf(algo),
              working: workingOf(algo),
              realWorld: "Used in language runtimes, databases, search engines, and many libraries.",
              pros: prosOf(algo),
              cons: consOf(algo),
              complexity: complexity[algo],
            }}
          />
          <HistoryPanel history={history} />
        </>
      }
    />
  );
}

function descriptionOf(a: Algo) {
  return {
    bubble: "Repeatedly swap adjacent out-of-order elements until the array is sorted.",
    selection: "Find the minimum each pass and place it at the front.",
    insertion: "Grow a sorted prefix by inserting each new element into its place.",
    merge: "Divide the array in halves, sort each, then merge in linear time.",
    quick: "Partition around a pivot, then recursively sort the partitions.",
    heap: "Build a max-heap, then repeatedly extract the maximum to the end.",
  }[a];
}
function workingOf(a: Algo) {
  return {
    bubble: "Compare each adjacent pair; swap when needed; repeat until no swaps.",
    selection: "Scan unsorted region for minimum; swap into the boundary.",
    insertion: "Take next element; shift larger sorted elements right; insert.",
    merge: "Recursively split until size 1; merge sorted halves with two pointers.",
    quick: "Choose pivot; partition smaller-left, larger-right; recurse.",
    heap: "Heapify, then swap root with last and sift down on shrinking heap.",
  }[a];
}
function prosOf(a: Algo): string[] {
  return {
    bubble: ["Easy to implement", "Stable"],
    selection: ["Minimal writes", "Simple"],
    insertion: ["Fast on nearly-sorted data", "Stable", "In-place"],
    merge: ["Guaranteed O(n log n)", "Stable", "Predictable"],
    quick: ["Typically fastest in practice", "In-place average"],
    heap: ["Guaranteed O(n log n)", "In-place"],
  }[a];
}
function consOf(a: Algo): string[] {
  return {
    bubble: ["Very slow for large n"],
    selection: ["O(n²) regardless of input", "Not stable"],
    insertion: ["Slow on large random data"],
    merge: ["Requires O(n) extra memory"],
    quick: ["O(n²) worst case", "Not stable"],
    heap: ["Not stable", "Cache unfriendly"],
  }[a];
}
