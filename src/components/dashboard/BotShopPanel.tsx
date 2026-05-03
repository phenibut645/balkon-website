"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardText, LanguageCode } from "@/lib/dashboardText";
import { BotShopListing, ObsMediaProduct, ObsShopStreamer, ShopSubTab, UserBalance } from "@/lib/types";
import { BotShopItemsPanel } from "./BotShopItemsPanel";
import { BotShopOverviewPanel } from "./BotShopOverviewPanel";
import { BotShopCasesPanel } from "./BotShopCasesPanel";
import { BotShopObsPanel } from "./BotShopObsPanel";
import { BotShopObsStreamerPanel } from "./BotShopObsStreamerPanel";

type BotShopPanelProps = {
  t: DashboardText;
  language: LanguageCode;
  dateLocale: string;
  loadingGifs: string[];
  shopSubTab: ShopSubTab;
  onShopSubTabChange: (next: ShopSubTab) => void;
  botShopListings: BotShopListing[];
  botShopLoading: boolean;
  botShopError: string | null;
  onRefreshItems: () => void;
  balance: UserBalance | null;
  onBuyListing: (listingId: number, amount: number) => Promise<void>;
  buyingListingId: number | null;
  buyFeedback: Record<number, string>;
  buyErrors: Record<number, string>;
  obsStreamers: ObsShopStreamer[];
  obsStreamersLoading: boolean;
  obsStreamersError: string | null;
  onRefreshObsStreamers: () => void;
  onLoadObsStreamerDetails: (streamerId: number | string) => Promise<void>;
  obsStreamerDetailsLoading: boolean;
  obsStreamerDetailsError: string | null;
  obsMediaProducts: ObsMediaProduct[];
  buyingObsProductId: string | null;
  obsBuyFeedback: Record<string, string>;
  obsBuyErrors: Record<string, string>;
  onBuyObsMediaProduct: (streamerId: number | string, productId: string) => Promise<void>;
  onStreamerServicePurchaseSuccess?: () => Promise<void> | void;
};

export function BotShopPanel({
  t,
  language,
  dateLocale,
  loadingGifs,
  shopSubTab,
  onShopSubTabChange,
  botShopListings,
  botShopLoading,
  botShopError,
  onRefreshItems,
  balance,
  onBuyListing,
  buyingListingId,
  buyFeedback,
  buyErrors,
  obsStreamers,
  obsStreamersLoading,
  obsStreamersError,
  onRefreshObsStreamers,
  onLoadObsStreamerDetails,
  obsStreamerDetailsLoading,
  obsStreamerDetailsError,
  obsMediaProducts,
  buyingObsProductId,
  obsBuyFeedback,
  obsBuyErrors,
  onBuyObsMediaProduct,
  onStreamerServicePurchaseSuccess,
}: BotShopPanelProps) {
  const [selectedStreamerId, setSelectedStreamerId] = useState<string | null>(null);

  useEffect(() => {
    if (shopSubTab !== "obs") {
      setSelectedStreamerId(null);
    }
  }, [shopSubTab]);

  const selectedStreamer = useMemo(
    () => obsStreamers.find(streamer => String(streamer.streamerId) === selectedStreamerId) || null,
    [obsStreamers, selectedStreamerId],
  );

  return (
    <div className="panel panel-botshop">
      <div className="botshop-scroll">
        <div className="dashboard-subtabs" role="tablist" aria-label={t.tabBotShop}>
          <button type="button" className={`dashboard-subtab-chip ${shopSubTab === "overview" ? "active" : ""}`} onClick={() => onShopSubTabChange("overview")}>{t.shopOverview}</button>
          <button type="button" className={`dashboard-subtab-chip ${shopSubTab === "items" ? "active" : ""}`} onClick={() => onShopSubTabChange("items")}>{t.shopItems}</button>
          <button type="button" className={`dashboard-subtab-chip ${shopSubTab === "cases" ? "active" : ""}`} onClick={() => onShopSubTabChange("cases")}>{t.shopCases}</button>
          <button type="button" className={`dashboard-subtab-chip ${shopSubTab === "obs" ? "active" : ""}`} onClick={() => onShopSubTabChange("obs")}>{t.shopObs}</button>
        </div>

        {shopSubTab === "overview" ? (
          <BotShopOverviewPanel t={t} onOpenSubTab={onShopSubTabChange} />
        ) : null}

        {shopSubTab === "items" ? (
          <BotShopItemsPanel
            t={t}
            language={language}
            loadingGifs={loadingGifs}
            botShopListings={botShopListings}
            botShopLoading={botShopLoading}
            botShopError={botShopError}
            onRefresh={onRefreshItems}
            balance={balance}
            onBuyListing={onBuyListing}
            buyingListingId={buyingListingId}
            buyFeedback={buyFeedback}
            buyErrors={buyErrors}
          />
        ) : null}

        {shopSubTab === "cases" ? <BotShopCasesPanel t={t} /> : null}

        {shopSubTab === "obs" ? (
          selectedStreamer ? (
            <BotShopObsStreamerPanel
              t={t}
              streamer={selectedStreamer}
              mediaProducts={obsMediaProducts}
              balance={balance}
              dateLocale={dateLocale}
              loading={obsStreamerDetailsLoading}
              error={obsStreamerDetailsError}
              onBack={() => {
                setSelectedStreamerId(null);
              }}
              buyingProductId={buyingObsProductId}
              feedbackByProductId={obsBuyFeedback}
              errorByProductId={obsBuyErrors}
              onBuyMediaProduct={async (productId) => {
                await onBuyObsMediaProduct(selectedStreamer.streamerId, productId);
              }}
              onStreamerServicePurchaseSuccess={onStreamerServicePurchaseSuccess}
            />
          ) : (
            <BotShopObsPanel
              t={t}
              loading={obsStreamersLoading}
              error={obsStreamersError}
              streamers={obsStreamers}
              onRefresh={onRefreshObsStreamers}
              onOpenStreamer={(streamer) => {
                setSelectedStreamerId(String(streamer.streamerId));
                void onLoadObsStreamerDetails(streamer.streamerId);
              }}
            />
          )
        ) : null}
      </div>
    </div>
  );
}
