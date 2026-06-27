import { motion, AnimatePresence } from "framer-motion";

export type Complexity = { best?: string; avg?: string; worst?: string; space?: string };

export type LearningContent = {
  title: string;
  definition: string;
  working: string;
  realWorld: string;
  pros: string[];
  cons: string[];
  complexity: Complexity;
};

export function LearningPanel({ content, currentOp, explain }: { content: LearningContent; currentOp?: string; explain?: string }) {
  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div>
        <h2 className="text-xl font-display font-bold gradient-text">{content.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{content.definition}</p>
      </div>

      <AnimatePresence mode="wait">
        {(currentOp || explain) && (
          <motion.div
            key={(currentOp ?? "") + (explain ?? "")}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-sm"
          >
            {currentOp && <div className="font-semibold text-primary">{currentOp}</div>}
            {explain && <div className="text-foreground/90 mt-0.5">{explain}</div>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="Best" value={content.complexity.best} />
        <Stat label="Average" value={content.complexity.avg} />
        <Stat label="Worst" value={content.complexity.worst} />
        <Stat label="Space" value={content.complexity.space} />
      </div>

      <Section title="How it works">{content.working}</Section>
      <Section title="Real-world">{content.realWorld}</Section>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="font-semibold text-success mb-1">Pros</div>
          <ul className="space-y-1 text-muted-foreground list-disc list-inside">
            {content.pros.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
        <div>
          <div className="font-semibold text-destructive mb-1">Cons</div>
          <ul className="space-y-1 text-muted-foreground list-disc list-inside">
            {content.cons.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-sm">{value ?? "—"}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{title}</div>
      <p className="text-sm">{children}</p>
    </div>
  );
}

export function HistoryPanel({ history }: { history: string[] }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">History</div>
      <div className="max-h-48 overflow-y-auto flex flex-col-reverse gap-1 text-sm font-mono">
        <AnimatePresence initial={false}>
          {history.length === 0 && <div className="text-muted-foreground italic text-xs">No operations yet.</div>}
          {history.map((h, i) => (
            <motion.div
              key={`${i}-${h}`}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              className="rounded bg-secondary/40 px-2 py-1"
            >
              <span className="text-muted-foreground mr-2">#{i + 1}</span>{h}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ModuleLayout({
  left, right,
}: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 max-w-[1600px] mx-auto">
      <div className="space-y-4 min-w-0">{left}</div>
      <div className="space-y-4">{right}</div>
    </div>
  );
}
