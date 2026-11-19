import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { initialData } from "../data/initialData";
import { monthKey } from "../utils/finance";

const FinanceContext = createContext(null);

const STORAGE_KEY = "fintrack-finance-v1";

// Membaca data dari localStorage
function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    return saved ? { ...initialData, ...JSON.parse(saved) } : initialData;
  } catch {
    return initialData;
  }
}

export function FinanceProvider({ children }) {
  const [data, setData] = useState(loadData);

  // Menyimpan perubahan data ke localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const currentMonth = monthKey(new Date().toISOString().slice(0, 10));

  // Otomatis mengarsipkan bulan lama ketika bulan kalender berubah
  useEffect(() => {
    setData((prev) => {
      if (prev.activeMonth === currentMonth) return prev;

      const entries = prev.transactions.filter(
        (t) => t.month === prev.activeMonth,
      );

      const alreadyArchived = prev.history.some(
        (h) => h.month === prev.activeMonth,
      );

      let history = prev.history;

      if (entries.length && !alreadyArchived) {
        const expenses = entries.filter((t) => t.type === "expense");

        const incomes = entries.filter((t) => t.type === "income");

        const categoryTotals = expenses.reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {});

        const topCategory = Object.entries(categoryTotals).sort(
          (a, b) => b[1] - a[1],
        )[0];

        const income = incomes.reduce((total, t) => total + t.amount, 0);

        const expense = expenses.reduce((total, t) => total + t.amount, 0);

        history = [
          {
            month: prev.activeMonth,
            income,
            expense,
            net: income - expense,
            topCategory: topCategory
              ? {
                  name: topCategory[0],
                  amount: topCategory[1],
                }
              : null,
            transactions: entries,
          },
          ...prev.history,
        ];
      }

      return {
        ...prev,
        activeMonth: currentMonth,
        history,
      };
    });
  }, [currentMonth]);

  // Transaksi khusus bulan aktif
  const monthTransactions = useMemo(() => {
    return data.transactions.filter((t) => t.month === data.activeMonth);
  }, [data.transactions, data.activeMonth]);

  // Menambahkan dompet
  function addWallet(wallet) {
    setData((prev) => ({
      ...prev,
      wallets: [
        ...prev.wallets,
        {
          ...wallet,
          id: crypto.randomUUID(),
          balance: Number(wallet.balance) || 0,
        },
      ],
    }));
  }

  // Menghapus dompet
  function deleteWallet(id) {
    const used =
      data.transactions.some((t) => t.walletId === id) ||
      data.goals.some((g) => g.walletId === id);

    if (used) {
      return {
        ok: false,
        message: "Dompet masih digunakan oleh transaksi atau target tabungan.",
      };
    }

    setData((prev) => ({
      ...prev,
      wallets: prev.wallets.filter((w) => w.id !== id),
    }));

    return { ok: true };
  }

  // Menambahkan transaksi pemasukan atau pengeluaran
  function addTransaction(form) {
    const amount = Number(form.amount);

    if (!amount || amount <= 0) return false;

    setData((prev) => ({
      ...prev,

      wallets: prev.wallets.map((w) =>
        w.id === form.walletId
          ? {
              ...w,
              balance: w.balance + (form.type === "income" ? amount : -amount),
            }
          : w,
      ),

      transactions: [
        {
          ...form,
          amount,
          id: crypto.randomUUID(),
          month: monthKey(form.date),
        },
        ...prev.transactions,
      ],
    }));

    return true;
  }

  // Transfer antar dompet
  function transfer(fromId, toId, amount, note = "Transfer antar dompet") {
    amount = Number(amount);

    if (!amount || amount <= 0 || fromId === toId) return false;

    const from = data.wallets.find((w) => w.id === fromId);
    const to = data.wallets.find((w) => w.id === toId);

    if (!from || !to || from.balance < amount) {
      return false;
    }

    const transferId = crypto.randomUUID();
    const date = new Date().toISOString().slice(0, 10);

    setData((prev) => ({
      ...prev,

      wallets: prev.wallets.map((w) =>
        w.id === fromId
          ? { ...w, balance: w.balance - amount }
          : w.id === toId
            ? { ...w, balance: w.balance + amount }
            : w,
      ),

      transactions: [
        {
          id: crypto.randomUUID(),
          transferId,
          title: note,
          amount,
          type: "transfer-out",
          category: "Transfer",
          walletId: fromId,
          date,
          month: prev.activeMonth,
        },
        {
          id: crypto.randomUUID(),
          transferId,
          title: note,
          amount,
          type: "transfer-in",
          category: "Transfer",
          walletId: toId,
          date,
          month: prev.activeMonth,
        },
        ...prev.transactions,
      ],
    }));

    return true;
  }

  // Menutup buku dan mengarsipkan bulan aktif
  function closeMonth() {
    const entries = data.transactions.filter(
      (t) => t.month === data.activeMonth,
    );

    if (!entries.length) return false;

    if (data.history.some((h) => h.month === data.activeMonth)) {
      return false;
    }

    const expenses = entries.filter((t) => t.type === "expense");

    const incomes = entries.filter((t) => t.type === "income");

    const categoryTotals = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    const topCategory = Object.entries(categoryTotals).sort(
      (a, b) => b[1] - a[1],
    )[0];

    const income = incomes.reduce((s, t) => s + t.amount, 0);

    const expense = expenses.reduce((s, t) => s + t.amount, 0);

    const [year, month] = data.activeMonth.split("-").map(Number);

    const next = new Date(year, month, 1);

    const nextKey = `${next.getFullYear()}-${String(
      next.getMonth() + 1,
    ).padStart(2, "0")}`;

    setData((prev) => ({
      ...prev,
      activeMonth: nextKey,

      history: [
        {
          month: prev.activeMonth,
          income,
          expense,
          net: income - expense,

          topCategory: topCategory
            ? {
                name: topCategory[0],
                amount: topCategory[1],
              }
            : null,

          transactions: entries,
        },
        ...prev.history,
      ],
    }));

    return true;
  }

  // Mengatur budget
  function setBudget(total, category, amount) {
    setData((prev) => ({
      ...prev,

      budgets: {
        ...prev.budgets,

        total: total === null ? prev.budgets.total : Number(total),

        categories: category
          ? {
              ...prev.budgets.categories,
              [category]: Number(amount),
            }
          : prev.budgets.categories,
      },
    }));
  }

  // Membuat target tabungan
  function addGoal(goal) {
    setData((prev) => ({
      ...prev,

      goals: [
        ...prev.goals,
        {
          ...goal,
          id: crypto.randomUUID(),
          target: Number(goal.target),
          saved: 0,
        },
      ],
    }));
  }

  // Mengalokasikan uang ke target tabungan
  function contributeGoal(goalId, amount) {
    amount = Number(amount);

    const goal = data.goals.find((g) => g.id === goalId);

    const wallet = data.wallets.find((w) => w.id === goal?.walletId);

    if (
      !goal ||
      !wallet ||
      amount <= 0 ||
      wallet.balance < amount ||
      goal.saved + amount > goal.target
    ) {
      return false;
    }

    setData((prev) => ({
      ...prev,

      wallets: prev.wallets.map((w) =>
        w.id === wallet.id ? { ...w, balance: w.balance - amount } : w,
      ),

      goals: prev.goals.map((g) =>
        g.id === goalId ? { ...g, saved: g.saved + amount } : g,
      ),
    }));

    return true;
  }

  // Menghapus target
  function removeGoal(id) {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
  }

  const value = {
    ...data,
    monthTransactions,
    addWallet,
    deleteWallet,
    addTransaction,
    transfer,
    closeMonth,
    setBudget,
    addGoal,
    contributeGoal,
    removeGoal,
  };

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export const useFinance = () => useContext(FinanceContext);
