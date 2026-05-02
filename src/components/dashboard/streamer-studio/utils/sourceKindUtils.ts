export const EDITABLE_TEXT_SOURCE_KINDS = [
  "text_gdiplus_v3",
  "text_gdiplus_v2",
  "text_gdiplus",
  "text_ft2_source_v2",
  "text_ft2_source",
] as const;

export function isEditableTextKind(kind: string | null | undefined): boolean {
  return EDITABLE_TEXT_SOURCE_KINDS.includes((kind ?? "") as (typeof EDITABLE_TEXT_SOURCE_KINDS)[number]);
}

export function isBrowserSourceKind(kind: string | null | undefined): boolean {
  return kind === "browser_source";
}

export function isEditableStudioSourceKind(kind: string | null | undefined): boolean {
  return isBrowserSourceKind(kind) || isEditableTextKind(kind);
}
