import { useState } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { MarketCapitalizationData, MarketListing } from "@/lib/types";
import { MarketOverviewPanel } from "./MarketOverviewPanel";
import { MarketListingsPanel } from "./MarketListingsPanel";

type MarketSubTab = "overview" | "listings";

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
  onRefreshListings: () => void;
  onRefreshCapitalization: () => void;
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
  onRefreshListings,
  onRefreshCapitalization,
}: MarketPanelProps) {
  const [subTab, setSubTab] = useState<MarketSubTab>("overview");

  return (
    <div className="panel panel-market">
      <div className="market-scroll">
        <div className="market-subtabs" role="tablist" aria-label={t.marketSubtabLabel}>
          <button
            type="button"
            role="tab"
            aria-selected={subTab === "overview"}
            className={`market-subtab-chip ${subTab === "overview" ? "active" : ""}`}
            onClick={() => setSubTab("overview")}
          >
            {t.marketOverview}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subTab === "listings"}
            className={`market-subtab-chip ${subTab === "listings" ? "active" : ""}`}
            onClick={() => setSubTab("listings")}
          >
            {t.marketListings}
          </button>
        </div>

        {subTab === "overview" ? (
          <MarketOverviewPanel
            t={t}
            dateLocale={dateLocale}
            loading={marketCapitalizationLoading}
            error={marketCapitalizationError}
            capitalization={marketCapitalization}
            onRefresh={onRefreshCapitalization}
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
