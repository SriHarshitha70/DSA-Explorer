import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Layers, ListOrdered, Workflow, GitBranch, Network, Hash,
  Share2, BarChart3, Search, Boxes, TreePine,
} from "lucide-react";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/stack", label: "Stack", icon: Layers },
  { to: "/array", label: "Array", icon: Boxes },
  { to: "/queue", label: "Queue", icon: ListOrdered },
  { to: "/linked-list", label: "Linked List", icon: Workflow },
  { to: "/tree", label: "Trees / BST", icon: TreePine },
  { to: "/heap", label: "Heap", icon: GitBranch },
  { to: "/hash-table", label: "Hash Table", icon: Hash },
  { to: "/graph", label: "Graph", icon: Share2 },
  { to: "/sorting", label: "Sorting", icon: BarChart3 },
  { to: "/searching", label: "Searching", icon: Search },
] as const;

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = useRouterState({ select: s => s.location.pathname });
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 248, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          className="sticky top-0 h-screen overflow-hidden glass border-r z-40 shrink-0"
        >
          <div className="w-[248px] h-full flex flex-col p-4 gap-1">
            <div className="px-2 py-3 mb-2">
              <div className="font-display text-xl font-bold gradient-text">AlgoViz</div>
              <div className="text-xs text-muted-foreground mt-0.5">Interactive DSA</div>
            </div>
            <nav className="flex-1 overflow-y-auto flex flex-col gap-1">
              {items.map(({ to, label, icon: Icon }) => {
                const active = pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => window.innerWidth < 768 && onClose()}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition relative ${
                      active ? "text-primary-foreground" : "text-foreground/80 hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 gradient-bg rounded-lg glow"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">{label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="text-[10px] text-muted-foreground px-2 pt-3 border-t">
              Built for learners · v1.0
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
