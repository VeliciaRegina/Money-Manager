import { useMemo, useState } from "react";

import {
  Wallet,
  Plus,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  BookOpen,
  Coffee,
  Utensils,
} from "lucide-react";

import { useFinance } from "../context/FinanceContext";

import { money, monthLabel, sum } from "../utils/finance";

import WalletCard from "../components/WalletCard";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";
import ProgressBar from "../components/ProgressBar";

import { WalletModal, TransferModal } from "../components/WalletActions";

import { expenseCategories } from "../data/initialData";

export default function Dashboard() {
  const finance = useFinance();

  const [modal, setModal] = useState("");

  const income = sum(finance.monthTransactions, "income");

  const expense = sum(finance.monthTransactions, "expense");

  const totalBalance = finance.wallets.reduce((s, w) => s + w.balance, 0);

  const categoryData = useMemo(() => {
    return expenseCategories
      .map((name) => ({
        name,

        value: finance.monthTransactions
          .filter((t) => t.type === "expense" && t.category === name)
          .reduce((s, t) => s + t.amount, 0),
      }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [finance.monthTransactions]);

  const totalBudget = finance.budgets.total;

  const percent = totalBudget ? (expense / totalBudget) * 100 : 0;

  // tutup buku
  const close = () => {
    if (finance.closeMonth()) {
      alert(
        "Buku bulan ini berhasil ditutup. Saldo dompet tetap dibawa ke periode berikutnya.",
      );
    } else {
      alert(
        "Belum ada transaksi untuk diarsipkan, atau bulan ini sudah ditutup.",
      );
    }
  };

  return (
    <div className="page-stack">
      {/* HERO SECTION */}
      <section className="hero-card">
        <div className="hero-copy">
          <span className="hero-kicker">
            OVERVIEW · {monthLabel(finance.activeMonth)}
          </span>

          <h1>
            Atur uangmu,
            <br />
            <em>atur ceritamu.</em>
          </h1>

          <p>
            Kenali ke mana uangmu pergi dan buat setiap keputusan jadi lebih
            berarti.
          </p>
        </div>

        <div className="hero-art">
          <div className="art-circle circle-one" />
          <div className="art-circle circle-two" />

          <div className="art-wallet">
            <Wallet size={34} />

            <span>
              YOUR MONEY
              <br />
              YOUR PLAN
            </span>
          </div>

          <span className="art-spark">✳</span>
        </div>

        <div className="hero-balance">
          <span>Total saldo seluruh dompet</span>

          <strong>{money(totalBalance)}</strong>

          <small>
            <span className="live-dot" />
            Saldo gabungan saat ini
          </small>
        </div>
      </section>

      {/* WALLET SECTION */}
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR WALLETS</span>
          <h2>Ruang penyimpanan uang</h2>
        </div>

        <div className="button-row">
          <button
            className="btn btn-light"
            onClick={() => setModal("transfer")}
          >
            <ArrowLeftRight size={16} />
            Transfer
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setModal("wallet")}
          >
            <Plus size={16} />
            Tambah dompet
          </button>
        </div>
      </div>

      <div className="wallet-grid">
        {finance.wallets.map((wallet) => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            onDelete={(id) => {
              const result = finance.deleteWallet(id);

              if (!result.ok) {
                alert(result.message);
              }
            }}
          />
        ))}
      </div>

      {/* SUMMARY SECTION */}
      <section className="summary-grid">
        <article className="summary-card">
          <div className="summary-icon green">
            <TrendingUp />
          </div>

          <span>Total pemasukan</span>

          <strong>{money(income)}</strong>

          <small>Bulan {monthLabel(finance.activeMonth)}</small>
        </article>

        <article className="summary-card">
          <div className="summary-icon red">
            <TrendingDown />
          </div>

          <span>Total pengeluaran</span>

          <strong>{money(expense)}</strong>

          <small>Bulan {monthLabel(finance.activeMonth)}</small>
        </article>

        {/* <article className="summary-card">
          <div className="summary-icon purple">
            <PiggyBank />
          </div>

          <span>Arus kas bersih</span>

          <strong className={income - expense >= 0 ? "text-green" : "text-red"}>
            {money(income - expense)}
          </strong>

          <small>
            {income - expense >= 0
              ? "Kamu masih surplus"
              : "Pengeluaran lebih besar"}
          </small>
        </article> */}
      </section>

      {/* BUDGET DAN GRAFIK */}
      <div className="dashboard-columns">
        <section className="panel budget-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">SPENDING CONTROL</span>

              <h3>Budget bulan ini</h3>
            </div>

            <span className="budget-symbol">◎</span>
          </div>

          <div className="budget-numbers">
            <strong>{money(expense)}</strong>

            <span>dari {money(totalBudget)}</span>
          </div>

          <ProgressBar
            value={expense}
            max={totalBudget}
            label="Penggunaan budget"
          />

          <p
            className={`budget-message ${
              percent > 80
                ? "danger-text"
                : percent > 50
                  ? "warning-text"
                  : "safe-text"
            }`}
          >
            {percent > 80
              ? "⚠ Hati-hati, budget kamu hampir habis."
              : percent > 50
                ? "Kamu sudah menggunakan lebih dari setengah budget."
                : "Bagus! Pengeluaranmu masih dalam batas aman."}
          </p>

          <div className="mini-divider" />

          <button className="btn btn-outline full-btn" onClick={close}>
            <BookOpen size={16} />
            Tutup buku / Ganti bulan
          </button>
        </section>

        {/* GRAFIK KATEGORI */}
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">WHERE IT GOES</span>

              <h3>Pengeluaran per kategori</h3>
            </div>

            <span className="chart-period">Bulan ini</span>
          </div>

          {categoryData.length ? (
            <div className="category-chart">
              {categoryData.map((category, index) => (
                <div className="category-line" key={category.name}>
                  <div className="category-meta">
                    <span>{category.name}</span>

                    <b>{money(category.value)}</b>
                  </div>

                  <div className="chart-track">
                    <div
                      className={`chart-fill chart-${index % 5}`}
                      style={{
                        width: `${
                          expense ? (category.value / expense) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>

                  <small>
                    {expense ? Math.round((category.value / expense) * 100) : 0}
                    % dari pengeluaran
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state chart-empty">
              Belum ada pengeluaran bulan ini.
            </div>
          )}
        </section>
      </div>

      {/* FORM TRANSAKSI */}
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">ADD RECORD</span>
          <h2>Catat transaksi baru</h2>
        </div>
      </div>

      <section className="panel">
        <TransactionForm
          wallets={finance.wallets}
          onSubmit={finance.addTransaction}
        />
      </section>

      {/* RIWAYAT TRANSAKSI */}
      <TransactionList
        transactions={finance.monthTransactions}
        wallets={finance.wallets}
      />

      {/* MODAL */}
      {modal === "wallet" && (
        <WalletModal onClose={() => setModal("")} onSave={finance.addWallet} />
      )}

      {modal === "transfer" && (
        <TransferModal
          wallets={finance.wallets}
          onClose={() => setModal("")}
          onTransfer={finance.transfer}
        />
      )}
    </div>
  );
}
