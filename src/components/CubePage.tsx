import { useState, useEffect } from "react";
import { cubeRoll, cubeHistory } from "@/api";
import type { User } from "@/api";

type GameResult = {
  game_id: number; player_roll: number; server_roll: number;
  result: "win" | "lose" | "tie"; bet: number; payout: number; new_balance: number;
};
type HistoryItem = {
  id: number; bet: number; player_roll: number; server_roll: number;
  result: "win" | "lose" | "tie"; payout: number; created_at: string;
};

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const RESULT_CONFIG = {
  win:  { label: "ПОБЕДА!",   color: "#22C55E", bg: "#052010", border: "#22C55E" },
  lose: { label: "ПРОИГРЫШ",  color: "#DC2626", bg: "#1A0505", border: "#DC2626" },
  tie:  { label: "НИЧЬЯ",     color: "#F59E0B", bg: "#1A1200", border: "#F59E0B" },
};
const BET_PRESETS = [10, 25, 50, 100, 200, 500];

type Props = {
  user: User | null;
  onAuthRequired: () => void;
  onBalanceUpdate: (b: number) => void;
};

export default function CubePage({ user, onAuthRequired, onBalanceUpdate }: Props) {
  const [bet, setBet] = useState(50);
  const [customBet, setCustomBet] = useState("");
  const [rolling, setRolling] = useState(false);
  const [playerDie, setPlayerDie] = useState(1);
  const [serverDie, setServerDie] = useState(1);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user && showHistory) {
      cubeHistory().then(d => setHistory(d.games || [])).catch(() => {});
    }
  }, [user, showHistory]);

  const handleRoll = async () => {
    if (!user) { onAuthRequired(); return; }
    const finalBet = customBet ? parseFloat(customBet) : bet;
    if (!finalBet || finalBet <= 0 || finalBet > user.balance) {
      setError("Некорректная ставка или недостаточно средств");
      return;
    }
    setError("");
    setRolling(true);
    setLastResult(null);

    const animInterval = setInterval(() => {
      setPlayerDie(Math.floor(Math.random() * 6) + 1);
      setServerDie(Math.floor(Math.random() * 6) + 1);
    }, 60);

    try {
      const result = await cubeRoll(finalBet);
      clearInterval(animInterval);
      setPlayerDie(result.player_roll);
      setServerDie(result.server_roll);
      setLastResult(result);
      onBalanceUpdate(result.new_balance);
      setCustomBet("");
      // Обновляем историю
      if (showHistory) {
        cubeHistory().then(d => setHistory(d.games || [])).catch(() => {});
      }
    } catch (e) {
      clearInterval(animInterval);
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setRolling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-oswald text-3xl uppercase tracking-widest mb-2">КУБИК</h2>
        <p className="text-sm" style={{ color: "#888" }}>Бросай кость против сервера — победа = ×2 к ставке</p>
      </div>

      {/* Dice */}
      <div className="flex justify-center items-center gap-8">
        <div className="text-center">
          <div className="w-24 h-24 flex items-center justify-center text-5xl rounded-lg mb-2"
            style={{ backgroundColor: "#1A1A1A", border: `2px solid ${lastResult ? RESULT_CONFIG[lastResult.result].color : "#F97316"}`, color: "#F97316" }}>
            {DICE_FACES[playerDie - 1]}
          </div>
          <p className="text-xs uppercase tracking-widest" style={{ color: "#888" }}>ВЫ</p>
        </div>
        <div className="font-oswald text-2xl font-bold" style={{ color: "#333" }}>VS</div>
        <div className="text-center">
          <div className="w-24 h-24 flex items-center justify-center text-5xl rounded-lg mb-2"
            style={{ backgroundColor: "#1A1A1A", border: "2px solid #333", color: "#888" }}>
            {DICE_FACES[serverDie - 1]}
          </div>
          <p className="text-xs uppercase tracking-widest" style={{ color: "#888" }}>СЕРВЕР</p>
        </div>
      </div>

      {/* Result */}
      {lastResult && (
        <div className="p-4 rounded text-center"
          style={{ backgroundColor: RESULT_CONFIG[lastResult.result].bg, border: `2px solid ${RESULT_CONFIG[lastResult.result].border}` }}>
          <p className="font-oswald text-2xl uppercase tracking-widest" style={{ color: RESULT_CONFIG[lastResult.result].color }}>
            {RESULT_CONFIG[lastResult.result].label}
          </p>
          <p className="text-sm mt-2" style={{ color: "#888" }}>
            Выплата:{" "}
            <span style={{ color: RESULT_CONFIG[lastResult.result].color }}>
              {lastResult.payout} монет
            </span>
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 rounded text-sm" style={{ backgroundColor: "#3a0a0a", color: "#ff6b6b" }}>{error}</div>
      )}

      {/* Bet */}
      <div className="space-y-3">
        <p className="text-xs font-oswald uppercase tracking-widest" style={{ color: "#888" }}>СТАВКА</p>
        <div className="flex gap-2 flex-wrap">
          {BET_PRESETS.map(p => (
            <button key={p} onClick={() => { setBet(p); setCustomBet(""); }}
              className="px-3 py-2 rounded text-sm font-mono transition-all"
              style={{
                backgroundColor: bet === p && !customBet ? "#F97316" : "#1A1A1A",
                color: bet === p && !customBet ? "#000" : "#888",
                border: `1px solid ${bet === p && !customBet ? "#F97316" : "#333"}`,
              }}>
              {p}
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="Своя ставка..."
          value={customBet}
          onChange={e => setCustomBet(e.target.value)}
          className="w-full px-3 py-2 rounded text-sm outline-none font-mono"
          style={{ backgroundColor: "#1A1A1A", border: "1px solid #333", color: "#e8ddd0" }}
        />
      </div>

      <button
        onClick={handleRoll}
        disabled={rolling}
        className="w-full py-3 rounded font-oswald text-lg uppercase tracking-widest transition-all"
        style={{
          backgroundColor: rolling ? "#555" : "#F97316",
          color: rolling ? "#999" : "#000",
          cursor: rolling ? "not-allowed" : "pointer",
        }}>
        {rolling ? "БРОСАЕМ..." : "🎲 БРОСИТЬ КОСТЬ"}
      </button>

      {/* History toggle */}
      <button onClick={() => setShowHistory(v => !v)}
        className="text-xs font-oswald uppercase tracking-widest transition-all"
        style={{ color: "#555" }}>
        {showHistory ? "▲ Скрыть историю" : "▼ Показать историю"}
      </button>

      {showHistory && history.length > 0 && (
        <div className="space-y-2">
          {history.map(h => (
            <div key={h.id} className="flex items-center justify-between px-3 py-2 rounded text-sm"
              style={{ backgroundColor: "#111", border: "1px solid #222" }}>
              <span style={{ color: "#555" }}>{DICE_FACES[h.player_roll - 1]} vs {DICE_FACES[h.server_roll - 1]}</span>
              <span style={{ color: RESULT_CONFIG[h.result].color }}>{RESULT_CONFIG[h.result].label}</span>
              <span className="font-mono" style={{ color: h.payout > 0 ? "#22C55E" : "#DC2626" }}>
                {h.payout > 0 ? `+${h.payout}` : `-${h.bet}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {showHistory && history.length === 0 && (
        <p className="text-sm" style={{ color: "#555" }}>История пуста</p>
      )}
    </div>
  );
}
