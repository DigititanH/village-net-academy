const STORAGE_KEY = "reseller_referral_code";

export function getReferralCode() {
  return localStorage.getItem(STORAGE_KEY)?.trim() || "";
}

export function setReferralCode(code) {
  const trimmed = code?.trim();
  if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
  else localStorage.removeItem(STORAGE_KEY);
}

export function captureReferralFromParams(searchParams) {
  const ref = searchParams.get("ref")?.trim();
  if (ref) setReferralCode(ref);
}
