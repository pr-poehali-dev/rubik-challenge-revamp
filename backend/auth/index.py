"""Авторизация: регистрация, вход, выход, получение профиля. v2"""
import json, os, hashlib, secrets
import psycopg2

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def sha256(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()

def get_user_by_session(conn, sid: str):
    cur = conn.cursor()
    cur.execute(
        "SELECT u.id, u.username, u.email, u.is_admin, u.balance "
        "FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = %s",
        (sid,)
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "username": row[1], "email": row[2], "is_admin": row[3], "balance": float(row[4])}

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}

def handler(event: dict, context) -> dict:
    """Обработчик авторизации."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    sid = headers.get("x-session-id", "")

    conn = get_conn()

    # GET /me
    if method == "GET":
        if not sid:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "no session"})}
        user = get_user_by_session(conn, sid)
        if not user:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "invalid session"})}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(user)}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "")

    # POST login
    if action == "login":
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
        cur = conn.cursor()
        cur.execute(
            "SELECT id, username, email, is_admin, balance FROM users WHERE email=%s AND password_hash=%s",
            (email, sha256(password))
        )
        row = cur.fetchone()
        if not row:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный email или пароль"})}
        user_id = row[0]
        new_sid = secrets.token_hex(32)
        cur.execute("INSERT INTO sessions (id, user_id) VALUES (%s, %s)", (new_sid, user_id))
        conn.commit()
        user = {"id": row[0], "username": row[1], "email": row[2], "is_admin": row[3], "balance": float(row[4])}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"session_id": new_sid, "user": user})}

    # POST register
    if action == "register":
        username = body.get("username", "").strip()
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
        if not username or not email or not password:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Заполните все поля"})}
        if len(password) < 6:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Пароль минимум 6 символов"})}
        cur = conn.cursor()
        try:
            cur.execute(
                "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id, username, email, is_admin, balance",
                (username, email, sha256(password))
            )
            row = cur.fetchone()
            user_id = row[0]
            new_sid = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (id, user_id) VALUES (%s, %s)", (new_sid, user_id))
            conn.commit()
            user = {"id": row[0], "username": row[1], "email": row[2], "is_admin": row[3], "balance": float(row[4])}
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"session_id": new_sid, "user": user})}
        except psycopg2.errors.UniqueViolation:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Email или имя уже занято"})}

    # POST logout
    if action == "logout":
        if sid:
            cur = conn.cursor()
            cur.execute("UPDATE sessions SET user_id=user_id WHERE id=%s", (sid,))
            conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "unknown action"})}