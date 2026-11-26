// Hearth demo data: one household, June to November 2026.
// Amounts are USD. Expenses are negative, income is positive.

export const CATEGORIES = [
  { id: "housing", name: "Housing", color: "#4f46e5", budget: 1700 },
  { id: "groceries", name: "Groceries", color: "#16a34a", budget: 1250 },
  { id: "utilities", name: "Utilities", color: "#0284c7", budget: 360 },
  { id: "transport", name: "Transport", color: "#b45309", budget: 280 },
  { id: "dining", name: "Dining out", color: "#db2777", budget: 220 },
  { id: "entertainment", name: "Entertainment", color: "#9333ea", budget: 120 },
  { id: "health", name: "Health", color: "#0891b2", budget: 150 },
  { id: "shopping", name: "Shopping", color: "#dc2626", budget: 200 },
  { id: "subscriptions", name: "Subscriptions", color: "#65a30d", budget: 65 },
  { id: "personal", name: "Personal", color: "#0d9488", budget: 140 },
  { id: "savings", name: "Savings", color: "#166534", budget: 500 },
  { id: "other", name: "Other", color: "#6b7280", budget: 100 },
];

export const INCOME_CATEGORIES = [
  { id: "salary", name: "Salary" },
  { id: "freelance", name: "Freelance" },
  { id: "other-income", name: "Other income" },
];

export const BILLS = [
  { id: "rent", name: "Rent — Maple Court Apt 4B", amount: 1450, day: 1, category: "housing", note: "Due the 1st, autopay on" },
  { id: "electric", name: "City Power & Light", amount: 118, day: 8, category: "utilities", note: "Varies with the season" },
  { id: "internet", name: "Northline Internet 500 Mbps", amount: 79, day: 12, category: "utilities", note: "Fixed plan" },
  { id: "water", name: "City Water", amount: 46, day: 15, category: "utilities", note: "Quarterly meter reading" },
  { id: "phone", name: "Mobile — two lines", amount: 96, day: 18, category: "utilities", note: "Family plan" },
  { id: "insurance", name: "Home & auto insurance", amount: 212, day: 22, category: "housing", note: "Monthly premium" },
  { id: "gym", name: "Riverside Gym", amount: 39, day: 5, category: "health", note: "Couple membership" },
  { id: "streaming", name: "Stream & music bundle", amount: 28, day: 27, category: "subscriptions", note: "One bundle, three services" },
];

export const GOALS = [
  { id: "emergency", name: "Emergency fund", target: 6000, saved: 4350, deadline: "2027-06-30", note: "Six months of essentials" },
  { id: "holiday", name: "Summer holiday — coast trip", target: 2400, saved: 1480, deadline: "2027-07-01", note: "Flights, stay, and food" },
  { id: "car", name: "Next car down payment", target: 5000, saved: 1900, deadline: "2027-12-01", note: "Trading in the old sedan" },
  { id: "laptop", name: "New laptop for Maya", target: 1200, saved: 860, deadline: "2027-02-01", note: "For her freelance design work" },
];

export const MONTHS = ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"];
export const CURRENT_MONTH = "2026-11";

// t(date, description, category, amount)
function t(date, desc, category, amount) {
  return { id: "tx-" + date + "-" + desc.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 28), date, desc, category, amount };
}

function monthBase(m, salary, freelance) {
  return [
    t(m + "-01", "Salary — Daniel", "salary", salary),
    t(m + "-01", "Rent — Maple Court Apt 4B", "housing", -1450),
    t(m + "-05", "Riverside Gym", "health", -39),
    t(m + "-08", "City Power & Light", "utilities", -118),
    t(m + "-12", "Northline Internet 500 Mbps", "utilities", -79),
    t(m + "-15", "City Water", "utilities", -46),
    t(m + "-18", "Mobile — two lines", "utilities", -96),
    t(m + "-22", "Home & auto insurance", "housing", -212),
    t(m + "-27", "Stream & music bundle", "subscriptions", -28),
    t(m + "-15", "Freelance — logo pack (Maya)", "freelance", freelance),
    t(m + "-28", "Transfer to emergency fund", "savings", -500),
  ];
}

export const DEMO_MONTHS = {
  "2026-06": [
    ...monthBase("2026-06", 4200, 640),
    t("2026-06-03", "Market Street Grocers", "groceries", -148.2),
    t("2026-06-07", "Fuel — Shell", "transport", -52.4),
    t("2026-06-10", "Market Street Grocers", "groceries", -132.75),
    t("2026-06-12", "Cinema — two tickets", "entertainment", -34),
    t("2026-06-14", "Pharmacy — prescriptions", "health", -42.6),
    t("2026-06-17", "Market Street Grocers", "groceries", -161.9),
    t("2026-06-19", "Bus & metro passes", "transport", -68),
    t("2026-06-21", "Dinner at Nonna's", "dining", -58.4),
    t("2026-06-24", "Market Street Grocers", "groceries", -127.3),
    t("2026-06-26", "New school shoes", "shopping", -74.99),
    t("2026-06-29", "Takeaway — Thai Garden", "dining", -41.2),
  ],
  "2026-07": [
    ...monthBase("2026-07", 4200, 480),
    t("2026-07-02", "Market Street Grocers", "groceries", -155.6),
    t("2026-07-06", "Fuel — Shell", "transport", -49.8),
    t("2026-07-09", "Market Street Grocers", "groceries", -141.2),
    t("2026-07-11", "Summer fair tickets", "entertainment", -46),
    t("2026-07-13", "Dentist check-up", "health", -85),
    t("2026-07-16", "Market Street Grocers", "groceries", -139.45),
    t("2026-07-18", "Bus & metro passes", "transport", -68),
    t("2026-07-20", "Dinner at Nonna's", "dining", -64.75),
    t("2026-07-23", "Market Street Grocers", "groceries", -128.9),
    t("2026-07-25", "Kids' summer clothes", "shopping", -92.5),
    t("2026-07-28", "Takeaway — Pizza Napoli", "dining", -38.6),
    t("2026-07-30", "Car service — oil & filters", "transport", -145),
  ],
  "2026-08": [
    ...monthBase("2026-08", 4200, 720),
    t("2026-08-03", "Market Street Grocers", "groceries", -162.35),
    t("2026-08-06", "Fuel — Shell", "transport", -55.1),
    t("2026-08-09", "Market Street Grocers", "groceries", -147.8),
    t("2026-08-12", "Concert — Riverside Park", "entertainment", -58),
    t("2026-08-14", "Pharmacy — allergy meds", "health", -28.4),
    t("2026-08-17", "Market Street Grocers", "groceries", -151.25),
    t("2026-08-19", "Bus & metro passes", "transport", -68),
    t("2026-08-21", "Birthday dinner — Nonna's", "dining", -86.3),
    t("2026-08-24", "Market Street Grocers", "groceries", -133.6),
    t("2026-08-26", "New backpack & stationery", "shopping", -68.4),
    t("2026-08-29", "Takeaway — Thai Garden", "dining", -44.9),
  ],
  "2026-09": [
    ...monthBase("2026-09", 4350, 560),
    t("2026-09-02", "Market Street Grocers", "groceries", -149.7),
    t("2026-09-06", "Fuel — Shell", "transport", -51.6),
    t("2026-09-09", "Market Street Grocers", "groceries", -136.2),
    t("2026-09-11", "School fundraiser", "other", -25),
    t("2026-09-13", "Eye test & glasses", "health", -119),
    t("2026-09-16", "Market Street Grocers", "groceries", -158.85),
    t("2026-09-18", "Bus & metro passes", "transport", -68),
    t("2026-09-20", "Dinner at Bistro Verde", "dining", -72.5),
    t("2026-09-23", "Market Street Grocers", "groceries", -142.4),
    t("2026-09-25", "Autumn jackets", "shopping", -118.75),
    t("2026-09-28", "Takeaway — Pizza Napoli", "dining", -36.8),
  ],
  "2026-10": [
    ...monthBase("2026-10", 4350, 690),
    t("2026-10-03", "Market Street Grocers", "groceries", -166.1),
    t("2026-10-06", "Fuel — Shell", "transport", -54.9),
    t("2026-10-09", "Market Street Grocers", "groceries", -144.55),
    t("2026-10-11", "Cinema — family night", "entertainment", -41),
    t("2026-10-13", "Pharmacy — flu shots", "health", -60),
    t("2026-10-16", "Market Street Grocers", "groceries", -152.3),
    t("2026-10-18", "Bus & metro passes", "transport", -68),
    t("2026-10-20", "Dinner at Nonna's", "dining", -61.2),
    t("2026-10-23", "Market Street Grocers", "groceries", -138.75),
    t("2026-10-25", "Halloween costumes", "shopping", -58.9),
    t("2026-10-28", "Takeaway — Thai Garden", "dining", -43.5),
    t("2026-10-30", "Car wash & wipers", "transport", -38),
  ],
  "2026-11": [
    ...monthBase("2026-11", 4350, 820),
    t("2026-11-02", "Market Street Grocers", "groceries", -152.4),
    t("2026-11-03", "Coffee — Corner Cafe", "dining", -12.5),
    t("2026-11-04", "Fuel — Shell", "transport", -48.75),
    t("2026-11-05", "Kids' haircuts", "personal", -44),
    t("2026-11-06", "Market Street Grocers", "groceries", -138.9),
    t("2026-11-07", "Books — Readwell", "shopping", -32.4),
    t("2026-11-08", "Sunday roast — Bistro Verde", "dining", -74.2),
    t("2026-11-09", "Pharmacy — vitamins", "health", -36.8),
    t("2026-11-10", "Market Street Grocers", "groceries", -164.15),
    t("2026-11-11", "Bus & metro passes", "transport", -68),
    t("2026-11-12", "Cinema — two tickets", "entertainment", -36),
    t("2026-11-13", "New winter boots", "shopping", -89.99),
    t("2026-11-14", "Market Street Grocers", "groceries", -141.6),
    t("2026-11-15", "Freelance — wedding invites (Maya)", "freelance", 240),
    t("2026-11-16", "Takeaway — Thai Garden", "dining", -42.3),
    t("2026-11-17", "Fuel — Shell", "transport", -51.2),
    t("2026-11-18", "Market Street Grocers", "groceries", -129.85),
    t("2026-11-19", "Dentist — cleaning", "health", -65),
    t("2026-11-20", "Lunch with friends — Cafe Luna", "dining", -38.6),
    t("2026-11-21", "Market Street Grocers", "groceries", -157.3),
    t("2026-11-23", "Gift — birthday present", "shopping", -45),
    t("2026-11-24", "Market Street Grocers", "groceries", -119.5),
    t("2026-11-25", "Fuel — Shell", "transport", -47.9),
    t("2026-11-26", "Thanksgiving groceries", "groceries", -186.45),
  ],
};

export function seedState() {
  const transactions = [];
  for (const month of MONTHS) {
    for (const tx of DEMO_MONTHS[month]) transactions.push({ ...tx });
  }
  return {
    version: 1,
    transactions,
    budgets: Object.fromEntries(CATEGORIES.map((c) => [c.id, c.budget])),
    billsPaid: { "2026-11": ["rent", "gym", "electric"] },
    goals: GOALS.map((g) => ({ ...g })),
  };
}
