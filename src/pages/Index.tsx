import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import AuthModal from "@/components/AuthModal";
import CasePage from "@/components/CasePage";
import CubePage from "@/components/CubePage";
import Cabinet from "@/components/Cabinet";
import AdminPanel from "@/components/AdminPanel";
import { getMe } from "@/api";
import type { User } from "@/api";

const BASE = "https://cdn.poehali.dev/projects/f4df7e9e-38ca-4c43-9a9a-658478926a3f/files/";
const IMG_BG       = BASE + "482adf94-6629-443d-b3cd-671ac067ca0a.jpg";
const IMG_COWBOY   = BASE + "77e96c0d-9a4a-4f00-a7b7-808d2e684032.jpg";
const IMG_SAMURAI  = BASE + "749d2710-b283-4344-bae3-b2beeca9b467.jpg";
const IMG_AMMO     = BASE + "2e9d7b55-d51c-42cd-abf0-46b5efe32777.jpg";
const IMG_MEDS     = BASE + "8236384d-4eaa-484d-b527-9f01d35dd2d5.jpg";
const IMG_EASTER   = BASE + "c2faedf2-bd62-4038-9238-36fd605fb916.jpg";
const IMG_SANTA    = BASE + "5cdc1919-cac9-4ce9-8c34-ab7e605f9c04.jpg";
const IMG_PASS     = BASE + "39e3fb3e-bb6a-4be2-902b-60f2bbc7c762.jpg";
const IMG_BACKPACK = BASE + "be5783d1-4694-484f-9fb0-f3d2c940a9c8.jpg";

const TG_ADMIN1 = "https://t.me/Torgreal7";
const TG_ADMIN2 = "https://t.me/fuckktokyo";

const TICKER_ITEMS = [
  "⚔️ WASTELAND SHOP", "🎲 Кубик — честная игра", "📦 Открытие кейсов",
  "💀 Prey Day Survival", "🔫 Патроны и медикаменты",
  "🤠 Скины персонажей", "⭐ Легендарные предметы", "💰 Пополнение через Сбербанк",
];

const RARITY_COLOR: Record<string, string> = {
  common: "#6B7280", rare: "#3B82F6", epic: "#A855F7", legendary: "#F59E0B",
};
const RARITY_LABEL: Record<string, string> = {
  common: "Обычный", rare: "Редкий", epic: "Эпический", legendary: "Легендарный",
};

const PRODUCTS = [
  { id: 1,  name: "Ковбой",          img: IMG_COWBOY,   price: 350,  tag: "Скин",    rarity: "epic"      },
  { id: 2,  name: "Самурай",         img: IMG_SAMURAI,  price: 400,  tag: "Скин",    rarity: "epic"      },
  { id: 3,  name: "Патроны x50",     img: IMG_AMMO,     price: 80,   tag: "Ресурс",  rarity: "common"    },
  { id: 4,  name: "Патроны x200",    img: IMG_AMMO,     price: 280,  tag: "Ресурс",  rarity: "rare"      },
  { id: 5,  name: "Медикаменты",     img: IMG_MEDS,     price: 90,   tag: "Ресурс",  rarity: "common"    },
  { id: 6,  name: "Медикаменты x5",  img: IMG_MEDS,     price: 380,  tag: "Ресурс",  rarity: "rare"      },
  { id: 7,  name: "Санта",           img: IMG_SANTA,    price: 450,  tag: "Скин",    rarity: "legendary" },
  { id: 8,  name: "Боевой пасс",     img: IMG_PASS,     price: 599,  tag: "Пасс",    rarity: "legendary" },
  { id: 9,  name: "Рюкзак",          img: IMG_BACKPACK, price: 180,  tag: "Предмет", rarity: "rare"      },
  { id: 10, name: "Пасхальный бокс", img: IMG_EASTER,   price: 299,  tag: "Кейс",    rarity: "rare"      },
];

type Page = "home" | "shop" | "cases" | "cube" | "cabinet" | "admin";

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
      <div className="flex gap-2 flex-wrap">
        {tags.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className="px-3 py-1 rounded text-xs font-oswald uppercase tracking-widest transition-all"
            style={{
              backgroundColor: filter === t ? "#F97316" : "#1A1A1A",
              color: filter === t ? "#000" : "#888",
              border: `1px solid ${filter === t ? "#F97316" : "#333"}`,
            }}>
            {t === "all" ? "ВСЕ" : t}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map(p => (
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
              <p className="text-xs" style={{ color: "#555" }}>{p.tag}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="font-mono font-bold" style={{ color: "#F97316" }}>{p.price} ₽</span>
                <a href={TG_ADMIN1} target="_blank" rel="noreferrer"
                  className="px-3 py-1 rounded text-xs font-oswald uppercase"
                  style={{ backgroundColor: "#F97316", color: "#000" }}>
                  Купить
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 rounded text-center" style={{ backgroundColor: "#111", border: "1px solid #222" }}>
        <p className="text-sm" style={{ color: "#888" }}>Для покупки напишите администратору</p>
        <div className="flex gap-3 justify-center mt-3">
          {[TG_ADMIN1, TG_ADMIN2].map((tg, i) => (
            <a key={i} href={tg} target="_blank" rel="noreferrer"
              className="px-4 py-2 rounded font-oswald uppercase tracking-widest text-sm"
              style={{ backgroundColor: "#1A1A1A", color: "#F97316", border: "1px solid #F97316" }}>
              {tg.replace("https://t.me/", "@")}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [page, setPage] = useState<Page>("home");
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    getMe().then(u => {
      if (u) { setUser(u); setUserBalance(u.balance); }
      setLoadingUser(false);
    });
  }, []);

  const handleBalanceUpdate = (b: number) => {
    setUserBalance(b);
    if (user) setUser({ ...user, balance: b });
  };

  const handleLogout = () => {
    setUser(null);
    setUserBalance(0);
    setPage("home");
  };

  const handleAuthSuccess = (u: User) => {
    setUser(u);
    setUserBalance(u.balance);
    setShowAuth(false);
    setPage("cabinet");
  };

  const navItems: { id: Page; label: string; icon: string }[] = [
    { id: "home",    label: "ГЛАВНАЯ",  icon: "Home"        },
    { id: "shop",    label: "МАГАЗИН",  icon: "ShoppingBag" },
    { id: "cases",   label: "КЕЙСЫ",    icon: "Package"     },
    { id: "cube",    label: "КУБИК",    icon: "Dice6"       },
    ...(user ? [{ id: "cabinet" as Page, label: "КАБИНЕТ", icon: "User" }] : []),
    ...(user?.is_admin ? [{ id: "admin" as Page, label: "АДМИН", icon: "Settings" }] : []),
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
          <button onClick={() => setPage("home")}
            className="font-oswald text-xl tracking-widest flex items-center gap-2">
            <span style={{ color: "#F97316" }}>☠️</span>
            <span>WASTELAND</span>
            <span style={{ color: "#F97316" }}>SHOP</span>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)}
                className="px-3 py-1.5 rounded text-xs font-oswald uppercase tracking-widest transition-all"
                style={{
                  backgroundColor: page === n.id ? "#F97316" : "transparent",
                  color: page === n.id ? "#000" : "#888",
                }}>
                {n.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded"
                  style={{ backgroundColor: "#141414", border: "1px solid #222" }}>
                  <span className="text-xs" style={{ color: "#888" }}>💰</span>
                  <span className="font-mono text-sm" style={{ color: "#F97316" }}>{Math.floor(userBalance)}</span>
                </div>
                <button onClick={() => setPage("cabinet")}
                  className="px-3 py-1.5 rounded text-xs font-oswald uppercase tracking-widest"
                  style={{ backgroundColor: "#1a1a1a", color: "#888", border: "1px solid #333" }}>
                  {user.username}
                </button>
              </div>
            ) : !loadingUser ? (
              <button onClick={() => setShowAuth(true)}
                className="hidden md:block px-4 py-1.5 rounded text-xs font-oswald uppercase tracking-widest"
                style={{ backgroundColor: "#F97316", color: "#000" }}>
                Войти
              </button>
            ) : null}

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2" style={{ color: "#888" }}>
              <Icon name={mobileMenuOpen ? "X" : "Menu"} size={20} />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden" style={{ borderTop: "1px solid #1a1a1a", backgroundColor: "#0d0d0d" }}>
            {navItems.map(n => (
              <button key={n.id} onClick={() => { setPage(n.id); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                style={{ borderBottom: "1px solid #111", color: page === n.id ? "#F97316" : "#888" }}>
                <Icon name={n.icon} size={16} />
                <span className="font-oswald text-sm uppercase tracking-widest">{n.label}</span>
              </button>
            ))}
            {user ? (
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #111" }}>
                <span className="text-sm font-oswald" style={{ color: "#888" }}>{user.username}</span>
                <span className="font-mono text-sm" style={{ color: "#F97316" }}>{Math.floor(userBalance)} монет</span>
              </div>
            ) : (
              <button onClick={() => { setShowAuth(true); setMobileMenuOpen(false); }}
                className="w-full px-4 py-3 text-left font-oswald text-sm uppercase tracking-widest"
                style={{ color: "#F97316" }}>
                Войти / Зарегистрироваться
              </button>
            )}
          </div>
        )}
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {page === "home" && (
          <div className="space-y-8 animate-fade-up">
            {/* Hero */}
            <div className="relative rounded overflow-hidden" style={{ height: 320 }}>
              <img src={IMG_BG} alt="bg" className="w-full h-full object-cover opacity-40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
                style={{ background: "linear-gradient(to bottom, transparent, rgba(13,13,13,0.95))" }}>
                <p className="text-xs font-oswald uppercase tracking-[0.3em] mb-3" style={{ color: "#F97316" }}>
                  PREY DAY SURVIVAL
                </p>
                <h1 className="font-oswald text-4xl md:text-6xl uppercase tracking-widest mb-4 animate-flicker">
                  WASTELAND SHOP
                </h1>
                <p className="text-sm max-w-md" style={{ color: "#888" }}>
                  Скины персонажей, ресурсы выживания и игровые кейсы с честной системой случайности
                </p>
                <div className="flex gap-3 mt-6 flex-wrap justify-center">
                  <button onClick={() => setPage("shop")}
                    className="px-6 py-2.5 rounded font-oswald uppercase tracking-widest text-sm"
                    style={{ backgroundColor: "#F97316", color: "#000" }}>
                    Магазин
                  </button>
                  <button onClick={() => setPage("cases")}
                    className="px-6 py-2.5 rounded font-oswald uppercase tracking-widest text-sm"
                    style={{ backgroundColor: "transparent", color: "#F97316", border: "1px solid #F97316" }}>
                    Открыть кейс
                  </button>
                  {!user && (
                    <button onClick={() => setShowAuth(true)}
                      className="px-6 py-2.5 rounded font-oswald uppercase tracking-widest text-sm"
                      style={{ backgroundColor: "transparent", color: "#888", border: "1px solid #333" }}>
                      Войти
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Featured */}
            <div>
              <p className="font-oswald text-xs uppercase tracking-[0.3em] mb-4" style={{ color: "#555" }}>
                ПОПУЛЯРНЫЕ ТОВАРЫ
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: "Ковбой",      img: IMG_COWBOY,  price: 350, rarity: "epic"      },
                  { name: "Самурай",     img: IMG_SAMURAI, price: 400, rarity: "epic"      },
                  { name: "Санта",       img: IMG_SANTA,   price: 450, rarity: "legendary" },
                  { name: "Боевой пасс", img: IMG_PASS,    price: 599, rarity: "legendary" },
                ].map(p => (
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

            {/* Sections */}
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={() => setPage("cases")}
                className="p-5 rounded text-left" style={{ backgroundColor: "#111", border: "1px solid #222" }}>
                <p className="text-3xl mb-3">📦</p>
                <p className="font-oswald text-lg uppercase tracking-widest">КЕЙСЫ</p>
                <p className="text-xs mt-1" style={{ color: "#888" }}>3 кейса · от 50 монет<br />Предметы с разной редкостью</p>
              </button>
              <button onClick={() => setPage("cube")}
                className="p-5 rounded text-left" style={{ backgroundColor: "#111", border: "1px solid #222" }}>
                <p className="text-3xl mb-3">🎲</p>
                <p className="font-oswald text-lg uppercase tracking-widest">КУБИК</p>
                <p className="text-xs mt-1" style={{ color: "#888" }}>Бросай кость против сервера<br />Победа = ×2 к ставке</p>
              </button>
            </div>

            {/* How to buy */}
            <div className="p-5 rounded" style={{ backgroundColor: "#111", border: "1px solid #222" }}>
              <p className="font-oswald text-lg uppercase tracking-widest mb-4">КАК КУПИТЬ</p>
              {[
                "Выберите товар в магазине",
                "Переведите сумму на карту Сбербанка: 2202 2067 7023 7480",
                "Отправьте скриншот оплаты администратору @Torgreal7",
                "Получите товар в игре",
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-4 mb-3">
                  <span className="font-mono text-xs font-bold flex-shrink-0" style={{ color: "#F97316" }}>0{i + 1}</span>
                  <span className="text-sm" style={{ color: "#888" }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === "shop" && <ShopSection />}
        {page === "cases" && (
          <CasePage user={user} onAuthRequired={() => setShowAuth(true)} onBalanceUpdate={handleBalanceUpdate} />
        )}
        {page === "cube" && (
          <CubePage user={user} onAuthRequired={() => setShowAuth(true)} onBalanceUpdate={handleBalanceUpdate} />
        )}
        {page === "cabinet" && user && (
          <Cabinet user={{ ...user, balance: userBalance }} onLogout={handleLogout} onBalanceUpdate={handleBalanceUpdate} />
        )}
        {page === "cabinet" && !user && (
          <div className="text-center py-16">
            <p className="font-oswald text-xl uppercase tracking-widest mb-4">Необходима авторизация</p>
            <button onClick={() => setShowAuth(true)}
              className="px-6 py-3 rounded font-oswald uppercase tracking-widest text-sm"
              style={{ backgroundColor: "#F97316", color: "#000" }}>
              Войти
            </button>
          </div>
        )}
        {page === "admin" && user?.is_admin && <AdminPanel />}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 flex"
        style={{ backgroundColor: "#0d0d0d", borderTop: "1px solid #1a1a1a", zIndex: 100 }}>
        {navItems.slice(0, 5).map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
            style={{ color: page === n.id ? "#F97316" : "#555" }}>
            <Icon name={n.icon} size={18} />
            <span className="font-oswald text-[9px] uppercase tracking-widest">{n.label}</span>
          </button>
        ))}
        {!user && (
          <button onClick={() => setShowAuth(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
            style={{ color: "#555" }}>
            <Icon name="LogIn" size={18} />
            <span className="font-oswald text-[9px] uppercase tracking-widest">ВОЙТИ</span>
          </button>
        )}
      </nav>
      <div className="md:hidden h-16" />

      {/* Footer */}
      <footer className="hidden md:block py-6 mt-8" style={{ borderTop: "1px solid #1a1a1a" }}>
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <span className="font-oswald text-sm tracking-widest" style={{ color: "#444" }}>
            ☠️ WASTELAND SHOP — Prey Day Survival
          </span>
          <div className="flex gap-4">
            <a href={TG_ADMIN1} target="_blank" rel="noreferrer"
              className="text-xs font-oswald uppercase tracking-widest" style={{ color: "#444" }}>@Torgreal7</a>
            <a href={TG_ADMIN2} target="_blank" rel="noreferrer"
              className="text-xs font-oswald uppercase tracking-widest" style={{ color: "#444" }}>@fuckktokyo</a>
          </div>
        </div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} />}
    </div>
  );
}
