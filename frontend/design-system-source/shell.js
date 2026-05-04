// Shared shell — included by every page
(function(){
  const PAGES = [
    { group: 'Design system', items: [
      { href: 'index.html', label: 'Overview' },
      { href: 'tokens.html', label: 'Tokens' },
      { href: 'components.html', label: 'Components' },
    ]},
    { group: 'Auth', items: [
      { href: 'auth.html', label: 'Sign up · Sign in' },
    ]},
    { group: 'Pro workspace', items: [
      { href: 'dashboard.html', label: 'Tableau de bord' },
      { href: 'dossiers.html', label: 'Dossiers' },
      { href: 'dossier-detail.html', label: 'Dossier · détail' },
      { href: 'annonces.html', label: 'Annonces' },
      { href: 'annonce-detail.html', label: 'Annonce · détail' },
      { href: 'calendar.html', label: 'Calendrier & tâches' },
    ]},
  ];

  const here = (location.pathname.split('/').pop() || 'index.html').replace(/^$/, 'index.html');
  let activeLabel = 'Atlasia';
  const navHTML = PAGES.map(g => `
    <div class="nav-group-label">${g.group}</div>
    ${g.items.map(it => {
      const on = it.href === here;
      if (on) activeLabel = it.label;
      return `<a class="nav-item ${on ? 'active' : ''}" href="${it.href}">${it.label}</a>`;
    }).join('')}
  `).join('');

  const main = document.body.firstElementChild;
  const pageHTML = main ? main.outerHTML : '';
  document.body.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <a href="index.html" style="text-decoration:none;color:inherit;">
          <div class="brand">
            <div class="brand-mark">A</div>
            <div class="brand-name">Atlasia</div>
          </div>
        </a>
        ${navHTML}
        <div style="margin-top: 28px; padding: 14px; border: 1px solid var(--divider); border-radius: 12px; background: var(--surface-2);">
          <div class="label-eyebrow" style="margin:0 0 6px;">Tip</div>
          <div class="muted" style="font-size: 12px; line-height: 1.45;">Toggle Light / Dark in the top right. Each screen page also shows iOS · Android · Web variants.</div>
        </div>
      </aside>
      <main>
        <div class="topbar">
          <h1>${activeLabel}</h1>
          <div class="spacer"></div>
          <div class="toggle" id="theme-toggle">
            <button data-theme-set="light">Light</button>
            <button data-theme-set="dark">Dark</button>
          </div>
        </div>
        <div class="page">${pageHTML}</div>
      </main>
    </div>`;

  const saved = localStorage.getItem('atlasia-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  document.querySelectorAll('#theme-toggle button').forEach(b => {
    b.classList.toggle('on', b.dataset.themeSet === saved);
    b.addEventListener('click', () => {
      const t = b.dataset.themeSet;
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem('atlasia-theme', t);
      document.querySelectorAll('#theme-toggle button').forEach(x => x.classList.toggle('on', x === b));
    });
  });
})();
