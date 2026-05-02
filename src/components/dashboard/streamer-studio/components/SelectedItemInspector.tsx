import { Dispatch, SetStateAction } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { ObsStudioSceneItemTransform, ObsStudioSceneItemView } from "@/lib/types";
import { SourceSettingsEditor } from "./SourceSettingsEditor";
import { TransformEditor } from "./TransformEditor";
import { LayerControls } from "./LayerControls";
import { LifecycleControls } from "./LifecycleControls";
import { getTypeLabel, isRecommendedItem } from "../utils/sceneItemUtils";

type SelectedItemInspectorProps = {
  t: DashboardText;
  selectedItem: ObsStudioSceneItemView | null;
  selectedDraftTransform: ObsStudioSceneItemTransform | null;
  dirtySelected: boolean;
  canEdit: boolean;
  canApplyTransform: boolean;
  applyLoading: boolean;
  canMoveLayerUp: boolean;
  canMoveLayerDown: boolean;
  selectedNativeIndex: number | null;
  maxNativeIndex: number;
  indexStatusMessage: string | null;
  indexStatusError: boolean;
  lifecycleStatusMessage: string | null;
  lifecycleStatusError: boolean;
  canToggleSelectedVisibility: boolean;
  canRemoveSelectedItem: boolean;
  canEditText: boolean;
  canEditBrowser: boolean;
  canLoadSourceSettings: boolean;
  sourceSettingsLoading: boolean;
  sourceSettingsLoadStatusMessage: string | null;
  sourceSettingsLoadStatusError: boolean;
  textUpdateBlockedMessage: string | null;
  textUpdateLoading: boolean;
  textUpdateStatusMessage: string | null;
  textUpdateStatusError: boolean;
  browserUpdateBlockedMessage: string | null;
  browserUpdateLoading: boolean;
  browserUpdateStatusMessage: string | null;
  browserUpdateStatusError: boolean;
  textValue: string;
  setTextValue: Dispatch<SetStateAction<string>>;
  browserUrlValue: string;
  setBrowserUrlValue: Dispatch<SetStateAction<string>>;
  browserWidthValue: string;
  setBrowserWidthValue: Dispatch<SetStateAction<string>>;
  browserHeightValue: string;
  setBrowserHeightValue: Dispatch<SetStateAction<string>>;
  statusMessage: string | null;
  statusError: boolean;
  onUpdateField: (raw: string, min: number, max: number, field: keyof ObsStudioSceneItemTransform) => void;
  onApply: () => void;
  onReset: () => void;
  onApplyIndex: (targetIndex: number) => void;
  onSetVisibility: (enabled: boolean) => void;
  onRemove: () => void;
  onUpdateTextSource: (value: string) => void;
  onUpdateBrowserSource: (input: { url: string; width: string; height: string }) => void;
};

export function SelectedItemInspector({
  t,
  selectedItem,
  selectedDraftTransform,
  dirtySelected,
  canEdit,
  canApplyTransform,
  applyLoading,
  canMoveLayerUp,
  canMoveLayerDown,
  selectedNativeIndex,
  maxNativeIndex,
  indexStatusMessage,
  indexStatusError,
  lifecycleStatusMessage,
  lifecycleStatusError,
  canToggleSelectedVisibility,
  canRemoveSelectedItem,
  canEditText,
  canEditBrowser,
  canLoadSourceSettings,
  sourceSettingsLoading,
  sourceSettingsLoadStatusMessage,
  sourceSettingsLoadStatusError,
  textUpdateBlockedMessage,
  textUpdateLoading,
  textUpdateStatusMessage,
  textUpdateStatusError,
  browserUpdateBlockedMessage,
  browserUpdateLoading,
  browserUpdateStatusMessage,
  browserUpdateStatusError,
  textValue,
  setTextValue,
  browserUrlValue,
  setBrowserUrlValue,
  browserWidthValue,
  setBrowserWidthValue,
  browserHeightValue,
  setBrowserHeightValue,
  statusMessage,
  statusError,
  onUpdateField,
  onApply,
  onReset,
  onApplyIndex,
  onSetVisibility,
  onRemove,
  onUpdateTextSource,
  onUpdateBrowserSource,
}: SelectedItemInspectorProps) {
  if (!selectedItem || !selectedDraftTransform) {
    return (
      <div className="streamer-transform-editor">
        <p className="state-text state-empty">{t.noItemSelected}</p>
        {lifecycleStatusMessage ? (
          <p className={`streamer-lifecycle-status ${lifecycleStatusError ? "state-error" : "state-ok"}`} aria-live="polite">
            {lifecycleStatusMessage}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="streamer-transform-editor">
      <div className="obs-scene-selected-head">
        <span className="obs-scene-item-row-name" title={selectedItem.sourceName}>{selectedItem.sourceName}</span>
        <div className="obs-scene-item-row-badges">
          {isRecommendedItem(selectedItem.sourceName) ? (
            <span className="meta-badge neutral">{t.streamerStudioRecommended}</span>
          ) : null}
          <span className={`meta-badge ${selectedItem.enabled ? "ok" : "danger"}`}>
            {selectedItem.enabled ? t.streamerStudioEnabled : t.streamerStudioDisabled}
          </span>
        </div>
      </div>
      <p className="market-card-hint">{getTypeLabel(selectedItem, t)}</p>
      <TransformEditor t={t} transform={selectedDraftTransform} onUpdateField={onUpdateField} />
      <LayerControls
        t={t}
        canMoveLayerUp={canMoveLayerUp}
        canMoveLayerDown={canMoveLayerDown}
        selectedNativeIndex={selectedNativeIndex}
        maxNativeIndex={maxNativeIndex}
        indexStatusMessage={indexStatusMessage}
        indexStatusError={indexStatusError}
        onApplyIndex={onApplyIndex}
      />
      <LifecycleControls
        t={t}
        selectedItem={selectedItem}
        canToggleSelectedVisibility={canToggleSelectedVisibility}
        canRemoveSelectedItem={canRemoveSelectedItem}
        lifecycleStatusMessage={lifecycleStatusMessage}
        lifecycleStatusError={lifecycleStatusError}
        onSetVisibility={onSetVisibility}
        onRemove={onRemove}
      />
      <SourceSettingsEditor
        t={t}
        canEdit={canEdit}
        canEditText={canEditText}
        canEditBrowser={canEditBrowser}
        canLoadSourceSettings={canLoadSourceSettings}
        sourceSettingsLoading={sourceSettingsLoading}
        sourceSettingsLoadStatusMessage={sourceSettingsLoadStatusMessage}
        sourceSettingsLoadStatusError={sourceSettingsLoadStatusError}
        textUpdateBlockedMessage={textUpdateBlockedMessage}
        textUpdateLoading={textUpdateLoading}
        textUpdateStatusMessage={textUpdateStatusMessage}
        textUpdateStatusError={textUpdateStatusError}
        browserUpdateBlockedMessage={browserUpdateBlockedMessage}
        browserUpdateLoading={browserUpdateLoading}
        browserUpdateStatusMessage={browserUpdateStatusMessage}
        browserUpdateStatusError={browserUpdateStatusError}
        textValue={textValue}
        setTextValue={setTextValue}
        browserUrlValue={browserUrlValue}
        setBrowserUrlValue={setBrowserUrlValue}
        browserWidthValue={browserWidthValue}
        setBrowserWidthValue={setBrowserWidthValue}
        browserHeightValue={browserHeightValue}
        setBrowserHeightValue={setBrowserHeightValue}
        onUpdateTextSource={onUpdateTextSource}
        onUpdateBrowserSource={onUpdateBrowserSource}
      />
      <div className="streamer-transform-actions">
        <div className="streamer-transform-action-buttons">
          <button className="pagination-btn" type="button" disabled={!canApplyTransform || !dirtySelected || applyLoading} onClick={onApply}>
            {t.streamerStudioApplyTransform}
          </button>
          <button className="pagination-btn ghost" type="button" disabled={!dirtySelected || applyLoading} onClick={onReset}>
            {t.streamerStudioResetTransform}
          </button>
        </div>
        <div className="streamer-transform-status-stack" aria-live="polite">
          {dirtySelected ? <p className="streamer-transform-status">{t.streamerStudioUnsavedChanges}</p> : <span />}
          {statusMessage ? (
            <p className={`streamer-transform-status ${statusError ? "state-error" : "state-ok"}`}>
              {statusMessage}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
