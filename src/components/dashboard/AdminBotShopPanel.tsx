"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteAdminBotShopListing,
  getAdminBotShop,
  searchAdminItemTemplates,
  upsertAdminBotShopListing,
} from "@/lib/api";
import { DashboardText } from "@/lib/dashboardText";
import { AdminBotShopListing, AdminSearchOption } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { SearchableSelect } from "./SearchableSelect";

type AdminBotShopPanelProps = {
  t: DashboardText;
};

type SelectedItemOption = { id: number; name: string };

export function AdminBotShopPanel({ t }: AdminBotShopPanelProps) {
  const [listings, setListings] = useState<AdminBotShopListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<SelectedItemOption | null>(null);
  const [selectQuery, setSelectQuery] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminBotShopListing | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadListings = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    const response = await getAdminBotShop();
    if (response.ok && Array.isArray(response.listings)) {
      setListings(response.listings);
      setLoading(false);
      return;
    }

    setListings([]);
    setLoading(false);
    setError(response.message || response.error || t.adminBotShopLoadError);
  }, [t.adminBotShopLoadError]);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  const searchItems = useCallback(async (query: string): Promise<AdminSearchOption[]> => {
    const response = await searchAdminItemTemplates(query);
    if (!response.ok || !Array.isArray(response.options)) {
      return [];
    }
    return response.options;
  }, []);

  function handleSelectQueryChange(next: string): void {
    setSelectQuery(next);
    if (selectedItem && next !== selectedItem.name) {
      setSelectedItem(null);
    }
  }

  function getOptionNumericId(option: AdminSearchOption): number | null {
    // Backend autocomplete returns { name, value } where value is the numeric id.
    // Fall back to option.id for any endpoint that sends it directly.
    const raw = option.value ?? option.id;
    if (raw === undefined || raw === null) return null;
    const n = typeof raw === "string" ? parseInt(raw, 10) : raw;
    return Number.isInteger(n) && n > 0 ? n : null;
  }

  function handleOptionSelect(option: AdminSearchOption): void {
    const id = getOptionNumericId(option);
    if (id === null) {
      setFormError(t.adminBotShopValidationInvalidId);
      return;
    }
    // Strip leading "#N " prefix from name for a clean chip label.
    const displayName = option.name.replace(/^#\d+\s*/, "").trim() || option.name;
    setSelectedItem({ id, name: displayName });
    setFormError(null);
  }

  function handleClearItem(): void {
    setSelectedItem(null);
    setSelectQuery("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);
    setFeedback(null);

    if (!selectedItem) {
      setFormError(t.adminBotShopValidationItem);
      return;
    }

    const price = parseFloat(priceInput);
    if (!priceInput.trim() || !Number.isFinite(price) || price <= 0) {
      setFormError(t.adminBotShopValidationPrice);
      return;
    }

    setSubmitting(true);
    const response = await upsertAdminBotShopListing({ itemTemplateId: selectedItem.id, price });
    setSubmitting(false);

    if (!response.ok) {
      setFormError(response.message || response.error || t.adminBotShopSaveError);
      return;
    }

    setFeedback(t.adminBotShopSaved);
    setSelectedItem(null);
    setSelectQuery("");
    setPriceInput("");
    await loadListings();
  }

  async function handleDeleteConfirm(): Promise<void> {
    if (!deleteTarget) return;

    setDeleting(true);
    const response = await deleteAdminBotShopListing(deleteTarget.listingId);
    setDeleting(false);

    if (!response.ok) {
      setFeedback(response.message || response.error || t.adminBotShopDeleteError);
      setDeleteTarget(null);
      return;
    }

    setFeedback(t.adminBotShopDeleted);
    setDeleteTarget(null);
    await loadListings();
  }

  return (
    <div className="panel panel-overview admin-items-panel">
      <div className="inventory-toolbar">
        <h2 className="section-title">{t.adminBotShopTitle}</h2>
        <button type="button" className="pagination-btn" onClick={() => void loadListings()}>
          {t.adminBotShopRefresh}
        </button>
      </div>

      <form className="admin-item-form" onSubmit={handleSubmit}>
        <p className="admin-field-label" style={{ fontSize: "14px", color: "#f0f5ff", marginBottom: 6 }}>
          {t.adminBotShopAddTitle}
        </p>

        <div className="admin-form-grid">
          <div>
            <SearchableSelect
              label={t.adminBotShopSelectItem}
              value={selectQuery}
              onChange={handleSelectQueryChange}
              onOptionSelect={handleOptionSelect}
              loadOptions={searchItems}
              placeholder={t.adminBotShopSearchItem}
              noOptionsText={t.adminBotShopNoResults}
              disabled={submitting}
            />
            {selectedItem ? (
              <div className="admin-botshop-selected-chip">
                <span>#{selectedItem.id} — {selectedItem.name}</span>
                <button
                  type="button"
                  className="pagination-btn"
                  style={{ padding: "3px 8px", fontSize: "11px" }}
                  onClick={handleClearItem}
                >
                  {t.adminBotShopClearItem}
                </button>
              </div>
            ) : null}
          </div>

          <div>
            <label className="admin-field-label">{t.adminBotShopPrice}</label>
            <input
              className="admin-field-input"
              type="number"
              min="0.01"
              step="0.01"
              value={priceInput}
              onChange={(event) => setPriceInput(event.target.value)}
              disabled={submitting}
            />
          </div>
        </div>

        {formError ? <p className="state-text state-error">{formError}</p> : null}

        <div className="admin-form-actions">
          <button type="submit" className="pagination-btn" disabled={submitting || !selectedItem}>
            {submitting ? "..." : t.adminBotShopSave}
          </button>
        </div>
      </form>

      {feedback ? <p className="state-text">{feedback}</p> : null}
      {loading ? <p className="state-text">{t.adminBotShopLoading}</p> : null}
      {!loading && error ? <p className="state-text state-error">{error}</p> : null}
      {!loading && !error && listings.length === 0 ? (
        <p className="state-text state-empty">{t.adminBotShopEmpty}</p>
      ) : null}

      {!loading && !error && listings.length > 0 ? (
        <div className="admin-list-grid">
          {listings.map(listing => {
            const rarityAccent = listing.rarityColorHex || "#44506d";
            return (
              <article
                key={listing.listingId}
                className="admin-log-card"
                style={{ borderColor: `${rarityAccent}66` }}
              >
                <div className="admin-log-head">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {listing.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={listing.imageUrl}
                        alt={listing.name}
                        style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 6, flexShrink: 0 }}
                        onError={(event) => {
                          (event.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 24, lineHeight: 1 }}>{listing.emoji || "📦"}</span>
                    )}
                    <p className="display-name" style={{ margin: 0 }}>{listing.name}</p>
                  </div>
                  <span className="meta-badge price">
                    {Number.isInteger(listing.price) ? listing.price : listing.price.toFixed(2)} ODM
                  </span>
                </div>

                <p className="state-text" style={{ margin: "6px 0 8px" }}>{listing.description}</p>

                <div className="inventory-meta">
                  <span className="meta-badge">{t.adminBotShopListingId}: #{listing.listingId}</span>
                  <span className="meta-badge">{listing.itemType}</span>
                  <span
                    className="meta-badge"
                    style={listing.rarityColorHex ? { borderColor: listing.rarityColorHex } : undefined}
                  >
                    {listing.rarityName}
                  </span>
                  <span className={`meta-badge ${listing.tradeable ? "ok" : "muted"}`}>
                    {listing.tradeable ? t.tradeableYes : t.tradeableNo}
                  </span>
                  <span className={`meta-badge ${listing.sellable ? "ok" : "muted"}`}>
                    {listing.sellable ? t.sellableYes : t.sellableNo}
                  </span>
                  {listing.botSellPrice !== null ? (
                    <span className="meta-badge price">{t.botSell}: {listing.botSellPrice}</span>
                  ) : null}
                </div>

                <div className="admin-form-actions" style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="pagination-btn admin-danger-btn"
                    onClick={() => setDeleteTarget(listing)}
                  >
                    {t.adminBotShopDelete}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t.adminBotShopDeleteConfirmTitle}
        message={deleteTarget ? `${t.adminBotShopDeleteConfirmText} ${deleteTarget.name}` : ""}
        confirmLabel={t.adminBotShopDeleteConfirmAction}
        cancelLabel={t.adminBotShopCancel}
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </div>
  );
}