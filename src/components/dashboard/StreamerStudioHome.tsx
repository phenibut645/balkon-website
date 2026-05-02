import { DashboardText } from "@/lib/dashboardText";
import { StreamerStudioAccessRole, StreamerStudioAccessView } from "@/lib/types";

type StreamerStudioHomeProps = {
  t: DashboardText;
  streamers: StreamerStudioAccessView[];
  onOpenControl: (streamer: StreamerStudioAccessView) => void;
};

function roleLabel(t: DashboardText, role: StreamerStudioAccessRole): string {
  if (role === "owner") return t.streamerStudioRoleOwner;
  if (role === "manager") return t.streamerStudioRoleManager;
  if (role === "moderator") return t.streamerStudioRoleModerator;
  return t.streamerStudioRoleBotAdmin;
}

function agentStatusLabel(t: DashboardText, streamer: StreamerStudioAccessView): string {
  if (!streamer.obsAgentConfigured) {
    return t.streamerStudioAgentNotConfigured;
  }
  if (streamer.obsAgentOnline) {
    return t.streamerStudioAgentOnline;
  }
  return t.streamerStudioAgentOffline;
}

function agentStatusKind(streamer: StreamerStudioAccessView): "online" | "offline" | "unknown" {
  if (!streamer.obsAgentConfigured) return "unknown";
  return streamer.obsAgentOnline ? "online" : "offline";
}

function agentDiagnostics(t: DashboardText, streamer: StreamerStudioAccessView): string | null {
  if (!streamer.obsAgentConfigured) {
    return null;
  }

  const details = [
    `${t.streamerStudioAgentVersionLabel}: ${streamer.obsAgentVersion ?? "-"}`,
    `${t.streamerStudioObsStatusLabel}: ${streamer.obsConnected === false ? t.streamerStudioObsDisconnected : t.streamerStudioObsConnected}`,
  ];

  if (streamer.obsVersion) {
    details.push(`${t.streamerStudioObsVersionLabel}: ${streamer.obsVersion}`);
  }

  return details.join(" · ");
}

export function StreamerStudioHome({ t, streamers, onOpenControl }: StreamerStudioHomeProps) {
  return (
    <div className="streamer-studio-grid">
      {streamers.map(streamer => (
        <article key={streamer.streamerId} className="streamer-card">
          <div className="admin-log-head">
            <p className="display-name">{streamer.nickname}</p>
            <span className={`streamer-role-badge ${streamer.accessRole}`}>{roleLabel(t, streamer.accessRole)}</span>
          </div>

          {streamer.twitchUrl ? (
            <a href={streamer.twitchUrl} target="_blank" rel="noopener noreferrer" className="pagination-btn ghost">
              Twitch
            </a>
          ) : null}

          <div className="streamer-card-status">
            <span className={`obs-status-pill ${agentStatusKind(streamer)}`}>{agentStatusLabel(t, streamer)}</span>
            {streamer.canControl ? <span className="meta-badge ok">{t.streamerStudioCanControl}</span> : null}
            {streamer.canManage ? <span className="meta-badge neutral">{t.streamerStudioCanManage}</span> : null}
          </div>
          {agentDiagnostics(t, streamer) ? <p className="market-card-hint">{agentDiagnostics(t, streamer)}</p> : null}

          <button
            className="pagination-btn"
            type="button"
            onClick={() => onOpenControl(streamer)}
            disabled={!streamer.canControl}
            title={!streamer.canControl ? t.streamerStudioForbiddenHint : undefined}
          >
            {t.streamerStudioOpenControl}
          </button>
        </article>
      ))}
    </div>
  );
}

