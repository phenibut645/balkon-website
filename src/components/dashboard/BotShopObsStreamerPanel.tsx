import { DashboardText } from "@/lib/dashboardText";
import { ObsMediaProduct, ObsShopStreamer } from "@/lib/types";
import { BotShopObsMediaPanel } from "./BotShopObsMediaPanel";

type BotShopObsStreamerPanelProps = {
  t: DashboardText;
  streamer: ObsShopStreamer;
  mediaProducts: ObsMediaProduct[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
};

function getAgentStatusLabel(t: DashboardText, streamer: ObsShopStreamer): string {
  if (!streamer.obsAgentId) {
    return t.agentNotConfigured;
  }

  if (streamer.obsAgentOnline) {
    return t.agentConnected;
  }

  const lastSeenRaw = streamer.obsAgentLastSeenAt || streamer.lastSeenAt;
  if (!lastSeenRaw) {
    return t.agentOffline;
  }

  const lastSeenDate = new Date(lastSeenRaw);
  if (Number.isNaN(lastSeenDate.getTime())) {
    return t.agentOffline;
  }

  return `${t.agentOfflineRecently}: ${lastSeenDate.toLocaleString()}`;
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

export function BotShopObsStreamerPanel({
  t,
  streamer,
  mediaProducts,
  loading,
  error,
  onBack,
}: BotShopObsStreamerPanelProps) {
  return (
    <div className="obs-streamer-detail">
      <div className="obs-breadcrumb">
        <button className="pagination-btn ghost" type="button" onClick={onBack}>{t.backToStreamers}</button>
        <span className="pagination-status">{t.tabBotShop} / {t.shopObs} / {streamer.nickname}</span>
      </div>

      <div className="shop-overview-card">
        <p className="section-title">{streamer.nickname}</p>
        <div className="botshop-meta">
          <span className={`obs-status-pill ${streamer.obsAgentOnline ? "online" : streamer.obsAgentId ? "offline" : "unknown"}`}>{getAgentStatusLabel(t, streamer)}</span>
          <span className={`obs-status-pill ${streamer.streamingStatus === "live" ? "online" : streamer.streamingStatus === "offline" ? "offline" : "unknown"}`}>{getStreamStatusLabel(t, streamer.streamingStatus)}</span>
        </div>
        {streamer.twitchUrl ? (
          <a className="pagination-btn ghost" href={streamer.twitchUrl} target="_blank" rel="noopener noreferrer">{t.twitch}</a>
        ) : null}
      </div>

      {loading ? <p className="state-text">{t.shopObsLoading}</p> : null}
      {!loading && error ? <p className="state-text state-error">{error}</p> : null}
      {!loading && !error ? (
        <>
          <div className="shop-subtabs" role="tablist" aria-label={t.media}>
            <button type="button" className="shop-subtab-chip active">{t.media}</button>
          </div>
          <BotShopObsMediaPanel t={t} products={mediaProducts} />
        </>
      ) : null}
    </div>
  );
}
