import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { StreamerStudioAccessView } from "@/lib/types";
import { ObsScenePreview } from "../ObsScenePreview";
import { StreamerSourceCreatePanel } from "../StreamerSourceCreatePanel";
import { StreamerTrustedUsersPanel } from "../StreamerTrustedUsersPanel";
import { AgentDiagnostics } from "./components/AgentDiagnostics";
import { AgentSetupCard } from "./components/AgentSetupCard";
import { SceneToolbar } from "./components/SceneToolbar";
import { StreamerServiceCatalogPanel } from "./components/StreamerServiceCatalogPanel";
import { StreamerServicesPanel } from "./components/StreamerServicesPanel";
import { ObsSceneItemList } from "./ObsSceneItemList";
import { useStreamerControlSession } from "./hooks/useStreamerControlSession";

type StreamerControlSessionProps = {
  t: DashboardText;
  streamer: StreamerStudioAccessView;
  onBalanceRefresh?: () => Promise<void> | void;
  onBack: () => void;
};

type StreamerSessionTab = "obsAgent" | "streamServices" | "trustedUsers" | "obsControl";

function getDefaultSessionTab(streamer: StreamerStudioAccessView, availableTabs: StreamerSessionTab[]): StreamerSessionTab {
  const agentNeedsAttention = streamer.canManage
    && (!streamer.obsAgentConfigured || !streamer.obsAgentOnline || streamer.obsConnected === false);

  if (agentNeedsAttention && availableTabs.includes("obsAgent")) {
    return "obsAgent";
  }

  if (availableTabs.includes("obsControl")) {
    return "obsControl";
  }

  if (availableTabs.includes("streamServices")) {
    return "streamServices";
  }

  return availableTabs[0] ?? "streamServices";
}

export function StreamerControlSession({ t, streamer, onBalanceRefresh, onBack }: StreamerControlSessionProps) {
  const session = useStreamerControlSession(t, streamer);
  const availableTabs = useMemo<Array<{ id: StreamerSessionTab; label: string }>>(() => {
    const tabs: Array<{ id: StreamerSessionTab; label: string }> = [];

    if (streamer.canManage) {
      tabs.push({ id: "obsAgent", label: t.streamerStudioSessionTabObsAgent });
    }

    tabs.push({ id: "streamServices", label: t.streamerStudioSessionTabStreamServices });

    if (streamer.canManage) {
      tabs.push({ id: "trustedUsers", label: t.streamerStudioSessionTabTrustedUsers });
    }

    if (streamer.canControl) {
      tabs.push({ id: "obsControl", label: t.streamerStudioSessionTabObsControl });
    }

    return tabs;
  }, [
    streamer.canControl,
    streamer.canManage,
    t.streamerStudioSessionTabObsAgent,
    t.streamerStudioSessionTabObsControl,
    t.streamerStudioSessionTabStreamServices,
    t.streamerStudioSessionTabTrustedUsers,
  ]);
  const availableTabIds = useMemo(() => availableTabs.map(tab => tab.id), [availableTabs]);
  const defaultActiveTab = useMemo(
    () => getDefaultSessionTab(streamer, availableTabIds),
    [availableTabIds, streamer],
  );
  const [activeTab, setActiveTab] = useState<StreamerSessionTab>(defaultActiveTab);
  const previousStreamerIdRef = useRef(streamer.streamerId);

  useEffect(() => {
    const streamerChanged = previousStreamerIdRef.current !== streamer.streamerId;
    previousStreamerIdRef.current = streamer.streamerId;

    setActiveTab(current => {
      if (streamerChanged || !availableTabIds.includes(current)) {
        return defaultActiveTab;
      }
      return current;
    });
  }, [availableTabIds, defaultActiveTab, streamer.streamerId]);

  return (
    <div className="streamer-control-session">
      <div className="streamer-session-header">
        <div className="streamer-session-header-main">
          <h2 className="section-title streamer-session-title">{streamer.nickname}</h2>
          <AgentDiagnostics t={t} streamer={streamer} agentStatusText={session.agentStatusText} />
        </div>
        <button className="pagination-btn ghost streamer-session-back" type="button" onClick={onBack}>
          {t.streamerStudioBack}
        </button>
      </div>

      {!streamer.obsAgentConfigured ? (
        <p className="state-text state-error">{t.streamerStudioAgentNotConfigured}</p>
      ) : null}
      {streamer.obsAgentConfigured && !streamer.obsAgentOnline ? (
        <p className="state-text">{t.streamerStudioAgentOffline}</p>
      ) : null}
      {session.diagnosticsWarning ? <p className="state-text state-error">{session.diagnosticsWarning}</p> : null}
      {session.scenes.scenesError ? <p className="state-text state-error">{session.scenes.scenesError}</p> : null}

      <div className="dashboard-subtabs streamer-session-tabs" role="tablist" aria-label={t.tabStreamerStudio}>
        {availableTabs.map(tab => (
          <button
            key={tab.id}
            id={`streamer-session-tab-${tab.id}`}
            type="button"
            className={`dashboard-subtab-chip ${activeTab === tab.id ? "active" : ""}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`streamer-session-tabpanel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {streamer.canManage ? (
        <div
          id="streamer-session-tabpanel-obsAgent"
          className="streamer-session-tab-panel"
          role="tabpanel"
          aria-labelledby="streamer-session-tab-obsAgent"
          hidden={activeTab !== "obsAgent"}
        >
          <AgentSetupCard t={t} streamer={streamer} />
        </div>
      ) : null}

      <div
        id="streamer-session-tabpanel-streamServices"
        className="streamer-session-tab-panel"
        role="tabpanel"
        aria-labelledby="streamer-session-tab-streamServices"
        hidden={activeTab !== "streamServices"}
      >
        <StreamerServiceCatalogPanel
          t={t}
          streamerId={streamer.streamerId}
          onPurchaseSuccess={onBalanceRefresh}
        />

        {streamer.canManage ? (
          <StreamerServicesPanel t={t} streamerId={streamer.streamerId} />
        ) : null}
      </div>

      {streamer.canManage ? (
        <div
          id="streamer-session-tabpanel-trustedUsers"
          className="streamer-session-tab-panel"
          role="tabpanel"
          aria-labelledby="streamer-session-tab-trustedUsers"
          hidden={activeTab !== "trustedUsers"}
        >
          <StreamerTrustedUsersPanel t={t} streamerId={streamer.streamerId} />
        </div>
      ) : null}

      {streamer.canControl ? (
        <div
          id="streamer-session-tabpanel-obsControl"
          className="streamer-session-tab-panel"
          role="tabpanel"
          aria-labelledby="streamer-session-tab-obsControl"
          hidden={activeTab !== "obsControl"}
        >
          {session.canEdit ? (
            <StreamerSourceCreatePanel
              t={t}
              canEdit={session.canEdit}
              canCreateText={session.canCreateText}
              canCreateBrowser={session.canCreateBrowser}
              hasSelectedScene={Boolean(session.selectedSceneName.trim())}
              submitting={session.sourceCreation.sourceCreateLoading}
              feedback={session.sourceCreation.sourceCreateStatus}
              createTextBlockedMessage={session.createTextBlockedMessage}
              createBrowserBlockedMessage={session.createBrowserBlockedMessage}
              onCreateText={(input) => void session.sourceCreation.createTextSource(input)}
              onCreateBrowser={(input) => void session.sourceCreation.createBrowserSource(input)}
            />
          ) : null}

          <div className="session-actions streamer-obs-control-actions">
            <button
              className="pagination-btn"
              type="button"
              onClick={() => void session.scenes.loadScenesAndItems()}
              disabled={!session.canAttemptLoad || session.scenes.scenesLoading}
              title={!session.canAttemptLoad ? t.streamerStudioForbiddenHint : undefined}
            >
              {t.streamerStudioRefreshScenes}
            </button>
            <button
              className="pagination-btn"
              type="button"
              onClick={() => void session.loadCurrentItems()}
              disabled={!session.canAttemptLoad || !session.selectedSceneName.trim() || session.sceneItems.itemsLoading}
              title={!session.canAttemptLoad ? t.streamerStudioForbiddenHint : undefined}
            >
              {t.streamerStudioRefreshItems}
            </button>
          </div>

          <SceneToolbar
            t={t}
            scenes={session.scenes.scenes}
            selectedSceneName={session.selectedSceneName}
            currentSceneName={session.scenes.currentSceneName}
            scenesLoading={session.scenes.scenesLoading}
            onSelectScene={session.setSelectedSceneName}
          />

          {session.sceneItems.itemsError ? <p className="state-text state-error">{session.sceneItems.itemsError}</p> : null}
          {session.sceneItems.itemsLoading ? <p className="state-text">{t.streamerStudioLoadingItems}</p> : null}

          <div className="streamer-studio-session-grid">
            <ObsScenePreview
              t={t}
              items={session.displayedItems}
              selectedItemId={session.sceneItems.selectedItemId}
              canEdit={session.canEdit}
              dirtyItemId={session.transforms.dirtyItemId}
              onSelectItem={session.sceneItems.setSelectedItemId}
              onMoveSelected={session.transforms.moveSelectedDraft}
            />
            <ObsSceneItemList
              t={t}
              items={session.displayedItems}
              selectedItemId={session.sceneItems.selectedItemId}
              selectedDraftTransform={session.transforms.selectedDraftTransform}
              dirtySelected={session.transforms.dirtySelected}
              canEdit={session.canEdit}
              canApplyTransform={session.canApplyTransform}
              applyLoading={session.transforms.applyLoading}
              canApplyIndex={session.canApplyIndex}
              indexApplyLoading={session.layerControls.indexApplyLoading}
              selectedNativeIndex={session.layerControls.selectedNativeIndex}
              maxNativeIndex={session.layerControls.maxNativeIndex}
              statusMessage={session.transforms.transformStatus?.message ?? null}
              statusError={Boolean(session.transforms.transformStatus?.isError)}
              indexStatusMessage={session.layerControls.indexStatus?.message ?? null}
              indexStatusError={Boolean(session.layerControls.indexStatus?.isError)}
              lifecycleLoading={session.lifecycle.lifecycleLoading}
              lifecycleStatusMessage={session.lifecycle.lifecycleStatus?.message ?? null}
              lifecycleStatusError={Boolean(session.lifecycle.lifecycleStatus?.isError)}
              canToggleVisibility={session.canToggleVisibility}
              canRemoveItem={session.canRemoveItem}
              sourceSettings={session.sourceSettings.sourceSettings}
              canLoadSourceSettings={session.canLoadSourceSettings}
              sourceSettingsLoading={session.sourceSettings.sourceSettingsLoading}
              sourceSettingsLoadStatusMessage={session.sourceSettings.sourceSettingsLoadStatus?.message ?? null}
              sourceSettingsLoadStatusError={Boolean(session.sourceSettings.sourceSettingsLoadStatus?.isError)}
              textUpdateBlockedMessage={session.textUpdateBlockedMessage}
              textUpdateLoading={session.sourceSettings.textUpdateLoading}
              textUpdateStatusMessage={session.sourceSettings.textUpdateStatus?.message ?? null}
              textUpdateStatusError={Boolean(session.sourceSettings.textUpdateStatus?.isError)}
              browserUpdateBlockedMessage={session.browserUpdateBlockedMessage}
              browserUpdateLoading={session.sourceSettings.browserUpdateLoading}
              browserUpdateStatusMessage={session.sourceSettings.browserUpdateStatus?.message ?? null}
              browserUpdateStatusError={Boolean(session.sourceSettings.browserUpdateStatus?.isError)}
              onSelect={session.sceneItems.setSelectedItemId}
              onUpdateDraftTransform={(patch) => {
                if (!session.selectedServerItem) {
                  return;
                }
                session.transforms.updateDraftTransform(session.selectedServerItem.sceneItemId, patch);
              }}
              onApply={() => void session.transforms.applySelectedTransform()}
              onReset={session.transforms.resetSelectedDraft}
              onApplyIndex={(targetIndex) => void session.layerControls.applySelectedIndex(targetIndex)}
              onSetVisibility={(value: boolean) => { void session.lifecycle.setSelectedItemVisibility(value); }}
              onRemove={() => { void session.lifecycle.removeSelectedItem(); }}
              onUpdateTextSource={(value) => { void session.sourceSettings.updateTextSource(value); }}
              onUpdateBrowserSource={(input) => { void session.sourceSettings.updateBrowserSource(input); }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
