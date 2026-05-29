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
          <li><a href="profiili.html" class="${currentPage === 'profiili.html' ? 'active' : ''}">Oma Profiili</a></li>
          <li>
            <button class="dropdown-btn">Tietoa kisoista <span class="arrow">▼</span></button>
            <ul class="dropdown-container">
              <li><a href="tietoa.html#pisteytys">Pisteytys</a></li>
              <li><a href="tietoa.html#kaavioinfo">Lohkot & Kaaviot</a></li>
              <li><a href="tietoa.html#maksut">Osallistumismaksu</a></li>
              <li><a href="tietoa.html#oheistoiminta">Sivuaktiviteetit</a></li>
              <li><a href="tietoa.html#kentat">Kentät</a></li>
              <li><a href="tietoa.html#tarjoilu">Ruoka & Juoma</a></li>
              <li><a href="tietoa.html#palkinnot">Voittopalkinnot</a></li>
            </ul>
          </li>
          <li>
            <button class="dropdown-btn">Tietoa meistä <span class="arrow">▼</span></button>
            <ul class="dropdown-container">
              <li><a href="tietoa.html#tarina">LöScaban tarina</a></li>
              <li><a href="tietoa.html#yhteystiedot">Yhteystiedot</a></li>
            </ul>
          </li>
          <li id="menu-tour-item" class="hidden"><a href="turnaus.html" class="${currentPage === 'turnaus.html' ? 'active' : ''}">Turnaussivu 🏸</a></li>
          <li id="menu-admin-item" class="hidden"><a href="admin.html" class="${currentPage === 'admin.html' ? 'active' : ''}" style="color: #e74c3c; font-weight: bold;">Hallinta Paneeli</a></li>
          <li><a href="asetukset.html" class="${currentPage === 'asetukset.html' ? 'active' : ''}">Asetukset</a></li>
          
          <li id="pwa-install-item" style="list-style: none;">
            <button id="pwa-install-btn" style="display: block; width: calc(100% - 40px); background: #e67e22; color: white; margin: 15px auto; padding: 10px; border-radius: 4px; text-align: center; border: none; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2); cursor: pointer;">
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
      if (container) { container.classList.toggle('show'); }
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

document.addEventListener('DOMContentLoaded', buildUIComponents);

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.style.background = '#e67e22';
    installBtn.innerText = 'Asenna sovellus 📱';
  }
});

function setupPWAInstallation() {
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Käyttäjän valinta: ${outcome}`);
        deferredPrompt = null;
      } else {
        alert("LöScaba on valmis asennettavaksi! Jos käytät iOS-laitetta (iPhone/iPad), paina selaimen 'Jaa'-painiketta ja valitse 'Lisää koti-valikkoon'. Androidilla ja Desktoptilla voit asentaa myös suoraan selaimen asetustyökalujen kautta.");
      }
    });
  }

  window.addEventListener('appinstalled', () => {
    console.log('LöScaba asennettu onnistuneesti!');
    deferredPrompt = null;
    if (installBtn) {
      installBtn.style.background = '#2ecc71';
      installBtn.innerText = 'Sovellus asennettu! ✓';
    }
  });
}