import { useCallback, useEffect, useState } from "react";
import { archiveAdminStreamer, listAdminStreamers } from "@/lib/api";
import { DashboardText, formatDashboardDate } from "@/lib/dashboardText";
import { AdminStreamerView } from "@/lib/types";

type AdminStreamersPanelProps = {
  t: DashboardText;
  dateLocale: string;
};

export function AdminStreamersPanel({ t, dateLocale }: AdminStreamersPanelProps) {
  const [streamers, setStreamers] = useState<AdminStreamerView[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyStreamerId, setBusyStreamerId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadStreamers = useCallback(async (silent = false): Promise<void> => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    const response = await listAdminStreamers();
    if (response.ok && Array.isArray(response.data)) {
      setStreamers(response.data);
      if (!silent) {
        setError(null);
      }
    } else if (!silent) {
      setError(response.message || t.adminStreamersLoadFailed);
    }

    if (!silent) {
      setLoading(false);
    }
  }, [t.adminStreamersLoadFailed]);

  useEffect(() => {
    void loadStreamers();
  }, [loadStreamers]);

  const handleArchive = useCallback(async (streamer: AdminStreamerView): Promise<void> => {
    const confirmed = window.confirm(t.adminStreamersArchiveConfirm);
    if (!confirmed) {
      return;
    }

    setBusyStreamerId(streamer.streamerId);
    setError(null);
    setFeedback(null);
    const response = await archiveAdminStreamer(streamer.streamerId);
    setBusyStreamerId(null);

    if (!response.ok) {
      setError(response.message || t.adminStreamersArchiveFailed);
      return;
    }

    setFeedback(t.adminStreamersArchived);
    await loadStreamers(true);
  }, [loadStreamers, t.adminStreamersArchiveConfirm, t.adminStreamersArchiveFailed, t.adminStreamersArchived]);

  return (
    <section className="admin-streamer-applications-panel">
      <div className="inventory-toolbar">
        <div>
          <h2 className="section-title">{t.adminStreamersTitle}</h2>
          <p className="market-card-hint">{t.adminStreamersDescription}</p>
        </div>
        <button className="pagination-btn" type="button" onClick={() => void loadStreamers()} disabled={loading}>
          {t.marketRefresh}
        </button>
      </div>

      {loading ? <p className="state-text">{t.shopObsLoading}</p> : null}
      {error ? <p className="state-text state-error">{error}</p> : null}
      {feedback ? <p className="state-text state-ok">{feedback}</p> : null}
      {!loading && streamers.length === 0 ? <p className="state-text state-empty">{t.adminStreamersEmpty}</p> : null}

      {streamers.length > 0 ? (
        <div className="admin-list-grid streamer-application-admin-grid">
          {streamers.map(streamer => (
            <article className="admin-log-card streamer-application-admin-card" key={streamer.streamerId}>
              <div className="admin-log-head">
                <div>
                  <p className="display-name">{streamer.nickname}</p>
                  <p className="user-id">ID: {streamer.streamerId}</p>
                </div>
                <span className={`obs-action-status ${streamer.obsAgentOnline ? "sent" : streamer.obsAgentConfigured ? "pending" : "failed"}`}>
                  {streamer.obsAgentOnline
                    ? t.streamerStudioAgentOnline
                    : streamer.obsAgentConfigured
                      ? t.adminStreamersConfigured
                      : t.adminStreamersNotConfigured}
                </span>
              </div>

              <div className="botshop-meta">
                <span className="meta-badge muted">{t.adminStreamersOwners}: {streamer.ownerCount}</span>
                <span className="meta-badge muted">{t.adminStreamersObsAgent}: {streamer.obsAgentConfigured ? t.adminStreamersConfigured : t.adminStreamersNotConfigured}</span>
                {streamer.updatedAt ? (
                  <span className="meta-badge muted">{t.updated}: {formatDashboardDate(streamer.updatedAt, dateLocale, t.unknownDate)}</span>
                ) : null}
              </div>

              {streamer.twitchUrl ? (
                <a className="pagination-btn ghost" href={streamer.twitchUrl} target="_blank" rel="noopener noreferrer">
                  Twitch
                </a>
              ) : null}

              <div className="streamer-application-action-row">
                <button
                  className="streamer-danger-button"
                  type="button"
                  disabled={busyStreamerId === streamer.streamerId}
                  onClick={() => void handleArchive(streamer)}
                >
                  {t.adminStreamersArchive}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
