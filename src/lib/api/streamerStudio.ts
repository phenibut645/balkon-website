import {
  ApiStreamerStudioBrowserSourceCreateResponse,
  ApiStreamerStudioBrowserSourceUpdateResponse,
  ApiStreamerStudioSceneItemIndexApplyResponse,
  ApiStreamerStudioSceneItemRemoveResponse,
  ApiStreamerStudioSceneItemVisibilityResponse,
  ApiStreamerStudioSceneItemsListResponse,
  ApiStreamerStudioScenesListResponse,
  ApiStreamerStudioSourceSettingsGetResponse,
  ApiStreamerStudioTextSourceCreateResponse,
  ApiStreamerStudioTextSourceUpdateResponse,
  ApiStreamerStudioTransformApplyResponse,
  ObsStudioBrowserSourceCreateInput,
  ObsStudioBrowserSourceUpdateInput,
  ObsStudioSceneItemIndexApplyInput,
  ObsStudioSceneItemRemoveInput,
  ObsStudioSceneItemVisibilityInput,
  ObsStudioSourceSettingsGetInput,
  ObsStudioTextSourceCreateInput,
  ObsStudioTextSourceUpdateInput,
  ObsStudioTransformApplyInput,
  StreamerStudioAccessibleResponse,
  StreamerStudioMeResponse,
  StreamerStudioTrustedUserInput,
  StreamerStudioTrustedUserMutationResponse,
  StreamerStudioTrustedUsersResponse,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export async function getStreamerStudioMe(): Promise<StreamerStudioMeResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/streamer-studio/me`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as StreamerStudioMeResponse | null;
    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "STREAMER_STUDIO_LOAD_FAILED",
        message: data?.message || "Failed to load streamer studio access.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: false, error: "INVALID_RESPONSE", message: "Invalid API response." };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function getStreamerStudioAccessible(): Promise<StreamerStudioAccessibleResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/streamer-studio/accessible`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as StreamerStudioAccessibleResponse | null;
    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "STREAMER_STUDIO_LOAD_FAILED",
        message: data?.message || "Failed to load accessible streamers.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: false, error: "INVALID_RESPONSE", message: "Invalid API response." };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function getStreamerStudioTrustedUsers(streamerId: number): Promise<StreamerStudioTrustedUsersResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/streamer-studio/${encodeURIComponent(String(streamerId))}/trusted-users`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as StreamerStudioTrustedUsersResponse | null;
    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "STREAMER_STUDIO_LOAD_FAILED",
        message: data?.message || "Failed to load trusted users.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: false, error: "INVALID_RESPONSE", message: "Invalid API response." };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function addStreamerStudioTrustedUser(
  streamerId: number,
  input: StreamerStudioTrustedUserInput,
): Promise<StreamerStudioTrustedUserMutationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/streamer-studio/${encodeURIComponent(String(streamerId))}/trusted-users`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => null) as StreamerStudioTrustedUserMutationResponse | null;
    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "STREAMER_STUDIO_SAVE_FAILED",
        message: data?.message || "Failed to save trusted user.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: false, error: "INVALID_RESPONSE", message: "Invalid API response." };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function deleteStreamerStudioTrustedUser(
  streamerId: number,
  memberId: number,
): Promise<StreamerStudioTrustedUserMutationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/streamer-studio/${encodeURIComponent(String(streamerId))}/trusted-users/${encodeURIComponent(String(memberId))}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as StreamerStudioTrustedUserMutationResponse | null;
    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "STREAMER_STUDIO_DELETE_FAILED",
        message: data?.message || "Failed to delete trusted user.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: true };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function listStreamerStudioScenes(streamerId: number): Promise<ApiStreamerStudioScenesListResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/streamer-studio/${encodeURIComponent(String(streamerId))}/control/scenes/list`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const data = await response.json().catch(() => null) as ApiStreamerStudioScenesListResponse | null;
    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "OBS_SCENE_COMMAND_FAILED",
        message: data?.message || "Failed to load scenes.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: false, error: "INVALID_RESPONSE", message: "Invalid API response." };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function listStreamerStudioSceneItems(streamerId: number, sceneName: string): Promise<ApiStreamerStudioSceneItemsListResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/streamer-studio/${encodeURIComponent(String(streamerId))}/control/scene-items/list`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sceneName }),
    });

    const data = await response.json().catch(() => null) as ApiStreamerStudioSceneItemsListResponse | null;
    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "OBS_SCENE_COMMAND_FAILED",
        message: data?.message || "Failed to load scene items.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: false, error: "INVALID_RESPONSE", message: "Invalid API response." };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function applyStreamerStudioSceneItemIndex(
  streamerId: number,
  input: ObsStudioSceneItemIndexApplyInput,
): Promise<ApiStreamerStudioSceneItemIndexApplyResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/streamer-studio/${encodeURIComponent(String(streamerId))}/control/scene-item/index`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => null) as ApiStreamerStudioSceneItemIndexApplyResponse | null;
    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "OBS_INDEX_COMMAND_FAILED",
        message: data?.message || "Failed to update layer order.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: false, error: "INVALID_RESPONSE", message: "Invalid API response." };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function createStreamerStudioTextSource(
  streamerId: number,
  input: ObsStudioTextSourceCreateInput,
): Promise<ApiStreamerStudioTextSourceCreateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/streamer-studio/${encodeURIComponent(String(streamerId))}/control/source/text`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => null) as ApiStreamerStudioTextSourceCreateResponse | null;
    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "OBS_TEXT_SOURCE_COMMAND_FAILED",
        message: data?.message || "Failed to create text source.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: false, error: "INVALID_RESPONSE", message: "Invalid API response." };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function createStreamerStudioBrowserSource(
  streamerId: number,
  input: ObsStudioBrowserSourceCreateInput,
): Promise<ApiStreamerStudioBrowserSourceCreateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/streamer-studio/${encodeURIComponent(String(streamerId))}/control/source/browser`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => null) as ApiStreamerStudioBrowserSourceCreateResponse | null;
    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "OBS_BROWSER_SOURCE_COMMAND_FAILED",
        message: data?.message || "Failed to create browser source.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: false, error: "INVALID_RESPONSE", message: "Invalid API response." };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function removeStreamerStudioSceneItem(
  streamerId: number,
  input: ObsStudioSceneItemRemoveInput,
): Promise<ApiStreamerStudioSceneItemRemoveResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/streamer-studio/${encodeURIComponent(String(streamerId))}/control/scene-item`, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => null) as ApiStreamerStudioSceneItemRemoveResponse | null;
    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "OBS_REMOVE_COMMAND_FAILED",
        message: data?.message || "Failed to remove scene item.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: false, error: "INVALID_RESPONSE", message: "Invalid API response." };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function applyStreamerStudioSceneItemTransform(
  streamerId: number,
  input: ObsStudioTransformApplyInput,
): Promise<ApiStreamerStudioTransformApplyResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/streamer-studio/${encodeURIComponent(String(streamerId))}/control/scene-item/transform`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => null) as ApiStreamerStudioTransformApplyResponse | null;
    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "OBS_TRANSFORM_COMMAND_FAILED",
        message: data?.message || "Failed to apply transform.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: false, error: "INVALID_RESPONSE", message: "Invalid API response." };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function updateStreamerStudioTextSource(
  streamerId: number,
  input: ObsStudioTextSourceUpdateInput,
): Promise<ApiStreamerStudioTextSourceUpdateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/streamer-studio/${encodeURIComponent(String(streamerId))}/control/source/text`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => null) as ApiStreamerStudioTextSourceUpdateResponse | null;
    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "OBS_TEXT_SOURCE_UPDATE_COMMAND_FAILED",
        message: data?.message || "Failed to update text source.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: false, error: "INVALID_RESPONSE", message: "Invalid API response." };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function updateStreamerStudioBrowserSource(
  streamerId: number,
  input: ObsStudioBrowserSourceUpdateInput,
): Promise<ApiStreamerStudioBrowserSourceUpdateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/streamer-studio/${encodeURIComponent(String(streamerId))}/control/source/browser`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => null) as ApiStreamerStudioBrowserSourceUpdateResponse | null;
    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "OBS_BROWSER_SOURCE_UPDATE_COMMAND_FAILED",
        message: data?.message || "Failed to update browser source.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: false, error: "INVALID_RESPONSE", message: "Invalid API response." };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function getStreamerStudioSourceSettings(
  streamerId: number,
  input: ObsStudioSourceSettingsGetInput,
): Promise<ApiStreamerStudioSourceSettingsGetResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/streamer-studio/${encodeURIComponent(String(streamerId))}/control/source/settings`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => null) as ApiStreamerStudioSourceSettingsGetResponse | null;
    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "OBS_SOURCE_SETTINGS_COMMAND_FAILED",
        message: data?.message || "Failed to load source settings.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: false, error: "INVALID_RESPONSE", message: "Invalid API response." };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function setStreamerStudioSceneItemVisibility(
  streamerId: number,
  input: ObsStudioSceneItemVisibilityInput,
): Promise<ApiStreamerStudioSceneItemVisibilityResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/streamer-studio/${encodeURIComponent(String(streamerId))}/control/scene-item/visibility`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => null) as ApiStreamerStudioSceneItemVisibilityResponse | null;
    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "OBS_VISIBILITY_COMMAND_FAILED",
        message: data?.message || "Failed to update visibility.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: false, error: "INVALID_RESPONSE", message: "Invalid API response." };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}
