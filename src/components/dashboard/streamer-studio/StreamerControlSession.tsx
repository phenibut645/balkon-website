import { DashboardText } from "@/lib/dashboardText";
import { StreamerStudioAccessView } from "@/lib/types";
import { ObsScenePreview } from "../ObsScenePreview";
import { StreamerSourceCreatePanel } from "../StreamerSourceCreatePanel";
import { StreamerTrustedUsersPanel } from "../StreamerTrustedUsersPanel";
import { AgentDiagnostics } from "./components/AgentDiagnostics";
import { AgentSetupCard } from "./components/AgentSetupCard";
import { SceneToolbar } from "./components/SceneToolbar";
import { ObsSceneItemList } from "./ObsSceneItemList";
import { useStreamerControlSession } from "./hooks/useStreamerControlSession";

type StreamerControlSessionProps = {
  t: DashboardText;
  streamer: StreamerStudioAccessView;
  onBack: () => void;
};

export function StreamerControlSession({ t, streamer, onBack }: StreamerControlSessionProps) {
  const session = useStreamerControlSession(t, streamer);

  return (
    <div className="streamer-control-session">
      <div className="inventory-toolbar">
        <div className="session-head">
          <button className="pagination-btn ghost" type="button" onClick={onBack}>
            {t.streamerStudioBack}
          </button>
          <AgentDiagnostics t={t} streamer={streamer} agentStatusText={session.agentStatusText} />
        </div>

        <div className="session-actions">
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
      </div>

      {!streamer.obsAgentConfigured ? (
        <p className="state-text state-error">{t.streamerStudioAgentNotConfigured}</p>
      ) : null}
      {streamer.obsAgentConfigured && !streamer.obsAgentOnline ? (
        <p className="state-text">{t.streamerStudioAgentOffline}</p>
      ) : null}
      {session.diagnosticsWarning ? <p className="state-text state-error">{session.diagnosticsWarning}</p> : null}
      {session.scenes.scenesError ? <p className="state-text state-error">{session.scenes.scenesError}</p> : null}

      {streamer.canManage ? (
        <AgentSetupCard t={t} streamer={streamer} />
      ) : null}

      {streamer.canManage ? (
        <StreamerTrustedUsersPanel t={t} streamerId={streamer.streamerId} />
      ) : null}

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
  );
}
