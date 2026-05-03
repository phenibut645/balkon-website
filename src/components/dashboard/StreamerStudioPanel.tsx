import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { getStreamerStudioAccessible } from "@/lib/api";
import { StreamerStudioAccessView } from "@/lib/types";
import { StreamerStudioHome } from "./StreamerStudioHome";
import { StreamerControlSession } from "./streamer-studio/StreamerControlSession";

type StreamerStudioPanelProps = {
  t: DashboardText;
  active: boolean;
};

export function StreamerStudioPanel({ t, active }: StreamerStudioPanelProps) {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamers, setStreamers] = useState<StreamerStudioAccessView[]>([]);
  const [selectedStreamer, setSelectedStreamer] = useState<StreamerStudioAccessView | null>(null);

  const accessibleSorted = useMemo(() => {
    return [...streamers].sort((a, b) => a.nickname.localeCompare(b.nickname));
  }, [streamers]);

  const load = useCallback(async (silent = false) => {
    if (loading) {
      return;
    }
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    const response = await getStreamerStudioAccessible();
    if (response.ok && Array.isArray(response.data)) {
      setStreamers(response.data);
      setLoaded(true);
      setError(null);
      if (!silent) {
        setLoading(false);
      }
      return;
    }

    setLoaded(true);
    setStreamers([]);
    setError(response.message || response.error || t.streamerStudioError);
    if (!silent) {
      setLoading(false);
    }
  }, [loading, t.streamerStudioError]);

  useEffect(() => {
    if (!active) {
      return;
    }
    if (!loaded && !loading) {
      void load(true);
    }
  }, [active, loaded, load, loading]);

  useEffect(() => {
    if (!selectedStreamer) {
      return;
    }

    const refreshed = streamers.find(streamer => streamer.streamerId === selectedStreamer.streamerId) ?? null;
    if (!refreshed) {
      return;
    }

    setSelectedStreamer(refreshed);
  }, [selectedStreamer, streamers]);

  return (
    <div className="streamer-studio-panel">
      {!selectedStreamer ? (
        <>
          <div className="inventory-toolbar">
            <div>
              <h2 className="section-title">{t.streamerStudioTitle}</h2>
              <p className="market-card-hint">{t.streamerStudioSubtitle}</p>
            </div>
            <button className="pagination-btn" type="button" onClick={() => void load(false)}>
              {t.streamerStudioRefresh}
            </button>
          </div>

          {loading ? <p className="state-text">{t.shopObsLoading}</p> : null}
          {!loading && error ? <p className="state-text state-error">{error}</p> : null}

          {!loading && !error && accessibleSorted.length === 0 ? (
            <p className="state-text state-empty">{t.streamerStudioEmpty}</p>
          ) : null}

          <StreamerStudioHome
            t={t}
            streamers={accessibleSorted}
            onOpenControl={setSelectedStreamer}
          />
        </>
      ) : (
        <StreamerControlSession
          t={t}
          streamer={selectedStreamer}
          onBack={() => setSelectedStreamer(null)}
        />
      )}
    </div>
  );
}
