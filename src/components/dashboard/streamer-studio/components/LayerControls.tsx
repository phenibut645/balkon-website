import { DashboardText } from "@/lib/dashboardText";

type LayerControlsProps = {
  t: DashboardText;
  canMoveLayerUp: boolean;
  canMoveLayerDown: boolean;
  selectedNativeIndex: number | null;
  maxNativeIndex: number;
  indexStatusMessage: string | null;
  indexStatusError: boolean;
  onApplyIndex: (targetIndex: number) => void;
};

export function LayerControls({
  t,
  canMoveLayerUp,
  canMoveLayerDown,
  selectedNativeIndex,
  maxNativeIndex,
  indexStatusMessage,
  indexStatusError,
  onApplyIndex,
}: LayerControlsProps) {
  return (
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
  );
}
