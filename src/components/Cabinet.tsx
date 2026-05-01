import { useState, useEffect } from "react";
import { getBalance, createDeposit, getDeposits, getSpins, logout } from "@/api";
import type { User } from "@/api";
import Icon from "@/components/ui/icon";

type Props = {
  user: User;
  onLogout: () => void;
  onBalanceUpdate: (b: number) => void;
};

type Deposit = {
  id: number; amount: number; status: string; comment: string | null; created_at: string;
};
type SpinRecord = {
  id: number; case: string; prize: string; emoji: string; rarity: string;
  cost: number; seed_hash: string; client_seed: string; is_claimed: boolean; created_at: string;
};

const RARITY_COLOR: Record<string, string> = {
  common: "#9CA3AF", rare: "#3B82F6", epic: "#A855F7", legendary: "#F59E0B",
};
const RARITY_LABEL: Record<string, string> = {
  common: "Обычный", rare: "Редкий", epic: "Эпический", legendary: "Легендарный",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "#F59E0B", confirmed: "#22C55E", rejected: "#DC2626",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Ожидает", confirmed: "Подтверждён", rejected: "Отклонён",
};

export default function Cabinet({ user, onLogout, onBalanceUpdate }: Props) {
  const [tab, setTab] = useState<"overview" | "deposit" | "history">("overview");
  const [balance, setBalance] = useState(user.balance);
  const [sberCard, setSberCard] = useState("2202 2067 7023 7480");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositResult, setDepositResult] = useState<{ deposit_id: number; amount: number; message: string } | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [spins, setSpins] = useState<SpinRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getBalance().then(d => {
      setBalance(d.balance);
      setSberCard(d.sber_card);
      onBalanceUpdate(d.balance);
    });
  }, []);

  useEffect(() => {
    if (tab === "history") {
      getDeposits().then(d => setDeposits(d.deposits));
      getSpins().then(d => setSpins(d.spins));
    }
  }, [tab]);

  const submitDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt < 1) { setError("Минимум 1 рубль"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await createDeposit(amt);
      setDepositResult(res);
      setDepositAmount("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const tabs = [
    { id: "overview", label: "Обзор" },
    { id: "deposit",  label: "Пополнение" },
    { id: "history",  label: "История" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-oswald text-2xl uppercase tracking-widest">{user.username}</h2>
          <p className="text-xs mt-1" style={{ color: "#888" }}>{user.email}</p>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded text-xs font-oswald uppercase tracking-widest"
          style={{ backgroundColor: "#1a1a1a", color: "#888", border: "1px solid #333" }}>
          <Icon name="LogOut" size={14} />
          Выйти
        </button>
      </div>

      {/* Balance card */}
      <div className="p-5 rounded" style={{ backgroundColor: "#141414", border: "1px solid #F97316" }}>
        <p className="text-xs font-oswald uppercase tracking-widest mb-1" style={{ color: "#888" }}>БАЛАНС</p>
        <p className="font-oswald text-4xl" style={{ color: "#F97316" }}>{balance.toFixed(0)}</p>
        <p className="text-xs mt-1" style={{ color: "#555" }}>монет</p>
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: "1px solid #222" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2 font-oswald text-xs uppercase tracking-widest transition-all"
            style={{
              color: tab === t.id ? "#F97316" : "#555",
              borderBottom: tab === t.id ? "2px solid #F97316" : "2px solid transparent",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-3">
          <div className="p-4 rounded" style={{ backgroundColor: "#111", border: "1px solid #222" }}>
            <p className="text-xs font-oswald uppercase tracking-widest mb-3" style={{ color: "#888" }}>РЕКВИЗИТЫ</p>
            <div className="flex items-center gap-3 p-3 rounded" style={{ backgroundColor: "#1a1a1a" }}>
              <span className="text-2xl">💳</span>
              <div>
                <p className="text-xs" style={{ color: "#666" }}>Сбербанк</p>
                <p className="font-mono tracking-widest">{sberCard}</p>
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: "#666" }}>
              После оплаты пришлите скриншот администратору в Telegram
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setTab("deposit")}
              className="p-4 rounded text-left transition-all"
              style={{ backgroundColor: "#111", border: "1px solid #222" }}>
              <Icon name="Plus" size={20} style={{ color: "#F97316" }} />
              <p className="font-oswald text-sm uppercase tracking-widest mt-2">Пополнить</p>
            </button>
            <button onClick={() => setTab("history")}
              className="p-4 rounded text-left transition-all"
              style={{ backgroundColor: "#111", border: "1px solid #222" }}>
              <Icon name="Clock" size={20} style={{ color: "#888" }} />
              <p className="font-oswald text-sm uppercase tracking-widest mt-2">История</p>
            </button>
          </div>
        </div>
      )}

      {/* Deposit */}
      {tab === "deposit" && (
        <div className="space-y-4">
          <div className="p-4 rounded" style={{ backgroundColor: "#111", border: "1px solid #222" }}>
            <p className="text-xs font-oswald uppercase tracking-widest mb-3" style={{ color: "#888" }}>
              КАК ПОПОЛНИТЬ
            </p>
            {[
              `Переведите нужную сумму на карту Сбербанка: ${sberCard}`,
              "Введите сумму ниже и нажмите «Создать заявку»",
              "Отправьте скриншот перевода администратору @Torgreal7",
              "После подтверждения монеты зачислятся на баланс",
            ].map((s, i) => (
              <div key={i} className="flex gap-3 mb-2">
                <span className="font-mono text-xs font-bold flex-shrink-0" style={{ color: "#F97316" }}>
                  0{i + 1}
                </span>
                <span className="text-sm" style={{ color: "#888" }}>{s}</span>
              </div>
            ))}
          </div>

          {depositResult ? (
            <div className="p-4 rounded" style={{ backgroundColor: "#052010", border: "1px solid #22C55E" }}>
              <p className="font-oswald text-lg" style={{ color: "#22C55E" }}>Заявка создана!</p>
              <p className="text-sm mt-2" style={{ color: "#888" }}>{depositResult.message}</p>
              <button onClick={() => setDepositResult(null)}
                className="mt-4 px-4 py-2 rounded font-oswald uppercase tracking-widest text-xs"
                style={{ backgroundColor: "#1a1a1a", color: "#888" }}>
                Создать ещё
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                {[100, 200, 500, 1000].map(amt => (
                  <button key={amt} onClick={() => setDepositAmount(String(amt))}
                    className="flex-1 py-2 rounded text-sm font-mono transition-all"
                    style={{
                      backgroundColor: depositAmount === String(amt) ? "#F97316" : "#1a1a1a",
                      color: depositAmount === String(amt) ? "#000" : "#888",
                      border: `1px solid ${depositAmount === String(amt) ? "#F97316" : "#333"}`,
                    }}>
                    {amt}₽
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Своя сумма (руб.)"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                className="w-full px-3 py-2.5 rounded text-sm outline-none font-mono"
                style={{ backgroundColor: "#1a1a1a", border: "1px solid #333", color: "#e8ddd0" }}
              />
              {error && (
                <div className="p-3 rounded text-xs" style={{ backgroundColor: "#3a0a0a", color: "#ff6b6b" }}>{error}</div>
              )}
              <button
                onClick={submitDeposit}
                disabled={loading}
                className="w-full py-3 rounded font-oswald uppercase tracking-widest text-sm"
                style={{
                  backgroundColor: loading ? "#555" : "#F97316",
                  color: loading ? "#999" : "#000",
                  cursor: loading ? "not-allowed" : "pointer",
                }}>
                {loading ? "..." : "СОЗДАТЬ ЗАЯВКУ"}
              </button>
            </>
          )}
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="space-y-4">
          {deposits.length > 0 && (
            <div>
              <p className="font-oswald text-xs uppercase tracking-widest mb-2" style={{ color: "#888" }}>ДЕПОЗИТЫ</p>
              <div className="space-y-2">
                {deposits.map(d => (
                  <div key={d.id} className="flex items-center justify-between px-3 py-2 rounded"
                    style={{ backgroundColor: "#111", border: "1px solid #222" }}>
                    <span className="font-mono text-sm">{d.amount} ₽</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ color: STATUS_COLOR[d.status], backgroundColor: `${STATUS_COLOR[d.status]}18` }}>
                      {STATUS_LABEL[d.status] || d.status}
                    </span>
                    <span className="text-xs" style={{ color: "#555" }}>{new Date(d.created_at).toLocaleDateString("ru")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {spins.length > 0 && (
            <div>
              <p className="font-oswald text-xs uppercase tracking-widest mb-2" style={{ color: "#888" }}>ОТКРЫТЫЕ КЕЙСЫ</p>
              <div className="space-y-2">
                {spins.map(s => (
                  <div key={s.id} className="flex items-center gap-3 px-3 py-2 rounded"
                    style={{ backgroundColor: "#111", border: `1px solid ${RARITY_COLOR[s.rarity]}33` }}>
                    <span className="text-xl">{s.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{s.prize}</p>
                      <p className="text-xs" style={{ color: RARITY_COLOR[s.rarity] }}>{RARITY_LABEL[s.rarity]}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono text-xs" style={{ color: "#F97316" }}>-{s.cost}</p>
                      {s.is_claimed && <p className="text-xs" style={{ color: "#22C55E" }}>Выдан</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {deposits.length === 0 && spins.length === 0 && (
            <p className="text-center text-sm" style={{ color: "#555" }}>История пуста</p>
          )}
        </div>
      )}
    </div>
  );
}
