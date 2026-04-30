import { DashboardText } from "@/lib/dashboardText";

type BotShopCasesPanelProps = {
  t: DashboardText;
};

export function BotShopCasesPanel({ t }: BotShopCasesPanelProps) {
  return (
    <div className="admin-empty-card">
      <p className="section-title">{t.shopCases}</p>
      <p className="state-text state-empty">{t.shopCasesSoon}</p>
    </div>
  );
}
