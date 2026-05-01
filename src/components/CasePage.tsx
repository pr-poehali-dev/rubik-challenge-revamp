import { useState, useEffect, useRef } from "react";
import { getCases, spin as apiSpin } from "@/api";
import type { User } from "@/api";

type Prize = { id: number; name: string; emoji: string; rarity: string; weight: number };
type Case  = { id: number; name: string; price: number; img_url: string; prizes: Prize[] };

const RARITY_COLOR: Record<string, string> = {
  common: "#6B7280", rare: "#3B82F6", epic: "#A855F7", legendary: "#F59E0B",
};
const RARITY_LABEL: Record<string, string> = {
  common: "Обычный", rare: "Редкий", epic: "Эпический", legendary: "Легендарный",
};
const TG_ADMIN = "https://t.me/Torgreal7";
const ITEM_W = 130;
const STRIP_COUNT = 60;

function buildStrip(winPrize: Prize, allPrizes: Prize[]): Prize[] {
  const strip: Prize[] = [];
  for (let i = 0; i < STRIP_COUNT; i++) {
    if (i === STRIP_COUNT - 12) {
      strip.push(winPrize);
    } else {
      const total = allPrizes.reduce((s, p) => s + p.weight, 0);
      let r = Math.random() * total;
      let picked = allPrizes[0];
      for (const p of allPrizes) { r -= p.weight; if (r <= 0) { picked = p; break; } }
      strip.push(picked);
    }
  }
  return strip;
}

type Props = {
  user: User | null;
  onAuthRequired: () => void;
  onBalanceUpdate: (b: number) => void;
};

export default function CasePage({ user, onAuthRequired, onBalanceUpdate }: Props) {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [strip, setStrip] = useState<Prize[]>([]);
  const [offset, setOffset] = useState(0);
  const [result, setResult] = useState<Prize | null>(null);
  const [error, setError] = useState("");
  const [loadingCases, setLoadingCases] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCases().then(d => {
      setCases(d.cases || []);
      if (d.cases?.length > 0) setSelectedCase(d.cases[0]);
      setLoadingCases(false);
    }).catch(() => setLoadingCases(false));
  }, []);

  const handleSpin = async () => {
    if (!user) { onAuthRequired(); return; }
    if (!selectedCase) return;
    if (spinning) return;
    if (user.balance < selectedCase.price) {
      setError("Недостаточно средств");
      return;
    }
    setError("");
    setResult(null);

    try {
      setSpinning(true);
      const res = await apiSpin(selectedCase.id);
      const winPrize: Prize = res.prize;
      const newStrip = buildStrip(winPrize, selectedCase.prizes);
      setStrip(newStrip);

      const containerW = containerRef.current?.offsetWidth || 400;
      const winIdx = STRIP_COUNT - 12;
      const targetOffset = -(winIdx * ITEM_W - containerW / 2 + ITEM_W / 2);

      setOffset(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setOffset(targetOffset);
          setTimeout(() => {
            setResult(winPrize);
            onBalanceUpdate(res.new_balance);
            setSpinning(false);
          }, 4200);
        });
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
      setSpinning(false);
    }
  };

  if (loadingCases) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="font-oswald text-sm uppercase tracking-widest animate-pulse" style={{ color: "#555" }}>
          Загрузка кейсов...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-oswald text-3xl uppercase tracking-widest mb-2">КЕЙСЫ</h2>
        <p className="text-sm" style={{ color: "#888" }}>Открой кейс и получи случайный предмет</p>
      </div>

      {/* Case selector */}
      <div className="grid grid-cols-3 gap-3">
        {cases.map(c => (
          <button key={c.id}
            onClick={() => { setSelectedCase(c); setResult(null); setError(""); }}
            className="rounded overflow-hidden transition-all"
            style={{ border: `2px solid ${selectedCase?.id === c.id ? "#F97316" : "#222"}`, backgroundColor: "#111" }}>
            <img src={c.img_url} alt={c.name} className="w-full h-20 object-cover opacity-80" />
            <div className="p-2 text-center">
              <p className="font-oswald text-xs uppercase tracking-widest">{c.name}</p>
              <p className="font-mono text-xs mt-1" style={{ color: "#F97316" }}>{c.price} монет</p>
            </div>
          </button>
        ))}
      </div>

      {selectedCase && (
        <>
          {/* Reel */}
          <div ref={containerRef} className="relative overflow-hidden rounded"
            style={{ height: 160, backgroundColor: "#0d0d0d", border: "1px solid #222" }}>
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
              style={{ width: ITEM_W, border: "2px solid #F97316", borderRadius: 4, boxShadow: "0 0 20px rgba(249,115,22,0.4)" }} />
            <div
              className="flex items-center h-full"
              style={{
                transform: `translateX(calc(50% - ${ITEM_W / 2}px + ${offset}px))`,
                transition: spinning ? "transform 4s cubic-bezier(0.12,0.8,0.32,1)" : "none",
              }}
            >
              {(strip.length > 0 ? strip : selectedCase.prizes).map((prize, i) => (
                <div key={i} className="flex-shrink-0 flex flex-col items-center justify-center rounded"
                  style={{
                    width: ITEM_W - 4, height: 140, margin: "0 2px",
                    backgroundColor: "#141414", border: `1px solid ${RARITY_COLOR[prize.rarity]}33`,
                  }}>
                  <span className="text-3xl mb-1">{prize.emoji}</span>
                  <p className="text-xs text-center px-1 leading-tight" style={{ color: "#ccc" }}>{prize.name}</p>
                  <p className="text-xs mt-1" style={{ color: RARITY_COLOR[prize.rarity] }}>
                    {RARITY_LABEL[prize.rarity]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="p-4 rounded text-center animate-fade-in"
              style={{ backgroundColor: "#111", border: `2px solid ${RARITY_COLOR[result.rarity]}` }}>
              <p className="text-4xl mb-2">{result.emoji}</p>
              <p className="font-oswald text-xl uppercase tracking-widest">{result.name}</p>
              <p className="text-sm mt-1" style={{ color: RARITY_COLOR[result.rarity] }}>
                {RARITY_LABEL[result.rarity]}
              </p>
              <p className="text-xs mt-3" style={{ color: "#888" }}>
                Для получения напишите в{" "}
                <a href={TG_ADMIN} target="_blank" rel="noreferrer" style={{ color: "#F97316" }}>@Torgreal7</a>
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded text-sm" style={{ backgroundColor: "#3a0a0a", color: "#ff6b6b" }}>{error}</div>
          )}

          {/* Prizes list */}
          <div>
            <p className="text-xs font-oswald uppercase tracking-widest mb-3" style={{ color: "#888" }}>СОДЕРЖИМОЕ</p>
            <div className="grid grid-cols-2 gap-2">
              {selectedCase.prizes.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded"
                  style={{ backgroundColor: "#111", border: `1px solid ${RARITY_COLOR[p.rarity]}33` }}>
                  <span className="text-2xl">{p.emoji}</span>
                  <div>
                    <p className="text-sm leading-tight">{p.name}</p>
                    <p className="text-xs" style={{ color: RARITY_COLOR[p.rarity] }}>{RARITY_LABEL[p.rarity]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSpin}
            disabled={spinning}
            className="w-full py-3 rounded font-oswald text-lg uppercase tracking-widest transition-all"
            style={{
              backgroundColor: spinning ? "#555" : "#F97316",
              color: spinning ? "#999" : "#000",
              cursor: spinning ? "not-allowed" : "pointer",
            }}>
            {spinning ? "ОТКРЫВАЕМ..." : `📦 ОТКРЫТЬ — ${selectedCase.price} монет`}
          </button>
        </>
      )}
    </div>
  );
}
