import { DashboardText } from "@/lib/dashboardText";
import { ObsStudioSceneItemView } from "@/lib/types";

type ObsSceneItemListProps = {
  t: DashboardText;
  items: ObsStudioSceneItemView[];
  selectedItemId: number | null;
  onSelect: (sceneItemId: number) => void;
};

function formatTransform(item: ObsStudioSceneItemView): string {
  const t = item.transform;
  const w = t.width ? ` w:${Math.round(t.width)}` : "";
  const h = t.height ? ` h:${Math.round(t.height)}` : "";
  return `x:${Math.round(t.positionX)} y:${Math.round(t.positionY)} sx:${t.scaleX.toFixed(2)} sy:${t.scaleY.toFixed(2)} r:${Math.round(t.rotation)}${w}${h}`;
}

export function ObsSceneItemList({ t, items, selectedItemId, onSelect }: ObsSceneItemListProps) {
  return (
    <section className="obs-scene-item-list">
      <div className="inventory-toolbar compact">
        <h3 className="section-title small">{t.streamerStudioInspector}</h3>
      </div>

      {items.length === 0 ? (
        <p className="state-text state-empty">{t.streamerStudioNoItems}</p>
      ) : (
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
                <span className={`meta-badge ${item.enabled ? "ok" : "danger"}`}>
                  {item.enabled ? t.streamerStudioEnabled : t.streamerStudioDisabled}
                </span>
              </div>
              <div className="obs-scene-item-row-meta">
                <span className="market-card-hint">
                  {item.inputKind ? item.inputKind : t.streamerStudioUnknownInput}
                </span>
                <span className="market-card-hint mono">{formatTransform(item)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

