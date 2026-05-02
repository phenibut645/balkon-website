import { DashboardText } from "@/lib/dashboardText";
import { StreamerStudioAccessView } from "@/lib/types";

export const CAPABILITY_TRANSFORM_SET = "obs.scene.item.transform.set";
export const CAPABILITY_INDEX_SET = "obs.scene.item.index.set";
export const CAPABILITY_VISIBILITY_SET = "obs.scene.item.visibility.set";
export const CAPABILITY_ITEM_REMOVE = "obs.scene.item.remove";
export const CAPABILITY_SOURCE_SETTINGS_GET = "obs.scene.source.settings.get";
export const CAPABILITY_TEXT_CREATE = "obs.scene.source.text.create";
export const CAPABILITY_TEXT_UPDATE = "obs.scene.source.text.update";
export const CAPABILITY_BROWSER_CREATE = "obs.scene.source.browser.create";
export const CAPABILITY_BROWSER_UPDATE = "obs.scene.source.browser.update";

export function getCapabilities(streamer: StreamerStudioAccessView): string[] {
  return Array.isArray(streamer.obsAgentCapabilities) ? streamer.obsAgentCapabilities : [];
}

export function hasKnownCapabilities(streamer: StreamerStudioAccessView): boolean {
  return getCapabilities(streamer).length > 0;
}

export function getBlockedReason(
  t: DashboardText,
  streamer: StreamerStudioAccessView,
  capability: string,
  allowWhenUnknown: boolean,
): string | null {
  if (streamer.obsConnected === false) {
    return t.streamerStudioObsNotConnected;
  }

  const capabilities = getCapabilities(streamer);
  if (!capabilities.length) {
    return allowWhenUnknown ? null : t.streamerStudioCapabilitiesUnknown;
  }

  return capabilities.includes(capability) ? null : t.streamerStudioCapabilityUnsupported;
}
