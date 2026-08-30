// Minimal CEMÉA loader and UI logic
document.addEventListener('DOMContentLoaded', async () => {
  const startBtn = document.getElementById('startBtn');
  const app = document.getElementById('app');
  const screen = document.getElementById('screenContent');
  const badgesList = document.getElementById('badgesList');
  const offline = document.getElementById('offline');
  const gpsStatus = document.getElementById('gpsStatus');
  const organizerBtn = document.getElementById('organizerBtn');
  const organizerMenu = document.getElementById('organizerMenu');

  // load config, badges, pack automatically
  let config = {};
  try { config = await fetch('/content/config/cemea-config.json').then(r=>r.json()); } catch(e){ config = {}; }
  let badges = [];
  try { badges = await fetch('/content/config/cemea-badges.json').then(r=>r.json()); } catch(e){ badges = []; }
  let pack = {};
  try { pack = await fetch('/content/packs/cemea-pack.json').then(r=>r.json()); } catch(e){ pack = {}; }

  // render badges
  badgesList.innerHTML = badges.map(b => `<li><span class="emoji">${b.emoji}</span> <strong>${b.name}</strong></li>`).join('');

  // navigationn  document.querySelectorAll('.mini-nav button').forEach(btn=>btn.addEventListener('click', e=>{
    document.querySelectorAll('.mini-nav button').forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    loadScreen(e.target.dataset.screen, pack);
  }));

  organizerBtn.addEventListener('click', ()=> organizerMenu.classList.toggle('hidden'));
  document.getElementById('editTags').addEventListener('click', ()=> alert('Ouvrir éditeur de balises (Google My Maps) — intégration à mettre en place')); 

  startBtn.addEventListener('click', ()=>{
    document.querySelector('.hero').classList.add('hidden');
    app.classList.remove('hidden');
    loadScreen('home', pack);
  });

  // basic screens  function loadScreen(name, pack){
    if (name==='home'){
      screen.innerHTML = `<h2>Bienvenue dans l'édition CEMÉA</h2><p>Pack chargé: ${pack.title || 'CEMÉA'}</p>`;
    } else if (name==='mission'){
      screen.innerHTML = `<h2>Mission</h2><p>${(pack.scenario && pack.scenario.intro) || 'Suivez les balises et collectez des indices.'}</p>`;
    } else if (name==='map'){
      screen.innerHTML = `<h2>Carte</h2><p>Outil carte minimal (intégrer Leaflet/Google Maps si souhaité)</p>`;
    } else if (name==='progress'){
      screen.innerHTML = `<h2>Progression</h2><p>Statut des balises et badges</p>`;
    } else if (name==='help'){
      screen.innerHTML = `<h2>Aide</h2><p>Support GPS, QR, saisie manuelle.</p>`;
    }
  }

  // offline indicator
  function updateOnline(){
    if (navigator.onLine){ offline.classList.remove('offline'); offline.classList.add('online'); offline.textContent = 'En ligne'; }
    else { offline.classList.remove('online'); offline.classList.add('offline'); offline.textContent = 'Hors-ligne'; }
  }
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
  updateOnline();

  // GPS: watch position if available
  if (navigator.geolocation){
    gpsStatus.textContent = 'demande de position...';
    navigator.geolocation.getCurrentPosition(pos => {
      gpsStatus.textContent = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
    }, err => { gpsStatus.textContent = 'indisponible'; }, {timeout:5000});
  } else gpsStatus.textContent = 'non supporté';

  // QR button: open existing qr.js if present, otherwise placeholder
  const qrBtn = document.getElementById('qrBtn');
  if (typeof window.jsQR !== 'undefined' || typeof window.QRCode !== 'undefined' || window.navigator.mediaDevices){
    qrBtn.addEventListener('click', ()=> alert('Lancer le scanner QR (implémentation légère existante dans js/qr.js si activée)'));
  } else {
    qrBtn.addEventListener('click', ()=> alert('Scanner QR non disponible — utilisez saisie manuelle'));
  }
});