const firebaseConfig = {
  apiKey: "AIzaSyA3mlwqFf-hk6_vlk6GMo8bXanmC1MaIqU",
  authDomain: "loscaba-81da2.firebaseapp.com",
  projectId: "loscaba-81da2",
  storageBucket: "loscaba-81da2.firebasestorage.app",
  messagingSenderId: "291152980965",
  appId: "1:291152980965:web:606b9a6c99c8f753b59d0c",
  measurementId: "G-C6VX2Q9RPE"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const auth = firebase.auth();
const db = firebase.firestore();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(err => console.log("SW Error", err));
}

let currentUser = null;
let currentLang = localStorage.getItem('loscaba_lang') || 'fi';

// 1. RAKENNETAAN KOMPONENTIT DYNAAMISESTI
function buildUIComponents() {
  const navPlaceholder = document.getElementById('navbar-placeholder');
  const sidePlaceholder = document.getElementById('sidebar-placeholder');
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  if (navPlaceholder) {
    navPlaceholder.innerHTML = `
      <header class="navbar">
        <div class="nav-left">
          <button id="menu-btn" class="menu-btn">☰</button>
          <div class="logo" onclick="window.location.href='index.html'">LöScaba</div>
        </div>
        <div class="nav-right">
          <button id="lang-btn" class="lang-btn">${currentLang === 'fi' ? 'EN' : 'FI'}</button>
          <button id="profile-btn" class="profile-nav-btn" onclick="window.location.href='profiili.html'">Kirjaudu</button>
        </div>
      </header>
    `;
  }

  if (sidePlaceholder) {
    sidePlaceholder.innerHTML = `
      <div id="sidebar" class="sidebar">
        <div class="sidebar-brand">LöScaba Menu</div>
        <ul class="sidebar-menu">
          <li><a href="index.html" class="${currentPage === 'index.html' ? 'active' : ''}">Etusivu</a></li>
          <li>
            <button class="dropdown-btn">Tietoa kisoista <span class="arrow">▼</span></button>
            <ul class="dropdown-container">
              <li><a href="tietoa.html#pisteytys">Pisteytys</a></li>
              <li><a href="tietoa.html#kaavioinfo">Lohkot & Kaaviot</a></li>
              <li><a href="tietoa.html#maksut">Osallistumismaksu</a></li>
              <li><a href="tietoa.html#oheistoiminta">Sivuaktiviteetit</a></li>
            </ul>
          </li>
          <li>
            <button class="dropdown-btn">Tietoa meistä <span class="arrow">▼</span></button>
            <ul class="dropdown-container">
              <li><a href="tietoa.html#kentat">Kentät</a></li>
              <li><a href="tietoa.html#tarjoilu">Ruoka & Juoma</a></li>
              <li><a href="tietoa.html#palkinnot">Voittopalkinnot</a></li>
              <li><a href="tietoa.html#yhteystiedot">Yhteystiedot</a></li>
            </ul>
          </li>
          <li><a href="profiili.html" class="${currentPage === 'profiili.html' ? 'active' : ''}">Oma Profiili</a></li>
          <li id="menu-tour-item" class="hidden"><a href="turnaus.html" class="${currentPage === 'turnaus.html' ? 'active' : ''}">Turnaussivu 🏸</a></li>
          <li id="menu-admin-item" class="hidden"><a href="admin.html" class="${currentPage === 'admin.html' ? 'active' : ''}" style="color: #e74c3c; font-weight: bold;">Admin Paneeli</a></li>
          <li><a href="asetukset.html" class="${currentPage === 'asetukset.html' ? 'active' : ''}">Asetukset</a></li>
          
          <li id="pwa-install-item" class="hidden" style="list-style: none;">
            <button id="pwa-install-btn" style="display: block; width: calc(100% - 40px); background: #3498db; color: white; margin: 15px auto; padding: 10px; border-radius: 4px; text-align: center; border: none; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2); cursor: pointer;">
              Asenna sovellus 📱
            </button>
          </li>
        </ul>
      </div>
      <div id="overlay" class="overlay"></div>
    `;
  }

  bindComponentEvents();
  setupPWAInstallation();
}

// 2. LIITETÄÄN TAPAHTUMANKUUNTELIJAT KOMPONENTTEIHIN
function bindComponentEvents() {
  const menuBtn = document.getElementById('menu-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const langBtn = document.getElementById('lang-btn');

  if (menuBtn && sidebar && overlay) {
    const toggle = () => { sidebar.classList.toggle('open'); overlay.classList.toggle('show'); };
    menuBtn.addEventListener('click', toggle);
    overlay.addEventListener('click', toggle);
  }

  document.querySelectorAll('.dropdown-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      this.classList.toggle('open-menu');
      const container = this.nextElementSibling;
      if (container) {
        container.classList.toggle('show');
      }
    });
  });

  if (langBtn) {
    langBtn.addEventListener('click', () => {
      currentLang = currentLang === 'fi' ? 'en' : 'fi';
      localStorage.setItem('loscaba_lang', currentLang);
      window.location.reload();
    });
  }
}

// 3. REAALIAIKAINEN KIRJAUTUMISTILAN SEURANTA
auth.onAuthStateChanged(user => {
  const menuTour = document.getElementById('menu-tour-item');
  const menuAdmin = document.getElementById('menu-admin-item');
  const profileBtn = document.getElementById('profile-btn');

  if (user) {
    db.collection("users").doc(user.uid).get().then(doc => {
      if (doc.exists) {
        currentUser = doc.data();
        currentUser.uid = user.uid;
        
        if (currentUser.theme === 'dark') document.body.classList.add('dark-mode');
        if (profileBtn) profileBtn.innerText = `${currentUser.firstname}`;

        if (currentUser.role === 'admin') {
          if (menuAdmin) menuAdmin.classList.remove('hidden');
          if (menuTour) menuTour.classList.remove('hidden');
        } else {
          if (menuAdmin) menuAdmin.classList.add('hidden');
        }

        if (currentUser.role !== 'admin') {
          db.collection("tournaments").doc("active").collection("participants").doc(currentUser.uid).onSnapshot(pDoc => {
            if (pDoc.exists && pDoc.data().status === 'approved') {
              if (menuTour) menuTour.classList.remove('hidden');
            } else {
              if (menuTour) menuTour.classList.add('hidden');
            }
            if (typeof checkUserRegistration === 'function') checkUserRegistration();
          });
        }

        if (typeof initProfilePage === 'function') initProfilePage();
        if (typeof initTournamentPage === 'function') initTournamentPage();
        if (typeof initAdminPage === 'function') initAdminPage();
        if (typeof initAsetuksetPage === 'function') initAsetuksetPage();
        if (typeof initHomePage === 'function') initHomePage();
      }
    });
  } else {
    currentUser = null;
    if (profileBtn) profileBtn.innerText = currentLang === 'fi' ? "Kirjaudu" : "Login";
    if (menuTour) menuTour.classList.add('hidden');
    if (menuAdmin) menuAdmin.classList.add('hidden');
    
    if (typeof initProfilePage === 'function') initProfilePage();
    if (typeof initHomePage === 'function') initHomePage();
  }
});

// Suoritetaan heti kun DOM on valmis
document.addEventListener('DOMContentLoaded', buildUIComponents);

// PWA ASENNUSLOGIIKKA
let deferredPrompt;

// Kuunnellaan asennusvalmiutta globaalisti, koska sivu latautuu ennen kuin UI-komponentit välttämättä valmistuvat
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Jos UI on jo ehditty rakentaa, näytetään nappi heti
  const installItem = document.getElementById('pwa-install-item');
  if (installItem) {
    installItem.classList.remove('hidden');
  }
});

function setupPWAInstallation() {
  const installItem = document.getElementById('pwa-install-item');
  const installBtn = document.getElementById('pwa-install-btn');

  // Jos asennustapahtuma napattiin jo ennen kuin tämä funktio suoritettiin, näytetään nappi
  if (deferredPrompt && installItem) {
    installItem.classList.remove('hidden');
  }

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Käyttäjän valinta: ${outcome}`);
      
      deferredPrompt = null;
      if (installItem) {
        installItem.classList.add('hidden');
      }
    });
  }

  window.addEventListener('appinstalled', () => {
    console.log('LöScaba asennettu onnistuneesti!');
    deferredPrompt = null;
    if (installItem) {
      installItem.classList.add('hidden');
    }
  });
}