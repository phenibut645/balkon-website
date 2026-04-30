"use client";

import { useCallback, useEffect, useState } from "react";
import { getMyObsMediaActions } from "@/lib/api";
import { DashboardText } from "@/lib/dashboardText";
import { ObsMediaAction, ObsMediaActionStatus } from "@/lib/types";
import { useSafePolling } from "@/hooks/useSafePolling";

type BotShopObsHistoryPanelProps = {
  t: DashboardText;
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

export function BotShopObsHistoryPanel({ t, dateLocale }: BotShopObsHistoryPanelProps) {
  const [actions, setActions] = useState<ObsMediaAction[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadActions = useCallback(async (nextPage: number, silent = false): Promise<void> => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    const response = await getMyObsMediaActions({ page: nextPage, pageSize });
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
    void loadActions(1);
  }, [loadActions]);

  useSafePolling({
    enabled: true,
    intervalMs: 60000,
    minGapMs: 15000,
    task: async () => {
      await loadActions(page, true);
    },
  });

  return (
    <section className="obs-history-panel">
      <div className="inventory-toolbar">
        <h2 className="section-title">{t.obsMediaHistory}</h2>
        <button className="pagination-btn" type="button" onClick={() => void loadActions(page)} disabled={loading}>
          {t.marketRefresh}
        </button>
      </div>

      {loading ? <p className="state-text">{t.obsMediaHistoryLoading}</p> : null}
      {!loading && error ? <p className="state-text state-error">{error}</p> : null}
      {!loading && !error && actions.length === 0 ? <p className="state-text state-empty">{t.obsMediaHistoryEmpty}</p> : null}

      {!loading && !error && actions.length > 0 ? (
        <div className="obs-action-list">
          {actions.map(action => (
            <article className="admin-log-card obs-action-card" key={action.id}>
              <div className="admin-log-head">
                <p className="display-name">{action.productTitle}</p>
                <span className={`obs-action-status ${action.status}`}>{getStatusLabel(t, action.status)}</span>
              </div>
              <div className="botshop-meta">
                <span className="meta-badge muted">{action.productKind.toUpperCase()}</span>
                <span className="meta-badge price">{action.priceOdm} {t.odm}</span>
                <span className="meta-badge muted">{action.streamerNickname}</span>
              </div>
              <p className="user-id">{t.obtained}: {formatActionDate(action.createdAt, dateLocale, t.unknownDate)}</p>
              {action.status === "refunded" ? (
                <p className="user-id">{t.refunded}: {action.refundedOdm} {t.odm}</p>
              ) : null}
              {action.errorMessage ? (
                <p className="state-text state-error">{t.errorMessage}: {action.errorMessage}</p>
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
          onClick={() => void loadActions(page - 1)}
        >
          {t.previous}
        </button>
        <span className="pagination-status">{t.page} {page} / {totalPages}</span>
        <button
          className="pagination-btn"
          type="button"
          disabled={page >= totalPages || loading}
          onClick={() => void loadActions(page + 1)}
        >
          {t.next}
        </button>
      </div>
    </section>
  );
}
