"""Кубик: бросок с ставкой, история игр."""
import json, os, random
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
    """Бросок кубика и история."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    sid = headers.get("x-session-id", "")
    method = event.get("httpMethod", "GET")

    conn = get_conn()
    user = get_user(conn, sid)
    if not user:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

    cur = conn.cursor()

    # GET — история игр
    if method == "GET":
        cur.execute(
            "SELECT id, bet, player_roll, server_roll, result, payout, created_at FROM cube_games WHERE user_id=%s ORDER BY created_at DESC LIMIT 30",
            (user["id"],)
        )
        rows = cur.fetchall()
        games = [{"id": r[0], "bet": float(r[1]), "player_roll": r[2], "server_roll": r[3],
                  "result": r[4], "payout": float(r[5]), "created_at": str(r[6])} for r in rows]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"games": games})}

    # POST — бросок
    body = json.loads(event.get("body") or "{}")
    bet = float(body.get("bet", 0))

    if bet <= 0:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите ставку"})}
    if bet > user["balance"]:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Недостаточно средств"})}

    player_roll = random.randint(1, 6)
    server_roll = random.randint(1, 6)

    if player_roll > server_roll:
        result = "win"
        payout = bet * 2
    elif player_roll < server_roll:
        result = "lose"
        payout = 0.0
    else:
        result = "tie"
        payout = bet

    new_balance = user["balance"] - bet + payout

    cur.execute("UPDATE users SET balance=%s WHERE id=%s", (new_balance, user["id"]))
    cur.execute(
        "INSERT INTO cube_games (user_id, bet, player_roll, server_roll, result, payout) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
        (user["id"], bet, player_roll, server_roll, result, payout)
    )
    game_id = cur.fetchone()[0]
    conn.commit()

    return {"statusCode": 200, "headers": CORS, "body": json.dumps({
        "game_id": game_id,
        "player_roll": player_roll,
        "server_roll": server_roll,
        "result": result,
        "bet": bet,
        "payout": payout,
        "new_balance": new_balance
    })}
