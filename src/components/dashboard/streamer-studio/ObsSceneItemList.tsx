import { useEffect, useState } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { ObsStudioSceneItemTransform, ObsStudioSceneItemView } from "@/lib/types";
import { SelectedItemInspector } from "./components/SelectedItemInspector";
import { SceneItemRows } from "./components/SceneItemRows";
import { SourceSettingsMap } from "./types";
import { isBrowserSourceKind, isEditableTextKind } from "./utils/sourceKindUtils";
import { clampNumber } from "./utils/transformUtils";

export type ObsSceneItemListProps = {
  t: DashboardText;
  items: ObsStudioSceneItemView[];
  selectedItemId: number | null;
  selectedDraftTransform: ObsStudioSceneItemTransform | null;
  dirtySelected: boolean;
  canEdit: boolean;
  canApplyTransform: boolean;
  applyLoading: boolean;
  canApplyIndex: boolean;
  indexApplyLoading: boolean;
  selectedNativeIndex: number | null;
  maxNativeIndex: number;
  statusMessage: string | null;
  statusError: boolean;
  indexStatusMessage: string | null;
  indexStatusError: boolean;
  lifecycleLoading: boolean;
  lifecycleStatusMessage: string | null;
  lifecycleStatusError: boolean;
  canToggleVisibility: boolean;
  canRemoveItem: boolean;
  onSelect: (sceneItemId: number) => void;
  onUpdateDraftTransform: (patch: Partial<ObsStudioSceneItemTransform>) => void;
  onApply: () => void;
  onReset: () => void;
  onApplyIndex: (targetIndex: number) => void;
  onSetVisibility: (enabled: boolean) => void;
  onRemove: () => void;
  sourceSettings: SourceSettingsMap;
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
  onUpdateTextSource: (value: string) => void;
  onUpdateBrowserSource: (input: { url: string; width: string; height: string }) => void;
};

function parseNumberInput(value: string): number | null {
  if (!value.trim().length) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ObsSceneItemList({
  t,
  items,
  selectedItemId,
  selectedDraftTransform,
  dirtySelected,
  canEdit,
  canApplyTransform,
  applyLoading,
  canApplyIndex,
  indexApplyLoading,
  selectedNativeIndex,
  maxNativeIndex,
  statusMessage,
  statusError,
  indexStatusMessage,
  indexStatusError,
  lifecycleLoading,
  lifecycleStatusMessage,
  lifecycleStatusError,
  canToggleVisibility,
  canRemoveItem,
  sourceSettings,
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
  onSelect,
  onUpdateDraftTransform,
  onApply,
  onReset,
  onApplyIndex,
  onSetVisibility,
  onRemove,
  onUpdateTextSource,
  onUpdateBrowserSource,
}: ObsSceneItemListProps) {
  const selectedItem = selectedItemId === null ? null : items.find(item => item.sceneItemId === selectedItemId) ?? null;
  const selectedSettings = selectedItem ? sourceSettings[selectedItem.sceneItemId] ?? {} : {};
  const canMoveLayerUp = canApplyIndex && selectedNativeIndex !== null && selectedNativeIndex < maxNativeIndex && !indexApplyLoading;
  const canMoveLayerDown = canApplyIndex && selectedNativeIndex !== null && selectedNativeIndex > 0 && !indexApplyLoading;
  const canEditText = Boolean(selectedItem && isEditableTextKind(selectedItem.inputKind));
  const canEditBrowser = Boolean(selectedItem && isBrowserSourceKind(selectedItem.inputKind));
  const canToggleSelectedVisibility = Boolean(selectedItem && canToggleVisibility && !lifecycleLoading);
  const canRemoveSelectedItem = Boolean(selectedItem && canRemoveItem && !lifecycleLoading);
  const [textValue, setTextValue] = useState("");
  const [browserUrlValue, setBrowserUrlValue] = useState("");
  const [browserWidthValue, setBrowserWidthValue] = useState("800");
  const [browserHeightValue, setBrowserHeightValue] = useState("450");

  useEffect(() => {
    if (!selectedItem || !canEditText) {
      setTextValue("");
      return;
    }

    setTextValue(selectedSettings.text ?? "");
  }, [canEditText, selectedItem, selectedSettings.text]);

  useEffect(() => {
    if (!selectedItem || !canEditBrowser) {
      setBrowserUrlValue("");
      setBrowserWidthValue("800");
      setBrowserHeightValue("450");
      return;
    }

    setBrowserUrlValue(selectedSettings.browserUrl ?? "");
    setBrowserWidthValue(String(selectedSettings.browserWidth ?? 800));
    setBrowserHeightValue(String(selectedSettings.browserHeight ?? 450));
  }, [
    canEditBrowser,
    selectedItem,
    selectedSettings.browserHeight,
    selectedSettings.browserUrl,
    selectedSettings.browserWidth,
  ]);

  const updateField = (
    raw: string,
    min: number,
    max: number,
    field: keyof ObsStudioSceneItemTransform,
  ) => {
    const parsed = parseNumberInput(raw);
    if (parsed === null) {
      return;
    }
    onUpdateDraftTransform({ [field]: clampNumber(parsed, min, max) });
  };

  return (
    <section className="obs-scene-item-list">
      <div className="inventory-toolbar compact">
        <h3 className="section-title small">{t.streamerStudioInspector}</h3>
      </div>

      {items.length === 0 ? (
        <p className="state-text state-empty">{t.streamerStudioNoItems}</p>
      ) : (
        <>
          <p className="market-card-hint">{t.streamerStudioLayerOrderHint}</p>
          <div className="obs-scene-lower-grid">
            <div className="obs-scene-selected-panel">
              <SelectedItemInspector
                t={t}
                selectedItem={selectedItem}
                selectedDraftTransform={selectedDraftTransform}
                dirtySelected={dirtySelected}
                canEdit={canEdit}
                canApplyTransform={canApplyTransform}
                applyLoading={applyLoading}
                canMoveLayerUp={canMoveLayerUp}
                canMoveLayerDown={canMoveLayerDown}
                selectedNativeIndex={selectedNativeIndex}
                maxNativeIndex={maxNativeIndex}
                indexStatusMessage={indexStatusMessage}
                indexStatusError={indexStatusError}
                lifecycleStatusMessage={lifecycleStatusMessage}
                lifecycleStatusError={lifecycleStatusError}
                canToggleSelectedVisibility={canToggleSelectedVisibility}
                canRemoveSelectedItem={canRemoveSelectedItem}
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
                statusMessage={statusMessage}
                statusError={statusError}
                onUpdateField={updateField}
                onApply={onApply}
                onReset={onReset}
                onApplyIndex={onApplyIndex}
                onSetVisibility={onSetVisibility}
                onRemove={onRemove}
                onUpdateTextSource={onUpdateTextSource}
                onUpdateBrowserSource={onUpdateBrowserSource}
              />
            </div>

            <div className="obs-scene-list-panel">
              <SceneItemRows t={t} items={items} selectedItemId={selectedItemId} onSelect={onSelect} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
