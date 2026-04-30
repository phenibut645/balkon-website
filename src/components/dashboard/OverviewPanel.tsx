"use client";

import { DashboardText } from "@/lib/dashboardText";
import { AvailableGuild, NotificationItem, ObsMediaActionStatus, OverviewLatestNotification, OverviewSummary, UserBalance, UserPublicProfile } from "@/lib/types";

type ActivityNotification = NotificationItem | OverviewLatestNotification;

type OverviewPanelProps = {
  t: DashboardText;
  dateLocale: string;
  displayName: string;
  discordId: string;
  roles: string[];
  avatarUrl: string | null;
  avatarFailed: boolean;
  onAvatarError: () => void;
  overviewSummary: OverviewSummary | null;
  overviewLoading: boolean;
  overviewError: string | null;
  onRefreshOverview: () => void;
  balance: UserBalance | null;
  balanceLoaded: boolean;
  inventoryLoaded: boolean;
  inventoryCount: number;
  unreadNotifications: number;
  latestNotifications: NotificationItem[];
  profile: UserPublicProfile | null;
  availableGuilds: AvailableGuild[];
  onOpenInventory: () => void;
  onOpenMarket: () => void;
  onOpenObsShop: () => void;
  onOpenObsHistory: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
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

function localizeNotificationTitle(t: DashboardText, item: ActivityNotification): string {
  if (item.type === "obs_media" || item.title === "OBS effect sent") {
    return t.obsNotificationTitle;
  }

  if (item.type === "economy_adjustment" || item.title === "Balance updated") {
    return t.balanceUpdated;
  }

  return item.title;
}

function getHomeGuildLabel(profile: UserPublicProfile | null, availableGuilds: AvailableGuild[], fallback: string): string {
  if (profile?.homeGuildName) {
    return profile.homeGuildName;
  }

  if (profile?.homeGuildId) {
    const guild = availableGuilds.find(item => item.guildId === profile.homeGuildId);
    return guild?.name || profile.homeGuildId;
  }

  return fallback;
}

function getObsStatusLabel(t: DashboardText, status: ObsMediaActionStatus): string {
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

export function OverviewPanel({
  t,
  dateLocale,
  displayName,
  discordId,
  roles,
  avatarUrl,
  avatarFailed,
  onAvatarError,
  overviewSummary,
  overviewLoading,
  overviewError,
  onRefreshOverview,
  balance,
  balanceLoaded,
  inventoryLoaded,
  inventoryCount,
  unreadNotifications,
  latestNotifications,
  profile,
  availableGuilds,
  onOpenInventory,
  onOpenMarket,
  onOpenObsShop,
  onOpenObsHistory,
  onOpenNotifications,
  onOpenProfile,
}: OverviewPanelProps) {
  const effectiveBalance = overviewSummary?.balance ?? balance;
  const effectiveInventoryLoaded = overviewSummary !== null || inventoryLoaded;
  const effectiveInventoryCount = overviewSummary?.inventoryCount ?? inventoryCount;
  const effectiveUnreadNotifications = overviewSummary?.unreadNotificationsCount ?? unreadNotifications;
  const effectiveLatestNotifications: ActivityNotification[] = overviewSummary?.latestNotifications ?? latestNotifications;
  const homeGuildLabel = overviewSummary?.homeGuild?.name ?? getHomeGuildLabel(profile, availableGuilds, t.noHomeGuild);
  const latestObsAction = overviewSummary?.obsActions.latest ?? null;
  const obsActionsTotal = overviewSummary?.obsActions.total ?? 0;
  const showInitialLoading = overviewLoading && !overviewSummary;

  return (
    <div className="panel panel-overview overview-dashboard">
      <section className="overview-hero">
        <div className="user-row overview-user-row">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Discord avatar"
              className="avatar"
              onError={onAvatarError}
              style={{ display: avatarFailed ? "none" : "block" }}
            />
          ) : (
            <div className="avatar placeholder" aria-hidden="true" />
          )}
          {avatarUrl && avatarFailed ? (
            <div className="avatar placeholder" aria-hidden="true" />
          ) : null}
          <div>
            <p className="overview-eyebrow">{t.welcome}</p>
            <h2 className="section-title">{displayName}</h2>
            <p className="user-id">{t.discordId}: {discordId}</p>
            {roles.length > 0 ? (
              <div className="badges">
                {roles.slice(0, 4).map(role => (
                  <span className="badge" key={role}>{role}</span>
                ))}
                {roles.length > 4 ? <span className="badge">+{roles.length - 4}</span> : null}
              </div>
            ) : (
              <p className="no-roles">{t.noRoles}</p>
            )}
          </div>
        </div>
        <div className="overview-hero-actions">
          {showInitialLoading ? <span className="meta-badge muted">{t.checking}</span> : null}
          {overviewError ? <span className="meta-badge danger">{overviewError}</span> : null}
          <button className="overview-inline-action ghost" type="button" onClick={onRefreshOverview}>{t.notificationRefresh}</button>
        </div>
      </section>

      <section className="overview-card-grid" aria-label={t.tabOverview}>
        <article className="overview-card">
          <div className="overview-card-head">
            <span className="overview-card-icon" aria-hidden="true">💰</span>
            <span className="overview-card-title">{t.balance}</span>
          </div>
          <p className="overview-card-value">{effectiveBalance ? `${effectiveBalance.odm.toLocaleString()} ${t.odm}` : "..."}</p>
          <p className="overview-card-hint">{effectiveBalance ? `${effectiveBalance.ldm.toLocaleString()} ${t.ldm}` : balanceLoaded ? t.balanceLoadFailed : t.checking}</p>
        </article>

        <article className="overview-card">
          <div className="overview-card-head">
            <span className="overview-card-icon" aria-hidden="true">🎒</span>
            <span className="overview-card-title">{t.tabInventory}</span>
          </div>
          <p className="overview-card-value">{effectiveInventoryLoaded ? effectiveInventoryCount.toLocaleString() : t.overviewNotLoaded}</p>
          <button className="overview-inline-action" type="button" onClick={onOpenInventory}>
            {effectiveInventoryLoaded ? t.tabInventory : t.overviewOpenInventory}
          </button>
        </article>

        <article className="overview-card">
          <div className="overview-card-head">
            <span className="overview-card-icon" aria-hidden="true">🔔</span>
            <span className="overview-card-title">{t.tabNotifications}</span>
          </div>
          <p className="overview-card-value">{effectiveUnreadNotifications.toLocaleString()}</p>
          <button className="overview-inline-action" type="button" onClick={onOpenNotifications}>
            {effectiveUnreadNotifications > 0 ? t.notificationUnread : t.allNotifications}
          </button>
        </article>

        <article className="overview-card">
          <div className="overview-card-head">
            <span className="overview-card-icon" aria-hidden="true">🎥</span>
            <span className="overview-card-title">{t.navObs}</span>
          </div>
          <p className="overview-card-value">{obsActionsTotal.toLocaleString()}</p>
          <p className="overview-card-hint">
            {latestObsAction
              ? `${latestObsAction.productTitle} · ${latestObsAction.streamerNickname} · ${getObsStatusLabel(t, latestObsAction.status)}`
              : t.obsMediaHistoryEmpty}
          </p>
          <div className="overview-card-actions">
            <button className="overview-inline-action" type="button" onClick={onOpenObsShop}>{t.obsShop}</button>
            <button className="overview-inline-action ghost" type="button" onClick={onOpenObsHistory}>{t.obsHistory}</button>
          </div>
        </article>

        <article className="overview-card overview-card-wide">
          <div className="overview-card-head">
            <span className="overview-card-icon" aria-hidden="true">👤</span>
            <span className="overview-card-title">{t.profile}</span>
          </div>
          <p className="overview-card-value">{homeGuildLabel}</p>
          <p className="overview-card-hint">{profile?.publicDescription || t.overviewProfileHint}</p>
          <button className="overview-inline-action" type="button" onClick={onOpenProfile}>{t.profileSettings}</button>
        </article>
      </section>

      <section className="overview-split">
        <div className="overview-section-card">
          <div className="overview-section-head">
            <h3>{t.quickActions}</h3>
          </div>
          <div className="overview-quick-actions">
            <button type="button" className="overview-action-button" onClick={onOpenInventory}>🎒 {t.tabInventory}</button>
            <button type="button" className="overview-action-button" onClick={onOpenMarket}>📈 {t.tabMarket}</button>
            <button type="button" className="overview-action-button" onClick={onOpenObsShop}>🎥 {t.obsShop}</button>
            <button type="button" className="overview-action-button" onClick={onOpenNotifications}>🔔 {t.tabNotifications}</button>
          </div>
        </div>

        <div className="overview-section-card">
          <div className="overview-section-head">
            <h3>{t.recentActivity}</h3>
            <button className="overview-inline-action ghost" type="button" onClick={onOpenNotifications}>{t.viewAll}</button>
          </div>
          {effectiveLatestNotifications.length > 0 ? (
            <div className="overview-activity-list">
              {effectiveLatestNotifications.slice(0, 3).map(item => (
                <article key={`overview-notification-${item.id}`} className={`overview-activity-item severity-${item.severity}`}>
                  <div>
                    <p className="overview-activity-title">{localizeNotificationTitle(t, item)}</p>
                    <p className="overview-activity-date">{formatNotificationDate(item.createdAt, dateLocale, t.unknownDate)}</p>
                  </div>
                  {!item.readAt ? <span className="meta-badge ok">{t.notificationUnread}</span> : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="overview-empty-activity">{t.overviewRecentEmpty}</div>
          )}
        </div>
      </section>
    </div>
  );
}
