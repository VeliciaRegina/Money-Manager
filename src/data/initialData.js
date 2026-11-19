const now = new Date();

const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
  2,
  "0",
)}`;

const today = now.toISOString().slice(0, 10);

export const initialData = {
  wallets: [
    {
      id: "w-main",
      name: "Dompet Utama",
      type: "wallet",
      balance: 350000,
    },
    {
      id: "w-cash",
      name: "Cash",
      type: "cash",
      balance: 150000,
    },
    {
      id: "w-bank",
      name: "Rekening Bank",
      type: "bank",
      balance: 1850000,
    },
    {
      id: "w-ewallet",
      name: "E-Money",
      type: "phone",
      balance: 275000,
    },
    {
      id: "w-save",
      name: "Tabungan",
      type: "savings",
      balance: 1200000,
    },
  ],

  transactions: [
    {
      id: "t-1",
      title: "Uang saku bulanan",
      amount: 1500000,
      type: "income",
      category: "Gaji / Uang Saku",
      walletId: "w-bank",
      date: today,
      month,
    },
    {
      id: "t-2",
      title: "Makan siang",
      amount: 20000,
      type: "expense",
      category: "Makan & Minum",
      walletId: "w-cash",
      date: today,
      month,
    },
    {
      id: "t-3",
      title: "Ongkos transport",
      amount: 15000,
      type: "expense",
      category: "Transportasi",
      walletId: "w-ewallet",
      date: today,
      month,
    },
    {
      id: "t-4",
      title: "Kebutuhan kost",
      amount: 250000,
      type: "expense",
      category: "Tagihan / Kost",
      walletId: "w-bank",
      date: today,
      month,
    },
  ],

  history: [],

  budgets: {
    total: 1200000,
    categories: {
      "Makan & Minum": 450000,
      Transportasi: 200000,
      Belanja: 200000,
      "Tagihan / Kost": 300000,
    },
  },

  goals: [
    {
      id: "g-1",
      name: "Laptop baru",
      target: 8000000,
      saved: 1200000,
      walletId: "w-save",
      deadline: "",
    },
  ],

  activeMonth: month,
};

export const expenseCategories = [
  "Makan & Minum",
  "Transportasi",
  "Belanja",
  "Tagihan / Kost",
  "Hiburan",
  "Kesehatan",
  "Pendidikan",
  "Lainnya",
];

export const incomeCategories = [
  "Gaji / Uang Saku",
  "Freelance",
  "Hadiah",
  "Penjualan",
  "Lainnya",
];

export const walletTypes = [
  {
    value: "wallet",
    label: "Dompet",
    icon: "Wallet",
  },
  {
    value: "cash",
    label: "Cash",
    icon: "Banknote",
  },
  {
    value: "phone",
    label: "E-Money",
    icon: "Smartphone",
  },
  {
    value: "bank",
    label: "Bank",
    icon: "Landmark",
  },
  {
    value: "savings",
    label: "Tabungan",
    icon: "PiggyBank",
  },
];
