import { DashboardText } from "@/lib/dashboardText";
import { ObsMediaProduct } from "@/lib/types";

type BotShopObsMediaPanelProps = {
  t: DashboardText;
  products: ObsMediaProduct[];
};

export function BotShopObsMediaPanel({ t, products }: BotShopObsMediaPanelProps) {
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
          <button type="button" className="pagination-btn ghost" disabled>{t.purchaseSoon}</button>
        </article>
      ))}
    </div>
  );
}
