import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { expenseCategories, incomeCategories } from "../data/initialData";

function getDefaultDate(activeMonth) {
  const today = new Date().toISOString().slice(0, 10);
  if (!activeMonth) return today;
  return today.startsWith(activeMonth) ? today : `${activeMonth}-01`;
}

export default function TransactionForm({ wallets, activeMonth, onSubmit }) {
  const [type, setType] = useState("expense");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Makan & Minum",
    walletId: String(wallets[0]?.id || ""),
    date: getDefaultDate(activeMonth),
  });

  // Sinkronkan tanggal form setiap kali bulan aktif berubah (misal setelah Tutup Buku)
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      date: getDefaultDate(activeMonth),
    }));
  }, [activeMonth]);

  // Pastikan walletId selalu valid jika daftar dompet berubah
  useEffect(() => {
    if (
      wallets.length &&
      !wallets.some((w) => String(w.id) === String(form.walletId))
    ) {
      setForm((prev) => ({ ...prev, walletId: String(wallets[0].id) }));
    }
  }, [wallets, form.walletId]);

  const categories = type === "expense" ? expenseCategories : incomeCategories;

  function changeType(next) {
    setType(next);
    setError("");

    setForm((prev) => ({
      ...prev,
      category: next === "expense" ? expenseCategories[0] : incomeCategories[0],
    }));
  }

  function submit(e) {
    e.preventDefault();
    setError("");

    if (
      !form.title.trim() ||
      !form.amount ||
      Number(form.amount) <= 0 ||
      !form.walletId
    ) {
      setError("Lengkapi nama transaksi, nominal, dan pilihan dompet.");
      return;
    }

    const result = onSubmit({
      ...form,
      type,
      amount: Number(form.amount),
    });

    const isSuccess = typeof result === "object" ? result.ok : Boolean(result);

    if (isSuccess) {
      setForm((prev) => ({
        ...prev,
        title: "",
        amount: "",
      }));
    } else {
      setError(
        result?.message || "Gagal menyimpan transaksi. Periksa saldo dompet.",
      );
    }
  }

  return (
    <form className="transaction-form" onSubmit={submit}>
      <div className="type-switch">
        <button
          type="button"
          className={type === "expense" ? "active expense" : ""}
          onClick={() => changeType("expense")}
        >
          <ArrowUpRight size={16} />
          Pengeluaran
        </button>

        <button
          type="button"
          className={type === "income" ? "active income" : ""}
          onClick={() => changeType("income")}
        >
          <ArrowDownLeft size={16} />
          Pemasukan
        </button>
      </div>

      <div className="form-grid">
        <label className="field full">
          <span>Nama transaksi</span>

          <input
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value,
              })
            }
            placeholder="Contoh: Makan siang"
            required
          />
        </label>

        <label className="field">
          <span>Nominal (Rp)</span>

          <input
            type="number"
            min="1"
            value={form.amount}
            onChange={(e) =>
              setForm({
                ...form,
                amount: e.target.value,
              })
            }
            placeholder="20000"
            required
          />
        </label>

        <label className="field">
          <span>Kategori</span>

          <select
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value,
              })
            }
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Dompet</span>

          <select
            value={form.walletId}
            onChange={(e) =>
              setForm({
                ...form,
                walletId: e.target.value,
              })
            }
          >
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name} (Rp{" "}
                {Number(wallet.balance).toLocaleString("id-ID")})
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Tanggal</span>

          <input
            type="date"
            value={form.date}
            onChange={(e) =>
              setForm({
                ...form,
                date: e.target.value,
              })
            }
            required
          />
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      <button className="btn btn-primary submit-btn" type="submit">
        <Plus size={17} />
        Simpan transaksi
      </button>
    </form>
  );
}
