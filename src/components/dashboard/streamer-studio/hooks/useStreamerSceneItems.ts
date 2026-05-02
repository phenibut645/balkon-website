import { useCallback, useEffect, useRef, useState } from "react";
import { listStreamerStudioSceneItems } from "@/lib/api";
import { ObsStudioSceneItemView } from "@/lib/types";
import { pickPreferredSceneItemId, withNativeIndexes } from "../utils/sceneItemUtils";

type UseStreamerSceneItemsOptions = {
  streamerId: number;
  selectedSceneName: string;
  loadErrorMessage: string;
};

export function useStreamerSceneItems({
  streamerId,
  selectedSceneName,
  loadErrorMessage,
}: UseStreamerSceneItemsOptions) {
  const itemsRequestSeqRef = useRef(0);
  const skipNextSceneEffectRef = useRef<string | null>(null);

  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [items, setItems] = useState<ObsStudioSceneItemView[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  const clearItems = useCallback(() => {
    setItems([]);
    setSelectedItemId(null);
    setItemsError(null);
    setItemsLoading(false);
  }, []);

  const loadItems = useCallback(async (sceneName: string) => {
    const normalized = sceneName.trim();
    const requestId = ++itemsRequestSeqRef.current;

    if (!normalized) {
      clearItems();
      return;
    }

    setItemsLoading(true);
    setItemsError(null);

    const response = await listStreamerStudioSceneItems(streamerId, normalized);
    if (requestId !== itemsRequestSeqRef.current) {
      return;
    }

    if (response.ok && response.data) {
      const nextItems = withNativeIndexes(response.data.items || []);
      setItems(nextItems);
      setSelectedItemId(prev => pickPreferredSceneItemId(nextItems, prev));
      setItemsLoading(false);
      return;
    }

    setItems([]);
    setSelectedItemId(null);
    setItemsLoading(false);
    setItemsError(response.message || response.error || loadErrorMessage);
  }, [clearItems, loadErrorMessage, streamerId]);

  const skipNextSceneEffect = useCallback((sceneName: string) => {
    skipNextSceneEffectRef.current = sceneName;
  }, []);

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

  return {
    items,
    setItems,
    itemsLoading,
    itemsError,
    setItemsError,
    selectedItemId,
    setSelectedItemId,
    clearItems,
    loadItems,
    skipNextSceneEffect,
  };
}
