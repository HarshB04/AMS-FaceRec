import { useEffect, useRef } from "react";
import { seedData } from "../lib/api";

/**
 * Calls the /seed endpoint once on app mount to ensure demo data exists.
 * Subsequent calls to /seed are no-ops on the server if data is already present.
 */
export function useSeeder() {
  const called = useRef(false);
  useEffect(() => {
    if (called.current) return;
    called.current = true;
    seedData().catch((err) => console.warn("Seed warning (non-fatal):", err));
  }, []);
}
