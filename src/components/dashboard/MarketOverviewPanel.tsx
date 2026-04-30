import { useId, useMemo, useState } from "react";
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
  rawDate: string;
  dateLabel: string;
  valueLabel: string;
  totalOdm: number;
  totalLdm: number;
  membersCount: number;
};

const CHART_WIDTH = 740;
const CHART_HEIGHT = 260;
const CHART_PADDING_X = 24;
const CHART_PADDING_Y = 24;
const CHART_BASELINE_Y = 236;

function formatCompactDate(value: string, dateLocale: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(dateLocale, { month: "short", day: "2-digit" }).format(date);
}

function formatFullDate(value: string, dateLocale: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(dateLocale, {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(date);
}

function toChartPoints(points: MarketCapitalizationData["points"], dateLocale: string): ChartPoint[] {
  const values = points.map(point => point.totalOdm);
  const labels = points.map(point => formatCompactDate(point.date, dateLocale));

  const plotWidth = CHART_WIDTH - CHART_PADDING_X * 2;
  const plotHeight = CHART_HEIGHT - CHART_PADDING_Y * 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  return points.map((point, index) => {
    const value = point.totalOdm;
    const x = values.length <= 1
      ? CHART_PADDING_X + plotWidth / 2
      : CHART_PADDING_X + (index / (values.length - 1)) * plotWidth;

    const y = range === 0
      ? CHART_PADDING_Y + plotHeight / 2
      : CHART_PADDING_Y + ((max - value) / range) * plotHeight;

    return {
      x,
      y,
      rawDate: point.date,
      dateLabel: labels[index],
      valueLabel: String(value),
      totalOdm: point.totalOdm,
      totalLdm: point.totalLdm,
      membersCount: point.membersCount,
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const gradientId = useId().replace(/:/g, "");
  const numberFormat = new Intl.NumberFormat(dateLocale);
  const points = capitalization?.points ?? [];
  const values = points.map(point => point.totalOdm);
  const chartPoints = points.length ? toChartPoints(points, dateLocale) : [];

  const polylinePoints = chartPoints.map(point => `${point.x},${point.y}`).join(" ");

  const areaPath = chartPoints.length > 1
    ? `M ${chartPoints[0].x} ${CHART_BASELINE_Y} L ${chartPoints.map(point => `${point.x} ${point.y}`).join(" L ")} L ${chartPoints[chartPoints.length - 1].x} ${CHART_BASELINE_Y} Z`
    : "";

  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 0;

  const hoveredPoint = hoveredIndex === null ? null : chartPoints[hoveredIndex] ?? null;
  const todayIso = new Date().toISOString().slice(0, 10);

  const tooltipStyle = useMemo(() => {
    if (!hoveredPoint) {
      return undefined;
    }

    const leftPercent = Math.max(8, Math.min(92, (hoveredPoint.x / CHART_WIDTH) * 100));
    const topPercent = Math.max(18, Math.min(84, (hoveredPoint.y / CHART_HEIGHT) * 100));

    return {
      left: `${leftPercent}%`,
      top: `${topPercent}%`,
    };
  }, [hoveredPoint]);

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
              <div className="market-chart-wrapper">
                {hoveredPoint ? (
                  <div className="market-chart-tooltip" style={tooltipStyle}>
                    <p className="market-chart-tooltip-title">{formatFullDate(hoveredPoint.rawDate, dateLocale)}</p>
                    <p className="market-chart-tooltip-row">{t.totalOdm}: {numberFormat.format(hoveredPoint.totalOdm)} ODM</p>
                    <p className="market-chart-tooltip-row">{t.totalLdm}: {numberFormat.format(hoveredPoint.totalLdm)} LDM</p>
                    <p className="market-chart-tooltip-row">{t.marketMembers}: {numberFormat.format(hoveredPoint.membersCount)}</p>
                    {hoveredPoint.rawDate === todayIso ? (
                      <p className="market-chart-tooltip-row muted">{t.marketLiveToday}</p>
                    ) : null}
                  </div>
                ) : null}

                <svg className="market-chart-svg" viewBox="0 0 740 260" role="img" aria-label={t.marketCapitalization}>
                  <defs>
                    <linearGradient id={`marketAreaGradient-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(245, 200, 75, 0.34)" />
                      <stop offset="100%" stopColor="rgba(245, 200, 75, 0.02)" />
                    </linearGradient>
                  </defs>

                  {[0, 1, 2, 3].map(index => {
                    const y = CHART_PADDING_Y + (index / 3) * (CHART_BASELINE_Y - CHART_PADDING_Y);
                    return (
                      <line
                        key={`grid-${index}`}
                        x1={CHART_PADDING_X}
                        y1={y}
                        x2={CHART_WIDTH - CHART_PADDING_X}
                        y2={y}
                        className="market-chart-grid"
                      />
                    );
                  })}

                  {hoveredPoint ? (
                    <line
                      x1={hoveredPoint.x}
                      y1={CHART_PADDING_Y}
                      x2={hoveredPoint.x}
                      y2={CHART_BASELINE_Y}
                      className="market-chart-guide"
                    />
                  ) : null}

                  <line x1={CHART_PADDING_X} y1={CHART_BASELINE_Y} x2={CHART_WIDTH - CHART_PADDING_X} y2={CHART_BASELINE_Y} className="market-chart-axis" />

                  {areaPath ? <path d={areaPath} className="market-chart-area" fill={`url(#marketAreaGradient-${gradientId})`} /> : null}

                  {chartPoints.length === 1 ? (
                    <circle cx={chartPoints[0].x} cy={chartPoints[0].y} r="4.2" className="market-chart-point active" />
                  ) : (
                    <polyline
                      points={polylinePoints}
                      fill="none"
                      className="market-chart-line"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      pathLength={100}
                    />
                  )}

                  {chartPoints.map((point, index) => {
                    const isActive = hoveredIndex === index;

                    return (
                      <circle
                        key={`${point.rawDate}-${point.totalOdm}`}
                        cx={point.x}
                        cy={point.y}
                        r={isActive ? "5.2" : "3.6"}
                        className={`market-chart-point ${isActive ? "active" : ""}`}
                        tabIndex={0}
                        role="button"
                        aria-label={`${formatFullDate(point.rawDate, dateLocale)}: ${numberFormat.format(point.totalOdm)} ODM`}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(prev => (prev === index ? null : prev))}
                        onFocus={() => setHoveredIndex(index)}
                        onBlur={() => setHoveredIndex(prev => (prev === index ? null : prev))}
                      />
                    );
                  })}

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
                        className="market-chart-axis-label"
                      >
                        {point.dateLabel}
                      </text>
                    );
                  })}

                  <text x={CHART_PADDING_X} y="16" className="market-chart-value-label">{numberFormat.format(maxValue)} ODM</text>
                  <text x={CHART_PADDING_X} y="252" className="market-chart-value-label">{numberFormat.format(minValue)} ODM</text>
                </svg>
              </div>
            )}
          </article>
        </>
      ) : null}
    </div>
  );
}
