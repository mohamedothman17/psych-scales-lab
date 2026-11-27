/* Sets the theme before the first paint so there is no flash. */
(function () {
  var t = '';
  try { t = localStorage.getItem('hub-theme'); } catch (e) {}
  if (t !== 'dark' && t !== 'light') t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  document.documentElement.classList.add('boot');
})();
