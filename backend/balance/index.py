"""Баланс: получить, создать депозит, список депозитов, история спинов. v2"""
import json, os
import psycopg2

SBER_CARD = "2202 2067 7023 7480"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user(conn, sid):
    cur = conn.cursor()
    cur.execute(
        "SELECT u.id, u.username, u.is_admin, u.balance FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=%s",
        (sid,)
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "username": row[1], "is_admin": row[2], "balance": float(row[3])}

def handler(event: dict, context) -> dict:
    """Управление балансом и депозитами."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    sid = headers.get("x-session-id", "")
    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "")

    conn = get_conn()
    user = get_user(conn, sid)
    if not user:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

    cur = conn.cursor()

    # GET balance
    if method == "GET":
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "balance": user["balance"],
            "sber_card": SBER_CARD
        })}

    # create deposit
    if action == "deposit":
        amount = float(body.get("amount", 0))
        if amount < 1:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Минимум 1 рубль"})}
        cur.execute(
            "INSERT INTO deposits (user_id, amount) VALUES (%s, %s) RETURNING id",
            (user["id"], amount)
        )
        dep_id = cur.fetchone()[0]
        conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "deposit_id": dep_id,
            "amount": amount,
            "message": f"Переведите {amount} руб. на карту {SBER_CARD} и отправьте скриншот администратору @Torgreal7"
        })}

    # list deposits
    if action == "deposits":
        cur.execute(
            "SELECT id, amount, status, comment, created_at FROM deposits WHERE user_id=%s ORDER BY created_at DESC",
            (user["id"],)
        )
        rows = cur.fetchall()
        deposits = [{"id": r[0], "amount": float(r[1]), "status": r[2], "comment": r[3], "created_at": str(r[4])} for r in rows]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"deposits": deposits})}

    # list spins
    if action == "spins":
        cur.execute(
            """SELECT s.id, c.name as case_name, p.name as prize_name, p.emoji, p.rarity,
                      cs.price as cost, s.seed_hash, s.client_seed, s.is_claimed, s.created_at
               FROM spins s
               JOIN cases c ON c.id = s.case_id
               JOIN prizes p ON p.id = s.prize_id
               JOIN cases cs ON cs.id = s.case_id
               WHERE s.user_id=%s ORDER BY s.created_at DESC LIMIT 50""",
            (user["id"],)
        )
        rows = cur.fetchall()
        spins = [{
            "id": r[0], "case": r[1], "prize": r[2], "emoji": r[3], "rarity": r[4],
            "cost": float(r[5]), "seed_hash": r[6], "client_seed": r[7],
            "is_claimed": r[8], "created_at": str(r[9])
        } for r in rows]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"spins": spins})}

    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "unknown action"})}