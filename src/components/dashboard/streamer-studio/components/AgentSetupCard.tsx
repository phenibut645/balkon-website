import { useCallback, useEffect, useMemo, useState } from "react";
import { bindStreamerStudioAgent, clearStreamerStudioAgent, getStreamerStudioAgentSetup, provisionStreamerStudioAgent } from "@/lib/api";
import { DashboardText, formatDashboardDate } from "@/lib/dashboardText";
import {
  StreamerStudioAccessView,
  StreamerStudioAgentProvisionResult,
  StreamerStudioAgentSetupView,
} from "@/lib/types";

type AgentSetupCardProps = {
  t: DashboardText;
  streamer: StreamerStudioAccessView;
};

type FeedbackState = {
  message: string;
  isError: boolean;
};

function obsConnectionLabel(t: DashboardText, setup: StreamerStudioAgentSetupView | null): string {
  if (!setup || setup.obsConnected === null) {
    return t.streamerStudioAgentSetupUnknown;
  }

  return setup.obsConnected ? t.streamerStudioObsConnected : t.streamerStudioObsDisconnected;
}

function formatLastSeen(t: DashboardText, value: string | null): string {
  if (!value) {
    return t.streamerStudioAgentSetupUnknown;
  }

  const locale = typeof navigator !== "undefined" && typeof navigator.language === "string"
    ? navigator.language
    : "en-US";

  return formatDashboardDate(value, locale, t.streamerStudioAgentSetupUnknown);
}

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

export function AgentSetupCard({ t, streamer }: AgentSetupCardProps) {
  const [setup, setSetup] = useState<StreamerStudioAgentSetupView | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [customAgentId, setCustomAgentId] = useState("");
  const [bindAgentId, setBindAgentId] = useState("");
  const [bindAgentToken, setBindAgentToken] = useState("");
  const [generatedToken, setGeneratedToken] = useState<StreamerStudioAgentProvisionResult | null>(null);
  const [provisioning, setProvisioning] = useState(false);
  const [binding, setBinding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [copiedField, setCopiedField] = useState<"agentId" | "token" | null>(null);

  const loadSetup = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    const response = await getStreamerStudioAgentSetup(streamer.streamerId);
    setLoading(false);

    if (!response.ok || !response.data) {
      setSetup(null);
      setFeedback({
        message: response.message || t.streamerStudioError,
        isError: true,
      });
      return;
    }

    setSetup(response.data);
  }, [streamer.streamerId, t.streamerStudioError]);

  useEffect(() => {
    setGeneratedToken(null);
    setBindAgentToken("");
    setCopiedField(null);
    void loadSetup();
  }, [loadSetup]);

  useEffect(() => {
    if (!feedback || !copiedField) {
      return;
    }

    const timer = window.setTimeout(() => setCopiedField(null), 1800);
    return () => window.clearTimeout(timer);
  }, [feedback, copiedField]);

  const compactStatus = useMemo(() => {
    if (!setup) {
      return t.shopObsLoading;
    }

    const parts = [
      setup.configured ? t.streamerStudioAgentSetupConfigured : t.streamerStudioAgentSetupNotConfigured,
      setup.online ? t.streamerStudioAgentOnline : t.streamerStudioAgentOffline,
      `${t.streamerStudioObsStatusLabel}: ${obsConnectionLabel(t, setup)}`,
    ];

    return parts.join(" · ");
  }, [setup, t]);

  const currentAgentId = setup?.agentId ?? null;

  const handleCopy = useCallback(async (value: string, field: "agentId" | "token") => {
    const copied = await copyText(value);
    setCopiedField(copied ? field : null);
    setFeedback({
      message: copied ? t.streamerStudioAgentSetupCopied : t.streamerStudioAgentSetupCopyFailed,
      isError: !copied,
    });
  }, [t.streamerStudioAgentSetupCopied, t.streamerStudioAgentSetupCopyFailed]);

  const handleProvision = useCallback(async () => {
    setProvisioning(true);
    setFeedback(null);
    setGeneratedToken(null);
    const response = await provisionStreamerStudioAgent(streamer.streamerId, customAgentId.trim() || null);
    setProvisioning(false);

    if (!response.ok || !response.data) {
      setFeedback({
        message: response.message || t.streamerStudioAgentSetupProvisionFailed,
        isError: true,
      });
      return;
    }

    setGeneratedToken(response.data);
    setCustomAgentId(response.data.agentId);
    setFeedback({
      message: t.streamerStudioAgentSetupProvisionSuccess,
      isError: false,
    });
    await loadSetup();
  }, [customAgentId, loadSetup, streamer.streamerId, t.streamerStudioAgentSetupProvisionFailed, t.streamerStudioAgentSetupProvisionSuccess]);

  const handleBind = useCallback(async () => {
    const normalizedAgentId = bindAgentId.trim();
    const normalizedToken = bindAgentToken.trim();
    if (!normalizedAgentId || !normalizedToken) {
      setFeedback({ message: t.streamerStudioAgentSetupInvalidBind, isError: true });
      return;
    }

    setBinding(true);
    setFeedback(null);
    const response = await bindStreamerStudioAgent(streamer.streamerId, normalizedAgentId, normalizedToken);
    setBinding(false);

    if (!response.ok || !response.data) {
      setFeedback({
        message: response.message || t.streamerStudioAgentSetupBindFailed,
        isError: true,
      });
      return;
    }

    setBindAgentToken("");
    setGeneratedToken(null);
    setFeedback({
      message: t.streamerStudioAgentSetupBindSuccess,
      isError: false,
    });
    await loadSetup();
  }, [bindAgentId, bindAgentToken, loadSetup, streamer.streamerId, t.streamerStudioAgentSetupBindFailed, t.streamerStudioAgentSetupBindSuccess, t.streamerStudioAgentSetupInvalidBind]);

  const handleClear = useCallback(async () => {
    const confirmed = window.confirm(t.streamerStudioAgentSetupClearConfirm);
    if (!confirmed) {
      return;
    }

    setClearing(true);
    setFeedback(null);
    const response = await clearStreamerStudioAgent(streamer.streamerId);
    setClearing(false);

    if (!response.ok) {
      setFeedback({
        message: response.message || t.streamerStudioAgentSetupClearFailed,
        isError: true,
      });
      return;
    }

    setGeneratedToken(null);
    setBindAgentToken("");
    setFeedback({
      message: t.streamerStudioAgentSetupClearSuccess,
      isError: false,
    });
    await loadSetup();
  }, [loadSetup, streamer.streamerId, t.streamerStudioAgentSetupClearConfirm, t.streamerStudioAgentSetupClearFailed, t.streamerStudioAgentSetupClearSuccess]);

  if (!streamer.canManage) {
    return null;
  }

  return (
    <section className="agent-setup-card">
      <div className="agent-setup-head">
        <div className="agent-setup-head-copy">
          <h3 className="section-title small">{t.streamerStudioAgentSetupTitle}</h3>
          <p className="market-card-hint">{setup ? compactStatus : t.streamerStudioAgentSetupSubtitle}</p>
        </div>
        <div className="agent-setup-head-actions">
          <button className="pagination-btn ghost" type="button" onClick={() => void loadSetup()} disabled={loading}>
            {t.streamerStudioAgentSetupRefresh}
          </button>
          {setup?.configured ? (
            <button className="pagination-btn ghost streamer-danger-button" type="button" onClick={() => void handleClear()} disabled={clearing}>
              {clearing ? t.streamerStudioAgentSetupClearing : t.streamerStudioAgentSetupClear}
            </button>
          ) : null}
        </div>
      </div>

      {feedback ? (
        <p className={`agent-setup-feedback ${feedback.isError ? "state-error" : "state-ok"}`}>
          {feedback.message}
        </p>
      ) : null}

      {loading && !setup ? <p className="state-text compact">{t.shopObsLoading}</p> : null}

      <div className="agent-setup-status-grid">
        <div className="agent-setup-status-item">
          <span>{t.streamerStudioAgentSetupTitle}</span>
          <strong>{setup?.configured ? t.streamerStudioAgentSetupConfigured : t.streamerStudioAgentSetupNotConfigured}</strong>
        </div>
        <div className="agent-setup-status-item">
          <span>{t.streamerStudioAgentOnline}</span>
          <strong>{setup?.online ? t.streamerStudioAgentOnline : t.streamerStudioAgentOffline}</strong>
        </div>
        <div className="agent-setup-status-item">
          <span>{t.streamerStudioObsStatusLabel}</span>
          <strong>{obsConnectionLabel(t, setup)}</strong>
        </div>
        <div className="agent-setup-status-item">
          <span>{t.streamerStudioAgentSetupLastSeen}</span>
          <strong>{formatLastSeen(t, setup?.lastSeenAt ?? null)}</strong>
        </div>
      </div>

      <div className="agent-setup-meta-row">
        <span className={`meta-badge ${setup?.configured ? "ok" : "muted"}`}>{setup?.configured ? t.streamerStudioAgentSetupConfigured : t.streamerStudioAgentSetupNotConfigured}</span>
        <span className={`meta-badge ${setup?.tokenPresent ? "ok" : "danger"}`}>{setup?.tokenPresent ? t.streamerStudioAgentSetupTokenPresent : t.streamerStudioAgentSetupTokenMissing}</span>
        <span className={`obs-status-pill ${setup ? (setup.online ? "online" : "offline") : "unknown"}`}>{setup?.online ? t.streamerStudioAgentOnline : setup ? t.streamerStudioAgentOffline : t.streamerStudioAgentSetupUnknown}</span>
      </div>

      <div className="agent-setup-diagnostics-grid">
        <p className="market-card-hint"><strong>{t.streamerStudioAgentVersionLabel}:</strong> {setup?.agentVersion ?? "-"}</p>
        <p className="market-card-hint"><strong>{t.streamerStudioRelayProtocolLabel}:</strong> {setup?.relayProtocolVersion ?? "-"}</p>
        <p className="market-card-hint"><strong>{t.streamerStudioCapabilitiesLabel}:</strong> {setup?.capabilities.length ?? 0}</p>
        <p className="market-card-hint"><strong>{t.streamerStudioObsVersionLabel}:</strong> {setup?.obsVersion ?? "-"}</p>
        <p className="market-card-hint"><strong>{t.streamerStudioObsWebsocketVersionLabel}:</strong> {setup?.obsWebsocketVersion ?? "-"}</p>
      </div>

      <div className="agent-setup-info-grid">
        <div className="agent-setup-info-card">
          <h4 className="agent-setup-subtitle">{t.streamerStudioAgentSetupInstructionsTitle}</h4>
          <ul className="agent-setup-instructions">
            <li>{t.streamerStudioAgentSetupInstructionInstall}</li>
            <li>{t.streamerStudioAgentSetupInstructionRelay}</li>
            <li>{t.streamerStudioAgentSetupInstructionAgentId}</li>
            <li>{t.streamerStudioAgentSetupInstructionAgentToken}</li>
            <li>{t.streamerStudioAgentSetupInstructionObs}</li>
            <li>{t.streamerStudioAgentSetupInstructionStart}</li>
          </ul>
          <div className="agent-setup-inline-field">
            <span>{t.streamerStudioAgentSetupRelayLabel}</span>
            <strong>{setup?.relayUrl ?? t.streamerStudioAgentSetupRelayUnavailable}</strong>
          </div>
        </div>

        <div className="agent-setup-info-card">
          <div className="agent-setup-inline-field">
            <span>{t.streamerStudioAgentSetupAgentIdLabel}</span>
            <div className="agent-setup-inline-value">
              <strong>{currentAgentId ?? t.streamerStudioAgentSetupUnknown}</strong>
              {currentAgentId ? (
                <button className="pagination-btn ghost" type="button" onClick={() => void handleCopy(currentAgentId, "agentId")}>
                  {copiedField === "agentId" ? t.streamerStudioAgentSetupCopied : t.streamerStudioAgentSetupCopy}
                </button>
              ) : null}
            </div>
          </div>
          <div className="agent-setup-inline-field">
            <span>{t.streamerStudioAgentSetupTokenLabel}</span>
            <strong>{setup?.tokenPresent ? t.streamerStudioAgentSetupTokenPresent : t.streamerStudioAgentSetupTokenMissing}</strong>
          </div>
        </div>
      </div>

      <div className="agent-setup-action-grid">
        <div className="agent-setup-action-card">
          <h4 className="agent-setup-subtitle">{t.streamerStudioAgentSetupGenerateToken}</h4>
          <label className="streamer-transform-field">
            <span>{t.streamerStudioAgentSetupCustomAgentId}</span>
            <input
              type="text"
              value={customAgentId}
              onChange={(event) => setCustomAgentId(event.target.value.slice(0, 80))}
              placeholder={t.streamerStudioAgentSetupCustomAgentIdPlaceholder}
              maxLength={80}
            />
          </label>
          <button className="pagination-btn" type="button" onClick={() => void handleProvision()} disabled={provisioning}>
            {provisioning ? t.streamerStudioAgentSetupGenerating : t.streamerStudioAgentSetupGenerateToken}
          </button>

          {generatedToken ? (
            <div className="agent-setup-token-box">
              <div className="agent-setup-token-head">
                <strong>{t.streamerStudioAgentSetupOneTimeTitle}</strong>
                <button className="pagination-btn ghost" type="button" onClick={() => void handleCopy(generatedToken.agentToken, "token")}>
                  {copiedField === "token" ? t.streamerStudioAgentSetupCopied : t.streamerStudioAgentSetupCopy}
                </button>
              </div>
              <code>{generatedToken.agentToken}</code>
              <p className="market-card-hint">{t.streamerStudioAgentSetupOneTimeWarning}</p>
            </div>
          ) : null}
        </div>

        <div className="agent-setup-action-card">
          <h4 className="agent-setup-subtitle">{t.streamerStudioAgentSetupBindTitle}</h4>
          <p className="market-card-hint">{t.streamerStudioAgentSetupBindSubtitle}</p>
          <div className="agent-setup-bind-grid">
            <label className="streamer-transform-field">
              <span>{t.streamerStudioAgentSetupAgentIdLabel}</span>
              <input type="text" value={bindAgentId} onChange={(event) => setBindAgentId(event.target.value.slice(0, 80))} maxLength={80} />
            </label>
            <label className="streamer-transform-field">
              <span>{t.streamerStudioAgentSetupTokenLabel}</span>
              <input type="password" value={bindAgentToken} onChange={(event) => setBindAgentToken(event.target.value)} autoComplete="off" />
            </label>
          </div>
          <button className="pagination-btn" type="button" onClick={() => void handleBind()} disabled={binding}>
            {binding ? t.streamerStudioAgentSetupBinding : t.streamerStudioAgentSetupBindButton}
          </button>
        </div>
      </div>
    </section>
  );
}
