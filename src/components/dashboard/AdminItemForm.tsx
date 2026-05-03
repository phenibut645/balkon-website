"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { DashboardText, LanguageCode } from "@/lib/dashboardText";
import { AdminItem, AdminItemInput, AdminSearchOption } from "@/lib/types";
import { SearchableSelect } from "./SearchableSelect";

type AdminItemFormProps = {
  t: DashboardText;
  language: LanguageCode;
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
  nameRu: string;
  nameEn: string;
  nameEt: string;
  descriptionRu: string;
  descriptionEn: string;
  descriptionEt: string;
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
  nameRu: "",
  nameEn: "",
  nameEt: "",
  descriptionRu: "",
  descriptionEn: "",
  descriptionEt: "",
  emoji: "",
  imageUrl: "",
  rarityName: "",
  typeName: "",
  tradeable: true,
  botSellPrice: "",
};

export function AdminItemForm({
  t,
  language,
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
      nameRu: editingItem.nameRu || "",
      nameEn: editingItem.nameEn || "",
      nameEt: editingItem.nameEt || "",
      descriptionRu: editingItem.descriptionRu || "",
      descriptionEn: editingItem.descriptionEn || "",
      descriptionEt: editingItem.descriptionEt || "",
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

  void language;

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
        nameRu: form.nameRu.trim() || null,
        nameEn: form.nameEn.trim() || null,
        nameEt: form.nameEt.trim() || null,
        descriptionRu: form.descriptionRu.trim() || null,
        descriptionEn: form.descriptionEn.trim() || null,
        descriptionEt: form.descriptionEt.trim() || null,
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

      <div className="admin-item-localization-block">
        <p className="admin-field-label">{t.adminItemsLocalizedFields}</p>
        <div className="admin-form-grid admin-item-localization-grid">
          <div>
            <label className="admin-field-label">{t.adminItemsNameRu}</label>
            <input className="admin-field-input" value={form.nameRu} onChange={(event) => setForm(prev => ({ ...prev, nameRu: event.target.value }))} />
          </div>
          <div>
            <label className="admin-field-label">{t.adminItemsNameEn}</label>
            <input className="admin-field-input" value={form.nameEn} onChange={(event) => setForm(prev => ({ ...prev, nameEn: event.target.value }))} />
          </div>
          <div>
            <label className="admin-field-label">{t.adminItemsNameEt}</label>
            <input className="admin-field-input" value={form.nameEt} onChange={(event) => setForm(prev => ({ ...prev, nameEt: event.target.value }))} />
          </div>
          <div>
            <label className="admin-field-label">{t.adminItemsDescriptionRu}</label>
            <textarea className="admin-field-input admin-textarea" value={form.descriptionRu} onChange={(event) => setForm(prev => ({ ...prev, descriptionRu: event.target.value }))} rows={3} />
          </div>
          <div>
            <label className="admin-field-label">{t.adminItemsDescriptionEn}</label>
            <textarea className="admin-field-input admin-textarea" value={form.descriptionEn} onChange={(event) => setForm(prev => ({ ...prev, descriptionEn: event.target.value }))} rows={3} />
          </div>
          <div>
            <label className="admin-field-label">{t.adminItemsDescriptionEt}</label>
            <textarea className="admin-field-input admin-textarea" value={form.descriptionEt} onChange={(event) => setForm(prev => ({ ...prev, descriptionEt: event.target.value }))} rows={3} />
          </div>
        </div>
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
