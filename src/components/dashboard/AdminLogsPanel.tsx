import { DashboardText, formatDashboardDate } from "@/lib/dashboardText";
import { AdminStats } from "@/lib/types";

type AdminLogsPanelProps = {
  t: DashboardText;
  adminStats: AdminStats | null;
  dateLocale: string;
};

export function AdminLogsPanel({ t, adminStats, dateLocale }: AdminLogsPanelProps) {
  return (
    <div className="panel panel-overview admin-list-panel">
      {adminStats && adminStats.bootstrapStatuses.length > 0 ? (
        <div className="admin-list-grid">
          {adminStats.bootstrapStatuses.map((log, index) => (
            <article className="admin-log-card" key={`${log.guildId}-${log.updatedAt}-${index}`}>
              <div className="admin-log-head">
                <p className="display-name">{log.guildName || log.guildId}</p>
                <span className={`meta-badge ${log.status === "ok" ? "ok" : "muted"}`}>
                  {log.status === "ok" ? t.statusOk : t.statusError}
                </span>
              </div>
              <p className="user-id">Guild ID: {log.guildId}</p>
              <p className="user-id">{t.source}: {log.source}</p>
              <p className="user-id">{t.updated}: {formatDashboardDate(log.updatedAt, dateLocale, t.unknownDate)}</p>
              <p className="user-id">{t.channelsSynced}: {log.syncedChannels ?? 0}</p>
              <p className="user-id">{t.rolesSynced}: {log.syncedRoles ?? 0}</p>
              {log.message ? <p className="user-id">{t.messageLabel}: {log.message}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="state-text state-empty">{t.adminLogsEmpty}</p>
      )}
    </div>
  );
}
