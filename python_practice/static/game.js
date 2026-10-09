const statusEl = document.querySelector('#status');
const createBtn = document.querySelector('#create');
const gameEl = document.querySelector('#game');
const boardEl = document.querySelector('#board');
const symbolEl = document.querySelector('#symbol');
const linkEl = document.querySelector('#link');
let roomId = location.pathname.split('/')[2];
let playerToken = null;
let mySymbol = null;
let pollTimer = null;

async function api(path, options = {}) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function post(path, data = {}) {
  return api(path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
}

function draw(state) {
  const finished = Boolean(state.winner);
  boardEl.replaceChildren();
  state.board.forEach((mark, i) => {
    const btn = document.createElement('button');
    btn.className = 'square';
    btn.textContent = mark;
    btn.setAttribute('aria-label', `Square ${i + 1}${mark ? ': ' + mark : ''}`);
    btn.disabled = Boolean(mark) || finished || state.players < 2 || state.turn !== mySymbol;
    btn.addEventListener('click', async () => {
      try { draw(await post(`/api/move/${roomId}`, {token: playerToken, square: i})); }
      catch (error) { statusEl.textContent = error.message; }
    });
    boardEl.append(btn);
  });
  if (state.winner === 'tie') statusEl.textContent = "It's a tie!";
  else if (state.winner) statusEl.textContent = state.winner === mySymbol ? 'You win! 🎉' : 'Your friend wins!';
  else if (state.players < 2) statusEl.textContent = 'Waiting for your friend to join…';
  else statusEl.textContent = state.turn === mySymbol ? 'Your turn!' : "Your friend's turn…";
}

function start() {
  gameEl.hidden = false;
  createBtn.hidden = true;
  symbolEl.textContent = mySymbol;
  linkEl.value = `${location.origin}/room/${roomId}`;
  history.replaceState(null, '', `/room/${roomId}`);
  refresh();
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(refresh, 1200);
}

async function refresh() {
  try { draw(await api(`/api/state/${roomId}`)); }
  catch (error) { statusEl.textContent = error.message; }
}

createBtn.addEventListener('click', async () => {
  try {
    const data = await post('/api/create');
    roomId = data.room; playerToken = data.token; mySymbol = data.symbol;
    sessionStorage.setItem(`ttt:${roomId}`, playerToken);
    start();
  } catch (error) { statusEl.textContent = error.message; }
});

document.querySelector('#copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(linkEl.value); statusEl.textContent = 'Link copied!'; }
  catch { linkEl.select(); statusEl.textContent = 'Select and copy the link above.'; }
});

if (roomId) {
  (async () => {
    try {
      const existingToken = sessionStorage.getItem(`ttt:${roomId}`);
      const data = await post(`/api/join/${roomId}`, {token: existingToken});
      playerToken = data.token; mySymbol = data.symbol;
      sessionStorage.setItem(`ttt:${roomId}`, playerToken);
      start();
    } catch (error) { statusEl.textContent = error.message; }
  })();
}
