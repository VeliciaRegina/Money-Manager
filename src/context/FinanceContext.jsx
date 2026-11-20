import { createContext, useContext, useEffect, useState } from "react";
import { initialData } from "../data/initialData";

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("fintrack_data");
      return saved ? JSON.parse(saved) : initialData;
    } catch {
      return initialData;
    }
  });

  useEffect(() => {
    localStorage.setItem("fintrack_data", JSON.stringify(data));
  }, [data]);

  // Transaksi yang hanya masuk pada bulan aktif
  const monthTransactions = data.transactions.filter(
    (t) => t.date && t.date.startsWith(data.activeMonth),
  );

  // 1. Tambah Dompet
  function addWallet(wallet) {
    const newWallet = {
      id: `w-${Date.now()}`,
      name: wallet.name.trim(),
      type: wallet.type || "cash",
      balance: Number(wallet.balance) || 0,
      color: wallet.color || "yellow",
    };

    setData((prev) => ({
      ...prev,
      wallets: [...prev.wallets, newWallet],
    }));
  }

  // 2. Hapus Dompet
  function deleteWallet(id) {
    const targetId = String(id);
    setData((prev) => ({
      ...prev,
      wallets: prev.wallets.filter((w) => String(w.id) !== targetId),
    }));
  }

  // 3. Tambah Transaksi (Pemasukan / Pengeluaran)
  function addTransaction(tx) {
    const amount = Number(tx.amount) || 0;
    const targetWalletId = String(tx.walletId);

    if (amount <= 0) return false;

    const wallet = data.wallets.find((w) => String(w.id) === targetWalletId);
    if (!wallet) return false;

    // Validasi agar saldo dompet tidak minus saat pengeluaran
    if (tx.type === "expense" && Number(wallet.balance) < amount) {
      return false;
    }

    const newTx = {
      id: `tx-${Date.now()}`,
      type: tx.type,
      amount,
      title: tx.title.trim(),
      category: tx.category,
      walletId: targetWalletId,
      date: tx.date || `${data.activeMonth}-01`,
    };

    setData((prev) => ({
      ...prev,
      wallets: prev.wallets.map((w) => {
        if (String(w.id) !== targetWalletId) return w;
        const delta = tx.type === "income" ? amount : -amount;
        return { ...w, balance: Number(w.balance) + delta };
      }),
      transactions: [newTx, ...prev.transactions],
    }));

    return true;
  }

  // 4. Transfer Antar-Dompet
  function transfer(fromId, toId, amountValue) {
    const amount = Number(amountValue) || 0;
    const sourceId = String(fromId);
    const destId = String(toId);

    if (amount <= 0 || sourceId === destId) return false;

    const sourceWallet = data.wallets.find((w) => String(w.id) === sourceId);
    const destWallet = data.wallets.find((w) => String(w.id) === destId);

    if (!sourceWallet || !destWallet) return false;
    if (Number(sourceWallet.balance) < amount) return false;

    setData((prev) => ({
      ...prev,
      wallets: prev.wallets.map((w) => {
        if (String(w.id) === sourceId) {
          return { ...w, balance: Number(w.balance) - amount };
        }
        if (String(w.id) === destId) {
          return { ...w, balance: Number(w.balance) + amount };
        }
        return w;
      }),
    }));

    return true;
  }

  // 5. Tutup Buku / Reset Bulanan & Arsip ke History
  function closeMonth() {
    const currentMonthTx = data.transactions.filter(
      (t) => t.date && t.date.startsWith(data.activeMonth),
    );

    const income = currentMonthTx
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = currentMonthTx
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Hitung kategori pengeluaran terbesar
    const categoryTotals = {};
    currentMonthTx
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categoryTotals[t.category] =
          (categoryTotals[t.category] || 0) + Number(t.amount);
      });

    let topCategory = "-";
    let maxSpent = 0;
    Object.entries(categoryTotals).forEach(([cat, val]) => {
      if (val > maxSpent) {
        maxSpent = val;
        topCategory = cat;
      }
    });

    // Hitung bulan berikutnya (YYYY-MM)
    const [yearStr, monthStr] = data.activeMonth.split("-");
    let year = Number(yearStr);
    let month = Number(monthStr) + 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    const nextMonth = `${year}-${String(month).padStart(2, "0")}`;

    const archiveEntry = {
      id: `hist-${Date.now()}`,
      month: data.activeMonth,
      income,
      expense,
      net: income - expense,
      topCategory,
      transactions: currentMonthTx,
    };

    setData((prev) => ({
      ...prev,
      activeMonth: nextMonth,
      history: [archiveEntry, ...(prev.history || [])],
    }));
  }

  // 6. Atur Budget Bulanan & Per Kategori
  function setBudget(totalLimit, categoryName, categoryLimit) {
    setData((prev) => {
      const updatedBudgets = {
        ...prev.budgets,
        categories: { ...prev.budgets.categories },
      };

      if (totalLimit !== null && totalLimit !== undefined) {
        updatedBudgets.total = Number(totalLimit) || 0;
      }

      if (categoryName) {
        updatedBudgets.categories[categoryName] = Number(categoryLimit) || 0;
      }

      return {
        ...prev,
        budgets: updatedBudgets,
      };
    });
  }

  // 7. Tambah Target Tabungan (Goal)
  function addGoal(goal) {
    const newGoal = {
      id: `g-${Date.now()}`,
      name: goal.name.trim(),
      target: Number(goal.target) || 0,
      saved: 0,
      walletId: String(goal.walletId),
      deadline: goal.deadline || "",
      completed: false,
    };

    setData((prev) => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));
  }

  // 8. Alokasikan Dana dari Dompet ke Target Tabungan
  function contributeGoal(id, amountValue) {
    const targetId = String(id);
    const amount = Number(amountValue) || 0;

    if (amount <= 0) return false;

    const goal = data.goals.find((g) => String(g.id) === targetId);
    if (!goal || goal.completed) return false;

    const remaining = Number(goal.target) - Number(goal.saved);
    if (amount > remaining) return false;

    const sourceWalletId = String(goal.walletId);
    const wallet = data.wallets.find((w) => String(w.id) === sourceWalletId);
    if (!wallet || Number(wallet.balance) < amount) return false;

    setData((prev) => ({
      ...prev,
      wallets: prev.wallets.map((w) =>
        String(w.id) === sourceWalletId
          ? { ...w, balance: Number(w.balance) - amount }
          : w,
      ),
      goals: prev.goals.map((g) =>
        String(g.id) === targetId
          ? { ...g, saved: Number(g.saved) + amount }
          : g,
      ),
    }));

    return true;
  }

  // 9. Selesaikan Target Tabungan & Catat Otomatis Sebagai Pengeluaran Bulan Aktif
  function completeGoal(id) {
    const targetId = String(id);
    const goal = data.goals.find((g) => String(g.id) === targetId);

    if (!goal || goal.completed) return;

    const spentAmount = Number(goal.saved) || 0;
    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const txDate = localToday.startsWith(data.activeMonth)
      ? localToday
      : `${data.activeMonth}-01`;

    const goalExpenseTx = {
      id: `tx-goal-${Date.now()}`,
      type: "expense",
      amount: spentAmount,
      title: `Target Tercapai: ${goal.name}`,
      category: "Belanja",
      walletId: String(goal.walletId),
      date: txDate,
    };

    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        String(g.id) === targetId ? { ...g, completed: true } : g,
      ),
      transactions:
        spentAmount > 0
          ? [goalExpenseTx, ...prev.transactions]
          : prev.transactions,
    }));
  }

  // 10. Hapus Target Tabungan (Kembalikan Saldo Jika Belum Complete)
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

export function useFinance() {
  return useContext(FinanceContext);
}
