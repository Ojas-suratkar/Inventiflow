const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const plain = new Intl.NumberFormat("en-US");

export const currency = (value) => money.format(Number(value || 0));
export const compactCurrency = (value) => "$" + compact.format(Number(value || 0));
export const number = (value) => plain.format(Number(value || 0));

export const shortDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export const relativeDays = (value) => {
  if (!value) return "";
  const days = Math.round((new Date(value) - new Date()) / 86400000);
  if (days === 0) return "today";
  if (days > 0) return `in ${days} day${days === 1 ? "" : "s"}`;
  return `${Math.abs(days)} day${days === -1 ? "" : "s"} ago`;
};
