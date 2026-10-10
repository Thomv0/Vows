export const ADMIN_EMAIL = "thom03.versluis@proton.me";

export function isAdminEmail(email?: string | null) {
  return email?.trim().toLowerCase() === ADMIN_EMAIL;
}
