import { DashboardText } from "@/lib/dashboardText";
import { ObsMediaProduct, ObsShopStreamer, UserBalance } from "@/lib/types";

type BotShopObsMediaPanelProps = {
  t: DashboardText;
  products: ObsMediaProduct[];
  streamer: ObsShopStreamer;
  balance: UserBalance | null;
  buyingProductId: string | null;
  feedbackByProductId: Record<string, string>;
  errorByProductId: Record<string, string>;
  onBuy: (productId: string) => Promise<void>;
};

function getButtonLabel(t: DashboardText, product: ObsMediaProduct, streamer: ObsShopStreamer, balance: UserBalance | null, buyingProductId: string | null): string {
  if (buyingProductId === product.id) {
    return t.buying;
  }

  if (!product.enabled) {
    return t.purchaseUnavailable;
  }

  if (!streamer.obsAgentOnline) {
    return t.agentOffline;
  }

  if (balance !== null && balance.odm < product.priceOdm) {
    return t.notEnoughBalance;
  }

  return t.buy;
}

export function BotShopObsMediaPanel({
  t,
  products,
  streamer,
  balance,
  buyingProductId,
  feedbackByProductId,
  errorByProductId,
  onBuy,
}: BotShopObsMediaPanelProps) {
  return (
    <div className="obs-media-grid">
      {products.map(product => (
        <article key={product.id} className="obs-media-card">
          <div className="obs-media-preview">
            {product.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.previewUrl} alt={product.title} />
            ) : (
              <span className="meta-badge muted">{product.kind.toUpperCase()}</span>
            )}
          </div>
          <p className="market-card-label">{product.title}</p>
          <p className="market-card-hint">{product.description}</p>
          <div className="botshop-meta">
            <span className="meta-badge">{t.durationSeconds}: {product.durationSeconds}</span>
            <span className="meta-badge price">{product.priceOdm} ODM</span>
          </div>
          <button
            type="button"
            className={`pagination-btn ${product.enabled && streamer.obsAgentOnline ? "" : "ghost"}`}
            disabled={
              buyingProductId !== null
              || !product.enabled
              || !streamer.obsAgentOnline
              || (balance !== null && balance.odm < product.priceOdm)
            }
            onClick={() => {
              void onBuy(product.id);
            }}
          >
            {getButtonLabel(t, product, streamer, balance, buyingProductId)}
          </button>
          {feedbackByProductId[product.id] ? (
            <p className="state-text" style={{ marginTop: 8, fontSize: "11px", color: "#7ee8a2" }}>{feedbackByProductId[product.id]}</p>
          ) : null}
          {errorByProductId[product.id] ? (
            <p className="state-text state-error" style={{ marginTop: 8, fontSize: "11px" }}>{errorByProductId[product.id]}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
