/* Share button: native share sheet on phones, otherwise copy the link. */
(function () {
  'use strict';
  function toast(text) {
    var t = document.getElementById('share-toast');
    if (!t) { t = document.createElement('div'); t.id = 'share-toast'; t.className = 'share-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = text; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function fallbackCopy(url) {
    var ta = document.createElement('textarea');
    ta.value = url; ta.setAttribute('readonly', ''); ta.style.position = 'absolute'; ta.style.left = '-9999px';
    document.body.appendChild(ta); ta.select();
    var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove(); return ok;
  }
  document.querySelectorAll('[data-share]').forEach(function (b) {
    b.addEventListener('click', function () {
      var url = location.protocol.indexOf('http') === 0 ? location.href : 'https://africa-zonal-community-development.github.io/framework-dashboard/' + location.pathname.split('/').pop() + location.hash;
      var data = { title: document.title, text: 'Africa Zonal Community Development Framework — 2026 results', url: url };
      if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        navigator.share(data).catch(function () { /* user closed the share sheet */ });
        return;
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(function () { toast('Link copied — paste it anywhere to share this view.'); },
          function () { toast(fallbackCopy(url) ? 'Link copied.' : 'Copy this link: ' + url); });
      } else {
        toast(fallbackCopy(url) ? 'Link copied — paste it anywhere to share this view.' : 'Copy this link: ' + url);
      }
    });
  });
})();
