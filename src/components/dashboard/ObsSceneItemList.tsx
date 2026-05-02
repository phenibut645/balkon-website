import { useEffect, useState } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { ObsStudioSceneItemTransform, ObsStudioSceneItemView } from "@/lib/types";

type SourceSettingsMap = Record<number, {
  text?: string;
  browserUrl?: string;
  browserWidth?: number;
  browserHeight?: number;
}>;

type ObsSceneItemListProps = {
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

function formatTransform(item: ObsStudioSceneItemView): string {
  const t = item.transform;
  const w = t.width ? ` w:${Math.round(t.width)}` : "";
  const h = t.height ? ` h:${Math.round(t.height)}` : "";
  return `x:${t.positionX.toFixed(1)} y:${t.positionY.toFixed(1)} sx:${t.scaleX.toFixed(2)} sy:${t.scaleY.toFixed(2)} r:${t.rotation.toFixed(1)}${w}${h}`;
}

function isRecommendedItem(sourceName: string): boolean {
  return sourceName.trim() === "Balkon Media Group";
}

function getTypeLabel(item: ObsStudioSceneItemView, t: DashboardText): string {
  const kind = item.inputKind?.trim();
  if (kind && kind.length > 0) {
    return kind;
  }

  if (item.sourceName.toLowerCase().includes("group")) {
    return t.streamerStudioTypeGroup;
  }

  return t.streamerStudioUnknownInput;
}

function parseNumberInput(value: string): number | null {
  if (!value.trim().length) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isEditableTextKind(kind: string | null | undefined): boolean {
  return kind === "text_gdiplus_v3"
    || kind === "text_gdiplus_v2"
    || kind === "text_gdiplus"
    || kind === "text_ft2_source_v2"
    || kind === "text_ft2_source";
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
  const canEditBrowser = Boolean(selectedItem && selectedItem.inputKind === "browser_source");
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
              {selectedItem && selectedDraftTransform ? (
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
                  <div className="streamer-transform-grid">
                    <label className="streamer-transform-field">
                      <span>{t.streamerStudioTransformX}</span>
                      <input
                        type="number"
                        value={selectedDraftTransform.positionX}
                        onChange={(event) => updateField(event.target.value, -10000, 10000, "positionX")}
                      />
                    </label>
                    <label className="streamer-transform-field">
                      <span>{t.streamerStudioTransformY}</span>
                      <input
                        type="number"
                        value={selectedDraftTransform.positionY}
                        onChange={(event) => updateField(event.target.value, -10000, 10000, "positionY")}
                      />
                    </label>
                    <label className="streamer-transform-field">
                      <span>{t.streamerStudioTransformScaleX}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={selectedDraftTransform.scaleX}
                        onChange={(event) => updateField(event.target.value, 0.05, 10, "scaleX")}
                      />
                    </label>
                    <label className="streamer-transform-field">
                      <span>{t.streamerStudioTransformScaleY}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={selectedDraftTransform.scaleY}
                        onChange={(event) => updateField(event.target.value, 0.05, 10, "scaleY")}
                      />
                    </label>
                    <label className="streamer-transform-field">
                      <span>{t.streamerStudioTransformRotation}</span>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedDraftTransform.rotation}
                        onChange={(event) => updateField(event.target.value, -360, 360, "rotation")}
                      />
                    </label>
                  </div>

                  <div className="streamer-layer-controls">
                    <div className="streamer-layer-title">{t.streamerStudioLayerControlsTitle}</div>
                    <div className="streamer-layer-actions">
                      <button className="pagination-btn ghost" type="button" disabled={!canMoveLayerUp} onClick={() => selectedNativeIndex !== null ? onApplyIndex(selectedNativeIndex + 1) : undefined}>
                        ↑ {t.streamerStudioMoveLayerUp}
                      </button>
                      <button className="pagination-btn ghost" type="button" disabled={!canMoveLayerDown} onClick={() => selectedNativeIndex !== null ? onApplyIndex(selectedNativeIndex - 1) : undefined}>
                        ↓ {t.streamerStudioMoveLayerDown}
                      </button>
                      <button className="pagination-btn ghost" type="button" disabled={!canMoveLayerUp} onClick={() => onApplyIndex(maxNativeIndex)}>
                        ⤒ {t.streamerStudioMoveLayerTop}
                      </button>
                      <button className="pagination-btn ghost" type="button" disabled={!canMoveLayerDown} onClick={() => onApplyIndex(0)}>
                        ⤓ {t.streamerStudioMoveLayerBottom}
                      </button>
                    </div>
                    {indexStatusMessage ? (
                      <p className={`streamer-layer-status ${indexStatusError ? "state-error" : "state-ok"}`}>
                        {indexStatusMessage}
                      </p>
                    ) : null}
                  </div>

                  <div className="streamer-lifecycle-controls">
                    <div className="streamer-lifecycle-title">{t.streamerStudioVisibilityControlsTitle}</div>
                    <div className="streamer-lifecycle-actions">
                      <button
                        className="pagination-btn"
                        type="button"
                        disabled={!canToggleSelectedVisibility}
                        onClick={() => selectedItem ? onSetVisibility(!selectedItem.enabled) : undefined}
                      >
                        {selectedItem?.enabled ? t.streamerStudioHideItem : t.streamerStudioShowItem}
                      </button>
                      <button
                        className="pagination-btn streamer-danger-button"
                        type="button"
                        disabled={!canRemoveSelectedItem}
                        onClick={() => selectedItem ? onRemove() : undefined}
                      >
                        {t.streamerStudioRemoveItem}
                      </button>
                    </div>
                    <p className="streamer-lifecycle-hint">{t.streamerStudioRemoveHint}</p>
                    {lifecycleStatusMessage ? (
                      <p className={`streamer-lifecycle-status ${lifecycleStatusError ? "state-error" : "state-ok"}`} aria-live="polite">
                        {lifecycleStatusMessage}
                      </p>
                    ) : null}
                  </div>

                  {canEdit && (canEditText || canEditBrowser) ? (
                    <div className="streamer-source-settings">
                      <div className="streamer-source-settings-head">
                        <div className="streamer-lifecycle-title">{t.streamerStudioSourceSettingsTitle}</div>
                      </div>
                      {!canLoadSourceSettings && (canEditText || canEditBrowser) ? (
                        <p className="streamer-source-settings-feedback state-error" aria-live="polite">
                          {canEditBrowser ? browserUpdateBlockedMessage : textUpdateBlockedMessage}
                        </p>
                      ) : null}
                      {canLoadSourceSettings && sourceSettingsLoading ? (
                        <p className="streamer-source-settings-feedback" aria-live="polite">
                          {t.streamerStudioSourceSettingsLoading}
                        </p>
                      ) : null}
                      {canLoadSourceSettings && !sourceSettingsLoading && sourceSettingsLoadStatusMessage ? (
                        <p className={`streamer-source-settings-feedback ${sourceSettingsLoadStatusError ? "state-error" : "state-ok"}`} aria-live="polite">
                          {sourceSettingsLoadStatusMessage}
                        </p>
                      ) : null}

                      {canEditText ? (
                        <div className="streamer-source-settings-form">
                          <div className="streamer-source-settings-head">
                            <span className="market-card-hint">{t.streamerStudioTextSettingsTitle}</span>
                          </div>
                          <label className="streamer-transform-field">
                            <span>{t.streamerStudioTextSettingsContent}</span>
                            <textarea
                              value={textValue}
                              placeholder={t.streamerStudioTextSettingsPlaceholder}
                              onChange={(event) => setTextValue(event.target.value)}
                              rows={4}
                              disabled={Boolean(textUpdateBlockedMessage)}
                            />
                          </label>
                          <div className="streamer-source-settings-actions">
                            <button
                              className="pagination-btn"
                              type="button"
                              disabled={textUpdateLoading || Boolean(textUpdateBlockedMessage)}
                              onClick={() => onUpdateTextSource(textValue)}
                            >
                              {t.streamerStudioTextSettingsUpdate}
                            </button>
                          </div>
                          {textUpdateBlockedMessage ? (
                            <p className="streamer-source-settings-feedback state-error" aria-live="polite">
                              {textUpdateBlockedMessage}
                            </p>
                          ) : null}
                          {textUpdateStatusMessage ? (
                            <p className={`streamer-source-settings-feedback ${textUpdateStatusError ? "state-error" : "state-ok"}`} aria-live="polite">
                              {textUpdateStatusMessage}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {canEditBrowser ? (
                        <div className="streamer-source-settings-form">
                          <div className="streamer-source-settings-head">
                            <span className="market-card-hint">{t.streamerStudioBrowserSettingsTitle}</span>
                          </div>
                          <div className="streamer-source-settings-grid">
                            <label className="streamer-transform-field streamer-source-settings-wide">
                              <span>{t.streamerStudioBrowserSettingsUrl}</span>
                              <input
                                type="url"
                                value={browserUrlValue}
                                placeholder={t.streamerStudioBrowserSettingsUrlPlaceholder}
                                onChange={(event) => setBrowserUrlValue(event.target.value)}
                                disabled={Boolean(browserUpdateBlockedMessage)}
                              />
                            </label>
                            <label className="streamer-transform-field">
                              <span>{t.streamerStudioBrowserSettingsWidth}</span>
                              <input
                                type="number"
                                value={browserWidthValue}
                                onChange={(event) => setBrowserWidthValue(event.target.value)}
                                disabled={Boolean(browserUpdateBlockedMessage)}
                              />
                            </label>
                            <label className="streamer-transform-field">
                              <span>{t.streamerStudioBrowserSettingsHeight}</span>
                              <input
                                type="number"
                                value={browserHeightValue}
                                onChange={(event) => setBrowserHeightValue(event.target.value)}
                                disabled={Boolean(browserUpdateBlockedMessage)}
                              />
                            </label>
                          </div>
                          <div className="streamer-source-settings-actions">
                            <button
                              className="pagination-btn"
                              type="button"
                              disabled={browserUpdateLoading || Boolean(browserUpdateBlockedMessage)}
                              onClick={() => onUpdateBrowserSource({
                                url: browserUrlValue,
                                width: browserWidthValue,
                                height: browserHeightValue,
                              })}
                            >
                              {t.streamerStudioBrowserSettingsUpdate}
                            </button>
                          </div>
                          {browserUpdateBlockedMessage ? (
                            <p className="streamer-source-settings-feedback state-error" aria-live="polite">
                              {browserUpdateBlockedMessage}
                            </p>
                          ) : null}
                          {browserUpdateStatusMessage ? (
                            <p className={`streamer-source-settings-feedback ${browserUpdateStatusError ? "state-error" : "state-ok"}`} aria-live="polite">
                              {browserUpdateStatusMessage}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

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
              ) : (
                <div className="streamer-transform-editor">
                  <p className="state-text state-empty">{t.noItemSelected}</p>
                  {lifecycleStatusMessage ? (
                    <p className={`streamer-lifecycle-status ${lifecycleStatusError ? "state-error" : "state-ok"}`} aria-live="polite">
                      {lifecycleStatusMessage}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            <div className="obs-scene-list-panel">
              <div className="obs-scene-item-list-rows">
                {items.map(item => (
                  <button
                    key={item.sceneItemId}
                    type="button"
                    className={[
                      "obs-scene-item-row",
                      selectedItemId === item.sceneItemId ? "selected" : "",
                      item.enabled ? "" : "disabled",
                    ].join(" ").trim()}
                    onClick={() => onSelect(item.sceneItemId)}
                    title={item.sourceName}
                  >
                    <div className="obs-scene-item-row-title">
                      <span className="obs-scene-item-row-name">{item.sourceName}</span>
                      <div className="obs-scene-item-row-badges">
                        {isRecommendedItem(item.sourceName) ? (
                          <span className="meta-badge neutral">{t.streamerStudioRecommended}</span>
                        ) : null}
                        <span className={`meta-badge ${item.enabled ? "ok" : "danger"}`}>
                          {item.enabled ? t.streamerStudioEnabled : t.streamerStudioDisabled}
                        </span>
                      </div>
                    </div>
                    <div className="obs-scene-item-row-meta">
                      <span className="market-card-hint">{getTypeLabel(item, t)}</span>
                      <span className="market-card-hint mono">{formatTransform(item)}</span>
                    </div>
                  </button>
                ))}
                </div>
              </div>
            </div>
          </>
        )}
    </section>
  );
}

