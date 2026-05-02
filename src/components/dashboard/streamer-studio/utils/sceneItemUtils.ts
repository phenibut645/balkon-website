import { DashboardText } from "@/lib/dashboardText";
import { ObsStudioSceneItemView } from "@/lib/types";

export function withNativeIndexes(sceneItems: ObsStudioSceneItemView[]): ObsStudioSceneItemView[] {
  return sceneItems
    .map((item, index) => ({
      ...item,
      sceneItemIndex: Number.isInteger(item.sceneItemIndex) && item.sceneItemIndex! >= 0 ? item.sceneItemIndex : index,
    }))
    .sort((a, b) => (a.sceneItemIndex ?? 0) - (b.sceneItemIndex ?? 0));
}

export function pickPreferredSceneItemId(items: ObsStudioSceneItemView[], previousSelectedId: number | null): number | null {
  if (!items.length) {
    return null;
  }

  if (previousSelectedId !== null && items.some(item => item.sceneItemId === previousSelectedId)) {
    return previousSelectedId;
  }

  const recommended = items.find(item => item.sourceName.trim() === "Balkon Media Group");
  if (recommended) {
    return recommended.sceneItemId;
  }

  const firstEnabled = items.find(item => item.enabled);
  if (firstEnabled) {
    return firstEnabled.sceneItemId;
  }

  return items[0]?.sceneItemId ?? null;
}

export function isRecommendedItem(sourceName: string): boolean {
  return sourceName.trim() === "Balkon Media Group";
}

export function getTypeLabel(item: ObsStudioSceneItemView, t: DashboardText): string {
  const kind = item.inputKind?.trim();
  if (kind && kind.length > 0) {
    return kind;
  }

  if (item.sourceName.toLowerCase().includes("group")) {
    return t.streamerStudioTypeGroup;
  }

  return t.streamerStudioUnknownInput;
}

export function formatTransform(item: ObsStudioSceneItemView): string {
  const transform = item.transform;
  const width = transform.width ? ` w:${Math.round(transform.width)}` : "";
  const height = transform.height ? ` h:${Math.round(transform.height)}` : "";
  return `x:${transform.positionX.toFixed(1)} y:${transform.positionY.toFixed(1)} sx:${transform.scaleX.toFixed(2)} sy:${transform.scaleY.toFixed(2)} r:${transform.rotation.toFixed(1)}${width}${height}`;
}
