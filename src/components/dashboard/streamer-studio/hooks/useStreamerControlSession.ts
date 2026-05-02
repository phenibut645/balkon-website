import { useEffect, useMemo, useState } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { StreamerStudioAccessView } from "@/lib/types";
import {
  CAPABILITY_BROWSER_CREATE,
  CAPABILITY_BROWSER_UPDATE,
  CAPABILITY_INDEX_SET,
  CAPABILITY_ITEM_REMOVE,
  CAPABILITY_SOURCE_SETTINGS_GET,
  CAPABILITY_TEXT_CREATE,
  CAPABILITY_TEXT_UPDATE,
  CAPABILITY_TRANSFORM_SET,
  CAPABILITY_VISIBILITY_SET,
  getBlockedReason,
  hasKnownCapabilities,
} from "../utils/capabilityUtils";
import { useStreamerLayerControls } from "./useStreamerLayerControls";
import { useStreamerLifecycleControls } from "./useStreamerLifecycleControls";
import { useStreamerSceneItems } from "./useStreamerSceneItems";
import { useStreamerScenes } from "./useStreamerScenes";
import { useStreamerSourceCreation } from "./useStreamerSourceCreation";
import { useStreamerSourceSettings } from "./useStreamerSourceSettings";
import { useStreamerTransforms } from "./useStreamerTransforms";

export function useStreamerControlSession(t: DashboardText, streamer: StreamerStudioAccessView) {
  const [selectedSceneName, setSelectedSceneName] = useState("");

  const sceneItems = useStreamerSceneItems({
    streamerId: streamer.streamerId,
    selectedSceneName,
    loadErrorMessage: t.streamerStudioError,
  });

  const scenes = useStreamerScenes({
    streamerId: streamer.streamerId,
    selectedSceneName,
    setSelectedSceneName,
    loadErrorMessage: t.streamerStudioError,
    loadItems: sceneItems.loadItems,
    clearItems: sceneItems.clearItems,
    skipNextSceneEffect: sceneItems.skipNextSceneEffect,
  });

  const agentStatusText = useMemo(() => {
    if (!streamer.obsAgentConfigured) {
      return t.streamerStudioAgentNotConfigured;
    }
    if (streamer.obsAgentOnline) {
      return t.streamerStudioAgentOnline;
    }
    return t.streamerStudioAgentOffline;
  }, [streamer.obsAgentConfigured, streamer.obsAgentOnline, t.streamerStudioAgentNotConfigured, t.streamerStudioAgentOffline, t.streamerStudioAgentOnline]);

  const canAttemptLoad = streamer.canControl;
  const canEdit = streamer.canControl && Boolean(streamer.obsAgentConfigured) && Boolean(streamer.obsAgentOnline);
  const canApplyTransform = canEdit && !getBlockedReason(t, streamer, CAPABILITY_TRANSFORM_SET, true);
  const canApplyIndex = canEdit && !getBlockedReason(t, streamer, CAPABILITY_INDEX_SET, true);
  const canToggleVisibility = canEdit && !getBlockedReason(t, streamer, CAPABILITY_VISIBILITY_SET, false);
  const canRemoveItem = canEdit && !getBlockedReason(t, streamer, CAPABILITY_ITEM_REMOVE, false);
  const canLoadSourceSettings = canEdit && !getBlockedReason(t, streamer, CAPABILITY_SOURCE_SETTINGS_GET, false);
  const canCreateText = canEdit && !getBlockedReason(t, streamer, CAPABILITY_TEXT_CREATE, true);
  const canCreateBrowser = canEdit && !getBlockedReason(t, streamer, CAPABILITY_BROWSER_CREATE, false);
  const textUpdateBlockedMessage = getBlockedReason(t, streamer, CAPABILITY_TEXT_UPDATE, true);
  const browserUpdateBlockedMessage = getBlockedReason(t, streamer, CAPABILITY_BROWSER_UPDATE, false);
  const createTextBlockedMessage = getBlockedReason(t, streamer, CAPABILITY_TEXT_CREATE, true);
  const createBrowserBlockedMessage = getBlockedReason(t, streamer, CAPABILITY_BROWSER_CREATE, false);
  const diagnosticsWarning = !streamer.obsAgentConfigured
    ? null
    : !hasKnownCapabilities(streamer)
      ? t.streamerStudioCapabilitiesUnknown
      : streamer.obsConnected === false
        ? t.streamerStudioObsNotConnected
        : null;

  const selectedServerItem = useMemo(
    () => (sceneItems.selectedItemId === null ? null : sceneItems.items.find(item => item.sceneItemId === sceneItems.selectedItemId) ?? null),
    [sceneItems.items, sceneItems.selectedItemId],
  );

  const transforms = useStreamerTransforms({
    streamerId: streamer.streamerId,
    t,
    selectedSceneName,
    items: sceneItems.items,
    setItems: sceneItems.setItems,
    selectedServerItem,
    canEdit,
    canApplyTransform,
  });

  const layerControls = useStreamerLayerControls({
    streamerId: streamer.streamerId,
    t,
    selectedSceneName,
    items: sceneItems.items,
    setItems: sceneItems.setItems,
    selectedServerItem,
    setSelectedItemId: sceneItems.setSelectedItemId,
    canApplyIndex,
  });

  const sourceSettings = useStreamerSourceSettings({
    streamerId: streamer.streamerId,
    t,
    selectedSceneName,
    selectedServerItem,
    canLoadSourceSettings,
    textUpdateBlockedMessage,
    browserUpdateBlockedMessage,
    setItems: sceneItems.setItems,
    setSelectedItemId: sceneItems.setSelectedItemId,
  });

  const lifecycle = useStreamerLifecycleControls({
    streamerId: streamer.streamerId,
    t,
    selectedSceneName,
    selectedServerItem,
    lifecycleBusy: false,
    canToggleVisibility,
    canRemoveItem,
    setItems: sceneItems.setItems,
    setDraftTransforms: transforms.setDraftTransforms,
    setSelectedItemId: sceneItems.setSelectedItemId,
  });

  const sourceCreation = useStreamerSourceCreation({
    streamerId: streamer.streamerId,
    t,
    selectedSceneName,
    canCreateText,
    canCreateBrowser,
    setItems: sceneItems.setItems,
    setDraftTransforms: transforms.setDraftTransforms,
    setSourceSettings: sourceSettings.setSourceSettings,
    setSelectedItemId: sceneItems.setSelectedItemId,
  });

  const { setTransformStatus } = transforms;
  const { setIndexStatus } = layerControls;
  const { setLifecycleStatus } = lifecycle;
  const { setTextUpdateStatus, setBrowserUpdateStatus, setSourceSettingsLoadStatus } = sourceSettings;

  const displayedItems = useMemo(
    () => sceneItems.items
      .map(item => ({
        ...item,
        transform: transforms.draftTransforms[item.sceneItemId] ?? item.transform,
      }))
      .slice()
      .reverse(),
    [sceneItems.items, transforms.draftTransforms],
  );

  const loadCurrentItems = async () => {
    const normalized = selectedSceneName.trim();
    if (!normalized) {
      sceneItems.clearItems();
      return;
    }

    if (transforms.hasDirtyChanges()) {
      const confirmed = window.confirm(t.streamerStudioDirtyRefreshConfirm);
      if (!confirmed) {
        return;
      }
    }

    await sceneItems.loadItems(normalized);
  };

  useEffect(() => {
    setTransformStatus(null);
    setIndexStatus(null);
    setLifecycleStatus(null);
    setTextUpdateStatus(null);
    setBrowserUpdateStatus(null);
    setSourceSettingsLoadStatus(null);
  }, [sceneItems.selectedItemId, setBrowserUpdateStatus, setIndexStatus, setLifecycleStatus, setSourceSettingsLoadStatus, setTextUpdateStatus, setTransformStatus]);

  return {
    agentStatusText,
    canAttemptLoad,
    canEdit,
    canApplyTransform,
    canApplyIndex,
    canToggleVisibility,
    canRemoveItem,
    canLoadSourceSettings,
    canCreateText,
    canCreateBrowser,
    textUpdateBlockedMessage,
    browserUpdateBlockedMessage,
    createTextBlockedMessage,
    createBrowserBlockedMessage,
    diagnosticsWarning,
    scenes,
    selectedSceneName,
    setSelectedSceneName,
    sceneItems,
    selectedServerItem,
    displayedItems,
    transforms,
    layerControls,
    lifecycle,
    sourceCreation,
    sourceSettings,
    loadCurrentItems,
  };
}
