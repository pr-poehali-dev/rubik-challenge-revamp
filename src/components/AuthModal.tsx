import { useState } from "react";
import { login, registerUser } from "@/api";
import type { User } from "@/api";

type Props = {
  onClose: () => void;
  onSuccess: (user: User) => void;
};

const S = {
  overlay: {
    position: "fixed" as const, inset: 0, zIndex: 1000,
    backgroundColor: "rgba(0,0,0,0.85)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "1rem",
  },
  modal: {
    backgroundColor: "#111", border: "1px solid #2a2a2a",
    borderRadius: 4, width: "100%", maxWidth: 400, padding: "2rem",
  },
};

export default function AuthModal({ onClose, onSuccess }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      let user: User;
      if (tab === "login") {
        user = await login(form.email, form.password);
      } else {
        user = await registerUser(form.username, form.email, form.password);
      }
      onSuccess(user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-oswald text-xl uppercase tracking-widest">
            {tab === "login" ? "ВХОД" : "РЕГИСТРАЦИЯ"}
          </h2>
          <button onClick={onClose} style={{ color: "#555", fontSize: 20 }}>✕</button>
        </div>

        {/* Tabs */}
        <div className="flex mb-5" style={{ borderBottom: "1px solid #222" }}>
          {(["login", "register"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(""); }}
              className="flex-1 py-2 font-oswald text-xs uppercase tracking-widest transition-all"
              style={{
                color: tab === t ? "#F97316" : "#555",
                borderBottom: tab === t ? "2px solid #F97316" : "2px solid transparent",
              }}>
              {t === "login" ? "Вход" : "Регистрация"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {tab === "register" && (
            <input
              placeholder="Имя пользователя"
              value={form.username}
              onChange={e => set("username", e.target.value)}
              className="w-full px-3 py-2.5 rounded text-sm outline-none font-mono"
              style={{ backgroundColor: "#1a1a1a", border: "1px solid #333", color: "#e8ddd0" }}
            />
          )}
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={e => set("email", e.target.value)}
            className="w-full px-3 py-2.5 rounded text-sm outline-none font-mono"
            style={{ backgroundColor: "#1a1a1a", border: "1px solid #333", color: "#e8ddd0" }}
          />
          <input
            placeholder="Пароль"
            type="password"
            value={form.password}
            onChange={e => set("password", e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            className="w-full px-3 py-2.5 rounded text-sm outline-none font-mono"
            style={{ backgroundColor: "#1a1a1a", border: "1px solid #333", color: "#e8ddd0" }}
          />
        </div>

        {error && (
          <div className="mt-3 p-3 rounded text-xs" style={{ backgroundColor: "#3a0a0a", color: "#ff6b6b" }}>
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full mt-5 py-3 rounded font-oswald uppercase tracking-widest text-sm transition-all"
          style={{
            backgroundColor: loading ? "#555" : "#F97316",
            color: loading ? "#999" : "#000",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "..." : tab === "login" ? "ВОЙТИ" : "ЗАРЕГИСТРИРОВАТЬСЯ"}
        </button>
      </div>
    </div>
  );
}
