import os
import secrets
import threading
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
rooms = {}
lock = threading.Lock()
WIN_LINES = ((0, 1, 2), (3, 4, 5), (6, 7, 8),
             (0, 3, 6), (1, 4, 7), (2, 5, 8),
             (0, 4, 8), (2, 4, 6))


def result(board):
    for a, b, c in WIN_LINES:
        if board[a] and board[a] == board[b] == board[c]:
            return board[a]
    if all(board):
        return "tie"
    return None


def state(room):
    return {"board": room["board"], "turn": room["turn"],
            "winner": result(room["board"]),
            "players": len(room["players"])}


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/room/<room_id>")
def room_page(room_id):
    return render_template("index.html")


@app.post("/api/create")
def create():
    token = secrets.token_urlsafe(24)
    with lock:
        room_id = secrets.token_hex(4)
        while room_id in rooms:
            room_id = secrets.token_hex(4)
        rooms[room_id] = {"board": ["" for _ in range(9)], "turn": "X",
                          "players": {"X": token}}
    return jsonify({"room": room_id, "token": token, "symbol": "X"})


@app.post("/api/join/<room_id>")
def join(room_id):
    token = request.get_json(silent=True) or {}
    token = token.get("token")
    with lock:
        room = rooms.get(room_id)
        if not room:
            return jsonify(error="Room not found. It may have expired."), 404
        for symbol, existing in room["players"].items():
            if token and token == existing:
                return jsonify(symbol=symbol, token=token, **state(room))
        if len(room["players"]) >= 2:
            return jsonify(error="This room already has two players."), 403
        token = secrets.token_urlsafe(24)
        room["players"]["O"] = token
        return jsonify(symbol="O", token=token, **state(room))


@app.get("/api/state/<room_id>")
def get_state(room_id):
    with lock:
        room = rooms.get(room_id)
        if not room:
            return jsonify(error="Room not found"), 404
        return jsonify(state(room))


@app.post("/api/move/<room_id>")
def move(room_id):
    payload = request.get_json(silent=True) or {}
    token, square = payload.get("token"), payload.get("square")
    with lock:
        room = rooms.get(room_id)
        if not room:
            return jsonify(error="Room not found"), 404
        symbol = next((symbol for symbol, player_token in room["players"].items()
                       if token and token == player_token), None)
        if symbol is None:
            return jsonify(error="You are not a player in this room"), 403
        if len(room["players"]) < 2:
            return jsonify(error="Waiting for another player"), 400
        if result(room["board"]):
            return jsonify(error="Game has finished"), 400
        if symbol != room["turn"]:
            return jsonify(error="Not your turn"), 400
        if type(square) is not int or not 0 <= square < 9 or room["board"][square]:
            return jsonify(error="Invalid square"), 400
        room["board"][square] = symbol
        room["turn"] = "O" if symbol == "X" else "X"
        return jsonify(state(room))


if __name__ == "__main__":
    app.run(debug=True)
