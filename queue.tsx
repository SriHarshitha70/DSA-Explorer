import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ModuleLayout, LearningPanel, HistoryPanel } from "@/components/viz/LearningPanel";
import { colorFor } from "@/lib/viz/palette";

export const Route = createFileRoute("/queue")({
  head: () => ({
    meta: [
      { title: "Queue Visualizer — AlgoViz" },
      { name: "description", content: "Simple, circular, deque, priority queues with animated front and rear pointers." },
    ],
  }),
  component: QueuePage,
});

type Mode = "simple" | "circular" | "deque" | "in-restricted" | "out-restricted" | "priority";
type Item = { id: number; value: number; priority?: number };
let idGen = 0;
const mk = (v: number, p?: number): Item => ({ id: ++idGen, value: v, priority: p });

function QueuePage() {
  const [mode, setMode] = useState<Mode>("simple");
  const [items, setItems] = useState<Item[]>([]);
  const [capacity, setCapacity] = useState(8);
  const [front, setFront] = useState(0);
  const [rear, setRear] = useState(0);
  const [size, setSize] = useState(0);
  const [circular, setCircular] = useState<(Item | null)[]>(Array(8).fill(null));
  const [value, setValue] = useState("");
  const [priority, setPriority] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [op, setOp] = useState<string>();
  const [explain, setExplain] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const addH = (s: string) => setHistory(h => [...h, s]);

  const reset = () => {
    setItems([]); setCircular(Array(capacity).fill(null));
    setFront(0); setRear(0); setSize(0); setHistory([]); setOp(undefined); setExplain(undefined); setError(null);
  };

  const changeMode = (m: Mode) => { setMode(m); reset(); };

  const enqueueRear = () => {
    setError(null);
    const v = Number(value); if (Number.isNaN(v)) { setError("Enter a number"); return; }
    if (mode === "circular") {
      if (size >= capacity) { setError("Queue full"); return; }
      const next = [...circular]; next[rear] = mk(v);
      setCircular(next); setHighlight(next[rear]!.id); setRear((rear + 1) % capacity); setSize(size + 1);
      setOp(`Enqueue(${v})`); setExplain(`Inserted at rear=${rear}. size=${size + 1}/${capacity}.`);
    } else if (mode === "priority") {
      const p = Number(priority); if (Number.isNaN(p)) { setError("Enter a priority"); return; }
      const it = mk(v, p);
      const next = [...items, it].sort((a, b) => (b.priority! - a.priority!));
      setItems(next); setHighlight(it.id);
      setOp(`Insert(${v}, p=${p})`); setExplain(`Inserted with priority ${p}, re-ordered.`);
    } else {
      const it = mk(v);
      setItems(i => [...i, it]); setHighlight(it.id);
      setOp(`Enqueue(${v})`); setExplain(`Added at rear.`);
    }
    addH(`enqueueRear(${v}${mode === "priority" ? `, p=${priority}` : ""})`);
    setValue(""); setPriority("");
    setTimeout(() => setHighlight(null), 700);
  };

  const enqueueFront = () => {
    setError(null);
    if (mode !== "deque" && mode !== "in-restricted") { setError("Not allowed in this mode"); return; }
    if (mode === "in-restricted") { setError("Insertion restricted to rear"); return; }
    const v = Number(value); if (Number.isNaN(v)) { setError("Enter a number"); return; }
    const it = mk(v);
    setItems(i => [it, ...i]); setHighlight(it.id);
    setOp(`EnqueueFront(${v})`); setExplain(`Inserted at front.`);
    addH(`enqueueFront(${v})`); setValue("");
    setTimeout(() => setHighlight(null), 700);
  };

  const dequeueFront = () => {
    setError(null);
    if (mode === "circular") {
      if (size === 0) { setError("Empty"); return; }
      const it = circular[front]!;
      setHighlight(it.id);
      setOp("Dequeue()"); setExplain(`Removed front=${front}, value=${it.value}.`);
      addH(`dequeueFront() → ${it.value}`);
      setTimeout(() => {
        const next = [...circular]; next[front] = null;
        setCircular(next); setFront((front + 1) % capacity); setSize(s => s - 1); setHighlight(null);
      }, 350);
    } else {
      if (items.length === 0) { setError("Empty"); return; }
      const it = items[0]; setHighlight(it.id);
      setOp("Dequeue()"); setExplain(`Removed front value ${it.value}.`);
      addH(`dequeueFront() → ${it.value}`);
      setTimeout(() => { setItems(i => i.slice(1)); setHighlight(null); }, 350);
    }
  };

  const dequeueRear = () => {
    setError(null);
    if (mode !== "deque" && mode !== "out-restricted") { setError("Not allowed in this mode"); return; }
    if (mode === "out-restricted") { setError("Deletion restricted to front"); return; }
    if (items.length === 0) { setError("Empty"); return; }
    const it = items[items.length - 1]; setHighlight(it.id);
    setOp("DequeueRear()"); setExplain(`Removed rear value ${it.value}.`);
    addH(`dequeueRear() → ${it.value}`);
    setTimeout(() => { setItems(i => i.slice(0, -1)); setHighlight(null); }, 350);
  };

  const random = () => {
    const arr = Array.from({ length: 4 }, () => mk(Math.floor(Math.random() * 90) + 10, Math.floor(Math.random() * 10)));
    if (mode === "circular") {
      const next = Array(capacity).fill(null) as (Item | null)[];
      arr.forEach((a, i) => next[i] = a);
      setCircular(next); setFront(0); setRear(arr.length); setSize(arr.length);
    } else if (mode === "priority") {
      setItems([...arr].sort((a, b) => (b.priority! - a.priority!)));
    } else setItems(arr);
    addH(`random()`);
  };

  return (
    <ModuleLayout
      left={
        <>
          <div className="glass rounded-xl p-3 flex flex-wrap gap-1">
            {(["simple","circular","deque","in-restricted","out-restricted","priority"] as Mode[]).map(m => (
              <button key={m} onClick={() => changeMode(m)}
                className={`text-xs rounded-lg px-3 py-1.5 font-medium capitalize transition ${
                  mode === m ? "gradient-bg text-primary-foreground glow" : "hover:bg-secondary"
                }`}>
                {m.replace("-", " ")}
              </button>
            ))}
          </div>

          <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-2">
            <input value={value} onChange={e => setValue(e.target.value)} type="number" placeholder="value" className="bg-input/60 rounded-lg px-3 py-2 text-sm w-24 outline-none focus:ring-2 focus:ring-primary" />
            {mode === "priority" && <input value={priority} onChange={e => setPriority(e.target.value)} type="number" placeholder="priority" className="bg-input/60 rounded-lg px-3 py-2 text-sm w-24 outline-none focus:ring-2 focus:ring-primary" />}
            <button onClick={enqueueRear} className="gradient-bg text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium">Enqueue Rear</button>
            {(mode === "deque") && <button onClick={enqueueFront} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Enqueue Front</button>}
            <button onClick={dequeueFront} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Dequeue Front</button>
            {(mode === "deque") && <button onClick={dequeueRear} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Dequeue Rear</button>}
            <div className="flex-1" />
            {mode === "circular" && (
              <div className="flex items-center gap-2 text-xs">
                <span>Capacity</span>
                <input type="number" value={capacity} min={3} max={16}
                  onChange={e => { const c = Math.max(3, Math.min(16, Number(e.target.value) || 3)); setCapacity(c); setCircular(Array(c).fill(null)); setFront(0); setRear(0); setSize(0); }}
                  className="bg-input/60 rounded-lg px-2 py-1 w-16 outline-none" />
              </div>
            )}
            <button onClick={random} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Random</button>
            <button onClick={reset} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Reset</button>
          </div>
          {error && <div className="rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm px-3 py-2">{error}</div>}

          <div className="glass rounded-xl p-8 min-h-[320px] flex items-center justify-center overflow-x-auto">
            {mode === "circular" ? (
              <CircularView slots={circular} front={front} rear={rear} size={size} highlight={highlight} />
            ) : (
              <LinearView items={items} highlight={highlight} mode={mode} />
            )}
          </div>
        </>
      }
      right={
        <>
          <LearningPanel
            currentOp={op} explain={explain}
            content={{
              title: `Queue · ${mode}`,
              definition: "FIFO data structure where insertion happens at the rear and removal at the front.",
              working: "Variants change which ends are usable: deque uses both, restricted versions limit one operation, priority queue orders by priority. Circular queues reuse slots.",
              realWorld: "Print spoolers, request scheduling, BFS frontiers, message brokers, OS task queues.",
              pros: ["Predictable FIFO order", "Constant-time enqueue/dequeue", "Useful in scheduling"],
              cons: ["No random access", "Simple queue wastes space without circular wrap", "Priority queue ordering costs O(log n)"],
              complexity: { best: "O(1)", avg: "O(1)", worst: mode === "priority" ? "O(n)" : "O(1)", space: "O(n)" },
            }}
          />
          <HistoryPanel history={history} />
        </>
      }
    />
  );
}

function LinearView({ items, highlight, mode }: { items: Item[]; highlight: number | null; mode: Mode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex justify-between w-full text-xs font-mono text-primary px-2">
        <span>← FRONT</span><span>REAR →</span>
      </div>
      <LayoutGroup>
        <div className="flex gap-2 items-end">
          <AnimatePresence>
            {items.map((it, i) => (
              <motion.div
                key={it.id} layout
                initial={{ opacity: 0, scale: 0.5, x: 40 }}
                animate={{ opacity: 1, scale: 1, x: 0,
                  boxShadow: highlight === it.id ? "0 0 24px 4px var(--color-highlight)" : "0 4px 12px rgba(0,0,0,0.2)" }}
                exit={{ opacity: 0, scale: 0.4, x: -40, transition: { duration: 0.3 } }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="w-16 h-16 rounded-lg flex flex-col items-center justify-center font-mono font-bold border-2 border-white/20"
                style={{ background: colorFor(i) }}
              >
                <span>{it.value}</span>
                {mode === "priority" && it.priority !== undefined && <span className="text-[10px] opacity-70">p={it.priority}</span>}
              </motion.div>
            ))}
          </AnimatePresence>
          {items.length === 0 && <div className="text-muted-foreground italic">Empty</div>}
        </div>
      </LayoutGroup>
    </div>
  );
}

function CircularView({ slots, front, rear, size, highlight }: { slots: (Item | null)[]; front: number; rear: number; size: number; highlight: number | null }) {
  const n = slots.length;
  const R = 130;
  return (
    <div className="relative" style={{ width: 320, height: 320 }}>
      {slots.map((it, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const x = 160 + Math.cos(angle) * R - 28;
        const y = 160 + Math.sin(angle) * R - 28;
        const isFront = i === front && size > 0;
        const isRear = i === ((rear - 1 + n) % n) && size > 0;
        return (
          <motion.div key={i}
            animate={{
              boxShadow: it && highlight === it.id ? "0 0 24px 4px var(--color-highlight)" : "0 4px 12px rgba(0,0,0,0.15)",
            }}
            className="absolute w-14 h-14 rounded-lg flex items-center justify-center font-mono text-sm font-bold border-2 border-white/20"
            style={{ left: x, top: y, background: it ? colorFor(i) : "transparent", borderStyle: it ? "solid" : "dashed", borderColor: it ? undefined : "var(--color-border)" }}>
            {it ? it.value : <span className="text-muted-foreground text-xs">{i}</span>}
            {isFront && <span className="absolute -top-5 text-[10px] font-bold text-primary">F</span>}
            {isRear && <span className="absolute -bottom-5 text-[10px] font-bold text-accent">R</span>}
          </motion.div>
        );
      })}
      <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground font-mono">{size}/{n}</div>
    </div>
  );
}
