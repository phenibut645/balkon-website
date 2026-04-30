import type { ReactNode } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { DashboardSearchResult } from "@/lib/dashboardSearch";
import { UserBalance } from "@/lib/types";

type BotUiStatus = "online" | "offline" | "development";

type AppHeaderProps = {
  appVersion: string;
  botStatus: BotUiStatus;
  statusText: string;
  t: DashboardText;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchResults: DashboardSearchResult[];
  onSearchResultSelect: (result: DashboardSearchResult) => void;
  notificationBell?: ReactNode;
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
  searchResults,
  onSearchResultSelect,
  notificationBell,
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

          {searchResults.length > 0 ? (
            <div className="search-dropdown">
              {searchResults.map(result => (
                <button
                  key={result.key}
                  className="search-result"
                  onClick={() => onSearchResultSelect(result)}
                >
                  <span className="search-result-title">{result.label}</span>
                  <span className="search-result-path">{result.description || result.breadcrumb}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="header-actions">
          {notificationBell}
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
