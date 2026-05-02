import { ObsStudioSceneItemTransform, ObsStudioSceneItemView } from "@/lib/types";

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeTransform(transform: ObsStudioSceneItemTransform): ObsStudioSceneItemTransform {
  return {
    positionX: clampNumber(transform.positionX, -10000, 10000),
    positionY: clampNumber(transform.positionY, -10000, 10000),
    scaleX: clampNumber(transform.scaleX, 0.05, 10),
    scaleY: clampNumber(transform.scaleY, 0.05, 10),
    rotation: clampNumber(transform.rotation, -360, 360),
    width: transform.width,
    height: transform.height,
  };
}

export function transformsEqual(a: ObsStudioSceneItemTransform, b: ObsStudioSceneItemTransform): boolean {
  return a.positionX === b.positionX
    && a.positionY === b.positionY
    && a.scaleX === b.scaleX
    && a.scaleY === b.scaleY
    && a.rotation === b.rotation;
}

export function buildDraftMap(sceneItems: ObsStudioSceneItemView[]): Record<number, ObsStudioSceneItemTransform> {
  return sceneItems.reduce<Record<number, ObsStudioSceneItemTransform>>((acc, item) => {
    acc[item.sceneItemId] = normalizeTransform(item.transform);
    return acc;
  }, {});
}
