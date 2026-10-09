# Online Tic Tac Toe with Flask

## Run locally

1. Install Python 3.10+.
2. Open a terminal in this folder.
3. Run `python -m pip install -r requirements.txt`.
4. Run `python app.py`.
5. Visit http://127.0.0.1:5000 .

## Deploy on Render

1. Push these files to a GitHub repository (preserve the folders).
2. In Render, create a **Web Service** from the GitHub repository.
3. Choose Python, build command `pip install -r requirements.txt`, and start command `gunicorn --workers 1 --threads 8 app:app`.
4. After deploy, open your public Render URL and create a room.
5. Send the room link to another person.

This is a beginner demo: game data is held in server memory and will disappear on restart. Deploy using **one worker and one instance**; for production/multiple instances add persistent shared storage (such as Redis or a database). Old rooms are not automatically deleted. The room token is saved in the browser tab's sessionStorage; keep your original tab open to retain your role. This project uses polling approximately every 1.2 seconds, not WebSockets.
