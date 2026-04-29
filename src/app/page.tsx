"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAdminStats, getBotShop, getCraftRecipes, getDiscordLoginUrl, getInventory, getMarket, getMe, logout } from "@/lib/api";
import { AdminStats, ApiMeResponse, BotShopListing, CraftRecipe, InventoryItem, MarketListing } from "@/lib/types";
import { DASHBOARD_TEXT, DATE_LOCALE_BY_LANGUAGE, LanguageCode } from "@/lib/dashboardText";
import { AppHeader } from "@/components/dashboard/AppHeader";
import { ProfileDropdown } from "@/components/dashboard/ProfileDropdown";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { InventoryPanel } from "@/components/dashboard/InventoryPanel";
import { MarketPanel } from "@/components/dashboard/MarketPanel";
import { BotShopPanel } from "@/components/dashboard/BotShopPanel";
import { CraftPanel } from "@/components/dashboard/CraftPanel";
import { AdminDashboardPanel } from "@/components/dashboard/AdminDashboardPanel";
import { AdminLogsPanel } from "@/components/dashboard/AdminLogsPanel";
import { AdminObsPanel } from "@/components/dashboard/AdminObsPanel";
import { AdminItemsPanel } from "@/components/dashboard/AdminItemsPanel";
import { PlaceholderPanel } from "@/components/dashboard/PlaceholderPanel";

type AuthState = "loading" | "guest" | "user";
type UserTab = "overview" | "inventory" | "market" | "botShop" | "craft" | "profile";
type AdminTab = "adminDashboard" | "adminServers" | "adminLogs" | "adminObs" | "adminItems";
type DashboardTab = UserTab | AdminTab;
type DashboardMode = "user" | "admin";
type BotUiStatus = "online" | "offline" | "development";
type InventoryFilter = "all" | "materials" | "sellable" | "tradeable";
const INVENTORY_PAGE_SIZE = 8;

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
  const [botShopListings, setBotShopListings] = useState<BotShopListing[]>([]);
  const [botShopLoaded, setBotShopLoaded] = useState(false);
  const [botShopLoading, setBotShopLoading] = useState(false);
  const [botShopError, setBotShopError] = useState<string | null>(null);
  const [craftRecipes, setCraftRecipes] = useState<CraftRecipe[]>([]);
  const [craftLoaded, setCraftLoaded] = useState(false);
  const [craftLoading, setCraftLoading] = useState(false);
  const [craftError, setCraftError] = useState<string | null>(null);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>("all");
  const [canUseAdminMode, setCanUseAdminMode] = useState(false);
  const [adminProbeDone, setAdminProbeDone] = useState(false);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminStatsLoading, setAdminStatsLoading] = useState(false);
  const [adminStatsError, setAdminStatsError] = useState<string | null>(null);
  const [language, setLanguage] = useState<LanguageCode>("ru");
  const [searchQuery, setSearchQuery] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const user = meResponse?.me;
  const roles = useMemo(() => user?.roles ?? [], [user?.roles]);
  const t = DASHBOARD_TEXT[language];

  const userTabItems = useMemo(() => ([
    { id: "overview" as const, label: t.tabOverview },
    { id: "inventory" as const, label: t.tabInventory },
    { id: "market" as const, label: t.tabMarket },
    { id: "botShop" as const, label: t.tabBotShop },
    { id: "craft" as const, label: t.tabCraft },
    { id: "profile" as const, label: t.tabProfile },
  ]), [t]);

  const adminTabItems = useMemo(() => ([
    { id: "adminDashboard" as const, label: t.adminTabDashboard },
    { id: "adminServers" as const, label: t.adminTabServers },
    { id: "adminLogs" as const, label: t.adminTabLogs },
    { id: "adminObs" as const, label: t.adminTabObs },
    { id: "adminItems" as const, label: t.adminTabItems },
  ]), [t]);

  const tabItems = useMemo(
    () => dashboardMode === "admin" ? adminTabItems : userTabItems,
    [dashboardMode, adminTabItems, userTabItems],
  );

  const filteredTabs = useMemo(
    () => searchQuery.trim()
      ? tabItems.filter(tab => tab.label.toLowerCase().includes(searchQuery.trim().toLowerCase()))
      : [],
    [searchQuery, tabItems],
  );

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

  const totalInventoryPages = useMemo(
    () => Math.max(1, Math.ceil(filteredInventory.length / INVENTORY_PAGE_SIZE)),
    [filteredInventory.length],
  );

  const paginatedInventory = useMemo(() => {
    const start = (inventoryPage - 1) * INVENTORY_PAGE_SIZE;
    return filteredInventory.slice(start, start + INVENTORY_PAGE_SIZE);
  }, [filteredInventory, inventoryPage]);

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
    setBotShopListings([]);
    setBotShopLoaded(false);
    setBotShopLoading(false);
    setBotShopError(null);
    setCraftRecipes([]);
    setCraftLoaded(false);
    setCraftLoading(false);
    setCraftError(null);
    setInventoryPage(1);
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
      setCanUseAdminMode(true);
      setAdminStats(response.stats);
      setAdminStatsError(null);
      setAdminStatsLoading(false);
      return;
    }

    setCanUseAdminMode(false);
    setAdminStats(null);
    setAdminStatsLoading(false);
    if (!silent) {
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

  const loadInventory = useCallback(async (): Promise<void> => {
    if (inventoryLoading) {
      return;
    }

    setInventoryLoading(true);
    setInventoryError(null);

    const response = await getInventory();
    if (response.ok && Array.isArray(response.items)) {
      setInventory(response.items);
      setInventoryLoaded(true);
      setInventoryLoading(false);
      setInventoryPage(1);
      return;
    }

    setInventory([]);
    setInventoryLoaded(true);
    setInventoryLoading(false);
    setInventoryError(response.message || response.error || "Failed to load inventory.");
    setInventoryPage(1);
  }, [inventoryLoading]);

  const loadMarket = useCallback(async (): Promise<void> => {
    if (marketLoading) {
      return;
    }

    setMarketLoading(true);
    setMarketError(null);

    const response = await getMarket();
    if (response.ok && Array.isArray(response.listings)) {
      setMarketListings(response.listings);
      setMarketLoaded(true);
      setMarketLoading(false);
      return;
    }

    setMarketListings([]);
    setMarketLoaded(true);
    setMarketLoading(false);
    setMarketError(response.message || response.error || t.marketError);
  }, [marketLoading, t.marketError]);

  const loadBotShop = useCallback(async (): Promise<void> => {
    if (botShopLoading) {
      return;
    }

    setBotShopLoading(true);
    setBotShopError(null);

    const response = await getBotShop();
    if (response.ok && Array.isArray(response.listings)) {
      setBotShopListings(response.listings);
      setBotShopLoaded(true);
      setBotShopLoading(false);
      return;
    }

    setBotShopListings([]);
    setBotShopLoaded(true);
    setBotShopLoading(false);
    setBotShopError(response.message || response.error || t.botShopError);
  }, [botShopLoading, t.botShopError]);

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

  useEffect(() => {
    if (inventoryPage > totalInventoryPages) {
      setInventoryPage(totalInventoryPages);
    }
  }, [inventoryPage, totalInventoryPages]);

  function handleInventoryFilterChange(nextFilter: InventoryFilter): void {
    setInventoryFilter(nextFilter);
    setInventoryPage(1);
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
    if (authState === "user" && activeTab === "botShop" && !botShopLoaded && !botShopLoading) {
      void loadBotShop();
    }
  }, [authState, activeTab, botShopLoaded, botShopLoading, loadBotShop]);

  useEffect(() => {
    if (authState === "user" && activeTab === "craft" && !craftLoaded && !craftLoading) {
      void loadCraftRecipes();
    }
  }, [authState, activeTab, craftLoaded, craftLoading, loadCraftRecipes]);

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

  function handleLogin(): void {
    window.location.href = getDiscordLoginUrl();
  }

  function handleTabChange(tab: DashboardTab): void {
    setActiveTab(tab);
    setSearchQuery("");
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
              filteredTabs={filteredTabs}
              onTabChange={handleTabChange}
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
                  onLogout={() => {
                    void handleLogout();
                  }}
                  isLoggingOut={isLoggingOut}
                />
              )}
            />

            <DashboardTabs tabItems={tabItems} activeTab={activeTab} onTabChange={handleTabChange} />

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
                paginatedInventory={paginatedInventory}
                inventoryPage={inventoryPage}
                totalInventoryPages={totalInventoryPages}
                onPrevPage={() => setInventoryPage(prev => Math.max(1, prev - 1))}
                onNextPage={() => setInventoryPage(prev => Math.min(totalInventoryPages, prev + 1))}
                dateLocale={dateLocale}
              />
            ) : null}

            {activeTab === "market" ? (
              <MarketPanel
                t={t}
                loadingGifs={LOADING_GIFS}
                marketListings={marketListings}
                marketLoading={marketLoading}
                marketError={marketError}
                onRefresh={() => {
                  setMarketLoaded(false);
                  void loadMarket();
                }}
              />
            ) : null}

            {activeTab === "botShop" ? (
              <BotShopPanel
                t={t}
                loadingGifs={LOADING_GIFS}
                botShopListings={botShopListings}
                botShopLoading={botShopLoading}
                botShopError={botShopError}
                onRefresh={() => {
                  setBotShopLoaded(false);
                  void loadBotShop();
                }}
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

            {activeTab === "profile" ? (
              <div className="panel panel-overview">
                <p className="display-name">{t.profileSection}</p>
                <p className="user-id">{displayName}</p>
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
            ) : null}

            </div>
          </div>
        )}
      </section>
    </main>
  );
}
