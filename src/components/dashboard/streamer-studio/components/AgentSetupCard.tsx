import { useCallback, useEffect, useMemo, useState } from "react";
import { bindStreamerStudioAgent, clearStreamerStudioAgent, getStreamerStudioAgentSetup, provisionStreamerStudioAgent } from "@/lib/api";
import { DashboardText, formatDashboardDate } from "@/lib/dashboardText";
import { SensitiveValue } from "@/components/dashboard/SensitiveValue";
import {
  StreamerStudioAccessView,
  StreamerStudioAgentProvisionResult,
  StreamerStudioAgentSetupView,
} from "@/lib/types";

type AgentSetupCardProps = {
  t: DashboardText;
  streamer: StreamerStudioAccessView;
  streamerMode?: boolean;
  onSetupChanged?: () => void;
};

type FeedbackState = {
  message: string;
  isError: boolean;
};

type AgentSetupTab = "status" | "setup" | "token" | "bind" | "danger";

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

export function AgentSetupCard({ t, streamer, streamerMode = false, onSetupChanged }: AgentSetupCardProps) {
  const [setup, setSetup] = useState<StreamerStudioAgentSetupView | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [activeTab, setActiveTab] = useState<AgentSetupTab>("status");
  const [customAgentId, setCustomAgentId] = useState("");
  const [bindAgentId, setBindAgentId] = useState("");
  const [bindAgentToken, setBindAgentToken] = useState("");
  const [bindTokenVisible, setBindTokenVisible] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<StreamerStudioAgentProvisionResult | null>(null);
  const [provisioning, setProvisioning] = useState(false);
  const [binding, setBinding] = useState(false);
  const [clearing, setClearing] = useState(false);

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
    setBindTokenVisible(false);
    void loadSetup();
  }, [loadSetup]);

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

  const summaryHint = useMemo(() => {
    if (!setup) {
      return t.streamerStudioAgentSetupSubtitle;
    }

    if (!setup.configured) {
      return t.streamerStudioAgentSetupNotConfigured;
    }

    if (!setup.online) {
      return t.streamerStudioAgentSetupOfflineHint;
    }

    if (setup.obsConnected === false) {
      return t.streamerStudioAgentSetupObsDisconnectedHint;
    }

    if (setup.obsConnected === true) {
      return t.streamerStudioAgentSetupReady;
    }

    return t.streamerStudioAgentSetupUnknown;
  }, [setup, t]);

  const tabItems: Array<{ id: AgentSetupTab; label: string }> = useMemo(() => [
    { id: "status", label: t.streamerStudioAgentSetupTabStatus },
    { id: "setup", label: t.streamerStudioAgentSetupTabSetup },
    { id: "token", label: t.streamerStudioAgentSetupTabToken },
    { id: "bind", label: t.streamerStudioAgentSetupTabManualBind },
    { id: "danger", label: t.streamerStudioAgentSetupTabDanger },
  ], [t]);

  const currentAgentId = setup?.agentId ?? null;
  const capabilityCount = setup?.capabilities.length ?? 0;

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
    onSetupChanged?.();
  }, [customAgentId, loadSetup, onSetupChanged, streamer.streamerId, t.streamerStudioAgentSetupProvisionFailed, t.streamerStudioAgentSetupProvisionSuccess]);

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
    setBindTokenVisible(false);
    setGeneratedToken(null);
    setFeedback({
      message: t.streamerStudioAgentSetupBindSuccess,
      isError: false,
    });
    await loadSetup();
    onSetupChanged?.();
  }, [bindAgentId, bindAgentToken, loadSetup, onSetupChanged, streamer.streamerId, t.streamerStudioAgentSetupBindFailed, t.streamerStudioAgentSetupBindSuccess, t.streamerStudioAgentSetupInvalidBind]);

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
    setBindTokenVisible(false);
    setFeedback({
      message: t.streamerStudioAgentSetupClearSuccess,
      isError: false,
    });
    await loadSetup();
    onSetupChanged?.();
  }, [loadSetup, onSetupChanged, streamer.streamerId, t.streamerStudioAgentSetupClearConfirm, t.streamerStudioAgentSetupClearFailed, t.streamerStudioAgentSetupClearSuccess]);

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
        </div>
      </div>

      {feedback ? (
        <p className={`agent-setup-feedback ${feedback.isError ? "state-error" : "state-ok"}`}>
          {feedback.message}
        </p>
      ) : null}

      {loading && !setup ? <p className="state-text compact">{t.shopObsLoading}</p> : null}

      <div className="agent-setup-summary-grid">
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
          <span>{t.streamerStudioAgentVersionLabel}</span>
          <strong>{setup?.agentVersion ?? "-"}</strong>
        </div>
        <div className="agent-setup-status-item">
          <span>{t.streamerStudioRelayProtocolLabel}</span>
          <strong>{setup?.relayProtocolVersion ?? "-"}</strong>
        </div>
        <div className="agent-setup-status-item">
          <span>{t.streamerStudioCapabilitiesLabel}</span>
          <strong>{capabilityCount}</strong>
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

      <p className={`agent-setup-summary-hint ${setup && setup.online && setup.obsConnected === true ? "state-ok" : setup && ((!setup.online) || setup.obsConnected === false) ? "state-error" : ""}`}>
        {summaryHint}
      </p>

      <div className="shop-subtabs agent-setup-tabs" role="tablist" aria-label={t.streamerStudioAgentSetupTitle}>
        {tabItems.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`shop-subtab-chip ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="agent-setup-tab-panel">
        {activeTab === "status" ? (
          <div className="agent-setup-tab-stack">
            <div className="agent-setup-diagnostics-grid">
              <div className="agent-setup-inline-field">
                <span>{t.streamerStudioAgentSetupTitle}</span>
                <strong>{setup?.configured ? t.streamerStudioAgentSetupConfigured : t.streamerStudioAgentSetupNotConfigured}</strong>
              </div>
              <div className="agent-setup-inline-field">
                <span>{t.streamerStudioAgentOnline}</span>
                <strong>{setup?.online ? t.streamerStudioAgentOnline : t.streamerStudioAgentOffline}</strong>
              </div>
              <div className="agent-setup-inline-field">
                <span>{t.streamerStudioObsStatusLabel}</span>
                <strong>{obsConnectionLabel(t, setup)}</strong>
              </div>
              <div className="agent-setup-inline-field">
                <span>{t.streamerStudioAgentVersionLabel}</span>
                <strong>{setup?.agentVersion ?? "-"}</strong>
              </div>
              <div className="agent-setup-inline-field">
                <span>{t.streamerStudioRelayProtocolLabel}</span>
                <strong>{setup?.relayProtocolVersion ?? "-"}</strong>
              </div>
              <div className="agent-setup-inline-field">
                <span>{t.streamerStudioObsVersionLabel}</span>
                <strong>{setup?.obsVersion ?? "-"}</strong>
              </div>
              <div className="agent-setup-inline-field">
                <span>{t.streamerStudioObsWebsocketVersionLabel}</span>
                <strong>{setup?.obsWebsocketVersion ?? "-"}</strong>
              </div>
              <div className="agent-setup-inline-field">
                <span>{t.streamerStudioCapabilitiesLabel}</span>
                <strong>{capabilityCount}</strong>
              </div>
              <div className="agent-setup-inline-field">
                <span>{t.streamerStudioAgentSetupLastSeen}</span>
                <strong>{formatLastSeen(t, setup?.lastSeenAt ?? null)}</strong>
              </div>
            </div>
            <div className="agent-setup-tab-actions">
              <button className="pagination-btn ghost" type="button" onClick={() => void loadSetup()} disabled={loading}>
                {t.streamerStudioAgentSetupRefresh}
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === "setup" ? (
          <div className="agent-setup-tab-stack">
            <div className="agent-setup-info-card agent-setup-single-card">
              <h4 className="agent-setup-subtitle">{t.streamerStudioAgentSetupInstructionsTitle}</h4>
              <ul className="agent-setup-instructions compact">
                <li>{t.streamerStudioAgentSetupInstructionInstall}</li>
                <li>{t.streamerStudioAgentSetupInstructionObs}</li>
                <li>{t.streamerStudioAgentSetupInstructionStart}</li>
              </ul>
              <div className="agent-setup-inline-field">
                <SensitiveValue
                  t={t}
                  label={t.streamerStudioAgentSetupRelayLabel}
                  value={setup?.relayUrl ?? t.streamerStudioAgentSetupRelayUnavailable}
                  hiddenText={t.streamerStudioSensitiveValueHidden}
                  copyable={Boolean(setup?.relayUrl)}
                  revealable={Boolean(setup?.relayUrl)}
                  forceHidden={streamerMode}
                />
              </div>
              <div className="agent-setup-inline-field">
                {currentAgentId ? (
                  <SensitiveValue
                    t={t}
                    label={t.streamerStudioAgentSetupAgentIdLabel}
                    value={currentAgentId}
                    hiddenText={t.streamerStudioSensitiveValueHidden}
                    copyable
                    revealable
                    forceHidden={streamerMode}
                  />
                ) : (
                  <div className="agent-setup-inline-field">
                    <span>{t.streamerStudioAgentSetupAgentIdLabel}</span>
                    <strong>{t.streamerStudioAgentSetupUnknown}</strong>
                  </div>
                )}
              </div>
              <div className="agent-setup-inline-field">
                <span>{t.streamerStudioAgentSetupTokenLabel}</span>
                <strong>{setup?.tokenPresent ? t.streamerStudioAgentSetupTokenPresent : t.streamerStudioAgentSetupTokenMissing}</strong>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "token" ? (
          <div className="agent-setup-tab-stack">
            <div className="agent-setup-action-card agent-setup-single-card">
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
                  <strong>{t.streamerStudioAgentSetupOneTimeTitle}</strong>
                  <SensitiveValue
                    t={t}
                    value={generatedToken.agentToken}
                    hiddenText={t.streamerStudioTokenHiddenForStreamerMode}
                    copyable
                    revealable
                    className="agent-setup-sensitive-token"
                    forceHidden={streamerMode}
                  />
                  <p className="market-card-hint">{t.streamerStudioAgentSetupCopyNowWarning}</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {activeTab === "bind" ? (
          <div className="agent-setup-tab-stack">
            <div className="agent-setup-action-card agent-setup-single-card">
              <h4 className="agent-setup-subtitle">{t.streamerStudioAgentSetupBindTitle}</h4>
              <p className="market-card-hint">{t.streamerStudioAgentSetupBindSubtitle}</p>
              <div className="agent-setup-bind-grid">
                <label className="streamer-transform-field">
                  <span>{t.streamerStudioAgentSetupAgentIdLabel}</span>
                  <input type="text" value={bindAgentId} onChange={(event) => setBindAgentId(event.target.value.slice(0, 80))} maxLength={80} />
                </label>
                <label className="streamer-transform-field">
                  <span>{t.streamerStudioAgentSetupTokenLabel}</span>
                  <div className="agent-setup-token-input-row">
                    <input type={bindTokenVisible ? "text" : "password"} value={bindAgentToken} onChange={(event) => setBindAgentToken(event.target.value)} autoComplete="off" />
                    <button className="pagination-btn ghost sensitive-value-btn" type="button" onClick={() => setBindTokenVisible(prev => !prev)}>
                      {bindTokenVisible ? t.streamerStudioHideItem : t.streamerStudioRevealToken}
                    </button>
                  </div>
                </label>
              </div>
              <button className="pagination-btn" type="button" onClick={() => void handleBind()} disabled={binding}>
                {binding ? t.streamerStudioAgentSetupBinding : t.streamerStudioAgentSetupBindButton}
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === "danger" ? (
          <div className="agent-setup-tab-stack">
            <div className="agent-setup-action-card agent-setup-single-card danger">
              <h4 className="agent-setup-subtitle">{t.streamerStudioAgentSetupTabDanger}</h4>
              <p className="market-card-hint">{t.streamerStudioAgentSetupClearWarning}</p>
              <div className="agent-setup-tab-actions">
                <button className="pagination-btn ghost streamer-danger-button" type="button" onClick={() => void handleClear()} disabled={clearing || !setup?.configured}>
                  {clearing ? t.streamerStudioAgentSetupClearing : t.streamerStudioAgentSetupClear}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
