let token = sessionStorage.getItem('ele-work-owner-token');
const loginCard = document.querySelector('#login-card');
const dashboard = document.querySelector('#dashboard');
const message = document.querySelector('#login-message');

async function readApiResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : {};
  if (!response.ok) throw new Error(body.error || `Server error (${response.status}). Please try again.`);
  return body;
}

function showDashboard() {
  loginCard.classList.add('hidden'); dashboard.classList.remove('hidden'); loadItems();
}
if (token) showDashboard();

document.querySelector('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  message.textContent = '';
  try {
    const details = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(details) });
    const result = await readApiResponse(response);
    token = result.token;
    sessionStorage.setItem('ele-work-owner-token', token);
    showDashboard();
  } catch (error) {
    message.textContent = error.message || 'Unable to reach the server.';
  }
});

document.querySelector('#upload-form').addEventListener('submit', async event => {
  event.preventDefault();
  const uploadMessage = document.querySelector('#upload-message');
  uploadMessage.textContent = '';
  try {
    const response = await fetch('/api/work', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: new FormData(event.currentTarget) });
    await readApiResponse(response);
    uploadMessage.textContent = 'Uploaded successfully.';
    event.currentTarget.reset();
    loadItems();
  } catch (error) {
    uploadMessage.textContent = error.message || 'Upload failed.';
  }
});

async function loadItems() {
  const gallery = document.querySelector('#admin-gallery');
  try {
    const items = await readApiResponse(await fetch('/api/work'));
    gallery.innerHTML = items.map(item => `<article><strong>${item.title}</strong><small>${item.category}</small><button data-id="${item.id}">Remove</button></article>`).join('') || '<p>No owner uploads yet.</p>';
    document.querySelectorAll('#admin-gallery button').forEach(button => button.addEventListener('click', async () => {
      if (!confirm('Remove this item?')) return;
      try {
        await readApiResponse(await fetch(`/api/work/${button.dataset.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }));
        loadItems();
      } catch (error) {
        document.querySelector('#upload-message').textContent = error.message || 'Could not remove this item.';
      }
    }));
  } catch (error) {
    gallery.innerHTML = `<p>${error.message || 'Unable to load uploads.'}</p>`;
  }
}
