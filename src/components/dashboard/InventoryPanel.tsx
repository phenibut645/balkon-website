import { DashboardText, formatDashboardDate } from "@/lib/dashboardText";
import { InventoryItem } from "@/lib/types";

type InventoryFilter = "all" | "materials" | "sellable" | "tradeable";

type InventoryPanelProps = {
  t: DashboardText;
  loadingGifs: string[];
  inventoryFilterItems: Array<{ id: InventoryFilter; label: string }>;
  inventoryFilter: InventoryFilter;
  onFilterChange: (filter: InventoryFilter) => void;
  filteredInventoryLength: number;
  inventoryLoading: boolean;
  inventoryError: string | null;
  inventoryEmptyText: string;
  paginatedInventory: InventoryItem[];
  inventoryPage: number;
  totalInventoryPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  dateLocale: string;
};

export function InventoryPanel({
  t,
  loadingGifs,
  inventoryFilterItems,
  inventoryFilter,
  onFilterChange,
  filteredInventoryLength,
  inventoryLoading,
  inventoryError,
  inventoryEmptyText,
  paginatedInventory,
  inventoryPage,
  totalInventoryPages,
  onPrevPage,
  onNextPage,
  dateLocale,
}: InventoryPanelProps) {
  return (
    <div className="panel panel-inventory">
      <div className="inventory-scroll">
        <div className="inventory-toolbar">
          <div className="inventory-filters" role="tablist" aria-label={t.inventoryFilterLabel}>
            {inventoryFilterItems.map(filter => (
              <button
                key={filter.id}
                className={`inventory-filter-chip ${inventoryFilter === filter.id ? "active" : ""}`}
                onClick={() => onFilterChange(filter.id)}
                role="tab"
                aria-selected={inventoryFilter === filter.id}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <p className="inventory-counter">{filteredInventoryLength} {t.itemsWord}</p>
        </div>

        {inventoryLoading ? (
          <div className="loading-block slim">
            <p className="state-text">{t.loadingInventory}</p>
            <div className="loading-gif-strip small">
              {loadingGifs.map((src, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={`inv-${src}-${index}`} src={src} alt="Loading" className="loading-gif" />
              ))}
            </div>
          </div>
        ) : null}

        {!inventoryLoading && inventoryError ? (
          <p className="state-text state-error">{inventoryError}</p>
        ) : null}

        {!inventoryLoading && !inventoryError && filteredInventoryLength === 0 ? (
          <p className="state-text state-empty">{inventoryEmptyText}</p>
        ) : null}

        {!inventoryLoading && !inventoryError && filteredInventoryLength > 0 ? (
          <div className="inventory-grid">
            {paginatedInventory.map(item => {
              const rarityAccent = item.rarityColorHex || "#44506d";
              return (
                <article
                  key={item.inventoryItemId}
                  className="inventory-card"
                  style={{ borderColor: `${rarityAccent}66`, boxShadow: `0 0 0 1px ${rarityAccent}22 inset` }}
                >
                  <div className="inventory-media" style={{ background: `linear-gradient(145deg, ${rarityAccent}2d, #1d2437)` }}>
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="inventory-image"
                        onError={event => {
                          const target = event.currentTarget;
                          target.style.display = "none";
                          const fallback = target.parentElement?.querySelector<HTMLElement>(".inventory-emoji-fallback");
                          if (fallback) fallback.style.display = "grid";
                        }}
                      />
                    ) : null}
                    <div className="inventory-emoji-fallback" style={{ display: item.imageUrl ? "none" : "grid" }}>
                      {item.emoji || "📦"}
                    </div>
                  </div>

                  <div className="inventory-content">
                    <h3 className="inventory-title">{item.name}</h3>
                    <p className="inventory-description">{item.description}</p>

                    <div className="inventory-meta">
                      <span className="meta-badge rarity-badge" style={{ borderColor: `${rarityAccent}66` }}>
                        {item.rarityName}
                      </span>
                      <span className="meta-badge">{item.itemType}</span>
                      <span className="meta-badge">Tier {item.tier}</span>
                      <span className="meta-badge">ID #{item.inventoryItemId}</span>
                      <span className={`meta-badge ${item.tradeable ? "ok" : "muted"}`}>
                        {item.tradeable ? t.tradeableYes : t.tradeableNo}
                      </span>
                      <span className={`meta-badge ${item.sellable ? "ok" : "muted"}`}>
                        {item.sellable ? t.sellableYes : t.sellableNo}
                      </span>
                      {item.botSellPrice !== null ? (
                        <span className="meta-badge price">{t.botSell}: {item.botSellPrice}</span>
                      ) : null}
                    </div>

                    <p className="inventory-obtained">{t.obtained}: {formatDashboardDate(item.obtainedAt, dateLocale, t.unknownDate)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {!inventoryLoading && !inventoryError && filteredInventoryLength > 0 ? (
          <div className="inventory-pagination">
            <button className="pagination-btn" disabled={inventoryPage <= 1} onClick={onPrevPage}>
              {t.previous}
            </button>
            <span className="pagination-status">{t.page} {inventoryPage} / {totalInventoryPages}</span>
            <button className="pagination-btn" disabled={inventoryPage >= totalInventoryPages} onClick={onNextPage}>
              {t.next}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
