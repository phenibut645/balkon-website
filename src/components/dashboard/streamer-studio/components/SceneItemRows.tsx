import { DashboardText } from "@/lib/dashboardText";
import { ObsStudioSceneItemView } from "@/lib/types";
import { formatTransform, getTypeLabel, isRecommendedItem } from "../utils/sceneItemUtils";

type SceneItemRowsProps = {
  t: DashboardText;
  items: ObsStudioSceneItemView[];
  selectedItemId: number | null;
  onSelect: (sceneItemId: number) => void;
};

export function SceneItemRows({ t, items, selectedItemId, onSelect }: SceneItemRowsProps) {
  return (
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
  );
}
