import { useState } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { ObsStudioTextSourceCreateInput, ObsStudioBrowserSourceCreateInput } from "@/lib/types";

type SourceType = "text" | "browser";

type StreamerSourceCreatePanelProps = {
  t: DashboardText;
  canEdit: boolean;
  canCreateText: boolean;
  canCreateBrowser: boolean;
  hasSelectedScene: boolean;
  submitting: boolean;
  feedback: { message: string; isError: boolean } | null;
  createTextBlockedMessage?: string | null;
  createBrowserBlockedMessage?: string | null;
  onCreateText: (input: ObsStudioTextSourceCreateInput) => void;
  onCreateBrowser: (input: ObsStudioBrowserSourceCreateInput) => void;
};

export function StreamerSourceCreatePanel({
  t,
  canEdit,
  canCreateText,
  canCreateBrowser,
  hasSelectedScene,
  submitting,
  feedback,
  createTextBlockedMessage,
  createBrowserBlockedMessage,
  onCreateText,
  onCreateBrowser,
}: StreamerSourceCreatePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [sourceType, setSourceType] = useState<SourceType>("text");

  // Text source state
  const [text, setText] = useState("");
  const [textSourceName, setTextSourceName] = useState("");

  // Browser source state
  const [url, setUrl] = useState("");
  const [browserSourceName, setBrowserSourceName] = useState("");
  const [width, setWidth] = useState<number | "">(800);
  const [height, setHeight] = useState<number | "">(450);

  const normalizedText = text.trim();
  const normalizedTextSourceName = textSourceName.trim();
  const textInvalid = !normalizedText.length || normalizedText.length > 500 || normalizedTextSourceName.length > 160;

  const normalizedUrl = url.trim();
  const normalizedBrowserSourceName = browserSourceName.trim();
  const urlInvalid = !normalizedUrl.length || normalizedUrl.length > 1000 || !/^https?:\/\//i.test(normalizedUrl);
  const browserInvalid = urlInvalid || normalizedBrowserSourceName.length > 160;

  const submitText = () => {
    if (textInvalid || !canEdit || !hasSelectedScene || submitting) {
      return;
    }

    onCreateText({
      sceneName: "",
      sourceName: normalizedTextSourceName || null,
      text: normalizedText,
      positionX: 100,
      positionY: 100,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    });
    setText("");
    setTextSourceName("");
  };

  const submitBrowser = () => {
    if (browserInvalid || !canEdit || !hasSelectedScene || submitting) {
      return;
    }

    const parsedWidth = typeof width === "number" && Number.isFinite(width) ? Math.round(width) : 800;
    const parsedHeight = typeof height === "number" && Number.isFinite(height) ? Math.round(height) : 450;

    onCreateBrowser({
      sceneName: "",
      sourceName: normalizedBrowserSourceName || null,
      url: normalizedUrl,
      width: Math.max(64, Math.min(3840, parsedWidth)),
      height: Math.max(64, Math.min(2160, parsedHeight)),
      positionX: 100,
      positionY: 100,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    });
    setUrl("");
    setBrowserSourceName("");
    setWidth(800);
    setHeight(450);
  };

  const handleNumberInput = (value: string, setter: (val: number | "") => void) => {
    if (value === "") {
      setter("");
      return;
    }
    const num = Number(value);
    if (Number.isFinite(num)) {
      setter(num);
    }
  };

  return (
    <section className={`streamer-source-create-panel ${expanded ? "expanded" : "collapsed"}`}>
      <div className="streamer-source-create-head">
        <div>
          <h3 className="section-title small">{t.streamerStudioCreateSourceTitle}</h3>
          <p className="market-card-hint">
            {sourceType === "text" ? t.streamerStudioCreateTextSubtitle : t.streamerStudioCreateBrowserSubtitle}
          </p>
        </div>
        <button className="pagination-btn ghost" type="button" onClick={() => setExpanded(prev => !prev)}>
          {expanded ? t.streamerStudioCreateTextCollapse : t.streamerStudioCreateTextOpen}
        </button>
      </div>

      {expanded ? (
        <div className="streamer-source-create-form">
          {/* Type selector */}
          <div className="streamer-source-create-type-selector">
            <button
              type="button"
              className={`streamer-source-type-btn ${sourceType === "text" ? "active" : ""}`}
              onClick={() => setSourceType("text")}
              disabled={submitting}
            >
              {t.streamerStudioCreateSourceTypeText}
            </button>
            <button
              type="button"
              className={`streamer-source-type-btn ${sourceType === "browser" ? "active" : ""}`}
              onClick={() => setSourceType("browser")}
              disabled={submitting}
            >
              {t.streamerStudioCreateSourceTypeBrowser}
            </button>
          </div>

          {sourceType === "text" ? (
            <>
              <div className="streamer-source-create-form-title">{t.streamerStudioCreateTextTitle}</div>
              <label className="streamer-transform-field">
                <span>{t.streamerStudioCreateTextContent}</span>
                <textarea
                  maxLength={500}
                  rows={3}
                  value={text}
                  onChange={(event) => setText(event.target.value.slice(0, 500))}
                  disabled={!canEdit || !canCreateText || submitting}
                />
              </label>
              <label className="streamer-transform-field">
                <span>{t.streamerStudioCreateTextSourceName}</span>
                <input
                  type="text"
                  maxLength={160}
                  placeholder={t.streamerStudioCreateTextSourceNamePlaceholder}
                  value={textSourceName}
                  onChange={(event) => setTextSourceName(event.target.value.slice(0, 160))}
                  disabled={!canEdit || !canCreateText || submitting}
                />
              </label>
              <div className="streamer-source-create-actions">
                <button
                  className="pagination-btn"
                  type="button"
                  onClick={submitText}
                  disabled={!canEdit || !canCreateText || !hasSelectedScene || submitting || textInvalid}
                >
                  {t.streamerStudioCreateTextButton}
                </button>
                {feedback ? (
                  <p className={`streamer-source-create-feedback ${feedback.isError ? "state-error" : "state-ok"}`}>
                    {feedback.message}
                  </p>
                ) : null}
                {textInvalid && text.length > 0 ? (
                  <p className="streamer-source-create-feedback state-error">{t.streamerStudioCreateTextInvalid}</p>
                ) : null}
                {!textInvalid && createTextBlockedMessage ? (
                  <p className="streamer-source-create-feedback state-error">{createTextBlockedMessage}</p>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <div className="streamer-source-create-form-title">{t.streamerStudioCreateBrowserTitle}</div>
              <label className="streamer-transform-field">
                <span>{t.streamerStudioCreateBrowserUrl}</span>
                <input
                  type="text"
                  maxLength={1000}
                  placeholder={t.streamerStudioCreateBrowserUrlPlaceholder}
                  value={url}
                  onChange={(event) => setUrl(event.target.value.slice(0, 1000))}
                  disabled={!canEdit || !canCreateBrowser || submitting}
                />
              </label>
              <label className="streamer-transform-field">
                <span>{t.streamerStudioCreateTextSourceName}</span>
                <input
                  type="text"
                  maxLength={160}
                  placeholder={t.streamerStudioCreateTextSourceNamePlaceholder}
                  value={browserSourceName}
                  onChange={(event) => setBrowserSourceName(event.target.value.slice(0, 160))}
                  disabled={!canEdit || !canCreateBrowser || submitting}
                />
              </label>
              <div className="streamer-source-create-dimensions">
                <label className="streamer-transform-field compact">
                  <span>{t.streamerStudioCreateBrowserWidth}</span>
                  <input
                    type="number"
                    min={64}
                    max={3840}
                    value={width}
                    onChange={(event) => handleNumberInput(event.target.value, setWidth)}
                    disabled={!canEdit || !canCreateBrowser || submitting}
                  />
                </label>
                <label className="streamer-transform-field compact">
                  <span>{t.streamerStudioCreateBrowserHeight}</span>
                  <input
                    type="number"
                    min={64}
                    max={2160}
                    value={height}
                    onChange={(event) => handleNumberInput(event.target.value, setHeight)}
                    disabled={!canEdit || !canCreateBrowser || submitting}
                  />
                </label>
              </div>
              <div className="streamer-source-create-actions">
                <button
                  className="pagination-btn"
                  type="button"
                  onClick={submitBrowser}
                  disabled={!canEdit || !canCreateBrowser || !hasSelectedScene || submitting || browserInvalid}
                >
                  {t.streamerStudioCreateBrowserButton}
                </button>
                {feedback ? (
                  <p className={`streamer-source-create-feedback ${feedback.isError ? "state-error" : "state-ok"}`}>
                    {feedback.message}
                  </p>
                ) : null}
                {urlInvalid && url.length > 0 ? (
                  <p className="streamer-source-create-feedback state-error">{t.streamerStudioCreateBrowserInvalid}</p>
                ) : null}
                {!urlInvalid && createBrowserBlockedMessage ? (
                  <p className="streamer-source-create-feedback state-error">{createBrowserBlockedMessage}</p>
                ) : null}
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
