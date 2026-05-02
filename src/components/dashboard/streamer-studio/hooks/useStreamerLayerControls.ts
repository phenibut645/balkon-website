import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";
import { applyStreamerStudioSceneItemIndex } from "@/lib/api";
import { DashboardText } from "@/lib/dashboardText";
import { ObsStudioSceneItemView } from "@/lib/types";
import { StreamerStudioStatus } from "../types";
import { withNativeIndexes } from "../utils/sceneItemUtils";

type UseStreamerLayerControlsOptions = {
  streamerId: number;
  t: DashboardText;
  selectedSceneName: string;
  items: ObsStudioSceneItemView[];
  setItems: Dispatch<SetStateAction<ObsStudioSceneItemView[]>>;
  selectedServerItem: ObsStudioSceneItemView | null;
  setSelectedItemId: (sceneItemId: number | null) => void;
  canApplyIndex: boolean;
};

export function useStreamerLayerControls({
  streamerId,
  t,
  selectedSceneName,
  items,
  setItems,
  selectedServerItem,
  setSelectedItemId,
  canApplyIndex,
}: UseStreamerLayerControlsOptions) {
  const [indexApplyLoading, setIndexApplyLoading] = useState(false);
  const [indexStatus, setIndexStatus] = useState<StreamerStudioStatus | null>(null);

  const selectedNativeIndex = selectedServerItem?.sceneItemIndex ?? null;
  const maxNativeIndex = useMemo(() => (items.length > 0 ? items.length - 1 : 0), [items.length]);

  const applySelectedIndex = useCallback(async (targetIndex: number) => {
    if (!selectedServerItem || !canApplyIndex || !selectedSceneName.trim() || indexApplyLoading) {
      return;
    }

    setIndexApplyLoading(true);
    setIndexStatus(null);

    const response = await applyStreamerStudioSceneItemIndex(streamerId, {
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

    const data = response.data;
    const returnedItems = data.items || [];
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
        item.sceneItemId === data.sceneItemId
          ? {
            ...item,
            sourceName: data.sourceName || item.sourceName,
            sceneItemIndex: data.sceneItemIndex,
            enabled: item.enabled,
          }
          : item
      )));
    });
    setSelectedItemId(data.sceneItemId);
    setIndexApplyLoading(false);
    setIndexStatus({
      message: t.streamerStudioLayerApplied,
      isError: false,
    });
  }, [canApplyIndex, indexApplyLoading, selectedSceneName, selectedServerItem, setItems, setSelectedItemId, streamerId, t.streamerStudioLayerApplied, t.streamerStudioLayerApplyFailed]);

  return {
    selectedNativeIndex,
    maxNativeIndex,
    indexApplyLoading,
    indexStatus,
    setIndexStatus,
    applySelectedIndex,
  };
}
