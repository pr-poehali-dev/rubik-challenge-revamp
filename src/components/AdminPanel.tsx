import { useState, useEffect } from "react";
import { adminGetAll, adminConfirmDeposit, adminRejectDeposit, adminAdjustBalance, adminClaimSpin } from "@/api";
import Icon from "@/components/ui/icon";

type DepositRow = { id: number; username: string; amount: number; status: string; comment: string | null; created_at: string };
type UserRow    = { id: number; username: string; email: string; balance: number; is_admin: boolean; created_at: string };
type SpinRow    = { id: number; username: string; case: string; prize: string; emoji: string; rarity: string; is_claimed: boolean; created_at: string };

const RARITY_COLOR: Record<string, string> = {
  common: "#9CA3AF", rare: "#3B82F6", epic: "#A855F7", legendary: "#F59E0B",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "#F59E0B", confirmed: "#22C55E", rejected: "#DC2626",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Ожидает", confirmed: "Подтверждён", rejected: "Отклонён",
};

export default function AdminPanel() {
  const [tab, setTab] = useState<"deposits" | "users" | "spins">("deposits");
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [users, setUsers]       = useState<UserRow[]>([]);
  const [spins, setSpins]       = useState<SpinRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState("");

  // adjust balance
  const [adjustTarget, setAdjustTarget] = useState<UserRow | null>(null);
  const [adjustDelta, setAdjustDelta]   = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const d = await adminGetAll();
      setDeposits(d.deposits || []);
      setUsers(d.users || []);
      setSpins(d.spins || []);
    } catch (e) {
      setMsg("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (text: string) => { setMsg(text); setTimeout(() => setMsg(""), 3000); };

  const confirmDeposit = async (id: number) => {
    await adminConfirmDeposit(id);
    flash("Депозит подтверждён ✓");
    load();
  };
  const rejectDeposit = async (id: number) => {
    const reason = prompt("Причина отклонения:") || "";
    await adminRejectDeposit(id, reason);
    flash("Депозит отклонён");
    load();
  };
  const doAdjust = async () => {
    if (!adjustTarget || !adjustDelta) return;
    await adminAdjustBalance(adjustTarget.id, parseFloat(adjustDelta), adjustReason);
    flash(`Баланс ${adjustTarget.username} изменён на ${adjustDelta}`);
    setAdjustTarget(null);
    setAdjustDelta("");
    setAdjustReason("");
    load();
  };
  const claimSpin = async (id: number) => {
    await adminClaimSpin(id);
    flash("Отмечено как выдано ✓");
    load();
  };

  const tabs = [
    { id: "deposits", label: "Депозиты", count: deposits.filter(d => d.status === "pending").length },
    { id: "users",    label: "Игроки",   count: users.length },
    { id: "spins",    label: "Спины",    count: spins.filter(s => !s.is_claimed).length },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚙️</span>
        <h2 className="font-oswald text-2xl uppercase tracking-widest">АДМИН-ПАНЕЛЬ</h2>
      </div>

      {msg && (
        <div className="p-3 rounded text-sm" style={{ backgroundColor: "#052010", color: "#22C55E", border: "1px solid #22C55E33" }}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: "1px solid #222" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 font-oswald text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            style={{
              color: tab === t.id ? "#F97316" : "#555",
              borderBottom: tab === t.id ? "2px solid #F97316" : "2px solid transparent",
            }}>
            {t.label}
            {t.count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono"
                style={{ backgroundColor: "#F97316", color: "#000" }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-sm" style={{ color: "#555" }}>Загрузка...</p>}

      {/* Deposits */}
      {!loading && tab === "deposits" && (
        <div className="space-y-3">
          {deposits.length === 0 && <p className="text-sm" style={{ color: "#555" }}>Депозитов нет</p>}
          {deposits.map(d => (
            <div key={d.id} className="p-4 rounded" style={{ backgroundColor: "#111", border: "1px solid #222" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-oswald text-sm uppercase">{d.username}</p>
                  <p className="font-mono text-lg mt-1" style={{ color: "#F97316" }}>{d.amount} ₽</p>
                  <p className="text-xs mt-1" style={{ color: "#555" }}>
                    {new Date(d.created_at).toLocaleString("ru")}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded flex-shrink-0"
                  style={{ color: STATUS_COLOR[d.status], backgroundColor: `${STATUS_COLOR[d.status]}18`, border: `1px solid ${STATUS_COLOR[d.status]}44` }}>
                  {STATUS_LABEL[d.status] || d.status}
                </span>
              </div>
              {d.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => confirmDeposit(d.id)}
                    className="flex-1 py-2 rounded font-oswald uppercase tracking-widest text-xs transition-all"
                    style={{ backgroundColor: "#22C55E", color: "#000" }}>
                    ✓ Подтвердить
                  </button>
                  <button onClick={() => rejectDeposit(d.id)}
                    className="flex-1 py-2 rounded font-oswald uppercase tracking-widest text-xs transition-all"
                    style={{ backgroundColor: "#1a1a1a", color: "#DC2626", border: "1px solid #DC262644" }}>
                    ✕ Отклонить
                  </button>
                </div>
              )}
              {d.comment && (
                <p className="text-xs mt-2" style={{ color: "#DC2626" }}>Причина: {d.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {!loading && tab === "users" && (
        <div className="space-y-3">
          {/* Adjust balance modal */}
          {adjustTarget && (
            <div className="p-4 rounded" style={{ backgroundColor: "#141414", border: "1px solid #F97316" }}>
              <p className="font-oswald text-sm uppercase tracking-widest mb-3">
                Изменить баланс: {adjustTarget.username}
              </p>
              <p className="text-sm mb-2" style={{ color: "#888" }}>
                Текущий баланс: <span style={{ color: "#F97316" }}>{adjustTarget.balance}</span>
              </p>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Сумма (+ добавить, - снять)"
                  value={adjustDelta}
                  onChange={e => setAdjustDelta(e.target.value)}
                  className="w-full px-3 py-2 rounded text-sm outline-none font-mono"
                  style={{ backgroundColor: "#1a1a1a", border: "1px solid #333", color: "#e8ddd0" }}
                />
                <input
                  placeholder="Причина (необязательно)"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded text-sm outline-none"
                  style={{ backgroundColor: "#1a1a1a", border: "1px solid #333", color: "#e8ddd0" }}
                />
                <div className="flex gap-2">
                  <button onClick={doAdjust}
                    className="flex-1 py-2 rounded font-oswald uppercase tracking-widest text-xs"
                    style={{ backgroundColor: "#F97316", color: "#000" }}>
                    Применить
                  </button>
                  <button onClick={() => setAdjustTarget(null)}
                    className="flex-1 py-2 rounded font-oswald uppercase tracking-widest text-xs"
                    style={{ backgroundColor: "#1a1a1a", color: "#888" }}>
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}

          {users.map(u => (
            <div key={u.id} className="p-3 rounded flex items-center gap-3"
              style={{ backgroundColor: "#111", border: "1px solid #222" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ backgroundColor: u.is_admin ? "#F97316" : "#1a1a1a", color: u.is_admin ? "#000" : "#888" }}>
                {u.is_admin ? "A" : u.username[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-oswald text-sm uppercase truncate">{u.username}</p>
                <p className="text-xs truncate" style={{ color: "#555" }}>{u.email}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-mono text-sm" style={{ color: "#F97316" }}>{u.balance}</p>
                <p className="text-xs" style={{ color: "#555" }}>монет</p>
              </div>
              {!u.is_admin && (
                <button onClick={() => setAdjustTarget(u)}
                  className="p-2 rounded transition-all flex-shrink-0"
                  style={{ backgroundColor: "#1a1a1a", color: "#888", border: "1px solid #333" }}>
                  <Icon name="Edit" size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Spins */}
      {!loading && tab === "spins" && (
        <div className="space-y-3">
          {spins.length === 0 && <p className="text-sm" style={{ color: "#555" }}>Спинов нет</p>}
          {spins.map(s => (
            <div key={s.id} className="p-3 rounded flex items-center gap-3"
              style={{ backgroundColor: "#111", border: `1px solid ${RARITY_COLOR[s.rarity]}33` }}>
              <span className="text-2xl flex-shrink-0">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-oswald uppercase">{s.username}</p>
                <p className="text-xs truncate" style={{ color: RARITY_COLOR[s.rarity] }}>{s.prize}</p>
                <p className="text-xs" style={{ color: "#555" }}>{s.case}</p>
              </div>
              <div className="flex-shrink-0">
                {s.is_claimed ? (
                  <span className="text-xs px-2 py-1 rounded" style={{ color: "#22C55E", backgroundColor: "#05201033" }}>Выдан</span>
                ) : (
                  <button onClick={() => claimSpin(s.id)}
                    className="px-3 py-1 rounded font-oswald uppercase tracking-widest text-xs transition-all"
                    style={{ backgroundColor: "#F97316", color: "#000" }}>
                    Выдать
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={load}
        className="flex items-center gap-2 text-xs font-oswald uppercase tracking-widest transition-all"
        style={{ color: "#555" }}>
        <Icon name="RefreshCw" size={12} />
        Обновить
      </button>
    </div>
  );
}
