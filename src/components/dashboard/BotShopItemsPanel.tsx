"use client";

import { useState } from "react";
import { DashboardText, LanguageCode } from "@/lib/dashboardText";
import { getLocalizedItemDescription, getLocalizedItemName } from "@/lib/localizedItems";
import { BotShopListing, UserBalance } from "@/lib/types";
import { ItemBadgeRow } from "./items/ItemBadgeRow";
import { ItemMedia } from "./items/ItemMedia";

type BotShopItemsPanelProps = {
  t: DashboardText;
  language: LanguageCode;
  loadingGifs: string[];
  botShopListings: BotShopListing[];
  botShopLoading: boolean;
  botShopError: string | null;
  onRefresh: () => void;
  balance: UserBalance | null;
  onBuyListing: (listingId: number, amount: number) => Promise<void>;
  buyingListingId: number | null;
  buyFeedback: Record<number, string>;
  buyErrors: Record<number, string>;
};

export function BotShopItemsPanel({
  t,
  language,
  loadingGifs,
  botShopListings,
  botShopLoading,
  botShopError,
  onRefresh,
  balance,
  onBuyListing,
  buyingListingId,
  buyFeedback,
  buyErrors,
}: BotShopItemsPanelProps) {
  const [amounts, setAmounts] = useState<Record<number, number>>({});

  function getAmount(listingId: number): number {
    return amounts[listingId] ?? 1;
  }

  function setAmount(listingId: number, next: number): void {
    const normalized = Number.isInteger(next) && next > 0 ? Math.min(next, 99) : 1;
    setAmounts(prev => ({ ...prev, [listingId]: normalized }));
  }

  return (
    <>
      {botShopLoading ? (
        <div className="loading-block slim">
          <p className="state-text">{t.botShopLoading}</p>
          <div className="loading-gif-strip small">
            {loadingGifs.map((src, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={`botshop-${src}-${index}`} src={src} alt="Loading" className="loading-gif" />
            ))}
          </div>
        </div>
      ) : null}

      {!botShopLoading && botShopError ? (
        <div className="admin-empty-card">
          <p className="state-text state-error">{botShopError}</p>
          <button className="pagination-btn" onClick={onRefresh}>{t.botShopRefresh}</button>
        </div>
      ) : null}

      {!botShopLoading && !botShopError && botShopListings.length === 0 ? (
        <p className="state-text state-empty">{t.botShopEmpty}</p>
      ) : null}

      {!botShopLoading && !botShopError && botShopListings.length > 0 ? (
        <div className="botshop-grid">
          {botShopListings.map(listing => {
            const rarityAccent = listing.rarityColorHex || "#44506d";
            const qty = getAmount(listing.listingId);
            const totalPrice = listing.price * qty;
            const isBuying = buyingListingId === listing.listingId;
            const notEnough = balance !== null && balance.odm < totalPrice;
            const listingName = getLocalizedItemName(listing, language);
            const listingDescription = getLocalizedItemDescription(listing, language);
            return (
              <article
                key={listing.listingId}
                className="item-card botshop-card"
                style={{ borderColor: `${rarityAccent}66`, boxShadow: `0 0 0 1px ${rarityAccent}22 inset` }}
              >
                <ItemMedia
                  name={listingName}
                  imageUrl={listing.imageUrl}
                  emoji={listing.emoji}
                  accentColor={rarityAccent}
                  className="botshop-media"
                  imageClassName="botshop-image"
                  fallbackClassName="botshop-emoji-fallback"
                />

                <div className="item-card-content botshop-content">
                  <h3 className="item-card-title botshop-title">{listingName}</h3>
                  <p className="item-card-description botshop-description">{listingDescription}</p>

                  <ItemBadgeRow
                    className="botshop-meta"
                    badges={[
                      <span key="rarity" className="meta-badge rarity-badge" style={{ borderColor: `${rarityAccent}66` }}>
                        {listing.rarityName}
                      </span>,
                      <span key="type" className="meta-badge">{listing.itemType}</span>,
                      <span key="price" className="meta-badge price">{t.botShopPrice}: {listing.price} ODM</span>,
                      <span key="tradeable" className={`meta-badge ${listing.tradeable ? "ok" : "muted"}`}>
                        {listing.tradeable ? t.tradeableYes : t.tradeableNo}
                      </span>,
                      <span key="sellable" className={`meta-badge ${listing.sellable ? "ok" : "muted"}`}>
                        {listing.sellable ? t.sellableYes : t.sellableNo}
                      </span>,
                      listing.botSellPrice !== null ? (
                        <span key="botSell" className="meta-badge">{t.botSell}: {listing.botSellPrice}</span>
                      ) : null,
                    ]}
                  />

                  <div className="botshop-buy-row item-card-actions">
                    <div className="botshop-qty-block">
                      <label className="botshop-amount-label item-card-label">{t.amount}</label>
                      <div className="botshop-qty-controls">
                        <div className="botshop-stepper" role="group" aria-label={t.amount}>
                          <button
                            type="button"
                            className="botshop-stepper-btn"
                            disabled={isBuying || buyingListingId !== null}
                            onClick={() => setAmount(listing.listingId, Math.max(1, qty - 1))}
                          >
                            -
                          </button>
                          <span className="botshop-stepper-value" aria-live="polite">{qty}</span>
                          <button
                            type="button"
                            className="botshop-stepper-btn"
                            disabled={isBuying || buyingListingId !== null}
                            onClick={() => setAmount(listing.listingId, qty + 1)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="botshop-stepper-plus"
                          disabled={isBuying || buyingListingId !== null}
                          onClick={() => setAmount(listing.listingId, qty + 5)}
                        >
                          +5
                        </button>
                      </div>
                    </div>

                    <span className="botshop-total-chip">
                      <span aria-hidden="true">🪙</span>
                      <span>{t.total}: {totalPrice} ODM</span>
                    </span>

                    <button
                      className="pagination-btn botshop-buy-btn"
                      disabled={isBuying || notEnough || buyingListingId !== null}
                      onClick={() => void onBuyListing(listing.listingId, qty)}
                    >
                      {isBuying ? t.buying : t.buy}
                    </button>
                  </div>

                  {notEnough && !isBuying ? (
                    <p className="state-text state-error" style={{ marginTop: 4, fontSize: "11px" }}>{t.notEnoughBalance}</p>
                  ) : null}
                  {buyFeedback[listing.listingId] ? (
                    <p className="state-text" style={{ marginTop: 4, fontSize: "11px", color: "#7ee8a2" }}>{buyFeedback[listing.listingId]}</p>
                  ) : null}
                  {buyErrors[listing.listingId] ? (
                    <p className="state-text state-error" style={{ marginTop: 4, fontSize: "11px" }}>{buyErrors[listing.listingId]}</p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
