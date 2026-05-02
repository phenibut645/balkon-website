import { Dispatch, SetStateAction } from "react";
import { DashboardText } from "@/lib/dashboardText";

type SourceSettingsEditorProps = {
  t: DashboardText;
  canEdit: boolean;
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
  onUpdateTextSource: (value: string) => void;
  onUpdateBrowserSource: (input: { url: string; width: string; height: string }) => void;
};

export function SourceSettingsEditor({
  t,
  canEdit,
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
  onUpdateTextSource,
  onUpdateBrowserSource,
}: SourceSettingsEditorProps) {
  if (!canEdit || (!canEditText && !canEditBrowser)) {
    return null;
  }

  return (
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
  );
}
