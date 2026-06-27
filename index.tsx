import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Layers, ListOrdered, Workflow, GitBranch, Hash, Share2, BarChart3, Search, Boxes, TreePine,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AlgoViz — Interactive Data Structures & Algorithms Visualizer" },
      { name: "description", content: "Learn DSA visually with live, interactive animations for stacks, queues, trees, graphs, sorting and more." },
      { property: "og:title", content: "AlgoViz — Interactive DSA Visualizer" },
      { property: "og:description", content: "Live, animated visualizations of stacks, queues, trees, heaps, hash tables, graphs, sorting and searching." },
    ],
  }),
  component: Dashboard,
});

const modules = [
  { to: "/stack", title: "Stack", desc: "LIFO operations with falling animations.", icon: Layers, hue: 1 },
  { to: "/array", title: "Array", desc: "Insert, delete, search, sort & reverse.", icon: Boxes, hue: 2 },
  { to: "/queue", title: "Queue", desc: "Simple, circular, deque & priority.", icon: ListOrdered, hue: 3 },
  { to: "/linked-list", title: "Linked List", desc: "Singly, doubly & circular with pointers.", icon: Workflow, hue: 4 },
  { to: "/tree", title: "Trees / BST", desc: "BST + AVL rotations animated.", icon: TreePine, hue: 5 },
  { to: "/heap", title: "Heap", desc: "Min / Max heap with tree + array view.", icon: GitBranch, hue: 6 },
  { to: "/hash-table", title: "Hash Table", desc: "Buckets, hashing & chaining.", icon: Hash, hue: 1 },
  { to: "/graph", title: "Graph", desc: "Interactive editor with BFS & DFS.", icon: Share2, hue: 2 },
  { to: "/sorting", title: "Sorting", desc: "Bubble, selection, insertion, merge, quick, heap.", icon: BarChart3, hue: 3 },
  { to: "/searching", title: "Searching", desc: "Linear & binary search.", icon: Search, hue: 4 },
] as const;

function Dashboard() {
  return (
    <div className="max-w-[1400px] mx-auto">
      <section className="text-center py-10 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-block rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground mb-4"
        >
          Interactive · Live · Animated
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }}
          className="text-4xl md:text-6xl font-display font-bold"
        >
          Learn <span className="gradient-text">Data Structures</span><br />by watching them think.
        </motion.h1>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          A modern, hands-on DSA playground. Every operation actually runs and animates in real time —
          step through, pause, replay, and feel the algorithm.
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {modules.map((m, i) => (
          <motion.div
            key={m.to}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
          >
            <Link to={m.to} className="group block glass rounded-xl p-5 h-full hover:glow transition relative overflow-hidden">
              <div
                className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-30 blur-2xl group-hover:opacity-60 transition"
                style={{ background: `var(--color-viz-${m.hue})` }}
              />
              <m.icon className="w-7 h-7 mb-3 relative" style={{ color: `var(--color-viz-${m.hue})` }} />
              <div className="font-display font-semibold text-lg">{m.title}</div>
              <p className="text-sm text-muted-foreground mt-1">{m.desc}</p>
              <div className="mt-4 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition">Open →</div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
