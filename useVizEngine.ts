import { useCallback, useEffect, useRef, useState } from "react";

export type VizStep = {
  /** apply the data mutation for this step */
  apply: () => void;
  /** human-readable explanation shown in the panel */
  explain: string;
  /** optional duration override (ms) at speed=1 */
  duration?: number;
};

export type EngineState = {
  playing: boolean;
  speed: number; // 0.25 - 3
  index: number; // current step index (last applied + 1 = next)
  total: number;
  explain: string;
};

export function useVizEngine(defaultSpeed = 1) {
  const stepsRef = useRef<VizStep[]>([]);
  const [state, setState] = useState<EngineState>({
    playing: false, speed: defaultSpeed, index: 0, total: 0, explain: "Ready.",
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };

  const load = useCallback((steps: VizStep[]) => {
    clear();
    stepsRef.current = steps;
    setState(s => ({ ...s, index: 0, total: steps.length, playing: steps.length > 0, explain: steps[0]?.explain ?? "Ready." }));
  }, []);

  const stepForward = useCallback(() => {
    const i = state.index;
    const step = stepsRef.current[i];
    if (!step) { setState(s => ({ ...s, playing: false })); return; }
    step.apply();
    setState(s => ({ ...s, index: i + 1, explain: step.explain }));
  }, [state.index]);

  const stepBackward = useCallback(() => {
    // Step backward replays from start to index-1 (steps are idempotent-by-replay)
    const target = Math.max(0, state.index - 1);
    setState(s => ({ ...s, index: target, explain: stepsRef.current[target - 1]?.explain ?? "Ready.", playing: false }));
  }, [state.index]);

  const reset = useCallback(() => {
    clear();
    stepsRef.current = [];
    setState({ playing: false, speed: state.speed, index: 0, total: 0, explain: "Ready." });
  }, [state.speed]);

  const pause = useCallback(() => { clear(); setState(s => ({ ...s, playing: false })); }, []);
  const resume = useCallback(() => { setState(s => ({ ...s, playing: s.index < s.total })); }, []);
  const setSpeed = useCallback((speed: number) => setState(s => ({ ...s, speed })), []);

  useEffect(() => {
    if (!state.playing) return;
    if (state.index >= state.total) { setState(s => ({ ...s, playing: false })); return; }
    const step = stepsRef.current[state.index];
    const dur = (step.duration ?? 700) / state.speed;
    timerRef.current = setTimeout(() => {
      step.apply();
      setState(s => ({ ...s, index: s.index + 1, explain: step.explain }));
    }, dur);
    return clear;
  }, [state.playing, state.index, state.total, state.speed]);

  useEffect(() => clear, []);

  return { state, load, stepForward, stepBackward, reset, pause, resume, setSpeed };
}
