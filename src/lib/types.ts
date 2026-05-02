export type ApiMeResponse = {
  ok: boolean;
  me?: {
    discordId: string;
    roles: string[];
    username?: string | null;
    globalName?: string | null;
    avatar?: string | null;
    avatarUrl?: string | null;
  };
  error?: string;
  message?: string;
};

export type InventoryItem = {
  inventoryItemId: number;
  ownerDiscordId: string;
  originalOwnerDiscordId: string | null;
  obtainedAt: string | Date;
  tier: number;
  itemTemplateId: number;
  name: string;
  description: string;
  emoji: string | null;
  imageUrl: string | null;
  tradeable: boolean;
  sellable: boolean;
  botSellPrice: number | null;
  itemType: string;
  rarityName: string;
  rarityColorHex: string | null;
};

export type ApiInventoryResponse = {
  ok: boolean;
  items?: InventoryItem[];
  error?: string;
  message?: string;
};

export type MarketListing = {
  listingId: number;
  sellerDiscordId: string;
  price: number;
  inventoryItemId: number;
  ownerDiscordId: string;
  originalOwnerDiscordId: string | null;
  obtainedAt: string | Date;
  tier: number;
  itemTemplateId: number;
  name: string;
  description: string;
  emoji: string | null;
  imageUrl: string | null;
  tradeable: boolean;
  sellable: boolean;
  botSellPrice: number | null;
  itemType: string;
  rarityName: string;
  rarityColorHex: string | null;
};

export type ApiMarketResponse = {
  ok: boolean;
  listings?: MarketListing[];
  error?: string;
  message?: string;
};

export type UserIdentityView = {
  discordId: string;
  username: string | null;
  globalName: string | null;
  avatarUrl: string | null;
};

export type UserPublicProfile = UserIdentityView & {
  balance: number;
  ldmBalance: number;
  homeGuildId: string | null;
  homeGuildName: string | null;
  publicDescription: string | null;
};

export type AvailableGuild = {
  guildId: string;
  name: string;
  iconUrl?: string | null;
};

export type GuildUserRole = "owner" | "admin" | "member" | "unknown";

export type UserGuild = {
  guildId: string;
  name: string;
  iconUrl: string | null;
  memberCount: number | null;
  streamerCount: number | null;
  isHomeGuild: boolean;
  userRole: GuildUserRole;
  botRegistered: boolean;
};

export type GuildOverview = {
  guildId: string;
  name: string;
  iconUrl: string | null;
  memberCount: number | null;
  streamerCount: number | null;
  itemCount: number | null;
  inventoryCount: number | null;
  marketListingCount: number | null;
  userRole: GuildUserRole;
  botRegistered: boolean;
};

export type ApiMyGuildsResponse = ApiBaseResponse & {
  guilds?: UserGuild[];
};

export type ApiGuildOverviewResponse = ApiBaseResponse & {
  guild?: GuildOverview;
};

export type UpdateUserProfileInput = {
  homeGuildId?: string | null;
  publicDescription?: string | null;
};

export type ApiProfileMeResponse = {
  ok: boolean;
  profile?: UserPublicProfile;
  availableGuilds?: AvailableGuild[];
  error?: string;
  message?: string;
};

export type MarketForbesEntry = UserPublicProfile & {
  rank: number;
};

export type ApiMarketForbesResponse = {
  ok: boolean;
  leaderboard?: MarketForbesEntry[];
  error?: string;
  message?: string;
};

export type MarketCapitalizationPoint = {
  date: string;
  totalOdm: number;
  totalLdm: number;
  membersCount: number;
};

export type MarketCapitalizationChange = {
  previousTotalOdm: number | null;
  absolute: number | null;
  percent: number | null;
  direction: "up" | "down" | "flat" | "unknown";
};

export type MarketCapitalizationData = {
  points: MarketCapitalizationPoint[];
  current: {
    totalOdm: number;
    totalLdm: number;
    membersCount: number;
  };
  change: MarketCapitalizationChange;
};

export type ApiMarketCapitalizationResponse = {
  ok: boolean;
  capitalization?: MarketCapitalizationData;
  error?: string;
  message?: string;
};

export type BotShopListing = {
  listingId: number;
  price: number;
  itemTemplateId: number;
  name: string;
  description: string;
  emoji: string | null;
  imageUrl: string | null;
  tradeable: boolean;
  sellable: boolean;
  botSellPrice: number | null;
  itemType: string;
  rarityName: string;
  rarityColorHex: string | null;
};

export type ShopSubTab = "overview" | "items" | "cases" | "obs";

export type ObsShopStreamer = {
  streamerId: number | string;
  discordGuildId: string;
  guildDisplayName: string | null;
  nickname: string;
  twitchUrl: string | null;
  isPrimary: boolean;
  obsAgentId: string | null;
  obsAgentOnline: boolean;
  obsAgentLastSeenAt?: string | null;
  obsAgentConnectedAt?: string | null;
  obsAgentDisconnectedAt?: string | null;
  obsAgentLastError?: string | null;
  obsAgentStatusSource?: "database";
  streamingStatus: "live" | "offline" | "unknown";
  lastSeenAt: string | null;
};

export type ObsMediaProduct = {
  id: string;
  kind: "image" | "gif";
  title: string;
  description: string;
  priceOdm: number;
  durationSeconds: number;
  previewUrl: string | null;
  enabled: boolean;
};

export type ObsMediaPurchaseData = {
  streamerId: number;
  productId: string;
  priceOdm: number;
  balanceAfter: number;
  commandId?: string;
};

export type ObsMediaActionStatus = "pending" | "sent" | "failed" | "refunded";

export type ObsMediaAction = {
  id: number;
  buyerDiscordId: string;
  buyerDisplayName: string | null;
  streamerId: number;
  streamerNickname: string;
  agentId: string | null;
  productId: string;
  productKind: "image" | "gif";
  productTitle: string;
  mediaUrl: string;
  priceOdm: number;
  durationMs: number;
  status: ObsMediaActionStatus;
  commandId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  refundedOdm: number;
  createdAt: string;
  sentAt: string | null;
  failedAt: string | null;
  refundedAt: string | null;
};

export type ApiBotShopResponse = {
  ok: boolean;
  listings?: BotShopListing[];
  error?: string;
  message?: string;
};

export type ApiObsShopStreamersResponse = ApiBaseResponse & {
  streamers?: ObsShopStreamer[];
};

export type ApiObsShopStreamerDetailsResponse = ApiBaseResponse & {
  streamer?: ObsShopStreamer;
  mediaProducts?: ObsMediaProduct[];
};

export type ApiObsMediaPurchaseResponse = ApiBaseResponse & {
  data?: ObsMediaPurchaseData;
};

export type ApiObsMediaActionsResponse = ApiBaseResponse & {
  actions?: ObsMediaAction[];
  page?: number;
  pageSize?: number;
  total?: number;
};

export type CraftRecipeIngredient = {
  itemTemplateId: number;
  name: string;
  emoji: string | null;
  amount: number;
};

export type CraftRecipe = {
  recipeId: number;
  name: string;
  description: string | null;
  resultAmount: number;
  resultItemTemplateId: number;
  resultName: string;
  resultEmoji: string | null;
  resultRarityName: string;
  ingredients: CraftRecipeIngredient[];
};

export type ApiCraftRecipesResponse = {
  ok: boolean;
  recipes?: CraftRecipe[];
  error?: string;
  message?: string;
};

export type AdminCounts = {
  guilds_count: number;
  members_count: number;
  items_count: number;
  inventory_count: number;
  market_count: number;
  store_count: number;
  recipes_count: number;
  streamers_count: number;
  settings_count: number;
  actions_count: number;
};

export type AdminBootstrapStatus = {
  guildId: string;
  guildName?: string;
  source: "guildCreate" | "clientReady";
  status: "ok" | "error";
  syncedChannels?: number;
  removedChannels?: number;
  syncedRoles?: number;
  removedRoles?: number;
  configuredLogChannels?: number;
  bootstrapChannelId?: string | null;
  message?: string;
  updatedAt: string;
};

export type AdminObsSetting = {
  setting_key: string;
  setting_value: string | null;
  updated_at: string | Date | null;
};

export type AdminStats = {
  counts: AdminCounts;
  contributors: string[];
  obsSettings: AdminObsSetting[];
  bootstrapStatuses: AdminBootstrapStatus[];
};

export type AdminStatsResponse = {
  ok: boolean;
  stats?: AdminStats;
  error?: string;
  message?: string;
};

export type ApiBaseResponse = {
  ok: boolean;
  error?: string;
  message?: string;
};

// ── Streamer Studio (Phase 4 UI) ──────────────────────────────────────────────

export type StreamerStudioAccessRole = "owner" | "manager" | "moderator" | "bot_admin";

export type StreamerStudioAccessView = {
  streamerId: number;
  nickname: string;
  twitchUrl: string | null;
  accessRole: StreamerStudioAccessRole;
  canManage: boolean;
  canControl: boolean;
  obsAgentConfigured?: boolean;
  obsAgentOnline?: boolean;
  obsAgentVersion?: string | null;
  obsRelayProtocolVersion?: number | null;
  obsAgentCapabilities?: string[];
  obsConnected?: boolean | null;
  obsVersion?: string | null;
  obsWebsocketVersion?: string | null;
};

export type StreamerStudioMeResponse = ApiBaseResponse & {
  data?: {
    owned: StreamerStudioAccessView[];
    trusted: StreamerStudioAccessView[];
    isBotAdmin: boolean;
  };
};

export type StreamerStudioAccessibleResponse = ApiBaseResponse & {
  data?: StreamerStudioAccessView[];
};

export type StreamerStudioTrustedUserRole = "moderator" | "manager";

export type StreamerStudioTrustedUserView = {
  id?: number;
  memberId?: number;
  discordId: string;
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  role: StreamerStudioTrustedUserRole;
  createdAt?: string | null;
};

export type StreamerStudioTrustedUsersResponse = ApiBaseResponse & {
  data?: StreamerStudioTrustedUserView[];
};

export type StreamerStudioTrustedUserMutationResponse = ApiBaseResponse & {
  data?: StreamerStudioTrustedUserView;
};

export type StreamerStudioTrustedUserInput = {
  discordId: string;
  role?: StreamerStudioTrustedUserRole;
};

export type ObsStudioSceneView = {
  name: string;
};

export type ObsStudioScenesListResult = {
  scenes: ObsStudioSceneView[];
  currentProgramSceneName: string | null;
};

export type ObsStudioSceneItemTransform = {
  positionX: number;
  positionY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  width?: number;
  height?: number;
};

export type ObsStudioSceneItemView = {
  sceneItemId: number;
  sourceName: string;
  inputKind: string | null;
  enabled: boolean;
  sceneItemIndex?: number;
  transform: ObsStudioSceneItemTransform;
};

export type ObsStudioSceneItemsListResult = {
  sceneName: string;
  items: ObsStudioSceneItemView[];
};

export type ApiStreamerStudioScenesListResponse = ApiBaseResponse & {
  data?: ObsStudioScenesListResult;
};

export type ApiStreamerStudioSceneItemsListResponse = ApiBaseResponse & {
  data?: ObsStudioSceneItemsListResult;
};

export type ObsStudioTransformApplyInput = {
  sceneName: string;
  sceneItemId: number;
  sourceName?: string | null;
  transform: {
    positionX: number;
    positionY: number;
    scaleX: number;
    scaleY: number;
    rotation?: number;
  };
};

export type ObsStudioTransformApplyResult = {
  sceneName: string;
  sceneItemId: number;
  sourceName: string | null;
  transform: ObsStudioSceneItemTransform;
};

export type ApiStreamerStudioTransformApplyResponse = ApiBaseResponse & {
  data?: ObsStudioTransformApplyResult;
};

export type ObsStudioSceneItemIndexListItem = {
  sceneItemId: number;
  sourceName: string;
  sceneItemIndex: number;
  enabled?: boolean;
};

export type ObsStudioSceneItemIndexApplyInput = {
  sceneName: string;
  sceneItemId: number;
  sourceName?: string | null;
  sceneItemIndex: number;
};

export type ObsStudioSceneItemIndexApplyResult = {
  sceneName: string;
  sceneItemId: number;
  sourceName: string | null;
  sceneItemIndex: number;
  items: ObsStudioSceneItemIndexListItem[];
};

export type ApiStreamerStudioSceneItemIndexApplyResponse = ApiBaseResponse & {
  data?: ObsStudioSceneItemIndexApplyResult;
};

export type ObsStudioSceneItemVisibilityInput = {
  sceneName: string;
  sceneItemId: number;
  sourceName?: string | null;
  enabled: boolean;
};

export type ObsStudioSceneItemVisibilityResult = {
  sceneName: string;
  sceneItemId: number;
  sourceName: string | null;
  enabled: boolean;
  items: ObsStudioSceneItemIndexListItem[];
};

export type ApiStreamerStudioSceneItemVisibilityResponse = ApiBaseResponse & {
  data?: ObsStudioSceneItemVisibilityResult;
};

export type ObsStudioSceneItemRemoveInput = {
  sceneName: string;
  sceneItemId: number;
  sourceName?: string | null;
};

export type ObsStudioSceneItemRemoveResult = {
  sceneName: string;
  sceneItemId: number;
  sourceName: string | null;
  removed: boolean;
  items: ObsStudioSceneItemIndexListItem[];
};

export type ApiStreamerStudioSceneItemRemoveResponse = ApiBaseResponse & {
  data?: ObsStudioSceneItemRemoveResult;
};

export type ObsStudioTextSourceCreateInput = {
  sceneName: string;
  sourceName?: string | null;
  text: string;
  positionX?: number;
  positionY?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
};

export type ObsStudioTextSourceCreateResult = {
  sceneName: string;
  sceneItemId: number;
  sourceName: string;
  inputKind: string;
  transform: ObsStudioSceneItemTransform;
  items: ObsStudioSceneItemIndexListItem[];
};

export type ApiStreamerStudioTextSourceCreateResponse = ApiBaseResponse & {
  data?: ObsStudioTextSourceCreateResult;
};

export type ObsStudioTextSourceUpdateInput = {
  sceneName: string;
  sceneItemId: number;
  sourceName?: string | null;
  text: string;
};

export type ObsStudioTextSourceUpdateResult = {
  sceneName: string;
  sceneItemId: number;
  sourceName: string;
  inputKind: string | null;
  text: string;
};

export type ApiStreamerStudioTextSourceUpdateResponse = ApiBaseResponse & {
  data?: ObsStudioTextSourceUpdateResult;
};

export type ObsStudioBrowserSourceCreateInput = {
  sceneName: string;
  sourceName?: string | null;
  url: string;
  width?: number;
  height?: number;
  positionX?: number;
  positionY?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
};

export type ObsStudioBrowserSourceCreateResult = {
  sceneName: string;
  sceneItemId: number;
  sourceName: string;
  inputKind: "browser_source";
  url: string;
  width: number;
  height: number;
  transform: ObsStudioSceneItemTransform;
  items: Array<{
    sceneItemId: number;
    sourceName: string;
    sceneItemIndex: number;
  }>;
};

export type ApiStreamerStudioBrowserSourceCreateResponse = ApiBaseResponse & {
  data?: ObsStudioBrowserSourceCreateResult;
};

export type ObsStudioBrowserSourceUpdateInput = {
  sceneName: string;
  sceneItemId: number;
  sourceName?: string | null;
  url?: string;
  width?: number;
  height?: number;
};

export type ObsStudioBrowserSourceUpdateResult = {
  sceneName: string;
  sceneItemId: number;
  sourceName: string;
  inputKind: string;
  url?: string;
  width?: number;
  height?: number;
};

export type ApiStreamerStudioBrowserSourceUpdateResponse = ApiBaseResponse & {
  data?: ObsStudioBrowserSourceUpdateResult;
};

export type ObsStudioSourceSettingsGetInput = {
  sceneName: string;
  sceneItemId: number;
  sourceName?: string | null;
};

export type ObsStudioSourceSettingsGetResult = {
  sceneName: string;
  sceneItemId: number;
  sourceName: string;
  inputKind: string | null;
  settings: {
    text?: string;
    url?: string;
    width?: number;
    height?: number;
  };
};

export type ApiStreamerStudioSourceSettingsGetResponse = ApiBaseResponse & {
  data?: ObsStudioSourceSettingsGetResult;
};

export type AdminItem = {
  id: number;
  name: string;
  description: string;
  emoji: string | null;
  imageUrl: string | null;
  tradeable: boolean;
  sellable: boolean;
  botSellPrice: number | null;
  itemType: string;
  rarityName: string;
  rarityColorHex: string | null;
};

export type AdminItemInput = {
  name: string;
  description: string;
  emoji?: string | null;
  imageUrl?: string | null;
  rarityName: string;
  typeName: string;
  tradeable: boolean;
  botSellPrice?: number | null;
};

export type ApiAdminItemsResponse = ApiBaseResponse & {
  items?: AdminItem[];
};

export type ApiAdminItemMutationResponse = ApiBaseResponse & {
  data?: {
    itemTemplateId: number;
  };
};

export type AdminRarityOption = {
  id: number;
  name: string;
  color_hex: string | null;
  created_by_discord_id: string | null;
};

export type ApiAdminRaritiesResponse = ApiBaseResponse & {
  rarities?: AdminRarityOption[];
};

export type AdminSearchOption = {
  /** Numeric id — present when backend returns the `id` field directly. */
  id?: number;
  /** Primary identifier returned by the backend autocomplete endpoint as `value`. */
  value?: string | number;
  name: string;
  color_hex?: string | null;
};

export type ApiAdminSearchResponse = ApiBaseResponse & {
  options?: AdminSearchOption[];
};

export type AdminBotShopListing = {
  listingId: number;
  price: number;
  itemTemplateId: number;
  name: string;
  description: string;
  emoji: string | null;
  imageUrl: string | null;
  tradeable: boolean;
  sellable: boolean;
  botSellPrice: number | null;
  itemType: string;
  rarityName: string;
  rarityColorHex: string | null;
};

export type AdminBotShopInput = {
  itemTemplateId: number;
  price: number;
};

export type ApiAdminBotShopResponse = ApiBaseResponse & {
  listings?: AdminBotShopListing[];
};

export type ApiAdminBotShopMutationResponse = ApiBaseResponse & {
  data?: {
    listingId: number;
  };
};

export type AdminEconomyCurrency = "ODM" | "LDM";

export type AdminEconomyAdjustInput = {
  targetDiscordId: string;
  currency: AdminEconomyCurrency;
  amount: number;
  reason: string;
};

export type AdminEconomyAdjustResult = {
  targetDiscordId: string;
  currency: AdminEconomyCurrency;
  amount: number;
  balanceAfter: number;
  reason: string;
};

export type ApiAdminEconomyAdjustResponse = ApiBaseResponse & {
  data?: AdminEconomyAdjustResult;
};

export type UserBalance = {
  odm: number;
  ldm: number;
};

export type ApiEconomyMeResponse = ApiBaseResponse & {
  balance?: UserBalance;
};

export type ApiBotShopBuyResponse = ApiBaseResponse & {
  data?: {
    inserted: number;
    listingId: number;
  };
};

export type NotificationSeverity = "info" | "success" | "warning" | "danger";

export type NotificationItem = {
  id: number;
  type: string;
  severity: NotificationSeverity;
  title: string;
  body: string;
  imageUrl: string | null;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
};

export type ApiNotificationsResponse = ApiBaseResponse & {
  notifications?: NotificationItem[];
  page?: number;
  pageSize?: number;
  total?: number;
  unreadCount?: number;
};

export type ApiNotificationsSummaryResponse = ApiBaseResponse & {
  unreadCount?: number;
  latest?: NotificationItem[];
};

export type OverviewLatestNotification = {
  id: number;
  title: string;
  body: string;
  type: string | null;
  severity: NotificationSeverity;
  readAt: string | null;
  createdAt: string;
};

export type OverviewLatestObsAction = {
  id: number;
  productTitle: string;
  productKind: "image" | "gif";
  streamerNickname: string;
  status: ObsMediaActionStatus;
  priceOdm: number;
  createdAt: string;
};

export type OverviewSummary = {
  balance: UserBalance;
  inventoryCount: number;
  unreadNotificationsCount: number;
  latestNotifications: OverviewLatestNotification[];
  homeGuild: {
    guildId: string;
    name: string;
    iconUrl: string | null;
  } | null;
  obsActions: {
    total: number;
    latest: OverviewLatestObsAction | null;
  };
};

export type ApiOverviewMeResponse = ApiBaseResponse & {
  data?: OverviewSummary;
};

export type ApiNotificationMutationResponse = ApiBaseResponse & {
  updated?: number;
};

export type AdminBroadcastNotificationInput = {
  title: string;
  body: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  severity?: NotificationSeverity;
};

export type ApiAdminBroadcastNotificationResponse = ApiBaseResponse & {
  data?: {
    inserted: number;
  };
};
