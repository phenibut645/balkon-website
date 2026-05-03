import { DashboardText } from "@/lib/dashboardText";
import { MarketSubTab } from "@/lib/dashboardSearch";
import { MarketCapitalizationData, MarketForbesEntry, MarketListing } from "@/lib/types";
import { MarketOverviewPanel } from "./MarketOverviewPanel";
import { MarketListingsPanel } from "./MarketListingsPanel";
import { MarketForbesPanel } from "./MarketForbesPanel";

type MarketPanelProps = {
  t: DashboardText;
  dateLocale: string;
  loadingGifs: string[];
  marketListings: MarketListing[];
  marketLoading: boolean;
  marketError: string | null;
  marketCapitalization: MarketCapitalizationData | null;
  marketCapitalizationLoading: boolean;
  marketCapitalizationError: string | null;
  marketForbes: MarketForbesEntry[];
  marketForbesLoading: boolean;
  marketForbesError: string | null;
  streamerMode?: boolean;
  marketSubTab: MarketSubTab;
  onMarketSubTabChange: (subTab: MarketSubTab) => void;
  onRefreshListings: () => void;
  onRefreshCapitalization: () => void;
  onRefreshForbes: () => void;
  myDiscordId: string;
  marketBuyingListingId: number | null;
  marketUpdatingListingId: number | null;
  marketCancellingListingId: number | null;
  marketListingFeedbackById: Record<number, string>;
  marketListingErrorById: Record<number, string>;
  onBuyMarketListing: (listingId: number) => void | Promise<void>;
  onUpdateMarketListingPrice: (listingId: number, price: number) => void | Promise<void>;
  onCancelMarketListing: (listingId: number) => void | Promise<void>;
  onClearMarketListingMessage: (listingId: number) => void;
};

export function MarketPanel({
  t,
  dateLocale,
  loadingGifs,
  marketListings,
  marketLoading,
  marketError,
  marketCapitalization,
  marketCapitalizationLoading,
  marketCapitalizationError,
  marketForbes,
  marketForbesLoading,
  marketForbesError,
  streamerMode = false,
  marketSubTab,
  onMarketSubTabChange,
  onRefreshListings,
  onRefreshCapitalization,
  onRefreshForbes,
  myDiscordId,
  marketBuyingListingId,
  marketUpdatingListingId,
  marketCancellingListingId,
  marketListingFeedbackById,
  marketListingErrorById,
  onBuyMarketListing,
  onUpdateMarketListingPrice,
  onCancelMarketListing,
  onClearMarketListingMessage,
}: MarketPanelProps) {
  return (
    <div className="panel panel-market">
      <div className="market-scroll">
        <div className="market-subtabs" role="tablist" aria-label={t.marketSubtabLabel}>
          <button
            type="button"
            role="tab"
            aria-selected={marketSubTab === "overview"}
            className={`market-subtab-chip ${marketSubTab === "overview" ? "active" : ""}`}
            onClick={() => onMarketSubTabChange("overview")}
          >
            {t.marketOverview}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={marketSubTab === "listings"}
            className={`market-subtab-chip ${marketSubTab === "listings" ? "active" : ""}`}
            onClick={() => onMarketSubTabChange("listings")}
          >
            {t.marketListings}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={marketSubTab === "forbes"}
            className={`market-subtab-chip ${marketSubTab === "forbes" ? "active" : ""}`}
            onClick={() => onMarketSubTabChange("forbes")}
          >
            {t.marketForbes}
          </button>
        </div>

        {marketSubTab === "overview" ? (
          <MarketOverviewPanel
            t={t}
            dateLocale={dateLocale}
            loading={marketCapitalizationLoading}
            error={marketCapitalizationError}
            capitalization={marketCapitalization}
            onRefresh={onRefreshCapitalization}
          />
        ) : marketSubTab === "forbes" ? (
          <MarketForbesPanel
            t={t}
            leaderboard={marketForbes}
            loading={marketForbesLoading}
            error={marketForbesError}
            onRefresh={onRefreshForbes}
            streamerMode={streamerMode}
          />
        ) : (
          <MarketListingsPanel
            t={t}
            loadingGifs={loadingGifs}
            marketListings={marketListings}
            marketLoading={marketLoading}
            marketError={marketError}
            streamerMode={streamerMode}
            onRefresh={onRefreshListings}
            myDiscordId={myDiscordId}
            marketBuyingListingId={marketBuyingListingId}
            marketUpdatingListingId={marketUpdatingListingId}
            marketCancellingListingId={marketCancellingListingId}
            marketListingFeedbackById={marketListingFeedbackById}
            marketListingErrorById={marketListingErrorById}
            onBuyMarketListing={onBuyMarketListing}
            onUpdateMarketListingPrice={onUpdateMarketListingPrice}
            onCancelMarketListing={onCancelMarketListing}
            onClearMarketListingMessage={onClearMarketListingMessage}
          />
        )}
      </div>
    </div>
  );
}
