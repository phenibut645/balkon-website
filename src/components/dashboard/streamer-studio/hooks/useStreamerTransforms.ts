import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { applyStreamerStudioSceneItemTransform } from "@/lib/api";
import { DashboardText } from "@/lib/dashboardText";
import { ObsStudioSceneItemTransform, ObsStudioSceneItemView } from "@/lib/types";
import { DraftTransformsMap, StreamerStudioStatus } from "../types";
import { buildDraftMap, normalizeTransform, transformsEqual } from "../utils/transformUtils";

type UseStreamerTransformsOptions = {
  streamerId: number;
  t: DashboardText;
  selectedSceneName: string;
  items: ObsStudioSceneItemView[];
  setItems: Dispatch<SetStateAction<ObsStudioSceneItemView[]>>;
  selectedServerItem: ObsStudioSceneItemView | null;
  canEdit: boolean;
  canApplyTransform: boolean;
};

export function useStreamerTransforms({
  streamerId,
  t,
  selectedSceneName,
  items,
  setItems,
  selectedServerItem,
  canEdit,
  canApplyTransform,
}: UseStreamerTransformsOptions) {
  const [draftTransforms, setDraftTransforms] = useState<DraftTransformsMap>({});
  const [applyLoading, setApplyLoading] = useState(false);
  const [transformStatus, setTransformStatus] = useState<StreamerStudioStatus | null>(null);

  useEffect(() => {
    setDraftTransforms(buildDraftMap(items));
  }, [items]);

  const selectedDraftTransform = useMemo(
    () => (selectedServerItem ? draftTransforms[selectedServerItem.sceneItemId] ?? normalizeTransform(selectedServerItem.transform) : null),
    [draftTransforms, selectedServerItem],
  );

  const dirtySelected = Boolean(selectedServerItem && selectedDraftTransform && !transformsEqual(selectedServerItem.transform, selectedDraftTransform));
  const dirtyItemId = dirtySelected && selectedServerItem ? selectedServerItem.sceneItemId : null;

  const hasDirtyChanges = useCallback(() => items.some(item => {
    const draft = draftTransforms[item.sceneItemId];
    return draft ? !transformsEqual(item.transform, draft) : false;
  }), [draftTransforms, items]);

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
    if (!selectedServerItem || !selectedDraftTransform || !canApplyTransform || !selectedSceneName.trim()) {
      return;
    }
    setApplyLoading(true);
    setTransformStatus(null);

    const response = await applyStreamerStudioSceneItemTransform(streamerId, {
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

    const data = response.data;
    const normalized = normalizeTransform(data.transform);
    setItems(prev => prev.map(item => (
      item.sceneItemId === data.sceneItemId
        ? { ...item, transform: normalized, sourceName: data.sourceName || item.sourceName }
        : item
    )));
    setDraftTransforms(prev => ({
      ...prev,
      [data.sceneItemId]: normalized,
    }));
    setApplyLoading(false);
    setTransformStatus({
      message: t.streamerStudioTransformApplied,
      isError: false,
    });
  }, [canApplyTransform, selectedDraftTransform, selectedSceneName, selectedServerItem, setItems, streamerId, t.streamerStudioTransformApplyFailed, t.streamerStudioTransformApplied]);

  return {
    draftTransforms,
    setDraftTransforms,
    selectedDraftTransform,
    dirtySelected,
    dirtyItemId,
    applyLoading,
    transformStatus,
    setTransformStatus,
    hasDirtyChanges,
    updateDraftTransform,
    moveSelectedDraft,
    resetSelectedDraft,
    applySelectedTransform,
  };
}
