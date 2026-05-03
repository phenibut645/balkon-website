import { DashboardText } from "@/lib/dashboardText";
import { StreamerStudioAccessView } from "@/lib/types";

type AgentDiagnosticsProps = {
  t: DashboardText;
  streamer: StreamerStudioAccessView;
  agentStatusText: string;
};

export function AgentDiagnostics({ t, streamer, agentStatusText }: AgentDiagnosticsProps) {
  return (
    <div className="agent-diagnostics">
      <p className="market-card-hint">{agentStatusText}</p>
      {streamer.obsAgentConfigured ? (
        <p className="market-card-hint">
          {t.streamerStudioAgentVersionLabel}: {streamer.obsAgentVersion ?? "-"} · {t.streamerStudioRelayProtocolLabel}: {streamer.obsRelayProtocolVersion ?? "-"} · {t.streamerStudioObsStatusLabel}: {streamer.obsConnected === false ? t.streamerStudioObsDisconnected : t.streamerStudioObsConnected}
        </p>
      ) : null}
      {streamer.obsAgentConfigured && (streamer.obsVersion || streamer.obsWebsocketVersion) ? (
        <p className="market-card-hint">
          {t.streamerStudioObsVersionLabel}: {streamer.obsVersion ?? "-"} · {t.streamerStudioObsWebsocketVersionLabel}: {streamer.obsWebsocketVersion ?? "-"}
        </p>
      ) : null}
    </div>
  );
}
