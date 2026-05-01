import func2url from "../backend/func2url.json";

const AUTH    = func2url.auth;
const BALANCE = func2url.balance;
const CASES   = func2url.cases;
const CUBE    = func2url.cube;
const ADMIN   = func2url.admin;

export type User = {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  balance: number;
};

function getSessionId(): string {
  return localStorage.getItem("pd_session") || "";
}
function setSessionId(id: string) {
  localStorage.setItem("pd_session", id);
}
function clearSession() {
  localStorage.removeItem("pd_session");
}

async function req(url: string, method = "GET", body?: unknown) {
  const sid = getSessionId();
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(sid ? { "X-Session-Id": sid } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  const data = JSON.parse(text);
  if (!res.ok) throw new Error(data.error || "Ошибка сервера");
  return data;
}

// ---- Auth ----
export async function login(email: string, password: string): Promise<User> {
  const d = await req(AUTH, "POST", { action: "login", email, password });
  setSessionId(d.session_id);
  return d.user;
}
export async function registerUser(username: string, email: string, password: string): Promise<User> {
  const d = await req(AUTH, "POST", { action: "register", username, email, password });
  setSessionId(d.session_id);
  return d.user;
}
export async function getMe(): Promise<User | null> {
  try {
    if (!getSessionId()) return null;
    return await req(AUTH, "GET");
  } catch {
    return null;
  }
}
export async function logout() {
  await req(AUTH, "POST", { action: "logout" });
  clearSession();
}

// ---- Balance ----
export async function getBalance(): Promise<{ balance: number; sber_card: string }> {
  return req(BALANCE, "GET");
}
export async function createDeposit(amount: number) {
  return req(BALANCE, "POST", { action: "deposit", amount });
}
export async function getDeposits() {
  return req(BALANCE, "POST", { action: "deposits" });
}
export async function getSpins() {
  return req(BALANCE, "POST", { action: "spins" });
}

// ---- Cases ----
export async function getCases() {
  return req(CASES, "GET");
}
export async function spin(caseId: number) {
  return req(CASES, "POST", { case_id: caseId });
}

// ---- Cube ----
export async function cubeRoll(bet: number) {
  return req(CUBE, "POST", { bet });
}
export async function cubeHistory() {
  return req(CUBE, "GET");
}

// ---- Admin ----
export async function adminGetAll() {
  return req(ADMIN, "GET");
}
export async function adminConfirmDeposit(depositId: number) {
  return req(ADMIN, "POST", { action: "confirm_deposit", deposit_id: depositId });
}
export async function adminRejectDeposit(depositId: number, comment: string) {
  return req(ADMIN, "POST", { action: "reject_deposit", deposit_id: depositId, comment });
}
export async function adminAdjustBalance(userId: number, delta: number, reason: string) {
  return req(ADMIN, "POST", { action: "adjust_balance", user_id: userId, delta, reason });
}
export async function adminClaimSpin(spinId: number) {
  return req(ADMIN, "POST", { action: "claim_spin", spin_id: spinId });
}
