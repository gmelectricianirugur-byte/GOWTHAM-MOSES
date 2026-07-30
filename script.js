const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.nav-links');
if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', open);
    menuButton.textContent = open ? '×' : '☰';
  });
}

const gallery = document.querySelector('#work-gallery');
if (gallery) {
  fetch('/api/work').then(response => response.ok ? response.json() : []).then(items => {
    if (!items.length) return;
    gallery.insertAdjacentHTML('afterbegin', items.map(item => item.type === 'video'
      ? `<figure class="work-card"><video src="${item.url}" controls preload="metadata"></video><figcaption><span>${item.category}</span><h3>${item.title}</h3></figcaption></figure>`
      : `<figure class="work-card"><img src="${item.url}" alt="${item.title}"><figcaption><span>${item.category}</span><h3>${item.title}</h3></figcaption></figure>`).join(''));
  }).catch(() => {});
}

const loginModal = document.querySelector('#owner-login');
const loginOpeners = document.querySelectorAll('[data-login-open]');
const loginClosers = document.querySelectorAll('[data-login-close]');
const indexLoginForm = document.querySelector('#index-login-form');
const indexLoginMessage = document.querySelector('#index-login-message');

function setLoginModal(open) {
  if (!loginModal) return;
  loginModal.classList.toggle('hidden', !open);
  loginModal.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('modal-open', open);
  if (open) loginModal.querySelector('input')?.focus();
}

loginOpeners.forEach(opener => opener.addEventListener('click', event => {
  event.preventDefault();
  setLoginModal(true);
}));
loginClosers.forEach(closer => closer.addEventListener('click', () => setLoginModal(false)));

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') setLoginModal(false);
});

indexLoginForm?.addEventListener('submit', async event => {
  event.preventDefault();
  indexLoginMessage.textContent = '';
  try {
    const credentials = Object.fromEntries(new FormData(indexLoginForm));
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const contentType = response.headers.get('content-type') || '';
    const result = contentType.includes('application/json') ? await response.json() : {};
    if (!response.ok) throw new Error(result.error || `Server error (${response.status}).`);
    sessionStorage.setItem('ele-work-owner-token', result.token);
    window.location.href = 'admin.html';
  } catch (error) {
    indexLoginMessage.textContent = error.message || 'Unable to sign in.';
  }
});
