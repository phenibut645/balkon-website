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
