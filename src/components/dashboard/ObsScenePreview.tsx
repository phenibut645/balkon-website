import { DashboardText } from "@/lib/dashboardText";
import { ObsStudioSceneItemView } from "@/lib/types";

type ObsScenePreviewProps = {
  t: DashboardText;
  items: ObsStudioSceneItemView[];
  selectedItemId: number | null;
  onSelectItem: (sceneItemId: number) => void;
};

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const DEFAULT_BOX_W = 220;
const DEFAULT_BOX_H = 120;

export function ObsScenePreview({ t, items, selectedItemId, onSelectItem }: ObsScenePreviewProps) {
  return (
    <section className="obs-scene-preview">
      <div className="inventory-toolbar compact">
        <h3 className="section-title small">{t.streamerStudioPreview}</h3>
      </div>

      <div className="obs-scene-frame" role="img" aria-label={t.streamerStudioPreview}>
        {items.map(item => {
          const left = (item.transform.positionX / CANVAS_WIDTH) * 100;
          const top = (item.transform.positionY / CANVAS_HEIGHT) * 100;
          const w = item.transform.width ?? DEFAULT_BOX_W;
          const h = item.transform.height ?? DEFAULT_BOX_H;
          const widthPct = (w / CANVAS_WIDTH) * 100;
          const heightPct = (h / CANVAS_HEIGHT) * 100;

          return (
            <button
              key={item.sceneItemId}
              type="button"
              className={[
                "obs-scene-item-box",
                item.enabled ? "" : "disabled",
                selectedItemId === item.sceneItemId ? "selected" : "",
              ].join(" ").trim()}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${widthPct}%`,
                height: `${heightPct}%`,
                transform: `rotate(${item.transform.rotation || 0}deg)`,
              }}
              onClick={() => onSelectItem(item.sceneItemId)}
              title={`${item.sourceName} (${item.enabled ? t.streamerStudioEnabled : t.streamerStudioDisabled})`}
            >
              <span className="obs-scene-item-label">{item.sourceName}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

