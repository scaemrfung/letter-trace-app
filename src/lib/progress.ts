import { create } from "zustand";

export type Kind = "letters" | "numbers";

type Dots = Record<string, 1>;

type TraceState = {
  letters: Dots;
  numbers: Dots;
  steps: boolean;
  ready: boolean;
  hydrate: () => void;
  mark: (kind: Kind, keys: string[]) => void;
  clear: (kind: Kind) => void;
  setSteps: (on: boolean) => void;
};

const KEY = {
  letters: "letter-trace.letters",
  numbers: "letter-trace.numbers",
  steps: "letter-trace.steps",
} as const;

function readDots(kind: Kind): Dots {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY[kind]) || "{}") as unknown;
    if (!raw || typeof raw !== "object") return {};
    const out: Dots = {};
    for (const [key, value] of Object.entries(raw)) {
      if (value) out[key] = 1;
    }
    return out;
  } catch {
    return {};
  }
}

function writeDots(kind: Kind, dots: Dots) {
  localStorage.setItem(KEY[kind], JSON.stringify(dots));
}

export const useTraceStore = create<TraceState>((set, get) => ({
  letters: {},
  numbers: {},
  steps: true,
  ready: false,
  hydrate: () => {
    if (get().ready || typeof localStorage === "undefined") return;
    set({
      letters: readDots("letters"),
      numbers: readDots("numbers"),
      steps: localStorage.getItem(KEY.steps) !== "0",
      ready: true,
    });
  },
  mark: (kind, keys) => {
    if (!get().ready) get().hydrate();
    const next: Dots = { ...get()[kind] };
    for (const key of keys) next[key] = 1;
    writeDots(kind, next);
    if (kind === "letters") set({ letters: next });
    else set({ numbers: next });
  },
  clear: (kind) => {
    if (!get().ready) get().hydrate();
    writeDots(kind, {});
    if (kind === "letters") set({ letters: {} });
    else set({ numbers: {} });
  },
  setSteps: (on) => {
    localStorage.setItem(KEY.steps, on ? "1" : "0");
    set({ steps: on });
  },
}));
