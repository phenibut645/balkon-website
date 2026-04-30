"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buyBotShopListing, getAdminStats, getBotShop, getCraftRecipes, getDiscordLoginUrl, getInventory, getMarket, getMarketCapitalization, getMarketForbes, getMe, getMyBalance, getMyProfile, getNotifications, getNotificationsSummary, getObsShopStreamerDetails, getObsShopStreamers, logout, markAllNotificationsRead, markNotificationRead, purchaseObsMedia, updateMyProfile } from "@/lib/api";
import { AdminTab, DashboardMode, DashboardSearchResult, DashboardTab, normalizeDashboardSearchValue, MarketSubTab, UserTab } from "@/lib/dashboardSearch";
import { AdminStats, ApiMeResponse, AvailableGuild, BotShopListing, CraftRecipe, InventoryItem, MarketCapitalizationData, MarketForbesEntry, MarketListing, NotificationItem, ObsMediaProduct, ObsShopStreamer, ShopSubTab, UserBalance, UserPublicProfile } from "@/lib/types";
import { DASHBOARD_TEXT, DATE_LOCALE_BY_LANGUAGE, LanguageCode } from "@/lib/dashboardText";
import { AppHeader } from "@/components/dashboard/AppHeader";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { ProfileDropdown } from "@/components/dashboard/ProfileDropdown";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { InventoryPanel } from "@/components/dashboard/InventoryPanel";
import { MarketPanel } from "@/components/dashboard/MarketPanel";
import { BotShopPanel } from "@/components/dashboard/BotShopPanel";
import { CraftPanel } from "@/components/dashboard/CraftPanel";
import { NotificationsPanel } from "@/components/dashboard/NotificationsPanel";
import { AdminDashboardPanel } from "@/components/dashboard/AdminDashboardPanel";
import { AdminLogsPanel } from "@/components/dashboard/AdminLogsPanel";
import { AdminObsPanel } from "@/components/dashboard/AdminObsPanel";
import { AdminItemsPanel } from "@/components/dashboard/AdminItemsPanel";
import { AdminBotShopPanel } from "@/components/dashboard/AdminBotShopPanel";
import { AdminBroadcastPanel } from "@/components/dashboard/AdminBroadcastPanel";
import { AdminEconomyPanel } from "@/components/dashboard/AdminEconomyPanel";
import { PlaceholderPanel } from "@/components/dashboard/PlaceholderPanel";
import { ProfileSettingsPanel } from "@/components/dashboard/ProfileSettingsPanel";
import { useSafePolling } from "@/hooks/useSafePolling";
import { areJsonEqual } from "@/lib/shallowDataEqual";

type AuthState = "loading" | "guest" | "user";
type BotUiStatus = "online" | "offline" | "development";
type InventoryFilter = "all" | "materials" | "sellable" | "tradeable";
type LoadOptions = {
  silent?: boolean;
  force?: boolean;
};

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "v0.1.0";
const BOT_UI_STATUS: BotUiStatus = (
  (process.env.NEXT_PUBLIC_BOT_UI_STATUS || "online").toLowerCase() === "offline"
    ? "offline"
    : (process.env.NEXT_PUBLIC_BOT_UI_STATUS || "online").toLowerCase() === "development"
      ? "development"
      : "online"
);
const LOADING_GIFS = [
  "https://media.tenor.com/chNGPcAXt4QAAAAd/pirat.gif",
  "https://media.tenor.com/SxzG9vFWtTcAAAAM/zxc-cat.gif",
  "https://images6.fanpop.com/image/photos/41000000/Ken-Kaneki-tokyo-ghoul-GIF-anime-41018150-500-395.gif",
];

export default function HomePage() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [meResponse, setMeResponse] = useState<ApiMeResponse | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>("user");
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [marketListings, setMarketListings] = useState<MarketListing[]>([]);
  const [marketLoaded, setMarketLoaded] = useState(false);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [marketCapitalization, setMarketCapitalization] = useState<MarketCapitalizationData | null>(null);
  const [marketCapitalizationLoaded, setMarketCapitalizationLoaded] = useState(false);
  const [marketCapitalizationLoading, setMarketCapitalizationLoading] = useState(false);
  const [marketCapitalizationError, setMarketCapitalizationError] = useState<string | null>(null);
  const [marketForbes, setMarketForbes] = useState<MarketForbesEntry[]>([]);
  const [marketForbesLoaded, setMarketForbesLoaded] = useState(false);
  const [marketForbesLoading, setMarketForbesLoading] = useState(false);
  const [marketForbesError, setMarketForbesError] = useState<string | null>(null);
  const [botShopListings, setBotShopListings] = useState<BotShopListing[]>([]);
  const [botShopLoaded, setBotShopLoaded] = useState(false);
  const [botShopLoading, setBotShopLoading] = useState(false);
  const [botShopError, setBotShopError] = useState<string | null>(null);
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [balanceLoaded, setBalanceLoaded] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [buyingListingId, setBuyingListingId] = useState<number | null>(null);
  const [buyFeedback, setBuyFeedback] = useState<Record<number, string>>({});
  const [buyErrors, setBuyErrors] = useState<Record<number, string>>({});
  const [craftRecipes, setCraftRecipes] = useState<CraftRecipe[]>([]);
  const [craftLoaded, setCraftLoaded] = useState(false);
  const [craftLoading, setCraftLoading] = useState(false);
  const [craftError, setCraftError] = useState<string | null>(null);
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>("all");
  const [canUseAdminMode, setCanUseAdminMode] = useState(false);
  const [adminProbeDone, setAdminProbeDone] = useState(false);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminStatsLoading, setAdminStatsLoading] = useState(false);
  const [adminStatsError, setAdminStatsError] = useState<string | null>(null);
  const [language, setLanguage] = useState<LanguageCode>("ru");
  const [streamerMode, setStreamerMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [marketSubTab, setMarketSubTab] = useState<MarketSubTab>("overview");
  const [shopSubTab, setShopSubTab] = useState<ShopSubTab>("overview");
  const [profileData, setProfileData] = useState<UserPublicProfile | null>(null);
  const [profileGuilds, setProfileGuilds] = useState<AvailableGuild[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaveLoading, setProfileSaveLoading] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [profileHomeGuildIdDraft, setProfileHomeGuildIdDraft] = useState("");
  const [profileDescriptionDraft, setProfileDescriptionDraft] = useState("");
  const [notificationsSummary, setNotificationsSummary] = useState<{ unreadCount: number; latest: NotificationItem[] }>({ unreadCount: 0, latest: [] });
  const [notificationsSummaryLoading, setNotificationsSummaryLoading] = useState(false);
  const [notificationsSummaryError, setNotificationsSummaryError] = useState<string | null>(null);
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notificationPage, setNotificationPage] = useState(1);
  const [notificationPageSize] = useState(6);
  const [notificationTotal, setNotificationTotal] = useState(0);
  const [notificationFilterUnreadOnly, setNotificationFilterUnreadOnly] = useState(false);
  const [obsShopStreamers, setObsShopStreamers] = useState<ObsShopStreamer[]>([]);
  const [obsShopStreamersLoaded, setObsShopStreamersLoaded] = useState(false);
  const [obsShopStreamersLoading, setObsShopStreamersLoading] = useState(false);
  const [obsShopStreamersError, setObsShopStreamersError] = useState<string | null>(null);
  const [obsShopMediaProducts, setObsShopMediaProducts] = useState<ObsMediaProduct[]>([]);
  const [obsShopStreamerDetailsLoading, setObsShopStreamerDetailsLoading] = useState(false);
  const [obsShopStreamerDetailsError, setObsShopStreamerDetailsError] = useState<string | null>(null);
  const [buyingObsProductId, setBuyingObsProductId] = useState<string | null>(null);
  const [obsBuyFeedback, setObsBuyFeedback] = useState<Record<string, string>>({});
  const [obsBuyErrors, setObsBuyErrors] = useState<Record<string, string>>({});
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsSummaryLoadingRef = useRef(false);
  const notificationsSummaryLastLoadedAtRef = useRef(0);
  const notificationsLoadingRef = useRef(false);

  const user = meResponse?.me;
  const roles = useMemo(() => user?.roles ?? [], [user?.roles]);
  const t = DASHBOARD_TEXT[language];

  const statusText = useMemo(() => {
    if (BOT_UI_STATUS === "offline") {
      return t.statusOffline;
    }
    if (BOT_UI_STATUS === "development") {
      return t.statusDevelopment;
    }
    return t.statusOnline;
  }, [t]);

  const inventoryFilterItems = useMemo(() => ([
    { id: "all" as const, label: t.inventoryFilterAll },
    { id: "materials" as const, label: t.inventoryFilterMaterials },
    { id: "sellable" as const, label: t.inventoryFilterSellable },
    { id: "tradeable" as const, label: t.inventoryFilterTradeable },
  ]), [t]);

  const searchResults = useMemo(() => {
    const query = normalizeDashboardSearchValue(searchQuery);
    if (!query) {
      return [] as DashboardSearchResult[];
    }

    const commonUserTabResults: DashboardSearchResult[] = [
      {
        key: "tab:overview",
        label: t.tabOverview,
        breadcrumb: t.tabOverview,
        aliases: ["overview", "home", "главная", "обзор", "avaleht", "ulevaade"],
        destination: { kind: "userTab", tab: "overview" },
      },
      {
        key: "tab:market",
        label: t.tabMarket,
        breadcrumb: t.tabMarket,
        aliases: ["market", "рынок", "turg", "marketplace"],
        destination: { kind: "userTab", tab: "market" },
      },
      {
        key: "market:overview",
        label: `${t.tabMarket} → ${t.marketOverview}`,
        breadcrumb: `${t.tabMarket} → ${t.marketOverview}`,
        description: t.marketOverviewSearchDescription,
        aliases: [
          "рынок",
          "обзор рынка",
          "график",
          "капитализация",
          "экономика",
          "odm",
          "валюта",
          "статистика",
          "market",
          "overview",
          "chart",
          "capitalization",
          "economy",
          "currency",
          "stats",
          "turg",
          "ulevaade",
          "ülevaade",
          "graafik",
          "kapitalisatsioon",
          "majandus",
          "valuuta",
        ],
        destination: { kind: "marketSubtab", subtab: "overview" },
      },
      {
        key: "market:listings",
        label: `${t.tabMarket} → ${t.marketListings}`,
        breadcrumb: `${t.tabMarket} → ${t.marketListings}`,
        description: t.marketListingsSearchDescription,
        aliases: [
          "рынок",
          "предметы",
          "товары",
          "листинги",
          "продажи",
          "купить",
          "покупка",
          "цена",
          "market",
          "listings",
          "items",
          "goods",
          "sales",
          "buy",
          "purchase",
          "price",
          "turg",
          "esemed",
          "ost",
          "osta",
          "müük",
          "hind",
        ],
        destination: { kind: "marketSubtab", subtab: "listings" },
      },
      {
        key: "market:forbes",
        label: `${t.tabMarket} → ${t.marketForbes}`,
        breadcrumb: `${t.tabMarket} → ${t.marketForbes}`,
        description: t.marketForbesSearchDescription,
        aliases: [
          "форбс",
          "балкон форбс",
          "топ",
          "топ 10",
          "богатые",
          "богачи",
          "рейтинг",
          "лидерборд",
          "капитал",
          "деньги",
          "forbes",
          "top",
          "top 10",
          "richest",
          "rich",
          "leaderboard",
          "ranking",
          "money",
          "edetabel",
          "rikkad",
          "raha",
        ],
        destination: { kind: "marketSubtab", subtab: "forbes" },
      },
      {
        key: "tab:botShop",
        label: t.tabBotShop,
        breadcrumb: t.tabBotShop,
        description: t.botShopSearchDescription,
        aliases: [
          "магазин",
          "бот магазин",
          "купить",
          "покупка",
          "бот",
          "товары",
          "shop",
          "bot shop",
          "buy",
          "purchase",
          "bot",
          "store",
          "pood",
          "botipood",
          "ost",
          "osta",
        ],
        destination: { kind: "userTab", tab: "botShop" },
      },
      {
        key: "shop:items",
        label: `${t.tabBotShop} → ${t.shopItems}`,
        breadcrumb: `${t.tabBotShop} → ${t.shopItems}`,
        description: t.botShopSearchDescription,
        aliases: ["купить", "магазин", "товары", "shop", "items", "buy"],
        destination: { kind: "shopSubtab", subtab: "items" },
      },
      {
        key: "shop:cases",
        label: `${t.tabBotShop} → ${t.shopCases}`,
        breadcrumb: `${t.tabBotShop} → ${t.shopCases}`,
        description: t.shopCasesSoon,
        aliases: ["кейсы", "case", "cases"],
        destination: { kind: "shopSubtab", subtab: "cases" },
      },
      {
        key: "shop:obs",
        label: `${t.tabBotShop} → ${t.shopObs}`,
        breadcrumb: `${t.tabBotShop} → ${t.shopObs}`,
        description: t.obsMediaDescription,
        aliases: ["obs", "обс", "стример", "стримеры", "твич", "twitch", "media", "медиа", "показать картинку", "гифка"],
        destination: { kind: "shopSubtab", subtab: "obs" },
      },
      {
        key: "tab:inventory",
        label: t.tabInventory,
        breadcrumb: t.tabInventory,
        description: t.inventorySearchDescription,
        aliases: [
          "инвентарь",
          "предметы",
          "мои предметы",
          "продать",
          "продать боту",
          "передать",
          "inventory",
          "items",
          "my items",
          "sell",
          "sell to bot",
          "transfer",
          "inventar",
          "esemed",
          "müü",
          "ülekanne",
        ],
        destination: { kind: "userTab", tab: "inventory" },
      },
      {
        key: "tab:craft",
        label: t.tabCraft,
        breadcrumb: t.tabCraft,
        description: t.craftSearchDescription,
        aliases: ["крафт", "рецепты", "создать предмет", "craft", "recipes", "crafting", "retseptid"],
        destination: { kind: "userTab", tab: "craft" },
      },
      {
        key: "tab:profile",
        label: t.tabProfile,
        breadcrumb: t.tabProfile,
        description: t.profileSearchDescription,
        aliases: ["профиль", "аккаунт", "дискорд", "profile", "account", "discord", "profiil", "konto"],
        destination: { kind: "userTab", tab: "profile" },
      },
      {
        key: "tab:notifications",
        label: t.tabNotifications,
        breadcrumb: t.tabNotifications,
        description: t.notifications,
        aliases: ["уведомления", "нотификации", "сообщения", "alerts", "notifications", "teavitused"],
        destination: { kind: "userTab", tab: "notifications" },
      },
    ];

    const adminResults: DashboardSearchResult[] = [
      { key: "tab:adminDashboard", label: t.adminTabDashboard, breadcrumb: t.adminTabDashboard, aliases: ["dashboard", "admin", "панель", "paneel"], destination: { kind: "adminTab", tab: "adminDashboard" } },
      { key: "tab:adminServers", label: t.adminTabServers, breadcrumb: t.adminTabServers, aliases: ["servers", "серверы", "serverid"], destination: { kind: "adminTab", tab: "adminServers" } },
      { key: "tab:adminLogs", label: t.adminTabLogs, breadcrumb: t.adminTabLogs, aliases: ["logs", "логи", "logid"], destination: { kind: "adminTab", tab: "adminLogs" } },
      { key: "tab:adminObs", label: t.adminTabObs, breadcrumb: t.adminTabObs, aliases: ["obs", "scene", "сцены"], destination: { kind: "adminTab", tab: "adminObs" } },
      { key: "tab:adminItems", label: t.adminTabItems, breadcrumb: t.adminTabItems, aliases: ["items", "предметы", "esemed"], destination: { kind: "adminTab", tab: "adminItems" } },
      { key: "tab:adminBotShop", label: t.adminTabBotShop, breadcrumb: t.adminTabBotShop, aliases: ["shop", "магазин", "pood"], destination: { kind: "adminTab", tab: "adminBotShop" } },
      { key: "tab:adminEconomy", label: t.adminEconomy, breadcrumb: t.adminEconomy, aliases: ["валюта", "выдать валюту", "деньги", "odm", "ldm", "баланс", "currency", "balance", "give money", "valuuta", "raha"], destination: { kind: "adminTab", tab: "adminEconomy" } },
      { key: "tab:adminMessage", label: t.adminBroadcast, breadcrumb: t.adminBroadcast, aliases: ["создать сообщение", "рассылка", "broadcast", "announcement"], destination: { kind: "adminTab", tab: "adminMessage" } },
    ];

    const searchPool = dashboardMode === "admin" && canUseAdminMode ? adminResults : commonUserTabResults;

    const scored = searchPool
      .map(item => {
        const normalizedLabel = normalizeDashboardSearchValue(item.label);
        const normalizedDescription = normalizeDashboardSearchValue(item.description || "");
        const normalizedAliases = item.aliases.map(alias => normalizeDashboardSearchValue(alias));

        let score = Number.MAX_SAFE_INTEGER;
        if (normalizedLabel.includes(query)) {
          score = 0;
        } else if (normalizedAliases.some(alias => alias.includes(query))) {
          score = 1;
        } else if (normalizedDescription.includes(query)) {
          score = 2;
        }

        return { item, score };
      })
      .filter(entry => entry.score !== Number.MAX_SAFE_INTEGER)
      .sort((a, b) => {
        if (a.score !== b.score) {
          return a.score - b.score;
        }
        return a.item.label.localeCompare(b.item.label);
      })
      .slice(0, 8)
      .map(entry => entry.item);

    return scored;
  }, [canUseAdminMode, dashboardMode, searchQuery, t]);

  const filteredInventory = useMemo(() => {
    if (inventoryFilter === "materials") {
      return inventory.filter(item => String(item.itemType).toLowerCase() === "material");
    }
    if (inventoryFilter === "sellable") {
      return inventory.filter(item => item.sellable === true);
    }
    if (inventoryFilter === "tradeable") {
      return inventory.filter(item => item.tradeable === true);
    }
    return inventory;
  }, [inventory, inventoryFilter]);

  const inventoryEmptyText = useMemo(() => {
    if (inventoryFilter === "materials") {
      return t.noMaterialsItems;
    }
    if (inventoryFilter === "sellable") {
      return t.noSellableItems;
    }
    if (inventoryFilter === "tradeable") {
      return t.noTradeableItems;
    }
    return t.inventoryEmpty;
  }, [inventoryFilter, t]);

  async function refreshMe(): Promise<void> {
    setAuthState("loading");
    setAvatarFailed(false);
    const me = await getMe();
    setMeResponse(me);
    setAuthState(me.ok && me.me ? "user" : "guest");
  }

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("balkon.language");
    if (savedLanguage === "ru" || savedLanguage === "en" || savedLanguage === "et") {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("balkon.language", language);
  }, [language]);

  useEffect(() => {
    const savedStreamerMode = window.localStorage.getItem("balkon.streamerMode");
    if (savedStreamerMode === "1") {
      setStreamerMode(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("balkon.streamerMode", streamerMode ? "1" : "0");
  }, [streamerMode]);

  useEffect(() => {
    void refreshMe();
  }, []);

  async function handleLogout(): Promise<void> {
    setIsLoggingOut(true);
    await logout();
    setActiveTab("overview");
    setInventory([]);
    setInventoryLoaded(false);
    setInventoryLoading(false);
    setInventoryError(null);
    setMarketListings([]);
    setMarketLoaded(false);
    setMarketLoading(false);
    setMarketError(null);
    setMarketCapitalization(null);
    setMarketCapitalizationLoaded(false);
    setMarketCapitalizationLoading(false);
    setMarketCapitalizationError(null);
    setMarketForbes([]);
    setMarketForbesLoaded(false);
    setMarketForbesLoading(false);
    setMarketForbesError(null);
    setBotShopListings([]);
    setBotShopLoaded(false);
    setBotShopLoading(false);
    setBotShopError(null);
    setBalance(null);
    setBalanceLoaded(false);
    setBalanceLoading(false);
    setBalanceError(null);
    setBuyingListingId(null);
    setBuyFeedback({});
    setBuyErrors({});
    setCraftRecipes([]);
    setCraftLoaded(false);
    setCraftLoading(false);
    setCraftError(null);
    setProfileData(null);
    setProfileGuilds([]);
    setProfileLoaded(false);
    setProfileLoading(false);
    setProfileError(null);
    setProfileSaveLoading(false);
    setProfileFeedback(null);
    setProfileHomeGuildIdDraft("");
    setProfileDescriptionDraft("");
    setNotificationsSummary({ unreadCount: 0, latest: [] });
    setNotificationsSummaryLoading(false);
    setNotificationsSummaryError(null);
    setNotificationsList([]);
    setNotificationsLoaded(false);
    setNotificationsLoading(false);
    setNotificationsError(null);
    setNotificationPage(1);
    setNotificationTotal(0);
    setNotificationFilterUnreadOnly(false);
    setObsShopStreamers([]);
    setObsShopStreamersLoaded(false);
    setObsShopStreamersLoading(false);
    setObsShopStreamersError(null);
    setObsShopMediaProducts([]);
    setObsShopStreamerDetailsLoading(false);
    setObsShopStreamerDetailsError(null);
    setBuyingObsProductId(null);
    setObsBuyFeedback({});
    setObsBuyErrors({});
    notificationsSummaryLoadingRef.current = false;
    notificationsSummaryLastLoadedAtRef.current = 0;
    notificationsLoadingRef.current = false;
    setMarketSubTab("overview");
    setShopSubTab("overview");
    setDashboardMode("user");
    setCanUseAdminMode(false);
    setAdminProbeDone(false);
    setAdminStats(null);
    setAdminStatsLoading(false);
    setAdminStatsError(null);
    await refreshMe();
    setIsLoggingOut(false);
  }

  const loadAdminStats = useCallback(async (silent = false): Promise<void> => {
    if (!silent) {
      setAdminStatsLoading(true);
      setAdminStatsError(null);
    }

    const response = await getAdminStats();
    if (response.ok && response.stats) {
      const nextStats = response.stats;
      setCanUseAdminMode(true);
      setAdminStats(prev => (areJsonEqual(prev, nextStats) ? prev : nextStats));
      setAdminStatsError(null);
      if (!silent) {
        setAdminStatsLoading(false);
      }
      return;
    }

    if (!silent) {
      setCanUseAdminMode(false);
      setAdminStats(null);
      setAdminStatsLoading(false);
      setAdminStatsError(response.message || t.adminStatsError);
    }
  }, [t.adminStatsError]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent): void {
      if (!profileMenuOpen) {
        return;
      }

      const container = profileMenuRef.current;
      if (container && !container.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [profileMenuOpen]);

  const loadInventory = useCallback(async (options: LoadOptions = {}): Promise<void> => {
    const silent = options.silent === true;
    if (inventoryLoading) {
      return;
    }

    if (!silent) {
      setInventoryLoading(true);
      setInventoryError(null);
    }

    const response = await getInventory();
    if (response.ok && Array.isArray(response.items)) {
      const nextItems = response.items;
      setInventory(prev => (areJsonEqual(prev, nextItems) ? prev : nextItems));
      setInventoryLoaded(true);
      setInventoryError(null);
      if (!silent) {
        setInventoryLoading(false);
      }
      return;
    }

    if (!silent) {
      setInventory([]);
      setInventoryLoaded(true);
      setInventoryLoading(false);
      setInventoryError(response.message || response.error || "Failed to load inventory.");
    }
  }, [inventoryLoading]);

  const loadMarket = useCallback(async (options: LoadOptions = {}): Promise<void> => {
    const silent = options.silent === true;
    if (marketLoading) {
      return;
    }

    if (!silent) {
      setMarketLoading(true);
      setMarketError(null);
    }

    const response = await getMarket();
    if (response.ok && Array.isArray(response.listings)) {
      const nextListings = response.listings;
      setMarketListings(prev => (areJsonEqual(prev, nextListings) ? prev : nextListings));
      setMarketLoaded(true);
      setMarketError(null);
      if (!silent) {
        setMarketLoading(false);
      }
      return;
    }

    if (!silent) {
      setMarketListings([]);
      setMarketLoaded(true);
      setMarketLoading(false);
      setMarketError(response.message || response.error || t.marketError);
    }
  }, [marketLoading, t.marketError]);

  const loadMarketCapitalization = useCallback(async (options: LoadOptions = {}): Promise<void> => {
    const silent = options.silent === true;
    if (marketCapitalizationLoading) {
      return;
    }

    if (!silent) {
      setMarketCapitalizationLoading(true);
      setMarketCapitalizationError(null);
    }

    const response = await getMarketCapitalization(15);
    if (response.ok && response.capitalization) {
      const nextCapitalization = response.capitalization;
      setMarketCapitalization(prev => (areJsonEqual(prev, nextCapitalization) ? prev : nextCapitalization));
      setMarketCapitalizationLoaded(true);
      setMarketCapitalizationError(null);
      if (!silent) {
        setMarketCapitalizationLoading(false);
      }
      return;
    }

    if (!silent) {
      setMarketCapitalization(null);
      setMarketCapitalizationLoaded(true);
      setMarketCapitalizationLoading(false);
      setMarketCapitalizationError(response.message || response.error || t.capitalizationError);
    }
  }, [marketCapitalizationLoading, t.capitalizationError]);

  const loadBotShop = useCallback(async (options: LoadOptions = {}): Promise<void> => {
    const silent = options.silent === true;
    if (botShopLoading) {
      return;
    }

    if (!silent) {
      setBotShopLoading(true);
      setBotShopError(null);
    }

    const response = await getBotShop();
    if (response.ok && Array.isArray(response.listings)) {
      const nextListings = response.listings;
      setBotShopListings(prev => (areJsonEqual(prev, nextListings) ? prev : nextListings));
      setBotShopLoaded(true);
      setBotShopError(null);
      if (!silent) {
        setBotShopLoading(false);
      }
      return;
    }

    if (!silent) {
      setBotShopListings([]);
      setBotShopLoaded(true);
      setBotShopLoading(false);
      setBotShopError(response.message || response.error || t.botShopError);
    }
  }, [botShopLoading, t.botShopError]);

  const loadObsShopStreamers = useCallback(async (options: LoadOptions = {}): Promise<void> => {
    const silent = options.silent === true;
    if (obsShopStreamersLoading) {
      return;
    }

    if (!silent) {
      setObsShopStreamersLoading(true);
      setObsShopStreamersError(null);
    }

    const response = await getObsShopStreamers();
    if (response.ok && Array.isArray(response.streamers)) {
      const nextStreamers = response.streamers;
      setObsShopStreamers(prev => (areJsonEqual(prev, nextStreamers) ? prev : nextStreamers));
      setObsShopStreamersLoaded(true);
      setObsShopStreamersError(null);
      if (!silent) {
        setObsShopStreamersLoading(false);
      }
      return;
    }

    if (!silent) {
      setObsShopStreamersLoading(false);
      setObsShopStreamersError(response.message || response.error || t.shopObsError);
    }
  }, [obsShopStreamersLoading, t.shopObsError]);

  const loadObsShopStreamerDetails = useCallback(async (streamerId: number | string, options: LoadOptions = {}): Promise<void> => {
    const silent = options.silent === true;
    if (obsShopStreamerDetailsLoading) {
      return;
    }

    if (!silent) {
      setObsShopStreamerDetailsLoading(true);
      setObsShopStreamerDetailsError(null);
    }

    const response = await getObsShopStreamerDetails(streamerId);
    if (response.ok && response.streamer && Array.isArray(response.mediaProducts)) {
      const nextStreamer = response.streamer;
      const nextProducts = response.mediaProducts;

      setObsShopMediaProducts(prev => (areJsonEqual(prev, nextProducts) ? prev : nextProducts));
      setObsShopStreamers(prev => {
        const next = prev.map(item => (String(item.streamerId) === String(nextStreamer.streamerId) ? nextStreamer : item));
        return areJsonEqual(prev, next) ? prev : next;
      });
      setObsShopStreamerDetailsError(null);
      if (!silent) {
        setObsShopStreamerDetailsLoading(false);
      }
      return;
    }

    if (!silent) {
      setObsShopStreamerDetailsLoading(false);
      setObsShopStreamerDetailsError(response.message || response.error || t.shopObsError);
    }
  }, [obsShopStreamerDetailsLoading, t.shopObsError]);

  const loadMarketForbes = useCallback(async (options: LoadOptions = {}): Promise<void> => {
    const silent = options.silent === true;
    if (marketForbesLoading) {
      return;
    }

    if (!silent) {
      setMarketForbesLoading(true);
      setMarketForbesError(null);
    }

    const response = await getMarketForbes(10);
    if (response.ok && Array.isArray(response.leaderboard)) {
      const nextLeaderboard = response.leaderboard;
      setMarketForbes(prev => (areJsonEqual(prev, nextLeaderboard) ? prev : nextLeaderboard));
      setMarketForbesLoaded(true);
      setMarketForbesError(null);
      if (!silent) {
        setMarketForbesLoading(false);
      }
      return;
    }

    if (!silent) {
      setMarketForbes([]);
      setMarketForbesLoaded(true);
      setMarketForbesLoading(false);
      setMarketForbesError(response.message || response.error || t.marketForbesError);
    }
  }, [marketForbesLoading, t.marketForbesError]);

  const loadProfile = useCallback(async (): Promise<void> => {
    if (profileLoading) {
      return;
    }

    setProfileLoading(true);
    setProfileError(null);

    const response = await getMyProfile();
    if (response.ok && response.profile) {
      setProfileData(response.profile);
      setProfileGuilds(response.availableGuilds || []);
      setProfileHomeGuildIdDraft(response.profile.homeGuildId || "");
      setProfileDescriptionDraft(response.profile.publicDescription || "");
      setProfileLoaded(true);
      setProfileLoading(false);
      return;
    }

    setProfileData(null);
    setProfileGuilds([]);
    setProfileLoaded(true);
    setProfileLoading(false);
    setProfileError(
      response.error === "NETWORK_ERROR"
        ? t.apiReachFailedHint
        : (response.message || response.error || t.profileSaveFailed),
    );
  }, [profileLoading, t.apiReachFailedHint, t.profileSaveFailed]);

  const loadNotificationsSummary = useCallback(async (options: LoadOptions = {}): Promise<void> => {
    const silent = options.silent === true;
    const force = options.force === true;
    if (notificationsSummaryLoadingRef.current) {
      return;
    }

    if (!force && Date.now() - notificationsSummaryLastLoadedAtRef.current < 1500) {
      return;
    }

    notificationsSummaryLoadingRef.current = true;
    if (!silent) {
      setNotificationsSummaryLoading(true);
      setNotificationsSummaryError(null);
    }

    try {
      const response = await getNotificationsSummary();
      notificationsSummaryLastLoadedAtRef.current = Date.now();

      if (response.ok) {
        const nextSummary = {
          unreadCount: Number(response.unreadCount ?? 0),
          latest: Array.isArray(response.latest) ? response.latest : [],
        };
        setNotificationsSummary(prev => (areJsonEqual(prev, nextSummary) ? prev : nextSummary));
        setNotificationsSummaryError(null);
        return;
      }

      if (!silent) {
        setNotificationsSummaryError(response.message || response.error || t.notificationError);
      }
    } finally {
      notificationsSummaryLoadingRef.current = false;
      if (!silent) {
        setNotificationsSummaryLoading(false);
      }
    }
  }, [t.notificationError]);

  const loadNotifications = useCallback(async (page = notificationPage, unreadOnly = notificationFilterUnreadOnly, options: LoadOptions = {}): Promise<void> => {
    const silent = options.silent === true;
    if (notificationsLoadingRef.current) {
      return;
    }

    notificationsLoadingRef.current = true;
    if (!silent) {
      setNotificationsLoading(true);
      setNotificationsError(null);
    }

    try {
      const response = await getNotifications({
        page,
        pageSize: notificationPageSize,
        unreadOnly,
      });

      if (response.ok && Array.isArray(response.notifications)) {
        const nextNotifications = response.notifications;
        const nextPage = response.page || page;
        const nextTotal = response.total || 0;

        setNotificationsList(prev => (areJsonEqual(prev, nextNotifications) ? prev : nextNotifications));
        setNotificationPage(prev => (prev === nextPage ? prev : nextPage));
        setNotificationTotal(prev => (prev === nextTotal ? prev : nextTotal));
        setNotificationsLoaded(true);
        setNotificationsError(null);
        return;
      }

      if (!silent) {
        setNotificationsList([]);
        setNotificationsLoaded(true);
        setNotificationsError(response.message || response.error || t.notificationError);
      }
    } finally {
      notificationsLoadingRef.current = false;
      if (!silent) {
        setNotificationsLoading(false);
      }
    }
  }, [notificationFilterUnreadOnly, notificationPage, notificationPageSize, t.notificationError]);

  const handleMarkNotificationRead = useCallback(async (id: number): Promise<void> => {
    const response = await markNotificationRead(id);
    if (!response.ok) {
      setNotificationsError(response.message || response.error || t.notificationError);
      return;
    }

    await loadNotificationsSummary({ force: true, silent: true });
    if (activeTab === "notifications") {
      await loadNotifications(notificationPage, notificationFilterUnreadOnly, { silent: true });
    }
  }, [activeTab, loadNotifications, loadNotificationsSummary, notificationFilterUnreadOnly, notificationPage, t.notificationError]);

  const handleMarkAllNotificationsRead = useCallback(async (): Promise<void> => {
    const response = await markAllNotificationsRead();
    if (!response.ok) {
      setNotificationsError(response.message || response.error || t.notificationError);
      return;
    }

    await loadNotificationsSummary({ force: true, silent: true });
    if (activeTab === "notifications") {
      await loadNotifications(notificationPage, notificationFilterUnreadOnly, { silent: true });
    }
  }, [activeTab, loadNotifications, loadNotificationsSummary, notificationFilterUnreadOnly, notificationPage, t.notificationError]);

  const saveProfile = useCallback(async (): Promise<void> => {
    setProfileSaveLoading(true);
    setProfileError(null);
    setProfileFeedback(null);

    const response = await updateMyProfile({
      homeGuildId: profileHomeGuildIdDraft || null,
      publicDescription: profileDescriptionDraft.trim() ? profileDescriptionDraft.trim() : null,
    });

    if (response.ok && response.profile) {
      setProfileData(response.profile);
      setProfileGuilds(response.availableGuilds || profileGuilds);
      setProfileHomeGuildIdDraft(response.profile.homeGuildId || "");
      setProfileDescriptionDraft(response.profile.publicDescription || "");
      setProfileFeedback(t.profileSaved);
      setProfileSaveLoading(false);
      return;
    }

    setProfileError(
      response.error === "NETWORK_ERROR"
        ? t.apiReachFailedHint
        : (response.message || response.error || t.profileSaveFailed),
    );
    setProfileSaveLoading(false);
  }, [profileDescriptionDraft, profileGuilds, profileHomeGuildIdDraft, t.apiReachFailedHint, t.profileSaveFailed, t.profileSaved]);

  const loadBalance = useCallback(async (options: LoadOptions = {}): Promise<void> => {
    const silent = options.silent === true;
    if (balanceLoading) {
      return;
    }

    if (!silent) {
      setBalanceLoading(true);
      setBalanceError(null);
    }

    const response = await getMyBalance();
    if (response.ok && response.balance) {
      const nextBalance = response.balance;
      setBalance(prev => (areJsonEqual(prev, nextBalance) ? prev : nextBalance));
      setBalanceLoaded(true);
      setBalanceError(null);
      if (!silent) {
        setBalanceLoading(false);
      }
      return;
    }

    if (!silent) {
      setBalance(null);
      setBalanceLoaded(true);
      setBalanceLoading(false);
      setBalanceError(response.message || response.error || t.balanceLoadFailed);
    }
  }, [balanceLoading, t.balanceLoadFailed]);

  const handleBuyBotShopListing = useCallback(async (listingId: number, amount: number): Promise<void> => {
    if (!Number.isInteger(amount) || amount <= 0) {
      setBuyErrors(prev => ({ ...prev, [listingId]: "Amount must be a positive integer." }));
      return;
    }

    setBuyingListingId(listingId);
    setBuyFeedback(prev => ({ ...prev, [listingId]: "" }));
    setBuyErrors(prev => ({ ...prev, [listingId]: "" }));

    const response = await buyBotShopListing(listingId, amount);
    if (!response.ok) {
      setBuyErrors(prev => ({ ...prev, [listingId]: response.message || t.purchaseFailed }));
      setBuyingListingId(null);
      return;
    }

    setBuyFeedback(prev => ({ ...prev, [listingId]: t.purchaseSuccess }));
    setBuyingListingId(null);

    await loadBalance();
    if (inventoryLoaded) {
      await loadInventory();
    } else {
      setInventoryLoaded(false);
    }
  }, [inventoryLoaded, loadBalance, loadInventory, t.purchaseFailed, t.purchaseSuccess]);

  const handleBuyObsMediaProduct = useCallback(async (streamerId: number | string, productId: string): Promise<void> => {
    const product = obsShopMediaProducts.find(item => item.id === productId);
    if (!product) {
      setObsBuyErrors(prev => ({ ...prev, [productId]: t.obsMediaPurchaseFailed }));
      return;
    }

    setBuyingObsProductId(productId);
    setObsBuyFeedback(prev => ({ ...prev, [productId]: "" }));
    setObsBuyErrors(prev => ({ ...prev, [productId]: "" }));

    const response = await purchaseObsMedia(streamerId, productId);
    if (!response.ok) {
      setObsBuyErrors(prev => ({ ...prev, [productId]: response.message || t.obsMediaPurchaseFailed }));
      setBuyingObsProductId(null);
      return;
    }

    setObsBuyFeedback(prev => ({ ...prev, [productId]: t.obsMediaPurchaseSuccess }));
    setBuyingObsProductId(null);

    await loadBalance();
    await loadNotificationsSummary({ force: true, silent: true });
  }, [loadBalance, loadNotificationsSummary, obsShopMediaProducts, t.obsMediaPurchaseFailed, t.obsMediaPurchaseSuccess]);

  const loadCraftRecipes = useCallback(async (): Promise<void> => {
    if (craftLoading) {
      return;
    }

    setCraftLoading(true);
    setCraftError(null);

    const response = await getCraftRecipes();
    if (response.ok && Array.isArray(response.recipes)) {
      setCraftRecipes(response.recipes);
      setCraftLoaded(true);
      setCraftLoading(false);
      return;
    }

    setCraftRecipes([]);
    setCraftLoaded(true);
    setCraftLoading(false);
    setCraftError(response.message || response.error || t.craftError);
  }, [craftLoading, t.craftError]);

  function handleInventoryFilterChange(nextFilter: InventoryFilter): void {
    setInventoryFilter(nextFilter);
  }

  useEffect(() => {
    if (authState === "user" && activeTab === "inventory" && !inventoryLoaded && !inventoryLoading) {
      void loadInventory();
    }
  }, [authState, activeTab, inventoryLoaded, inventoryLoading, loadInventory]);

  useEffect(() => {
    if (authState === "user" && activeTab === "market" && !marketLoaded && !marketLoading) {
      void loadMarket();
    }
  }, [authState, activeTab, marketLoaded, marketLoading, loadMarket]);

  useEffect(() => {
    if (authState === "user" && activeTab === "market" && !marketCapitalizationLoaded && !marketCapitalizationLoading) {
      void loadMarketCapitalization();
    }
  }, [authState, activeTab, marketCapitalizationLoaded, marketCapitalizationLoading, loadMarketCapitalization]);

  useEffect(() => {
    if (
      authState === "user"
      && activeTab === "market"
      && marketSubTab === "forbes"
      && !marketForbesLoaded
      && !marketForbesLoading
    ) {
      void loadMarketForbes();
    }
  }, [authState, activeTab, marketForbesLoaded, marketForbesLoading, marketSubTab, loadMarketForbes]);

  useEffect(() => {
    if (authState === "user" && activeTab === "botShop" && shopSubTab === "items" && !botShopLoaded && !botShopLoading) {
      void loadBotShop();
    }
  }, [authState, activeTab, botShopLoaded, botShopLoading, loadBotShop, shopSubTab]);

  useEffect(() => {
    if (authState === "user" && activeTab === "botShop" && shopSubTab === "obs" && !obsShopStreamersLoaded && !obsShopStreamersLoading) {
      void loadObsShopStreamers();
    }
  }, [activeTab, authState, loadObsShopStreamers, obsShopStreamersLoaded, obsShopStreamersLoading, shopSubTab]);

  useEffect(() => {
    if (authState === "user" && !balanceLoaded && !balanceLoading) {
      void loadBalance();
    }
  }, [authState, balanceLoaded, balanceLoading, loadBalance]);

  useEffect(() => {
    if (authState === "user" && activeTab === "craft" && !craftLoaded && !craftLoading) {
      void loadCraftRecipes();
    }
  }, [authState, activeTab, craftLoaded, craftLoading, loadCraftRecipes]);

  useEffect(() => {
    if (authState === "user" && activeTab === "profile" && !profileLoaded && !profileLoading) {
      void loadProfile();
    }
  }, [activeTab, authState, loadProfile, profileLoaded, profileLoading]);

  useEffect(() => {
    if (authState === "user") {
      void loadNotificationsSummary();
    }
  }, [authState, loadNotificationsSummary]);

  useEffect(() => {
    if (authState === "user" && activeTab === "notifications" && !notificationsLoaded && !notificationsLoading) {
      void loadNotifications(notificationPage, notificationFilterUnreadOnly);
    }
  }, [activeTab, authState, loadNotifications, notificationFilterUnreadOnly, notificationPage, notificationsLoaded, notificationsLoading]);

  useEffect(() => {
    if (authState !== "user") {
      return;
    }

    if (!adminProbeDone) {
      setAdminProbeDone(true);
      void loadAdminStats(true);
    }
  }, [authState, adminProbeDone, loadAdminStats]);

  useEffect(() => {
    if (!canUseAdminMode && dashboardMode === "admin") {
      setDashboardMode("user");
      setActiveTab("overview");
    }
  }, [canUseAdminMode, dashboardMode]);

  const pollNotificationsSummary = useCallback(async (): Promise<void> => {
    await loadNotificationsSummary({ silent: true });
  }, [loadNotificationsSummary]);

  const pollBalance = useCallback(async (): Promise<void> => {
    await loadBalance({ silent: true });
  }, [loadBalance]);

  const pollActiveUserTab = useCallback(async (): Promise<void> => {
    if (dashboardMode !== "user") {
      return;
    }

    if (activeTab === "overview") {
      await loadBalance({ silent: true });
      return;
    }

    if (activeTab === "notifications") {
      await loadNotifications(notificationPage, notificationFilterUnreadOnly, { silent: true });
      await loadNotificationsSummary({ silent: true });
      return;
    }

    if (activeTab === "market") {
      if (marketSubTab === "overview") {
        await loadMarketCapitalization({ silent: true });
        return;
      }

      if (marketSubTab === "listings") {
        await loadMarket({ silent: true });
        return;
      }

      if (marketSubTab === "forbes") {
        await loadMarketForbes({ silent: true });
      }
      return;
    }

    if (activeTab === "botShop") {
      if (shopSubTab === "obs") {
        await loadObsShopStreamers({ silent: true });
      } else if (shopSubTab === "items") {
        await loadBotShop({ silent: true });
      }
      return;
    }

    if (activeTab === "inventory" && inventoryLoaded) {
      await loadInventory({ silent: true });
    }
  }, [
    activeTab,
    dashboardMode,
    inventoryLoaded,
    loadBalance,
    loadBotShop,
    loadInventory,
    loadMarket,
    loadMarketCapitalization,
    loadMarketForbes,
    loadObsShopStreamers,
    loadNotifications,
    loadNotificationsSummary,
    marketSubTab,
    notificationFilterUnreadOnly,
    notificationPage,
    shopSubTab,
  ]);

  const pollAdminDashboard = useCallback(async (): Promise<void> => {
    if (dashboardMode === "admin" && activeTab === "adminDashboard") {
      await loadAdminStats(true);
    }
  }, [activeTab, dashboardMode, loadAdminStats]);

  useSafePolling({
    enabled: authState === "user" && !isLoggingOut,
    intervalMs: 30000,
    minGapMs: 5000,
    task: pollNotificationsSummary,
  });

  useSafePolling({
    enabled: authState === "user" && !isLoggingOut,
    intervalMs: 60000,
    minGapMs: 10000,
    task: pollBalance,
  });

  useSafePolling({
    enabled: authState === "user" && !isLoggingOut && dashboardMode === "user",
    intervalMs: 45000,
    minGapMs: 10000,
    task: pollActiveUserTab,
  });

  useSafePolling({
    enabled: authState === "user" && !isLoggingOut && dashboardMode === "admin" && activeTab === "adminDashboard",
    intervalMs: 60000,
    minGapMs: 10000,
    task: pollAdminDashboard,
  });

  useEffect(() => {
    function handleVisibilityChange(): void {
      if (document.visibilityState !== "visible") {
        return;
      }

      if (authState !== "user" || isLoggingOut) {
        return;
      }

      void loadNotificationsSummary({ force: true, silent: true });
      void loadBalance({ silent: true });
      if (dashboardMode === "user") {
        void pollActiveUserTab();
      } else if (dashboardMode === "admin" && activeTab === "adminDashboard") {
        void pollAdminDashboard();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeTab, authState, dashboardMode, isLoggingOut, loadBalance, loadNotificationsSummary, pollActiveUserTab, pollAdminDashboard]);

  function handleLogin(): void {
    window.location.href = getDiscordLoginUrl();
  }

  function handleTabChange(tab: DashboardTab): void {
    setActiveTab(tab);
    setSearchQuery("");
  }

  function handleUserTabSelect(tab: UserTab): void {
    setDashboardMode("user");
    handleTabChange(tab);
  }

  function handleAdminTabSelect(tab: AdminTab): void {
    if (!canUseAdminMode) {
      return;
    }

    setDashboardMode("admin");
    handleTabChange(tab);
  }

  function handleShopSubTabShortcut(subtab: ShopSubTab): void {
    setDashboardMode("user");
    setActiveTab("botShop");
    setShopSubTab(subtab);
    setSearchQuery("");
  }

  function handleSearchResultSelect(result: DashboardSearchResult): void {
    if (result.destination.kind === "marketSubtab") {
      setDashboardMode("user");
      setActiveTab("market");
      setMarketSubTab(result.destination.subtab);
      setSearchQuery("");
      return;
    }

    if (result.destination.kind === "userTab") {
      setDashboardMode("user");
      setActiveTab(result.destination.tab);
      setSearchQuery("");
      return;
    }

    if (result.destination.kind === "shopSubtab") {
      setDashboardMode("user");
      setActiveTab("botShop");
      setShopSubTab(result.destination.subtab);
      setSearchQuery("");
      return;
    }

    if (result.destination.kind === "adminTab" && canUseAdminMode) {
      setDashboardMode("admin");
      setActiveTab(result.destination.tab);
      setSearchQuery("");
    }
  }

  function handleDashboardModeChange(nextMode: DashboardMode): void {
    if (nextMode === "admin" && !canUseAdminMode) {
      return;
    }

    setDashboardMode(nextMode);
    setSearchQuery("");
    setActiveTab(nextMode === "admin" ? "adminDashboard" : "overview");
  }

  const avatarUrl = user?.avatarUrl ?? null;
  const displayName = user?.globalName || user?.username || user?.discordId || "Unknown user";
  const dateLocale = DATE_LOCALE_BY_LANGUAGE[language];

  return (
    <main className={`page-root ${authState === "user" ? "lock-scroll" : ""}`}>
      <section className={`card ${authState === "user" ? "authenticated" : ""}`}>
        {authState === "loading" && (
          <div className="loading-block">
            <p className="loading">{t.loadingSession}</p>
            <div className="loading-gif-strip">
              {LOADING_GIFS.map((src, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={`${src}-${index}`} src={src} alt="Loading" className="loading-gif" />
              ))}
            </div>
          </div>
        )}

        {authState === "guest" && (
          <>
            <h1 className="title">Balkon</h1>
            <p className="subtitle">{t.subtitle}</p>
            <button className="discord-button" onClick={handleLogin}>
              {t.loginWithDiscord}
            </button>
          </>
        )}

        {authState === "user" && user && (
          <div className="dashboard-shell">
            <AppHeader
              appVersion={APP_VERSION}
              botStatus={BOT_UI_STATUS}
              statusText={statusText}
              t={t}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              searchResults={searchResults}
              onSearchResultSelect={handleSearchResultSelect}
              notificationBell={(
                <NotificationBell
                  t={t}
                  summary={notificationsSummary}
                  loading={notificationsSummaryLoading}
                  error={notificationsSummaryError}
                  onOpenAll={() => {
                    setDashboardMode("user");
                    setActiveTab("notifications");
                    setNotificationsLoaded(false);
                  }}
                  onRefresh={() => {
                    void loadNotificationsSummary({ force: true });
                  }}
                  onMarkRead={handleMarkNotificationRead}
                  onMarkAllRead={handleMarkAllNotificationsRead}
                />
              )}
              balance={balance}
              profileDropdown={(
                <ProfileDropdown
                  profileMenuRef={profileMenuRef}
                  profileMenuOpen={profileMenuOpen}
                  avatarUrl={avatarUrl}
                  avatarFailed={avatarFailed}
                  onAvatarError={() => setAvatarFailed(true)}
                  displayName={displayName}
                  discordId={user.discordId}
                  t={t}
                  onToggleMenu={() => setProfileMenuOpen(prev => !prev)}
                  onProfileTabOpen={() => {
                    handleTabChange("profile");
                    setProfileMenuOpen(false);
                  }}
                  canUseAdminMode={canUseAdminMode}
                  dashboardMode={dashboardMode}
                  onDashboardModeChange={handleDashboardModeChange}
                  language={language}
                  onLanguageChange={setLanguage}
                  streamerMode={streamerMode}
                  onStreamerModeChange={setStreamerMode}
                  onLogout={() => {
                    void handleLogout();
                  }}
                  isLoggingOut={isLoggingOut}
                  balance={balance}
                />
              )}
            />

            <div className="dashboard-main-layout">
              <DashboardSidebar
                t={t}
                dashboardMode={dashboardMode}
                activeTab={activeTab}
                shopSubTab={shopSubTab}
                onUserTabSelect={handleUserTabSelect}
                onAdminTabSelect={handleAdminTabSelect}
                onShopSubTabSelect={handleShopSubTabShortcut}
              />

              <div className="dashboard-main-panel">
                <div className="dashboard-content">

            {activeTab === "overview" ? (
              <div className="panel panel-overview">
                  <h2 className="section-title">{t.welcome}</h2>
                <div className="user-row">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Discord avatar"
                      className="avatar"
                      onError={() => setAvatarFailed(true)}
                      style={{ display: avatarFailed ? "none" : "block" }}
                    />
                  ) : (
                    <div className="avatar placeholder" aria-hidden="true" />
                  )}
                  {avatarUrl && avatarFailed ? (
                    <div className="avatar placeholder" aria-hidden="true" />
                  ) : null}
                  <div>
                    <p className="display-name">{displayName}</p>
                    <p className="user-id">{t.discordId}: {user.discordId}</p>
                    {roles.length > 0 ? (
                      <div className="badges">
                        {roles.map(role => (
                          <span className="badge" key={role}>{role}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="no-roles">{t.noRoles}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "inventory" ? (
              <InventoryPanel
                t={t}
                loadingGifs={LOADING_GIFS}
                inventoryFilterItems={inventoryFilterItems}
                inventoryFilter={inventoryFilter}
                onFilterChange={handleInventoryFilterChange}
                filteredInventoryLength={filteredInventory.length}
                inventoryLoading={inventoryLoading}
                inventoryError={inventoryError}
                inventoryEmptyText={inventoryEmptyText}
                inventoryItems={filteredInventory}
                dateLocale={dateLocale}
              />
            ) : null}

            {activeTab === "market" ? (
              <MarketPanel
                t={t}
                dateLocale={dateLocale}
                loadingGifs={LOADING_GIFS}
                marketListings={marketListings}
                marketLoading={marketLoading}
                marketError={marketError}
                marketCapitalization={marketCapitalization}
                marketCapitalizationLoading={marketCapitalizationLoading}
                marketCapitalizationError={marketCapitalizationError}
                marketForbes={marketForbes}
                marketForbesLoading={marketForbesLoading}
                marketForbesError={marketForbesError}
                streamerMode={streamerMode}
                marketSubTab={marketSubTab}
                onMarketSubTabChange={setMarketSubTab}
                onRefreshListings={() => {
                  setMarketLoaded(false);
                  void loadMarket();
                }}
                onRefreshCapitalization={() => {
                  setMarketCapitalizationLoaded(false);
                  void loadMarketCapitalization();
                }}
                onRefreshForbes={() => {
                  setMarketForbesLoaded(false);
                  void loadMarketForbes();
                }}
              />
            ) : null}

            {activeTab === "botShop" ? (
              <BotShopPanel
                t={t}
                dateLocale={dateLocale}
                loadingGifs={LOADING_GIFS}
                shopSubTab={shopSubTab}
                onShopSubTabChange={setShopSubTab}
                botShopListings={botShopListings}
                botShopLoading={botShopLoading}
                botShopError={botShopError}
                balance={balance}
                buyingListingId={buyingListingId}
                buyFeedback={buyFeedback}
                buyErrors={buyErrors}
                onBuyListing={handleBuyBotShopListing}
                onRefreshItems={() => {
                  setBotShopLoaded(false);
                  void loadBotShop();
                }}
                obsStreamers={obsShopStreamers}
                obsStreamersLoading={obsShopStreamersLoading}
                obsStreamersError={obsShopStreamersError}
                onRefreshObsStreamers={() => {
                  setObsShopStreamersLoaded(false);
                  void loadObsShopStreamers();
                }}
                onLoadObsStreamerDetails={async (streamerId) => {
                  await loadObsShopStreamerDetails(streamerId);
                }}
                obsStreamerDetailsLoading={obsShopStreamerDetailsLoading}
                obsStreamerDetailsError={obsShopStreamerDetailsError}
                obsMediaProducts={obsShopMediaProducts}
                buyingObsProductId={buyingObsProductId}
                obsBuyFeedback={obsBuyFeedback}
                obsBuyErrors={obsBuyErrors}
                onBuyObsMediaProduct={handleBuyObsMediaProduct}
              />
            ) : null}

            {activeTab === "craft" ? (
              <CraftPanel
                t={t}
                loadingGifs={LOADING_GIFS}
                recipes={craftRecipes}
                loading={craftLoading}
                error={craftError}
                onRefresh={() => {
                  setCraftLoaded(false);
                  void loadCraftRecipes();
                }}
              />
            ) : null}

            {activeTab === "notifications" ? (
              <NotificationsPanel
                t={t}
                dateLocale={dateLocale}
                notifications={notificationsList}
                loading={notificationsLoading}
                error={notificationsError}
                unreadOnly={notificationFilterUnreadOnly}
                page={notificationPage}
                pageSize={notificationPageSize}
                total={notificationTotal}
                onUnreadOnlyChange={(next) => {
                  setNotificationFilterUnreadOnly(next);
                  setNotificationPage(1);
                  setNotificationsLoaded(false);
                  void loadNotifications(1, next);
                }}
                onPageChange={(nextPage) => {
                  setNotificationPage(nextPage);
                  setNotificationsLoaded(false);
                  void loadNotifications(nextPage, notificationFilterUnreadOnly);
                }}
                onRefresh={() => {
                  setNotificationsLoaded(false);
                  void loadNotifications(notificationPage, notificationFilterUnreadOnly);
                }}
                onMarkRead={handleMarkNotificationRead}
                onMarkAllRead={handleMarkAllNotificationsRead}
              />
            ) : null}

            {activeTab === "adminDashboard" ? (
              <AdminDashboardPanel
                t={t}
                adminStatsLoading={adminStatsLoading}
                adminStatsError={adminStatsError}
                adminStats={adminStats}
                onRetry={() => {
                  void loadAdminStats();
                }}
              />
            ) : null}

            {activeTab === "adminLogs" ? (
              <AdminLogsPanel t={t} adminStats={adminStats} dateLocale={dateLocale} />
            ) : null}

            {activeTab === "adminObs" ? (
              <AdminObsPanel t={t} adminStats={adminStats} dateLocale={dateLocale} />
            ) : null}

            {activeTab === "adminServers" ? (
              <PlaceholderPanel title={t.adminTabServers} description={t.adminServersSoon} />
            ) : null}

            {activeTab === "adminItems" ? (
              <AdminItemsPanel t={t} />
            ) : null}

            {activeTab === "adminBotShop" ? (
              <AdminBotShopPanel t={t} />
            ) : null}

            {activeTab === "adminEconomy" ? (
              <AdminEconomyPanel
                t={t}
                onAdjusted={async (result) => {
                  if (user?.discordId === result.targetDiscordId) {
                    await loadBalance();
                  }

                  if (canUseAdminMode) {
                    await loadAdminStats(true);
                  }

                  await loadNotificationsSummary({ force: true, silent: true });
                }}
              />
            ) : null}

            {activeTab === "adminMessage" ? (
              <AdminBroadcastPanel
                t={t}
                onSent={() => {
                  void loadNotificationsSummary({ force: true, silent: true });
                }}
              />
            ) : null}

            {activeTab === "profile" ? (
              <ProfileSettingsPanel
                t={t}
                profile={profileData}
                availableGuilds={profileGuilds}
                loading={profileLoading}
                saveLoading={profileSaveLoading}
                error={profileError}
                feedback={profileFeedback}
                homeGuildIdDraft={profileHomeGuildIdDraft}
                publicDescriptionDraft={profileDescriptionDraft}
                onHomeGuildChange={setProfileHomeGuildIdDraft}
                onDescriptionChange={setProfileDescriptionDraft}
                onSave={() => {
                  void saveProfile();
                }}
                onReset={() => {
                  setProfileHomeGuildIdDraft(profileData?.homeGuildId || "");
                  setProfileDescriptionDraft(profileData?.publicDescription || "");
                  setProfileFeedback(null);
                }}
              />
            ) : null}

                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
