import { useState } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { ObsStudioTextSourceCreateInput } from "@/lib/types";

type StreamerSourceCreatePanelProps = {
  t: DashboardText;
  canEdit: boolean;
  hasSelectedScene: boolean;
  submitting: boolean;
  feedback: { message: string; isError: boolean } | null;
  onCreateText: (input: ObsStudioTextSourceCreateInput) => void;
};

export function StreamerSourceCreatePanel({
  t,
  canEdit,
  hasSelectedScene,
  submitting,
  feedback,
  onCreateText,
}: StreamerSourceCreatePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [sourceName, setSourceName] = useState("");
  const normalizedText = text.trim();
  const normalizedSourceName = sourceName.trim();
  const invalid = !normalizedText.length || normalizedText.length > 500 || normalizedSourceName.length > 160;

  const submit = () => {
    if (invalid || !canEdit || !hasSelectedScene || submitting) {
      return;
    }

    onCreateText({
      sceneName: "",
      sourceName: normalizedSourceName || null,
      text: normalizedText,
      positionX: 100,
      positionY: 100,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    });
    setText("");
    setSourceName("");
  };

  return (
    <section className={`streamer-source-create-panel ${expanded ? "expanded" : "collapsed"}`}>
      <div className="streamer-source-create-head">
        <div>
          <h3 className="section-title small">{t.streamerStudioCreateSourceTitle}</h3>
          <p className="market-card-hint">{t.streamerStudioCreateTextSubtitle}</p>
        </div>
        <button className="pagination-btn ghost" type="button" onClick={() => setExpanded(prev => !prev)}>
          {expanded ? t.streamerStudioCreateTextCollapse : t.streamerStudioCreateTextOpen}
        </button>
      </div>

      {expanded ? (
        <div className="streamer-source-create-form">
          <div className="streamer-source-create-form-title">{t.streamerStudioCreateTextTitle}</div>
          <label className="streamer-transform-field">
            <span>{t.streamerStudioCreateTextContent}</span>
            <textarea
              maxLength={500}
              rows={3}
              value={text}
              onChange={(event) => setText(event.target.value.slice(0, 500))}
              disabled={!canEdit || submitting}
            />
          </label>
          <label className="streamer-transform-field">
            <span>{t.streamerStudioCreateTextSourceName}</span>
            <input
              type="text"
              maxLength={160}
              placeholder={t.streamerStudioCreateTextSourceNamePlaceholder}
              value={sourceName}
              onChange={(event) => setSourceName(event.target.value.slice(0, 160))}
              disabled={!canEdit || submitting}
            />
          </label>
          <div className="streamer-source-create-actions">
            <button
              className="pagination-btn"
              type="button"
              onClick={submit}
              disabled={!canEdit || !hasSelectedScene || submitting || invalid}
            >
              {t.streamerStudioCreateTextButton}
            </button>
            {feedback ? (
              <p className={`streamer-source-create-feedback ${feedback.isError ? "state-error" : "state-ok"}`}>
                {feedback.message}
              </p>
            ) : null}
            {invalid && text.length > 0 ? (
              <p className="streamer-source-create-feedback state-error">{t.streamerStudioCreateTextInvalid}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
