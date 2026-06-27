import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ModuleLayout, LearningPanel, HistoryPanel } from "@/components/viz/LearningPanel";
import { useVizEngine } from "@/lib/viz/useVizEngine";
import { VizControls } from "@/components/viz/VizControls";
import { colorFor } from "@/lib/viz/palette";

export const Route = createFileRoute("/array")({
  head: () => ({
    meta: [
      { title: "Array Visualizer — AlgoViz" },
      { name: "description", content: "Insert, delete, search, traverse, reverse and sort with live animations." },
    ],
  }),
  component: ArrayPage,
});

type Cell = { id: number; value: number };
let idGen = 0;
const mkCell = (v: number): Cell => ({ id: ++idGen, value: v });

function ArrayPage() {
  const [arr, setArr] = useState<Cell[]>([10, 25, 42, 7, 33, 19].map(mkCell));
  const [value, setValue] = useState("");
  const [index, setIndex] = useState("");
  const [target, setTarget] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [highlight, setHighlight] = useState<Set<number>>(new Set());
  const [found, setFound] = useState<number | null>(null);
  const [op, setOp] = useState<string>();
  const [explain, setExplain] = useState<string>();
  const engine = useVizEngine();
  const addH = (s: string) => setHistory(h => [...h, s]);

  const setHL = (ids: number[]) => setHighlight(new Set(ids));

  const insert = () => {
    const v = Number(value);
    const i = index === "" ? arr.length : Number(index);
    if (Number.isNaN(v) || i < 0 || i > arr.length) return;
    const cell = mkCell(v);
    setArr(a => [...a.slice(0, i), cell, ...a.slice(i)]);
    setHL([cell.id]); setOp(`Insert(${v}, ${i})`); setExplain(`Inserted ${v} at index ${i}. Elements after shifted right. O(n).`);
    addH(`insert(${v}, ${i})`);
    setTimeout(() => setHL([]), 700);
  };

  const remove = () => {
    const i = Number(index);
    if (Number.isNaN(i) || i < 0 || i >= arr.length) return;
    const cell = arr[i];
    setHL([cell.id]);
    setOp(`Delete(${i})`); setExplain(`Removed ${cell.value}. Elements after shifted left. O(n).`);
    addH(`delete(${i}) → ${cell.value}`);
    setTimeout(() => { setArr(a => a.filter((_, idx) => idx !== i)); setHL([]); }, 400);
  };

  const update = () => {
    const v = Number(value), i = Number(index);
    if (Number.isNaN(v) || Number.isNaN(i) || i < 0 || i >= arr.length) return;
    setArr(a => a.map((c, idx) => idx === i ? { ...c, value: v } : c));
    setHL([arr[i].id]); setOp(`Update(${i})`); setExplain(`arr[${i}] = ${v}. O(1).`);
    addH(`arr[${i}] = ${v}`);
    setTimeout(() => setHL([]), 700);
  };

  const search = () => {
    const t = Number(target); if (Number.isNaN(t)) return;
    const steps = arr.map((c, i) => ({
      apply: () => {
        setHL([c.id]);
        if (c.value === t) { setFound(c.id); setExplain(`Found ${t} at index ${i}.`); }
        else setExplain(`Compare arr[${i}]=${c.value} ≠ ${t}.`);
      },
      explain: `Compare arr[${i}] with ${t}`,
      duration: 500,
    }));
    steps.push({ apply: () => { if (found === null) setExplain(`Value ${t} not found.`); }, explain: `Done`, duration: 300 });
    setOp(`Linear Search(${t})`); setFound(null); addH(`search(${t})`);
    engine.load(steps);
  };

  const traverse = () => {
    const steps = arr.map((c, i) => ({
      apply: () => { setHL([c.id]); setExplain(`Visit arr[${i}] = ${c.value}.`); },
      explain: `Visit index ${i}`, duration: 400,
    }));
    setOp("Traverse"); addH("traverse()"); engine.load(steps);
  };

  const reverse = () => {
    const n = arr.length;
    const steps = [];
    let working = [...arr];
    for (let i = 0; i < Math.floor(n / 2); i++) {
      const a = working[i].id, b = working[n - 1 - i].id;
      steps.push({
        apply: () => {
          setHL([a, b]);
          setArr(curr => {
            const next = [...curr];
            [next[i], next[n - 1 - i]] = [next[n - 1 - i], next[i]];
            return next;
          });
          setExplain(`Swap index ${i} ↔ ${n - 1 - i}.`);
        },
        explain: `Swap ${i} ↔ ${n - 1 - i}`, duration: 500,
      });
      const t = working[i]; working[i] = working[n - 1 - i]; working[n - 1 - i] = t;
    }
    steps.push({ apply: () => { setHL([]); setExplain("Reversal complete."); }, explain: "Done", duration: 300 });
    setOp("Reverse"); addH("reverse()"); engine.load(steps);
  };

  const sort = () => {
    // bubble sort with steps
    const n = arr.length;
    const steps = [];
    let working = [...arr];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        const a = working[j], b = working[j + 1];
        const swap = a.value > b.value;
        steps.push({
          apply: () => {
            setHL([a.id, b.id]);
            if (swap) {
              setArr(curr => {
                const next = [...curr];
                const ia = next.findIndex(x => x.id === a.id);
                const ib = next.findIndex(x => x.id === b.id);
                [next[ia], next[ib]] = [next[ib], next[ia]];
                return next;
              });
              setExplain(`${a.value} > ${b.value} → swap.`);
            } else setExplain(`${a.value} ≤ ${b.value} → keep.`);
          },
          explain: `Compare ${a.value} vs ${b.value}`, duration: 350,
        });
        if (swap) [working[j], working[j + 1]] = [working[j + 1], working[j]];
      }
    }
    steps.push({ apply: () => { setHL([]); setExplain("Sorted!"); }, explain: "Done", duration: 300 });
    setOp("Bubble Sort"); addH("sort()"); engine.load(steps);
  };

  const random = () => {
    const a = Array.from({ length: 7 }, () => Math.floor(Math.random() * 90) + 10).map(mkCell);
    setArr(a); addH("random()");
  };

  return (
    <ModuleLayout
      left={
        <>
          <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-2">
            <input value={value} onChange={e => setValue(e.target.value)} placeholder="value" type="number" className="bg-input/60 rounded-lg px-3 py-2 text-sm w-24 outline-none focus:ring-2 focus:ring-primary" />
            <input value={index} onChange={e => setIndex(e.target.value)} placeholder="index" type="number" className="bg-input/60 rounded-lg px-3 py-2 text-sm w-24 outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={insert} className="gradient-bg text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium">Insert</button>
            <button onClick={remove} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Delete</button>
            <button onClick={update} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Update</button>
            <input value={target} onChange={e => setTarget(e.target.value)} placeholder="search" type="number" className="bg-input/60 rounded-lg px-3 py-2 text-sm w-24 outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={search} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Search</button>
            <button onClick={traverse} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Traverse</button>
            <button onClick={reverse} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Reverse</button>
            <button onClick={sort} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Sort</button>
            <div className="flex-1" />
            <button onClick={random} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Random</button>
          </div>

          <VizControls engine={engine} />

          <div className="glass rounded-xl p-8 min-h-[260px] flex items-center justify-center overflow-x-auto">
            <LayoutGroup>
              <div className="flex items-end gap-2 flex-wrap justify-center">
                <AnimatePresence>
                  {arr.map((c, i) => {
                    const hl = highlight.has(c.id);
                    const isFound = found === c.id;
                    return (
                      <motion.div
                        key={c.id}
                        layout
                        initial={{ opacity: 0, scale: 0.5, y: -20 }}
                        animate={{
                          opacity: 1, scale: 1, y: 0,
                          boxShadow: isFound ? "0 0 30px 8px var(--color-success)" :
                            hl ? "0 0 24px 4px var(--color-highlight)" : "0 4px 12px rgba(0,0,0,0.2)",
                        }}
                        exit={{ opacity: 0, scale: 0.4, y: 20 }}
                        transition={{ type: "spring", stiffness: 260, damping: 22 }}
                        className="flex flex-col items-center"
                      >
                        <div
                          className="w-14 h-14 rounded-lg flex items-center justify-center font-mono font-bold border-2 border-white/20"
                          style={{ background: isFound ? "var(--color-success)" : colorFor(i) }}
                        >
                          {c.value}
                        </div>
                        <div className="text-[10px] mt-1 text-muted-foreground font-mono">[{i}]</div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {arr.length === 0 && <div className="text-muted-foreground italic">Array is empty</div>}
              </div>
            </LayoutGroup>
          </div>
        </>
      }
      right={
        <>
          <LearningPanel
            currentOp={op} explain={explain ?? engine.state.explain}
            content={{
              title: "Array",
              definition: "Contiguous, index-addressable collection of elements of the same type.",
              working: "Indexing is O(1). Insertion/deletion shifts neighbors, costing O(n). Search is O(n) linear or O(log n) when sorted.",
              realWorld: "Image pixel buffers, lookup tables, dynamic vectors, database row pages.",
              pros: ["O(1) random access", "Cache friendly", "Simple model"],
              cons: ["Shifting on insert/delete", "Fixed capacity (static)", "Wasted space if oversized"],
              complexity: { best: "O(1)", avg: "O(n)", worst: "O(n)", space: "O(n)" },
            }}
          />
          <HistoryPanel history={history} />
        </>
      }
    />
  );
}
