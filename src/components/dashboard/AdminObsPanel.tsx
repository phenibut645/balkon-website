import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminObsMediaActions } from "@/lib/api";
import { DashboardText, formatDashboardDate } from "@/lib/dashboardText";
import { AdminStats, ObsMediaAction, ObsMediaActionStatus } from "@/lib/types";
import { useSafePolling } from "@/hooks/useSafePolling";

type AdminObsPanelProps = {
  t: DashboardText;
  adminStats: AdminStats | null;
  dateLocale: string;
};

function getStatusLabel(t: DashboardText, status: ObsMediaActionStatus): string {
  if (status === "pending") {
    return t.obsActionStatusPending;
  }
  if (status === "sent") {
    return t.obsActionStatusSent;
  }
  if (status === "failed") {
    return t.obsActionStatusFailed;
  }
  return t.obsActionStatusRefunded;
}

function formatActionDate(value: string | null, dateLocale: string, unknownDate: string): string {
  if (!value) {
    return unknownDate;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return unknownDate;
  }

  return date.toLocaleString(dateLocale);
}

function formatDuration(durationMs: number): string {
  const seconds = Math.max(1, Math.round(durationMs / 1000));
  return `${seconds} sec`;
}

export function AdminObsPanel({ t, adminStats, dateLocale }: AdminObsPanelProps) {
  const [actions, setActions] = useState<ObsMediaAction[]>([]);
  const [statusFilter, setStatusFilter] = useState<ObsMediaActionStatus | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const statusFilters = useMemo(() => ([
    { value: null, label: t.allStatuses },
    { value: "pending" as const, label: t.obsActionStatusPending },
    { value: "sent" as const, label: t.obsActionStatusSent },
    { value: "failed" as const, label: t.obsActionStatusFailed },
    { value: "refunded" as const, label: t.obsActionStatusRefunded },
  ]), [t]);

  const loadActions = useCallback(async (
    nextPage: number,
    nextStatus: ObsMediaActionStatus | null,
    silent = false,
  ): Promise<void> => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    const response = await getAdminObsMediaActions({
      page: nextPage,
      pageSize,
      status: nextStatus,
    });

    if (response.ok) {
      setActions(response.actions ?? []);
      setPage(response.page ?? nextPage);
      setTotal(response.total ?? 0);
      if (!silent) {
        setError(null);
      }
    } else if (!silent) {
      setError(response.message || t.obsMediaHistoryError);
    }

    if (!silent) {
      setLoading(false);
    }
  }, [pageSize, t.obsMediaHistoryError]);

  useEffect(() => {
    void loadActions(1, statusFilter);
  }, [loadActions, statusFilter]);

  useSafePolling({
    enabled: true,
    intervalMs: 60000,
    minGapMs: 15000,
    task: async () => {
      await loadActions(page, statusFilter, true);
    },
  });

  return (
    <div className="panel panel-overview admin-list-panel admin-obs-diagnostics">
      {adminStats && adminStats.obsSettings.length > 0 ? (
        <div className="admin-list-grid">
          {adminStats.obsSettings.map((setting, index) => (
            <article className="admin-log-card" key={`${setting.setting_key}-${index}`}>
              <p className="display-name">{setting.setting_key}</p>
              <p className="user-id">
                {setting.setting_key === "obs_websocket_password" && setting.setting_value
                  ? "********"
                  : (setting.setting_value || "-")}
              </p>
              <p className="user-id">{t.updated}: {formatDashboardDate(setting.updated_at, dateLocale, t.unknownDate)}</p>
            </article>
          ))}
          <article className="admin-log-card">
            <p className="display-name">{t.contributors}</p>
            <div className="badges">
              {adminStats.contributors.length > 0
                ? adminStats.contributors.map(contributor => <span className="badge" key={contributor}>{contributor}</span>)
                : <span className="badge">{t.none}</span>}
            </div>
          </article>
        </div>
      ) : (
        <p className="state-text state-empty">{t.adminObsEmpty}</p>
      )}

      <section className="obs-history-panel admin-obs-actions-panel">
        <div className="inventory-toolbar">
          <h2 className="section-title">{t.adminObsMediaActions}</h2>
          <button className="pagination-btn" type="button" onClick={() => void loadActions(page, statusFilter)} disabled={loading}>
            {t.marketRefresh}
          </button>
        </div>

        <div className="shop-subtabs" role="tablist" aria-label={t.actionStatus}>
          {statusFilters.map(filter => (
            <button
              className={`shop-subtab-chip ${statusFilter === filter.value ? "active" : ""}`}
              key={filter.value ?? "all"}
              type="button"
              onClick={() => {
                setStatusFilter(filter.value);
                setPage(1);
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading ? <p className="state-text">{t.obsMediaHistoryLoading}</p> : null}
        {!loading && error ? <p className="state-text state-error">{error}</p> : null}
        {!loading && !error && actions.length === 0 ? <p className="state-text state-empty">{t.obsMediaHistoryEmpty}</p> : null}

        {!loading && !error && actions.length > 0 ? (
          <div className="obs-action-list">
            {actions.map(action => (
              <article className="admin-log-card obs-action-card" key={action.id}>
                <div className="obs-action-card-head">
                  <div>
                    <p className="display-name">{action.productTitle}</p>
                    <p className="market-card-hint">{action.productId} · {action.productKind.toUpperCase()} · {formatDuration(action.durationMs)}</p>
                  </div>
                  <span className={`obs-action-status ${action.status}`}>{getStatusLabel(t, action.status)}</span>
                </div>
                <div className="obs-action-grid">
                  <p className="user-id">{t.actionBuyer}: {action.buyerDisplayName || action.buyerDiscordId}</p>
                  <p className="user-id">{t.actionStreamer}: {action.streamerNickname}</p>
                  <p className="user-id">{t.actionProduct}: {action.productTitle}</p>
                  <p className="user-id">{t.botShopPrice}: {action.priceOdm} {t.odm}</p>
                  {action.commandId ? <p className="user-id">{t.commandId}: {action.commandId}</p> : null}
                </div>
                <div className="botshop-meta obs-action-meta">
                  <span className="meta-badge muted">{t.obtained}: {formatActionDate(action.createdAt, dateLocale, t.unknownDate)}</span>
                  {action.sentAt ? <span className="meta-badge ok">{t.obsActionStatusSent}: {formatActionDate(action.sentAt, dateLocale, t.unknownDate)}</span> : null}
                  {action.failedAt ? <span className="meta-badge danger">{t.obsActionStatusFailed}: {formatActionDate(action.failedAt, dateLocale, t.unknownDate)}</span> : null}
                  {action.refundedAt || action.refundedOdm > 0 ? (
                    <span className="meta-badge price">{t.refunded}: {action.refundedOdm} {t.odm}{action.refundedAt ? ` · ${formatActionDate(action.refundedAt, dateLocale, t.unknownDate)}` : ""}</span>
                  ) : null}
                </div>
                {(action.status === "failed" || action.status === "refunded") && (action.errorMessage || action.errorCode) ? (
                  <p className="obs-action-error">{t.errorMessage}: {action.errorCode ? `${action.errorCode}: ` : ""}{action.errorMessage || ""}</p>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        <div className="pagination-controls">
          <button
            className="pagination-btn"
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => void loadActions(page - 1, statusFilter)}
          >
            {t.previous}
          </button>
          <span className="pagination-status">{t.page} {page} / {totalPages}</span>
          <button
            className="pagination-btn"
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => void loadActions(page + 1, statusFilter)}
          >
            {t.next}
          </button>
        </div>
      </section>
    </div>
  );
}
