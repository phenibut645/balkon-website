import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { applyStreamerStudioSceneItemTransform, listStreamerStudioSceneItems, listStreamerStudioScenes } from "@/lib/api";
import { ObsStudioSceneItemTransform, ObsStudioSceneItemView, ObsStudioSceneView, StreamerStudioAccessView } from "@/lib/types";
import { ObsScenePreview } from "./ObsScenePreview";
import { ObsSceneItemList } from "./ObsSceneItemList";

type StreamerControlSessionProps = {
  t: DashboardText;
  streamer: StreamerStudioAccessView;
  onBack: () => void;
};

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeTransform(transform: ObsStudioSceneItemTransform): ObsStudioSceneItemTransform {
  return {
    positionX: clampNumber(transform.positionX, -10000, 10000),
    positionY: clampNumber(transform.positionY, -10000, 10000),
    scaleX: clampNumber(transform.scaleX, 0.05, 10),
    scaleY: clampNumber(transform.scaleY, 0.05, 10),
    rotation: clampNumber(transform.rotation, -360, 360),
    width: transform.width,
    height: transform.height,
  };
}

function transformsEqual(a: ObsStudioSceneItemTransform, b: ObsStudioSceneItemTransform): boolean {
  return a.positionX === b.positionX
    && a.positionY === b.positionY
    && a.scaleX === b.scaleX
    && a.scaleY === b.scaleY
    && a.rotation === b.rotation;
}

function buildDraftMap(sceneItems: ObsStudioSceneItemView[]): Record<number, ObsStudioSceneItemTransform> {
  return sceneItems.reduce<Record<number, ObsStudioSceneItemTransform>>((acc, item) => {
    acc[item.sceneItemId] = normalizeTransform(item.transform);
    return acc;
  }, {});
}

function pickPreferredSceneItemId(items: ObsStudioSceneItemView[], previousSelectedId: number | null): number | null {
  if (!items.length) {
    return null;
  }

  if (previousSelectedId !== null && items.some(item => item.sceneItemId === previousSelectedId)) {
    return previousSelectedId;
  }

  const recommended = items.find(item => item.sourceName.trim() === "Balkon Media Group");
  if (recommended) {
    return recommended.sceneItemId;
  }

  const firstEnabled = items.find(item => item.enabled);
  if (firstEnabled) {
    return firstEnabled.sceneItemId;
  }

  return items[0]?.sceneItemId ?? null;
}

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
  const [draftTransforms, setDraftTransforms] = useState<Record<number, ObsStudioSceneItemTransform>>({});
  const [applyLoading, setApplyLoading] = useState(false);
  const [transformStatus, setTransformStatus] = useState<{ message: string; isError: boolean } | null>(null);

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
      setDraftTransforms({});
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
      setDraftTransforms(buildDraftMap(nextItems));
      setSelectedItemId((prev) => {
        return pickPreferredSceneItemId(nextItems, prev);
      });
      setItemsLoading(false);
      return;
    }

    setItems([]);
    setSelectedItemId(null);
    setDraftTransforms({});
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
      setDraftTransforms({});
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

    const hasDraftChanges = items.some(item => {
      const draft = draftTransforms[item.sceneItemId];
      return draft ? !transformsEqual(item.transform, draft) : false;
    });
    if (hasDraftChanges) {
      const confirmed = window.confirm(t.streamerStudioDirtyRefreshConfirm);
      if (!confirmed) {
        return;
      }
    }
    await loadItems(normalized);
  }, [draftTransforms, items, loadItems, selectedSceneName, t.streamerStudioDirtyRefreshConfirm]);

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

  useEffect(() => {
    setTransformStatus(null);
  }, [selectedItemId]);

  const canAttemptLoad = streamer.canControl;
  const canEdit = streamer.canControl && Boolean(streamer.obsAgentConfigured) && Boolean(streamer.obsAgentOnline);

  const selectedServerItem = useMemo(
    () => (selectedItemId === null ? null : items.find(item => item.sceneItemId === selectedItemId) ?? null),
    [items, selectedItemId],
  );
  const selectedDraftTransform = useMemo(
    () => (selectedServerItem ? draftTransforms[selectedServerItem.sceneItemId] ?? normalizeTransform(selectedServerItem.transform) : null),
    [draftTransforms, selectedServerItem],
  );
  const dirtySelected = Boolean(selectedServerItem && selectedDraftTransform && !transformsEqual(selectedServerItem.transform, selectedDraftTransform));
  const dirtyItemId = dirtySelected && selectedServerItem ? selectedServerItem.sceneItemId : null;

  const displayedItems = useMemo(
    () => items
      .map(item => ({
        ...item,
        transform: draftTransforms[item.sceneItemId] ?? item.transform,
      }))
      // OBS GetSceneItemList returns items bottom-to-top (sceneItemIndex 0 is bottom).
      // Reverse so that the OBS Sources panel order (top first) is mirrored in the website UI.
      .slice()
      .reverse(),
    [draftTransforms, items],
  );

  const updateDraftTransform = useCallback((sceneItemId: number, patch: Partial<ObsStudioSceneItemTransform>) => {
    setDraftTransforms(prev => {
      const base = prev[sceneItemId] ?? normalizeTransform(items.find(item => item.sceneItemId === sceneItemId)?.transform ?? {
        positionX: 0,
        positionY: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      });
      return {
        ...prev,
        [sceneItemId]: normalizeTransform({
          ...base,
          ...patch,
          rotation: patch.rotation ?? base.rotation,
        }),
      };
    });
    setTransformStatus(null);
  }, [items]);

  const moveSelectedDraft = useCallback((deltaX: number, deltaY: number) => {
    if (!selectedServerItem || !canEdit) {
      return;
    }
    const current = draftTransforms[selectedServerItem.sceneItemId] ?? normalizeTransform(selectedServerItem.transform);
    updateDraftTransform(selectedServerItem.sceneItemId, {
      positionX: current.positionX + deltaX,
      positionY: current.positionY + deltaY,
    });
  }, [canEdit, draftTransforms, selectedServerItem, updateDraftTransform]);

  const resetSelectedDraft = useCallback(() => {
    if (!selectedServerItem) {
      return;
    }
    setDraftTransforms(prev => ({
      ...prev,
      [selectedServerItem.sceneItemId]: normalizeTransform(selectedServerItem.transform),
    }));
    setTransformStatus(null);
  }, [selectedServerItem]);

  const applySelectedTransform = useCallback(async () => {
    if (!selectedServerItem || !selectedDraftTransform || !canEdit || !selectedSceneName.trim()) {
      return;
    }
    setApplyLoading(true);
    setTransformStatus(null);

    const response = await applyStreamerStudioSceneItemTransform(streamer.streamerId, {
      sceneName: selectedSceneName,
      sceneItemId: selectedServerItem.sceneItemId,
      sourceName: selectedServerItem.sourceName,
      transform: {
        positionX: selectedDraftTransform.positionX,
        positionY: selectedDraftTransform.positionY,
        scaleX: selectedDraftTransform.scaleX,
        scaleY: selectedDraftTransform.scaleY,
        rotation: selectedDraftTransform.rotation,
      },
    });

    if (!response.ok || !response.data) {
      setApplyLoading(false);
      setTransformStatus({
        message: response.message || t.streamerStudioTransformApplyFailed,
        isError: true,
      });
      return;
    }

    const normalized = normalizeTransform(response.data.transform);
    setItems(prev => prev.map(item => (
      item.sceneItemId === response.data!.sceneItemId
        ? { ...item, transform: normalized, sourceName: response.data!.sourceName || item.sourceName }
        : item
    )));
    setDraftTransforms(prev => ({
      ...prev,
      [response.data!.sceneItemId]: normalized,
    }));
    setApplyLoading(false);
    setTransformStatus({
      message: t.streamerStudioTransformApplied,
      isError: false,
    });
  }, [
    canEdit,
    selectedDraftTransform,
    selectedSceneName,
    selectedServerItem,
    streamer.streamerId,
    t.streamerStudioTransformApplyFailed,
    t.streamerStudioTransformApplied,
  ]);

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
          items={displayedItems}
          selectedItemId={selectedItemId}
          canEdit={canEdit}
          dirtyItemId={dirtyItemId}
          onSelectItem={setSelectedItemId}
          onMoveSelected={moveSelectedDraft}
        />
        <ObsSceneItemList
          t={t}
          items={displayedItems}
          selectedItemId={selectedItemId}
          selectedDraftTransform={selectedDraftTransform}
          dirtySelected={dirtySelected}
          canEdit={canEdit}
          applyLoading={applyLoading}
          statusMessage={transformStatus?.message ?? null}
          statusError={Boolean(transformStatus?.isError)}
          onSelect={setSelectedItemId}
          onUpdateDraftTransform={(patch) => {
            if (!selectedServerItem) {
              return;
            }
            updateDraftTransform(selectedServerItem.sceneItemId, patch);
          }}
          onApply={() => void applySelectedTransform()}
          onReset={resetSelectedDraft}
        />
      </div>
    </div>
  );
}

