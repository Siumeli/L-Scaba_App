// FIREBASE ALUSTUS
const firebaseConfig = {
  apiKey: "AIzaSyA3mlwqFf-hk6_vlk6GMo8bXanmC1MaIqU",
  authDomain: "loscaba-81da2.firebaseapp.com",
  projectId: "loscaba-81da2",
  storageBucket: "loscaba-81da2.firebasestorage.app",
  messagingSenderId: "291152980965",
  appId: "1:291152980965:web:606b9a6c99c8f753b59d0c",
  measurementId: "G-C6VX2Q9RPE"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ELEMENTTIEN HAKU
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const profileBtn = document.getElementById('profile-btn');
const logoHome = document.getElementById('logo-home');
const settingsBtn = document.getElementById('settings-btn');

// Navigaatio-lohkot (Vakio-osiot)
const homeSection = document.getElementById('home-section');
const profileSection = document.getElementById('profile-section');
const tournamentPageSection = document.getElementById('tournament-page-section');

// Profiilinapin alaiset erilliset lomakeikkunat
const authSection = document.getElementById('auth-section');
const loginBox = document.getElementById('login-box');
const registerBox = document.getElementById('register-box');
const adminPanel = document.getElementById('admin-panel');

// APPI-TILA (State)
let currentUser = null;
let activeTournament = null;

// CENTRAL REIPAS NAVIGATION (Pitää osiot erillään)
function showSection(targetSection) {
  // Piilotetaan kaikki 3 pääosiota
  homeSection.classList.add('hidden');
  profileSection.classList.add('hidden');
  tournamentPageSection.classList.add('hidden');
  
  // Piilotetaan myös erillinen auth-kortti varmuuden vuoksi
  authSection.classList.add('hidden');

  // Näytetään vain valittu osio
  targetSection.classList.remove('hidden');
}

// SIVUPALKKI & YLÄPALKKI LOGIIKKA
document.querySelectorAll('.dropdown-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.parentElement.classList.toggle('active');
  });
});

function toggleSidebar() {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
}
menuBtn.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);

// Klikkaamalla logoa palataan puhtaalle Etusivulle
logoHome.addEventListener('click', () => {
  showSection(homeSection);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Asetukset-painikkeen kuuntelija
settingsBtn.addEventListener('click', () => {
  alert("Asetukset-osio laajenee pian sovelluksen päivitysten myötä!");
  toggleSidebar();
});

// LOMAKKEIDEN VAIHDOT (Auth sisällä)
document.getElementById('go-to-register').addEventListener('click', (e) => {
  e.preventDefault();
  loginBox.classList.add('hidden');
  registerBox.classList.remove('hidden');
});

document.getElementById('go-to-login').addEventListener('click', (e) => {
  e.preventDefault();
  registerBox.classList.add('hidden');
  loginBox.classList.remove('hidden');
});

// PROFIILINAPIN KLIKKAUS (Pitää oman asiansa erillään muista)
profileBtn.addEventListener('click', () => {
  if (!currentUser) {
    // Jos ei kirjautunut, avataan kirjautumislaatikko (piilotetaan pääosiot alta)
    homeSection.classList.add('hidden');
    profileSection.classList.add('hidden');
    tournamentPageSection.classList.add('hidden');
    authSection.classList.remove('hidden');
  } else {
    // Jos kirjautunut, siirrytään suoraan profiilinäkymään
    showSection(profileSection);
  }
});

// FIREBASE AUTH-KUUNTELIJA
auth.onAuthStateChanged(user => {
  if (user) {
    db.collection("users").doc(user.uid).get().then(doc => {
      if (doc.exists) {
        currentUser = doc.data();
        currentUser.uid = user.uid;
        updateUI();
      } else {
        handleMissingFirestoreDoc(user);
      }
    }).catch(error => console.error("Virhe ladattaessa käyttäjää:", error));
  } else {
    currentUser = null;
    updateUI();
  }
});

// KIRJAUTUMISLOGIIKAT (Sähköposti)
document.getElementById('submit-login').addEventListener('click', () => {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;
  const rememberMe = document.getElementById('remember-me').checked;

  const persistence = rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;

  auth.setPersistence(persistence).then(() => {
    return auth.signInWithEmailAndPassword(email, pass);
  }).then(() => {
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    showSection(profileSection); // Siirretään profiiliin kirjautumisen jälkeen
  }).catch(error => alert("Kirjautumisvirhe: " + error.message));
});

// REKISTERÖITYMINEN (Sähköposti)
document.getElementById('submit-register').addEventListener('click', () => {
  const firstname = document.getElementById('reg-firstname').value.trim();
  const lastname = document.getElementById('reg-lastname').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-password').value;

  if (!firstname || !lastname || !email || !pass) {
    alert('Täytä kaikki kentät!');
    return;
  }

  auth.createUserWithEmailAndPassword(email, pass).then(cred => {
    const userData = { firstname, lastname, email, role: "user", group: "asiakas" };
    return db.collection("users").doc(cred.user.uid).set(userData);
  }).then(() => {
    document.getElementById('reg-firstname').value = '';
    document.getElementById('reg-lastname').value = '';
    document.getElementById('reg-email').value = '';
    document.getElementById('reg-password').value = '';
    showSection(profileSection);
  }).catch(error => alert("Rekisteröintivirhe: " + error.message));
});

// GOOGLE KIRJAUTUMISET
const googleProvider = new firebase.auth.GoogleAuthProvider();
document.getElementById('google-login').addEventListener('click', () => {
  auth.signInWithPopup(googleProvider).then(() => showSection(profileSection)).catch(error => alert(error.message));
});
document.getElementById('google-register').addEventListener('click', () => {
  auth.signInWithPopup(googleProvider).then(() => showSection(profileSection)).catch(error => alert(error.message));
});

function handleMissingFirestoreDoc(user) {
  const displayName = user.displayName || "";
  const nameParts = displayName.split(" ");
  const defaultFirst = nameParts[0] || "";
  const defaultLast = nameParts.slice(1).join(" ") || "";

  const firstname = prompt("Syötä etunimesi LöScaba-profiilia varten:", defaultFirst);
  const lastname = prompt("Syötä sukunimesi LöScaba-profiilia varten:", defaultLast);

  if (!firstname || !lastname) {
    alert("Nimet ovat pakollisia.");
    auth.signOut();
    return;
  }

  const userData = { firstname, lastname, email: user.email, role: "user", group: "asiakas" };
  db.collection("users").doc(user.uid).set(userData).then(() => {
    currentUser = userData;
    currentUser.uid = user.uid;
    updateUI();
    showSection(profileSection);
  });
}

// ULOSKIRJAUTUMINEN
document.getElementById('logout-btn').addEventListener('click', () => {
  auth.signOut().then(() => {
    currentUser = null;
    updateUI();
    showSection(homeSection); // Palataan etusivulle
  });
});

// KÄYTTÖLIITTYMÄN PÄIVITYS
function updateUI() {
  if (currentUser) {
    profileBtn.innerText = `${currentUser.firstname}`;
    document.getElementById('profile-name').innerText = `${currentUser.firstname} ${currentUser.lastname}`;
    document.getElementById('role-badge').innerText = currentUser.role.toUpperCase();
    
    const kisaBox = document.querySelector('.kisa-info-box');
    if (currentUser.viimeisinKisa) {
      kisaBox.innerHTML = `
        <h3>Viimeisin LöScaba kisasi</h3>
        <p><strong>Kisa:</strong> ${currentUser.viimeisinKisa}</p>
        <div class="kisa-grid">
          <div class="kisa-status">
            <h4>Kaksinpeli (Singeli)</h4>
            <p>Luokka: <span>${currentUser.singeliLuokka || '-'}</span></p>
            <p>Sijoitus: <span>${currentUser.singeliSijoitus || '-'}</span></p>
          </div>
          <div class="kisa-status">
            <h4>Nelinpeli</h4>
            <p>Osallistunut: <span>${currentUser.nelinpeli || 'Ei'}</span></p>
            <p>Sijoitus: <span>${currentUser.nelinpeliSijoitus || '-'}</span></p>
          </div>
        </div>
      `;
    } else {
      kisaBox.innerHTML = `
        <h3>Viimeisin LöScaba kisasi</h3>
        <p style="color: #666; font-style: italic; margin-top: 10px;">Ei kisoja tallennettuna.</p>
      `;
    }

    if (currentUser.role === 'admin') {
      adminPanel.classList.remove('hidden');
      setupAdminListener();
    } else {
      adminPanel.classList.add('hidden');
    }
  } else {
    profileBtn.innerText = "Kirjaudu";
    adminPanel.classList.add('hidden');
  }
  renderTournamentDisplay();
}

// REAALIAIKAINEN TURNAUKSEN KUUNTELU FIRESTORESTA
db.collection("tournaments").doc("active").onSnapshot(doc => {
  if (doc.exists && doc.data().published) {
    activeTournament = doc.data();
  } else {
    activeTournament = null;
  }
  renderTournamentDisplay();
});

// ETUSIVUN TULOSTUS (Hieno tyhjä ilmoitus vs kortti)
function renderTournamentDisplay() {
  const displayContainer = document.getElementById('tournament-display');
  
  if (!activeTournament) {
    displayContainer.innerHTML = `
      <div class="empty-tournament-container">
        <div class="empty-tournament-icon">🏸</div>
        <h2>Ei käynnissä olevia kisoja</h2>
        <p>Tällä hetkellä ei ole avoimia LöScaba-turnauksia. Seuraa ilmoituksia, uusi kisa julkaistaan pian!</p>
      </div>
    `;
    return;
  }

  const isMember = currentUser && currentUser.group === 'jäsen';

  displayContainer.innerHTML = `
    <div class="card">
      <img src="${activeTournament.image}" alt="Turnauskuva" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;">
      <h2>${activeTournament.name}</h2>
      <p style="margin: 10px 0 20px 0; color: #444; line-height: 1.5;">${activeTournament.desc}</p>
      
      <div class="kisa-info-box" style="background-color: #f5f5f7; margin-bottom: 20px;">
        <h3>Osallistumismaksu</h3>
        <p style="${!isMember ? 'font-weight: bold;' : 'color: #666;'}">Asiakkaat: ${activeTournament.priceCustomer}</p>
        <p style="${isMember ? 'font-weight: bold;' : 'color: #666;'}">Jäsenet: ${activeTournament.priceMember} ${isMember ? '<span class="badge" style="background-color:#4aa3df; margin-left:5px;">Sinun hintasi</span>' : ''}</p>
      </div>
      
      <button class="btn btn-primary" onclick="joinTournament()">Ilmoittaudu kisaan mukaan</button>
    </div>
  `;
}

// TURNAUKSEN JULKAISU ADMINILTA
document.getElementById('submit-tournament').addEventListener('click', () => {
  const name = document.getElementById('tour-name').value.trim();
  const image = document.getElementById('tour-image').value.trim();
  const desc = document.getElementById('tour-desc').value.trim();
  const priceCustomer = document.getElementById('tour-price-customer').value.trim();
  const priceMember = document.getElementById('tour-price-member').value.trim();

  if (!name || !desc || !priceCustomer || !priceMember) {
    alert("Täytä pakolliset kentät!");
    return;
  }

  db.collection("tournaments").doc("active").set({
    name, image: image || "https://via.placeholder.com/600x300?text=LöScaba", desc, priceCustomer, priceMember, published: true
  }).then(() => {
    alert("Uusi LöScaba julkaistu etusivulle!");
    document.getElementById('tour-name').value = '';
    document.getElementById('tour-image').value = '';
    document.getElementById('tour-desc').value = '';
    document.getElementById('tour-price-customer').value = '';
    document.getElementById('tour-price-member').value = '';
  }).catch(error => alert("Virhe luonnissa: " + error.message));
});

window.joinTournament = function() {
  if (!currentUser) {
    alert("Kirjaudu sisään ilmoittautuaksesi!");
    profileBtn.click();
  } else {
    alert(`Ilmoittautuminen vastaanotettu, ${currentUser.firstname}!`);
  }
};

// ADMIN REAALIAIKAINEN KÄYTTÄJÄKUUNTELIJA
let adminListenerUnsubscribe = null;
function setupAdminListener() {
  if (adminListenerUnsubscribe) adminListenerUnsubscribe();
  adminListenerUnsubscribe = db.collection("users").onSnapshot(snapshot => {
    const tbody = document.querySelector('#users-table tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    snapshot.forEach(doc => {
      const user = doc.data();
      const userId = doc.id;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.firstname} ${user.lastname}</td>
        <td>${user.email}</td>
        <td><span class="badge">${user.role}</span></td>
        <td><strong>${user.group}</strong></td>
        <td>
          <button class="action-btn" onclick="toggleUserGroup('${userId}', '${user.group}')">Muuta ryhmää</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}

window.toggleUserGroup = function(userId, currentGroup) {
  const newGroup = (currentGroup === 'asiakas') ? 'jäsen' : 'asiakas';
  db.collection("users").doc(userId).update({ group: newGroup });
};