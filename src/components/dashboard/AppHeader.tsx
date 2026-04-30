import type { ReactNode } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { UserBalance } from "@/lib/types";

type BotUiStatus = "online" | "offline" | "development";
type DashboardTab = "overview" | "inventory" | "market" | "botShop" | "craft" | "profile" | "adminDashboard" | "adminServers" | "adminLogs" | "adminObs" | "adminItems" | "adminBotShop";

type AppHeaderProps = {
  appVersion: string;
  botStatus: BotUiStatus;
  statusText: string;
  t: DashboardText;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  filteredTabs: Array<{ id: DashboardTab; label: string }>;
  onTabChange: (tab: DashboardTab) => void;
  profileDropdown: ReactNode;
  balance: UserBalance | null;
};

export function AppHeader({
  appVersion,
  botStatus,
  statusText,
  t,
  searchQuery,
  onSearchQueryChange,
  filteredTabs,
  onTabChange,
  profileDropdown,
  balance,
}: AppHeaderProps) {
  return (
    <header className="dashboard-topbar">
      <div className="dashboard-header">
        <div className="brand-block">
          <h1 className="title compact">Balkon</h1>
          <span className="version">{appVersion}</span>
          <div className="status-wrap" aria-label={`${t.status}: ${statusText}`}>
            <span className={`status-dot ${botStatus}`} aria-hidden="true" />
            <span className="status-label">{t.status}</span>
            <span className="status-value">{statusText}</span>
            <div className="status-tooltip" role="tooltip">
              <p className="status-tooltip-title">{t.status}</p>
              <div className="status-tooltip-row">
                <span className="status-dot online" aria-hidden="true" />
                <span>{t.statusOnline}</span>
              </div>
              <div className="status-tooltip-row">
                <span className="status-dot offline" aria-hidden="true" />
                <span>{t.statusOffline}</span>
              </div>
              <div className="status-tooltip-row">
                <span className="status-dot development" aria-hidden="true" />
                <span>{t.statusDevelopment}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="header-search-wrap">
          <input
            value={searchQuery}
            onChange={event => onSearchQueryChange(event.target.value)}
            className="header-search"
            placeholder={t.searching}
          />

          {filteredTabs.length > 0 ? (
            <div className="search-dropdown">
              {filteredTabs.map(tab => (
                <button
                  key={tab.id}
                  className="search-result"
                  onClick={() => onTabChange(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="header-actions">
          {profileDropdown}
          {balance !== null ? (
            <div className="header-balance-chip" title={`${t.odm}: ${balance.odm} | ${t.ldm}: ${balance.ldm}`}>
              <span className="header-balance-coin" aria-hidden="true">🪙</span>
              <span className="header-balance-label">{t.odm}</span>
              <span className="header-balance-value">{balance.odm}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="topbar-divider" />
    </header>
  );
}
