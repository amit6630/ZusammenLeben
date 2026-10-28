/* ZusammenLeben: small progressive enhancements, loaded on every page.
   1. Skip link to the main content.  2. Language flags open the same page in the other language. */
(function () {
  var labels = { en: 'Skip to content', de: 'Zum Inhalt springen', uk: 'Перейти до змісту' };
  var lang = (document.documentElement.lang || 'en').slice(0, 2);

  // 1. The first section after the menu is the main content.
  var main = document.querySelector('section.menu ~ section, section.menu1 ~ section');
  if (main) {
    if (!main.id) main.id = 'zl-main';
    main.setAttribute('role', 'main');
    main.setAttribute('tabindex', '-1');
    var skip = document.createElement('a');
    skip.className = 'zl-skip';
    skip.href = '#' + main.id;
    skip.textContent = labels[lang] || labels.en;
    document.body.insertBefore(skip, document.body.firstChild);
  }

  // 2. Every language has the same file names, so swap only the file part of the flag links.
  var page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('a.lang-link').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (/index\.html$/.test(href)) a.setAttribute('href', href.replace(/index\.html$/, page));
  });

  // 3. Swipe rails and scroll boxes (zl.css, phones) must be reachable by keyboard.
  var regionLabel = { en: 'Scrollable list', de: 'Scrollbare Liste', uk: 'Список, який можна прокручувати' };
  var scrollers = '.services-grid, .team-grid, .transparency-grid, .pillars-grid, .three-column-grid, .grid-3, .grid-2, .faq-grid, .survival-grid, .portal-grid-2, .city-directory-grid, .details-cards-stack, .two-column-grid, .levels-grid, .cert-grid, .benefits-grid, .links-grid, .timeline-wrapper, .word-grid, .zl-rail';

  // 4. On phones, long text cards are collapsed behind a "read more" button.
  var more = { en: ['Read more', 'Show less'], de: ['Weiterlesen', 'Weniger anzeigen'], uk: ['Читати далі', 'Згорнути'] }[lang] || ['Read more', 'Show less'];
  var long = '.guide-card, .rule-box, .manifesto-card, .survival-card, .detail-card, .guide-subcard, .region-focus-card, .anna-hero-card, .story-card, .letter-card';
  var n = 0;
  function compact() {
    if (!window.matchMedia('(max-width: 767px)').matches) return;
    document.querySelectorAll(scrollers).forEach(function (el) {
      if (el.scrollWidth > el.clientWidth + 4 || el.scrollHeight > el.clientHeight + 4) {
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'region');
        if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', regionLabel[lang] || regionLabel.en);
      }
    });
    document.querySelectorAll(long).forEach(function (el) {
      if (el.closest('.zl-clamp') || el.querySelector('.zl-clamp') || el.getBoundingClientRect().height < 640) return;
      var id = el.id || 'zl-clamp-' + (++n);
      el.id = id;
      el.classList.add('zl-clamp');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'zl-more-btn';
      b.setAttribute('aria-expanded', 'false');
      b.setAttribute('aria-controls', id);
      b.textContent = more[0];
      b.addEventListener('click', function () {
        var open = el.classList.toggle('is-open');
        b.setAttribute('aria-expanded', String(open));
        b.textContent = open ? more[1] : more[0];
        if (!open) el.scrollIntoView({ block: 'start' });
      });
      el.insertAdjacentElement('afterend', b);
    });
  }
  document.querySelectorAll('.zl-rail').forEach(function (el) {
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'region');
    var h = el.previousElementSibling;
    if (h) el.setAttribute('aria-label', h.textContent.replace(/\s+\d+$/, '').trim());
    railButtons(el);
  });

  // 5. Rails get previous/next buttons, so cards hidden to the side are easy to find.
  function railButtons(rail) {
    var names = { en: ['Previous', 'Next'], de: ['Zurück', 'Weiter'], uk: ['Назад', 'Далі'] }[lang] || ['Previous', 'Next'];
    var wrap = document.createElement('div');
    wrap.className = 'zl-rail-wrap';
    rail.parentNode.insertBefore(wrap, rail);
    wrap.appendChild(rail);
    var btns = [-1, 1].map(function (dir, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'zl-rail-btn ' + (dir < 0 ? 'zl-rail-prev' : 'zl-rail-next');
      b.setAttribute('aria-label', names[i] + ': ' + (rail.getAttribute('aria-label') || ''));
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (dir < 0 ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6') + '"/></svg>';
      b.addEventListener('click', function () { rail.scrollBy({ left: dir * rail.clientWidth * 0.8, behavior: 'smooth' }); });
      wrap.appendChild(b);
      return b;
    });
    function update() {
      btns[0].hidden = rail.scrollLeft < 8;
      btns[1].hidden = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8;
    }
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
  if (document.readyState === 'complete') compact();
  else window.addEventListener('load', compact);
})();
