import { useCallback, useEffect, useState } from "react";
import { addStreamerStudioTrustedUser, deleteStreamerStudioTrustedUser, getStreamerStudioTrustedUsers } from "@/lib/api";
import { DashboardText } from "@/lib/dashboardText";
import { StreamerStudioTrustedUserRole, StreamerStudioTrustedUserView } from "@/lib/types";

type StreamerTrustedUsersPanelProps = {
  t: DashboardText;
  streamerId: number;
};

function displayNameForUser(user: StreamerStudioTrustedUserView): string {
  return user.displayName?.trim() || user.username?.trim() || user.discordId;
}

function roleLabel(t: DashboardText, role: StreamerStudioTrustedUserRole): string {
  return role === "manager" ? t.streamerStudioTrustedUsersManager : t.streamerStudioTrustedUsersModerator;
}

function isValidDiscordId(value: string): boolean {
  return /^\d{1,32}$/.test(value.trim());
}

export function StreamerTrustedUsersPanel({ t, streamerId }: StreamerTrustedUsersPanelProps) {
  const [users, setUsers] = useState<StreamerStudioTrustedUserView[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [discordId, setDiscordId] = useState("");
  const [role, setRole] = useState<StreamerStudioTrustedUserRole>("moderator");
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  const loadUsers = useCallback(async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setFeedback(null);
    const response = await getStreamerStudioTrustedUsers(streamerId);
    setLoading(false);

    if (response.ok && Array.isArray(response.data)) {
      setUsers(response.data);
      return;
    }

    setFeedback({
      message: response.message || t.streamerStudioTrustedUsersLoadFailed,
      isError: true,
    });
  }, [loading, streamerId, t.streamerStudioTrustedUsersLoadFailed]);

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamerId]);

  const handleAdd = useCallback(async () => {
    const normalizedDiscordId = discordId.trim();
    if (!isValidDiscordId(normalizedDiscordId)) {
      setFeedback({ message: t.streamerStudioTrustedUsersInvalidDiscordId, isError: true });
      return;
    }

    setSaving(true);
    setFeedback(null);
    const response = await addStreamerStudioTrustedUser(streamerId, {
      discordId: normalizedDiscordId,
      role,
    });
    setSaving(false);

    if (!response.ok) {
      setFeedback({
        message: response.message || t.streamerStudioTrustedUsersSaveFailed,
        isError: true,
      });
      return;
    }

    setDiscordId("");
    setFeedback({ message: t.streamerStudioTrustedUsersAddSuccess, isError: false });
    if (response.data) {
      setUsers(prev => {
        const key = response.data!.memberId ?? response.data!.id;
        if (key !== undefined) {
          const withoutExisting = prev.filter(user => (user.memberId ?? user.id) !== key);
          return [...withoutExisting, response.data!];
        }
        const withoutExisting = prev.filter(user => user.discordId !== response.data!.discordId);
        return [...withoutExisting, response.data!];
      });
      return;
    }

    await loadUsers();
  }, [discordId, loadUsers, role, streamerId, t.streamerStudioTrustedUsersAddSuccess, t.streamerStudioTrustedUsersInvalidDiscordId, t.streamerStudioTrustedUsersSaveFailed]);

  const handleDelete = useCallback(async (user: StreamerStudioTrustedUserView) => {
    const memberId = user.memberId ?? user.id;
    if (memberId === undefined) {
      setFeedback({ message: t.streamerStudioTrustedUsersDeleteFailed, isError: true });
      return;
    }

    setDeletingId(memberId);
    setFeedback(null);
    const response = await deleteStreamerStudioTrustedUser(streamerId, memberId);
    setDeletingId(null);

    if (!response.ok) {
      setFeedback({
        message: response.message || t.streamerStudioTrustedUsersDeleteFailed,
        isError: true,
      });
      return;
    }

    setUsers(prev => prev.filter(item => (item.memberId ?? item.id) !== memberId));
    setFeedback({ message: t.streamerStudioTrustedUsersRemoveSuccess, isError: false });
  }, [streamerId, t.streamerStudioTrustedUsersDeleteFailed, t.streamerStudioTrustedUsersRemoveSuccess]);

  const trustedCountText = t.streamerStudioTrustedUsersCount.replace("{count}", String(users.length));

  return (
    <section className={`streamer-trusted-panel ${expanded ? "expanded" : "collapsed"}`}>
      <div className="streamer-trusted-head">
        <div className="streamer-trusted-head-copy">
          <h3 className="section-title small">{t.streamerStudioTrustedUsersTitle}</h3>
          <p className="market-card-hint">
            {users.length > 0 ? `${trustedCountText} · ${t.streamerStudioTrustedUsersManagerHint}` : t.streamerStudioTrustedUsersSubtitle}
          </p>
        </div>
        <div className="streamer-trusted-head-actions">
          {expanded ? (
            <button className="pagination-btn ghost" type="button" onClick={() => void loadUsers()} disabled={loading}>
              {t.streamerStudioTrustedUsersRefresh}
            </button>
          ) : null}
          <button className="pagination-btn ghost" type="button" onClick={() => setExpanded(prev => !prev)}>
            {expanded ? t.streamerStudioTrustedUsersCollapse : t.streamerStudioTrustedUsersOpen}
          </button>
        </div>
      </div>

      {!expanded ? (
        <p className="streamer-trusted-compact-summary">{loading ? t.shopObsLoading : trustedCountText}</p>
      ) : null}

      {expanded ? (
        <>
          <div className="streamer-trusted-form">
        <label className="streamer-transform-field">
          <span>{t.streamerStudioTrustedUsersDiscordId}</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={32}
            value={discordId}
            onChange={(event) => setDiscordId(event.target.value.replace(/\D/g, "").slice(0, 32))}
          />
        </label>
        <label className="streamer-transform-field">
          <span>{t.streamerStudioTrustedUsersRole}</span>
          <select className="searchable-select streamer-trusted-select" value={role} onChange={(event) => setRole(event.target.value as StreamerStudioTrustedUserRole)}>
            <option value="moderator">{t.streamerStudioTrustedUsersModerator}</option>
            <option value="manager">{t.streamerStudioTrustedUsersManager}</option>
          </select>
        </label>
        <button className="pagination-btn" type="button" onClick={() => void handleAdd()} disabled={saving || !discordId.trim()}>
          {t.streamerStudioTrustedUsersAdd}
        </button>
          </div>

          {feedback ? (
            <p className={`streamer-trusted-feedback ${feedback.isError ? "state-error" : "state-ok"}`}>
              {feedback.message}
            </p>
          ) : null}

          <div className="streamer-trusted-list">
        {loading ? <p className="state-text compact">{t.shopObsLoading}</p> : null}
        {!loading && users.length === 0 ? <p className="state-text state-empty">{t.streamerStudioTrustedUsersEmpty}</p> : null}
        {users.map(user => {
          const memberId = user.memberId ?? user.id;
          return (
            <div className="streamer-trusted-row" key={memberId ?? user.discordId}>
              <div className="streamer-trusted-user-main">
                <strong>{displayNameForUser(user)}</strong>
                <span>{user.discordId}</span>
              </div>
              <span className={`streamer-trusted-role-badge ${user.role}`}>{roleLabel(t, user.role)}</span>
              <button
                className="pagination-btn ghost danger"
                type="button"
                onClick={() => void handleDelete(user)}
                disabled={memberId === undefined || deletingId === memberId}
              >
                {t.streamerStudioTrustedUsersRemove}
              </button>
            </div>
          );
        })}
          </div>
        </>
      ) : null}
    </section>
  );
}
