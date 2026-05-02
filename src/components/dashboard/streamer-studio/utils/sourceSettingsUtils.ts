import { ObsStudioSceneItemView, ObsStudioSourceSettingsGetResult } from "@/lib/types";
import { SceneItemSourceSettings } from "../types";
import { isEditableStudioSourceKind } from "./sourceKindUtils";

export function hasCachedSourceSettings(
  item: ObsStudioSceneItemView | null,
  settings: SceneItemSourceSettings | undefined,
): boolean {
  if (!item) {
    return false;
  }

  if (item.inputKind === "browser_source") {
    return typeof settings?.browserUrl === "string"
      || Number.isFinite(settings?.browserWidth)
      || Number.isFinite(settings?.browserHeight);
  }

  if (isEditableStudioSourceKind(item.inputKind)) {
    return typeof settings?.text === "string";
  }

  return false;
}

export function mergeSourceSettings(
  existing: SceneItemSourceSettings | undefined,
  result: ObsStudioSourceSettingsGetResult,
): SceneItemSourceSettings {
  return {
    ...(existing ?? {}),
    ...(typeof result.settings.text === "string" ? { text: result.settings.text } : {}),
    ...(typeof result.settings.url === "string" ? { browserUrl: result.settings.url } : {}),
    ...(Number.isFinite(result.settings.width) ? { browserWidth: result.settings.width } : {}),
    ...(Number.isFinite(result.settings.height) ? { browserHeight: result.settings.height } : {}),
  };
}
