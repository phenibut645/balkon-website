import { DashboardText, formatDashboardDate } from "@/lib/dashboardText";
import { AdminStats } from "@/lib/types";

type AdminObsPanelProps = {
  t: DashboardText;
  adminStats: AdminStats | null;
  dateLocale: string;
};

export function AdminObsPanel({ t, adminStats, dateLocale }: AdminObsPanelProps) {
  return (
    <div className="panel panel-overview admin-list-panel">
      {adminStats && adminStats.obsSettings.length > 0 ? (
        <div className="admin-list-grid">
          {adminStats.obsSettings.map((setting, index) => (
            <article className="admin-log-card" key={`${setting.setting_key}-${index}`}>
              <p className="display-name">{setting.setting_key}</p>
              <p className="user-id">
                {setting.setting_key === "obs_websocket_password" && setting.setting_value
                  ? "********"
                  : (setting.setting_value || "-")}
              </p>
              <p className="user-id">{t.updated}: {formatDashboardDate(setting.updated_at, dateLocale, t.unknownDate)}</p>
            </article>
          ))}
          <article className="admin-log-card">
            <p className="display-name">{t.contributors}</p>
            <div className="badges">
              {adminStats.contributors.length > 0
                ? adminStats.contributors.map(contributor => <span className="badge" key={contributor}>{contributor}</span>)
                : <span className="badge">{t.none}</span>}
            </div>
          </article>
        </div>
      ) : (
        <p className="state-text state-empty">{t.adminObsEmpty}</p>
      )}
    </div>
  );
}
