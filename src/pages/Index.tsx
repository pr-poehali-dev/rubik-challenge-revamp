import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

/* ---- Images ---- */
const BASE = "https://cdn.poehali.dev/projects/f4df7e9e-38ca-4c43-9a9a-658478926a3f/files/";
const IMG_BG      = BASE + "482adf94-6629-443d-b3cd-671ac067ca0a.jpg";
const IMG_COWBOY  = BASE + "77e96c0d-9a4a-4f00-a7b7-808d2e684032.jpg";
const IMG_COWBOY_NY = BASE + "041ac11a-fbf4-49e5-a6e5-644af32c7c8e.jpg";
const IMG_SAMURAI = BASE + "749d2710-b283-4344-bae3-b2beeca9b467.jpg";
const IMG_AMMO    = BASE + "2e9d7b55-d51c-42cd-abf0-46b5efe32777.jpg";
const IMG_MEDS    = BASE + "8236384d-4eaa-484d-b527-9f01d35dd2d5.jpg";
const IMG_EASTER  = BASE + "c2faedf2-bd62-4038-9238-36fd605fb916.jpg";
const IMG_SANTA   = BASE + "5cdc1919-cac9-4ce9-8c34-ab7e605f9c04.jpg";
const IMG_PASS    = BASE + "39e3fb3e-bb6a-4be2-902b-60f2bbc7c762.jpg";
const IMG_BACKPACK = BASE + "be5783d1-4694-484f-9fb0-f3d2c940a9c8.jpg";

/* ---- Contacts ---- */
const TG_ADMIN1  = "https://t.me/Torgreal7";
const TG_ADMIN2  = "https://t.me/fuckktokyo";

/* ---- Data ---- */
const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

const BET_PRESETS = [10, 25, 50, 100, 200, 500];

const RESULT_CONFIG = {
  win:  { label: "ПОБЕДА!",   color: "#22C55E", bg: "#052010", border: "#22C55E" },
  lose: { label: "ПРОИГРЫШ",  color: "#DC2626", bg: "#1A0505", border: "#DC2626" },
  tie:  { label: "НИЧЬЯ",     color: "#F59E0B", bg: "#1A1200", border: "#F59E0B" },
} as const;

const RARITY_COLOR: Record<string, string> = {
  common: "#6B7280",
  rare: "#3B82F6",
  epic: "#A855F7",
  legendary: "#F59E0B",
};
const RARITY_LABEL: Record<string, string> = {
  common: "Обычный",
  rare: "Редкий",
  epic: "Эпический",
  legendary: "Легендарный",
};

const PRODUCTS = [
  { id: 1, name: "Ковбой",        img: IMG_COWBOY,    price: 350,  tag: "Скин",    rarity: "epic" },
  { id: 2, name: "Ковбой NY",     img: IMG_COWBOY_NY, price: 500,  tag: "Скин",    rarity: "legendary" },
  { id: 3, name: "Самурай",       img: IMG_SAMURAI,   price: 400,  tag: "Скин",    rarity: "epic" },
  { id: 4, name: "Патроны",       img: IMG_AMMO,      price: 120,  tag: "Ресурс",  rarity: "rare" },
  { id: 5, name: "Медикаменты",   img: IMG_MEDS,      price: 90,   tag: "Ресурс",  rarity: "common" },
  { id: 6, name: "Пасхальный бокс", img: IMG_EASTER,  price: 299,  tag: "Кейс",    rarity: "rare" },
  { id: 7, name: "Санта",         img: IMG_SANTA,     price: 450,  tag: "Скин",    rarity: "legendary" },
  { id: 8, name: "Боевой пасс",   img: IMG_PASS,      price: 599,  tag: "Пасс",    rarity: "legendary" },
  { id: 9, name: "Рюкзак",        img: IMG_BACKPACK,  price: 180,  tag: "Предмет", rarity: "rare" },
];

const TICKER_ITEMS = [
  "⚔️ WASTELAND SHOP",
  "🎲 Кубик — честная игра",
  "📦 Открытие кейсов",
  "💀 Prey Day Survival",
  "🔫 Патроны и медикаменты",
  "🤠 Скины персонажей",
  "⭐ Легендарные предметы",
  "💰 Пополнение через Сбербанк",
];

type Page = "home" | "shop" | "cases" | "cube" | "contacts";

/* ---- CubePage ---- */
type CubeResult = "win" | "lose" | "tie";
function simulateRoll(bet: number) {
  const playerRoll = Math.floor(Math.random() * 6) + 1;
  const serverRoll = Math.floor(Math.random() * 6) + 1;
  let result: CubeResult;
  if (playerRoll > serverRoll) result = "win";
  else if (playerRoll < serverRoll) result = "lose";
  else result = "tie";
  const payout = result === "win" ? bet * 2 : result === "tie" ? bet : 0;
  return { playerRoll, serverRoll, result, bet, payout };
}

function CubeSection({ balance, onBalanceChange }: { balance: number; onBalanceChange: (n: number) => void }) {
  const [bet, setBet] = useState(50);
  const [customBet, setCustomBet] = useState("");
  const [rolling, setRolling] = useState(false);
  const [playerDie, setPlayerDie] = useState(1);
  const [serverDie, setServerDie] = useState(1);
  const [lastResult, setLastResult] = useState<ReturnType<typeof simulateRoll> | null>(null);
  const [history, setHistory] = useState<ReturnType<typeof simulateRoll>[]>([]);
  const [error, setError] = useState("");

  const handleRoll = () => {
    const finalBet = customBet ? parseFloat(customBet) : bet;
    if (!finalBet || finalBet <= 0 || finalBet > balance) {
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

    setTimeout(() => {
      clearInterval(animInterval);
      const result = simulateRoll(finalBet);
      setPlayerDie(result.playerRoll);
      setServerDie(result.serverRoll);
      setLastResult(result);
      const newBalance = balance - finalBet + result.payout;
      onBalanceChange(newBalance);
      setHistory(h => [result, ...h].slice(0, 10));
      setRolling(false);
      setCustomBet("");
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-oswald text-3xl uppercase tracking-widest mb-2">КУБИК</h2>
        <p className="text-sm" style={{ color: "#888" }}>Бросай кость — выиграй в 2× или потеряй ставку</p>
      </div>

      {/* Dice */}
      <div className="flex justify-center items-center gap-8">
        <div className="text-center">
          <div
            className="w-24 h-24 flex items-center justify-center text-5xl rounded-lg mb-2 transition-all duration-75"
            style={{ backgroundColor: "#1A1A1A", border: "2px solid #F97316", color: "#F97316" }}
          >
            {DICE_FACES[playerDie - 1]}
          </div>
          <p className="text-xs uppercase tracking-widest" style={{ color: "#888" }}>ВЫ</p>
        </div>
        <div className="font-oswald text-2xl font-bold" style={{ color: "#444" }}>VS</div>
        <div className="text-center">
          <div
            className="w-24 h-24 flex items-center justify-center text-5xl rounded-lg mb-2 transition-all duration-75"
            style={{ backgroundColor: "#1A1A1A", border: "2px solid #444", color: "#888" }}
          >
            {DICE_FACES[serverDie - 1]}
          </div>
          <p className="text-xs uppercase tracking-widest" style={{ color: "#888" }}>СЕРВЕР</p>
        </div>
      </div>

      {/* Result */}
      {lastResult && (
        <div
          className="p-4 rounded text-center animate-fade-in"
          style={{
            backgroundColor: RESULT_CONFIG[lastResult.result].bg,
            border: `2px solid ${RESULT_CONFIG[lastResult.result].border}`,
          }}
        >
          <p className="font-oswald text-2xl uppercase tracking-widest" style={{ color: RESULT_CONFIG[lastResult.result].color }}>
            {RESULT_CONFIG[lastResult.result].label}
          </p>
          <p className="text-sm mt-1" style={{ color: "#888" }}>
            Выплата:{" "}
            <span style={{ color: RESULT_CONFIG[lastResult.result].color }}>
              {lastResult.payout} монет
            </span>
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 rounded text-sm" style={{ backgroundColor: "#3a0a0a", color: "#ff6b6b" }}>
          {error}
        </div>
      )}

      {/* Bet presets */}
      <div className="space-y-3">
        <p className="text-xs font-oswald uppercase tracking-widest" style={{ color: "#888" }}>СТАВКА</p>
        <div className="flex gap-2 flex-wrap">
          {BET_PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => { setBet(p); setCustomBet(""); }}
              className="px-3 py-2 rounded text-sm font-mono transition-all"
              style={{
                backgroundColor: bet === p && !customBet ? "#F97316" : "#1A1A1A",
                color: bet === p && !customBet ? "#000" : "#888",
                border: `1px solid ${bet === p && !customBet ? "#F97316" : "#333"}`,
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="Своя ставка..."
          value={customBet}
          onChange={(e) => setCustomBet(e.target.value)}
          className="w-full px-3 py-2 rounded text-sm font-mono outline-none"
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
        }}
      >
        {rolling ? "БРОСАЕМ..." : "🎲 БРОСИТЬ КОСТЬ"}
      </button>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-oswald uppercase tracking-widest" style={{ color: "#888" }}>ИСТОРИЯ</p>
          {history.map((h, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded text-sm"
              style={{ backgroundColor: "#111", border: "1px solid #222" }}>
              <span style={{ color: "#555" }}>{DICE_FACES[h.playerRoll - 1]} vs {DICE_FACES[h.serverRoll - 1]}</span>
              <span style={{ color: RESULT_CONFIG[h.result].color }}>{RESULT_CONFIG[h.result].label}</span>
              <span style={{ color: h.payout > 0 ? "#22C55E" : "#DC2626", fontFamily: "monospace" }}>
                {h.payout > 0 ? `+${h.payout}` : `-${h.bet}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- CasePage ---- */
const CASES_DATA = [
  {
    id: 1,
    name: "СТАНДАРТНЫЙ",
    price: 50,
    img: IMG_AMMO,
    prizes: [
      { id: 1, name: "Патроны x50",    emoji: "🔫", rarity: "common",    weight: 50 },
      { id: 2, name: "Медикаменты",    emoji: "💊", rarity: "common",    weight: 30 },
      { id: 3, name: "Патроны x200",   emoji: "🔫", rarity: "rare",      weight: 15 },
      { id: 4, name: "Рюкзак",         emoji: "🎒", rarity: "epic",      weight: 4  },
      { id: 5, name: "Ковбой",         emoji: "🤠", rarity: "legendary", weight: 1  },
    ],
  },
  {
    id: 2,
    name: "БОЕВОЙ",
    price: 150,
    img: IMG_COWBOY,
    prizes: [
      { id: 1, name: "Патроны x200",   emoji: "🔫", rarity: "common",    weight: 40 },
      { id: 2, name: "Медикаменты x3", emoji: "💊", rarity: "common",    weight: 25 },
      { id: 3, name: "Рюкзак",         emoji: "🎒", rarity: "rare",      weight: 20 },
      { id: 4, name: "Самурай",        emoji: "⚔️", rarity: "epic",      weight: 10 },
      { id: 5, name: "Ковбой NY",      emoji: "🎅", rarity: "legendary", weight: 5  },
    ],
  },
  {
    id: 3,
    name: "ПРАЗДНИЧНЫЙ",
    price: 300,
    img: IMG_EASTER,
    prizes: [
      { id: 1, name: "Медикаменты x5", emoji: "💊", rarity: "common",    weight: 30 },
      { id: 2, name: "Рюкзак",         emoji: "🎒", rarity: "rare",      weight: 30 },
      { id: 3, name: "Санта",          emoji: "🎅", rarity: "epic",      weight: 25 },
      { id: 4, name: "Ковбой NY",      emoji: "🤠", rarity: "legendary", weight: 10 },
      { id: 5, name: "Боевой пасс",    emoji: "⭐", rarity: "legendary", weight: 5  },
    ],
  },
];

const ITEM_W = 130;
const STRIP_COUNT = 60;

type Prize = (typeof CASES_DATA)[0]["prizes"][0];

function buildStrip(winPrize: Prize, allPrizes: Prize[]): Prize[] {
  const strip: Prize[] = [];
  for (let i = 0; i < STRIP_COUNT; i++) {
    if (i === STRIP_COUNT - 12) {
      strip.push(winPrize);
    } else {
      const total = allPrizes.reduce((s, p) => s + p.weight, 0);
      let r = Math.random() * total;
      let picked = allPrizes[0];
      for (const p of allPrizes) {
        r -= p.weight;
        if (r <= 0) { picked = p; break; }
      }
      strip.push(picked);
    }
  }
  return strip;
}

function CasesSection({ balance, onBalanceChange }: { balance: number; onBalanceChange: (n: number) => void }) {
  const [selectedCase, setSelectedCase] = useState(CASES_DATA[0]);
  const [spinning, setSpinning] = useState(false);
  const [strip, setStrip] = useState<Prize[]>([]);
  const [offset, setOffset] = useState(0);
  const [result, setResult] = useState<Prize | null>(null);
  const [error, setError] = useState("");
  const reelRef = useRef<HTMLDivElement>(null);

  const handleSpin = () => {
    if (spinning) return;
    if (balance < selectedCase.price) {
      setError("Недостаточно средств");
      return;
    }
    setError("");
    setResult(null);

    const total = selectedCase.prizes.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    let winPrize = selectedCase.prizes[0];
    for (const p of selectedCase.prizes) {
      r -= p.weight;
      if (r <= 0) { winPrize = p; break; }
    }

    const newStrip = buildStrip(winPrize, selectedCase.prizes);
    setStrip(newStrip);

    const winIdx = STRIP_COUNT - 12;
    const targetOffset = -(winIdx * ITEM_W - (window.innerWidth < 600 ? 100 : 200));

    setOffset(0);
    setSpinning(true);
    onBalanceChange(balance - selectedCase.price);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOffset(targetOffset);
        setTimeout(() => {
          setResult(winPrize);
          setSpinning(false);
        }, 4200);
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-oswald text-3xl uppercase tracking-widest mb-2">КЕЙСЫ</h2>
        <p className="text-sm" style={{ color: "#888" }}>Открой кейс и получи случайный предмет</p>
      </div>

      {/* Case selector */}
      <div className="grid grid-cols-3 gap-3">
        {CASES_DATA.map((c) => (
          <button
            key={c.id}
            onClick={() => { setSelectedCase(c); setResult(null); setError(""); }}
            className="rounded overflow-hidden transition-all"
            style={{
              border: `2px solid ${selectedCase.id === c.id ? "#F97316" : "#222"}`,
              backgroundColor: "#111",
            }}
          >
            <img src={c.img} alt={c.name} className="w-full h-20 object-cover opacity-80" />
            <div className="p-2 text-center">
              <p className="font-oswald text-xs uppercase tracking-widest">{c.name}</p>
              <p className="font-mono text-xs mt-1" style={{ color: "#F97316" }}>{c.price} монет</p>
            </div>
          </button>
        ))}
      </div>

      {/* Reel */}
      <div className="relative overflow-hidden rounded" style={{ height: 160, backgroundColor: "#0d0d0d", border: "1px solid #222" }}>
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[130px] z-10 pointer-events-none"
          style={{ border: "2px solid #F97316", borderRadius: 4, boxShadow: "0 0 20px rgba(249,115,22,0.3)" }} />
        <div ref={reelRef}
          className="flex items-center h-full"
          style={{
            transform: `translateX(calc(50% + ${offset}px - ${ITEM_W / 2}px))`,
            transition: spinning ? "transform 4s cubic-bezier(0.12,0.8,0.32,1)" : "none",
          }}
        >
          {(strip.length > 0 ? strip : selectedCase.prizes).map((prize, i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center justify-center rounded"
              style={{
                width: ITEM_W - 4,
                height: 140,
                margin: "0 2px",
                backgroundColor: "#141414",
                border: `1px solid ${RARITY_COLOR[prize.rarity]}33`,
              }}
            >
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
          <p className="text-3xl mb-2">{result.emoji}</p>
          <p className="font-oswald text-xl uppercase tracking-widest">{result.name}</p>
          <p className="text-sm mt-1" style={{ color: RARITY_COLOR[result.rarity] }}>
            {RARITY_LABEL[result.rarity]}
          </p>
          <p className="text-xs mt-2" style={{ color: "#888" }}>
            Для получения напишите в{" "}
            <a href={TG_ADMIN1} target="_blank" rel="noreferrer" style={{ color: "#F97316" }}>Telegram</a>
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 rounded text-sm" style={{ backgroundColor: "#3a0a0a", color: "#ff6b6b" }}>{error}</div>
      )}

      {/* Prizes list */}
      <div>
        <p className="text-xs font-oswald uppercase tracking-widest mb-3" style={{ color: "#888" }}>
          СОДЕРЖИМОЕ КЕЙСА
        </p>
        <div className="grid grid-cols-2 gap-2">
          {selectedCase.prizes.map((p) => (
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
        }}
      >
        {spinning ? "ОТКРЫВАЕМ..." : `📦 ОТКРЫТЬ — ${selectedCase.price} монет`}
      </button>
    </div>
  );
}

/* ---- ShopSection ---- */
function ShopSection() {
  const [filter, setFilter] = useState("all");
  const tags = ["all", "Скин", "Ресурс", "Кейс", "Предмет", "Пасс"];
  const filtered = filter === "all" ? PRODUCTS : PRODUCTS.filter(p => p.tag === filter);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-oswald text-3xl uppercase tracking-widest mb-2">МАГАЗИН</h2>
        <p className="text-sm" style={{ color: "#888" }}>Игровые ресурсы Prey Day Survival</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {tags.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className="px-3 py-1 rounded text-xs font-oswald uppercase tracking-widest transition-all"
            style={{
              backgroundColor: filter === t ? "#F97316" : "#1A1A1A",
              color: filter === t ? "#000" : "#888",
              border: `1px solid ${filter === t ? "#F97316" : "#333"}`,
            }}
          >
            {t === "all" ? "ВСЕ" : t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map((p) => (
          <div key={p.id} className="rounded overflow-hidden transition-all hover:scale-[1.02]"
            style={{ backgroundColor: "#111", border: `1px solid ${RARITY_COLOR[p.rarity]}33` }}>
            <div className="relative">
              <img src={p.img} alt={p.name} className="w-full h-40 object-cover" />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-oswald uppercase"
                style={{ backgroundColor: "#0d0d0d", color: RARITY_COLOR[p.rarity], border: `1px solid ${RARITY_COLOR[p.rarity]}` }}>
                {RARITY_LABEL[p.rarity]}
              </span>
            </div>
            <div className="p-3">
              <p className="font-oswald text-sm uppercase tracking-wide mb-1">{p.name}</p>
              <p className="text-xs" style={{ color: "#666" }}>{p.tag}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="font-mono font-bold" style={{ color: "#F97316" }}>{p.price} ₽</span>
                <a href={TG_ADMIN1} target="_blank" rel="noreferrer"
                  className="px-3 py-1 rounded text-xs font-oswald uppercase transition-all"
                  style={{ backgroundColor: "#F97316", color: "#000" }}>
                  Купить
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded text-center" style={{ backgroundColor: "#111", border: "1px solid #222" }}>
        <p className="text-sm" style={{ color: "#888" }}>
          Для покупки напишите администратору в Telegram
        </p>
        <div className="flex gap-3 justify-center mt-3">
          <a href={TG_ADMIN1} target="_blank" rel="noreferrer"
            className="px-4 py-2 rounded font-oswald uppercase tracking-widest text-sm transition-all"
            style={{ backgroundColor: "#1A1A1A", color: "#F97316", border: "1px solid #F97316" }}>
            @Torgreal7
          </a>
          <a href={TG_ADMIN2} target="_blank" rel="noreferrer"
            className="px-4 py-2 rounded font-oswald uppercase tracking-widest text-sm transition-all"
            style={{ backgroundColor: "#1A1A1A", color: "#F97316", border: "1px solid #F97316" }}>
            @fuckktokyo
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---- ContactsSection ---- */
function ContactsSection() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-oswald text-3xl uppercase tracking-widest mb-2">КОНТАКТЫ</h2>
        <p className="text-sm" style={{ color: "#888" }}>Свяжитесь с нами для покупки или поддержки</p>
      </div>

      <div className="space-y-3">
        <a href={TG_ADMIN1} target="_blank" rel="noreferrer"
          className="flex items-center gap-4 p-4 rounded transition-all"
          style={{ backgroundColor: "#111", border: "1px solid #222" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: "#1A1A1A" }}>👤</div>
          <div>
            <p className="font-oswald uppercase tracking-widest text-sm">Администратор</p>
            <p className="text-xs mt-0.5" style={{ color: "#F97316" }}>@Torgreal7</p>
          </div>
          <Icon name="ExternalLink" size={16} className="ml-auto" style={{ color: "#444" }} />
        </a>

        <a href={TG_ADMIN2} target="_blank" rel="noreferrer"
          className="flex items-center gap-4 p-4 rounded transition-all"
          style={{ backgroundColor: "#111", border: "1px solid #222" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: "#1A1A1A" }}>👤</div>
          <div>
            <p className="font-oswald uppercase tracking-widest text-sm">Администратор 2</p>
            <p className="text-xs mt-0.5" style={{ color: "#F97316" }}>@fuckktokyo</p>
          </div>
          <Icon name="ExternalLink" size={16} className="ml-auto" style={{ color: "#444" }} />
        </a>
      </div>

      <div className="p-4 rounded" style={{ backgroundColor: "#111", border: "1px solid #222" }}>
        <p className="font-oswald text-sm uppercase tracking-widest mb-3" style={{ color: "#888" }}>
          ОПЛАТА
        </p>
        <div className="flex items-center gap-3 p-3 rounded" style={{ backgroundColor: "#1A1A1A" }}>
          <span className="text-2xl">💳</span>
          <div>
            <p className="text-xs" style={{ color: "#888" }}>Сбербанк</p>
            <p className="font-mono text-sm tracking-widest">2202 2067 7023 7480</p>
          </div>
        </div>
        <p className="text-xs mt-3" style={{ color: "#666" }}>
          После оплаты отправьте скриншот администратору в Telegram
        </p>
      </div>

      <div className="p-4 rounded" style={{ backgroundColor: "#111", border: "1px solid #1a2a1a" }}>
        <p className="font-oswald text-sm uppercase tracking-widest mb-2" style={{ color: "#888" }}>
          РАБОТАЕМ
        </p>
        <p className="text-sm" style={{ color: "#22C55E" }}>Ежедневно • Быстрая выдача</p>
      </div>
    </div>
  );
}

/* ---- MAIN PAGE ---- */
export default function Index() {
  const [page, setPage] = useState<Page>("home");
  const [balance, setBalance] = useState(500);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: Page; label: string; icon: string }[] = [
    { id: "home",     label: "ГЛАВНАЯ",  icon: "Home" },
    { id: "shop",     label: "МАГАЗИН",  icon: "ShoppingBag" },
    { id: "cases",    label: "КЕЙСЫ",    icon: "Package" },
    { id: "cube",     label: "КУБИК",    icon: "Dice6" },
    { id: "contacts", label: "КОНТАКТЫ", icon: "MessageCircle" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0d0d0d", color: "#e8ddd0" }}>
      {/* Ticker */}
      <div className="overflow-hidden" style={{ backgroundColor: "#F97316", height: 32 }}>
        <div className="animate-marquee flex items-center h-full whitespace-nowrap">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="font-oswald text-xs uppercase tracking-widest mx-6" style={{ color: "#000" }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Header */}
      <header style={{ backgroundColor: "#0d0d0d", borderBottom: "1px solid #1a1a1a" }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => setPage("home")} className="font-oswald text-xl tracking-widest flex items-center gap-2">
            <span style={{ color: "#F97316" }}>☠️</span>
            <span>WASTELAND</span>
            <span style={{ color: "#F97316" }}>SHOP</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((n) => (
              <button key={n.id} onClick={() => setPage(n.id)}
                className="px-3 py-1.5 rounded text-xs font-oswald uppercase tracking-widest transition-all"
                style={{
                  backgroundColor: page === n.id ? "#F97316" : "transparent",
                  color: page === n.id ? "#000" : "#888",
                }}
              >
                {n.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded"
              style={{ backgroundColor: "#141414", border: "1px solid #222" }}>
              <span className="text-xs" style={{ color: "#888" }}>💰</span>
              <span className="font-mono text-sm" style={{ color: "#F97316" }}>{balance}</span>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2" style={{ color: "#888" }}>
              <Icon name={mobileMenuOpen ? "X" : "Menu"} size={20} />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden" style={{ borderTop: "1px solid #1a1a1a", backgroundColor: "#0d0d0d" }}>
            {navItems.map((n) => (
              <button key={n.id} onClick={() => { setPage(n.id); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                style={{ borderBottom: "1px solid #111", color: page === n.id ? "#F97316" : "#888" }}>
                <Icon name={n.icon} size={16} />
                <span className="font-oswald text-sm uppercase tracking-widest">{n.label}</span>
              </button>
            ))}
            <div className="flex items-center gap-2 px-4 py-3">
              <span className="text-xs" style={{ color: "#888" }}>Баланс:</span>
              <span className="font-mono text-sm" style={{ color: "#F97316" }}>{balance} монет</span>
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* HOME */}
        {page === "home" && (
          <div className="space-y-8 animate-fade-up">
            {/* Hero */}
            <div className="relative rounded overflow-hidden" style={{ height: 320 }}>
              <img src={IMG_BG} alt="bg" className="w-full h-full object-cover opacity-40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
                style={{ background: "linear-gradient(to bottom, transparent, rgba(13,13,13,0.9))" }}>
                <p className="text-xs font-oswald uppercase tracking-[0.3em] mb-3" style={{ color: "#F97316" }}>
                  PREY DAY SURVIVAL
                </p>
                <h1 className="font-oswald text-4xl md:text-6xl uppercase tracking-widest mb-4 animate-flicker">
                  WASTELAND SHOP
                </h1>
                <p className="text-sm max-w-md" style={{ color: "#888" }}>
                  Скины персонажей, ресурсы выживания и игровые кейсы с честной системой случайности
                </p>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setPage("shop")}
                    className="px-6 py-2.5 rounded font-oswald uppercase tracking-widest text-sm transition-all"
                    style={{ backgroundColor: "#F97316", color: "#000" }}>
                    Магазин
                  </button>
                  <button onClick={() => setPage("cases")}
                    className="px-6 py-2.5 rounded font-oswald uppercase tracking-widest text-sm transition-all"
                    style={{ backgroundColor: "transparent", color: "#F97316", border: "1px solid #F97316" }}>
                    Открыть кейс
                  </button>
                </div>
              </div>
            </div>

            {/* Featured products */}
            <div>
              <p className="font-oswald text-xs uppercase tracking-[0.3em] mb-4" style={{ color: "#666" }}>
                ПОПУЛЯРНЫЕ ТОВАРЫ
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: "Ковбой",      img: IMG_COWBOY,  price: 350, rarity: "epic"      },
                  { name: "Самурай",     img: IMG_SAMURAI, price: 400, rarity: "epic"      },
                  { name: "Санта",       img: IMG_SANTA,   price: 450, rarity: "legendary" },
                  { name: "Боевой пасс", img: IMG_PASS,    price: 599, rarity: "legendary" },
                ].map((p) => (
                  <button key={p.name} onClick={() => setPage("shop")}
                    className="rounded overflow-hidden transition-all hover:scale-[1.02] text-left"
                    style={{ backgroundColor: "#111", border: `1px solid ${RARITY_COLOR[p.rarity]}33` }}>
                    <img src={p.img} alt={p.name} className="w-full h-32 object-cover" />
                    <div className="p-2">
                      <p className="font-oswald text-xs uppercase">{p.name}</p>
                      <p className="font-mono text-xs mt-1" style={{ color: "#F97316" }}>{p.price} ₽</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sections preview */}
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={() => setPage("cases")}
                className="p-5 rounded text-left transition-all"
                style={{ backgroundColor: "#111", border: "1px solid #222" }}>
                <p className="text-3xl mb-3">📦</p>
                <p className="font-oswald text-lg uppercase tracking-widest">КЕЙСЫ</p>
                <p className="text-xs mt-1" style={{ color: "#888" }}>
                  3 кейса · от 50 монет<br />Предметы с разной редкостью
                </p>
              </button>
              <button onClick={() => setPage("cube")}
                className="p-5 rounded text-left transition-all"
                style={{ backgroundColor: "#111", border: "1px solid #222" }}>
                <p className="text-3xl mb-3">🎲</p>
                <p className="font-oswald text-lg uppercase tracking-widest">КУБИК</p>
                <p className="text-xs mt-1" style={{ color: "#888" }}>
                  Бросай кость против сервера<br />Победа = ×2 к ставке
                </p>
              </button>
            </div>

            {/* How to buy */}
            <div className="p-5 rounded" style={{ backgroundColor: "#111", border: "1px solid #222" }}>
              <p className="font-oswald text-lg uppercase tracking-widest mb-4">КАК КУПИТЬ</p>
              <div className="space-y-3">
                {[
                  { n: "01", text: "Выберите товар в магазине" },
                  { n: "02", text: "Переведите сумму на карту Сбербанка: 2202 2067 7023 7480" },
                  { n: "03", text: "Отправьте скриншот оплаты администратору @Torgreal7" },
                  { n: "04", text: "Получите товар в игре" },
                ].map((s) => (
                  <div key={s.n} className="flex items-start gap-4">
                    <span className="font-mono text-xs font-bold flex-shrink-0" style={{ color: "#F97316" }}>{s.n}</span>
                    <span className="text-sm" style={{ color: "#888" }}>{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {page === "shop"     && <ShopSection />}
        {page === "cases"    && <CasesSection balance={balance} onBalanceChange={setBalance} />}
        {page === "cube"     && <CubeSection balance={balance} onBalanceChange={setBalance} />}
        {page === "contacts" && <ContactsSection />}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 flex"
        style={{ backgroundColor: "#0d0d0d", borderTop: "1px solid #1a1a1a" }}>
        {navItems.map((n) => (
          <button key={n.id} onClick={() => setPage(n.id)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
            style={{ color: page === n.id ? "#F97316" : "#555" }}>
            <Icon name={n.icon} size={18} />
            <span className="font-oswald text-[9px] uppercase tracking-widest">{n.label}</span>
          </button>
        ))}
      </nav>

      {/* Mobile bottom padding */}
      <div className="md:hidden h-16" />

      {/* Footer */}
      <footer className="hidden md:block py-6 mt-8" style={{ borderTop: "1px solid #1a1a1a" }}>
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <span className="font-oswald text-sm tracking-widest" style={{ color: "#444" }}>
            ☠️ WASTELAND SHOP — Prey Day Survival
          </span>
          <div className="flex gap-4">
            <a href={TG_ADMIN1} target="_blank" rel="noreferrer"
              className="text-xs font-oswald uppercase tracking-widest transition-all"
              style={{ color: "#444" }}>
              @Torgreal7
            </a>
            <a href={TG_ADMIN2} target="_blank" rel="noreferrer"
              className="text-xs font-oswald uppercase tracking-widest transition-all"
              style={{ color: "#444" }}>
              @fuckktokyo
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
