import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { applyStreamerStudioSceneItemIndex, applyStreamerStudioSceneItemTransform, createStreamerStudioBrowserSource, createStreamerStudioTextSource, getStreamerStudioSourceSettings, listStreamerStudioSceneItems, listStreamerStudioScenes, removeStreamerStudioSceneItem, setStreamerStudioSceneItemVisibility, updateStreamerStudioBrowserSource, updateStreamerStudioTextSource } from "@/lib/api";
import { ObsStudioBrowserSourceCreateInput, ObsStudioBrowserSourceUpdateInput, ObsStudioSceneItemTransform, ObsStudioSceneItemView, ObsStudioSceneView, ObsStudioSourceSettingsGetResult, ObsStudioTextSourceCreateInput, StreamerStudioAccessView } from "@/lib/types";
import { ObsScenePreview } from "./ObsScenePreview";
import { ObsSceneItemList } from "./ObsSceneItemList";
import { StreamerTrustedUsersPanel } from "./StreamerTrustedUsersPanel";
import { StreamerSourceCreatePanel } from "./StreamerSourceCreatePanel";

type StreamerControlSessionProps = {
  t: DashboardText;
  streamer: StreamerStudioAccessView;
  onBack: () => void;
};

type SceneItemSourceSettings = {
  text?: string;
  browserUrl?: string;
  browserWidth?: number;
  browserHeight?: number;
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

function withNativeIndexes(sceneItems: ObsStudioSceneItemView[]): ObsStudioSceneItemView[] {
  return sceneItems
    .map((item, index) => ({
      ...item,
      sceneItemIndex: Number.isInteger(item.sceneItemIndex) && item.sceneItemIndex! >= 0 ? item.sceneItemIndex : index,
    }))
    .sort((a, b) => (a.sceneItemIndex ?? 0) - (b.sceneItemIndex ?? 0));
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

function isEditableStudioSourceKind(kind: string | null | undefined): boolean {
  return kind === "browser_source"
    || kind === "text_gdiplus_v2"
    || kind === "text_gdiplus"
    || kind === "text_ft2_source_v2"
    || kind === "text_ft2_source";
}

function hasCachedSourceSettings(
  item: ObsStudioSceneItemView | null,
  settings: SceneItemSourceSettings | undefined,
): boolean {
  if (!item) {
    return false;
  }

  if (item.inputKind === "browser_source") {
    return typeof settings?.browserUrl === "string"
      || Number.isFinite(settings?.browserWidth)
      || Number.isFinite(settings?.browserHeight);
  }

  if (isEditableStudioSourceKind(item.inputKind)) {
    return typeof settings?.text === "string";
  }

  return false;
}

function mergeSourceSettings(
  existing: SceneItemSourceSettings | undefined,
  result: ObsStudioSourceSettingsGetResult,
): SceneItemSourceSettings {
  return {
    ...(existing ?? {}),
    ...(typeof result.settings.text === "string" ? { text: result.settings.text } : {}),
    ...(typeof result.settings.url === "string" ? { browserUrl: result.settings.url } : {}),
    ...(Number.isFinite(result.settings.width) ? { browserWidth: result.settings.width } : {}),
    ...(Number.isFinite(result.settings.height) ? { browserHeight: result.settings.height } : {}),
  };
}

export function StreamerControlSession({ t, streamer, onBack }: StreamerControlSessionProps) {
  const scenesRequestSeqRef = useRef(0);
  const itemsRequestSeqRef = useRef(0);
  const sourceSettingsRequestSeqRef = useRef(0);
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
  const [indexApplyLoading, setIndexApplyLoading] = useState(false);
  const [sourceCreateLoading, setSourceCreateLoading] = useState(false);
  const [sourceCreateStatus, setSourceCreateStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [sourceSettings, setSourceSettings] = useState<Record<number, SceneItemSourceSettings>>({});
  const [transformStatus, setTransformStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [indexStatus, setIndexStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [lifecycleStatus, setLifecycleStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [textUpdateLoading, setTextUpdateLoading] = useState(false);
  const [browserUpdateLoading, setBrowserUpdateLoading] = useState(false);
  const [textUpdateStatus, setTextUpdateStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [browserUpdateStatus, setBrowserUpdateStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [sourceSettingsLoading, setSourceSettingsLoading] = useState(false);
  const [sourceSettingsLoadStatus, setSourceSettingsLoadStatus] = useState<{ message: string; isError: boolean } | null>(null);

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
      const nextItems = withNativeIndexes(response.data.items || []);
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
    setIndexStatus(null);
    setLifecycleStatus(null);
    setTextUpdateStatus(null);
    setBrowserUpdateStatus(null);
    setSourceSettingsLoadStatus(null);
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
  const selectedNativeIndex = selectedServerItem?.sceneItemIndex ?? null;
  const maxNativeIndex = items.length > 0 ? items.length - 1 : 0;

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

  useEffect(() => {
    const requestId = ++sourceSettingsRequestSeqRef.current;
    const sceneName = selectedSceneName.trim();
    const selectedItem = selectedServerItem;
    if (!canEdit || !sceneName || !selectedItem || !isEditableStudioSourceKind(selectedItem.inputKind)) {
      setSourceSettingsLoading(false);
      return;
    }

    if (hasCachedSourceSettings(selectedItem, sourceSettings[selectedItem.sceneItemId])) {
      setSourceSettingsLoading(false);
      return;
    }

    setSourceSettingsLoading(true);
    setSourceSettingsLoadStatus({
      message: t.streamerStudioSourceSettingsLoading,
      isError: false,
    });

    void (async () => {
      const response = await getStreamerStudioSourceSettings(streamer.streamerId, {
        sceneName,
        sceneItemId: selectedItem.sceneItemId,
        sourceName: selectedItem.sourceName,
      });

      if (requestId !== sourceSettingsRequestSeqRef.current) {
        return;
      }

      setSourceSettingsLoading(false);

      if (!response.ok || !response.data) {
        setSourceSettingsLoadStatus({
          message: response.message || t.streamerStudioSourceSettingsLoadFailed,
          isError: true,
        });
        return;
      }

      setSourceSettings(prev => ({
        ...prev,
        [response.data!.sceneItemId]: mergeSourceSettings(prev[response.data!.sceneItemId], response.data!),
      }));
      setItems(prev => prev.map(item => (
        item.sceneItemId === response.data!.sceneItemId
          ? {
            ...item,
            sourceName: response.data!.sourceName || item.sourceName,
            inputKind: response.data!.inputKind ?? item.inputKind,
          }
          : item
      )));
      setSourceSettingsLoadStatus(null);
    })();
  }, [
    canEdit,
    selectedSceneName,
    selectedServerItem,
    sourceSettings,
    streamer.streamerId,
    t.streamerStudioSourceSettingsLoadFailed,
    t.streamerStudioSourceSettingsLoading,
  ]);

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

  const applySelectedIndex = useCallback(async (targetIndex: number) => {
    if (!selectedServerItem || !canEdit || !selectedSceneName.trim() || indexApplyLoading) {
      return;
    }

    setIndexApplyLoading(true);
    setIndexStatus(null);

    const response = await applyStreamerStudioSceneItemIndex(streamer.streamerId, {
      sceneName: selectedSceneName,
      sceneItemId: selectedServerItem.sceneItemId,
      sourceName: selectedServerItem.sourceName,
      sceneItemIndex: targetIndex,
    });

    if (!response.ok || !response.data) {
      setIndexApplyLoading(false);
      setIndexStatus({
        message: response.message || t.streamerStudioLayerApplyFailed,
        isError: true,
      });
      return;
    }

    const returnedItems = response.data.items || [];
    setItems(prev => {
      if (returnedItems.length > 0) {
        const indexMap = new Map(returnedItems.map(item => [item.sceneItemId, item]));
        return withNativeIndexes(prev.map(item => {
          const updated = indexMap.get(item.sceneItemId);
          return updated
            ? {
              ...item,
              sourceName: updated.sourceName || item.sourceName,
              sceneItemIndex: updated.sceneItemIndex,
              enabled: typeof updated.enabled === "boolean" ? updated.enabled : item.enabled,
            }
            : item;
        }));
      }

      return withNativeIndexes(prev.map(item => (
        item.sceneItemId === response.data!.sceneItemId
          ? {
            ...item,
            sourceName: response.data!.sourceName || item.sourceName,
            sceneItemIndex: response.data!.sceneItemIndex,
            enabled: item.enabled,
          }
          : item
      )));
    });
    setSelectedItemId(response.data.sceneItemId);
    setIndexApplyLoading(false);
    setIndexStatus({
      message: t.streamerStudioLayerApplied,
      isError: false,
    });
  }, [
    canEdit,
    indexApplyLoading,
    selectedSceneName,
    selectedServerItem,
    streamer.streamerId,
    t.streamerStudioLayerApplied,
    t.streamerStudioLayerApplyFailed,
  ]);

  const setSelectedItemVisibility = useCallback(async (enabled: boolean) => {
    const sceneName = selectedSceneName.trim();
    if (!selectedServerItem || !sceneName || !canEdit || lifecycleLoading) {
      return;
    }

    setLifecycleLoading(true);
    setLifecycleStatus(null);

    const response = await setStreamerStudioSceneItemVisibility(streamer.streamerId, {
      sceneName,
      sceneItemId: selectedServerItem.sceneItemId,
      sourceName: selectedServerItem.sourceName,
      enabled,
    });

    if (!response.ok || !response.data) {
      setLifecycleLoading(false);
      setLifecycleStatus({
        message: response.message || t.streamerStudioVisibilityApplyFailed,
        isError: true,
      });
      return;
    }

    const { data } = response;
    const targetItemId = data.sceneItemId;
    const targetSourceName = data.sourceName;
    const targetEnabled = data.enabled;
    const returnedItems = data.items || [];

    setItems(prev => {
      const indexMap = new Map(returnedItems.map(item => [item.sceneItemId, item]));
      const next = prev.map(item => {
        const updated = indexMap.get(item.sceneItemId);
        if (updated) {
          return {
            ...item,
            sourceName: updated.sourceName || item.sourceName,
            sceneItemIndex: updated.sceneItemIndex,
            enabled: typeof updated.enabled === "boolean"
              ? updated.enabled
              : (item.sceneItemId === targetItemId ? targetEnabled : item.enabled),
          };
        }

        if (item.sceneItemId === targetItemId) {
          return {
            ...item,
            sourceName: targetSourceName || item.sourceName,
            enabled: targetEnabled,
          };
        }

        return item;
      });

      return withNativeIndexes(next);
    });

    setLifecycleLoading(false);
    setLifecycleStatus({
      message: t.streamerStudioVisibilityApplied,
      isError: false,
    });
    setSelectedItemId(targetItemId);
  }, [
    canEdit,
    lifecycleLoading,
    selectedSceneName,
    selectedServerItem,
    streamer.streamerId,
    t.streamerStudioVisibilityApplied,
    t.streamerStudioVisibilityApplyFailed,
  ]);

  const removeSelectedItem = useCallback(async () => {
    const sceneName = selectedSceneName.trim();
    if (!selectedServerItem || !sceneName || !canEdit || lifecycleLoading) {
      return;
    }

    const confirmed = window.confirm(t.streamerStudioRemoveConfirm);
    if (!confirmed) {
      return;
    }

    setLifecycleLoading(true);
    setLifecycleStatus(null);

    const response = await removeStreamerStudioSceneItem(streamer.streamerId, {
      sceneName,
      sceneItemId: selectedServerItem.sceneItemId,
      sourceName: selectedServerItem.sourceName,
    });

    if (!response.ok || !response.data) {
      setLifecycleLoading(false);
      setLifecycleStatus({
        message: response.message || t.streamerStudioRemoveFailed,
        isError: true,
      });
      return;
    }

    const removedId = response.data.sceneItemId;
    const returnedItems = response.data.items || [];
    let nextSelectedId: number | null = null;

    setItems(prev => {
      const filtered = prev.filter(item => item.sceneItemId !== removedId);
      if (returnedItems.length > 0) {
        const indexMap = new Map(returnedItems.map(item => [item.sceneItemId, item]));
        const mapped = filtered.map(item => {
          const updated = indexMap.get(item.sceneItemId);
          if (!updated) {
            return item;
          }

          return {
            ...item,
            sourceName: updated.sourceName || item.sourceName,
            sceneItemIndex: updated.sceneItemIndex,
            enabled: typeof updated.enabled === "boolean" ? updated.enabled : item.enabled,
          };
        });
        const normalized = withNativeIndexes(mapped);
        nextSelectedId = normalized.find(item => item.enabled)?.sceneItemId
          ?? normalized[0]?.sceneItemId
          ?? null;
        return normalized;
      }

      const normalized = withNativeIndexes(filtered);
      nextSelectedId = normalized.find(item => item.enabled)?.sceneItemId
        ?? normalized[0]?.sceneItemId
        ?? null;
      return normalized;
    });

    setDraftTransforms(prev => {
      if (!(removedId in prev)) {
        return prev;
      }
      const { [removedId]: _removed, ...rest } = prev;
      return rest;
    });

    setLifecycleLoading(false);
    setLifecycleStatus({
      message: t.streamerStudioRemoveApplied,
      isError: false,
    });
    setSelectedItemId(nextSelectedId);
  }, [
    canEdit,
    lifecycleLoading,
    selectedSceneName,
    selectedServerItem,
    streamer.streamerId,
    t.streamerStudioRemoveApplied,
    t.streamerStudioRemoveConfirm,
    t.streamerStudioRemoveFailed,
  ]);

  const createTextSource = useCallback(async (input: ObsStudioTextSourceCreateInput) => {
    const sceneName = selectedSceneName.trim();
    if (!canEdit || !sceneName || sourceCreateLoading) {
      return;
    }

    const text = input.text.trim();
    const sourceName = typeof input.sourceName === "string" ? input.sourceName.trim() : input.sourceName;
    if (!text.length || text.length > 500 || (typeof sourceName === "string" && sourceName.length > 160)) {
      setSourceCreateStatus({ message: t.streamerStudioCreateTextInvalid, isError: true });
      return;
    }

    setSourceCreateLoading(true);
    setSourceCreateStatus(null);

    const response = await createStreamerStudioTextSource(streamer.streamerId, {
      ...input,
      sceneName,
      sourceName: sourceName || null,
      text,
      positionX: 100,
      positionY: 100,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    });

    setSourceCreateLoading(false);

    if (!response.ok || !response.data) {
      setSourceCreateStatus({
        message: response.message || t.streamerStudioCreateTextFailed,
        isError: true,
      });
      return;
    }

    const createdTransform = normalizeTransform(response.data.transform);
    const returnedItems = response.data.items || [];
    setItems(prev => {
      const existing = prev.filter(item => item.sceneItemId !== response.data!.sceneItemId);
      const indexMap = new Map(returnedItems.map(item => [item.sceneItemId, item]));
      const maxIndex = existing.reduce((max, item) => Math.max(max, item.sceneItemIndex ?? 0), -1);
      const createdIndex = indexMap.get(response.data!.sceneItemId)?.sceneItemIndex ?? maxIndex + 1;
      const nextItems = existing.map(item => {
        const indexed = indexMap.get(item.sceneItemId);
        return indexed ? { ...item, sourceName: indexed.sourceName || item.sourceName, sceneItemIndex: indexed.sceneItemIndex } : item;
      });

      nextItems.push({
        sceneItemId: response.data!.sceneItemId,
        sourceName: response.data!.sourceName,
        inputKind: response.data!.inputKind || null,
        enabled: true,
        sceneItemIndex: createdIndex,
        transform: createdTransform,
      });

      return withNativeIndexes(nextItems);
    });
    setDraftTransforms(prev => ({
      ...prev,
      [response.data!.sceneItemId]: createdTransform,
    }));
    setSourceSettings(prev => ({
      ...prev,
      [response.data!.sceneItemId]: {
        ...(prev[response.data!.sceneItemId] ?? {}),
        text,
      },
    }));
    setSelectedItemId(response.data.sceneItemId);
    setSourceCreateStatus({ message: t.streamerStudioCreateTextSuccess, isError: false });
  }, [canEdit, selectedSceneName, sourceCreateLoading, streamer.streamerId, t.streamerStudioCreateTextFailed, t.streamerStudioCreateTextInvalid, t.streamerStudioCreateTextSuccess]);

  const createBrowserSource = useCallback(async (input: ObsStudioBrowserSourceCreateInput) => {
    const sceneName = selectedSceneName.trim();
    if (!canEdit || !sceneName || sourceCreateLoading) {
      return;
    }

    const url = input.url.trim();
    const sourceName = typeof input.sourceName === "string" ? input.sourceName.trim() : input.sourceName;
    if (!url.length || url.length > 1000 || !/^https?:\/\//i.test(url) || (typeof sourceName === "string" && sourceName.length > 160)) {
      setSourceCreateStatus({ message: t.streamerStudioCreateBrowserInvalid, isError: true });
      return;
    }

    setSourceCreateLoading(true);
    setSourceCreateStatus(null);

    const response = await createStreamerStudioBrowserSource(streamer.streamerId, {
      ...input,
      sceneName,
      sourceName: sourceName || null,
      url,
      width: input.width ?? 800,
      height: input.height ?? 450,
      positionX: 100,
      positionY: 100,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    });

    setSourceCreateLoading(false);

    if (!response.ok || !response.data) {
      setSourceCreateStatus({
        message: response.message || t.streamerStudioCreateBrowserFailed,
        isError: true,
      });
      return;
    }

    const createdTransform = normalizeTransform(response.data.transform);
    const returnedItems = response.data.items || [];
    setItems(prev => {
      const existing = prev.filter(item => item.sceneItemId !== response.data!.sceneItemId);
      const indexMap = new Map(returnedItems.map(item => [item.sceneItemId, item]));
      const maxIndex = existing.reduce((max, item) => Math.max(max, item.sceneItemIndex ?? 0), -1);
      const createdIndex = indexMap.get(response.data!.sceneItemId)?.sceneItemIndex ?? maxIndex + 1;
      const nextItems = existing.map(item => {
        const indexed = indexMap.get(item.sceneItemId);
        return indexed ? { ...item, sourceName: indexed.sourceName || item.sourceName, sceneItemIndex: indexed.sceneItemIndex } : item;
      });

      nextItems.push({
        sceneItemId: response.data!.sceneItemId,
        sourceName: response.data!.sourceName,
        inputKind: response.data!.inputKind || "browser_source",
        enabled: true,
        sceneItemIndex: createdIndex,
        transform: createdTransform,
      });

      return withNativeIndexes(nextItems);
    });
    setDraftTransforms(prev => ({
      ...prev,
      [response.data!.sceneItemId]: createdTransform,
    }));
    setSourceSettings(prev => ({
      ...prev,
      [response.data!.sceneItemId]: {
        ...(prev[response.data!.sceneItemId] ?? {}),
        browserUrl: url,
        browserWidth: input.width ?? 800,
        browserHeight: input.height ?? 450,
      },
    }));
    setSelectedItemId(response.data.sceneItemId);
    setSourceCreateStatus({ message: t.streamerStudioCreateBrowserSuccess, isError: false });
  }, [canEdit, selectedSceneName, sourceCreateLoading, streamer.streamerId, t.streamerStudioCreateBrowserFailed, t.streamerStudioCreateBrowserInvalid, t.streamerStudioCreateBrowserSuccess]);

  const updateTextSource = useCallback(async (value: string) => {
    const sceneName = selectedSceneName.trim();
    const text = value.trim();
    if (!selectedServerItem || !sceneName || !canEdit) {
      return;
    }

    if (!text.length || text.length > 500) {
      setTextUpdateStatus({
        message: t.streamerStudioTextSettingsInvalid,
        isError: true,
      });
      return;
    }

    setTextUpdateLoading(true);
    setTextUpdateStatus(null);

    const response = await updateStreamerStudioTextSource(streamer.streamerId, {
      sceneName,
      sceneItemId: selectedServerItem.sceneItemId,
      sourceName: selectedServerItem.sourceName,
      text,
    });

    setTextUpdateLoading(false);

    if (!response.ok || !response.data) {
      setTextUpdateStatus({
        message: response.message || t.streamerStudioTextSettingsFailed,
        isError: true,
      });
      return;
    }

    setSourceSettings(prev => ({
      ...prev,
      [response.data!.sceneItemId]: {
        ...(prev[response.data!.sceneItemId] ?? {}),
        text: response.data!.text,
      },
    }));
    setItems(prev => prev.map(item => (
      item.sceneItemId === response.data!.sceneItemId
        ? {
          ...item,
          sourceName: response.data!.sourceName || item.sourceName,
          inputKind: response.data!.inputKind ?? item.inputKind,
        }
        : item
    )));
    setSelectedItemId(response.data.sceneItemId);
    setTextUpdateStatus({
      message: t.streamerStudioTextSettingsSuccess,
      isError: false,
    });
  }, [
    canEdit,
    selectedSceneName,
    selectedServerItem,
    streamer.streamerId,
    t.streamerStudioTextSettingsFailed,
    t.streamerStudioTextSettingsInvalid,
    t.streamerStudioTextSettingsSuccess,
  ]);

  const updateBrowserSource = useCallback(async (input: { url: string; width: string; height: string }) => {
    const sceneName = selectedSceneName.trim();
    if (!selectedServerItem || !sceneName || !canEdit) {
      return;
    }

    const trimmedUrl = input.url.trim();
    const hasUrl = trimmedUrl.length > 0;
    const hasWidth = input.width.trim().length > 0;
    const hasHeight = input.height.trim().length > 0;

    if (!hasUrl && !hasWidth && !hasHeight) {
      setBrowserUpdateStatus({
        message: t.streamerStudioBrowserSettingsInvalid,
        isError: true,
      });
      return;
    }

    if (hasUrl && (!/^https?:\/\//i.test(trimmedUrl) || trimmedUrl.length > 1000)) {
      setBrowserUpdateStatus({
        message: t.streamerStudioBrowserSettingsInvalid,
        isError: true,
      });
      return;
    }

    const parsedWidth = hasWidth ? Number(input.width) : null;
    const parsedHeight = hasHeight ? Number(input.height) : null;

    if ((hasWidth && !Number.isFinite(parsedWidth)) || (hasHeight && !Number.isFinite(parsedHeight))) {
      setBrowserUpdateStatus({
        message: t.streamerStudioBrowserSettingsInvalid,
        isError: true,
      });
      return;
    }

    const width = parsedWidth === null ? undefined : clampNumber(parsedWidth, 64, 3840);
    const height = parsedHeight === null ? undefined : clampNumber(parsedHeight, 64, 2160);

    setBrowserUpdateLoading(true);
    setBrowserUpdateStatus(null);

    const response = await updateStreamerStudioBrowserSource(streamer.streamerId, {
      sceneName,
      sceneItemId: selectedServerItem.sceneItemId,
      sourceName: selectedServerItem.sourceName,
      url: hasUrl ? trimmedUrl : undefined,
      width,
      height,
    });

    setBrowserUpdateLoading(false);

    if (!response.ok || !response.data) {
      setBrowserUpdateStatus({
        message: response.message || t.streamerStudioBrowserSettingsFailed,
        isError: true,
      });
      return;
    }

    setSourceSettings(prev => ({
      ...prev,
      [response.data!.sceneItemId]: {
        ...(prev[response.data!.sceneItemId] ?? {}),
        ...(response.data!.url !== undefined ? { browserUrl: response.data!.url } : {}),
        ...(response.data!.width !== undefined ? { browserWidth: response.data!.width } : {}),
        ...(response.data!.height !== undefined ? { browserHeight: response.data!.height } : {}),
      },
    }));
    setItems(prev => prev.map(item => (
      item.sceneItemId === response.data!.sceneItemId
        ? {
          ...item,
          sourceName: response.data!.sourceName || item.sourceName,
          inputKind: response.data!.inputKind || item.inputKind,
        }
        : item
    )));
    setSelectedItemId(response.data.sceneItemId);
    setBrowserUpdateStatus({
      message: t.streamerStudioBrowserSettingsSuccess,
      isError: false,
    });
  }, [
    canEdit,
    selectedSceneName,
    selectedServerItem,
    streamer.streamerId,
    t.streamerStudioBrowserSettingsFailed,
    t.streamerStudioBrowserSettingsInvalid,
    t.streamerStudioBrowserSettingsSuccess,
  ]);

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

      {streamer.canManage ? (
        <StreamerTrustedUsersPanel t={t} streamerId={streamer.streamerId} />
      ) : null}

      {canEdit ? (
        <StreamerSourceCreatePanel
          t={t}
          canEdit={canEdit}
          hasSelectedScene={Boolean(selectedSceneName.trim())}
          submitting={sourceCreateLoading}
          feedback={sourceCreateStatus}
          onCreateText={(input) => void createTextSource(input)}
          onCreateBrowser={(input) => void createBrowserSource(input)}
        />
      ) : null}

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
          indexApplyLoading={indexApplyLoading}
          selectedNativeIndex={selectedNativeIndex}
          maxNativeIndex={maxNativeIndex}
          statusMessage={transformStatus?.message ?? null}
          statusError={Boolean(transformStatus?.isError)}
          indexStatusMessage={indexStatus?.message ?? null}
          indexStatusError={Boolean(indexStatus?.isError)}
          lifecycleLoading={lifecycleLoading}
          lifecycleStatusMessage={lifecycleStatus?.message ?? null}
          lifecycleStatusError={Boolean(lifecycleStatus?.isError)}
          sourceSettings={sourceSettings}
          sourceSettingsLoading={sourceSettingsLoading}
          sourceSettingsLoadStatusMessage={sourceSettingsLoadStatus?.message ?? null}
          sourceSettingsLoadStatusError={Boolean(sourceSettingsLoadStatus?.isError)}
          textUpdateLoading={textUpdateLoading}
          textUpdateStatusMessage={textUpdateStatus?.message ?? null}
          textUpdateStatusError={Boolean(textUpdateStatus?.isError)}
          browserUpdateLoading={browserUpdateLoading}
          browserUpdateStatusMessage={browserUpdateStatus?.message ?? null}
          browserUpdateStatusError={Boolean(browserUpdateStatus?.isError)}
          onSelect={setSelectedItemId}
          onUpdateDraftTransform={(patch) => {
            if (!selectedServerItem) {
              return;
            }
            updateDraftTransform(selectedServerItem.sceneItemId, patch);
          }}
          onApply={() => void applySelectedTransform()}
          onReset={resetSelectedDraft}
          onApplyIndex={(targetIndex) => void applySelectedIndex(targetIndex)}
          onSetVisibility={(value: boolean) => { void setSelectedItemVisibility(value); }}
          onRemove={() => { void removeSelectedItem(); }}
          onUpdateTextSource={(value) => { void updateTextSource(value); }}
          onUpdateBrowserSource={(input) => { void updateBrowserSource(input); }}
        />
      </div>
    </div>
  );
}

