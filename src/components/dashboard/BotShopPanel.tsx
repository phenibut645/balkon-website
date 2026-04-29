"use client";

import { useState } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { BotShopListing, UserBalance } from "@/lib/types";

type BotShopPanelProps = {
  t: DashboardText;
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

export function BotShopPanel({
  t,
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
}: BotShopPanelProps) {
  const [amounts, setAmounts] = useState<Record<number, string>>({});

  function getAmount(listingId: number): number {
    const raw = amounts[listingId];
    if (!raw) return 1;
    const n = parseInt(raw, 10);
    return Number.isInteger(n) && n > 0 ? n : 1;
  }

  return (
    <div className="panel panel-botshop">
      <div className="botshop-scroll">
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
              return (
                <article
                  key={listing.listingId}
                  className="botshop-card"
                  style={{ borderColor: `${rarityAccent}66`, boxShadow: `0 0 0 1px ${rarityAccent}22 inset` }}
                >
                  <div className="botshop-media" style={{ background: `linear-gradient(145deg, ${rarityAccent}2d, #1d2437)` }}>
                    {listing.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={listing.imageUrl}
                        alt={listing.name}
                        className="botshop-image"
                        onError={event => {
                          const target = event.currentTarget;
                          target.style.display = "none";
                          const fallback = target.parentElement?.querySelector<HTMLElement>(".botshop-emoji-fallback");
                          if (fallback) fallback.style.display = "grid";
                        }}
                      />
                    ) : null}
                    <div className="botshop-emoji-fallback" style={{ display: listing.imageUrl ? "none" : "grid" }}>
                      {listing.emoji || "📦"}
                    </div>
                  </div>

                  <div className="botshop-content">
                    <h3 className="botshop-title">{listing.name}</h3>
                    <p className="botshop-description">{listing.description}</p>

                    <div className="botshop-meta">
                      <span className="meta-badge rarity-badge" style={{ borderColor: `${rarityAccent}66` }}>
                        {listing.rarityName}
                      </span>
                      <span className="meta-badge">{listing.itemType}</span>
                      <span className="meta-badge price">{t.botShopPrice}: {listing.price} ODM</span>
                      <span className={`meta-badge ${listing.tradeable ? "ok" : "muted"}`}>
                        {listing.tradeable ? t.tradeableYes : t.tradeableNo}
                      </span>
                      <span className={`meta-badge ${listing.sellable ? "ok" : "muted"}`}>
                        {listing.sellable ? t.sellableYes : t.sellableNo}
                      </span>
                      {listing.botSellPrice !== null ? (
                        <span className="meta-badge">{t.botSell}: {listing.botSellPrice}</span>
                      ) : null}
                    </div>

                    <div className="botshop-buy-row">
                      <input
                        className="botshop-amount-input"
                        type="number"
                        min="1"
                        step="1"
                        value={amounts[listing.listingId] ?? "1"}
                        disabled={isBuying}
                        onChange={event => setAmounts(prev => ({ ...prev, [listing.listingId]: event.target.value }))}
                        aria-label={t.amount}
                      />
                      {qty > 1 ? (
                        <span className="botshop-total">{t.total}: {totalPrice} ODM</span>
                      ) : null}
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
      </div>
    </div>
  );
}