import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModuleLayout, LearningPanel, HistoryPanel } from "@/components/viz/LearningPanel";

export const Route = createFileRoute("/tree")({
  head: () => ({
    meta: [
      { title: "BST / AVL Tree Visualizer — AlgoViz" },
      { name: "description", content: "Animated insertion, deletion, traversal and AVL rotations." },
    ],
  }),
  component: TreePage,
});

type Mode = "bst" | "avl";
type TNode = { id: number; value: number; left: TNode | null; right: TNode | null; h: number };
let idGen = 0;
const mkNode = (v: number): TNode => ({ id: ++idGen, value: v, left: null, right: null, h: 1 });

const height = (n: TNode | null) => n ? n.h : 0;
const update = (n: TNode) => { n.h = 1 + Math.max(height(n.left), height(n.right)); };
const balance = (n: TNode | null) => n ? height(n.left) - height(n.right) : 0;
function rotateRight(y: TNode): TNode { const x = y.left!; y.left = x.right; x.right = y; update(y); update(x); return x; }
function rotateLeft(x: TNode): TNode { const y = x.right!; x.right = y.left; y.left = x; update(x); update(y); return y; }

function insert(root: TNode | null, v: number, avl: boolean): TNode {
  if (!root) return mkNode(v);
  if (v < root.value) root.left = insert(root.left, v, avl);
  else if (v > root.value) root.right = insert(root.right, v, avl);
  else return root;
  if (!avl) return root;
  update(root);
  const b = balance(root);
  if (b > 1 && v < root.left!.value) return rotateRight(root);
  if (b < -1 && v > root.right!.value) return rotateLeft(root);
  if (b > 1 && v > root.left!.value) { root.left = rotateLeft(root.left!); return rotateRight(root); }
  if (b < -1 && v < root.right!.value) { root.right = rotateRight(root.right!); return rotateLeft(root); }
  return root;
}
function minNode(n: TNode): TNode { while (n.left) n = n.left; return n; }
function remove(root: TNode | null, v: number, avl: boolean): TNode | null {
  if (!root) return null;
  if (v < root.value) root.left = remove(root.left, v, avl);
  else if (v > root.value) root.right = remove(root.right, v, avl);
  else {
    if (!root.left || !root.right) return root.left || root.right;
    const m = minNode(root.right);
    root.value = m.value; root.right = remove(root.right, m.value, avl);
  }
  if (!avl) return root;
  update(root);
  const b = balance(root);
  if (b > 1 && balance(root.left) >= 0) return rotateRight(root);
  if (b > 1 && balance(root.left) < 0) { root.left = rotateLeft(root.left!); return rotateRight(root); }
  if (b < -1 && balance(root.right) <= 0) return rotateLeft(root);
  if (b < -1 && balance(root.right) > 0) { root.right = rotateRight(root.right!); return rotateLeft(root); }
  return root;
}

type LayoutNode = { node: TNode; x: number; y: number };
function computeLayout(root: TNode | null): { nodes: LayoutNode[]; edges: { from: LayoutNode; to: LayoutNode }[]; width: number; height: number } {
  if (!root) return { nodes: [], edges: [], width: 0, height: 0 };
  const xGap = 50, yGap = 80;
  let counter = 0;
  const pos = new Map<number, { x: number; y: number }>();
  function dfs(n: TNode, depth: number) {
    if (n.left) dfs(n.left, depth + 1);
    pos.set(n.id, { x: counter++ * xGap, y: depth * yGap });
    if (n.right) dfs(n.right, depth + 1);
  }
  dfs(root, 0);
  const nodes: LayoutNode[] = [];
  function collect(n: TNode) {
    const p = pos.get(n.id)!;
    nodes.push({ node: n, x: p.x, y: p.y });
    if (n.left) collect(n.left);
    if (n.right) collect(n.right);
  }
  collect(root);
  const edges: { from: LayoutNode; to: LayoutNode }[] = [];
  const byId = new Map(nodes.map(l => [l.node.id, l]));
  for (const ln of nodes) {
    if (ln.node.left) edges.push({ from: ln, to: byId.get(ln.node.left.id)! });
    if (ln.node.right) edges.push({ from: ln, to: byId.get(ln.node.right.id)! });
  }
  const w = Math.max(...nodes.map(n => n.x)) + 60;
  const h = Math.max(...nodes.map(n => n.y)) + 60;
  return { nodes, edges, width: w, height: h };
}

function TreePage() {
  const [mode, setMode] = useState<Mode>("bst");
  const [root, setRoot] = useState<TNode | null>(null);
  const [value, setValue] = useState("");
  const [highlight, setHighlight] = useState<Set<number>>(new Set());
  const [history, setHistory] = useState<string[]>([]);
  const [op, setOp] = useState<string>();
  const [explain, setExplain] = useState<string>();

  const layout = useMemo(() => computeLayout(root), [root]);

  const doInsert = () => {
    const v = Number(value); if (Number.isNaN(v)) return;
    const next = insert(root ? cloneTree(root) : null, v, mode === "avl");
    setRoot(next);
    setOp(`Insert(${v})`); setExplain(`Inserted ${v}${mode === "avl" ? ", re-balanced if needed." : "."}`);
    setHistory(h => [...h, `insert(${v})`]); setValue("");
    const found = findId(next, v); if (found) flash(found);
  };
  const doDelete = () => {
    const v = Number(value); if (Number.isNaN(v)) return;
    const next = remove(root ? cloneTree(root) : null, v, mode === "avl");
    setRoot(next);
    setOp(`Delete(${v})`); setExplain(`Removed ${v}.`);
    setHistory(h => [...h, `delete(${v})`]); setValue("");
  };

  const flash = (id: number) => { setHighlight(new Set([id])); setTimeout(() => setHighlight(new Set()), 800); };

  const traverse = async (order: "in" | "pre" | "post") => {
    const out: number[] = [];
    const path: TNode[] = [];
    const visit = (n: TNode | null) => {
      if (!n) return;
      if (order === "pre") { path.push(n); out.push(n.value); }
      visit(n.left);
      if (order === "in") { path.push(n); out.push(n.value); }
      visit(n.right);
      if (order === "post") { path.push(n); out.push(n.value); }
    };
    visit(root);
    setOp(`${order.toUpperCase()}-order Traversal`); setHistory(h => [...h, `${order}-order()`]);
    for (const n of path) {
      setHighlight(new Set([n.id])); setExplain(`Visit ${n.value}. Sequence so far: [${out.slice(0, out.indexOf(n.value) + 1).join(", ")}]`);
      await new Promise(r => setTimeout(r, 450));
    }
    setHighlight(new Set()); setExplain(`Result: [${out.join(", ")}]`);
  };

  const search = async () => {
    const v = Number(value); if (Number.isNaN(v)) return;
    setOp(`Search(${v})`);
    let n = root;
    while (n) {
      setHighlight(new Set([n.id])); setExplain(`Compare ${v} vs ${n.value}.`);
      await new Promise(r => setTimeout(r, 500));
      if (v === n.value) { setExplain(`Found ${v}.`); return; }
      n = v < n.value ? n.left : n.right;
    }
    setExplain(`Not found.`); setHighlight(new Set());
  };

  const random = () => {
    let r: TNode | null = null;
    const seen = new Set<number>();
    while (seen.size < 7) {
      const v = Math.floor(Math.random() * 90) + 10;
      if (seen.has(v)) continue; seen.add(v);
      r = insert(r, v, mode === "avl");
    }
    setRoot(r); setHistory(h => [...h, "random()"]);
  };
  const reset = () => { setRoot(null); setHistory([]); setOp(undefined); setExplain(undefined); };

  return (
    <ModuleLayout
      left={
        <>
          <div className="glass rounded-xl p-3 flex flex-wrap gap-1">
            {(["bst", "avl"] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); reset(); }}
                className={`text-xs rounded-lg px-3 py-1.5 font-medium uppercase transition ${
                  mode === m ? "gradient-bg text-primary-foreground glow" : "hover:bg-secondary"
                }`}>{m}</button>
            ))}
          </div>
          <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-2">
            <input value={value} onChange={e => setValue(e.target.value)} type="number" placeholder="value"
              className="bg-input/60 rounded-lg px-3 py-2 text-sm w-28 outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={doInsert} className="gradient-bg text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium">Insert</button>
            <button onClick={doDelete} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Delete</button>
            <button onClick={search} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Search</button>
            <button onClick={() => traverse("in")} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">In-order</button>
            <button onClick={() => traverse("pre")} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Pre-order</button>
            <button onClick={() => traverse("post")} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Post-order</button>
            <div className="flex-1" />
            <button onClick={random} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Random</button>
            <button onClick={reset} className="rounded-lg px-3 py-2 text-sm bg-secondary hover:bg-secondary/70">Reset</button>
          </div>

          <div className="glass rounded-xl p-6 min-h-[420px] overflow-auto">
            {!root && <div className="text-center text-muted-foreground italic py-20">Tree is empty</div>}
            {root && (
              <svg width={layout.width} height={layout.height} className="mx-auto block">
                {layout.edges.map((e, i) => (
                  <motion.line key={i}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    x1={e.from.x + 24} y1={e.from.y + 24}
                    x2={e.to.x + 24} y2={e.to.y + 24}
                    stroke="var(--color-border)" strokeWidth={2}
                  />
                ))}
                <AnimatePresence>
                  {layout.nodes.map(({ node, x, y }) => {
                    const hl = highlight.has(node.id);
                    return (
                      <motion.g key={node.id}
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: 1, scale: 1, x, y }}
                        exit={{ opacity: 0, scale: 0.2 }}
                        transition={{ type: "spring", stiffness: 220, damping: 22 }}
                      >
                        <circle cx={24} cy={24} r={22} fill={hl ? "var(--color-highlight)" : "var(--color-primary)"} stroke="white" strokeWidth={2} />
                        <text x={24} y={28} textAnchor="middle" fill="white" fontWeight={700} fontFamily="JetBrains Mono" fontSize={13}>{node.value}</text>
                        {mode === "avl" && <text x={48} y={12} fill="var(--color-muted-foreground)" fontSize={9}>h{node.h}</text>}
                      </motion.g>
                    );
                  })}
                </AnimatePresence>
              </svg>
            )}
          </div>
        </>
      }
      right={
        <>
          <LearningPanel
            currentOp={op} explain={explain}
            content={{
              title: mode === "avl" ? "AVL Tree" : "Binary Search Tree",
              definition: mode === "avl" ? "Self-balancing BST where heights of left/right subtrees differ by at most one."
                : "Binary tree with the invariant: left subtree < node < right subtree.",
              working: mode === "avl"
                ? "After each insert/delete, recompute heights and rebalance with single or double rotations (LL, RR, LR, RL)."
                : "Search walks left or right based on comparison; insertion places a new leaf; deletion uses in-order successor.",
              realWorld: "Database indexes, file system directories, autocompletion, expression parsers.",
              pros: mode === "avl" ? ["Guaranteed O(log n)", "Predictable performance"] : ["Simple", "Fast on balanced data", "Ordered traversal"],
              cons: mode === "avl" ? ["More complex code", "Rotation overhead"] : ["Degenerates to O(n) when skewed", "No rebalancing"],
              complexity: { best: "O(log n)", avg: "O(log n)", worst: mode === "avl" ? "O(log n)" : "O(n)", space: "O(n)" },
            }}
          />
          <HistoryPanel history={history} />
        </>
      }
    />
  );
}

function cloneTree(n: TNode): TNode {
  return { ...n, left: n.left ? cloneTree(n.left) : null, right: n.right ? cloneTree(n.right) : null };
}
function findId(n: TNode | null, v: number): number | null {
  if (!n) return null;
  if (n.value === v) return n.id;
  return findId(v < n.value ? n.left : n.right, v);
}
