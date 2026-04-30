import { DashboardText, formatDashboardDate } from "@/lib/dashboardText";
import { NotificationItem } from "@/lib/types";

type NotificationsPanelProps = {
  t: DashboardText;
  dateLocale: string;
  notifications: NotificationItem[];
  loading: boolean;
  error: string | null;
  unreadOnly: boolean;
  page: number;
  pageSize: number;
  total: number;
  onUnreadOnlyChange: (next: boolean) => void;
  onPageChange: (nextPage: number) => void;
  onRefresh: () => void;
  onMarkRead: (id: number) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
};

export function NotificationsPanel({
  t,
  dateLocale,
  notifications,
  loading,
  error,
  unreadOnly,
  page,
  pageSize,
  total,
  onUnreadOnlyChange,
  onPageChange,
  onRefresh,
  onMarkRead,
  onMarkAllRead,
}: NotificationsPanelProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="panel panel-overview notifications-panel">
      <div className="inventory-toolbar">
        <h2 className="section-title">{t.allNotifications}</h2>
        <div className="admin-form-actions">
          <button className="pagination-btn" type="button" onClick={onRefresh}>{t.notificationRefresh}</button>
          <button className="pagination-btn ghost" type="button" onClick={() => void onMarkAllRead()}>{t.markAllRead}</button>
        </div>
      </div>

      <div className="inventory-toolbar">
        <div className="inventory-filters" role="tablist" aria-label={t.notifications}>
          <button
            type="button"
            className={`inventory-filter-chip ${!unreadOnly ? "active" : ""}`}
            onClick={() => onUnreadOnlyChange(false)}
          >
            {t.allNotifications}
          </button>
          <button
            type="button"
            className={`inventory-filter-chip ${unreadOnly ? "active" : ""}`}
            onClick={() => onUnreadOnlyChange(true)}
          >
            {t.unreadOnly}
          </button>
        </div>
      </div>

      {loading ? <p className="state-text">{t.notificationLoading}</p> : null}
      {!loading && error ? <p className="state-text state-error">{error}</p> : null}
      {!loading && !error && notifications.length === 0 ? <p className="state-text state-empty">{t.notificationEmpty}</p> : null}

      {!loading && !error && notifications.length > 0 ? (
        <div className="notifications-list">
          {notifications.map(item => (
            <article
              key={`notification-${item.id}`}
              className={`notification-item notification-severity-${item.severity} ${item.readAt ? "" : "unread"}`}
            >
              <div className="admin-log-head">
                <p className="display-name">{item.title}</p>
                <span className="meta-badge">{formatDashboardDate(item.createdAt, dateLocale, t.unknownDate)}</span>
              </div>

              <p className="notification-body">{item.body}</p>

              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.title} className="notification-image" />
              ) : null}

              <div className="admin-form-actions">
                {!item.readAt ? (
                  <button className="pagination-btn" type="button" onClick={() => void onMarkRead(item.id)}>{t.markRead}</button>
                ) : (
                  <span className="meta-badge ok">{t.notificationRead}</span>
                )}

                {item.linkUrl ? (
                  <a
                    href={item.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pagination-btn ghost"
                  >
                    {t.notificationOpenLink}
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <div className="inventory-pagination">
        <button className="pagination-btn" type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          {t.previous}
        </button>
        <span className="pagination-status">{t.page} {page} / {totalPages}</span>
        <button className="pagination-btn" type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          {t.next}
        </button>
      </div>
    </div>
  );
}
