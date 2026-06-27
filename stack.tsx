import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ModuleLayout, LearningPanel, HistoryPanel } from "@/components/viz/LearningPanel";
import { colorFor } from "@/lib/viz/palette";

export const Route = createFileRoute("/stack")({
  head: () => ({
    meta: [
      { title: "Stack Visualizer — AlgoViz" },
      { name: "description", content: "Interactive LIFO stack with animated push, pop and peek operations." },
    ],
  }),
  component: StackPage,
});

type Item = { id: number; value: number; colorIndex: number };
let idGen = 0;

function StackPage() {
  const [stack, setStack] = useState<Item[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [op, setOp] = useState<string | undefined>();
  const [explain, setExplain] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const addHistory = (s: string) => setHistory(h => [...h, s]);

  const push = () => {
    setError(null);
    const v = Number(input);
    if (input === "" || Number.isNaN(v)) { setError("Enter a valid number"); return; }
    const item: Item = { id: ++idGen, value: v, colorIndex: stack.length };
    setStack(s => [...s, item]);
    setHighlight(item.id);
    setOp(`Push(${v})`);
    setExplain(`${v} pushed onto the top. Size = ${stack.length + 1}. O(1) time.`);
    addHistory(`push(${v})`);
    setInput("");
    setTimeout(() => setHighlight(null), 700);
  };

  const pop = () => {
    setError(null);
    if (stack.length === 0) { setError("Stack is empty"); return; }
    const top = stack[stack.length - 1];
    setHighlight(top.id);
    setOp(`Pop()`);
    setExplain(`Removed top element ${top.value}. Size = ${stack.length - 1}. O(1) time.`);
    addHistory(`pop() → ${top.value}`);
    setTimeout(() => {
      setStack(s => s.slice(0, -1));
      setHighlight(null);
    }, 350);
  };

  const peek = () => {
    setError(null);
    if (stack.length === 0) { setError("Stack is empty"); return; }
    const top = stack[stack.length - 1];
    setHighlight(top.id);
    setOp("Peek()");
    setExplain(`Top element is ${top.value}. No mutation. O(1) time.`);
    addHistory(`peek() → ${top.value}`);
    setTimeout(() => setHighlight(null), 900);
  };

  const reset = () => { setStack([]); setHistory([]); setHighlight(null); setOp(undefined); setExplain(undefined); };
  const random = () => {
    const arr = Array.from({ length: 5 }, () => Math.floor(Math.random() * 90) + 10);
    setStack(arr.map((v, i) => ({ id: ++idGen, value: v, colorIndex: i })));
    addHistory(`random([${arr.join(", ")}])`);
  };

  return (
    <ModuleLayout
      left={
        <>
          <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-2">
            <input
              type="number"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && push()}
              placeholder="Value"
              className="bg-input/60 rounded-lg px-3 py-2 text-sm w-28 outline-none focus:ring-2 focus:ring-primary"
            />
            <button onClick={push} className="gradient-bg text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium glow">Push</button>
            <button onClick={pop} className="rounded-lg px-4 py-2 text-sm bg-secondary hover:bg-secondary/70">Pop</button>
            <button onClick={peek} className="rounded-lg px-4 py-2 text-sm bg-secondary hover:bg-secondary/70">Peek</button>
            <div className="flex-1" />
            <button onClick={random} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Random</button>
            <button onClick={reset} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Reset</button>
          </div>
          {error && <div className="rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm px-3 py-2">{error}</div>}

          <div className="glass rounded-xl p-6 min-h-[480px] flex items-end justify-center gap-12 relative overflow-hidden">
            <div className="absolute inset-x-0 bottom-8 mx-auto w-64 border-b-4 border-foreground/30 rounded" />
            <LayoutGroup>
              <div className="flex flex-col-reverse items-center gap-2 mb-8 relative">
                <AnimatePresence>
                  {stack.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ y: -300, opacity: 0, scale: 0.5 }}
                      animate={{
                        y: 0, opacity: 1, scale: 1,
                        boxShadow: highlight === item.id ? "0 0 30px 6px var(--color-highlight)" : "0 4px 12px rgba(0,0,0,0.2)",
                      }}
                      exit={{ y: -300, opacity: 0, scale: 0.6, transition: { duration: 0.35 } }}
                      transition={{ type: "spring", stiffness: 260, damping: 18 }}
                      className="w-40 h-12 rounded-lg flex items-center justify-center font-mono font-bold text-lg text-foreground/95 border-2 border-white/20"
                      style={{ background: colorFor(item.colorIndex) }}
                    >
                      {item.value}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {stack.length === 0 && <div className="text-muted-foreground italic text-sm">Stack is empty</div>}
              </div>
              {stack.length > 0 && (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col items-center absolute right-8"
                  style={{ bottom: 40 + (stack.length - 1) * 56 + 24 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <div className="text-xs font-semibold text-primary mb-1">TOP →</div>
                </motion.div>
              )}
            </LayoutGroup>
            <div className="absolute top-3 left-4 text-xs text-muted-foreground font-mono">size: {stack.length}</div>
          </div>
        </>
      }
      right={
        <>
          <LearningPanel
            currentOp={op}
            explain={explain}
            content={{
              title: "Stack (LIFO)",
              definition: "A linear data structure where elements are inserted and removed from the same end called the top.",
              working: "Push adds to the top, pop removes from the top, and peek inspects without removing. Order is Last-In-First-Out.",
              realWorld: "Browser back button, undo history, function call stack, expression evaluation.",
              pros: ["Constant-time push/pop", "Simple, predictable order", "Memory efficient"],
              cons: ["No random access", "Fixed-size variants can overflow", "Search is linear"],
              complexity: { best: "O(1)", avg: "O(1)", worst: "O(1)", space: "O(n)" },
            }}
          />
          <HistoryPanel history={history} />
        </>
      }
    />
  );
}
