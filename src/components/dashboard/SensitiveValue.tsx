import { useEffect, useMemo, useState } from "react";
import { DashboardText } from "@/lib/dashboardText";

type SensitiveValueProps = {
  t: DashboardText;
  value: string;
  label?: string;
  copyable?: boolean;
  revealable?: boolean;
  defaultRevealed?: boolean;
  className?: string;
  hiddenText?: string;
  monospace?: boolean;
};

async function copyText(value: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  }

  if (typeof document === "undefined") {
    return false;
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.setAttribute("readonly", "true");
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

export function SensitiveValue({
  t,
  value,
  label,
  copyable = false,
  revealable = true,
  defaultRevealed = false,
  className,
  hiddenText,
  monospace = true,
}: SensitiveValueProps) {
  const [revealed, setRevealed] = useState(defaultRevealed);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    setRevealed(defaultRevealed);
  }, [defaultRevealed, value]);

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timer = window.setTimeout(() => setCopyState("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const maskedValue = useMemo(() => {
    if (hiddenText) {
      return hiddenText;
    }

    const visibleLength = Math.min(Math.max(value.length, 8), 24);
    return "•".repeat(visibleLength);
  }, [hiddenText, value.length]);

  const handleCopy = async (): Promise<void> => {
    const copied = await copyText(value);
    setCopyState(copied ? "copied" : "failed");
  };

  return (
    <div className={`sensitive-value${className ? ` ${className}` : ""}`}>
      {label ? <span className="sensitive-value-label">{label}</span> : null}
      <div className="sensitive-value-row">
        <div className={`sensitive-value-display${revealed ? " revealed" : " hidden"}${monospace ? " mono" : ""}`} aria-live="polite">
          {revealed ? value : maskedValue}
        </div>
        <div className="sensitive-value-actions">
          {revealable ? (
            <button className="pagination-btn ghost sensitive-value-btn" type="button" onClick={() => setRevealed(prev => !prev)}>
              {revealed ? t.streamerStudioHideItem : t.streamerStudioShowItem}
            </button>
          ) : null}
          {copyable ? (
            <button className="pagination-btn ghost sensitive-value-btn" type="button" onClick={() => void handleCopy()}>
              {copyState === "copied"
                ? t.streamerStudioAgentSetupCopied
                : copyState === "failed"
                  ? t.streamerStudioAgentSetupCopyFailed
                  : t.streamerStudioAgentSetupCopy}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
