export const money = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
export const compactMoney = (value: number) => value >= 1000 ? `${Math.round(value / 1000)}K` : `${value}`;
export const boardMoney = (value: number) => {
  if (value < 1000) return `${value}`;
  const thousands = value / 1000;
  return Number.isInteger(thousands) ? `${thousands}` : `${Math.round(thousands * 10) / 10}`;
};
export const shortDate = (value: string) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(value));
