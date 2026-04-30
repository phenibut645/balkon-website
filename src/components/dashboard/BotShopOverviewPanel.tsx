import { DashboardText } from "@/lib/dashboardText";
import { ShopSubTab } from "@/lib/types";

type BotShopOverviewPanelProps = {
  t: DashboardText;
  onOpenSubTab: (tab: ShopSubTab) => void;
};

export function BotShopOverviewPanel({ t, onOpenSubTab }: BotShopOverviewPanelProps) {
  return (
    <div className="shop-overview-grid">
      <article className="shop-overview-card">
        <p className="market-card-label">{t.shopItems}</p>
        <p className="market-card-hint">{t.botShopSearchDescription}</p>
        <button className="pagination-btn" type="button" onClick={() => onOpenSubTab("items")}>{t.shopItems}</button>
      </article>
      <article className="shop-overview-card">
        <p className="market-card-label">{t.shopCases}</p>
        <p className="market-card-hint">{t.shopCasesSoon}</p>
        <button className="pagination-btn ghost" type="button" onClick={() => onOpenSubTab("cases")}>{t.shopCases}</button>
      </article>
      <article className="shop-overview-card">
        <p className="market-card-label">{t.shopObs}</p>
        <p className="market-card-hint">{t.obsMediaDescription}</p>
        <button className="pagination-btn" type="button" onClick={() => onOpenSubTab("obs")}>{t.shopObs}</button>
      </article>
    </div>
  );
}
