export const PROGRAMME_CENTRE = "Digititan Programme";
export const RESELLER_RATE = 53;
export const ACADEMY_RATE = 26;

export function normalizeCentreName(name) {
  return String(name || "").trim().replace(/\s+/g, " ");
}

export function isProgrammeCentre(name) {
  const n = normalizeCentreName(name).toLowerCase();
  return (
    n === PROGRAMME_CENTRE.toLowerCase() ||
    n === "digititan" ||
    n === "programme" ||
    n === "program" ||
    n === "village netacad programme"
  );
}

/** Derive affiliation display from stored centre / academy name. */
export function getResellerAffiliation(academy) {
  const centre = normalizeCentreName(academy);
  const independent = isProgrammeCentre(centre);
  return {
    affiliation: independent ? "independent" : "affiliated",
    label: independent ? "Independent" : "Affiliated",
    centre: centre || "—",
    centreDisplay: independent ? PROGRAMME_CENTRE : centre || "—",
    resellerRate: RESELLER_RATE,
    centreRate: ACADEMY_RATE,
  };
}

export function affiliationBadgeClass(type) {
  if (type === "independent") {
    return "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300";
  }
  return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
}
