import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardText, LanguageCode, formatDashboardDate } from "@/lib/dashboardText";
import { getLocalizedItemDescription, getLocalizedItemName } from "@/lib/localizedItems";
import { InventoryItem, StreamerStudioAccessView } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { ItemBadgeRow } from "./items/ItemBadgeRow";
import { ItemMedia } from "./items/ItemMedia";
import { UserIdentity } from "./UserIdentity";

type InventoryFilter = "all" | "materials" | "sellable" | "tradeable";

type InventoryPanelProps = {
  t: DashboardText;
  language: LanguageCode;
  loadingGifs: string[];
  inventoryFilterItems: Array<{ id: InventoryFilter; label: string }>;
  inventoryFilter: InventoryFilter;
  onFilterChange: (filter: InventoryFilter) => void;
  filteredInventoryLength: number;
  inventoryLoading: boolean;
  inventoryError: string | null;
  inventoryEmptyText: string;
  inventoryItems: InventoryItem[];
  dateLocale: string;
  streamerMode?: boolean;
  sellingInventoryId: number | null;
  listingInventoryId: number | null;
  usingServiceInventoryId: number | null;
  listedInventoryItemIds: Set<number>;
  inventoryActionFeedbackById: Record<number, string>;
  inventoryActionErrorById: Record<number, string>;
  accessibleServiceStreamers: StreamerStudioAccessView[];
  accessibleServiceStreamersLoading: boolean;
  accessibleServiceStreamersError: string | null;
  onSellToBot: (inventoryItemId: number) => void | Promise<void>;
  onListOnMarket: (inventoryItemId: number, price: number) => void | Promise<void>;
  onUseServiceItem: (inventoryItemId: number, streamerId: number) => void | Promise<void>;
  onLoadAccessibleServiceStreamers: () => void | Promise<void>;
  onClearInventoryItemMessage: (inventoryItemId: number) => void;
};

function parsePositiveFinitePrice(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return n;
}

const GRID_GAP = 12;
const CARD_MIN_WIDTH_DEFAULT = 185;
const CARD_MAX_WIDTH_DEFAULT = 225;
const CARD_MIN_WIDTH_WITH_DETAILS = 165;
const CARD_MAX_WIDTH_WITH_DETAILS = 205;
const CARD_HEIGHT_DEFAULT = 204;
const CARD_HEIGHT_WITH_DETAILS = 198;
const GRID_SAFE_HORIZONTAL_PADDING = 4;
const GRID_SAFE_VERTICAL_PADDING = 10;

type GridMetrics = {
  columns: number;
  rows: number;
  pageSize: number;
  cardHeight: number;
  gap: number;
};

export function InventoryPanel({
  t,
  language,
  loadingGifs,
  inventoryFilterItems,
  inventoryFilter,
  onFilterChange,
  filteredInventoryLength,
  inventoryLoading,
  inventoryError,
  inventoryEmptyText,
  inventoryItems,
  dateLocale,
  streamerMode = false,
  sellingInventoryId,
  listingInventoryId,
  usingServiceInventoryId,
  listedInventoryItemIds,
  inventoryActionFeedbackById,
  inventoryActionErrorById,
  accessibleServiceStreamers,
  accessibleServiceStreamersLoading,
  accessibleServiceStreamersError,
  onSellToBot,
  onListOnMarket,
  onUseServiceItem,
  onLoadAccessibleServiceStreamers,
  onClearInventoryItemMessage,
}: InventoryPanelProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [confirmSellItem, setConfirmSellItem] = useState<InventoryItem | null>(null);
  const [listPriceDraft, setListPriceDraft] = useState("");
  const [listPriceLocalError, setListPriceLocalError] = useState<string | null>(null);
  const [serviceStreamerDraftById, setServiceStreamerDraftById] = useState<Record<number, string>>({});
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [gridMetrics, setGridMetrics] = useState<GridMetrics>({
    columns: 1,
    rows: 1,
    pageSize: 1,
    cardHeight: CARD_HEIGHT_DEFAULT,
    gap: GRID_GAP,
  });
  const gridViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedItem(null);
    setCurrentPage(1);
  }, [inventoryFilter]);

  useEffect(() => {
    setSelectedItem(null);
    setCurrentPage(1);
  }, [inventorySearchQuery]);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    const stillVisible = inventoryItems.some(item => item.inventoryItemId === selectedItem.inventoryItemId);
    if (!stillVisible) {
      setSelectedItem(null);
    }
  }, [inventoryItems, selectedItem]);

  useEffect(() => {
    setListPriceDraft("");
    setListPriceLocalError(null);
  }, [selectedItem?.inventoryItemId]);

  useEffect(() => {
    if (!selectedItem || String(selectedItem.itemType).toLowerCase() !== "service") {
      return;
    }

    onLoadAccessibleServiceStreamers();
  }, [onLoadAccessibleServiceStreamers, selectedItem]);

  useEffect(() => {
    if (!selectedItem || String(selectedItem.itemType).toLowerCase() !== "service") {
      return;
    }

    const inventoryItemId = selectedItem.inventoryItemId;
    const currentDraft = serviceStreamerDraftById[inventoryItemId];
    if (currentDraft) {
      return;
    }

    const firstAvailable = accessibleServiceStreamers[0];
    if (!firstAvailable) {
      return;
    }

    setServiceStreamerDraftById(prev => ({
      ...prev,
      [inventoryItemId]: String(firstAvailable.streamerId),
    }));
  }, [accessibleServiceStreamers, selectedItem, serviceStreamerDraftById]);

  useEffect(() => {
    if (inventoryLoading || inventoryError || filteredInventoryLength === 0) {
      setSelectedItem(null);
      setCurrentPage(1);
    }
  }, [filteredInventoryLength, inventoryError, inventoryLoading]);

  const selectedRarityAccent = useMemo(
    () => selectedItem?.rarityColorHex || "#52607e",
    [selectedItem],
  );

  const instanceLabel = useMemo(() => {
    const normalizedLocale = dateLocale.toLowerCase();
    if (normalizedLocale.startsWith("ru")) return "Экз.";
    if (normalizedLocale.startsWith("et")) return "Eksemplar";
    return "Instance";
  }, [dateLocale]);

  const botShortLabel = useMemo(() => {
    const normalizedLocale = dateLocale.toLowerCase();
    if (normalizedLocale.startsWith("ru")) return "Боту";
    if (normalizedLocale.startsWith("et")) return "Botile";
    return "Bot";
  }, [dateLocale]);

  const normalizedSearchQuery = useMemo(
    () => inventorySearchQuery.trim().toLowerCase(),
    [inventorySearchQuery],
  );

  const searchedInventoryItems = useMemo(() => {
    if (!normalizedSearchQuery) {
      return inventoryItems;
    }

    return inventoryItems.filter(item => getLocalizedItemName(item, language).toLowerCase().includes(normalizedSearchQuery));
  }, [inventoryItems, language, normalizedSearchQuery]);

  const visibleInventoryCount = searchedInventoryItems.length;

  const recalculatePageSize = useCallback(() => {
    const viewport = gridViewportRef.current;
    if (!viewport) {
      return;
    }

    const rect = viewport.getBoundingClientRect();
    const availableWidth = Math.max(0, rect.width - GRID_SAFE_HORIZONTAL_PADDING);

    const isStackedMobile =
      typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches;
    const hasSelectionSplit = Boolean(selectedItem) && !isStackedMobile;
    const minCardWidth = hasSelectionSplit ? CARD_MIN_WIDTH_WITH_DETAILS : CARD_MIN_WIDTH_DEFAULT;
    const maxCardWidth = hasSelectionSplit ? CARD_MAX_WIDTH_WITH_DETAILS : CARD_MAX_WIDTH_DEFAULT;
    const cardHeight = hasSelectionSplit ? CARD_HEIGHT_WITH_DETAILS : CARD_HEIGHT_DEFAULT;

    const cardWidthForColumns = (columns: number) => {
      return Math.floor((availableWidth - GRID_GAP * (columns - 1)) / columns);
    };

    let columns = Math.max(1, Math.floor((availableWidth + GRID_GAP) / (minCardWidth + GRID_GAP)));

    while (cardWidthForColumns(columns) > maxCardWidth) {
      const candidate = columns + 1;
      if (cardWidthForColumns(candidate) < minCardWidth) {
        break;
      }
      columns = candidate;
    }

    const rows = 2;
    const viewportHeight = Math.max(cardHeight * rows + GRID_GAP * (rows - 1) + GRID_SAFE_VERTICAL_PADDING, cardHeight + GRID_SAFE_VERTICAL_PADDING);
    const pageSize = Math.max(columns, columns * rows);

    setGridMetrics(prev => {
      if (
        prev.columns === columns
        && prev.rows === rows
        && prev.pageSize === pageSize
        && prev.cardHeight === cardHeight
        && prev.gap === viewportHeight
      ) {
        return prev;
      }

      return {
        columns,
        rows,
        pageSize,
        cardHeight,
        gap: viewportHeight,
      };
    });
  }, [selectedItem]);

  useEffect(() => {
    if (inventoryLoading || inventoryError || filteredInventoryLength === 0) {
      return;
    }

    const viewport = gridViewportRef.current;
    if (!viewport) {
      return;
    }

    recalculatePageSize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => recalculatePageSize());
      resizeObserver.observe(viewport);
    }

    const onWindowResize = () => recalculatePageSize();
    window.addEventListener("resize", onWindowResize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", onWindowResize);
    };
  }, [filteredInventoryLength, inventoryError, inventoryLoading, recalculatePageSize]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(searchedInventoryItems.length / gridMetrics.pageSize)),
    [searchedInventoryItems.length, gridMetrics.pageSize],
  );

  useEffect(() => {
    setCurrentPage(prev => {
      if (prev < 1) return 1;
      if (prev > totalPages) return totalPages;
      return prev;
    });
  }, [totalPages]);

  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * gridMetrics.pageSize;
    return searchedInventoryItems.slice(start, start + gridMetrics.pageSize);
  }, [currentPage, searchedInventoryItems, gridMetrics.pageSize]);

  const inventoryLayoutStyle = useMemo(() => {
    return {
      "--inventory-grid-columns": String(gridMetrics.columns),
      "--inventory-card-height": `${gridMetrics.cardHeight}px`,
      "--inventory-grid-gap": `${GRID_GAP}px`,
      "--inventory-grid-min-height": `${gridMetrics.gap}px`,
    } as CSSProperties;
  }, [gridMetrics.cardHeight, gridMetrics.columns, gridMetrics.gap]);

  const handleSelectItem = useCallback((item: InventoryItem) => {
    setSelectedItem(item);
  }, []);

  const handleClearSearch = useCallback(() => {
    setInventorySearchQuery("");
  }, []);

  const selectedCanSellToBot = Boolean(
    selectedItem?.sellable && selectedItem.botSellPrice !== null,
  );
  const selectedIsListedOnMarket = Boolean(
    selectedItem && listedInventoryItemIds.has(selectedItem.inventoryItemId),
  );
  const selectedCanListOnMarket = Boolean(selectedItem?.tradeable) && !selectedIsListedOnMarket;
  const selectedIsServiceItem = String(selectedItem?.itemType ?? "").toLowerCase() === "service";
  const selectedServiceStreamerDraft = selectedItem
    ? serviceStreamerDraftById[selectedItem.inventoryItemId] ?? ""
    : "";
  const selectedCanUseService = selectedIsServiceItem && accessibleServiceStreamers.length > 0;
  const selectedInventoryActionFeedback = selectedItem
    ? inventoryActionFeedbackById[selectedItem.inventoryItemId] ?? null
    : null;
  const selectedInventoryActionError = selectedItem
    ? inventoryActionErrorById[selectedItem.inventoryItemId] ?? null
    : null;

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    if (!selectedInventoryActionError || !selectedIsListedOnMarket) {
      return;
    }

    if (!selectedInventoryActionError.includes("INVENTORY_ITEM_ALREADY_LISTED")) {
      return;
    }

    onClearInventoryItemMessage(selectedItem.inventoryItemId);
  }, [onClearInventoryItemMessage, selectedInventoryActionError, selectedIsListedOnMarket, selectedItem]);

  const handleConfirmSellToBot = useCallback(async () => {
    const item = confirmSellItem;
    if (!item) {
      return;
    }
    await onSellToBot(item.inventoryItemId);
    setConfirmSellItem(null);
  }, [confirmSellItem, onSellToBot]);

  const handleSubmitListPrice = useCallback(async () => {
    if (!selectedItem) {
      return;
    }
    const parsed = parsePositiveFinitePrice(listPriceDraft);
    if (parsed === null) {
      setListPriceLocalError(t.invalidPositiveFinitePrice);
      return;
    }
    setListPriceLocalError(null);
    await onListOnMarket(selectedItem.inventoryItemId, parsed);
  }, [listPriceDraft, onListOnMarket, selectedItem, t.invalidPositiveFinitePrice]);

  const handleServiceStreamerChange = useCallback((inventoryItemId: number, value: string) => {
    setServiceStreamerDraftById(prev => ({
      ...prev,
      [inventoryItemId]: value,
    }));
    onClearInventoryItemMessage(inventoryItemId);
  }, [onClearInventoryItemMessage]);

  const handleUseService = useCallback(async () => {
    if (!selectedItem) {
      return;
    }

    const rawStreamerId = serviceStreamerDraftById[selectedItem.inventoryItemId] ?? "";
    const streamerId = Number(rawStreamerId);
    if (!Number.isInteger(streamerId) || streamerId <= 0) {
      onClearInventoryItemMessage(selectedItem.inventoryItemId);
      return;
    }

    await onUseServiceItem(selectedItem.inventoryItemId, streamerId);
  }, [onUseServiceItem, onClearInventoryItemMessage, selectedItem, serviceStreamerDraftById]);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const selectedItemName = selectedItem ? getLocalizedItemName(selectedItem, language) : "";
  const selectedItemDescription = selectedItem ? getLocalizedItemDescription(selectedItem, language) : "";

  return (
    <div className="panel panel-inventory">
      <ConfirmDialog
        open={confirmSellItem !== null}
        title={t.confirmSellToBotTitle}
        message={confirmSellItem ? `${getLocalizedItemName(confirmSellItem, language)}. ${t.confirmSellToBotMessage}` : ""}
        confirmLabel={t.sellToBot}
        cancelLabel={t.close}
        busy={confirmSellItem !== null && sellingInventoryId === confirmSellItem.inventoryItemId}
        onConfirm={() => {
          void handleConfirmSellToBot();
        }}
        onCancel={() => {
          if (confirmSellItem && sellingInventoryId === confirmSellItem.inventoryItemId) {
            return;
          }
          setConfirmSellItem(null);
        }}
      />
      <div className="inventory-scroll">
        <div className="inventory-toolbar">
          <div className="inventory-toolbar-main">
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

            <div className="inventory-search-wrap">
              <input
                type="text"
                className="inventory-search-input"
                placeholder={t.inventorySearchPlaceholder}
                value={inventorySearchQuery}
                onChange={event => setInventorySearchQuery(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    handleClearSearch();
                  }
                }}
              />
              {inventorySearchQuery ? (
                <button
                  type="button"
                  className="inventory-search-clear"
                  onClick={handleClearSearch}
                  aria-label={t.inventorySearchClearAria}
                >
                  ×
                </button>
              ) : null}
            </div>
          </div>
          <p className="inventory-counter">{visibleInventoryCount} {t.itemsWord}</p>
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

        {!inventoryLoading && !inventoryError && visibleInventoryCount === 0 ? (
          <p className="state-text state-empty">
            {normalizedSearchQuery ? t.inventorySearchNoResults : inventoryEmptyText}
          </p>
        ) : null}

        {!inventoryLoading && !inventoryError && visibleInventoryCount > 0 ? (
          <>
            <div
              className={`inventory-main-layout ${selectedItem ? "has-selection" : ""}`}
              style={inventoryLayoutStyle}
            >
              <div className="inventory-grid-viewport" ref={gridViewportRef}>
                <div className="inventory-grid-wrap">
                  <div className="inventory-grid">
                    {paginatedInventory.map(item => {
                      const rarityAccent = item.rarityColorHex || "#44506d";
                      const isSelected = selectedItem?.inventoryItemId === item.inventoryItemId;
                      const itemName = getLocalizedItemName(item, language);
                      const compactBadges = [
                        <span key="rarity" className="meta-badge rarity-badge" style={{ borderColor: `${rarityAccent}66` }}>
                          {item.rarityName}
                        </span>,
                        <span key="type" className="meta-badge">{item.itemType}</span>,
                        <span key="instance" className="meta-badge">{instanceLabel} #{item.inventoryItemId}</span>,
                        item.botSellPrice !== null ? (
                          <span key="botSell" className="meta-badge price">{botShortLabel}: {item.botSellPrice} ODM</span>
                        ) : null,
                      ];

                      return (
                        <button
                          key={item.inventoryItemId}
                          type="button"
                          className={`item-card inventory-card compact ${isSelected ? "selected" : ""}`}
                          style={{
                            borderColor: `${rarityAccent}66`,
                          }}
                          onClick={() => handleSelectItem(item)}
                          aria-pressed={isSelected}
                        >
                          <ItemMedia
                            name={itemName}
                            imageUrl={item.imageUrl}
                            emoji={item.emoji}
                            accentColor={rarityAccent}
                            className="inventory-media compact"
                            imageClassName="inventory-image"
                            fallbackClassName="inventory-emoji-fallback"
                            overlay={(
                              <>
                                <span className="inventory-tier-badge">{t.tier} {item.tier}</span>
                                {isSelected ? <span className="inventory-selected-dot" aria-hidden="true" /> : null}
                              </>
                            )}
                          />

                          <div className="item-card-content inventory-content compact">
                            <h3 className="item-card-title inventory-title">{itemName}</h3>
                            <ItemBadgeRow badges={compactBadges} className="inventory-meta compact" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              {selectedItem ? (
                <aside
                  className="inventory-details-panel enter"
                  style={{
                    borderColor: `${selectedRarityAccent}66`,
                    boxShadow: `0 0 0 1px ${selectedRarityAccent}22 inset`,
                  }}
                >
                  <div className="inventory-details-header">
                    <p className="inventory-details-title">{t.itemDetails}</p>
                    <button
                      type="button"
                      className="inventory-details-close"
                      onClick={() => setSelectedItem(null)}
                    >
                      {t.close}
                    </button>
                  </div>

                  <div className="inventory-details-scroll">
                    <ItemMedia
                      name={selectedItemName}
                      imageUrl={selectedItem.imageUrl}
                      emoji={selectedItem.emoji}
                      accentColor={selectedRarityAccent}
                      className="inventory-details-media"
                      imageClassName="inventory-details-image"
                      fallbackClassName="inventory-details-emoji"
                    />

                    <div className="inventory-details-body">
                      <h3 className="item-card-title inventory-title">{selectedItemName}</h3>
                      <p className="item-card-description inventory-description details">{selectedItemDescription}</p>

                      <ItemBadgeRow
                        className="inventory-meta"
                        badges={[
                          <span key="rarity" className="meta-badge rarity-badge" style={{ borderColor: `${selectedRarityAccent}66` }}>
                            {t.rarity}: {selectedItem.rarityName}
                          </span>,
                          <span key="type" className="meta-badge">{t.type}: {selectedItem.itemType}</span>,
                          <span key="tier" className="meta-badge">{t.tier}: {selectedItem.tier}</span>,
                          <span key="itemId" className="meta-badge">{t.itemId}: #{selectedItem.inventoryItemId}</span>,
                          <span key="templateId" className="meta-badge">{t.templateId}: #{selectedItem.itemTemplateId}</span>,
                          <span key="tradeable" className={`meta-badge ${selectedItem.tradeable ? "ok" : "muted"}`}>
                            {selectedItem.tradeable ? t.tradeableYes : t.tradeableNo}
                          </span>,
                          <span key="sellable" className={`meta-badge ${selectedItem.sellable ? "ok" : "muted"}`}>
                            {selectedItem.sellable ? t.sellableYes : t.sellableNo}
                          </span>,
                          selectedItem.botSellPrice !== null ? (
                            <span key="botSell" className="meta-badge price">{t.botSellPrice}: {selectedItem.botSellPrice} ODM</span>
                          ) : null,
                        ]}
                      />

                      <div className="inventory-details-meta">
                        <p><strong>{t.obtained}:</strong> {formatDashboardDate(selectedItem.obtainedAt, dateLocale, t.unknownDate)}</p>
                        <div>
                          <strong>{t.owner}:</strong>
                          <div className="inventory-identity-row">
                            <UserIdentity
                              user={{
                                discordId: selectedItem.ownerDiscordId,
                                username: selectedItem.ownerDisplayName,
                                globalName: selectedItem.ownerDisplayName,
                                avatarUrl: selectedItem.ownerAvatarUrl,
                              }}
                              size="sm"
                              showAvatar={!streamerMode}
                              showDiscordId
                              mode={streamerMode ? "streamer" : "normal"}
                            />
                          </div>
                        </div>
                        {selectedItem.originalOwnerDiscordId ? (
                          <div>
                            <strong>{t.originalOwner}:</strong>
                            <div className="inventory-identity-row">
                              <UserIdentity
                                user={{
                                  discordId: selectedItem.originalOwnerDiscordId,
                                  username: selectedItem.originalOwnerDisplayName,
                                  globalName: selectedItem.originalOwnerDisplayName,
                                  avatarUrl: selectedItem.originalOwnerAvatarUrl,
                                }}
                                size="sm"
                                showAvatar={!streamerMode}
                                showDiscordId
                                mode={streamerMode ? "streamer" : "normal"}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {selectedCanSellToBot || selectedCanListOnMarket || (selectedItem.tradeable && selectedIsListedOnMarket) || selectedIsServiceItem ? (
                        <div className="inventory-details-actions item-card-actions">
                          {selectedInventoryActionFeedback ? (
                            <p className="state-text state-success">{selectedInventoryActionFeedback}</p>
                          ) : null}
                          {selectedInventoryActionError ? (
                            <p className="state-text state-error">{selectedInventoryActionError}</p>
                          ) : null}
                          <div className="inventory-actions-row item-card-actions-row">
                            {selectedCanSellToBot ? (
                              <button
                                type="button"
                                className="pagination-btn"
                                disabled={sellingInventoryId === selectedItem.inventoryItemId || listingInventoryId === selectedItem.inventoryItemId}
                                onClick={() => setConfirmSellItem(selectedItem)}
                              >
                                {sellingInventoryId === selectedItem.inventoryItemId ? t.sellingToBot : t.sellToBot}
                              </button>
                            ) : null}
                            {selectedItem.tradeable && selectedIsListedOnMarket ? (
                              <span className="inventory-market-state-badge">{t.inventoryAlreadyListedOnMarket}</span>
                            ) : null}
                            {selectedCanListOnMarket ? (
                              <details className="inventory-list-on-market-details">
                                <summary className="inventory-list-on-market-summary">{t.listOnMarket}</summary>
                                <div className="inventory-list-on-market-fields">
                                  <label className="inventory-price-label">
                                    <span>{t.listingOfferPriceLabel}</span>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      className="inventory-search-input compact"
                                      placeholder={t.listingOfferPricePlaceholder}
                                      value={listPriceDraft}
                                      onChange={event => {
                                        setListPriceDraft(event.target.value);
                                        setListPriceLocalError(null);
                                      }}
                                    />
                                  </label>
                                  {listPriceLocalError ? (
                                    <p className="state-text state-error">{listPriceLocalError}</p>
                                  ) : null}
                                  <button
                                    type="button"
                                    className="pagination-btn"
                                    disabled={listingInventoryId === selectedItem.inventoryItemId || sellingInventoryId === selectedItem.inventoryItemId}
                                    onClick={() => {
                                      void handleSubmitListPrice();
                                    }}
                                  >
                                    {listingInventoryId === selectedItem.inventoryItemId ? t.listingOnMarket : t.listOnMarket}
                                  </button>
                                </div>
                              </details>
                            ) : null}
                            {selectedIsServiceItem ? (
                              <div className="inventory-service-action-block">
                                <p className="inventory-service-action-title">{t.useService}</p>
                                {accessibleServiceStreamersError ? (
                                  <p className="state-text state-error compact">{accessibleServiceStreamersError}</p>
                                ) : null}
                                {accessibleServiceStreamersLoading ? (
                                  <p className="state-text compact">{t.usingServiceLoadingTargets}</p>
                                ) : null}
                                {!accessibleServiceStreamersLoading && accessibleServiceStreamers.length === 0 ? (
                                  <p className="state-text compact">{t.noAvailableStreamers}</p>
                                ) : null}
                                <div className="inventory-service-controls">
                                  <label className="inventory-price-label inventory-service-label">
                                    <span>{t.selectStreamer}</span>
                                    <select
                                      className="inventory-search-input compact inventory-service-select"
                                      value={selectedServiceStreamerDraft}
                                      disabled={!selectedCanUseService || usingServiceInventoryId === selectedItem.inventoryItemId}
                                      onChange={event => handleServiceStreamerChange(selectedItem.inventoryItemId, event.target.value)}
                                    >
                                      <option value="">{t.selectStreamer}</option>
                                      {accessibleServiceStreamers.map(streamer => (
                                        <option key={streamer.streamerId} value={String(streamer.streamerId)}>
                                          {streamer.nickname}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                  <button
                                    type="button"
                                    className="pagination-btn"
                                    disabled={
                                      usingServiceInventoryId === selectedItem.inventoryItemId
                                      || sellingInventoryId === selectedItem.inventoryItemId
                                      || listingInventoryId === selectedItem.inventoryItemId
                                      || !selectedCanUseService
                                      || !selectedServiceStreamerDraft
                                    }
                                    onClick={() => {
                                      void handleUseService();
                                    }}
                                  >
                                    {usingServiceInventoryId === selectedItem.inventoryItemId ? t.usingService : t.useService}
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </aside>
              ) : null}
            </div>

            <div className="inventory-pagination">
              <button
                type="button"
                className="pagination-btn"
                onClick={goToPreviousPage}
                disabled={currentPage <= 1}
              >
                {t.previous}
              </button>
              <span className="pagination-status">
                {t.page} {currentPage}/{totalPages}
              </span>
              <button
                type="button"
                className="pagination-btn"
                onClick={goToNextPage}
                disabled={currentPage >= totalPages}
              >
                {t.next}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
