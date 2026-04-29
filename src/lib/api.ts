import { ApiMeResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export function getDiscordLoginUrl(): string {
  return `${API_BASE_URL}/api/auth/discord`;
}

export async function getMe(): Promise<ApiMeResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/me`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiMeResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "UNAUTHORIZED",
        message: data?.message || "Authentication required.",
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

export async function logout(): Promise<{ ok: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      return { ok: false };
    }

    const data = await response.json().catch(() => null) as { ok?: boolean } | null;
    return { ok: Boolean(data?.ok) };
  } catch {
    return { ok: false };
  }
}
