import { DashboardText } from "@/lib/dashboardText";
import { MarketCapitalizationData } from "@/lib/types";

type MarketOverviewPanelProps = {
  t: DashboardText;
  dateLocale: string;
  loading: boolean;
  error: string | null;
  capitalization: MarketCapitalizationData | null;
  onRefresh: () => void;
};

type ChartPoint = {
  x: number;
  y: number;
  dateLabel: string;
  valueLabel: string;
};

function formatCompactDate(value: string, dateLocale: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(dateLocale, { month: "short", day: "2-digit" }).format(date);
}

function toChartPoints(values: number[], labels: string[]): ChartPoint[] {
  const width = 740;
  const height = 260;
  const paddingX = 24;
  const paddingY = 24;

  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingY * 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  return values.map((value, index) => {
    const x = values.length <= 1
      ? paddingX + plotWidth / 2
      : paddingX + (index / (values.length - 1)) * plotWidth;

    const y = range === 0
      ? paddingY + plotHeight / 2
      : paddingY + ((max - value) / range) * plotHeight;

    return {
      x,
      y,
      dateLabel: labels[index],
      valueLabel: String(value),
    };
  });
}

export function MarketOverviewPanel({
  t,
  dateLocale,
  loading,
  error,
  capitalization,
  onRefresh,
}: MarketOverviewPanelProps) {
  const numberFormat = new Intl.NumberFormat(dateLocale);
  const points = capitalization?.points ?? [];
  const values = points.map(point => point.totalOdm);
  const labels = points.map(point => formatCompactDate(point.date, dateLocale));
  const chartPoints = values.length ? toChartPoints(values, labels) : [];

  const polylinePoints = chartPoints.map(point => `${point.x},${point.y}`).join(" ");

  const areaPath = chartPoints.length > 1
    ? `M ${chartPoints[0].x} 236 L ${chartPoints.map(point => `${point.x} ${point.y}`).join(" L ")} L ${chartPoints[chartPoints.length - 1].x} 236 Z`
    : "";

  const currentTotalOdm = capitalization?.current.totalOdm ?? 0;
  const currentTotalLdm = capitalization?.current.totalLdm ?? 0;
  const currentMembers = capitalization?.current.membersCount ?? 0;

  const change = capitalization?.change;
  const changeDirection = change?.direction ?? "unknown";
  const changeClass =
    changeDirection === "up"
      ? "up"
      : changeDirection === "down"
        ? "down"
        : changeDirection === "flat"
          ? "flat"
          : "unknown";

  const changeText = change?.percent !== null && change?.percent !== undefined
    ? `${change.percent > 0 ? "+" : ""}${change.percent.toFixed(1)}% ${t.changeSinceYesterday}`
    : t.noPreviousData;

  return (
    <div className="market-subpanel">
      {loading ? (
        <div className="loading-block slim">
          <p className="state-text">{t.capitalizationLoading}</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="admin-empty-card">
          <p className="state-text state-error">{error}</p>
          <button className="pagination-btn" onClick={onRefresh}>{t.marketRefresh}</button>
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <div className="market-overview-grid">
            <article className="market-capitalization-card">
              <p className="market-card-label">{t.totalOdm}</p>
              <h3 className="market-card-value">{numberFormat.format(currentTotalOdm)} ODM</h3>
              <p className="market-card-hint">{t.marketCapitalization}</p>
            </article>

            <article className={`market-change-card ${changeClass}`}>
              <p className="market-card-label">{t.previousDay}</p>
              <h3 className="market-card-value">{changeText}</h3>
              {change?.absolute !== null && change?.absolute !== undefined ? (
                <p className="market-card-hint">
                  {change.absolute > 0 ? "+" : ""}{numberFormat.format(change.absolute)} ODM
                </p>
              ) : null}
            </article>

            <article className="market-capitalization-card">
              <p className="market-card-label">{t.totalLdm}</p>
              <h3 className="market-card-value">{numberFormat.format(currentTotalLdm)} LDM</h3>
              <p className="market-card-hint">{t.marketMembers}: {numberFormat.format(currentMembers)}</p>
            </article>
          </div>

          <article className="market-chart-card">
            <div className="market-chart-header">
              <p className="market-card-label">{t.marketCapitalization}</p>
              <span className="meta-badge">15 {t.lastDays}</span>
            </div>

            {chartPoints.length === 0 ? (
              <p className="market-chart-empty">{t.capitalizationEmpty}</p>
            ) : (
              <svg className="market-chart-svg" viewBox="0 0 740 260" role="img" aria-label={t.marketCapitalization}>
                <defs>
                  <linearGradient id="marketAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(142, 160, 255, 0.46)" />
                    <stop offset="100%" stopColor="rgba(142, 160, 255, 0.02)" />
                  </linearGradient>
                </defs>

                <line x1="24" y1="236" x2="716" y2="236" stroke="rgba(112,128,163,0.35)" strokeWidth="1" />

                {areaPath ? <path d={areaPath} fill="url(#marketAreaGradient)" /> : null}

                {chartPoints.length === 1 ? (
                  <circle cx={chartPoints[0].x} cy={chartPoints[0].y} r="4" fill="#95a8ff" />
                ) : (
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke="#8ea0ff"
                    strokeWidth="2.4"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}

                {chartPoints.map(point => (
                  <circle
                    key={`${point.dateLabel}-${point.valueLabel}`}
                    cx={point.x}
                    cy={point.y}
                    r="3.2"
                    fill="#d6e0ff"
                    stroke="#5f73d9"
                    strokeWidth="1.6"
                  />
                ))}

                {chartPoints.map((point, index) => {
                  const isEdge = index === 0 || index === chartPoints.length - 1;
                  const isMiddle = index === Math.floor(chartPoints.length / 2);
                  if (!isEdge && !isMiddle) {
                    return null;
                  }

                  return (
                    <text
                      key={`axis-${point.dateLabel}-${index}`}
                      x={point.x}
                      y="252"
                      textAnchor="middle"
                      fontSize="11"
                      fill="#9db0d7"
                    >
                      {point.dateLabel}
                    </text>
                  );
                })}
              </svg>
            )}
          </article>
        </>
      ) : null}
    </div>
  );
}
