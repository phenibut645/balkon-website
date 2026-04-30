import { DashboardText } from "@/lib/dashboardText";
import { MarketListing } from "@/lib/types";
import { UserIdentity } from "./UserIdentity";

type MarketListingsPanelProps = {
  t: DashboardText;
  loadingGifs: string[];
  marketListings: MarketListing[];
  marketLoading: boolean;
  marketError: string | null;
  onRefresh: () => void;
};

export function MarketListingsPanel({ t, loadingGifs, marketListings, marketLoading, marketError, onRefresh }: MarketListingsPanelProps) {
  return (
    <div className="market-subpanel">
      {marketLoading ? (
        <div className="loading-block slim">
          <p className="state-text">{t.marketLoading}</p>
          <div className="loading-gif-strip small">
            {loadingGifs.map((src, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={`market-${src}-${index}`} src={src} alt="Loading" className="loading-gif" />
            ))}
          </div>
        </div>
      ) : null}

      {!marketLoading && marketError ? (
        <div className="admin-empty-card">
          <p className="state-text state-error">{marketError}</p>
          <button className="pagination-btn" onClick={onRefresh}>{t.marketRefresh}</button>
        </div>
      ) : null}

      {!marketLoading && !marketError && marketListings.length === 0 ? (
        <p className="state-text state-empty">{t.marketEmpty}</p>
      ) : null}

      {!marketLoading && !marketError && marketListings.length > 0 ? (
        <div className="market-grid">
          {marketListings.map(listing => {
            const rarityAccent = listing.rarityColorHex || "#44506d";
            return (
              <article
                key={listing.listingId}
                className="market-card"
                style={{ borderColor: `${rarityAccent}66`, boxShadow: `0 0 0 1px ${rarityAccent}22 inset` }}
              >
                <div className="market-media" style={{ background: `linear-gradient(145deg, ${rarityAccent}2d, #1d2437)` }}>
                  {listing.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={listing.imageUrl}
                      alt={listing.name}
                      className="market-image"
                      onError={event => {
                        const target = event.currentTarget;
                        target.style.display = "none";
                        const fallback = target.parentElement?.querySelector<HTMLElement>(".market-emoji-fallback");
                        if (fallback) fallback.style.display = "grid";
                      }}
                    />
                  ) : null}
                  <div className="market-emoji-fallback" style={{ display: listing.imageUrl ? "none" : "grid" }}>
                    {listing.emoji || "📦"}
                  </div>
                </div>

                <div className="market-content">
                  <h3 className="market-title">{listing.name}</h3>
                  <p className="market-description">{listing.description}</p>

                  <div className="market-meta">
                    <span className="meta-badge rarity-badge" style={{ borderColor: `${rarityAccent}66` }}>
                      {listing.rarityName}
                    </span>
                    <span className="meta-badge">{listing.itemType}</span>
                    <span className="meta-badge">Tier {listing.tier}</span>
                    <span className="meta-badge">{t.marketListingId} #{listing.listingId}</span>
                    <span className="meta-badge">{t.marketInventoryItemId} #{listing.inventoryItemId}</span>
                    <span className="meta-badge price">{t.marketPrice}: {listing.price} ODM</span>
                    <div className="market-seller-chip">
                      <span className="market-card-label">{t.marketSeller}</span>
                      <UserIdentity
                        user={{
                          discordId: listing.sellerDiscordId,
                          username: null,
                          globalName: null,
                          avatarUrl: null,
                        }}
                        size="sm"
                        showAvatar={false}
                      />
                    </div>
                    <span className={`meta-badge ${listing.tradeable ? "ok" : "muted"}`}>
                      {listing.tradeable ? t.tradeableYes : t.tradeableNo}
                    </span>
                    <span className={`meta-badge ${listing.sellable ? "ok" : "muted"}`}>
                      {listing.sellable ? t.sellableYes : t.sellableNo}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
