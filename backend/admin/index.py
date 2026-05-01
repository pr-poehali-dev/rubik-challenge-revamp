"""Админ-панель: пользователи, депозиты, спины, корректировка баланса. v2"""
import json, os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_admin(conn, sid):
    cur = conn.cursor()
    cur.execute(
        "SELECT u.id, u.is_admin FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=%s",
        (sid,)
    )
    row = cur.fetchone()
    if not row or not row[1]:
        return None
    return {"id": row[0]}

def handler(event: dict, context) -> dict:
    """Панель администратора."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    sid = headers.get("x-session-id", "")
    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "")

    conn = get_conn()
    admin = get_admin(conn, sid)
    if not admin:
        return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Доступ запрещён"})}

    cur = conn.cursor()

    # GET — возвращает всё сразу
    if method == "GET":
        cur.execute("SELECT id, username, email, balance, is_admin, created_at FROM users ORDER BY id")
        users = [{"id": r[0], "username": r[1], "email": r[2], "balance": float(r[3]),
                  "is_admin": r[4], "created_at": str(r[5])} for r in cur.fetchall()]

        cur.execute(
            """SELECT d.id, u.username, d.amount, d.status, d.comment, d.created_at
               FROM deposits d JOIN users u ON u.id=d.user_id ORDER BY d.created_at DESC LIMIT 100"""
        )
        deposits = [{"id": r[0], "username": r[1], "amount": float(r[2]),
                     "status": r[3], "comment": r[4], "created_at": str(r[5])} for r in cur.fetchall()]

        cur.execute(
            """SELECT s.id, u.username, c.name as case_name, p.name as prize, p.emoji, p.rarity, s.is_claimed, s.created_at
               FROM spins s
               JOIN users u ON u.id=s.user_id
               JOIN cases c ON c.id=s.case_id
               JOIN prizes p ON p.id=s.prize_id
               ORDER BY s.created_at DESC LIMIT 100"""
        )
        spins = [{"id": r[0], "username": r[1], "case": r[2], "prize": r[3],
                  "emoji": r[4], "rarity": r[5], "is_claimed": r[6], "created_at": str(r[7])} for r in cur.fetchall()]

        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "users": users, "deposits": deposits, "spins": spins
        })}

    # confirm deposit
    if action == "confirm_deposit":
        dep_id = int(body.get("deposit_id", 0))
        cur.execute("SELECT user_id, amount, status FROM deposits WHERE id=%s", (dep_id,))
        dep = cur.fetchone()
        if not dep:
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Депозит не найден"})}
        if dep[2] != "pending":
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Уже обработан"})}
        cur.execute("UPDATE deposits SET status='confirmed' WHERE id=%s", (dep_id,))
        cur.execute("UPDATE users SET balance=balance+%s WHERE id=%s", (dep[1], dep[0]))
        conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # reject deposit
    if action == "reject_deposit":
        dep_id = int(body.get("deposit_id", 0))
        comment = body.get("comment", "")
        cur.execute("UPDATE deposits SET status='rejected', comment=%s WHERE id=%s", (comment, dep_id))
        conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # adjust balance
    if action == "adjust_balance":
        user_id = int(body.get("user_id", 0))
        delta = float(body.get("delta", 0))
        reason = body.get("reason", "")
        cur.execute("UPDATE users SET balance=balance+%s WHERE id=%s RETURNING balance", (delta, user_id))
        row = cur.fetchone()
        if not row:
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Пользователь не найден"})}
        conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"new_balance": float(row[0])})}

    # claim spin (выдан)
    if action == "claim_spin":
        spin_id = int(body.get("spin_id", 0))
        cur.execute("UPDATE spins SET is_claimed=TRUE WHERE id=%s", (spin_id,))
        conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "unknown action"})}