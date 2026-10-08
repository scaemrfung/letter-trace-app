import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type PointerEvent,
} from "react";
import {
  animate,
  check,
  compose,
  drawFeedback,
  drawGuide,
  drawOrder,
  layout,
  place,
} from "@/lib/tracekit";
import type { DrawnStroke, GuideStyle, TraceResult } from "@/lib/trace-types";

export type TraceHandle = {
  undo: () => void;
  clearInk: () => void;
  check: () => TraceResult;
  show: (onDone: () => void) => void;
  stop: () => void;
};

type Props = {
  text: string;
  guideStyle: GuideStyle;
  showSteps: boolean;
  color: string;
  size: number;
  label: string;
};

function lineCenter(board: HTMLElement, rule: HTMLElement) {
  const boardBox = board.getBoundingClientRect();
  const ruleBox = rule.getBoundingClientRect();
  const border = parseFloat(getComputedStyle(rule).borderTopWidth) / 2;
  return ruleBox.top - boardBox.top + border;
}

function paintStroke(
  ctx: CanvasRenderingContext2D,
  stroke: DrawnStroke,
) {
  if (!stroke.points.length) return;
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length - 1; i++) {
    const midX = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
    const midY = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
    ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, midX, midY);
  }
  const last = stroke.points[stroke.points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

function dotPattern(ctx: CanvasRenderingContext2D) {
  const tile = document.createElement("canvas");
  tile.width = 14;
  tile.height = 14;
  const pen = tile.getContext("2d");
  if (!pen) return null;
  pen.fillStyle = "#7f9dba";
  pen.beginPath();
  pen.arc(2, 2, 1.8, 0, Math.PI * 2);
  pen.fill();
  return ctx.createPattern(tile, "repeat");
}

function sizeCanvas(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}

export const TraceBoard = forwardRef<TraceHandle, Props>(function TraceBoard(
  { text, guideStyle, showSteps, color, size, label },
  ref,
) {
  const boardRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const strokes = useRef<DrawnStroke[]>([]);
  const live = useRef<DrawnStroke | null>(null);
  const feedback = useRef<unknown>(null);
  const placedRef = useRef<unknown>(null);
  const layoutRef = useRef<unknown>(null);
  const pointer = useRef<number | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const paintInkRef = useRef<() => void>(() => {});
  const redrawRef = useRef<() => void>(() => {});
  const colorRef = useRef(color);
  const sizeRef = useRef(size);
  const stepsRef = useRef(showSteps);
  const styleRef = useRef(guideStyle);
  colorRef.current = color;
  sizeRef.current = size;
  stepsRef.current = showSteps;
  styleRef.current = guideStyle;

  useEffect(() => {
    const board = boardRef.current;
    const guide = guideRef.current;
    const ink = inkRef.current;
    const top = topRef.current;
    const base = baseRef.current;
    if (!board || !guide || !ink || !top || !base) return;

    const paintGuide = (
      ctx: CanvasRenderingContext2D,
      placed: unknown,
      fitted: { w: number; h: number },
      numbers: boolean,
    ) => {
      ctx.clearRect(0, 0, fitted.w, fitted.h);
      const pattern = styleRef.current === "dotted" ? dotPattern(ctx) : null;
      drawGuide(ctx, placed, fitted, { style: styleRef.current, pattern });
      if (numbers) drawOrder(ctx, placed, fitted);
    };

    const paintInk = () => {
      const sized = sizeCanvas(ink);
      if (!sized.ctx) return;
      sized.ctx.clearRect(0, 0, sized.width, sized.height);
      for (const stroke of strokes.current) paintStroke(sized.ctx, stroke);
      if (live.current) paintStroke(sized.ctx, live.current);
      if (feedback.current && layoutRef.current) {
        drawFeedback(sized.ctx, feedback.current, layoutRef.current);
      }
    };
    paintInkRef.current = paintInk;

    const redraw = () => {
      stopRef.current?.();
      stopRef.current = null;
      const rect = board.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const sized = sizeCanvas(guide);
      if (!sized.ctx) return;
      const figure = compose(text);
      const fitted = layout(figure, sized.width, sized.height, {
        maxWidth: 0.84,
        topPx: lineCenter(board, top),
        basePx: lineCenter(board, base),
      });
      const placed = place(figure, fitted);
      placedRef.current = placed;
      layoutRef.current = fitted;
      paintGuide(sized.ctx, placed, fitted, stepsRef.current);
      paintInk();
    };
    redrawRef.current = redraw;

    const observer = new ResizeObserver(() => redraw());
    observer.observe(board);
    redraw();
    return () => {
      observer.disconnect();
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [text, guideStyle, showSteps]);

  useImperativeHandle(ref, () => ({
    undo() {
      if (strokes.current.length) strokes.current.pop();
      feedback.current = null;
      paintInkRef.current();
    },
    clearInk() {
      strokes.current = [];
      live.current = null;
      feedback.current = null;
      pointer.current = null;
      paintInkRef.current();
    },
    check() {
      const placed = placedRef.current;
      const fitted = layoutRef.current;
      if (!placed || !fitted) {
        return { pass: false, reason: "empty", hint: false };
      }
      const result = check(placed, fitted, strokes.current) as TraceResult;
      feedback.current = result.pass ? null : result;
      paintInkRef.current();
      return result;
    },
    show(onDone) {
      stopRef.current?.();
      const guide = guideRef.current;
      const ctx = guide?.getContext("2d");
      const placed = placedRef.current;
      const fitted = layoutRef.current as { w: number; h: number } | null;
      if (!ctx || !placed || !fitted) {
        onDone();
        return;
      }
      stopRef.current = animate(ctx, placed, fitted, {
        drawBase: () => {
          ctx.clearRect(0, 0, fitted.w, fitted.h);
          const pattern = styleRef.current === "dotted" ? dotPattern(ctx) : null;
          drawGuide(ctx, placed, fitted, { style: styleRef.current, pattern });
        },
        onDone: () => {
          stopRef.current = null;
          redrawRef.current();
          onDone();
        },
      });
    },
    stop() {
      stopRef.current?.();
      stopRef.current = null;
      redrawRef.current();
    },
  }));

  function pointOf(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  return (
    <div
      ref={boardRef}
      className="relative min-h-72 flex-1 overflow-hidden rounded-3xl bg-paper shadow-lg ring-1 ring-ink/5"
    >
      <p className="absolute top-3 left-3 z-10 rounded-full bg-paper/80 px-2 py-1 text-xs font-extrabold tracking-wider text-muted uppercase">
        {label}
      </p>
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div ref={topRef} className="rule rule-top">
          <span>top</span>
        </div>
        <div className="rule rule-mid">
          <span>middle</span>
        </div>
        <div ref={baseRef} className="rule rule-base">
          <span>base</span>
        </div>
        <div className="rule rule-tail">
          <span>tail</span>
        </div>
      </div>
      <canvas ref={guideRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      <canvas
        ref={inkRef}
        className="absolute inset-0 h-full w-full touch-none"
        aria-label={`Tracing board for ${text}`}
        onPointerDown={(event) => {
          if (pointer.current !== null) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          pointer.current = event.pointerId;
          feedback.current = null;
          live.current = {
            color: colorRef.current,
            size: sizeRef.current,
            points: [pointOf(event)],
          };
          paintInkRef.current();
        }}
        onPointerMove={(event) => {
          if (event.pointerId !== pointer.current || !live.current) return;
          const events = event.nativeEvent.getCoalescedEvents?.() ?? [event.nativeEvent];
          const rect = event.currentTarget.getBoundingClientRect();
          for (const sample of events) {
            live.current.points.push({
              x: sample.clientX - rect.left,
              y: sample.clientY - rect.top,
            });
          }
          paintInkRef.current();
        }}
        onPointerUp={(event) => {
          if (event.pointerId !== pointer.current) return;
          if (live.current && live.current.points.length) strokes.current.push(live.current);
          live.current = null;
          pointer.current = null;
          paintInkRef.current();
        }}
        onPointerCancel={(event) => {
          if (event.pointerId !== pointer.current) return;
          if (live.current && live.current.points.length) strokes.current.push(live.current);
          live.current = null;
          pointer.current = null;
          paintInkRef.current();
        }}
      />
    </div>
  );
});
