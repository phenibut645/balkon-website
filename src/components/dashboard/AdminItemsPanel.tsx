"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createAdminItem,
  deleteAdminItem,
  getAdminItemRarities,
  getAdminItems,
  searchAdminItemTypes,
  searchAdminRarities,
  updateAdminItem,
} from "@/lib/api";
import { DashboardText } from "@/lib/dashboardText";
import { AdminItem, AdminItemInput, AdminSearchOption } from "@/lib/types";
import { AdminItemForm } from "./AdminItemForm";
import { ConfirmDialog } from "./ConfirmDialog";

type AdminItemsPanelProps = {
  t: DashboardText;
};

export function AdminItemsPanel({ t }: AdminItemsPanelProps) {
  const [items, setItems] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminItem | null>(null);
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [raritySeedOptions, setRaritySeedOptions] = useState<AdminSearchOption[]>([]);

  const loadItems = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    const response = await getAdminItems();
    if (response.ok && Array.isArray(response.items)) {
      setItems(response.items);
      setLoading(false);
      return;
    }

    setItems([]);
    setLoading(false);
    setError(response.message || response.error || t.adminItemsLoadError);
  }, [t.adminItemsLoadError]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    let cancelled = false;

    async function seedRarities(): Promise<void> {
      const response = await getAdminItemRarities();
      if (!cancelled && response.ok && Array.isArray(response.rarities)) {
        setRaritySeedOptions(response.rarities.map(rarity => ({
          id: rarity.id,
          name: rarity.name,
          color_hex: rarity.color_hex,
        })));
      }
    }

    void seedRarities();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery.length) {
      return items;
    }

    return items.filter(item => {
      return item.name.toLowerCase().includes(normalizedQuery)
        || item.itemType.toLowerCase().includes(normalizedQuery)
        || item.rarityName.toLowerCase().includes(normalizedQuery);
    });
  }, [items, query]);

  const searchTypes = useCallback(async (input: string): Promise<AdminSearchOption[]> => {
    const response = await searchAdminItemTypes(input);
    if (!response.ok || !Array.isArray(response.options)) {
      return [];
    }
    return response.options;
  }, []);

  const searchRarityOptions = useCallback(async (input: string): Promise<AdminSearchOption[]> => {
    const response = await searchAdminRarities(input);
    const remoteOptions = response.ok && Array.isArray(response.options) ? response.options : [];

    if (!input.trim().length) {
      return raritySeedOptions.slice(0, 12);
    }

    const merged = [...remoteOptions];
    for (const localOption of raritySeedOptions) {
      if (!merged.find(option => option.id === localOption.id)) {
        merged.push(localOption);
      }
    }

    return merged
      .filter(option => option.name.toLowerCase().includes(input.trim().toLowerCase()))
      .slice(0, 12);
  }, [raritySeedOptions]);

  async function handleSubmit(input: AdminItemInput, editingItemId: number | null): Promise<void> {
    setSubmitting(true);
    setFeedback(null);

    const response = editingItemId
      ? await updateAdminItem(editingItemId, input)
      : await createAdminItem(input);

    if (!response.ok) {
      setSubmitting(false);
      setFeedback(response.message || response.error || t.adminItemsSaveError);
      return;
    }

    setSubmitting(false);
    setEditingItem(null);
    setFeedback(editingItemId ? t.adminItemsUpdated : t.adminItemsCreated);
    await loadItems();
  }

  async function handleDeleteConfirm(): Promise<void> {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    const response = await deleteAdminItem(deleteTarget.id);
    setDeleting(false);

    if (!response.ok) {
      setFeedback(response.message || response.error || t.adminItemsDeleteError);
      return;
    }

    setDeleteTarget(null);
    setFeedback(t.adminItemsDeleted);
    if (editingItem?.id === deleteTarget.id) {
      setEditingItem(null);
    }
    await loadItems();
  }

  return (
    <div className="panel panel-overview admin-items-panel">
      <div className="inventory-toolbar">
        <h2 className="section-title">{t.adminItemsTitle}</h2>
        <button className="pagination-btn" type="button" onClick={() => void loadItems()}>
          {t.adminItemsRefresh}
        </button>
      </div>

      <AdminItemForm
        t={t}
        editingItem={editingItem}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancelEdit={() => setEditingItem(null)}
        searchTypes={searchTypes}
        searchRarities={searchRarityOptions}
      />

      <div className="inventory-toolbar">
        <input
          className="admin-field-input admin-search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.adminItemsSearchPlaceholder}
        />
        <p className="inventory-counter">{filteredItems.length}</p>
      </div>

      {feedback ? <p className="state-text">{feedback}</p> : null}
      {loading ? <p className="state-text">{t.adminItemsLoading}</p> : null}
      {!loading && error ? <p className="state-text state-error">{error}</p> : null}
      {!loading && !error && filteredItems.length === 0 ? <p className="state-text state-empty">{t.adminItemsEmpty}</p> : null}

      {!loading && !error && filteredItems.length > 0 ? (
        <div className="admin-list-grid">
          {filteredItems.map(item => (
            <article className="admin-log-card" key={item.id}>
              <div className="admin-log-head">
                <p className="display-name">{item.emoji ? `${item.emoji} ${item.name}` : item.name}</p>
                <span className="meta-badge">#{item.id}</span>
              </div>
              <p className="state-text">{item.description}</p>
              <div className="inventory-meta">
                <span className="meta-badge">{item.itemType}</span>
                <span className="meta-badge" style={item.rarityColorHex ? { borderColor: item.rarityColorHex } : undefined}>
                  {item.rarityName}
                </span>
                <span className={`meta-badge ${item.tradeable ? "ok" : "muted"}`}>
                  {item.tradeable ? t.tradeableYes : t.tradeableNo}
                </span>
                <span className="meta-badge muted">
                  {item.botSellPrice === null ? "-" : item.botSellPrice}
                </span>
              </div>
              <div className="admin-form-actions">
                <button className="pagination-btn" type="button" onClick={() => setEditingItem(item)}>
                  {t.adminItemsEdit}
                </button>
                <button className="pagination-btn admin-danger-btn" type="button" onClick={() => setDeleteTarget(item)}>
                  {t.adminItemsDelete}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t.adminItemsDeleteConfirmTitle}
        message={deleteTarget ? `${t.adminItemsDeleteConfirmText} ${deleteTarget.name}` : ""}
        confirmLabel={t.adminItemsDeleteConfirmAction}
        cancelLabel={t.adminItemsCancelEdit}
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          void handleDeleteConfirm();
        }}
      />
    </div>
  );
}
