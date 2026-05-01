import { type PointerEvent, useRef, useState } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { ObsStudioSceneItemView } from "@/lib/types";

type ObsScenePreviewProps = {
  t: DashboardText;
  items: ObsStudioSceneItemView[];
  selectedItemId: number | null;
  canEdit: boolean;
  onSelectItem: (sceneItemId: number) => void;
  onMoveSelected: (deltaX: number, deltaY: number) => void;
  dirtyItemId: number | null;
};

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const DEFAULT_BOX_W = 220;
const DEFAULT_BOX_H = 120;

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

export function ObsScenePreview({
  t,
  items,
  selectedItemId,
  canEdit,
  onSelectItem,
  onMoveSelected,
  dirtyItemId,
}: ObsScenePreviewProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const activePointerIdRef = useRef<number | null>(null);
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>, sceneItemId: number) => {
    onSelectItem(sceneItemId);
    if (!canEdit || selectedItemId !== sceneItemId) {
      return;
    }
    activePointerIdRef.current = event.pointerId;
    lastPointerPosRef.current = { x: event.clientX, y: event.clientY };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!canEdit || !dragging || activePointerIdRef.current !== event.pointerId || !selectedItemId) {
      return;
    }
    const frame = frameRef.current;
    const last = lastPointerPosRef.current;
    if (!frame || !last) {
      return;
    }
    const rect = frame.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }
    const deltaPxX = event.clientX - last.x;
    const deltaPxY = event.clientY - last.y;
    lastPointerPosRef.current = { x: event.clientX, y: event.clientY };

    onMoveSelected(
      (deltaPxX / rect.width) * CANVAS_WIDTH,
      (deltaPxY / rect.height) * CANVAS_HEIGHT,
    );
  };

  const stopDragging = (event?: PointerEvent<HTMLDivElement>) => {
    if (event && activePointerIdRef.current !== event.pointerId) {
      return;
    }
    activePointerIdRef.current = null;
    lastPointerPosRef.current = null;
    setDragging(false);
  };

  return (
    <section className="obs-scene-preview">
      <div className="inventory-toolbar compact">
        <h3 className="section-title small">{t.streamerStudioPreview}</h3>
      </div>

      <p className="market-card-hint">{t.streamerStudioDragHint}</p>
      <div
        ref={frameRef}
        className={`obs-scene-frame ${canEdit ? "editable" : ""}`}
        role="img"
        aria-label={t.streamerStudioPreview}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        {items.map(item => {
          const left = (item.transform.positionX / CANVAS_WIDTH) * 100;
          const top = (item.transform.positionY / CANVAS_HEIGHT) * 100;
          const w = item.transform.width ?? DEFAULT_BOX_W;
          const h = item.transform.height ?? DEFAULT_BOX_H;
          const widthPct = Math.min(100, Math.max(4, (w / CANVAS_WIDTH) * 100));
          const heightPct = Math.min(100, Math.max(4, (h / CANVAS_HEIGHT) * 100));
          const isSelected = selectedItemId === item.sceneItemId;
          const isDirty = dirtyItemId === item.sceneItemId;
          const recommended = isRecommendedItem(item.sourceName);
          const typeLabel = getTypeLabel(item, t);
          const zIndex = isSelected ? 420 : (isDirty ? 320 : (item.enabled ? 180 : 90));

          return (
            <button
              key={item.sceneItemId}
              type="button"
              className={[
                "obs-scene-item-box",
                canEdit ? "draggable" : "",
                item.enabled ? "" : "disabled",
                isSelected ? "selected" : "",
                isDirty ? "dirty" : "",
              ].join(" ").trim()}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${widthPct}%`,
                height: `${heightPct}%`,
                transform: `rotate(${item.transform.rotation || 0}deg)`,
                zIndex,
              }}
              onPointerDown={(event) => handlePointerDown(event, item.sceneItemId)}
              onClick={() => onSelectItem(item.sceneItemId)}
              title={`${item.sourceName} (${item.enabled ? t.streamerStudioEnabled : t.streamerStudioDisabled})`}
            >
              <span className="obs-scene-item-label" aria-hidden="true">
                <span className="obs-scene-item-label-main">{item.sourceName}</span>
                <span className="obs-scene-item-label-meta">
                  <span className="obs-scene-item-kind">{typeLabel}</span>
                  {recommended ? <span className="obs-scene-item-recommended">{t.streamerStudioRecommended}</span> : null}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

