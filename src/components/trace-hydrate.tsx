import { useEffect } from "react";
import { useTraceStore } from "@/lib/progress";

export function TraceHydrate() {
  const hydrate = useTraceStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return null;
}
