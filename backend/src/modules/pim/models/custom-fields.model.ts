// Shared type for custom/extensible fields in PIM models
export type CustomFieldValue = string | number | boolean | Date | null | undefined;
export type CustomFields = Record<string, CustomFieldValue>;
