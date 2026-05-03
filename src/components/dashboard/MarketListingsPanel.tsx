import { useCallback, useEffect, useRef, useState } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { MarketListing } from "@/lib/types";
import { UserIdentity } from "./UserIdentity";
import { ConfirmDialog } from "./ConfirmDialog";
import { ItemBadgeRow } from "./items/ItemBadgeRow";
import { ItemMedia } from "./items/ItemMedia";

function parsePositiveFinitePrice(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return n;
}

type MarketListingsPanelProps = {
  t: DashboardText;
  loadingGifs: string[];
  marketListings: MarketListing[];
  marketLoading: boolean;
  marketError: string | null;
  streamerMode?: boolean;
  onRefresh: () => void;
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

export function MarketListingsPanel({
  t,
  loadingGifs,
  marketListings,
  marketLoading,
  marketError,
  streamerMode = false,
  onRefresh,
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
}: MarketListingsPanelProps) {
  const [listingPriceDraftById, setListingPriceDraftById] = useState<Record<number, string>>({});
  const [priceDraftLocalErrorById, setPriceDraftLocalErrorById] = useState<Record<number, string>>({});
  const [buyConfirmListing, setBuyConfirmListing] = useState<MarketListing | null>(null);
  const [cancelConfirmListing, setCancelConfirmListing] = useState<MarketListing | null>(null);

  const lastKnownServerPriceRef = useRef<Map<number, number>>(new Map());
  const dirtyPriceDraftIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const prevMap = lastKnownServerPriceRef.current;
    setListingPriceDraftById(prevDrafts => {
      const nextDrafts = { ...prevDrafts };
      let changedDrafts = false;
      const allowed = new Set<number>();

      for (const listing of marketListings) {
        allowed.add(listing.listingId);
        const before = prevMap.get(listing.listingId);

        prevMap.set(listing.listingId, listing.price);

        if (before === undefined) {
          if (nextDrafts[listing.listingId] === undefined) {
            nextDrafts[listing.listingId] = String(listing.price);
            changedDrafts = true;
          }
          continue;
        }

        const serverPriceMoved = before !== listing.price;
        const shouldSyncDraft = serverPriceMoved && !dirtyPriceDraftIdsRef.current.has(listing.listingId);

        if (shouldSyncDraft) {
          nextDrafts[listing.listingId] = String(listing.price);
          changedDrafts = true;
        }
      }

      for (const id of [...prevMap.keys()]) {
        if (!allowed.has(id)) {
          prevMap.delete(id);
        }
      }

      for (const key of Object.keys(nextDrafts)) {
        const id = Number(key);
        if (!allowed.has(id)) {
          delete nextDrafts[id];
          changedDrafts = true;
        }
      }

      return changedDrafts ? nextDrafts : prevDrafts;
    });

    setPriceDraftLocalErrorById(prevErrors => {
      const nextErrors = { ...prevErrors };
      let changedErrors = false;
      const allowed = new Set(marketListings.map(l => l.listingId));
      for (const key of Object.keys(nextErrors)) {
        const id = Number(key);
        if (!allowed.has(id)) {
          delete nextErrors[id];
          changedErrors = true;
        }
      }
      return changedErrors ? nextErrors : prevErrors;
    });
  }, [marketListings]);

  const handleConfirmBuy = useCallback(async () => {
    const listing = buyConfirmListing;
    if (!listing) {
      return;
    }
    await onBuyMarketListing(listing.listingId);
    setBuyConfirmListing(null);
  }, [buyConfirmListing, onBuyMarketListing]);

  const handleConfirmCancel = useCallback(async () => {
    const listing = cancelConfirmListing;
    if (!listing) {
      return;
    }
    await onCancelMarketListing(listing.listingId);
    setCancelConfirmListing(null);
  }, [cancelConfirmListing, onCancelMarketListing]);

  return (
    <div className="market-subpanel">
      <ConfirmDialog
        open={buyConfirmListing !== null}
        title={t.confirmMarketPurchaseTitle}
        message={
          buyConfirmListing
            ? `${buyConfirmListing.name}. ${t.marketPrice}: ${buyConfirmListing.price} ODM. ${t.confirmMarketPurchaseMessage}`
            : ""
        }
        confirmLabel={t.marketBuyListing}
        cancelLabel={t.close}
        busy={
          buyConfirmListing !== null && marketBuyingListingId === buyConfirmListing.listingId
        }
        onConfirm={() => {
          void handleConfirmBuy();
        }}
        onCancel={() => {
          if (
            buyConfirmListing
            && marketBuyingListingId === buyConfirmListing.listingId
          ) {
            return;
          }
          setBuyConfirmListing(null);
        }}
      />

      <ConfirmDialog
        open={cancelConfirmListing !== null}
        title={t.confirmCancelListingTitle}
        message={
          cancelConfirmListing
            ? `${cancelConfirmListing.name}. ${t.confirmCancelListingMessage}`
            : ""
        }
        confirmLabel={t.cancelListing}
        cancelLabel={t.close}
        busy={
          cancelConfirmListing !== null && marketCancellingListingId === cancelConfirmListing.listingId
        }
        onConfirm={() => {
          void handleConfirmCancel();
        }}
        onCancel={() => {
          if (
            cancelConfirmListing
            && marketCancellingListingId === cancelConfirmListing.listingId
          ) {
            return;
          }
          setCancelConfirmListing(null);
        }}
      />

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
            const isMine = listing.sellerDiscordId === myDiscordId;
            const draft = listingPriceDraftById[listing.listingId] ?? String(listing.price);
            const buyBusy = marketBuyingListingId === listing.listingId;
            const updateBusy = marketUpdatingListingId === listing.listingId;
            const cancelBusy = marketCancellingListingId === listing.listingId;
            const listingFeedback = marketListingFeedbackById[listing.listingId];
            const listingError = marketListingErrorById[listing.listingId];
            const priceLocalErr = priceDraftLocalErrorById[listing.listingId];

            return (
              <article
                key={listing.listingId}
                className="item-card market-card"
                style={{ borderColor: `${rarityAccent}66`, boxShadow: `0 0 0 1px ${rarityAccent}22 inset` }}
              >
                <ItemMedia
                  name={listing.name}
                  imageUrl={listing.imageUrl}
                  emoji={listing.emoji}
                  accentColor={rarityAccent}
                  className="market-media"
                  imageClassName="market-image"
                  fallbackClassName="market-emoji-fallback"
                />

                <div className="item-card-content market-content">
                  <h3 className="item-card-title market-title">{listing.name}</h3>
                  <p className="item-card-description market-description">{listing.description}</p>

                  <ItemBadgeRow
                    className="market-meta"
                    badges={[
                      <span key="rarity" className="meta-badge rarity-badge" style={{ borderColor: `${rarityAccent}66` }}>
                        {listing.rarityName}
                      </span>,
                      <span key="type" className="meta-badge">{listing.itemType}</span>,
                      <span key="tier" className="meta-badge">Tier {listing.tier}</span>,
                      <span key="listingId" className="meta-badge">{t.marketListingId} #{listing.listingId}</span>,
                      <span key="inventoryId" className="meta-badge">{t.marketInventoryItemId} #{listing.inventoryItemId}</span>,
                      <span key="price" className="meta-badge price">{t.marketPrice}: {listing.price} ODM</span>,
                      <span key="tradeable" className={`meta-badge ${listing.tradeable ? "ok" : "muted"}`}>
                        {listing.tradeable ? t.tradeableYes : t.tradeableNo}
                      </span>,
                      <span key="sellable" className={`meta-badge ${listing.sellable ? "ok" : "muted"}`}>
                        {listing.sellable ? t.sellableYes : t.sellableNo}
                      </span>,
                    ]}
                  />

                  <div className="item-card-supporting-row market-seller-chip">
                    <span className="item-card-label market-card-label">{t.marketSeller}</span>
                    <UserIdentity
                      user={{
                        discordId: listing.sellerDiscordId,
                        username: null,
                        globalName: null,
                        avatarUrl: null,
                      }}
                      size="sm"
                      showAvatar={false}
                      mode={streamerMode ? "streamer" : "normal"}
                    />
                  </div>

                  <div className="market-card-actions item-card-actions">
                    {listingFeedback ? (
                      <p className="state-text state-success">{listingFeedback}</p>
                    ) : null}
                    {listingError ? (
                      <p className="state-text state-error">{listingError}</p>
                    ) : null}

                    {isMine ? (
                      <>
                        <div className="market-listing-price-row">
                          <span className="item-card-label market-card-label">{t.listingOfferPriceLabel}</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            className="inventory-search-input compact"
                            value={draft}
                            onFocus={() => {
                              dirtyPriceDraftIdsRef.current.add(listing.listingId);
                            }}
                            onBlur={event => {
                              const rawDraft = event.currentTarget.value;
                              const parsed = parsePositiveFinitePrice(rawDraft);
                              if (parsed !== null && (parsed === listing.price || Math.abs(parsed - listing.price) < 1e-9)) {
                                dirtyPriceDraftIdsRef.current.delete(listing.listingId);
                              }
                            }}
                            onChange={event => {
                              dirtyPriceDraftIdsRef.current.add(listing.listingId);
                              const value = event.target.value;
                              setListingPriceDraftById(prev => ({ ...prev, [listing.listingId]: value }));
                              setPriceDraftLocalErrorById(prev => {
                                if (!prev[listing.listingId]) {
                                  return prev;
                                }
                                const next = { ...prev };
                                delete next[listing.listingId];
                                return next;
                              });
                              onClearMarketListingMessage(listing.listingId);
                            }}
                          />
                          <button
                            type="button"
                            className="pagination-btn"
                            disabled={
                              updateBusy
                              || cancelBusy
                              || buyBusy
                            }
                            onClick={() => {
                              const parsed = parsePositiveFinitePrice(
                                listingPriceDraftById[listing.listingId] ?? String(listing.price),
                              );
                              if (parsed === null) {
                                setPriceDraftLocalErrorById(prev => ({
                                  ...prev,
                                  [listing.listingId]: t.invalidPositiveFinitePrice,
                                }));
                                return;
                              }
                              setPriceDraftLocalErrorById(prev => {
                                if (!prev[listing.listingId]) {
                                  return prev;
                                }
                                const next = { ...prev };
                                delete next[listing.listingId];
                                return next;
                              });
                              void onUpdateMarketListingPrice(listing.listingId, parsed);
                              dirtyPriceDraftIdsRef.current.delete(listing.listingId);
                            }}
                          >
                            {updateBusy ? t.updatingMarketPrice : t.updateListingPrice}
                          </button>
                          <button
                            type="button"
                            className="pagination-btn admin-danger-btn"
                            disabled={
                              cancelBusy
                              || updateBusy
                              || buyBusy
                            }
                            onClick={() => setCancelConfirmListing(listing)}
                          >
                            {cancelBusy ? t.cancellingMarketListing : t.cancelListing}
                          </button>
                        </div>
                        {priceLocalErr ? (
                          <p className="state-text state-error">{priceLocalErr}</p>
                        ) : null}
                      </>
                    ) : (
                      <div className="market-card-actions-row item-card-actions-row">
                        <button
                          type="button"
                          className="pagination-btn"
                          disabled={buyBusy || updateBusy || cancelBusy}
                          onClick={() => {
                            setBuyConfirmListing(listing);
                            onClearMarketListingMessage(listing.listingId);
                          }}
                        >
                          {buyBusy ? t.marketBuyingListing : t.marketBuyListing}
                        </button>
                      </div>
                    )}
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
