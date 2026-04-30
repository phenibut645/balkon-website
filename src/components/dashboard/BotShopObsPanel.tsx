import { DashboardText } from "@/lib/dashboardText";
import { ObsShopStreamer } from "@/lib/types";

type BotShopObsPanelProps = {
  t: DashboardText;
  loading: boolean;
  error: string | null;
  streamers: ObsShopStreamer[];
  onOpenStreamer: (streamer: ObsShopStreamer) => void;
  onRefresh: () => void;
};

function getAgentStatusLabel(t: DashboardText, streamer: ObsShopStreamer): string {
  if (!streamer.obsAgentId) {
    return t.agentNotConfigured;
  }

  return streamer.obsAgentOnline ? t.agentConnected : t.agentOffline;
}

function getStreamStatusLabel(t: DashboardText, status: ObsShopStreamer["streamingStatus"]): string {
  if (status === "live") {
    return t.streamLive;
  }
  if (status === "offline") {
    return t.streamOffline;
  }
  return t.streamUnknown;
}

export function BotShopObsPanel({
  t,
  loading,
  error,
  streamers,
  onOpenStreamer,
  onRefresh,
}: BotShopObsPanelProps) {
  return (
    <div>
      <div className="inventory-toolbar">
        <h2 className="section-title">{t.shopObsStreamers}</h2>
        <button className="pagination-btn" type="button" onClick={onRefresh}>{t.marketRefresh}</button>
      </div>

      {loading ? <p className="state-text">{t.shopObsLoading}</p> : null}
      {!loading && error ? <p className="state-text state-error">{error}</p> : null}
      {!loading && !error && streamers.length === 0 ? <p className="state-text state-empty">{t.shopObsEmpty}</p> : null}

      {!loading && !error && streamers.length > 0 ? (
        <div className="obs-streamer-grid">
          {streamers.map(streamer => (
            <article key={`${streamer.streamerId}`} className="obs-streamer-card">
              <div className="admin-log-head">
                <p className="display-name">{streamer.nickname}</p>
                {streamer.isPrimary ? <span className="meta-badge ok">{t.streamerPrimary}</span> : null}
              </div>
              <p className="market-card-hint">{streamer.guildDisplayName || streamer.discordGuildId}</p>
              {streamer.twitchUrl ? (
                <a href={streamer.twitchUrl} target="_blank" rel="noopener noreferrer" className="pagination-btn ghost">{t.twitch}</a>
              ) : null}
              <div className="botshop-meta">
                <span className={`obs-status-pill ${streamer.obsAgentOnline ? "online" : streamer.obsAgentId ? "offline" : "unknown"}`}>{getAgentStatusLabel(t, streamer)}</span>
                <span className={`obs-status-pill ${streamer.streamingStatus === "live" ? "online" : streamer.streamingStatus === "offline" ? "offline" : "unknown"}`}>{getStreamStatusLabel(t, streamer.streamingStatus)}</span>
              </div>
              <button className="pagination-btn" type="button" onClick={() => onOpenStreamer(streamer)}>{t.openStreamer}</button>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
