import { useState } from "react";
import {
  Plus,
  Target,
  Trash2,
  PiggyBank,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { money } from "../utils/finance";
import { expenseCategories } from "../data/initialData";
import ProgressBar from "../components/ProgressBar";

export default function Goals() {
  const f = useFinance();

  const [goal, setGoal] = useState({
    name: "",
    target: "",
    walletId: f.wallets[0]?.id || "",
    deadline: "",
  });

  const [contributions, setContributions] = useState({});
  const [total, setTotal] = useState(f.budgets.total);
  const [category, setCategory] = useState(expenseCategories[0]);
  const [limit, setLimit] = useState(
    f.budgets.categories[expenseCategories[0]] || "",
  );
  const [notice, setNotice] = useState("");

  function createGoal(e) {
    e.preventDefault();
    if (!goal.name.trim() || Number(goal.target) <= 0) return;

    f.addGoal(goal);
    setGoal({
      ...goal,
      name: "",
      target: "",
    });
  }

  function saveBudget(e) {
    e.preventDefault();
    f.setBudget(total, null, 0);
    f.setBudget(null, category, limit);
    setNotice("Pengaturan budget berhasil disimpan.");
  }

  function addFunds(id) {
    const success = f.contributeGoal(id, contributions[id]);

    setNotice(
      success
        ? "Dana berhasil dialokasikan ke target."
        : "Gagal. Pastikan saldo dompet cukup dan nominal tidak melebihi sisa target.",
    );

    if (success) {
      setContributions((prev) => ({
        ...prev,
        [id]: "",
      }));
    }
  }

  return (
    <div className="page-stack">
      <div className="page-intro">
        <span className="eyebrow">PLAN WITH PURPOSE</span>
        <h1>
          Budget & <em>goals.</em>
        </h1>
        <p>
          Buat batas pengeluaran dan wujudkan hal yang sedang kamu usahakan.
        </p>
      </div>

      {/* ATUR BUDGET */}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">ANTI-BONCOS SETUP</span>
            <h3>Atur batas pengeluaran</h3>
          </div>
          <ShieldCheck className="heading-icon" />
        </div>

        <form className="budget-settings" onSubmit={saveBudget}>
          <label className="field">
            <span>Budget maksimal bulanan (Rp)</span>
            <input
              type="number"
              min="0"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
            />
          </label>

          <div className="budget-category-edit">
            <label className="field">
              <span>Kategori</span>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setLimit(f.budgets.categories[e.target.value] || "");
                }}
              >
                {expenseCategories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Limit kategori (Rp)</span>
              <input
                type="number"
                min="0"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            </label>
          </div>

          <button className="btn btn-primary">
            <ShieldCheck size={16} />
            Simpan budget
          </button>
        </form>

        {notice && <p className="success-note">{notice}</p>}

        <div className="mini-divider" />

        <h4 className="subsection-title">Limit kategori saat ini</h4>

        <div className="limits-list">
          {Object.entries(f.budgets.categories).map(([name, value]) => {
            const spent = f.monthTransactions
              .filter((t) => t.type === "expense" && t.category === name)
              .reduce((s, t) => s + t.amount, 0);

            return (
              <div className="limit-row" key={name}>
                <div className="category-meta">
                  <b>{name}</b>
                  <span>
                    {money(spent)} / {money(value)}
                  </span>
                </div>
                <ProgressBar value={spent} max={value} />
              </div>
            );
          })}
        </div>
      </section>

      {/* TARGET TABUNGAN */}
      <div className="section-heading">
        <div>
          <span className="eyebrow">DREAMS IN PROGRESS</span>
          <h2>Target tabungan</h2>
        </div>
        <span className="count-pill">{f.goals.length} target</span>
      </div>

      <div className="goals-grid">
        {f.goals.map((g) => {
          const isReached = Number(g.saved) >= Number(g.target);

          return (
            <article className="goal-card" key={g.id}>
              <div className="goal-top">
                <div className="goal-icon">
                  <Target />
                </div>

                <button
                  className="icon-button subtle"
                  onClick={() => f.removeGoal(g.id)}
                  title={
                    g.completed
                      ? "Hapus arsip target (dana sudah terpakai)"
                      : "Hapus target & kembalikan dana ke dompet"
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <h3>{g.name}</h3>

              <p className="muted small">
                Target {money(g.target)} {g.deadline && `· ${g.deadline}`}
              </p>

              <div className="goal-progress">
                <strong>{money(g.saved)}</strong>
                <span>{Math.round((g.saved / g.target) * 100)}%</span>
              </div>

              <ProgressBar value={g.saved} max={g.target} />

              <small className="muted">
                {g.completed
                  ? "Target telah selesai & dana sudah digunakan."
                  : isReached
                    ? "Dana sudah terkumpul penuh! Klik Complete untuk menyelesaikan."
                    : `Kurang ${money(Math.max(0, g.target - g.saved))} lagi`}
              </small>

              <div className="contribute-box">
                {g.completed ? (
                  <button
                    type="button"
                    className="btn btn-light full-btn"
                    disabled
                  >
                    <CheckCircle2 size={16} />
                    Completed (Tercapai)
                  </button>
                ) : isReached ? (
                  <button
                    type="button"
                    className="btn btn-primary full-btn"
                    onClick={() => {
                      f.completeGoal(g.id);
                      setNotice(
                        `Selamat! Target "${g.name}" selesai & otomatis dicatat sebagai pengeluaran bulan ini.`,
                      );
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Complete Target
                  </button>
                ) : (
                  <>
                    <label className="field">
                      <span>
                        Alokasikan dari{" "}
                        {f.wallets.find(
                          (w) => String(w.id) === String(g.walletId),
                        )?.name || "dompet"}
                      </span>

                      <input
                        type="number"
                        min="1"
                        placeholder="Nominal (Rp)"
                        value={contributions[g.id] || ""}
                        onChange={(e) =>
                          setContributions((prev) => ({
                            ...prev,
                            [g.id]: e.target.value,
                          }))
                        }
                      />
                    </label>

                    <button
                      className="btn btn-dark full-btn"
                      onClick={() => addFunds(g.id)}
                    >
                      <PiggyBank size={16} />
                      Tambah tabungan
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* TARGET BARU */}
      <section className="panel add-goal-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">NEW WISHLIST</span>
            <h3>Buat target baru</h3>
          </div>
          <Plus className="heading-icon" />
        </div>

        <form className="goal-form" onSubmit={createGoal}>
          <label className="field">
            <span>Nama target</span>
            <input
              value={goal.name}
              onChange={(e) =>
                setGoal({
                  ...goal,
                  name: e.target.value,
                })
              }
              placeholder="Contoh: Beli laptop"
              required
            />
          </label>

          <label className="field">
            <span>Nominal target (Rp)</span>
            <input
              type="number"
              min="1"
              value={goal.target}
              onChange={(e) =>
                setGoal({
                  ...goal,
                  target: e.target.value,
                })
              }
              placeholder="8000000"
              required
            />
          </label>

          <label className="field">
            <span>Dompet sumber dana</span>
            <select
              value={goal.walletId}
              onChange={(e) =>
                setGoal({
                  ...goal,
                  walletId: e.target.value,
                })
              }
            >
              {f.wallets.map((w) => (
                <option value={w.id} key={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Target tanggal (opsional)</span>
            <input
              type="date"
              value={goal.deadline}
              onChange={(e) =>
                setGoal({
                  ...goal,
                  deadline: e.target.value,
                })
              }
            />
          </label>

          <button className="btn btn-primary">
            <Plus size={16} />
            Buat target
          </button>
        </form>
      </section>
    </div>
  );
}
