"""Кейсы: список кейсов с призами, открытие кейса (спин)."""
import json, os, hashlib, secrets, random
import psycopg2

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
        "SELECT u.id, u.balance FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=%s",
        (sid,)
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "balance": float(row[1])}

def handler(event: dict, context) -> dict:
    """Кейсы и спин."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    sid = headers.get("x-session-id", "")
    method = event.get("httpMethod", "GET")

    conn = get_conn()
    cur = conn.cursor()

    # GET — список всех кейсов с призами
    if method == "GET":
        cur.execute("SELECT id, name, price, img_url FROM cases ORDER BY id")
        cases_rows = cur.fetchall()
        result = []
        for c in cases_rows:
            cur.execute("SELECT id, name, emoji, rarity, weight FROM prizes WHERE case_id=%s ORDER BY id", (c[0],))
            prizes = [{"id": p[0], "name": p[1], "emoji": p[2], "rarity": p[3], "weight": p[4]} for p in cur.fetchall()]
            result.append({"id": c[0], "name": c[1], "price": float(c[2]), "img_url": c[3], "prizes": prizes})
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"cases": result})}

    # POST — спин
    user = get_user(conn, sid)
    if not user:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

    body = json.loads(event.get("body") or "{}")
    case_id = int(body.get("case_id", 0))

    cur.execute("SELECT id, price FROM cases WHERE id=%s", (case_id,))
    case_row = cur.fetchone()
    if not case_row:
        return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Кейс не найден"})}

    price = float(case_row[1])
    if user["balance"] < price:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Недостаточно средств"})}

    cur.execute("SELECT id, name, emoji, rarity, weight FROM prizes WHERE case_id=%s", (case_id,))
    prizes = cur.fetchall()
    total_weight = sum(p[4] for p in prizes)
    r = random.uniform(0, total_weight)
    picked = prizes[0]
    for p in prizes:
        r -= p[4]
        if r <= 0:
            picked = p
            break

    client_seed = secrets.token_hex(16)
    seed_hash = hashlib.sha256(client_seed.encode()).hexdigest()

    new_balance = user["balance"] - price
    cur.execute("UPDATE users SET balance=%s WHERE id=%s", (new_balance, user["id"]))
    cur.execute(
        "INSERT INTO spins (user_id, case_id, prize_id, seed_hash, client_seed) VALUES (%s, %s, %s, %s, %s) RETURNING id",
        (user["id"], case_id, picked[0], seed_hash, client_seed)
    )
    spin_id = cur.fetchone()[0]
    conn.commit()

    prize = {"id": picked[0], "name": picked[1], "emoji": picked[2], "rarity": picked[3], "weight": picked[4]}
    return {"statusCode": 200, "headers": CORS, "body": json.dumps({
        "spin_id": spin_id,
        "prize": prize,
        "new_balance": new_balance,
        "seed_hash": seed_hash,
        "client_seed": client_seed
    })}
