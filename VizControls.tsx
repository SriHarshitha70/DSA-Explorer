import { Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import type { useVizEngine } from "@/lib/viz/useVizEngine";

type Engine = ReturnType<typeof useVizEngine>;

export function VizControls({ engine }: { engine: Engine }) {
  const { state, pause, resume, stepForward, stepBackward, reset, setSpeed } = engine;
  return (
    <div className="glass rounded-xl p-3 flex flex-wrap items-center gap-2">
      <button
        onClick={state.playing ? pause : resume}
        disabled={state.total === 0}
        className="gradient-bg text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium glow disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
      >
        {state.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {state.playing ? "Pause" : state.index > 0 && state.index < state.total ? "Resume" : "Play"}
      </button>
      <button onClick={stepBackward} disabled={state.index === 0} className="rounded-lg p-2 hover:bg-secondary disabled:opacity-40" aria-label="Step back">
        <SkipBack className="w-4 h-4" />
      </button>
      <button onClick={stepForward} disabled={state.index >= state.total} className="rounded-lg p-2 hover:bg-secondary disabled:opacity-40" aria-label="Step forward">
        <SkipForward className="w-4 h-4" />
      </button>
      <button onClick={reset} className="rounded-lg p-2 hover:bg-secondary" aria-label="Reset">
        <RotateCcw className="w-4 h-4" />
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Speed</span>
        <input
          type="range" min={0.25} max={3} step={0.25}
          value={state.speed}
          onChange={e => setSpeed(Number(e.target.value))}
          className="w-28 accent-primary"
        />
        <span className="font-mono w-10">{state.speed.toFixed(2)}x</span>
      </div>
      <div className="text-xs font-mono text-muted-foreground border-l pl-3 ml-1">
        {state.index}/{state.total}
      </div>
    </div>
  );
}
