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
