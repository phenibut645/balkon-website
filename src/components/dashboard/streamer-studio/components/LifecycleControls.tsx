import { DashboardText } from "@/lib/dashboardText";
import { ObsStudioSceneItemView } from "@/lib/types";

type LifecycleControlsProps = {
  t: DashboardText;
  selectedItem: ObsStudioSceneItemView | null;
  canToggleSelectedVisibility: boolean;
  canRemoveSelectedItem: boolean;
  lifecycleStatusMessage: string | null;
  lifecycleStatusError: boolean;
  onSetVisibility: (enabled: boolean) => void;
  onRemove: () => void;
};

export function LifecycleControls({
  t,
  selectedItem,
  canToggleSelectedVisibility,
  canRemoveSelectedItem,
  lifecycleStatusMessage,
  lifecycleStatusError,
  onSetVisibility,
  onRemove,
}: LifecycleControlsProps) {
  return (
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
  );
}
