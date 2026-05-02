import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { removeStreamerStudioSceneItem, setStreamerStudioSceneItemVisibility } from "@/lib/api";
import { DashboardText } from "@/lib/dashboardText";
import { ObsStudioSceneItemRemoveResult, ObsStudioSceneItemView } from "@/lib/types";
import { DraftTransformsMap, StreamerStudioStatus } from "../types";
import { withNativeIndexes } from "../utils/sceneItemUtils";

type UseStreamerLifecycleControlsOptions = {
  streamerId: number;
  t: DashboardText;
  selectedSceneName: string;
  selectedServerItem: ObsStudioSceneItemView | null;
  lifecycleBusy: boolean;
  canToggleVisibility: boolean;
  canRemoveItem: boolean;
  setItems: Dispatch<SetStateAction<ObsStudioSceneItemView[]>>;
  setDraftTransforms: Dispatch<SetStateAction<DraftTransformsMap>>;
  setSelectedItemId: (sceneItemId: number | null) => void;
};

export function useStreamerLifecycleControls({
  streamerId,
  t,
  selectedSceneName,
  selectedServerItem,
  lifecycleBusy,
  canToggleVisibility,
  canRemoveItem,
  setItems,
  setDraftTransforms,
  setSelectedItemId,
}: UseStreamerLifecycleControlsOptions) {
  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [lifecycleStatus, setLifecycleStatus] = useState<StreamerStudioStatus | null>(null);

  const busy = lifecycleBusy || lifecycleLoading;

  const setSelectedItemVisibility = useCallback(async (enabled: boolean) => {
    const sceneName = selectedSceneName.trim();
    if (!selectedServerItem || !sceneName || !canToggleVisibility || busy) {
      return;
    }

    setLifecycleLoading(true);
    setLifecycleStatus(null);

    const response = await setStreamerStudioSceneItemVisibility(streamerId, {
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
  }, [busy, canToggleVisibility, selectedSceneName, selectedServerItem, setItems, setSelectedItemId, streamerId, t.streamerStudioVisibilityApplied, t.streamerStudioVisibilityApplyFailed]);

  const removeSelectedItem = useCallback(async () => {
    const sceneName = selectedSceneName.trim();
    if (!selectedServerItem || !sceneName || !canRemoveItem || busy) {
      return;
    }

    const confirmed = window.confirm(t.streamerStudioRemoveConfirm);
    if (!confirmed) {
      return;
    }

    setLifecycleLoading(true);
    setLifecycleStatus(null);

    const response = await removeStreamerStudioSceneItem(streamerId, {
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

    const data = response.data;
    const removedId = data.sceneItemId;
    const returnedItems: ObsStudioSceneItemRemoveResult["items"] = data.items ?? [];
    let nextSelectedId: number | null = null;

    setItems(prev => {
      const filtered = prev.filter(item => item.sceneItemId !== removedId);
      if (returnedItems.length > 0) {
        const indexMap = new Map(returnedItems.map((item: typeof returnedItems[number]) => [item.sceneItemId, item]));
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
  }, [busy, canRemoveItem, selectedSceneName, selectedServerItem, setDraftTransforms, setItems, setSelectedItemId, streamerId, t.streamerStudioRemoveApplied, t.streamerStudioRemoveConfirm, t.streamerStudioRemoveFailed]);

  return {
    lifecycleLoading,
    lifecycleStatus,
    setLifecycleStatus,
    setSelectedItemVisibility,
    removeSelectedItem,
  };
}
