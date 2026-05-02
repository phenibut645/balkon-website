import { useCallback, useEffect, useRef, useState } from "react";
import { listStreamerStudioScenes } from "@/lib/api";
import { ObsStudioSceneView } from "@/lib/types";

type UseStreamerScenesOptions = {
  streamerId: number;
  selectedSceneName: string;
  setSelectedSceneName: (value: string) => void;
  loadErrorMessage: string;
  loadItems: (sceneName: string) => Promise<void>;
  clearItems: () => void;
  skipNextSceneEffect: (sceneName: string) => void;
};

export function useStreamerScenes({
  streamerId,
  selectedSceneName,
  setSelectedSceneName,
  loadErrorMessage,
  loadItems,
  clearItems,
  skipNextSceneEffect,
}: UseStreamerScenesOptions) {
  const scenesRequestSeqRef = useRef(0);

  const [scenesLoading, setScenesLoading] = useState(false);
  const [scenesError, setScenesError] = useState<string | null>(null);
  const [scenes, setScenes] = useState<ObsStudioSceneView[]>([]);
  const [currentSceneName, setCurrentSceneName] = useState<string | null>(null);

  const loadScenesAndItems = useCallback(async () => {
    setScenesLoading(true);
    setScenesError(null);
    const scenesRequestId = ++scenesRequestSeqRef.current;

    const response = await listStreamerStudioScenes(streamerId);
    if (scenesRequestId !== scenesRequestSeqRef.current) {
      return;
    }

    if (!response.ok || !response.data) {
      setScenes([]);
      setCurrentSceneName(null);
      setSelectedSceneName("");
      clearItems();
      setScenesLoading(false);
      setScenesError(response.message || response.error || loadErrorMessage);
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
      clearItems();
      return;
    }

    skipNextSceneEffect(nextSceneName);
    await loadItems(nextSceneName);
  }, [clearItems, loadErrorMessage, loadItems, selectedSceneName, setSelectedSceneName, skipNextSceneEffect, streamerId]);

  useEffect(() => {
    void loadScenesAndItems();
  }, [loadScenesAndItems, streamerId]);

  return {
    scenes,
    currentSceneName,
    scenesLoading,
    scenesError,
    loadScenesAndItems,
  };
}
