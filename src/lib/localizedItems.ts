import { LanguageCode } from "@/lib/dashboardText";

type LocalizedItemLike = {
  name?: string | null;
  description?: string | null;
  nameRu?: string | null;
  nameEn?: string | null;
  nameEt?: string | null;
  descriptionRu?: string | null;
  descriptionEn?: string | null;
  descriptionEt?: string | null;
};

function normalizeText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function getLocalizedItemName(item: LocalizedItemLike | null | undefined, language: LanguageCode): string {
  const baseName = normalizeText(item?.name) || "-";

  if (language === "en") {
    return normalizeText(item?.nameEn) || baseName;
  }

  if (language === "et") {
    return normalizeText(item?.nameEt) || baseName;
  }

  return normalizeText(item?.nameRu) || baseName;
}

export function getLocalizedItemDescription(item: LocalizedItemLike | null | undefined, language: LanguageCode): string {
  const baseDescription = normalizeText(item?.description) || "-";

  if (language === "en") {
    return normalizeText(item?.descriptionEn) || baseDescription;
  }

  if (language === "et") {
    return normalizeText(item?.descriptionEt) || baseDescription;
  }

  return normalizeText(item?.descriptionRu) || baseDescription;
}
