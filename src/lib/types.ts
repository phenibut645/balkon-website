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
