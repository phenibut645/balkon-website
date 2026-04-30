"use client";

import { useCallback, useEffect, useRef } from "react";

type UseSafePollingOptions = {
  enabled: boolean;
  intervalMs: number;
  immediate?: boolean;
  minGapMs?: number;
  task: () => Promise<void> | void;
};

export function useSafePolling(options: UseSafePollingOptions): void {
  const {
    enabled,
    intervalMs,
    immediate = false,
    minGapMs = 0,
    task,
  } = options;

  const taskRef = useRef(task);
  const inFlightRef = useRef(false);
  const lastRunAtRef = useRef(0);

  useEffect(() => {
    taskRef.current = task;
  }, [task]);

  const run = useCallback(async (): Promise<void> => {
    if (!enabled) {
      return;
    }

    if (typeof document !== "undefined" && document.hidden) {
      return;
    }

    if (inFlightRef.current) {
      return;
    }

    const now = Date.now();
    if (now - lastRunAtRef.current < minGapMs) {
      return;
    }

    inFlightRef.current = true;
    lastRunAtRef.current = now;

    try {
      await taskRef.current();
    } catch {
      // Polling must stay non-fatal and avoid retry loops.
    } finally {
      inFlightRef.current = false;
    }
  }, [enabled, minGapMs]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (immediate) {
      void run();
    }

    const timerId = window.setInterval(() => {
      void run();
    }, intervalMs);

    return () => {
      window.clearInterval(timerId);
    };
  }, [enabled, immediate, intervalMs, run]);
}
