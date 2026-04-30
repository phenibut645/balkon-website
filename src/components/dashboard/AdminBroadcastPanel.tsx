"use client";

import { FormEvent, useMemo, useState } from "react";
import { adminBroadcastNotification } from "@/lib/api";
import { DashboardText } from "@/lib/dashboardText";
import { NotificationSeverity } from "@/lib/types";

type AdminBroadcastPanelProps = {
  t: DashboardText;
  onSent: () => void;
};

export function AdminBroadcastPanel({ t, onSent }: AdminBroadcastPanelProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [severity, setSeverity] = useState<NotificationSeverity>("info");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const severityOptions = useMemo(() => ([
    { id: "info" as const, label: t.severityInfo },
    { id: "success" as const, label: t.severitySuccess },
    { id: "warning" as const, label: t.severityWarning },
    { id: "danger" as const, label: t.severityDanger },
  ]), [t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    const normalizedTitle = title.trim();
    const normalizedBody = body.trim();

    if (!normalizedTitle.length || !normalizedBody.length) {
      setError(t.adminBroadcastFailed);
      return;
    }

    if (normalizedTitle.length > 160 || normalizedBody.length > 2000) {
      setError(t.adminBroadcastFailed);
      return;
    }

    setSending(true);
    const response = await adminBroadcastNotification({
      title: normalizedTitle,
      body: normalizedBody,
      imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
      linkUrl: linkUrl.trim() ? linkUrl.trim() : null,
      severity,
    });
    setSending(false);

    if (!response.ok) {
      setError(response.message || response.error || t.adminBroadcastFailed);
      return;
    }

    const inserted = response.data?.inserted ?? 0;
    setFeedback(`${t.adminBroadcastSent} ${inserted}`);
    setTitle("");
    setBody("");
    setImageUrl("");
    setLinkUrl("");
    setSeverity("info");
    onSent();
  }

  return (
    <div className="panel panel-overview admin-items-panel admin-broadcast-panel">
      <h2 className="section-title">{t.adminBroadcast}</h2>

      <form className="admin-item-form" onSubmit={handleSubmit}>
        <div>
          <label className="admin-field-label" htmlFor="broadcastTitle">{t.adminBroadcastTitle}</label>
          <input
            id="broadcastTitle"
            className="admin-field-input"
            value={title}
            maxLength={160}
            onChange={event => setTitle(event.target.value)}
          />
          <p className="market-card-hint">{title.length}/160</p>
        </div>

        <div>
          <label className="admin-field-label" htmlFor="broadcastBody">{t.adminBroadcastBody}</label>
          <textarea
            id="broadcastBody"
            className="admin-field-input admin-textarea"
            value={body}
            maxLength={2000}
            onChange={event => setBody(event.target.value)}
          />
          <p className="market-card-hint">{body.length}/2000</p>
        </div>

        <div className="admin-form-grid">
          <div>
            <label className="admin-field-label" htmlFor="broadcastImage">{t.adminBroadcastImageUrl}</label>
            <input
              id="broadcastImage"
              className="admin-field-input"
              value={imageUrl}
              onChange={event => setImageUrl(event.target.value)}
            />
          </div>

          <div>
            <label className="admin-field-label" htmlFor="broadcastLink">{t.adminBroadcastLinkUrl}</label>
            <input
              id="broadcastLink"
              className="admin-field-input"
              value={linkUrl}
              onChange={event => setLinkUrl(event.target.value)}
            />
          </div>
        </div>

        <div>
          <p className="admin-field-label">{t.adminBroadcastSeverity}</p>
          <div className="inventory-filters">
            {severityOptions.map(option => (
              <button
                key={option.id}
                type="button"
                className={`inventory-filter-chip ${severity === option.id ? "active" : ""}`}
                onClick={() => setSeverity(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {error ? <p className="state-text state-error">{error}</p> : null}
        {feedback ? <p className="state-text state-ok">{feedback}</p> : null}

        <button className="pagination-btn" type="submit" disabled={sending}>
          {sending ? t.adminBroadcastSending : t.adminBroadcastSend}
        </button>
      </form>

      <div className="admin-broadcast-preview">
        <p className="market-card-label">{t.adminBroadcastPreview}</p>
        <article className={`notification-item notification-severity-${severity}`}>
          <p className="display-name">{title.trim() || t.adminBroadcastTitle}</p>
          <p className="notification-body">{body.trim() || t.adminBroadcastBody}</p>
        </article>
      </div>
    </div>
  );
}
