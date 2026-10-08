import type { Kind } from "@/lib/progress";
import { useTraceStore } from "@/lib/progress";

const COPY: Record<Kind, { title: string; body: string; empty: string }> = {
  letters: {
    title: "Clear the green dots?",
    body: "Every letter, upper and lower case, will look not traced. This only changes this iPad.",
    empty: "No letters have a green dot yet.",
  },
  numbers: {
    title: "Clear the number dots?",
    body: "Every number will look not traced. This only changes this iPad.",
    empty: "No numbers have a green dot yet.",
  },
};

export function ClearDotsDialog({
  kind,
  onClose,
}: {
  kind: Kind;
  onClose: () => void;
}) {
  const dots = useTraceStore((s) => s[kind]);
  const clear = useTraceStore((s) => s.clear);
  const count = Object.keys(dots).length;
  const copy = COPY[kind];

  return (
    <div
      className="fixed inset-0 z-30 grid place-items-center bg-ink/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-dots-title"
        className="w-full max-w-sm rounded-3xl bg-paper p-6 text-ink shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="clear-dots-title" className="font-letter text-2xl">
          {count === 0 ? "Nothing to clear" : copy.title}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-muted">
          {count === 0 ? copy.empty : copy.body}
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            className="min-h-11 flex-1 rounded-xl bg-ink px-4 font-bold text-paper"
            onClick={onClose}
          >
            {count === 0 ? "Close" : "Keep dots"}
          </button>
          {count > 0 && (
            <button
              type="button"
              className="min-h-11 flex-1 rounded-xl bg-white px-4 font-bold text-coral ring-1 ring-coral/40"
              onClick={() => {
                clear(kind);
                onClose();
              }}
            >
              Clear dots
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
