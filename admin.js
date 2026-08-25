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
  loginCard.classList.add('hidden');
  dashboard.classList.remove('hidden');
  document.querySelector('#partners-dashboard').classList.remove('hidden');
  loadItems();
  loadPartners();
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

document.querySelector('#partner-form').addEventListener('submit', async event => {
  event.preventDefault();
  const partnerMessage = document.querySelector('#partner-message');
  partnerMessage.textContent = '';
  try {
    const details = Object.fromEntries(new FormData(event.currentTarget));
    await readApiResponse(await fetch('/api/partners', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(details) }));
    partnerMessage.textContent = 'Partner added successfully.';
    event.currentTarget.reset();
    loadPartners();
  } catch (error) {
    partnerMessage.textContent = error.message || 'Could not add partner.';
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

async function loadPartners() {
  const partnerList = document.querySelector('#admin-partners');
  try {
    const partners = await readApiResponse(await fetch('/api/partners'));
    partnerList.innerHTML = partners.map(partner => `<article><strong>${partner.name}</strong><small>${partner.type || 'Partner'}</small><button data-id="${partner.id}">Remove</button></article>`).join('') || '<p>No partners added yet.</p>';
    partnerList.querySelectorAll('button').forEach(button => button.addEventListener('click', async () => {
      if (!confirm('Remove this partner?')) return;
      try {
        await readApiResponse(await fetch(`/api/partners/${button.dataset.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }));
        loadPartners();
      } catch (error) {
        document.querySelector('#partner-message').textContent = error.message || 'Could not remove this partner.';
      }
    }));
  } catch (error) {
    partnerList.innerHTML = `<p>${error.message || 'Unable to load partners.'}</p>`;
  }

  function sendWhatsappNumber() {
    // 1. Get the number value
    const whatsappnumber = document.getElementById('whatsappNumber').value;

    // 2. Define the fixed base URL
    const baseUrl = "https://wa.me/+91";

    // 3. Navigate to the combined URL
    if (whatsappnumber) {
      window.location.href = baseUrl + whatsappnumber;
    } else {
      alert("Please enter a number");
    }
  }
  let timer;
  const IDLE_TIMEOUT = 300; // 5 minutes in seconds

  function resetTimer() {
    clearTimeout(timer);
    timer = setTimeout(logoutUser, IDLE_TIMEOUT * 1000);
  }

  function logoutUser() {
    // Redirect to a logout script or submit a form
    window.location.href = 'logout.php';
  }

  // Attach event listeners to reset the timer on activity
  document.addEventListener('mousemove', resetTimer);
  document.addEventListener('keypress', resetTimer);
  document.addEventListener('load', resetTimer);

  // Start the timer initially
  resetTimer(reloadadmin.html);
}
