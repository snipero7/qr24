export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "مديرالنظام",
  TECH: "فني صيانة",
  CLERK: "موظف",
};

export function roleToArabic(role: string | null | undefined) {
  if (!role) return "";
  return ROLE_LABELS[role] ?? role;
}
