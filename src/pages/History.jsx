import { useState } from "react";

import {
  Archive,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { useFinance } from "../context/FinanceContext";

import { money, monthLabel } from "../utils/finance";

export default function History() {
  const { history, wallets } = useFinance();

  const [expanded, setExpanded] = useState(history[0]?.month || "");

  return (
    <div className="page-stack">
      <div className="page-intro">
        <span className="eyebrow">YOUR FINANCIAL JOURNAL</span>

        <h1>
          History <em>bulanan.</em>
        </h1>

        <p>
          Setiap bulan punya cerita. Lihat kembali bagaimana kamu mengelola
          uang.
        </p>
      </div>

      {!history.length ? (
        <section className="panel empty-history">
          <div className="empty-illustration">
            <Archive size={32} />
          </div>

          <h3>Belum ada arsip bulanan</h3>

          <p>
            Gunakan tombol “Tutup Buku / Ganti Bulan” di Dashboard untuk
            menyimpan rapor bulan aktif.
          </p>
        </section>
      ) : (
        <div className="history-list">
          {history.map((h) => (
            <section className="panel history-card" key={h.month}>
              <button
                className="history-toggle"
                onClick={() => setExpanded(expanded === h.month ? "" : h.month)}
              >
                <div>
                  <span className="eyebrow">MONTHLY REPORT</span>

                  <h3>{monthLabel(h.month)}</h3>

                  <span
                    className={`status-pill ${
                      h.net >= 0 ? "surplus" : "deficit"
                    }`}
                  >
                    {h.net >= 0 ? "● Surplus / Hemat" : "● Defisit / Boros"}
                  </span>
                </div>

                <div className="history-net">
                  <small>Arus kas bersih</small>

                  <b className={h.net >= 0 ? "text-green" : "text-red"}>
                    {money(h.net)}
                  </b>
                </div>

                {expanded === h.month ? <ChevronUp /> : <ChevronDown />}
              </button>

              <div className="history-stats">
                <div>
                  <small>
                    <TrendingUp size={14} />
                    Pemasukan
                  </small>

                  <b>{money(h.income)}</b>
                </div>

                <div>
                  <small>
                    <TrendingDown size={14} />
                    Pengeluaran
                  </small>

                  <b>{money(h.expense)}</b>
                </div>

                <div>
                  <small>◎ Kategori terbesar</small>

                  <b>{h.topCategory?.name || "—"}</b>
                </div>
              </div>

              {expanded === h.month && (
                <div className="history-detail">
                  <h4>Rincian transaksi ({h.transactions.length})</h4>

                  {h.transactions.map((t) => (
                    <div className="history-transaction" key={t.id}>
                      <div>
                        <b>{t.title}</b>

                        <small>
                          {t.category} ·{" "}
                          {wallets.find((w) => w.id === t.walletId)?.name ||
                            "Dompet"}{" "}
                          · {t.date}
                        </small>
                      </div>

                      <b
                        className={
                          t.type === "income"
                            ? "text-green"
                            : t.type === "expense"
                              ? "text-red"
                              : ""
                        }
                      >
                        {t.type === "income"
                          ? "+"
                          : t.type === "expense"
                            ? "−"
                            : "↔"}{" "}
                        {money(t.amount)}
                      </b>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
