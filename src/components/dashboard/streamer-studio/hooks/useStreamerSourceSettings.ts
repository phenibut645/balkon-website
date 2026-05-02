import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { getStreamerStudioSourceSettings, updateStreamerStudioBrowserSource, updateStreamerStudioTextSource } from "@/lib/api";
import { DashboardText } from "@/lib/dashboardText";
import { ObsStudioSceneItemView } from "@/lib/types";
import { BrowserSourceFormInput, SourceSettingsMap, StreamerStudioStatus } from "../types";
import { isEditableStudioSourceKind } from "../utils/sourceKindUtils";
import { hasCachedSourceSettings, mergeSourceSettings } from "../utils/sourceSettingsUtils";
import { clampNumber } from "../utils/transformUtils";

type UseStreamerSourceSettingsOptions = {
  streamerId: number;
  t: DashboardText;
  selectedSceneName: string;
  selectedServerItem: ObsStudioSceneItemView | null;
  canLoadSourceSettings: boolean;
  textUpdateBlockedMessage: string | null;
  browserUpdateBlockedMessage: string | null;
  setItems: Dispatch<SetStateAction<ObsStudioSceneItemView[]>>;
  setSelectedItemId: (sceneItemId: number | null) => void;
};

export function useStreamerSourceSettings({
  streamerId,
  t,
  selectedSceneName,
  selectedServerItem,
  canLoadSourceSettings,
  textUpdateBlockedMessage,
  browserUpdateBlockedMessage,
  setItems,
  setSelectedItemId,
}: UseStreamerSourceSettingsOptions) {
  const sourceSettingsRequestSeqRef = useRef(0);

  const [sourceSettings, setSourceSettings] = useState<SourceSettingsMap>({});
  const [sourceSettingsLoading, setSourceSettingsLoading] = useState(false);
  const [sourceSettingsLoadStatus, setSourceSettingsLoadStatus] = useState<StreamerStudioStatus | null>(null);
  const [textUpdateLoading, setTextUpdateLoading] = useState(false);
  const [browserUpdateLoading, setBrowserUpdateLoading] = useState(false);
  const [textUpdateStatus, setTextUpdateStatus] = useState<StreamerStudioStatus | null>(null);
  const [browserUpdateStatus, setBrowserUpdateStatus] = useState<StreamerStudioStatus | null>(null);

  useEffect(() => {
    const requestId = ++sourceSettingsRequestSeqRef.current;
    const sceneName = selectedSceneName.trim();
    const selectedItem = selectedServerItem;

    if (!canLoadSourceSettings || !sceneName || !selectedItem || !isEditableStudioSourceKind(selectedItem.inputKind)) {
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
      const response = await getStreamerStudioSourceSettings(streamerId, {
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

      const data = response.data;
      setSourceSettings(prev => ({
        ...prev,
        [data.sceneItemId]: mergeSourceSettings(prev[data.sceneItemId], data),
      }));
      setItems(prev => prev.map(item => (
        item.sceneItemId === data.sceneItemId
          ? {
            ...item,
            sourceName: data.sourceName || item.sourceName,
            inputKind: data.inputKind ?? item.inputKind,
          }
          : item
      )));
      setSourceSettingsLoadStatus(null);
    })();
  }, [canLoadSourceSettings, selectedSceneName, selectedServerItem, setItems, sourceSettings, streamerId, t.streamerStudioSourceSettingsLoadFailed, t.streamerStudioSourceSettingsLoading]);

  const updateTextSource = useCallback(async (value: string) => {
    const sceneName = selectedSceneName.trim();
    const text = value.trim();

    if (!selectedServerItem || !sceneName || textUpdateBlockedMessage) {
      if (textUpdateBlockedMessage) {
        setTextUpdateStatus({
          message: textUpdateBlockedMessage,
          isError: true,
        });
      }
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

    const response = await updateStreamerStudioTextSource(streamerId, {
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

    const data = response.data;
    setSourceSettings(prev => ({
      ...prev,
      [data.sceneItemId]: {
        ...(prev[data.sceneItemId] ?? {}),
        text: data.text,
      },
    }));
    setItems(prev => prev.map(item => (
      item.sceneItemId === data.sceneItemId
        ? {
          ...item,
          sourceName: data.sourceName || item.sourceName,
          inputKind: data.inputKind ?? item.inputKind,
        }
        : item
    )));
    setSelectedItemId(data.sceneItemId);
    setTextUpdateStatus({
      message: t.streamerStudioTextSettingsSuccess,
      isError: false,
    });
  }, [selectedSceneName, selectedServerItem, setItems, setSelectedItemId, streamerId, t.streamerStudioTextSettingsFailed, t.streamerStudioTextSettingsInvalid, t.streamerStudioTextSettingsSuccess, textUpdateBlockedMessage]);

  const updateBrowserSource = useCallback(async (input: BrowserSourceFormInput) => {
    const sceneName = selectedSceneName.trim();

    if (!selectedServerItem || !sceneName || browserUpdateBlockedMessage) {
      if (browserUpdateBlockedMessage) {
        setBrowserUpdateStatus({
          message: browserUpdateBlockedMessage,
          isError: true,
        });
      }
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

    const response = await updateStreamerStudioBrowserSource(streamerId, {
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

    const data = response.data;
    setSourceSettings(prev => ({
      ...prev,
      [data.sceneItemId]: {
        ...(prev[data.sceneItemId] ?? {}),
        ...(data.url !== undefined ? { browserUrl: data.url } : {}),
        ...(data.width !== undefined ? { browserWidth: data.width } : {}),
        ...(data.height !== undefined ? { browserHeight: data.height } : {}),
      },
    }));
    setItems(prev => prev.map(item => (
      item.sceneItemId === data.sceneItemId
        ? {
          ...item,
          sourceName: data.sourceName || item.sourceName,
          inputKind: data.inputKind || item.inputKind,
        }
        : item
    )));
    setSelectedItemId(data.sceneItemId);
    setBrowserUpdateStatus({
      message: t.streamerStudioBrowserSettingsSuccess,
      isError: false,
    });
  }, [browserUpdateBlockedMessage, selectedSceneName, selectedServerItem, setItems, setSelectedItemId, streamerId, t.streamerStudioBrowserSettingsFailed, t.streamerStudioBrowserSettingsInvalid, t.streamerStudioBrowserSettingsSuccess]);

  return {
    sourceSettings,
    setSourceSettings,
    sourceSettingsLoading,
    sourceSettingsLoadStatus,
    setSourceSettingsLoadStatus,
    textUpdateLoading,
    textUpdateStatus,
    setTextUpdateStatus,
    browserUpdateLoading,
    browserUpdateStatus,
    setBrowserUpdateStatus,
    updateTextSource,
    updateBrowserSource,
  };
}
