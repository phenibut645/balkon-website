import { DashboardText } from "@/lib/dashboardText";
import { MarketForbesEntry } from "@/lib/types";
import { UserIdentity } from "./UserIdentity";

type MarketForbesPanelProps = {
  t: DashboardText;
  leaderboard: MarketForbesEntry[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  streamerMode?: boolean;
};

export function MarketForbesPanel({
  t,
  leaderboard,
  loading,
  error,
  onRefresh,
  streamerMode = false,
}: MarketForbesPanelProps) {
  return (
    <div className="market-subpanel market-forbes-panel">
      <div className="market-chart-header">
        <p className="market-card-label">{t.topByOdm}</p>
        <button className="pagination-btn" onClick={onRefresh}>{t.marketForbesRefresh}</button>
      </div>

      {loading ? <p className="state-text">{t.marketForbesLoading}</p> : null}

      {!loading && error ? (
        <div className="admin-empty-card">
          <p className="state-text state-error">{error}</p>
          <button className="pagination-btn" onClick={onRefresh}>{t.marketForbesRefresh}</button>
        </div>
      ) : null}

      {!loading && !error && leaderboard.length === 0 ? (
        <p className="state-text state-empty">{t.marketForbesEmpty}</p>
      ) : null}

      {!loading && !error && leaderboard.length > 0 ? (
        <div className="forbes-list">
          {leaderboard.map(entry => {
            const rankClass = entry.rank <= 3 ? `rank-${entry.rank}` : "rank-other";
            const guildText = entry.homeGuildName || t.noHomeGuild;
            const descriptionText = entry.publicDescription || t.noDescription;

            return (
              <article key={`forbes-${entry.discordId}-${entry.rank}`} className={`forbes-card ${rankClass}`}>
                <div className="forbes-rank">#{entry.rank}</div>

                <div className="forbes-main">
                  <UserIdentity
                    user={entry}
                    size="md"
                    mode={streamerMode ? "streamer" : "normal"}
                    subtitle={`${t.fromGuild}: ${guildText}`}
                  />

                  <p className="forbes-description">{descriptionText}</p>
                </div>

                <div className="forbes-balance">
                  <p className="forbes-balance-main">{entry.balance.toLocaleString()} ODM</p>
                  <p className="forbes-balance-sub">{entry.ldmBalance.toLocaleString()} LDM</p>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
