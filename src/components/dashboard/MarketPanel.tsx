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
  marketSubTab: MarketSubTab;
  onMarketSubTabChange: (subTab: MarketSubTab) => void;
  onRefreshListings: () => void;
  onRefreshCapitalization: () => void;
  onRefreshForbes: () => void;
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
  marketSubTab,
  onMarketSubTabChange,
  onRefreshListings,
  onRefreshCapitalization,
  onRefreshForbes,
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
            streamerMode={false}
          />
        ) : (
          <MarketListingsPanel
            t={t}
            loadingGifs={loadingGifs}
            marketListings={marketListings}
            marketLoading={marketLoading}
            marketError={marketError}
            onRefresh={onRefreshListings}
          />
        )}
      </div>
    </div>
  );
}
