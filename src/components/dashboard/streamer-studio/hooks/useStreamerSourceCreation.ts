import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { createStreamerStudioBrowserSource, createStreamerStudioTextSource } from "@/lib/api";
import { DashboardText } from "@/lib/dashboardText";
import { ObsStudioBrowserSourceCreateInput, ObsStudioSceneItemView, ObsStudioTextSourceCreateInput } from "@/lib/types";
import { DraftTransformsMap, SourceSettingsMap, StreamerStudioStatus } from "../types";
import { withNativeIndexes } from "../utils/sceneItemUtils";
import { normalizeTransform } from "../utils/transformUtils";

type UseStreamerSourceCreationOptions = {
  streamerId: number;
  t: DashboardText;
  selectedSceneName: string;
  canCreateText: boolean;
  canCreateBrowser: boolean;
  setItems: Dispatch<SetStateAction<ObsStudioSceneItemView[]>>;
  setDraftTransforms: Dispatch<SetStateAction<DraftTransformsMap>>;
  setSourceSettings: Dispatch<SetStateAction<SourceSettingsMap>>;
  setSelectedItemId: (sceneItemId: number | null) => void;
};

export function useStreamerSourceCreation({
  streamerId,
  t,
  selectedSceneName,
  canCreateText,
  canCreateBrowser,
  setItems,
  setDraftTransforms,
  setSourceSettings,
  setSelectedItemId,
}: UseStreamerSourceCreationOptions) {
  const [sourceCreateLoading, setSourceCreateLoading] = useState(false);
  const [sourceCreateStatus, setSourceCreateStatus] = useState<StreamerStudioStatus | null>(null);

  const createTextSource = useCallback(async (input: ObsStudioTextSourceCreateInput) => {
    const sceneName = selectedSceneName.trim();
    if (!sceneName || !canCreateText || sourceCreateLoading) {
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

    const response = await createStreamerStudioTextSource(streamerId, {
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

    const data = response.data;
    const createdTransform = normalizeTransform(data.transform);
    const returnedItems = data.items || [];
    setItems(prev => {
      const existing = prev.filter(item => item.sceneItemId !== data.sceneItemId);
      const indexMap = new Map(returnedItems.map(item => [item.sceneItemId, item]));
      const maxIndex = existing.reduce((max, item) => Math.max(max, item.sceneItemIndex ?? 0), -1);
      const createdIndex = indexMap.get(data.sceneItemId)?.sceneItemIndex ?? maxIndex + 1;
      const nextItems = existing.map(item => {
        const indexed = indexMap.get(item.sceneItemId);
        return indexed ? { ...item, sourceName: indexed.sourceName || item.sourceName, sceneItemIndex: indexed.sceneItemIndex } : item;
      });

      nextItems.push({
        sceneItemId: data.sceneItemId,
        sourceName: data.sourceName,
        inputKind: data.inputKind || null,
        enabled: true,
        sceneItemIndex: createdIndex,
        transform: createdTransform,
      });

      return withNativeIndexes(nextItems);
    });
    setDraftTransforms(prev => ({
      ...prev,
      [data.sceneItemId]: createdTransform,
    }));
    setSourceSettings(prev => ({
      ...prev,
      [data.sceneItemId]: {
        ...(prev[data.sceneItemId] ?? {}),
        text,
      },
    }));
    setSelectedItemId(data.sceneItemId);
    setSourceCreateStatus({ message: t.streamerStudioCreateTextSuccess, isError: false });
  }, [canCreateText, selectedSceneName, setDraftTransforms, setItems, setSelectedItemId, setSourceSettings, sourceCreateLoading, streamerId, t.streamerStudioCreateTextFailed, t.streamerStudioCreateTextInvalid, t.streamerStudioCreateTextSuccess]);

  const createBrowserSource = useCallback(async (input: ObsStudioBrowserSourceCreateInput) => {
    const sceneName = selectedSceneName.trim();
    if (!sceneName || !canCreateBrowser || sourceCreateLoading) {
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

    const response = await createStreamerStudioBrowserSource(streamerId, {
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

    const data = response.data;
    const createdTransform = normalizeTransform(data.transform);
    const returnedItems = data.items || [];
    setItems(prev => {
      const existing = prev.filter(item => item.sceneItemId !== data.sceneItemId);
      const indexMap = new Map(returnedItems.map(item => [item.sceneItemId, item]));
      const maxIndex = existing.reduce((max, item) => Math.max(max, item.sceneItemIndex ?? 0), -1);
      const createdIndex = indexMap.get(data.sceneItemId)?.sceneItemIndex ?? maxIndex + 1;
      const nextItems = existing.map(item => {
        const indexed = indexMap.get(item.sceneItemId);
        return indexed ? { ...item, sourceName: indexed.sourceName || item.sourceName, sceneItemIndex: indexed.sceneItemIndex } : item;
      });

      nextItems.push({
        sceneItemId: data.sceneItemId,
        sourceName: data.sourceName,
        inputKind: data.inputKind || "browser_source",
        enabled: true,
        sceneItemIndex: createdIndex,
        transform: createdTransform,
      });

      return withNativeIndexes(nextItems);
    });
    setDraftTransforms(prev => ({
      ...prev,
      [data.sceneItemId]: createdTransform,
    }));
    setSourceSettings(prev => ({
      ...prev,
      [data.sceneItemId]: {
        ...(prev[data.sceneItemId] ?? {}),
        browserUrl: url,
        browserWidth: input.width ?? 800,
        browserHeight: input.height ?? 450,
      },
    }));
    setSelectedItemId(data.sceneItemId);
    setSourceCreateStatus({ message: t.streamerStudioCreateBrowserSuccess, isError: false });
  }, [canCreateBrowser, selectedSceneName, setDraftTransforms, setItems, setSelectedItemId, setSourceSettings, sourceCreateLoading, streamerId, t.streamerStudioCreateBrowserFailed, t.streamerStudioCreateBrowserInvalid, t.streamerStudioCreateBrowserSuccess]);

  return {
    sourceCreateLoading,
    sourceCreateStatus,
    createTextSource,
    createBrowserSource,
  };
}
