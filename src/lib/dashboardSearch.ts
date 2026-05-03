import { ShopSubTab } from "./types";

export type UserTab =
  | "overview"
  | "inventory"
  | "market"
  | "botShop"
  | "craft"
  | "jobs"
  | "profile"
  | "notifications"
  | "servers"
  | "streamerApplication"
  | "streamerStudio";
export type AdminTab = "adminDashboard" | "adminStreamers" | "adminServers" | "adminLogs" | "adminObs" | "adminItems" | "adminJobs" | "adminBotShop" | "adminEconomy" | "adminMessage";
export type DashboardTab = UserTab | AdminTab;
export type DashboardMode = "user" | "admin";
export type MarketSubTab = "overview" | "listings" | "forbes";

export type DashboardSearchDestination =
  | { kind: "userTab"; tab: UserTab }
  | { kind: "adminTab"; tab: AdminTab }
  | { kind: "marketSubtab"; subtab: MarketSubTab }
  | { kind: "shopSubtab"; subtab: ShopSubTab };

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
