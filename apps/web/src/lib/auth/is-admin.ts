export function isAdminEmail(email?: string | null): boolean {
  if (!email) {
    return false;
  }

  const raw = process.env.ADMIN_EMAILS ?? "";
  const allowlist = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.length === 0) {
    return false;
  }

  return allowlist.includes(email.toLowerCase());
}
