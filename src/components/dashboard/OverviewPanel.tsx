"use client";

import { DashboardText } from "@/lib/dashboardText";
import { AvailableGuild, NotificationItem, OverviewLatestNotification, OverviewSummary, UserBalance, UserPublicProfile } from "@/lib/types";
import { OverviewModelShowcase } from "./OverviewModelShowcase";

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
  onOpenBotShop: () => void;
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

function sanitizePlainText(value?: string | null, maxLength = 110): string {
  if (!value) {
    return "";
  }

  const text = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

function getNotificationHint(t: DashboardText, unreadCount: number): string {
  if (unreadCount <= 0) {
    return t.allNotifications;
  }

  return t.notificationUnread.toLowerCase();
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
  onOpenBotShop,
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
  const profileDescription = sanitizePlainText(profile?.publicDescription);
  const latestObsAction = overviewSummary?.obsActions.latest ?? null;
  const obsActionsTotal = overviewSummary?.obsActions.total ?? 0;
  const showInitialLoading = overviewLoading && !overviewSummary;
  const profileSummaryText = profileDescription || t.overviewProfileHint;

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
        <article className="overview-card overview-stat-card">
          <div className="overview-card-head">
            <span className="overview-card-icon" aria-hidden="true">💰</span>
            <span className="overview-card-title">{t.balance}</span>
          </div>
          <div className="overview-stat-body">
            <p className="overview-card-value">{effectiveBalance ? `${effectiveBalance.odm.toLocaleString()} ${t.odm}` : "..."}</p>
            <p className="overview-card-hint">{effectiveBalance ? `${effectiveBalance.ldm.toLocaleString()} ${t.ldm}` : balanceLoaded ? t.balanceLoadFailed : t.checking}</p>
          </div>
        </article>

        <article className="overview-card overview-stat-card">
          <div className="overview-card-head">
            <span className="overview-card-icon" aria-hidden="true">🎒</span>
            <span className="overview-card-title">{t.tabInventory}</span>
          </div>
          <div className="overview-stat-body">
            <p className="overview-card-value">{effectiveInventoryLoaded ? effectiveInventoryCount.toLocaleString() : t.overviewNotLoaded}</p>
            <p className="overview-card-hint">{effectiveInventoryLoaded ? t.itemsWord : t.checking}</p>
          </div>
          <div className="overview-card-actions">
            <button className="overview-inline-action" type="button" onClick={onOpenInventory}>{t.openStreamer}</button>
          </div>
        </article>

        <article className="overview-card overview-stat-card">
          <div className="overview-card-head">
            <span className="overview-card-icon" aria-hidden="true">🔔</span>
            <span className="overview-card-title">{t.tabNotifications}</span>
          </div>
          <div className="overview-stat-body">
            <p className="overview-card-value">{effectiveUnreadNotifications.toLocaleString()}</p>
            <p className="overview-card-hint">{getNotificationHint(t, effectiveUnreadNotifications)}</p>
          </div>
          <div className="overview-card-actions">
            <button className="overview-inline-action" type="button" onClick={onOpenNotifications}>{t.openStreamer}</button>
          </div>
        </article>

        <article className="overview-card overview-stat-card">
          <div className="overview-card-head">
            <span className="overview-card-icon" aria-hidden="true">🎥</span>
            <span className="overview-card-title">{t.navObs}</span>
          </div>
          <div className="overview-stat-body">
            <p className="overview-card-value">{obsActionsTotal.toLocaleString()}</p>
            <p className="overview-card-hint">
              {latestObsAction
                ? `${latestObsAction.productTitle} · ${latestObsAction.streamerNickname}`
                : t.obsMediaHistoryEmpty}
            </p>
          </div>
          <div className="overview-card-actions">
            <button className="overview-inline-action" type="button" onClick={onOpenObsShop}>{t.tabBotShop}</button>
            <button className="overview-inline-action ghost" type="button" onClick={onOpenObsHistory}>{t.obsMediaHistory}</button>
          </div>
        </article>
      </section>

      <section className="overview-split">
        <div className="overview-section-card overview-quick-card">
          <div className="overview-section-head">
            <h3>{t.quickActions}</h3>
          </div>
          <div className="overview-quick-actions">
            <button type="button" className="overview-action-button" onClick={onOpenInventory}>
              <span className="overview-action-icon" aria-hidden="true">🎒</span>
              <span className="overview-action-copy">{t.tabInventory}</span>
              <span className="overview-action-arrow" aria-hidden="true">→</span>
            </button>
            <button type="button" className="overview-action-button" onClick={onOpenMarket}>
              <span className="overview-action-icon" aria-hidden="true">📈</span>
              <span className="overview-action-copy">{t.tabMarket}</span>
              <span className="overview-action-arrow" aria-hidden="true">→</span>
            </button>
            <button type="button" className="overview-action-button" onClick={onOpenObsShop}>
              <span className="overview-action-icon" aria-hidden="true">🎥</span>
              <span className="overview-action-copy">OBS</span>
              <span className="overview-action-arrow" aria-hidden="true">→</span>
            </button>
            <button type="button" className="overview-action-button" onClick={onOpenNotifications}>
              <span className="overview-action-icon" aria-hidden="true">🔔</span>
              <span className="overview-action-copy">{t.tabNotifications}</span>
              <span className="overview-action-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <div className="overview-section-card overview-activity-card">
          <div className="overview-section-head">
            <h3>{t.recentActivity}</h3>
            <button className="overview-inline-action ghost" type="button" onClick={onOpenNotifications}>{t.viewAll}</button>
          </div>
          {effectiveLatestNotifications.length > 0 ? (
            <div className="overview-activity-list">
              {effectiveLatestNotifications.slice(0, 3).map(item => (
                <article key={`overview-notification-${item.id}`} className={`overview-activity-item severity-${item.severity}`}>
                  <div className="overview-activity-copy">
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

        <div className="overview-section-card overview-profile-summary">
          <div className="overview-section-head">
            <h3>{t.profile}</h3>
            <button className="overview-inline-action ghost" type="button" onClick={onOpenProfile}>{t.configure}</button>
          </div>
          <div className="overview-profile-line">
            <span className="overview-card-icon overview-profile-icon" aria-hidden="true">👤</span>
            <div className="overview-profile-copy">
              <p className="overview-profile-meta">{t.homeGuild}</p>
              <p className="overview-profile-guild">{homeGuildLabel}</p>
              <p className="overview-profile-description">{profileSummaryText}</p>
            </div>
          </div>
        </div>
      </section>

      <OverviewModelShowcase
        t={t}
        onOpenBotShop={onOpenBotShop}
        onOpenObsShop={onOpenObsShop}
      />
    </div>
  );
}
