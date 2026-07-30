let token = sessionStorage.getItem('ele-work-owner-token');
const loginCard = document.querySelector('#login-card');
const dashboard = document.querySelector('#dashboard');
const message = document.querySelector('#login-message');

function showDashboard() {
  loginCard.classList.add('hidden'); dashboard.classList.remove('hidden'); loadItems();
}
if (token) showDashboard();

document.querySelector('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const details = Object.fromEntries(new FormData(event.currentTarget));
  const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(details) });
  const result = await response.json();
  if (!response.ok) return message.textContent = result.error;
  token = result.token; sessionStorage.setItem('ele-work-owner-token', token); showDashboard();
});

document.querySelector('#upload-form').addEventListener('submit', async event => {
  event.preventDefault();
  const response = await fetch('/api/work', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: new FormData(event.currentTarget) });
  const result = await response.json();
  document.querySelector('#upload-message').textContent = response.ok ? 'Uploaded successfully.' : result.error;
  if (response.ok) { event.currentTarget.reset(); loadItems(); }
});

async function loadItems() {
  const items = await (await fetch('/api/work')).json();
  document.querySelector('#admin-gallery').innerHTML = items.map(item => `<article><strong>${item.title}</strong><small>${item.category}</small><button data-id="${item.id}">Remove</button></article>`).join('') || '<p>No owner uploads yet.</p>';
  document.querySelectorAll('#admin-gallery button').forEach(button => button.addEventListener('click', async () => { if (confirm('Remove this item?')) { await fetch(`/api/work/${button.dataset.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); loadItems(); } }));
}
