import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { initialData } from "../data/initialData";
import { monthKey } from "../utils/finance";

const FinanceContext = createContext(null);

const STORAGE_KEY = "fintrack-finance-v1";

// Membaca data dari localStorage dan memastikan semua id dompet bertipe string
function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved
      ? { ...initialData, ...JSON.parse(saved) }
      : initialData;

    return {
      ...parsed,
      wallets: (parsed.wallets || []).map((w) => ({
        ...w,
        id: String(w.id),
        balance: Number(w.balance) || 0,
      })),
    };
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

  // Otomatis mengarsipkan bulan lama HANYA jika bulan kalender maju melewati activeMonth
  useEffect(() => {
    setData((prev) => {
      if (!prev.activeMonth || prev.activeMonth >= currentMonth) return prev;

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
          id: String(crypto.randomUUID()),
          balance: Number(wallet.balance) || 0,
        },
      ],
    }));
  }

  // Menghapus dompet
  function deleteWallet(id) {
    const targetId = String(id);
    const used =
      data.transactions.some((t) => String(t.walletId) === targetId) ||
      data.goals.some((g) => String(g.walletId) === targetId);

    if (used) {
      return {
        ok: false,
        message: "Dompet masih digunakan oleh transaksi atau target tabungan.",
      };
    }

    setData((prev) => ({
      ...prev,
      wallets: prev.wallets.filter((w) => String(w.id) !== targetId),
    }));

    return { ok: true };
  }

  // Menambahkan transaksi pemasukan atau pengeluaran
  function addTransaction(form) {
    const amount = Number(form.amount);
    const targetWalletId = String(form.walletId);

    if (!amount || amount <= 0) {
      return { ok: false, message: "Nominal transaksi harus lebih dari 0." };
    }

    const wallet = data.wallets.find((w) => String(w.id) === targetWalletId);

    if (!wallet) {
      return { ok: false, message: "Dompet tidak ditemukan." };
    }

    if (form.type === "expense" && wallet.balance < amount) {
      return {
        ok: false,
        message: `Saldo ${wallet.name} tidak cukup (tersisa Rp ${wallet.balance.toLocaleString("id-ID")}).`,
      };
    }

    setData((prev) => ({
      ...prev,

      wallets: prev.wallets.map((w) =>
        String(w.id) === targetWalletId
          ? {
              ...w,
              balance: w.balance + (form.type === "income" ? amount : -amount),
            }
          : w,
      ),

      transactions: [
        {
          ...form,
          walletId: targetWalletId,
          amount,
          id: String(crypto.randomUUID()),
          month: monthKey(form.date),
        },
        ...prev.transactions,
      ],
    }));

    return { ok: true };
  }

  // Transfer antar dompet
  function transfer(fromId, toId, amount, note = "Transfer antar dompet") {
    const nominal = Number(amount);
    const sourceId = String(fromId);
    const destId = String(toId);

    if (!nominal || nominal <= 0 || sourceId === destId) return false;

    const from = data.wallets.find((w) => String(w.id) === sourceId);
    const to = data.wallets.find((w) => String(w.id) === destId);

    if (!from || !to || from.balance < nominal) {
      return false;
    }

    const transferId = String(crypto.randomUUID());
    const date = `${data.activeMonth}-01`;

    setData((prev) => ({
      ...prev,

      wallets: prev.wallets.map((w) => {
        const wId = String(w.id);
        if (wId === sourceId) {
          return { ...w, balance: Number(w.balance) - nominal };
        }
        if (wId === destId) {
          return { ...w, balance: Number(w.balance) + nominal };
        }
        return w;
      }),

      transactions: [
        {
          id: String(crypto.randomUUID()),
          transferId,
          title: note,
          amount: nominal,
          type: "transfer-out",
          category: "Transfer",
          walletId: sourceId,
          date,
          month: prev.activeMonth,
        },
        {
          id: String(crypto.randomUUID()),
          transferId,
          title: note,
          amount: nominal,
          type: "transfer-in",
          category: "Transfer",
          walletId: destId,
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
          id: String(crypto.randomUUID()),
          walletId: String(goal.walletId),
          target: Number(goal.target),
          saved: 0,
        },
      ],
    }));
  }

  // Mengalokasikan uang ke target tabungan
  function contributeGoal(goalId, amount) {
    const nominal = Number(amount);

    const goal = data.goals.find((g) => String(g.id) === String(goalId));
    const wallet = data.wallets.find(
      (w) => String(w.id) === String(goal?.walletId),
    );

    if (
      !goal ||
      !wallet ||
      nominal <= 0 ||
      wallet.balance < nominal ||
      goal.saved + nominal > goal.target
    ) {
      return false;
    }

    setData((prev) => ({
      ...prev,

      wallets: prev.wallets.map((w) =>
        String(w.id) === String(wallet.id)
          ? { ...w, balance: w.balance - nominal }
          : w,
      ),

      goals: prev.goals.map((g) =>
        String(g.id) === String(goalId)
          ? { ...g, saved: g.saved + nominal }
          : g,
      ),
    }));

    return true;
  }

  // Menandai target tabungan selesai (uang sudah terpakai untuk tujuan, tidak kembali ke dompet)
  function completeGoal(id) {
    const targetId = String(id);

    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        String(g.id) === targetId ? { ...g, completed: true } : g,
      ),
    }));
  }

  // Menghapus target: jika belum diklik Complete, kembalikan tabungan ke dompet asal
  function removeGoal(id) {
    const targetId = String(id);
    const goal = data.goals.find((g) => String(g.id) === targetId);

    if (!goal) return;

    const refundAmount = goal.completed ? 0 : Number(goal.saved) || 0;
    const sourceWalletId = String(goal.walletId);

    setData((prev) => ({
      ...prev,

      wallets:
        refundAmount > 0
          ? prev.wallets.map((w) =>
              String(w.id) === sourceWalletId
                ? { ...w, balance: Number(w.balance) + refundAmount }
                : w,
            )
          : prev.wallets,

      goals: prev.goals.filter((g) => String(g.id) !== targetId),
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
    completeGoal,
    removeGoal,
  };

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export const useFinance = () => useContext(FinanceContext);
