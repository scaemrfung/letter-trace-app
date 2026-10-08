export type GuideStyle = "dotted" | "solid";

export type DrawnStroke = {
  color: string;
  size: number;
  points: { x: number; y: number }[];
};

export type TraceResult = {
  pass: boolean;
  reason: "empty" | "off" | "partial" | "order" | null;
  hint: boolean;
};

export const PENS = [
  { name: "Blue", color: "#2f6fed" },
  { name: "Coral", color: "#e36b4f" },
  { name: "Green", color: "#1f9d62" },
  { name: "Purple", color: "#7a4de0" },
  { name: "Gold", color: "#f0a202" },
  { name: "Ink", color: "#243044" },
] as const;
