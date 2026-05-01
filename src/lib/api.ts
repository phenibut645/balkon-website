import {
  AdminBotShopInput,
  AdminItemInput,
  AdminStatsResponse,
  ApiAdminBotShopMutationResponse,
  ApiAdminBotShopResponse,
  ApiAdminBroadcastNotificationResponse,
  ApiAdminEconomyAdjustResponse,
  ApiAdminItemMutationResponse,
  ApiAdminItemsResponse,
  ApiAdminRaritiesResponse,
  ApiNotificationMutationResponse,
  ApiNotificationsResponse,
  ApiNotificationsSummaryResponse,
  ApiOverviewMeResponse,
  ApiAdminSearchResponse,
  ApiBaseResponse,
  ApiBotShopResponse,
  ApiObsMediaPurchaseResponse,
  ApiObsMediaActionsResponse,
  ApiObsShopStreamerDetailsResponse,
  ApiObsShopStreamersResponse,
  ApiCraftRecipesResponse,
  ApiProfileMeResponse,
  ApiMarketForbesResponse,
  ApiInventoryResponse,
  ApiMarketResponse,
  ApiMarketCapitalizationResponse,
  ApiMeResponse,
  ApiEconomyMeResponse,
  ApiBotShopBuyResponse,
  ApiGuildOverviewResponse,
  ApiMyGuildsResponse,
  AdminEconomyAdjustInput,
  AdminBroadcastNotificationInput,
  ObsMediaActionStatus,
  UpdateUserProfileInput,
  StreamerStudioAccessibleResponse,
  StreamerStudioMeResponse,
  ApiStreamerStudioSceneItemsListResponse,
  ApiStreamerStudioScenesListResponse,
  ApiStreamerStudioTransformApplyResponse,
  ObsStudioTransformApplyInput,
} from "./types";

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
      message: "Could not reach API. Check if API server is running and CORS allows PATCH.",
    };
  }
}

export async function getMyBalance(): Promise<ApiEconomyMeResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/economy/me`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiEconomyMeResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "ECONOMY_LOAD_FAILED",
        message: data?.message || "Failed to load balance.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: false, error: "INVALID_RESPONSE", message: "Invalid API response." };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API. Is the API server running?",
    };
  }
}

export async function getOverviewMe(): Promise<ApiOverviewMeResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/overview/me`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiOverviewMeResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "OVERVIEW_LOAD_FAILED",
        message: data?.message || "Failed to load overview.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: false, error: "INVALID_RESPONSE", message: "Invalid API response." };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API. Is the API server running?",
    };
  }
}

export async function getMyGuilds(): Promise<ApiMyGuildsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/guilds/me`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiMyGuildsResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "GUILDS_LOAD_FAILED",
        message: data?.message || "Failed to load guilds.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: false, error: "INVALID_RESPONSE", message: "Invalid API response." };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API. Is the API server running?",
    };
  }
}

export async function getGuildOverview(guildId: string): Promise<ApiGuildOverviewResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/guilds/${encodeURIComponent(guildId)}/overview`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiGuildOverviewResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "GUILDS_LOAD_FAILED",
        message: data?.message || "Failed to load guild overview.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: false, error: "INVALID_RESPONSE", message: "Invalid API response." };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API. Is the API server running?",
    };
  }
}

export async function buyBotShopListing(listingId: number, amount: number): Promise<ApiBotShopBuyResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/botshop/${listingId}/buy`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });

    const data = await response.json().catch(() => null) as ApiBotShopBuyResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "BOTSHOP_BUY_FAILED",
        message: data?.message || "Purchase failed.",
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

export async function getInventory(): Promise<ApiInventoryResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/inventory`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiInventoryResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "INVENTORY_LOAD_FAILED",
        message: data?.message || "Failed to load inventory.",
      };
    }

    if (!data || typeof data !== "object") {
      return {
        ok: false,
        error: "INVALID_RESPONSE",
        message: "Invalid API response.",
      };
    }

    return data;
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function getAdminStats(): Promise<AdminStatsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as AdminStatsResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "ADMIN_STATS_LOAD_FAILED",
        message: data?.message || "Failed to load admin stats.",
      };
    }

    if (!data || typeof data !== "object") {
      return {
        ok: false,
        error: "INVALID_RESPONSE",
        message: "Invalid API response.",
      };
    }

    return data;
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function adminAdjustEconomy(input: AdminEconomyAdjustInput): Promise<ApiAdminEconomyAdjustResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/economy/adjust`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => null) as ApiAdminEconomyAdjustResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "BALANCE_ADJUST_FAILED",
        message: data?.message || "Failed to adjust balance.",
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

export async function getMarket(): Promise<ApiMarketResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/market`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiMarketResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "MARKET_LOAD_FAILED",
        message: data?.message || "Failed to load market.",
      };
    }

    if (!data || typeof data !== "object") {
      return {
        ok: false,
        error: "INVALID_RESPONSE",
        message: "Invalid API response.",
      };
    }

    return data;
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function getMarketCapitalization(days = 15): Promise<ApiMarketCapitalizationResponse> {
  try {
    const safeDays = Number.isFinite(days) ? Math.min(60, Math.max(2, Math.floor(days))) : 15;
    const response = await fetch(`${API_BASE_URL}/api/market/capitalization?days=${safeDays}`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiMarketCapitalizationResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "MARKET_CAPITALIZATION_LOAD_FAILED",
        message: data?.message || "Failed to load market capitalization.",
      };
    }

    if (!data || typeof data !== "object") {
      return {
        ok: false,
        error: "INVALID_RESPONSE",
        message: "Invalid API response.",
      };
    }

    return data;
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function getMarketForbes(limit = 10): Promise<ApiMarketForbesResponse> {
  try {
    const safeLimit = Number.isFinite(limit) ? Math.min(50, Math.max(1, Math.floor(limit))) : 10;
    const response = await fetch(`${API_BASE_URL}/api/market/forbes?limit=${safeLimit}`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiMarketForbesResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "MARKET_FORBES_LOAD_FAILED",
        message: data?.message || "Failed to load market forbes leaderboard.",
      };
    }

    if (!data || typeof data !== "object") {
      return {
        ok: false,
        error: "INVALID_RESPONSE",
        message: "Invalid API response.",
      };
    }

    return data;
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function getMyProfile(): Promise<ApiProfileMeResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiProfileMeResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "PROFILE_LOAD_FAILED",
        message: data?.message || "Failed to load profile.",
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

export async function updateMyProfile(input: UpdateUserProfileInput): Promise<ApiProfileMeResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => null) as ApiProfileMeResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "PROFILE_UPDATE_FAILED",
        message: data?.message || "Failed to update profile.",
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

export async function getBotShop(): Promise<ApiBotShopResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/botshop`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiBotShopResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "BOTSHOP_LOAD_FAILED",
        message: data?.message || "Failed to load bot shop.",
      };
    }

    if (!data || typeof data !== "object") {
      return {
        ok: false,
        error: "INVALID_RESPONSE",
        message: "Invalid API response.",
      };
    }

    return data;
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function getCraftRecipes(): Promise<ApiCraftRecipesResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/craft/recipes`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiCraftRecipesResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "CRAFT_RECIPES_LOAD_FAILED",
        message: data?.message || "Failed to load craft recipes.",
      };
    }

    if (!data || typeof data !== "object") {
      return {
        ok: false,
        error: "INVALID_RESPONSE",
        message: "Invalid API response.",
      };
    }

    return data;
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function getAdminItems(): Promise<ApiAdminItemsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/items`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiAdminItemsResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "ADMIN_ITEMS_LOAD_FAILED",
        message: data?.message || "Failed to load admin items.",
      };
    }

    if (!data || typeof data !== "object") {
      return {
        ok: false,
        error: "INVALID_RESPONSE",
        message: "Invalid API response.",
      };
    }

    return data;
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function createAdminItem(input: AdminItemInput): Promise<ApiAdminItemMutationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/items`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => null) as ApiAdminItemMutationResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "ADMIN_ITEM_CREATE_FAILED",
        message: data?.message || "Failed to create admin item.",
      };
    }

    if (!data || typeof data !== "object") {
      return {
        ok: false,
        error: "INVALID_RESPONSE",
        message: "Invalid API response.",
      };
    }

    return data;
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function updateAdminItem(itemTemplateId: number, input: AdminItemInput): Promise<ApiAdminItemMutationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/items/${itemTemplateId}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => null) as ApiAdminItemMutationResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "ADMIN_ITEM_UPDATE_FAILED",
        message: data?.message || "Failed to update admin item.",
      };
    }

    if (!data || typeof data !== "object") {
      return {
        ok: false,
        error: "INVALID_RESPONSE",
        message: "Invalid API response.",
      };
    }

    return data;
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function deleteAdminItem(itemTemplateId: number): Promise<ApiBaseResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/items/${itemTemplateId}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiBaseResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "ADMIN_ITEM_DELETE_FAILED",
        message: data?.message || "Failed to delete admin item.",
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

export async function getAdminItemRarities(): Promise<ApiAdminRaritiesResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/item-rarities`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiAdminRaritiesResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "ADMIN_RARITIES_LOAD_FAILED",
        message: data?.message || "Failed to load rarities.",
      };
    }

    if (!data || typeof data !== "object") {
      return {
        ok: false,
        error: "INVALID_RESPONSE",
        message: "Invalid API response.",
      };
    }

    return data;
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function searchAdminItemTypes(query: string): Promise<ApiAdminSearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/search/item-types?q=${encodeURIComponent(query)}`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiAdminSearchResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "ADMIN_ITEM_TYPES_SEARCH_FAILED",
        message: data?.message || "Failed to search item types.",
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

export async function searchAdminItemTemplates(query: string): Promise<ApiAdminSearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/search/item-templates?q=${encodeURIComponent(query)}`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiAdminSearchResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "ADMIN_ITEM_TEMPLATES_SEARCH_FAILED",
        message: data?.message || "Failed to search item templates.",
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

export async function getAdminBotShop(): Promise<ApiAdminBotShopResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/botshop`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiAdminBotShopResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "ADMIN_BOTSHOP_LOAD_FAILED",
        message: data?.message || "Failed to load admin bot shop.",
      };
    }

    if (!data || typeof data !== "object") {
      return {
        ok: false,
        error: "INVALID_RESPONSE",
        message: "Invalid API response.",
      };
    }

    return data;
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function upsertAdminBotShopListing(input: AdminBotShopInput): Promise<ApiAdminBotShopMutationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/botshop`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => null) as ApiAdminBotShopMutationResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "ADMIN_BOTSHOP_UPSERT_FAILED",
        message: data?.message || "Failed to save bot shop listing.",
      };
    }

    if (!data || typeof data !== "object") {
      return {
        ok: false,
        error: "INVALID_RESPONSE",
        message: "Invalid API response.",
      };
    }

    return data;
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

export async function deleteAdminBotShopListing(listingId: number): Promise<ApiBaseResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/botshop/${listingId}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiBaseResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "ADMIN_BOTSHOP_DELETE_FAILED",
        message: data?.message || "Failed to delete bot shop listing.",
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

export async function getNotifications(input: { page?: number; pageSize?: number; unreadOnly?: boolean }): Promise<ApiNotificationsResponse> {
  try {
    const page = Number.isFinite(input.page) ? Math.max(1, Math.floor(input.page!)) : 1;
    const pageSize = Number.isFinite(input.pageSize) ? Math.min(50, Math.max(1, Math.floor(input.pageSize!))) : 10;
    const unreadOnly = input.unreadOnly === true;
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      unreadOnly: unreadOnly ? "true" : "false",
    });

    const response = await fetch(`${API_BASE_URL}/api/notifications?${query.toString()}`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiNotificationsResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "NOTIFICATIONS_LOAD_FAILED",
        message: data?.message || "Failed to load notifications.",
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

export async function getObsShopStreamers(): Promise<ApiObsShopStreamersResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/shop/obs/streamers`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiObsShopStreamersResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "SHOP_OBS_STREAMERS_LOAD_FAILED",
        message: data?.message || "Failed to load OBS shop streamers.",
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

export async function getObsShopStreamerDetails(streamerId: number | string): Promise<ApiObsShopStreamerDetailsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/shop/obs/streamers/${encodeURIComponent(String(streamerId))}`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiObsShopStreamerDetailsResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "SHOP_OBS_STREAMER_DETAILS_FAILED",
        message: data?.message || "Failed to load OBS streamer details.",
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

export async function purchaseObsMedia(streamerId: number | string, productId: string): Promise<ApiObsMediaPurchaseResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/shop/obs/streamers/${encodeURIComponent(String(streamerId))}/media/${encodeURIComponent(productId)}/purchase`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 1 }),
    });

    const data = await response.json().catch(() => null) as ApiObsMediaPurchaseResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "OBS_MEDIA_PURCHASE_FAILED",
        message: data?.message || "Failed to purchase OBS media effect.",
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

export async function getMyObsMediaActions(input: { page?: number; pageSize?: number }): Promise<ApiObsMediaActionsResponse> {
  try {
    const page = Number.isFinite(input.page) ? Math.max(1, Math.floor(input.page!)) : 1;
    const pageSize = Number.isFinite(input.pageSize) ? Math.min(50, Math.max(1, Math.floor(input.pageSize!))) : 10;
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });

    const response = await fetch(`${API_BASE_URL}/api/shop/obs/media/actions?${query.toString()}`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiObsMediaActionsResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "OBS_MEDIA_ACTIONS_LOAD_FAILED",
        message: data?.message || "Failed to load OBS media history.",
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

export async function getAdminObsMediaActions(input: {
  page?: number;
  pageSize?: number;
  status?: ObsMediaActionStatus | null;
}): Promise<ApiObsMediaActionsResponse> {
  try {
    const page = Number.isFinite(input.page) ? Math.max(1, Math.floor(input.page!)) : 1;
    const pageSize = Number.isFinite(input.pageSize) ? Math.min(50, Math.max(1, Math.floor(input.pageSize!))) : 20;
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });

    if (input.status) {
      query.set("status", input.status);
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/obs/media/actions?${query.toString()}`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiObsMediaActionsResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "ADMIN_OBS_MEDIA_ACTIONS_LOAD_FAILED",
        message: data?.message || "Failed to load OBS media action diagnostics.",
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

export async function getNotificationsSummary(): Promise<ApiNotificationsSummaryResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/summary`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiNotificationsSummaryResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "NOTIFICATIONS_SUMMARY_LOAD_FAILED",
        message: data?.message || "Failed to load notifications summary.",
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

export async function markNotificationRead(notificationId: number): Promise<ApiNotificationMutationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiNotificationMutationResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "NOTIFICATION_MARK_READ_FAILED",
        message: data?.message || "Failed to mark notification as read.",
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

export async function markAllNotificationsRead(): Promise<ApiNotificationMutationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiNotificationMutationResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "NOTIFICATIONS_MARK_ALL_READ_FAILED",
        message: data?.message || "Failed to mark all notifications as read.",
      };
    }

    return data && typeof data === "object"
      ? data
      : { ok: true, updated: 0 };
  } catch {
    return {
      ok: false,
      error: "NETWORK_ERROR",
      message: "Failed to reach API.",
    };
  }
}

// ── Streamer Studio ───────────────────────────────────────────────────────────

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

export async function adminBroadcastNotification(input: AdminBroadcastNotificationInput): Promise<ApiAdminBroadcastNotificationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/notifications/broadcast`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => null) as ApiAdminBroadcastNotificationResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "ADMIN_BROADCAST_NOTIFICATION_FAILED",
        message: data?.message || "Failed to send broadcast notification.",
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

export async function searchAdminRarities(query: string): Promise<ApiAdminSearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/search/rarities?q=${encodeURIComponent(query)}`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiAdminSearchResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "ADMIN_RARITIES_SEARCH_FAILED",
        message: data?.message || "Failed to search rarities.",
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
