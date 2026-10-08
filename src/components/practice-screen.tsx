import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ClearDotsDialog } from "@/components/clear-dots-dialog";
import { TraceBoard, type TraceHandle } from "@/components/trace-board";
import type { Kind } from "@/lib/progress";
import { useTraceStore } from "@/lib/progress";
import { DIGITS, LETTER_TIPS, LETTERS, NUMBER_TIPS } from "@/lib/tips";
import { PENS, type GuideStyle, type TraceResult } from "@/lib/trace-types";

type Mode = "upper" | "lower" | "both";

const FAIL_ORDER = ["off", "partial", "order", "empty"];

export function PracticeScreen({ kind }: { kind: Kind }) {
  const dots = useTraceStore((s) => s[kind]);
  const mark = useTraceStore((s) => s.mark);
  const steps = useTraceStore((s) => s.steps);
  const setSteps = useTraceStore((s) => s.setSteps);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("upper");
  const [guide, setGuide] = useState<GuideStyle>("dotted");
  const [pen, setPen] = useState(0);
  const [width, setWidth] = useState(16);
  const [playing, setPlaying] = useState(false);
  const [askClear, setAskClear] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; title: string; detail?: string } | null>(null);
  const upperRef = useRef<TraceHandle>(null);
  const lowerRef = useRef<TraceHandle>(null);
  const toastTimer = useRef(0);

  const items = kind === "letters" ? LETTERS : DIGITS;
  const glyph = items[index] ?? items[0];
  const upper = kind === "letters" && mode !== "lower" ? glyph : glyph.toLowerCase();
  const lower = glyph.toLowerCase();
  const showLower = kind === "letters" && mode === "both";
  const primary = kind === "numbers" ? glyph : mode === "lower" ? lower : upper;
  const tip =
    kind === "numbers"
      ? NUMBER_TIPS[glyph]
      : mode === "both"
        ? `${LETTER_TIPS[upper] ?? ""} Lower: ${LETTER_TIPS[lower] ?? ""}`
        : LETTER_TIPS[primary];

  function showToast(next: { ok: boolean; title: string; detail?: string }) {
    setToast(next);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }

  function boards() {
    return showLower ? [upperRef.current, lowerRef.current] : [upperRef.current];
  }

  function go(next: number) {
    const count = items.length;
    setIndex((next + count) % count);
    setPlaying(false);
    setToast(null);
  }

  function toggleShow() {
    const active = boards().filter((board): board is TraceHandle => !!board);
    if (playing) {
      active.forEach((board) => board.stop());
      setPlaying(false);
      return;
    }
    setPlaying(true);
    let left = active.length;
    if (!left) {
      setPlaying(false);
      return;
    }
    active.forEach((board) =>
      board.show(() => {
        left -= 1;
        if (left <= 0) setPlaying(false);
      }),
    );
  }

  function onCheck() {
    const results = boards()
      .map((board) => board?.check())
      .filter((result): result is TraceResult => !!result);
    const failed = results
      .filter((result) => !result.pass)
      .sort(
        (a, b) =>
          FAIL_ORDER.indexOf(a.reason ?? "off") - FAIL_ORDER.indexOf(b.reason ?? "off"),
      );
    if (failed.length) {
      const reason = failed[0].reason;
      showToast({
        ok: false,
        title:
          reason === "empty"
            ? kind === "numbers"
              ? "Trace the number first."
              : "Trace the letter first."
            : reason === "partial"
              ? kind === "numbers"
                ? "Almost. Trace the whole number."
                : "Almost. Trace the whole letter."
              : reason === "order"
                ? "Try again. Start at 1 and follow the arrows."
                : "Try again, stay on the line.",
      });
      return;
    }
    const hint = results.some((result) => result.hint);
    if (kind === "letters") {
      const keys = mode === "both" ? [upper, lower] : [primary];
      mark("letters", keys);
    } else {
      mark("numbers", [glyph]);
    }
    showToast({
      ok: true,
      title: "Great tracing.",
      detail: hint ? "Next time, start at 1 and follow the arrows." : undefined,
    });
  }

  const stripDone = (item: string) =>
    kind === "numbers" ? !!dots[item] : mode === "lower" ? !!dots[item.toLowerCase()] : !!dots[item];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-2.5 px-3 py-3 sm:px-5">
      <header className="flex flex-wrap items-center gap-2">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center rounded-xl bg-white px-3 font-bold text-ink ring-1 ring-ink/10"
        >
          Home
        </Link>
        <h1 className="font-letter text-2xl text-ink">
          {kind === "letters" ? "Letters" : "Numbers"}
        </h1>
        <div className="ml-auto">
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-xl bg-white px-3 font-bold text-coral ring-1 ring-coral/40"
            onClick={() => setAskClear(true)}
          >
            Clear green dots
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {kind === "letters" && (
          <div className="flex gap-1 rounded-2xl bg-white p-1 ring-1 ring-ink/10">
            {(
              [
                ["upper", "UPPER"],
                ["lower", "lower"],
                ["both", "Both"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={chip(mode === value)}
                onClick={() => {
                  setMode(value);
                  setPlaying(false);
                  upperRef.current?.clearInk();
                  lowerRef.current?.clearInk();
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-1 rounded-2xl bg-white p-1 ring-1 ring-ink/10">
          <button type="button" className={chip(guide === "dotted")} onClick={() => setGuide("dotted")}>
            Dotted guide
          </button>
          <button type="button" className={chip(guide === "solid")} onClick={() => setGuide("solid")}>
            Solid guide
          </button>
        </div>
        <div className="flex gap-1 rounded-2xl bg-white p-1 ring-1 ring-ink/10">
          <button type="button" className={chip(playing, true)} onClick={toggleShow}>
            {playing ? "Stop" : "Show me"}
          </button>
          <button
            type="button"
            className={chip(steps)}
            aria-pressed={steps}
            onClick={() => setSteps(!steps)}
          >
            1 2 3 Steps
          </button>
        </div>
      </div>

      <p className="rounded-2xl bg-paper px-4 py-2.5 text-base leading-relaxed text-muted ring-1 ring-ink/5">
        <strong className="text-ink">{showLower ? `${upper} / ${lower}` : primary}: </strong>
        {tip}
      </p>

      <div className={`grid min-h-72 flex-1 gap-2.5 ${showLower ? "md:grid-cols-2" : ""}`}>
        <TraceBoard
          key={`${kind}-${primary}`}
          ref={upperRef}
          text={primary}
          guideStyle={guide}
          showSteps={steps}
          color={PENS[pen].color}
          size={width}
          label={kind === "numbers" ? "Number" : mode === "lower" ? "Lower case" : "Upper case"}
        />
        {showLower && (
          <TraceBoard
            key={`${kind}-${lower}-lower`}
            ref={lowerRef}
            text={lower}
            guideStyle={guide}
            showSteps={steps}
            color={PENS[pen].color}
            size={width}
            label="Lower case"
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2" role="listbox" aria-label="Pen color">
          {PENS.map((swatch, i) => (
            <button
              key={swatch.name}
              type="button"
              aria-label={swatch.name}
              aria-selected={pen === i}
              className={`size-9 rounded-full ring-2 ring-white ${pen === i ? "outline-2 outline-offset-2 outline-ink" : "outline-1 outline-ink/15"}`}
              style={{ backgroundColor: swatch.color }}
              onClick={() => setPen(i)}
            />
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-muted">
          Pen
          <input
            type="range"
            min={6}
            max={28}
            value={width}
            aria-label="Pen size"
            className="w-28 accent-blue"
            onChange={(event) => setWidth(Number(event.target.value))}
          />
        </label>
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" className={tool()} onClick={() => boards().forEach((b) => b?.undo())}>
            Undo
          </button>
          <button
            type="button"
            className={tool()}
            onClick={() => boards().forEach((b) => b?.clearInk())}
          >
            Clear
          </button>
          <button type="button" className={tool()} onClick={() => go(index - 1)}>
            Prev
          </button>
          <button type="button" className={tool()} onClick={() => go(index + 1)}>
            Next
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-xl bg-green px-4 font-bold text-paper"
            onClick={onCheck}
          >
            I traced it
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1" aria-label={kind === "letters" ? "Letters" : "Numbers"}>
        {items.map((item, i) => {
          const done = stripDone(item);
          const label = kind === "letters" && mode === "lower" ? item.toLowerCase() : item;
          return (
            <button
              key={item}
              type="button"
              data-done={done ? "true" : "false"}
              aria-current={i === index ? "true" : undefined}
              className={`relative grid size-11 shrink-0 place-items-center rounded-xl font-letter text-xl ${
                i === index ? "bg-ink text-paper" : "bg-white text-ink ring-1 ring-ink/10"
              }`}
              onClick={() => go(i)}
            >
              {label}
              {done && <span className="absolute top-1 right-1 size-2 rounded-full bg-green" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {toast && (
        <div
          role="status"
          className={`pointer-events-none fixed top-[68%] left-1/2 z-20 w-[min(90vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-paper px-6 py-4 text-center shadow-xl ${
            toast.ok ? "text-green" : "text-coral"
          }`}
        >
          <p className="font-letter text-2xl">{toast.title}</p>
          {toast.detail && <p className="mt-1 text-base font-bold text-muted">{toast.detail}</p>}
        </div>
      )}

      {askClear && <ClearDotsDialog kind={kind} onClose={() => setAskClear(false)} />}
    </main>
  );
}

function chip(on: boolean, blue = false) {
  if (on && blue) return "min-h-11 rounded-xl bg-blue px-3 font-bold text-paper";
  if (on) return "min-h-11 rounded-xl bg-ink px-3 font-bold text-paper";
  return "min-h-11 rounded-xl px-3 font-bold text-ink";
}

function tool() {
  return "inline-flex min-h-11 items-center rounded-xl bg-white px-3 font-bold text-ink ring-1 ring-ink/10";
}
