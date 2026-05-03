import type {
  ApiInventoryMarketListingResponse,
  ApiInventorySellToBotResponse,
  ApiInventoryUseServiceResponse,
  ApiMarketListingBuyResponse,
  ApiMarketListingCancelResponse,
  ApiMarketListingUpdatePriceResponse,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export async function createInventoryMarketListing(inventoryItemId: number, price: number): Promise<ApiInventoryMarketListingResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/inventory/${encodeURIComponent(String(inventoryItemId))}/market-listing`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price }),
    });

    const data = await response.json().catch(() => null) as ApiInventoryMarketListingResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "MARKET_LISTING_CREATE_FAILED",
        message: data?.message || "Failed to create listing.",
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

export async function sellInventoryItemToBot(inventoryItemId: number): Promise<ApiInventorySellToBotResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/inventory/${encodeURIComponent(String(inventoryItemId))}/sell-to-bot`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const data = await response.json().catch(() => null) as ApiInventorySellToBotResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "SELL_TO_BOT_FAILED",
        message: data?.message || "Failed to sell item to bot.",
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

export async function useInventoryServiceItem(
  inventoryItemId: number,
  streamerId?: number,
): Promise<ApiInventoryUseServiceResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/inventory/${encodeURIComponent(String(inventoryItemId))}/use-service`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(streamerId ? { streamerId } : {}),
    });

    const data = await response.json().catch(() => null) as ApiInventoryUseServiceResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "INVENTORY_SERVICE_USE_FAILED",
        message: data?.message || "Failed to use service item.",
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

export async function buyMarketListing(listingId: number): Promise<ApiMarketListingBuyResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/market/${encodeURIComponent(String(listingId))}/buy`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const data = await response.json().catch(() => null) as ApiMarketListingBuyResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "MARKET_BUY_FAILED",
        message: data?.message || "Failed to buy listing.",
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

export async function updateMarketListingPrice(listingId: number, price: number): Promise<ApiMarketListingUpdatePriceResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/market/${encodeURIComponent(String(listingId))}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price }),
    });

    const data = await response.json().catch(() => null) as ApiMarketListingUpdatePriceResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "MARKET_LISTING_UPDATE_FAILED",
        message: data?.message || "Failed to update listing price.",
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

export async function cancelMarketListing(listingId: number): Promise<ApiMarketListingCancelResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/market/${encodeURIComponent(String(listingId))}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await response.json().catch(() => null) as ApiMarketListingCancelResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "MARKET_LISTING_CANCEL_FAILED",
        message: data?.message || "Failed to cancel listing.",
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
