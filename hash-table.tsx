import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModuleLayout, LearningPanel, HistoryPanel } from "@/components/viz/LearningPanel";
import { colorFor } from "@/lib/viz/palette";

export const Route = createFileRoute("/hash-table")({
  head: () => ({
    meta: [
      { title: "Hash Table Visualizer — AlgoViz" },
      { name: "description", content: "Hashing, collisions and separate chaining with live animations." },
    ],
  }),
  component: HashPage,
});

type Entry = { id: number; key: string; value: string };
let idGen = 0;

function HashPage() {
  const [size, setSize] = useState(8);
  const [buckets, setBuckets] = useState<Entry[][]>(Array.from({ length: 8 }, () => []));
  const [key, setKey] = useState("");
  const [val, setVal] = useState("");
  const [highlightBucket, setHighlightBucket] = useState<number | null>(null);
  const [highlightEntry, setHighlightEntry] = useState<number | null>(null);
  const [op, setOp] = useState<string>();
  const [explain, setExplain] = useState<string>();
  const [history, setHistory] = useState<string[]>([]);

  const hash = (k: string, n = size) => {
    let h = 0;
    for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) % n;
    return ((h % n) + n) % n;
  };

  const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

  const insert = async () => {
    if (!key) return;
    const idx = hash(key);
    setHighlightBucket(idx); setOp(`Put("${key}")`); setExplain(`hash("${key}") = ${idx}.`);
    await wait(500);
    setBuckets(bs => {
      const next = bs.map(b => [...b]);
      const existing = next[idx].find(e => e.key === key);
      if (existing) existing.value = val;
      else next[idx].push({ id: ++idGen, key, value: val });
      return next;
    });
    setExplain(buckets[idx].length > 0 ? `Bucket ${idx} occupied → chain.` : `Empty bucket ${idx} → store.`);
    setHistory(h => [...h, `put("${key}", "${val}")`]);
    setKey(""); setVal("");
    await wait(400); setHighlightBucket(null);
  };

  const lookup = async () => {
    if (!key) return;
    const idx = hash(key);
    setHighlightBucket(idx); setOp(`Get("${key}")`); setExplain(`hash → bucket ${idx}.`);
    await wait(400);
    const chain = buckets[idx];
    for (const e of chain) {
      setHighlightEntry(e.id); setExplain(`Compare "${e.key}" with "${key}".`);
      await wait(500);
      if (e.key === key) { setExplain(`Found! value = "${e.value}".`); setHistory(h => [...h, `get("${key}") → "${e.value}"`]); setTimeout(() => { setHighlightBucket(null); setHighlightEntry(null); }, 700); return; }
    }
    setExplain("Not found."); setHistory(h => [...h, `get("${key}") → null`]);
    setHighlightBucket(null); setHighlightEntry(null);
  };

  const remove = async () => {
    if (!key) return;
    const idx = hash(key);
    setHighlightBucket(idx); setOp(`Delete("${key}")`); setExplain(`hash → bucket ${idx}.`);
    await wait(400);
    setBuckets(bs => {
      const next = bs.map(b => [...b]);
      next[idx] = next[idx].filter(e => e.key !== key);
      return next;
    });
    setExplain("Removed entry if present."); setHistory(h => [...h, `delete("${key}")`]);
    setTimeout(() => setHighlightBucket(null), 500);
  };

  const random = () => {
    const sample = ["apple","brick","candy","drum","echo","fern","glow","ice","jet","kite"];
    const next: Entry[][] = Array.from({ length: size }, () => []);
    for (let i = 0; i < 6; i++) {
      const k = sample[Math.floor(Math.random() * sample.length)];
      const v = String(Math.floor(Math.random() * 100));
      const idx = hash(k);
      if (!next[idx].some(e => e.key === k)) next[idx].push({ id: ++idGen, key: k, value: v });
    }
    setBuckets(next); setHistory(h => [...h, "random()"]);
  };

  const reset = () => { setBuckets(Array.from({ length: size }, () => [])); setHistory([]); setOp(undefined); setExplain(undefined); };

  const changeSize = (s: number) => { setSize(s); setBuckets(Array.from({ length: s }, () => [])); };

  return (
    <ModuleLayout
      left={
        <>
          <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-2">
            <input value={key} onChange={e => setKey(e.target.value)} placeholder="key" className="bg-input/60 rounded-lg px-3 py-2 text-sm w-28 outline-none focus:ring-2 focus:ring-primary" />
            <input value={val} onChange={e => setVal(e.target.value)} placeholder="value" className="bg-input/60 rounded-lg px-3 py-2 text-sm w-28 outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={insert} className="gradient-bg text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium">Put</button>
            <button onClick={lookup} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Get</button>
            <button onClick={remove} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Delete</button>
            <div className="flex-1" />
            <div className="flex items-center gap-2 text-xs">
              <span>Buckets</span>
              <input type="number" value={size} min={3} max={16}
                onChange={e => changeSize(Math.max(3, Math.min(16, Number(e.target.value) || 3)))}
                className="bg-input/60 rounded-lg px-2 py-1 w-16 outline-none" />
            </div>
            <button onClick={random} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Random</button>
            <button onClick={reset} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Reset</button>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="space-y-2">
              {buckets.map((chain, i) => (
                <motion.div key={i}
                  animate={{
                    backgroundColor: highlightBucket === i ? "var(--color-highlight)" : "transparent",
                  }}
                  className="rounded-lg flex items-center gap-3 p-2 border border-border"
                >
                  <div className="w-10 h-10 rounded-md flex items-center justify-center font-mono text-sm font-bold"
                    style={{ background: colorFor(i), color: "white" }}>{i}</div>
                  <div className="flex items-center gap-2 flex-wrap min-h-[40px]">
                    <AnimatePresence>
                      {chain.length === 0 && <div className="text-muted-foreground italic text-xs">empty</div>}
                      {chain.map((e, idx) => (
                        <motion.div key={e.id} layout
                          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1,
                            boxShadow: highlightEntry === e.id ? "0 0 18px 4px var(--color-warning)" : "none",
                          }} exit={{ opacity: 0, scale: 0.5 }}
                          className="flex items-center gap-1">
                          <div className="rounded-md bg-card border border-border px-2 py-1 text-xs font-mono">
                            <span className="text-primary font-bold">{e.key}</span>
                            <span className="text-muted-foreground">: {e.value}</span>
                          </div>
                          {idx < chain.length - 1 && <span className="text-muted-foreground">→</span>}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      }
      right={
        <>
          <LearningPanel
            currentOp={op} explain={explain}
            content={{
              title: "Hash Table (Chaining)",
              definition: "Key/value store that maps keys to bucket indices via a hash function.",
              working: "Hash the key to an index. Collisions are resolved with a chain (linked list) at each bucket. Lookup hashes then scans the chain.",
              realWorld: "Caches, dictionaries, database indexes, set/Map structures in every language standard library.",
              pros: ["Average O(1) lookup", "Flexible keys", "Simple"],
              cons: ["Worst case O(n) under bad hash", "Unordered", "Resize cost on rehashing"],
              complexity: { best: "O(1)", avg: "O(1)", worst: "O(n)", space: "O(n)" },
            }}
          />
          <HistoryPanel history={history} />
        </>
      }
    />
  );
}
