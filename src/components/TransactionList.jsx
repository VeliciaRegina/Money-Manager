import { useMemo, useState } from "react";

import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
} from "lucide-react";

import { money } from "../utils/finance";

import { expenseCategories, incomeCategories } from "../data/initialData";

export default function TransactionList({
  transactions,
  wallets,
  title = "Aktivitas terbaru",
}) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [category, setCategory] = useState("all");
  const [wallet, setWallet] = useState("all");

  const filtered = useMemo(() => {
    return transactions.filter(
      (t) =>
        (kind === "all" ||
          (kind === "income" && t.type === "income") ||
          (kind === "expense" && t.type === "expense") ||
          (kind === "transfer" && t.type.startsWith("transfer"))) &&
        (category === "all" || t.category === category) &&
        (wallet === "all" || t.walletId === wallet) &&
        `${t.title} ${t.category}`.toLowerCase().includes(search.toLowerCase()),
    );
  }, [transactions, kind, category, wallet, search]);

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">RECORD</span>
          <h3>{title}</h3>
        </div>

        <span className="count-pill">{filtered.length} aktivitas</span>
      </div>

      <div className="filters">
        <div className="search-box">
          <Search size={16} />

          <input
            placeholder="Cari transaksi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="all">Semua jenis</option>
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
          <option value="transfer">Transfer</option>
        </select>

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">Semua kategori</option>

          {[...expenseCategories, ...incomeCategories, "Transfer"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select value={wallet} onChange={(e) => setWallet(e.target.value)}>
          <option value="all">Semua dompet</option>

          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <div className="transaction-items">
        {filtered.length ? (
          filtered.map((t) => {
            const transfer = t.type.startsWith("transfer");
            const income = t.type === "income" || t.type === "transfer-in";

            const walletName =
              wallets.find((w) => w.id === t.walletId)?.name ||
              "Dompet dihapus";

            return (
              <div className="transaction-row" key={t.id}>
                <div
                  className={`transaction-icon ${
                    transfer ? "transfer" : income ? "positive" : "negative"
                  }`}
                >
                  {transfer ? (
                    <ArrowLeftRight size={17} />
                  ) : income ? (
                    <ArrowDownLeft size={17} />
                  ) : (
                    <ArrowUpRight size={17} />
                  )}
                </div>

                <div className="transaction-info">
                  <b>{t.title}</b>

                  <span>
                    {t.category} · {walletName}
                  </span>
                </div>

                <div className="transaction-amount">
                  <b
                    className={
                      transfer ? "" : income ? "text-green" : "text-red"
                    }
                  >
                    {transfer ? "↔ " : income ? "+ " : "− "}

                    {money(t.amount)}
                  </b>

                  <span>
                    {new Date(`${t.date}T00:00:00`).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            Belum ada transaksi yang cocok dengan filter.
          </div>
        )}
      </div>
    </section>
  );
}
