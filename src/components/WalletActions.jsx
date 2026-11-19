import { useState } from "react";

import { Plus, ArrowLeftRight, X } from "lucide-react";

import { walletTypes } from "../data/initialData";

// MODAL TAMBAH DOMPET
export function WalletModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    type: "wallet",
    balance: 0,
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
          onClose();
        }}
      >
        <div className="modal-head">
          <h3>Tambah dompet</h3>

          <button type="button" className="icon-button" onClick={onClose}>
            <X />
          </button>
        </div>

        <label className="field">
          <span>Nama dompet</span>

          <input
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            placeholder="Contoh: GoPay"
            required
          />
        </label>

        <label className="field">
          <span>Tipe / ikon</span>

          <select
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type: e.target.value,
              })
            }
          >
            {walletTypes.map((t) => (
              <option value={t.value} key={t.value}>
                {t.label} {t.icon}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Saldo awal (Rp)</span>

          <input
            type="number"
            min="0"
            value={form.balance}
            onChange={(e) =>
              setForm({
                ...form,
                balance: e.target.value,
              })
            }
          />
        </label>

        <button className="btn btn-primary full-btn">
          <Plus size={16} />
          Buat dompet
        </button>
      </form>
    </div>
  );
}

// MODAL TRANSFER ANTAR DOMPET
export function TransferModal({ wallets, onClose, onTransfer }) {
  const [from, setFrom] = useState(wallets[0]?.id || "");

  const [to, setTo] = useState(wallets[1]?.id || wallets[0]?.id || "");

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("Pindah saldo");
  const [error, setError] = useState("");

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();

          const success = onTransfer(from, to, amount, note);

          if (success) {
            onClose();
          } else {
            setError("Periksa dompet, nominal, dan saldo yang tersedia.");
          }
        }}
      >
        <div className="modal-head">
          <h3>Transfer antar dompet</h3>

          <button type="button" className="icon-button" onClick={onClose}>
            <X />
          </button>
        </div>

        <p className="muted small">
          Transfer hanya memindahkan saldo, bukan pengeluaran bulanan.
        </p>

        <label className="field">
          <span>Dari dompet</span>

          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} — Rp {w.balance.toLocaleString("id-ID")}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Ke dompet</span>

          <select value={to} onChange={(e) => setTo(e.target.value)}>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Nominal (Rp)</span>

          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Catatan</span>

          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button className="btn btn-primary full-btn">
          <ArrowLeftRight size={16} />
          Transfer sekarang
        </button>
      </form>
    </div>
  );
}
