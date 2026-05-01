import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const scenesRequestSeqRef = useRef(0);
  const itemsRequestSeqRef = useRef(0);
  const skipNextSceneEffectRef = useRef<string | null>(null);

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

  const loadItems = useCallback(async (sceneName: string) => {
    const normalized = sceneName.trim();
    const requestId = ++itemsRequestSeqRef.current;

    if (!normalized) {
      setItems([]);
      setSelectedItemId(null);
      setItemsError(null);
      setItemsLoading(false);
      return;
    }

    setItemsLoading(true);
    setItemsError(null);

    const response = await listStreamerStudioSceneItems(streamer.streamerId, normalized);
    if (requestId !== itemsRequestSeqRef.current) {
      return;
    }

    if (response.ok && response.data) {
      const nextItems = response.data.items || [];
      setItems(nextItems);
      setSelectedItemId((prev) => {
        if (prev !== null && nextItems.some(item => item.sceneItemId === prev)) {
          return prev;
        }
        return nextItems[0]?.sceneItemId ?? null;
      });
      setItemsLoading(false);
      return;
    }

    setItems([]);
    setSelectedItemId(null);
    setItemsLoading(false);
    setItemsError(response.message || response.error || t.streamerStudioError);
  }, [streamer.streamerId, t.streamerStudioError]);

  const loadScenesAndItems = useCallback(async () => {
    setScenesLoading(true);
    setScenesError(null);
    const scenesRequestId = ++scenesRequestSeqRef.current;

    const response = await listStreamerStudioScenes(streamer.streamerId);
    if (scenesRequestId !== scenesRequestSeqRef.current) {
      return;
    }

    if (!response.ok || !response.data) {
      setScenes([]);
      setCurrentSceneName(null);
      setSelectedSceneName("");
      setItems([]);
      setSelectedItemId(null);
      setScenesLoading(false);
      setScenesError(response.message || response.error || t.streamerStudioError);
      return;
    }

    const nextScenes = Array.isArray(response.data.scenes) ? response.data.scenes : [];
    const nextCurrent = response.data.currentProgramSceneName ?? null;
    const hasPreviousSelection = nextScenes.some(scene => scene.name === selectedSceneName);
    const nextSceneName = hasPreviousSelection
      ? selectedSceneName
      : (nextCurrent && nextScenes.some(scene => scene.name === nextCurrent) ? nextCurrent : (nextScenes[0]?.name || ""));

    setScenes(nextScenes);
    setCurrentSceneName(nextCurrent);
    setSelectedSceneName(nextSceneName);
    setScenesLoading(false);

    if (!nextSceneName) {
      setItems([]);
      setSelectedItemId(null);
      setItemsError(null);
      return;
    }

    skipNextSceneEffectRef.current = nextSceneName;
    await loadItems(nextSceneName);
  }, [loadItems, selectedSceneName, streamer.streamerId, t.streamerStudioError]);

  const loadCurrentItems = useCallback(async () => {
    const normalized = selectedSceneName.trim();
    if (!normalized) {
      setItems([]);
      setSelectedItemId(null);
      setItemsError(null);
      return;
    }

    await loadItems(normalized);
  }, [loadItems, selectedSceneName]);

  useEffect(() => {
    void loadScenesAndItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamer.streamerId]);

  useEffect(() => {
    const normalized = selectedSceneName.trim();
    if (!normalized) {
      return;
    }
    if (skipNextSceneEffectRef.current === normalized) {
      skipNextSceneEffectRef.current = null;
      return;
    }
    void loadItems(normalized);
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
            onClick={() => void loadScenesAndItems()}
            disabled={!canAttemptLoad || scenesLoading}
            title={!canAttemptLoad ? t.streamerStudioForbiddenHint : undefined}
          >
            {t.streamerStudioRefreshScenes}
          </button>
          <button
            className="pagination-btn"
            type="button"
            onClick={() => void loadCurrentItems()}
            disabled={!canAttemptLoad || !selectedSceneName.trim() || itemsLoading}
            title={!canAttemptLoad ? t.streamerStudioForbiddenHint : undefined}
          >
            {t.streamerStudioRefreshItems}
          </button>
        </div>
      </div>

      {!streamer.obsAgentConfigured ? (
        <p className="state-text state-error">{t.streamerStudioAgentNotConfigured}</p>
      ) : null}
      {streamer.obsAgentConfigured && !streamer.obsAgentOnline ? (
        <p className="state-text">{t.streamerStudioAgentOffline}</p>
      ) : null}
      {scenesError ? <p className="state-text state-error">{scenesError}</p> : null}

      <div className="streamer-scene-toolbar">
        <label className="market-card-hint" htmlFor="sceneSelect">{t.streamerStudioSelectScene}</label>
        <select
          id="sceneSelect"
          className="searchable-select streamer-scene-select"
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
        {scenesLoading ? <span className="state-text compact">{t.streamerStudioLoadingScenes}</span> : null}
      </div>

      {itemsError ? <p className="state-text state-error">{itemsError}</p> : null}
      {itemsLoading ? <p className="state-text">{t.streamerStudioLoadingItems}</p> : null}

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

