import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ClearDotsDialog } from "@/components/clear-dots-dialog";
import type { Kind } from "@/lib/progress";
import { useTraceStore } from "@/lib/progress";

const TOTAL: Record<Kind, number> = { letters: 52, numbers: 10 };

export function HomeScreen() {
  const letters = useTraceStore((s) => s.letters);
  const numbers = useTraceStore((s) => s.numbers);
  const ready = useTraceStore((s) => s.ready);
  const [ask, setAsk] = useState<Kind | null>(null);
  const counts = { letters: Object.keys(letters).length, numbers: Object.keys(numbers).length };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-8">
      <header className="flex items-center gap-3">
        <div className="grid size-14 place-items-center rounded-2xl bg-blue font-letter text-2xl text-paper shadow-md">
          Aa
        </div>
        <div>
          <h1 className="font-letter text-3xl leading-none text-ink">Letter Trace</h1>
          <p className="mt-1 text-sm font-bold text-muted">Finger or Apple Pencil</p>
        </div>
      </header>

      <p className="max-w-xl text-lg leading-relaxed text-muted">
        Trace on the lines. A green dot means it stayed on the letter and covered the whole shape.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <PracticeCard
          kind="letters"
          mark="Aa"
          title="Letters"
          detail="Upper case, lower case, or both together."
          count={ready ? counts.letters : 0}
          total={TOTAL.letters}
          onClear={() => setAsk("letters")}
        />
        <PracticeCard
          kind="numbers"
          mark="10"
          title="Numbers"
          detail="Digits 0 to 9, from the top line to the baseline."
          count={ready ? counts.numbers : 0}
          total={TOTAL.numbers}
          onClear={() => setAsk("numbers")}
        />
      </div>

      {ask && <ClearDotsDialog kind={ask} onClose={() => setAsk(null)} />}
    </main>
  );
}

function PracticeCard({
  kind,
  mark,
  title,
  detail,
  count,
  total,
  onClear,
}: {
  kind: Kind;
  mark: string;
  title: string;
  detail: string;
  count: number;
  total: number;
  onClear: () => void;
}) {
  return (
    <article className="flex flex-col gap-4 rounded-3xl bg-paper p-5 shadow-lg ring-1 ring-ink/5">
      <div className="flex items-center gap-4">
        <div className="grid size-16 place-items-center rounded-2xl bg-sky font-letter text-3xl text-ink">
          {mark}
        </div>
        <div>
          <h2 className="font-letter text-2xl text-ink">{title}</h2>
          <p className="text-sm font-bold text-muted">
            {count} of {total} traced
          </p>
        </div>
      </div>
      <p className="leading-relaxed text-muted">{detail}</p>
      <div className="mt-auto flex flex-wrap gap-2">
        <Link
          to="/trace/$set"
          params={{ set: kind }}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue px-4 font-bold text-paper"
        >
          Practice
        </Link>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 font-bold text-coral ring-1 ring-coral/40"
          onClick={onClear}
        >
          Clear green dots
        </button>
      </div>
    </article>
  );
}
