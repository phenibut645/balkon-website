import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { listStreamerStudioSceneItems, listStreamerStudioScenes } from "@/lib/api";
import { ObsStudioSceneItemView, ObsStudioSceneView, StreamerStudioAccessView } from "@/lib/types";
import { ObsScenePreview } from "./ObsScenePreview";
import { ObsSceneItemList } from "./ObsSceneItemList";

type StreamerControlSessionProps = {
  t: DashboardText;
  streamer: StreamerStudioAccessView;
  onBack: () => void;
};

export function StreamerControlSession({ t, streamer, onBack }: StreamerControlSessionProps) {
  const [scenesLoading, setScenesLoading] = useState(false);
  const [scenesError, setScenesError] = useState<string | null>(null);
  const [scenes, setScenes] = useState<ObsStudioSceneView[]>([]);
  const [currentSceneName, setCurrentSceneName] = useState<string | null>(null);

  const [selectedSceneName, setSelectedSceneName] = useState<string>("");
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [items, setItems] = useState<ObsStudioSceneItemView[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  const agentStatusText = useMemo(() => {
    if (!streamer.obsAgentConfigured) {
      return t.streamerStudioAgentNotConfigured;
    }
    if (streamer.obsAgentOnline) {
      return t.streamerStudioAgentOnline;
    }
    return t.streamerStudioAgentOffline;
  }, [streamer.obsAgentConfigured, streamer.obsAgentOnline, t.streamerStudioAgentNotConfigured, t.streamerStudioAgentOffline, t.streamerStudioAgentOnline]);

  const loadScenes = useCallback(async () => {
    setScenesLoading(true);
    setScenesError(null);

    const response = await listStreamerStudioScenes(streamer.streamerId);
    if (response.ok && response.data) {
      const nextScenes = Array.isArray(response.data.scenes) ? response.data.scenes : [];
      setScenes(nextScenes);
      const nextCurrent = response.data.currentProgramSceneName ?? null;
      setCurrentSceneName(nextCurrent);

      if (!selectedSceneName) {
        const defaultName = nextCurrent || nextScenes[0]?.name || "";
        setSelectedSceneName(defaultName);
      }

      setScenesLoading(false);
      return;
    }

    setScenes([]);
    setCurrentSceneName(null);
    setScenesLoading(false);
    setScenesError(response.message || response.error || t.streamerStudioError);
  }, [selectedSceneName, streamer.streamerId, t.streamerStudioError]);

  const loadItems = useCallback(async (sceneName: string) => {
    const normalized = sceneName.trim();
    if (!normalized) {
      setItems([]);
      setSelectedItemId(null);
      return;
    }

    setItemsLoading(true);
    setItemsError(null);
    setSelectedItemId(null);

    const response = await listStreamerStudioSceneItems(streamer.streamerId, normalized);
    if (response.ok && response.data) {
      setItems(response.data.items || []);
      setItemsLoading(false);
      return;
    }

    setItems([]);
    setItemsLoading(false);
    setItemsError(response.message || response.error || t.streamerStudioError);
  }, [streamer.streamerId, t.streamerStudioError]);

  useEffect(() => {
    // auto-load scenes when session opens
    void loadScenes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamer.streamerId]);

  useEffect(() => {
    if (!selectedSceneName.trim()) {
      return;
    }
    void loadItems(selectedSceneName);
  }, [loadItems, selectedSceneName]);

  const canAttemptLoad = streamer.canControl;

  return (
    <div className="streamer-control-session">
      <div className="inventory-toolbar">
        <div className="session-head">
          <button className="pagination-btn ghost" type="button" onClick={onBack}>
            {t.streamerStudioBack}
          </button>
          <div>
            <h3 className="section-title">{streamer.nickname}</h3>
            <p className="market-card-hint">{agentStatusText}</p>
          </div>
        </div>

        <div className="session-actions">
          <button
            className="pagination-btn"
            type="button"
            onClick={() => void loadScenes()}
            disabled={!canAttemptLoad || scenesLoading}
            title={!canAttemptLoad ? t.streamerStudioForbiddenHint : undefined}
          >
            {t.streamerStudioLoadScenes}
          </button>
        </div>
      </div>

      {scenesError ? <p className="state-text state-error">{scenesError}</p> : null}

      <div className="streamer-scene-toolbar">
        <label className="market-card-hint" htmlFor="sceneSelect">{t.streamerStudioSelectScene}</label>
        <select
          id="sceneSelect"
          className="searchable-select"
          value={selectedSceneName}
          onChange={(event) => setSelectedSceneName(event.target.value)}
          disabled={scenesLoading || scenes.length === 0}
        >
          {scenes.length === 0 ? (
            <option value="">{t.streamerStudioNoScenes}</option>
          ) : (
            scenes.map(scene => (
              <option key={scene.name} value={scene.name}>
                {scene.name}{currentSceneName === scene.name ? " • live" : ""}
              </option>
            ))
          )}
        </select>
        {scenesLoading ? <span className="state-text compact">{t.shopObsLoading}</span> : null}
      </div>

      {itemsError ? <p className="state-text state-error">{itemsError}</p> : null}
      {itemsLoading ? <p className="state-text">{t.shopObsLoading}</p> : null}

      <div className="streamer-studio-session-grid">
        <ObsScenePreview
          t={t}
          items={items}
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
        />
        <ObsSceneItemList
          t={t}
          items={items}
          selectedItemId={selectedItemId}
          onSelect={setSelectedItemId}
        />
      </div>
    </div>
  );
}

