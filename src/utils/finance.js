export const money = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const monthKey = (date) => {
  const d = new Date(`${date}T00:00:00`);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const monthLabel = (key) => {
  if (!key) return "";

  const [year, month] = key.split("-");

  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
    "id-ID",
    {
      month: "long",
      year: "numeric",
    },
  );
};

export const sum = (items, type) =>
  items
    .filter((item) => !type || item.type === type)
    .reduce((total, item) => total + Number(item.amount), 0);

export const getWalletIcon = (type) => {
  return (
    {
      wallet: "👛",
      cash: "💵",
      phone: "📱",
      bank: "🏦",
      savings: "🐷",
    }[type] || "💳"
  );
};
