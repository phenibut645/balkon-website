import { useCallback, useEffect, useMemo, useState } from "react";
import { approveStreamerApplication, listAdminStreamerApplications, rejectStreamerApplication } from "@/lib/api";
import { DashboardText, formatDashboardDate } from "@/lib/dashboardText";
import { AdminStreamerApplicationStatusFilter, StreamerApplicationStatus, StreamerApplicationView } from "@/lib/types";

type AdminStreamerApplicationsPanelProps = {
  t: DashboardText;
  dateLocale: string;
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

export function AdminStreamerApplicationsPanel({ t, dateLocale }: AdminStreamerApplicationsPanelProps) {
  const [applications, setApplications] = useState<StreamerApplicationView[]>([]);
  const [statusFilter, setStatusFilter] = useState<AdminStreamerApplicationStatusFilter>("pending");
  const [loading, setLoading] = useState(false);
  const [busyApplicationId, setBusyApplicationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});

  const filters = useMemo(() => ([
    { value: "pending" as const, label: t.streamerApplicationStatusPending },
    { value: "approved" as const, label: t.streamerApplicationStatusApproved },
    { value: "rejected" as const, label: t.streamerApplicationStatusRejected },
    { value: "all" as const, label: t.allStatuses },
  ]), [t]);

  const loadApplications = useCallback(async (silent = false): Promise<void> => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    const response = await listAdminStreamerApplications(statusFilter);
    if (response.ok) {
      setApplications(response.data ?? []);
      if (!silent) {
        setError(null);
      }
    } else if (!silent) {
      setError(response.message || t.streamerApplicationLoadFailed);
    }

    if (!silent) {
      setLoading(false);
    }
  }, [statusFilter, t.streamerApplicationLoadFailed]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  async function handleApprove(applicationId: number): Promise<void> {
    setBusyApplicationId(applicationId);
    setError(null);
    setFeedback(null);

    const response = await approveStreamerApplication(applicationId);
    setBusyApplicationId(null);

    if (!response.ok) {
      setError(response.message || response.error || t.streamerApplicationApproveFailed);
      return;
    }

    setFeedback(t.streamerApplicationApprovedFeedback);
    await loadApplications(true);
  }

  async function handleReject(applicationId: number): Promise<void> {
    setBusyApplicationId(applicationId);
    setError(null);
    setFeedback(null);

    const response = await rejectStreamerApplication(applicationId, rejectReasons[applicationId] ?? "");
    setBusyApplicationId(null);

    if (!response.ok) {
      setError(response.message || response.error || t.streamerApplicationRejectFailed);
      return;
    }

    setFeedback(t.streamerApplicationRejectedFeedback);
    setRejectReasons(previous => ({ ...previous, [applicationId]: "" }));
    await loadApplications(true);
  }

  return (
    <section className="admin-streamer-applications-panel">
      <div className="inventory-toolbar">
        <div>
          <h2 className="section-title">{t.adminStreamerApplicationsTitle}</h2>
          <p className="market-card-hint">{t.adminStreamerApplicationsDescription}</p>
        </div>
        <button className="pagination-btn" type="button" onClick={() => void loadApplications()} disabled={loading}>
          {t.marketRefresh}
        </button>
      </div>

      <div className="shop-subtabs" role="tablist" aria-label={t.adminStreamerApplicationsTitle}>
        {filters.map(filter => (
          <button
            className={`shop-subtab-chip ${statusFilter === filter.value ? "active" : ""}`}
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? <p className="state-text">{t.shopObsLoading}</p> : null}
      {error ? <p className="state-text state-error">{error}</p> : null}
      {feedback ? <p className="state-text state-ok">{feedback}</p> : null}
      {!loading && applications.length === 0 ? <p className="state-text state-empty">{t.streamerApplicationListEmpty}</p> : null}

      {applications.length > 0 ? (
        <div className="admin-list-grid streamer-application-admin-grid">
          {applications.map(application => (
            <article className="admin-log-card streamer-application-admin-card" key={application.id}>
              <div className="admin-log-head">
                <div>
                  <p className="display-name">{application.requestedNickname}</p>
                  <p className="user-id">{application.applicant?.displayName ?? application.applicant?.discordId ?? "-"}</p>
                </div>
                <span className={`obs-action-status ${application.status === "approved" ? "sent" : application.status === "rejected" ? "failed" : "pending"}`}>
                  {statusLabel(t, application.status)}
                </span>
              </div>

              <div className="botshop-meta">
                <span className="meta-badge">#{application.id}</span>
                <span className="meta-badge muted">{t.streamerApplicationDiscordGuildId}: {application.discordGuildId}</span>
                {application.streamerId ? <span className="meta-badge ok">Streamer ID: {application.streamerId}</span> : null}
                {application.status === "approved" && application.streamerActive === false ? (
                  <span className="meta-badge danger">{t.streamerApplicationStreamerArchived}</span>
                ) : null}
              </div>

              {application.twitchUrl ? (
                <a className="pagination-btn ghost" href={application.twitchUrl} target="_blank" rel="noopener noreferrer">
                  Twitch
                </a>
              ) : null}

              {application.description ? <p className="market-card-hint">{application.description}</p> : null}
              <p className="user-id">{t.obtained}: {formatDashboardDate(application.createdAt, dateLocale, t.unknownDate)}</p>
              {application.status === "approved" && application.streamerActive === false ? (
                <p className="state-text state-error">{t.streamerApplicationApprovedArchived}</p>
              ) : null}
              {application.rejectionReason ? (
                <p className="state-text state-error">{t.streamerApplicationRejectionReason}: {application.rejectionReason}</p>
              ) : null}

              {application.status === "pending" ? (
                <div className="streamer-application-admin-actions">
                  <textarea
                    className="admin-field-input admin-textarea"
                    value={rejectReasons[application.id] ?? ""}
                    onChange={event => setRejectReasons(previous => ({ ...previous, [application.id]: event.target.value }))}
                    maxLength={500}
                    placeholder={t.streamerApplicationRejectionReason}
                  />
                  <div className="streamer-application-action-row">
                    <button
                      className="pagination-btn"
                      type="button"
                      disabled={busyApplicationId === application.id}
                      onClick={() => void handleApprove(application.id)}
                    >
                      {t.streamerApplicationApprove}
                    </button>
                    <button
                      className="streamer-danger-button"
                      type="button"
                      disabled={busyApplicationId === application.id}
                      onClick={() => void handleReject(application.id)}
                    >
                      {t.streamerApplicationReject}
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
