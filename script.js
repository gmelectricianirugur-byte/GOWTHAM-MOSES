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

const partnerList = document.querySelector('#partner-list');
if (partnerList) {
  fetch('/api/partners').then(response => response.ok ? response.json() : []).then(partners => {
    partnerList.innerHTML = partners.map((partner, index) => {
      const links = [['Instagram', partner.instagramUrl], ['WhatsApp', partner.whatsappUrl], ['YouTube', partner.youtubeUrl]]
        .filter(([, url]) => url)
        .map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener">${label} &#8599;</a>`).join('');
      const initial = partner.name.charAt(0).toUpperCase();
      const primaryUrl = [partner.instagramUrl, partner.whatsappUrl, partner.youtubeUrl].find(Boolean);
      return `<article class="partner-card"><div class="partner-number">${String(index + 1).padStart(2, '0')}</div><div class="partner-logo orange">${initial}</div><div class="partner-info"><p class="partner-type">${partner.type}</p><h2>${partner.name}</h2><p>${partner.description || 'A trusted ELE Work partner.'}</p><div class="partner-meta"><span>${partner.location ? `&#128205; ${partner.location}` : ''}</span>${links}</div></div>${primaryUrl ? `<a class="round-arrow" href="${primaryUrl}" target="_blank" rel="noopener" aria-label="Visit ${partner.name}">&#8599;</a>` : ''}</article>`;
    }).join('');
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
