import { DashboardText } from "@/lib/dashboardText";
import { AdminStats } from "@/lib/types";
import { AdminStreamersPanel } from "./AdminStreamersPanel";
import { AdminStreamerApplicationsPanel } from "./AdminStreamerApplicationsPanel";

type AdminDashboardPanelProps = {
  t: DashboardText;
  adminStatsLoading: boolean;
  adminStatsError: string | null;
  adminStats: AdminStats | null;
  dateLocale: string;
  onRetry: () => void;
};

export function AdminDashboardPanel({ t, adminStatsLoading, adminStatsError, adminStats, dateLocale, onRetry }: AdminDashboardPanelProps) {
  return (
    <div className="panel panel-overview">
      {adminStatsLoading && !adminStats ? <p className="state-text">{t.adminStatsLoading}</p> : null}
      {!adminStatsLoading && adminStatsError && !adminStats ? (
        <div className="admin-empty-card">
          <p className="state-text state-error">{adminStatsError}</p>
          <button className="pagination-btn" onClick={onRetry}>{t.retry}</button>
        </div>
      ) : null}
      {!adminStatsLoading && !adminStatsError && !adminStats ? <p className="state-text state-empty">{t.adminStatsEmpty}</p> : null}
      {adminStats ? (
        <div className="admin-stats-grid">
          <article className="admin-stat-card"><p>{t.adminCountGuilds}</p><h3>{adminStats.counts.guilds_count}</h3></article>
          <article className="admin-stat-card"><p>{t.adminCountMembers}</p><h3>{adminStats.counts.members_count}</h3></article>
          <article className="admin-stat-card"><p>{t.adminCountItems}</p><h3>{adminStats.counts.items_count}</h3></article>
          <article className="admin-stat-card"><p>{t.adminCountInventory}</p><h3>{adminStats.counts.inventory_count}</h3></article>
          <article className="admin-stat-card"><p>{t.adminCountMarket}</p><h3>{adminStats.counts.market_count}</h3></article>
          <article className="admin-stat-card"><p>{t.adminCountStore}</p><h3>{adminStats.counts.store_count}</h3></article>
          <article className="admin-stat-card"><p>{t.adminCountRecipes}</p><h3>{adminStats.counts.recipes_count}</h3></article>
          <article className="admin-stat-card"><p>{t.adminCountStreamers}</p><h3>{adminStats.counts.streamers_count}</h3></article>
          <article className="admin-stat-card"><p>{t.adminCountSettings}</p><h3>{adminStats.counts.settings_count}</h3></article>
          <article className="admin-stat-card"><p>{t.adminCountActions}</p><h3>{adminStats.counts.actions_count}</h3></article>
        </div>
      ) : null}

      <AdminStreamersPanel t={t} dateLocale={dateLocale} />
      <AdminStreamerApplicationsPanel t={t} dateLocale={dateLocale} />
    </div>
  );
}
