"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { NotificationItem } from "@/lib/types";

type NotificationSummary = {
  unreadCount: number;
  latest: NotificationItem[];
};

type NotificationBellProps = {
  t: DashboardText;
  summary: NotificationSummary;
  loading: boolean;
  error: string | null;
  onOpenAll: () => void;
  onRefresh: () => void;
  onMarkRead: (id: number) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
};

export function NotificationBell({
  t,
  summary,
  loading,
  error,
  onOpenAll,
  onRefresh,
  onMarkRead,
  onMarkAllRead,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent): void {
      if (!open) return;
      const node = rootRef.current;
      if (node && !node.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      onRefresh();
    }
  }, [open, onRefresh]);

  return (
    <div className="notification-bell" ref={rootRef}>
      <button
        type="button"
        className="notification-bell-button"
        aria-label={t.notificationBellAria}
        onClick={() => setOpen(prev => !prev)}
      >
        <span aria-hidden="true">🔔</span>
        {summary.unreadCount > 0 ? <span className="notification-unread-dot" aria-hidden="true" /> : null}
      </button>

      {open ? (
        <div className="notification-dropdown">
          <div className="notification-dropdown-head">
            <p className="dropdown-name">{t.notifications}</p>
            <p className="dropdown-id">{t.notificationUnread}: {summary.unreadCount}</p>
          </div>

          <div className="notification-dropdown-body">
            {loading ? <p className="state-text">{t.notificationLoading}</p> : null}
            {!loading && error ? <p className="state-text state-error">{error}</p> : null}
            {!loading && !error && summary.latest.length === 0 ? (
              <p className="state-text state-empty">{t.noNotificationsYet}</p>
            ) : null}

            {!loading && !error && summary.latest.length > 0 ? (
              <div className="notification-dropdown-list">
                {summary.latest.map((item, index) => {
                  const faded = summary.latest.length > 2 && index === summary.latest.length - 1;
                  return (
                    <button
                      key={`notif-bell-${item.id}`}
                      type="button"
                      className={`notification-dropdown-card notification-severity-${item.severity} ${item.readAt ? "" : "unread"} ${faded ? "notification-dropdown-fade" : ""}`}
                      onClick={() => {
                        if (!item.readAt) {
                          void onMarkRead(item.id);
                        }
                      }}
                    >
                      <p className="notification-title">{item.title}</p>
                      <p className="notification-body">{item.body}</p>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="notification-dropdown-actions">
            {summary.unreadCount > 0 ? (
              <button
                type="button"
                className="pagination-btn"
                onClick={() => {
                  void onMarkAllRead();
                }}
              >
                {t.markAllRead}
              </button>
            ) : null}
            <button
              type="button"
              className="pagination-btn ghost"
              onClick={() => {
                onOpenAll();
                setOpen(false);
              }}
            >
              {t.viewAll}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
