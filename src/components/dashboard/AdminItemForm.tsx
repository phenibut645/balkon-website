"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { DashboardText } from "@/lib/dashboardText";
import { AdminItem, AdminItemInput, AdminSearchOption } from "@/lib/types";
import { SearchableSelect } from "./SearchableSelect";

type AdminItemFormProps = {
  t: DashboardText;
  editingItem: AdminItem | null;
  submitting: boolean;
  onSubmit: (input: AdminItemInput, editingItemId: number | null) => Promise<void>;
  onCancelEdit: () => void;
  searchTypes: (query: string) => Promise<AdminSearchOption[]>;
  searchRarities: (query: string) => Promise<AdminSearchOption[]>;
};

type FormState = {
  name: string;
  description: string;
  emoji: string;
  imageUrl: string;
  rarityName: string;
  typeName: string;
  tradeable: boolean;
  botSellPrice: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  emoji: "",
  imageUrl: "",
  rarityName: "",
  typeName: "",
  tradeable: true,
  botSellPrice: "",
};

export function AdminItemForm({
  t,
  editingItem,
  submitting,
  onSubmit,
  onCancelEdit,
  searchTypes,
  searchRarities,
}: AdminItemFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingItem) {
      setForm(EMPTY_FORM);
      setError(null);
      return;
    }

    setForm({
      name: editingItem.name,
      description: editingItem.description,
      emoji: editingItem.emoji || "",
      imageUrl: editingItem.imageUrl || "",
      rarityName: editingItem.rarityName,
      typeName: editingItem.itemType,
      tradeable: editingItem.tradeable,
      botSellPrice: editingItem.botSellPrice === null ? "" : String(editingItem.botSellPrice),
    });
    setError(null);
  }, [editingItem]);

  const submitLabel = useMemo(
    () => (editingItem ? t.adminItemsUpdate : t.adminItemsCreate),
    [editingItem, t],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const name = form.name.trim();
    const description = form.description.trim();
    const rarityName = form.rarityName.trim();
    const typeName = form.typeName.trim();

    if (!name || !description || !rarityName || !typeName) {
      setError(t.adminItemsValidationRequired);
      return;
    }

    const botSellPrice = form.botSellPrice.trim().length ? Number(form.botSellPrice) : null;
    if (botSellPrice !== null && (!Number.isFinite(botSellPrice) || botSellPrice < 0)) {
      setError(t.adminItemsValidationPrice);
      return;
    }

    setError(null);
    await onSubmit(
      {
        name,
        description,
        emoji: form.emoji.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        rarityName,
        typeName,
        tradeable: form.tradeable,
        botSellPrice,
      },
      editingItem?.id ?? null,
    );
  }

  return (
    <form className="admin-item-form" onSubmit={handleSubmit}>
      <div className="admin-form-grid">
        <div>
          <label className="admin-field-label">{t.adminItemsName}</label>
          <input
            className="admin-field-input"
            value={form.name}
            onChange={(event) => setForm(prev => ({ ...prev, name: event.target.value }))}
          />
        </div>

        <SearchableSelect
          label={t.adminItemsType}
          value={form.typeName}
          onChange={(next) => setForm(prev => ({ ...prev, typeName: next }))}
          loadOptions={searchTypes}
          placeholder={t.adminItemsSearchType}
          noOptionsText={t.adminItemsNoOptions}
          disabled={submitting}
        />

        <SearchableSelect
          label={t.adminItemsRarity}
          value={form.rarityName}
          onChange={(next) => setForm(prev => ({ ...prev, rarityName: next }))}
          loadOptions={searchRarities}
          placeholder={t.adminItemsSearchRarity}
          noOptionsText={t.adminItemsNoOptions}
          disabled={submitting}
        />

        <div>
          <label className="admin-field-label">{t.adminItemsEmoji}</label>
          <input
            className="admin-field-input"
            value={form.emoji}
            onChange={(event) => setForm(prev => ({ ...prev, emoji: event.target.value }))}
          />
        </div>

        <div>
          <label className="admin-field-label">{t.adminItemsImageUrl}</label>
          <input
            className="admin-field-input"
            value={form.imageUrl}
            onChange={(event) => setForm(prev => ({ ...prev, imageUrl: event.target.value }))}
          />
        </div>

        <div>
          <label className="admin-field-label">{t.adminItemsBotSellPrice}</label>
          <input
            className="admin-field-input"
            type="number"
            min="0"
            step="0.01"
            value={form.botSellPrice}
            onChange={(event) => setForm(prev => ({ ...prev, botSellPrice: event.target.value }))}
          />
        </div>

        <div className="admin-checkbox-wrap">
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={form.tradeable}
              onChange={(event) => setForm(prev => ({ ...prev, tradeable: event.target.checked }))}
            />
            {t.adminItemsTradeable}
          </label>
        </div>
      </div>

      <div>
        <label className="admin-field-label">{t.adminItemsDescription}</label>
        <textarea
          className="admin-field-input admin-textarea"
          value={form.description}
          onChange={(event) => setForm(prev => ({ ...prev, description: event.target.value }))}
          rows={3}
        />
      </div>

      {error ? <p className="state-text state-error">{error}</p> : null}

      <div className="admin-form-actions">
        <button type="submit" className="pagination-btn" disabled={submitting}>
          {submitting ? "..." : submitLabel}
        </button>
        {editingItem ? (
          <button type="button" className="pagination-btn" disabled={submitting} onClick={onCancelEdit}>
            {t.adminItemsCancelEdit}
          </button>
        ) : null}
      </div>
    </form>
  );
}
