import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { getMyStreamerApplications, submitStreamerApplication } from "@/lib/api";
import { DashboardText, formatDashboardDate } from "@/lib/dashboardText";
import { StreamerApplicationStatus, StreamerApplicationView } from "@/lib/types";

type StreamerApplicationCardProps = {
  t: DashboardText;
  active: boolean;
  dateLocale: string;
  initialGuildId?: string | null;
};

function statusLabel(t: DashboardText, status: StreamerApplicationStatus): string {
  if (status === "approved") {
    return t.streamerApplicationStatusApproved;
  }
  if (status === "rejected") {
    return t.streamerApplicationStatusRejected;
  }
  return t.streamerApplicationStatusPending;
}

function latestFirst(applications: StreamerApplicationView[]): StreamerApplicationView[] {
  return [...applications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function StreamerApplicationCard({ t, active, dateLocale, initialGuildId }: StreamerApplicationCardProps) {
  const [applications, setApplications] = useState<StreamerApplicationView[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [discordGuildId, setDiscordGuildId] = useState(initialGuildId ?? "");
  const [requestedNickname, setRequestedNickname] = useState("");
  const [twitchUrl, setTwitchUrl] = useState("");
  const [description, setDescription] = useState("");

  const sortedApplications = useMemo(() => latestFirst(applications), [applications]);
  const hasPendingApplication = sortedApplications.some(application => application.status === "pending");

  useEffect(() => {
    if (!discordGuildId.trim() && initialGuildId) {
      setDiscordGuildId(initialGuildId);
    }
  }, [discordGuildId, initialGuildId]);

  const loadApplications = useCallback(async (silent = false): Promise<void> => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    const response = await getMyStreamerApplications();
    if (response.ok) {
      setApplications(response.data ?? []);
      setLoaded(true);
      if (!silent) {
        setError(null);
      }
    } else if (!silent) {
      setError(response.message || t.streamerApplicationLoadFailed);
    }

    if (!silent) {
      setLoading(false);
    }
  }, [t.streamerApplicationLoadFailed]);

  useEffect(() => {
    if (!active || loaded || loading) {
      return;
    }

    void loadApplications();
  }, [active, loaded, loadApplications, loading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setFeedback(null);

    const payload = {
      discordGuildId: discordGuildId.trim(),
      requestedNickname: requestedNickname.trim(),
      twitchUrl: twitchUrl.trim() || null,
      description: description.trim() || null,
    };

    if (!payload.discordGuildId || !payload.requestedNickname) {
      setError(t.streamerApplicationSubmitFailed);
      return;
    }

    setSubmitting(true);
    const response = await submitStreamerApplication(payload);
    setSubmitting(false);

    if (!response.ok || !response.data) {
      setError(response.message || response.error || t.streamerApplicationSubmitFailed);
      return;
    }

    setFeedback(t.streamerApplicationSubmitted);
    setRequestedNickname("");
    setTwitchUrl("");
    setDescription("");
    await loadApplications(true);
  }

  return (
    <section className="streamer-application-card">
      <div className="inventory-toolbar">
        <div>
          <h2 className="section-title">{t.streamerApplicationCta}</h2>
          <p className="market-card-hint">{t.streamerApplicationIntro}</p>
        </div>
        <button className="pagination-btn ghost" type="button" onClick={() => void loadApplications()} disabled={loading}>
          {t.streamerStudioRefresh}
        </button>
      </div>

      {loading ? <p className="state-text">{t.shopObsLoading}</p> : null}
      {error ? <p className="state-text state-error">{error}</p> : null}
      {feedback ? <p className="state-text state-ok">{feedback}</p> : null}

      {sortedApplications.length > 0 ? (
        <div className="streamer-application-list">
          {sortedApplications.map(application => (
            <article className="streamer-application-status-card" key={application.id}>
              <div className="admin-log-head">
                <div>
                  <p className="display-name">{application.requestedNickname}</p>
                  <p className="market-card-hint">{t.streamerApplicationDiscordGuildId}: {application.discordGuildId}</p>
                </div>
                <span className={`obs-action-status ${application.status === "approved" ? "sent" : application.status === "rejected" ? "failed" : "pending"}`}>
                  {statusLabel(t, application.status)}
                </span>
              </div>
              <div className="botshop-meta">
                <span className="meta-badge muted">{t.obtained}: {formatDashboardDate(application.createdAt, dateLocale, t.unknownDate)}</span>
                {application.streamerId ? <span className="meta-badge ok">Streamer ID: {application.streamerId}</span> : null}
              </div>
              {application.rejectionReason ? (
                <p className="state-text state-error">{t.streamerApplicationRejectionReason}: {application.rejectionReason}</p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      <form className="admin-item-form streamer-application-form" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <div>
            <label className="admin-field-label" htmlFor="streamerApplicationGuildId">{t.streamerApplicationDiscordGuildId}</label>
            <input
              id="streamerApplicationGuildId"
              className="admin-field-input"
              value={discordGuildId}
              onChange={event => setDiscordGuildId(event.target.value)}
              placeholder="123456789012345678"
              inputMode="numeric"
            />
            <p className="market-card-hint">{t.streamerApplicationGuildHint}</p>
          </div>

          <div>
            <label className="admin-field-label" htmlFor="streamerApplicationNickname">{t.streamerApplicationNickname}</label>
            <input
              id="streamerApplicationNickname"
              className="admin-field-input"
              value={requestedNickname}
              onChange={event => setRequestedNickname(event.target.value)}
              maxLength={100}
            />
          </div>
        </div>

        <div className="admin-form-grid">
          <div>
            <label className="admin-field-label" htmlFor="streamerApplicationTwitchUrl">{t.streamerApplicationTwitchUrl}</label>
            <input
              id="streamerApplicationTwitchUrl"
              className="admin-field-input"
              value={twitchUrl}
              onChange={event => setTwitchUrl(event.target.value)}
              placeholder="https://www.twitch.tv/name"
            />
          </div>

          <div>
            <label className="admin-field-label" htmlFor="streamerApplicationDescription">{t.streamerApplicationDescription}</label>
            <textarea
              id="streamerApplicationDescription"
              className="admin-field-input admin-textarea"
              value={description}
              onChange={event => setDescription(event.target.value)}
              maxLength={1000}
            />
          </div>
        </div>

        <button className="pagination-btn" type="submit" disabled={submitting || hasPendingApplication}>
          {submitting ? t.streamerApplicationSubmitting : t.streamerApplicationSubmit}
        </button>
      </form>
    </section>
  );
}
