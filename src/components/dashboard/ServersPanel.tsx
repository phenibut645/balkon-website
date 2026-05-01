"use client";

import { useMemo, useState } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { GuildOverview, GuildUserRole, UserGuild } from "@/lib/types";

type ServerSubTab = "overview" | "economy" | "members" | "logs" | "settings";

type ServersPanelProps = {
  t: DashboardText;
  guilds: UserGuild[];
  guildsLoading: boolean;
  guildsError: string | null;
  selectedGuildId: string | null;
  selectedGuildOverview: GuildOverview | null;
  selectedGuildLoading: boolean;
  selectedGuildError: string | null;
  onRefreshGuilds: () => void;
  onOpenGuild: (guild: UserGuild) => void;
  onBackToGuilds: () => void;
  onRefreshGuildOverview: (guildId: string) => void;
};

function getRoleLabel(t: DashboardText, role: GuildUserRole): string {
  if (role === "owner") {
    return t.serverRoleOwner;
  }
  if (role === "admin") {
    return t.serverRoleAdmin;
  }
  if (role === "member") {
    return t.serverRoleMember;
  }
  return t.serverRoleUnknown;
}

function getInitials(name: string): string {
  const parts = name
    .split(/\s+/)
    .map(part => part.trim())
    .filter(Boolean);

  const initials = parts.length >= 2
    ? `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`
    : name.slice(0, 2);

  return initials.toUpperCase();
}

function formatCount(value: number | null): string {
  return value === null ? "—" : value.toLocaleString();
}

function ServerIcon({ guild }: { guild: Pick<UserGuild, "name" | "iconUrl"> }) {
  if (guild.iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={guild.iconUrl} alt="" className="server-icon-image" />
    );
  }

  return <span className="server-icon-fallback">{getInitials(guild.name)}</span>;
}

export function ServersPanel({
  t,
  guilds,
  guildsLoading,
  guildsError,
  selectedGuildId,
  selectedGuildOverview,
  selectedGuildLoading,
  selectedGuildError,
  onRefreshGuilds,
  onOpenGuild,
  onBackToGuilds,
  onRefreshGuildOverview,
}: ServersPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<ServerSubTab>("overview");
  const selectedGuild = useMemo(
    () => {
      const listGuild = guilds.find(guild => guild.guildId === selectedGuildId) ?? null;
      if (!selectedGuildOverview) {
        return listGuild;
      }

      return {
        ...selectedGuildOverview,
        isHomeGuild: listGuild?.isHomeGuild ?? false,
      };
    },
    [guilds, selectedGuildId, selectedGuildOverview],
  );

  const subTabs: Array<{ id: ServerSubTab; label: string }> = [
    { id: "overview", label: t.serverTabOverview },
    { id: "economy", label: t.serverTabEconomy },
    { id: "members", label: t.serverTabMembers },
    { id: "logs", label: t.serverTabLogs },
    { id: "settings", label: t.serverTabSettings },
  ];

  if (selectedGuildId && selectedGuild) {
    const overview = selectedGuildOverview;
    const stats = [
      { label: t.serverMembers, value: overview?.memberCount ?? selectedGuild.memberCount },
      { label: t.serverStreamers, value: overview?.streamerCount ?? selectedGuild.streamerCount },
      { label: t.serverItems, value: overview?.itemCount ?? null },
      { label: t.serverInventory, value: overview?.inventoryCount ?? null },
      { label: t.serverMarketListings, value: overview?.marketListingCount ?? null },
    ];

    return (
      <section className="panel servers-panel server-detail">
        <div className="servers-header">
          <div>
            <button className="overview-inline-action ghost" type="button" onClick={onBackToGuilds}>
              {t.backToServers}
            </button>
            <h2 className="section-title">{selectedGuild.name}</h2>
            <p className="user-id">{selectedGuild.guildId}</p>
          </div>
          <button
            className="overview-inline-action"
            type="button"
            onClick={() => onRefreshGuildOverview(selectedGuild.guildId)}
            disabled={selectedGuildLoading}
          >
            {t.serversRefresh}
          </button>
        </div>

        <div className="server-hero-card">
          <div className="server-icon large">
            <ServerIcon guild={selectedGuild} />
          </div>
          <div className="server-hero-copy">
            <div className="server-card-title-row">
              <h3>{selectedGuild.name}</h3>
              <span className={`server-role-badge role-${selectedGuild.userRole}`}>{getRoleLabel(t, selectedGuild.userRole)}</span>
            </div>
            <p className="user-id">{selectedGuild.guildId}</p>
            <div className="server-card-meta">
              {selectedGuild.isHomeGuild ? <span className="meta-badge ok">{t.serverHomeGuild}</span> : null}
              <span className="meta-badge muted">{selectedGuild.botRegistered ? "Balkon" : t.serverRoleUnknown}</span>
            </div>
          </div>
        </div>

        {selectedGuildError ? <div className="servers-state-card error">{selectedGuildError}</div> : null}

        <div className="server-stat-grid">
          {stats.map(stat => (
            <article className="server-stat-card" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{formatCount(stat.value)}</strong>
            </article>
          ))}
        </div>

        <div className="server-subtabs" aria-label={t.tabServers}>
          {subTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`shop-subtab-chip ${activeSubTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveSubTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeSubTab === "overview" ? (
          <div className="server-placeholder">
            <h3>{t.serverTabOverview}</h3>
            <p>{selectedGuildLoading ? t.checking : t.serversSubtitle}</p>
          </div>
        ) : (
          <div className="server-placeholder">
            <h3>{subTabs.find(tab => tab.id === activeSubTab)?.label}</h3>
            <p>{t.serverSectionComingSoon}</p>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="panel servers-panel">
      <div className="servers-header">
        <div>
          <h2 className="section-title">{t.serversTitle}</h2>
          <p className="subtitle compact">{t.serversSubtitle}</p>
        </div>
        <button className="overview-inline-action" type="button" onClick={onRefreshGuilds} disabled={guildsLoading}>
          {t.serversRefresh}
        </button>
      </div>

      {guildsLoading && !guilds.length ? (
        <div className="servers-state-card">{t.checking}</div>
      ) : null}

      {guildsError ? (
        <div className="servers-state-card error">
          <p>{guildsError}</p>
          <button className="overview-inline-action" type="button" onClick={onRefreshGuilds}>{t.retry}</button>
        </div>
      ) : null}

      {!guildsLoading && !guildsError && !guilds.length ? (
        <div className="servers-state-card empty">{t.serversEmpty}</div>
      ) : null}

      {guilds.length > 0 ? (
        <div className="servers-grid">
          {guilds.map(guild => (
            <article className="server-card" key={guild.guildId}>
              <div className="server-card-main">
                <div className="server-icon">
                  <ServerIcon guild={guild} />
                </div>
                <div className="server-card-copy">
                  <div className="server-card-title-row">
                    <h3>{guild.name}</h3>
                    <span className={`server-role-badge role-${guild.userRole}`}>{getRoleLabel(t, guild.userRole)}</span>
                  </div>
                  <p className="user-id">{guild.guildId}</p>
                </div>
              </div>

              <div className="server-card-counts">
                <span>{t.serverMembers}: <strong>{formatCount(guild.memberCount)}</strong></span>
                <span>{t.serverStreamers}: <strong>{formatCount(guild.streamerCount)}</strong></span>
              </div>

              <div className="server-card-footer">
                <div className="server-card-meta">
                  {guild.isHomeGuild ? <span className="meta-badge ok">{t.serverHomeGuild}</span> : null}
                  <span className="meta-badge muted">{guild.botRegistered ? "Balkon" : t.serverRoleUnknown}</span>
                </div>
                <button className="overview-inline-action" type="button" onClick={() => onOpenGuild(guild)}>
                  {t.openServer}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
