"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAdminStats, getDiscordLoginUrl, getInventory, getMe, logout } from "@/lib/api";
import { AdminStats, ApiMeResponse, InventoryItem } from "@/lib/types";

type AuthState = "loading" | "guest" | "user";
type UserTab = "overview" | "inventory" | "market" | "profile";
type AdminTab = "adminDashboard" | "adminServers" | "adminLogs" | "adminObs" | "adminItems";
type DashboardTab = UserTab | AdminTab;
type DashboardMode = "user" | "admin";
type LanguageCode = "ru" | "en" | "et";
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

const DATE_LOCALE_BY_LANGUAGE: Record<LanguageCode, string> = {
  ru: "ru-RU",
  en: "en-US",
  et: "et-EE",
};

const TEXT = {
  ru: {
    welcome: "Добро пожаловать в Balkon",
    title: "Balkon",
    subtitle: "Discord bot dashboard для экономики, стримеров и OBS-контроля.",
    loginWithDiscord: "Войти через Discord",
    searching: "Поиск вкладок...",
    loadingSession: "Проверяем сессию...",
    loadingInventory: "Загружаем инвентарь...",
    inventoryEmpty: "Инвентарь пуст.",
    noRoles: "Ролей нет",
    discordId: "Discord ID",
    obtained: "Получено",
    tabOverview: "Обзор",
    tabInventory: "Инвентарь",
    tabMarket: "Рынок",
    tabProfile: "Профиль",
    profile: "Профиль",
    logout: "Выйти",
    languages: "Язык",
    marketSoon: "Рынок скоро будет доступен в этой панели.",
    profileSection: "Профиль пользователя",
    tradeableYes: "Можно передать",
    tradeableNo: "Нельзя передать",
    sellableYes: "Можно продать",
    sellableNo: "Нельзя продать",
    botSell: "Продажа боту",
    unknownDate: "Неизвестно",
    checking: "Проверяем данные...",
    previous: "Назад",
    next: "Далее",
    page: "Страница",
    status: "Status",
    statusOnline: "Работает",
    statusOffline: "Не работает",
    statusDevelopment: "На разработке",
    inventoryFilterAll: "Все",
    inventoryFilterMaterials: "Материалы",
    inventoryFilterSellable: "Продаваемые",
    inventoryFilterTradeable: "Передаваемые",
    inventoryFilterLabel: "Фильтр инвентаря",
    itemsWord: "предметов",
    noSellableItems: "Нет продаваемых предметов.",
    noTradeableItems: "Нет передаваемых предметов.",
    noMaterialsItems: "Нет материалов.",
    adminMode: "Режим",
    adminModeUser: "Пользователь",
    adminModeAdmin: "Админ",
    adminTabDashboard: "Dashboard",
    adminTabServers: "Серверы",
    adminTabLogs: "Логи",
    adminTabObs: "OBS",
    adminTabItems: "Предметы",
    adminStatsLoading: "Загружаем админ-статистику...",
    adminStatsError: "Не удалось загрузить админ-статистику.",
    adminStatsEmpty: "Нет данных админ-статистики.",
    retry: "Повторить",
    adminCountGuilds: "Гильдии",
    adminCountMembers: "Участники",
    adminCountItems: "Предметы",
    adminCountInventory: "Инвентарь",
    adminCountMarket: "Рынок",
    adminCountStore: "Магазин",
    adminCountRecipes: "Рецепты",
    adminCountStreamers: "Стримеры",
    adminCountSettings: "Настройки",
    adminCountActions: "Действия",
    adminLogsEmpty: "Логи bootstrap пока отсутствуют.",
    statusOk: "OK",
    statusError: "Ошибка",
    source: "Источник",
    updated: "Обновлено",
    channelsSynced: "Каналы синхр.",
    rolesSynced: "Роли синхр.",
    messageLabel: "Сообщение",
    adminObsEmpty: "Настройки OBS пока отсутствуют.",
    contributors: "Contributors",
    none: "Нет",
    adminServersSoon: "Секция серверов в разработке. Здесь будет управление гильдиями, доступами и bootstrap-проверками.",
    adminItemsSoon: "Секция предметов в разработке. Здесь будет модерация каталога и контроль экономики.",
  },
  en: {
    welcome: "Welcome to Balkon",
    title: "Balkon",
    subtitle: "Discord bot dashboard for economy, streamers and OBS control.",
    loginWithDiscord: "Login with Discord",
    searching: "Search tabs...",
    loadingSession: "Checking session...",
    loadingInventory: "Loading inventory...",
    inventoryEmpty: "Inventory is empty.",
    noRoles: "No roles assigned",
    discordId: "Discord ID",
    obtained: "Obtained",
    tabOverview: "Overview",
    tabInventory: "Inventory",
    tabMarket: "Market",
    tabProfile: "Profile",
    profile: "Profile",
    logout: "Logout",
    languages: "Language",
    marketSoon: "Market section is coming soon.",
    profileSection: "User profile",
    tradeableYes: "Tradeable",
    tradeableNo: "Not tradeable",
    sellableYes: "Sellable",
    sellableNo: "Not sellable",
    botSell: "Bot sell",
    unknownDate: "Unknown",
    checking: "Checking data...",
    previous: "Previous",
    next: "Next",
    page: "Page",
    status: "Status",
    statusOnline: "Online",
    statusOffline: "Offline",
    statusDevelopment: "In development",
    inventoryFilterAll: "All",
    inventoryFilterMaterials: "Materials",
    inventoryFilterSellable: "Sellable",
    inventoryFilterTradeable: "Tradeable",
    inventoryFilterLabel: "Inventory filter",
    itemsWord: "items",
    noSellableItems: "No sellable items yet.",
    noTradeableItems: "No tradeable items yet.",
    noMaterialsItems: "No materials yet.",
    adminMode: "Mode",
    adminModeUser: "User",
    adminModeAdmin: "Admin",
    adminTabDashboard: "Dashboard",
    adminTabServers: "Servers",
    adminTabLogs: "Logs",
    adminTabObs: "OBS",
    adminTabItems: "Items",
    adminStatsLoading: "Loading admin stats...",
    adminStatsError: "Failed to load admin stats.",
    adminStatsEmpty: "No admin stats available.",
    retry: "Retry",
    adminCountGuilds: "Guilds",
    adminCountMembers: "Members",
    adminCountItems: "Items",
    adminCountInventory: "Inventory",
    adminCountMarket: "Market",
    adminCountStore: "Store",
    adminCountRecipes: "Recipes",
    adminCountStreamers: "Streamers",
    adminCountSettings: "Settings",
    adminCountActions: "Actions",
    adminLogsEmpty: "No bootstrap logs yet.",
    statusOk: "OK",
    statusError: "Error",
    source: "Source",
    updated: "Updated",
    channelsSynced: "Channels synced",
    rolesSynced: "Roles synced",
    messageLabel: "Message",
    adminObsEmpty: "No OBS settings available.",
    contributors: "Contributors",
    none: "None",
    adminServersSoon: "Servers section is in progress. Guild management, access controls and bootstrap checks will appear here.",
    adminItemsSoon: "Items section is in progress. Catalog moderation and economy control tools will appear here.",
  },
  et: {
    welcome: "Tere tulemast Balkonisse",
    title: "Balkon",
    subtitle: "Discordi boti juhtpaneel majanduse, striimerite ja OBS-i jaoks.",
    loginWithDiscord: "Logi sisse Discordiga",
    searching: "Otsi vahelehti...",
    loadingSession: "Sessiooni kontroll...",
    loadingInventory: "Laen inventari...",
    inventoryEmpty: "Inventar on tühi.",
    noRoles: "Rolle pole",
    discordId: "Discord ID",
    obtained: "Saadud",
    tabOverview: "Ülevaade",
    tabInventory: "Inventar",
    tabMarket: "Turg",
    tabProfile: "Profiil",
    profile: "Profiil",
    logout: "Logi välja",
    languages: "Keel",
    marketSoon: "Turu vaade lisatakse peagi.",
    profileSection: "Kasutaja profiil",
    tradeableYes: "Vahetatav",
    tradeableNo: "Ei ole vahetatav",
    sellableYes: "Müüdav",
    sellableNo: "Ei ole müüdav",
    botSell: "Botile müük",
    unknownDate: "Teadmata",
    checking: "Andmete kontroll...",
    previous: "Eelmine",
    next: "Järgmine",
    page: "Leht",
    status: "Status",
    statusOnline: "Töötab",
    statusOffline: "Ei tööta",
    statusDevelopment: "Arenduses",
    inventoryFilterAll: "Kõik",
    inventoryFilterMaterials: "Materjalid",
    inventoryFilterSellable: "Müüdavad",
    inventoryFilterTradeable: "Vahetatavad",
    inventoryFilterLabel: "Inventari filter",
    itemsWord: "eset",
    noSellableItems: "Müüdavaid esemeid veel pole.",
    noTradeableItems: "Vahetatavaid esemeid veel pole.",
    noMaterialsItems: "Materjale veel pole.",
    adminMode: "Reziim",
    adminModeUser: "Kasutaja",
    adminModeAdmin: "Admin",
    adminTabDashboard: "Dashboard",
    adminTabServers: "Serverid",
    adminTabLogs: "Logid",
    adminTabObs: "OBS",
    adminTabItems: "Esemed",
    adminStatsLoading: "Laen admin-statistikat...",
    adminStatsError: "Admin-statistika laadimine ebaonnestus.",
    adminStatsEmpty: "Admin-statistika puudub.",
    retry: "Proovi uuesti",
    adminCountGuilds: "Guildid",
    adminCountMembers: "Liikmed",
    adminCountItems: "Esemed",
    adminCountInventory: "Inventar",
    adminCountMarket: "Turg",
    adminCountStore: "Pood",
    adminCountRecipes: "Retseptid",
    adminCountStreamers: "Striimerid",
    adminCountSettings: "Seaded",
    adminCountActions: "Tegevused",
    adminLogsEmpty: "Bootstrap-logisid veel pole.",
    statusOk: "OK",
    statusError: "Viga",
    source: "Allikas",
    updated: "Uuendatud",
    channelsSynced: "Kanalid sünk",
    rolesSynced: "Rollid sünk",
    messageLabel: "Sonum",
    adminObsEmpty: "OBS seaded puuduvad.",
    contributors: "Contributors",
    none: "Puudub",
    adminServersSoon: "Serverite sektsioon on arenduses. Siia tulevad guildide haldus, juurdepääsud ja bootstrap kontrollid.",
    adminItemsSoon: "Esemete sektsioon on arenduses. Siia tulevad kataloogi haldus ja economy kontroll.",
  },
} as const;

function formatObtainedAt(value: string | Date, locale: string, unknownDate: string): string {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return unknownDate;
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

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
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const user = meResponse?.me;
  const roles = useMemo(() => user?.roles ?? [], [user?.roles]);
  const t = TEXT[language];

  const userTabItems = useMemo(() => ([
    { id: "overview" as const, label: t.tabOverview },
    { id: "inventory" as const, label: t.tabInventory },
    { id: "market" as const, label: t.tabMarket },
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
            <header className="dashboard-topbar">
              <div className="dashboard-header">
                <div className="brand-block">
                  <h1 className="title compact">Balkon</h1>
                  <span className="version">{APP_VERSION}</span>
                  <div className="status-wrap" aria-label={`${t.status}: ${statusText}`}>
                    <span className={`status-dot ${BOT_UI_STATUS}`} aria-hidden="true" />
                    <span className="status-label">{t.status}</span>
                    <span className="status-value">{statusText}</span>
                    <div className="status-tooltip" role="tooltip">
                      <p className="status-tooltip-title">{t.status}</p>
                      <div className="status-tooltip-row">
                        <span className="status-dot online" aria-hidden="true" />
                        <span>{t.statusOnline}</span>
                      </div>
                      <div className="status-tooltip-row">
                        <span className="status-dot offline" aria-hidden="true" />
                        <span>{t.statusOffline}</span>
                      </div>
                      <div className="status-tooltip-row">
                        <span className="status-dot development" aria-hidden="true" />
                        <span>{t.statusDevelopment}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="header-search-wrap">
                  <input
                    value={searchQuery}
                    onChange={event => setSearchQuery(event.target.value)}
                    className="header-search"
                    placeholder={t.searching}
                  />

                  {filteredTabs.length > 0 ? (
                    <div className="search-dropdown">
                      {filteredTabs.map(tab => (
                        <button
                          key={tab.id}
                          className="search-result"
                          onClick={() => handleTabChange(tab.id)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="profile-menu-container" ref={profileMenuRef}>
                  <button className="profile-icon-button" onClick={() => setProfileMenuOpen(prev => !prev)}>
                    {avatarUrl && !avatarFailed ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="header-avatar"
                        onError={() => setAvatarFailed(true)}
                      />
                    ) : (
                      <div className="header-avatar placeholder" aria-hidden="true" />
                    )}
                  </button>

                  {profileMenuOpen ? (
                    <div className="profile-dropdown">
                      <p className="dropdown-name">{displayName}</p>
                      <p className="dropdown-id">{t.discordId}: {user.discordId}</p>

                      <button
                        className="dropdown-action"
                        onClick={() => {
                          handleTabChange("profile");
                          setProfileMenuOpen(false);
                        }}
                      >
                        {t.profile}
                      </button>

                      {canUseAdminMode ? (
                        <div className="mode-switch-block">
                          <p className="language-title">{t.adminMode}</p>
                          <div className="mode-switch-buttons">
                            <button
                              className={`lang-btn ${dashboardMode === "user" ? "active" : ""}`}
                              onClick={() => handleDashboardModeChange("user")}
                            >
                              {t.adminModeUser}
                            </button>
                            <button
                              className={`lang-btn ${dashboardMode === "admin" ? "active" : ""}`}
                              onClick={() => handleDashboardModeChange("admin")}
                            >
                              {t.adminModeAdmin}
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div className="language-block">
                        <p className="language-title">{t.languages}</p>
                        <div className="language-buttons">
                          <button className={`lang-btn ${language === "ru" ? "active" : ""}`} onClick={() => setLanguage("ru")}>RU</button>
                          <button className={`lang-btn ${language === "en" ? "active" : ""}`} onClick={() => setLanguage("en")}>ENG</button>
                          <button className={`lang-btn ${language === "et" ? "active" : ""}`} onClick={() => setLanguage("et")}>EST</button>
                        </div>
                      </div>

                      <button className="dropdown-action danger" onClick={() => void handleLogout()}>
                        {isLoggingOut ? `${t.logout}...` : t.logout}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="topbar-divider" />
            </header>

            <div className="tabs-wrap">
              <div className="tabs" role="tablist" aria-label="Dashboard sections">
                {tabItems.map(tab => (
                  <button
                    key={tab.id}
                    className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
                    onClick={() => handleTabChange(tab.id)}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

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
              <div className="panel panel-inventory">
                <div className="inventory-scroll">
                  <div className="inventory-toolbar">
                    <div className="inventory-filters" role="tablist" aria-label={t.inventoryFilterLabel}>
                      {inventoryFilterItems.map(filter => (
                        <button
                          key={filter.id}
                          className={`inventory-filter-chip ${inventoryFilter === filter.id ? "active" : ""}`}
                          onClick={() => handleInventoryFilterChange(filter.id)}
                          role="tab"
                          aria-selected={inventoryFilter === filter.id}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                    <p className="inventory-counter">{filteredInventory.length} {t.itemsWord}</p>
                  </div>

                  {inventoryLoading ? (
                    <div className="loading-block slim">
                      <p className="state-text">{t.loadingInventory}</p>
                      <div className="loading-gif-strip small">
                        {LOADING_GIFS.map((src, index) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={`inv-${src}-${index}`} src={src} alt="Loading" className="loading-gif" />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {!inventoryLoading && inventoryError ? (
                    <p className="state-text state-error">{inventoryError}</p>
                  ) : null}

                  {!inventoryLoading && !inventoryError && filteredInventory.length === 0 ? (
                    <p className="state-text state-empty">{inventoryEmptyText}</p>
                  ) : null}

                  {!inventoryLoading && !inventoryError && filteredInventory.length > 0 ? (
                    <div className="inventory-grid">
                      {paginatedInventory.map(item => {
                        const rarityAccent = item.rarityColorHex || "#44506d";
                        return (
                          <article
                            key={item.inventoryItemId}
                            className="inventory-card"
                            style={{ borderColor: `${rarityAccent}66`, boxShadow: `0 0 0 1px ${rarityAccent}22 inset` }}
                          >
                            <div className="inventory-media" style={{ background: `linear-gradient(145deg, ${rarityAccent}2d, #1d2437)` }}>
                              {item.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="inventory-image"
                                  onError={event => {
                                    const target = event.currentTarget;
                                    target.style.display = "none";
                                    const fallback = target.parentElement?.querySelector<HTMLElement>(".inventory-emoji-fallback");
                                    if (fallback) fallback.style.display = "grid";
                                  }}
                                />
                              ) : null}
                              <div className="inventory-emoji-fallback" style={{ display: item.imageUrl ? "none" : "grid" }}>
                                {item.emoji || "📦"}
                              </div>
                            </div>

                            <div className="inventory-content">
                              <h3 className="inventory-title">{item.name}</h3>
                              <p className="inventory-description">{item.description}</p>

                              <div className="inventory-meta">
                                <span className="meta-badge rarity-badge" style={{ borderColor: `${rarityAccent}66` }}>
                                  {item.rarityName}
                                </span>
                                <span className="meta-badge">{item.itemType}</span>
                                <span className="meta-badge">Tier {item.tier}</span>
                                <span className="meta-badge">ID #{item.inventoryItemId}</span>
                                <span className={`meta-badge ${item.tradeable ? "ok" : "muted"}`}>
                                  {item.tradeable ? t.tradeableYes : t.tradeableNo}
                                </span>
                                <span className={`meta-badge ${item.sellable ? "ok" : "muted"}`}>
                                  {item.sellable ? t.sellableYes : t.sellableNo}
                                </span>
                                {item.botSellPrice !== null ? (
                                  <span className="meta-badge price">{t.botSell}: {item.botSellPrice}</span>
                                ) : null}
                              </div>

                              <p className="inventory-obtained">{t.obtained}: {formatObtainedAt(item.obtainedAt, dateLocale, t.unknownDate)}</p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : null}

                  {!inventoryLoading && !inventoryError && filteredInventory.length > 0 ? (
                    <div className="inventory-pagination">
                      <button
                        className="pagination-btn"
                        disabled={inventoryPage <= 1}
                        onClick={() => setInventoryPage(prev => Math.max(1, prev - 1))}
                      >
                        {t.previous}
                      </button>
                      <span className="pagination-status">{t.page} {inventoryPage} / {totalInventoryPages}</span>
                      <button
                        className="pagination-btn"
                        disabled={inventoryPage >= totalInventoryPages}
                        onClick={() => setInventoryPage(prev => Math.min(totalInventoryPages, prev + 1))}
                      >
                        {t.next}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {activeTab === "market" ? (
              <div className="panel panel-overview">
                <p className="state-text">{t.marketSoon}</p>
              </div>
            ) : null}

            {activeTab === "adminDashboard" ? (
              <div className="panel panel-overview">
                {adminStatsLoading && !adminStats ? <p className="state-text">{t.adminStatsLoading}</p> : null}
                {!adminStatsLoading && adminStatsError && !adminStats ? (
                  <div className="admin-empty-card">
                    <p className="state-text state-error">{adminStatsError}</p>
                    <button className="pagination-btn" onClick={() => void loadAdminStats()}>{t.retry}</button>
                  </div>
                ) : null}
                {!adminStatsLoading && !adminStatsError && !adminStats ? <p className="state-text state-empty">{t.adminStatsEmpty}</p> : null}
                {adminStats ? (
                  <div className="admin-stats-grid">
                    <article className="admin-stat-card"><p>{t.adminCountGuilds}</p><h3>{adminStats.counts.guilds_count}</h3></article>
                    <article className="admin-stat-card"><p>{t.adminCountMembers}</p><h3>{adminStats.counts.members_count}</h3></article>
                    <article className="admin-stat-card"><p>{t.adminCountItems}</p><h3>{adminStats.counts.items_count}</h3></article>
                    <article className="admin-stat-card"><p>{t.adminCountInventory}</p><h3>{adminStats.counts.inventory_count}</h3></article>
                    <article className="admin-stat-card"><p>{t.adminCountMarket}</p><h3>{adminStats.counts.market_count}</h3></article>
                    <article className="admin-stat-card"><p>{t.adminCountStore}</p><h3>{adminStats.counts.store_count}</h3></article>
                    <article className="admin-stat-card"><p>{t.adminCountRecipes}</p><h3>{adminStats.counts.recipes_count}</h3></article>
                    <article className="admin-stat-card"><p>{t.adminCountStreamers}</p><h3>{adminStats.counts.streamers_count}</h3></article>
                    <article className="admin-stat-card"><p>{t.adminCountSettings}</p><h3>{adminStats.counts.settings_count}</h3></article>
                    <article className="admin-stat-card"><p>{t.adminCountActions}</p><h3>{adminStats.counts.actions_count}</h3></article>
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeTab === "adminLogs" ? (
              <div className="panel panel-overview admin-list-panel">
                {adminStats && adminStats.bootstrapStatuses.length > 0 ? (
                  <div className="admin-list-grid">
                    {adminStats.bootstrapStatuses.map((log, index) => (
                      <article className="admin-log-card" key={`${log.guildId}-${log.updatedAt}-${index}`}>
                        <div className="admin-log-head">
                          <p className="display-name">{log.guildName || log.guildId}</p>
                          <span className={`meta-badge ${log.status === "ok" ? "ok" : "muted"}`}>
                            {log.status === "ok" ? t.statusOk : t.statusError}
                          </span>
                        </div>
                        <p className="user-id">Guild ID: {log.guildId}</p>
                        <p className="user-id">{t.source}: {log.source}</p>
                        <p className="user-id">{t.updated}: {formatObtainedAt(log.updatedAt, dateLocale, t.unknownDate)}</p>
                        <p className="user-id">{t.channelsSynced}: {log.syncedChannels ?? 0}</p>
                        <p className="user-id">{t.rolesSynced}: {log.syncedRoles ?? 0}</p>
                        {log.message ? <p className="user-id">{t.messageLabel}: {log.message}</p> : null}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="state-text state-empty">{t.adminLogsEmpty}</p>
                )}
              </div>
            ) : null}

            {activeTab === "adminObs" ? (
              <div className="panel panel-overview admin-list-panel">
                {adminStats && adminStats.obsSettings.length > 0 ? (
                  <div className="admin-list-grid">
                    {adminStats.obsSettings.map((setting, index) => (
                      <article className="admin-log-card" key={`${setting.setting_key}-${index}`}>
                        <p className="display-name">{setting.setting_key}</p>
                        <p className="user-id">
                          {setting.setting_key === "obs_websocket_password" && setting.setting_value
                            ? "********"
                            : (setting.setting_value || "-")}
                        </p>
                        <p className="user-id">{t.updated}: {setting.updated_at ? formatObtainedAt(setting.updated_at, dateLocale, t.unknownDate) : t.unknownDate}</p>
                      </article>
                    ))}
                    <article className="admin-log-card">
                      <p className="display-name">{t.contributors}</p>
                      <div className="badges">
                        {adminStats.contributors.length > 0
                          ? adminStats.contributors.map(contributor => <span className="badge" key={contributor}>{contributor}</span>)
                          : <span className="badge">{t.none}</span>}
                      </div>
                    </article>
                  </div>
                ) : (
                  <p className="state-text state-empty">{t.adminObsEmpty}</p>
                )}
              </div>
            ) : null}

            {activeTab === "adminServers" ? (
              <div className="panel panel-overview">
                <article className="admin-empty-card">
                  <p className="display-name">{t.adminTabServers}</p>
                  <p className="state-text">{t.adminServersSoon}</p>
                </article>
              </div>
            ) : null}

            {activeTab === "adminItems" ? (
              <div className="panel panel-overview">
                <article className="admin-empty-card">
                  <p className="display-name">{t.adminTabItems}</p>
                  <p className="state-text">{t.adminItemsSoon}</p>
                </article>
              </div>
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
