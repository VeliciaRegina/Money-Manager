import { Trash2, ArrowUpRight } from "lucide-react";

import { getWalletIcon, money } from "../utils/finance";

export default function WalletCard({ wallet, onDelete }) {
  return (
    <article className="wallet-card">
      <div className="wallet-top">
        <span className="wallet-emoji">{getWalletIcon(wallet.type)}</span>

        <button
          className="icon-button subtle"
          title="Hapus dompet"
          onClick={() => onDelete(wallet.id)}
        >
          <Trash2 size={15} />
        </button>
      </div>

      <span className="muted small">{wallet.name}</span>

      <strong className="wallet-balance">{money(wallet.balance)}</strong>

      <span className="wallet-foot">
        Saldo tersedia
        <ArrowUpRight size={13} />
      </span>
    </article>
  );
}
