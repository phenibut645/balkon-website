import { DashboardText } from "@/lib/dashboardText";
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

function formatNotificationDate(value: string, dateLocale: string, unknownDate: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return unknownDate;
  }

  return date.toLocaleString(dateLocale, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function localizeNotificationTitle(t: DashboardText, item: NotificationItem): string {
  if (item.type === "obs_media" || item.title === "OBS effect sent") {
    return t.obsNotificationTitle;
  }

  if (item.type === "economy_adjustment" || item.title === "Balance updated") {
    return t.balanceUpdated;
  }

  return item.title;
}

function localizeNotificationBody(t: DashboardText, item: NotificationItem): string {
  if (item.type === "obs_media") {
    const match = item.body.match(/media effect '(.+)' was sent to (.+)\./i);
    if (match?.[1] && match?.[2]) {
      return `${t.obsNotificationEffectPrefix} ${match[1]} ${t.obsNotificationSentTo} ${match[2]}.`;
    }

    return t.obsNotificationBody;
  }

  return item.body;
}

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
  const unreadCount = notifications.filter(item => !item.readAt).length;

  return (
    <div className="panel panel-overview notifications-panel">
      <div className="notifications-header">
        <div className="notifications-title-row">
          <div>
            <h2 className="section-title">{t.allNotifications}</h2>
            <div className="notifications-counter-row">
              <span className="meta-badge muted">{t.total}: {total}</span>
              {unreadCount > 0 ? <span className="meta-badge ok">{t.notificationUnread}: {unreadCount}</span> : null}
            </div>
          </div>
        </div>
        <div className="notifications-actions">
          <button className="pagination-btn" type="button" onClick={onRefresh}>{t.notificationRefresh}</button>
          <button className="pagination-btn ghost" type="button" onClick={() => void onMarkAllRead()}>{t.markAllRead}</button>
        </div>
      </div>

      <div className="notifications-filter-row">
        <div className="shop-subtabs" role="tablist" aria-label={t.notifications}>
          <button
            type="button"
            className={`shop-subtab-chip ${!unreadOnly ? "active" : ""}`}
            onClick={() => onUnreadOnlyChange(false)}
          >
            {t.allNotifications}
          </button>
          <button
            type="button"
            className={`shop-subtab-chip ${unreadOnly ? "active" : ""}`}
            onClick={() => onUnreadOnlyChange(true)}
          >
            {t.unreadOnly}
          </button>
        </div>
      </div>

      <div className="notifications-page-body">
        {loading ? <div className="notifications-state-card">{t.notificationLoading}</div> : null}
        {!loading && error ? (
          <div className="notifications-state-card error">
            <p>{error}</p>
            <button className="pagination-btn" type="button" onClick={onRefresh}>{t.retry}</button>
          </div>
        ) : null}
        {!loading && !error && notifications.length === 0 ? <div className="notifications-state-card empty">{t.notificationEmpty}</div> : null}

        {!loading && !error && notifications.length > 0 ? (
          <div className="notifications-list">
            {notifications.map(item => {
              const title = localizeNotificationTitle(t, item);
              const body = localizeNotificationBody(t, item);

              return (
                <article
                  key={`notification-${item.id}`}
                  className={`notification-card notification-severity-${item.severity} ${item.readAt ? "notification-card-read" : "notification-card-unread"}`}
                >
                  <div className="notification-card-accent" aria-hidden="true" />
                  <div className="notification-card-main">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={title} className="notification-image" />
                    ) : null}
                    <div className="notification-card-copy">
                      <div className="notification-title-line">
                        <p className="notification-title">{title}</p>
                        {!item.readAt ? <span className="notification-unread-dot" aria-label={t.notificationUnread} /> : null}
                      </div>
                      <p className="notification-body">{body}</p>
                    </div>
                  </div>

                  <div className="notification-card-meta">
                    <span className="meta-badge muted">{formatNotificationDate(item.createdAt, dateLocale, t.unknownDate)}</span>
                    {item.readAt ? <span className="meta-badge muted">{t.notificationRead}</span> : <span className="meta-badge ok">{t.notificationUnread}</span>}
                  </div>

                  <div className="notification-card-actions">
                    {!item.readAt ? (
                      <button className="pagination-btn compact" type="button" onClick={() => void onMarkRead(item.id)}>{t.markRead}</button>
                    ) : null}

                    {item.linkUrl ? (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pagination-btn ghost compact"
                      >
                        {t.notificationOpenLink}
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="notifications-pagination">
        <button className="pagination-btn" type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          {t.previous}
        </button>
        <span className="pagination-status">{t.page} {page} / {totalPages} · {t.total}: {total}</span>
        <button className="pagination-btn" type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          {t.next}
        </button>
      </div>
    </div>
  );
}
