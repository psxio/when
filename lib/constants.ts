// ─── API ENDPOINTS ─────────────────────────────────────────────────
export const API_SUMMARY =
  "https://data.techforpalestine.org/api/v3/summary.min.json";
export const API_NAMES =
  "https://data.techforpalestine.org/api/v2/killed-in-gaza/child-name-counts-en.json";

// ─── FALLBACK DATA ─────────────────────────────────────────────────
export const FALLBACK_SUMMARY = {
  gaza: {
    last_update: "2026-02-14",
    reports: 500,
    massacres: 4200,
    killed: {
      total: 48000,
      children: 17400,
      women: 12500,
      press: 210,
      medical: 1050,
      civil_defence: 170,
    },
    injured: { total: 110000 },
    famine: { total: 45, children: 38 },
    aid_seeker: { killed: 950, injured: 1600 },
  },
  west_bank: {
    last_update: "2026-02-14",
    reports: 500,
    killed: { total: 890, children: 175 },
    injured: { total: 7200, children: 900 },
    settler_attacks: 1950,
  },
  known_killed_in_gaza: { records: 18000 },
};

export const FALLBACK_NAMES = [
  { name: "Mohammed", count: 920 },
  { name: "Ahmed", count: 710 },
  { name: "Yusuf", count: 480 },
  { name: "Ali", count: 390 },
  { name: "Omar", count: 340 },
  { name: "Ibrahim", count: 310 },
  { name: "Fatima", count: 290 },
  { name: "Maryam", count: 270 },
  { name: "Aisha", count: 240 },
  { name: "Adam", count: 220 },
  { name: "Malak", count: 200 },
  { name: "Layan", count: 185 },
  { name: "Yasmin", count: 170 },
  { name: "Nour", count: 160 },
  { name: "Sara", count: 150 },
  { name: "Khalil", count: 140 },
  { name: "Yousef", count: 130 },
  { name: "Layla", count: 125 },
  { name: "Hana", count: 115 },
  { name: "Zain", count: 110 },
];

// ─── AID ORGANIZATIONS ─────────────────────────────────────────────
export const AID_ORGS = [
  {
    name: "PCRF",
    full: "Palestine Children's Relief Fund",
    url: "https://www.pcrf.net/",
    desc: "Free medical care for children. 4-star Charity Navigator rating for 12 consecutive years.",
    tag: "Medical",
  },
  {
    name: "UNRWA",
    full: "UN Relief & Works Agency",
    url: "https://donate.unrwa.org/",
    desc: "The UN's primary agency serving Palestinian refugees \u2014 food, shelter, healthcare, and education.",
    tag: "UN Agency",
  },
  {
    name: "MAP",
    full: "Medical Aid for Palestinians",
    url: "https://www.map.org.uk/",
    desc: "Emergency healthcare and long-term medical infrastructure in Palestine.",
    tag: "Medical",
  },
  {
    name: "Anera",
    full: "American Near East Refugee Aid",
    url: "https://www.anera.org/",
    desc: "Emergency food, water, shelter, and medical supplies to families in crisis.",
    tag: "Humanitarian",
  },
  {
    name: "WCK",
    full: "World Central Kitchen",
    url: "https://wck.org/",
    desc: "Frontline food delivery and community kitchen programs in Gaza.",
    tag: "Food Aid",
  },
  {
    name: "HEAL Palestine",
    full: "HEAL Palestine",
    url: "https://healpalestine.org/",
    desc: "Trauma and mental health support for children affected by violence.",
    tag: "Mental Health",
  },
];

// ─── REPRESENTATIVE LINKS ──────────────────────────────────────────
export const REP_LINKS = [
  {
    label: "Find Your US Representative",
    url: "https://www.house.gov/representatives/find-your-representative",
    flag: "\u{1F1FA}\u{1F1F8}",
  },
  {
    label: "Find Your US Senator",
    url: "https://www.senate.gov/senators/senators-contact.htm",
    flag: "\u{1F1FA}\u{1F1F8}",
  },
  {
    label: "Find Your UK MP",
    url: "https://members.parliament.uk/members/Commons",
    flag: "\u{1F1EC}\u{1F1E7}",
  },
  {
    label: "Find Your Canadian MP",
    url: "https://www.ourcommons.ca/Members/en",
    flag: "\u{1F1E8}\u{1F1E6}",
  },
  {
    label: "Find Your Australian MP",
    url: "https://www.aph.gov.au/Senators_and_Members",
    flag: "\u{1F1E6}\u{1F1FA}",
  },
];

// ─── NAVIGATION ────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { id: "hero", label: "Home" },
  { id: "names", label: "Names" },
  { id: "data", label: "Data" },
  { id: "act", label: "Act" },
  { id: "build", label: "Build" },
];

// ─── FONTS ─────────────────────────────────────────────────────────
export const ff = "'Playfair Display', Georgia, serif";
export const sans = "'DM Sans', 'Helvetica Neue', sans-serif";
export const mono = "'JetBrains Mono', 'SF Mono', monospace";

// ─── TYPES ─────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SummaryData = any;
export type NameEntry = { name: string; count: number };
