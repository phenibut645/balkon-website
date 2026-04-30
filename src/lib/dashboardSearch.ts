export type UserTab = "overview" | "inventory" | "market" | "botShop" | "craft" | "profile";
export type AdminTab = "adminDashboard" | "adminServers" | "adminLogs" | "adminObs" | "adminItems" | "adminBotShop";
export type DashboardTab = UserTab | AdminTab;
export type DashboardMode = "user" | "admin";
export type MarketSubTab = "overview" | "listings" | "forbes";

export type DashboardSearchDestination =
  | { kind: "userTab"; tab: UserTab }
  | { kind: "adminTab"; tab: AdminTab }
  | { kind: "marketSubtab"; subtab: MarketSubTab };

export type DashboardSearchResult = {
  key: string;
  label: string;
  breadcrumb: string;
  description?: string;
  aliases: string[];
  destination: DashboardSearchDestination;
};

export function normalizeDashboardSearchValue(value: string): string {
  return value.trim().toLowerCase().replace(/ё/g, "е");
}
