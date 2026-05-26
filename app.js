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

// KIELIKÄÄNNÖKSET (Sanakirja)
const translations = {
  fi: {
    nav_login: "Kirjaudu", menu_info: "Tietoa kisoista", menu_scoring: "Pisteytys", menu_brackets: "Lohkot",
    menu_fee: "Osallistumismaksu", menu_side_act: "Sivuaktiviteetit", menu_courts: "Kentät", menu_catering: "Ruoka ja juoma tarjoilut",
    menu_prizes: "Voittopalkinnot", menu_about: "Tietoa meistä", menu_history: "Historia", menu_organizer: "Järjestäjä",
    menu_sponsors: "Sponsorit", menu_contact: "Yhteystiedot", menu_settings: "Asetukset", login_title: "Kirjaudu sisään",
    label_email: "Käyttäjätunnus (Sähköposti)", label_password: "Salasana", label_remember: "Muista sisäänkirjautuminen laitteella",
    txt_no_account: "Eikö tiliä?", link_create_acc: "Luo tili tästä", register_title: "Luo tili", label_fname: "Etunimi",
    label_lname: "Sukunimi", btn_google_login: "Kirjaudu Google-tilillä", btn_google_reg: "Luo tili Google-tilillä",
    txt_have_account: "Onko sinulla jo tili?", btn_logout: "Kirjaudu ulos", admin_title: "Admin Paneeli",
    admin_requests_title: "Odottavat liittymispyynnöt", th_name: "Nimi", th_class: "Luokka", th_actions: "Toiminnot",
    admin_create_title: "Luo uusi turnaus", label_tour_img: "Kuva (Kuvan URL)", label_price_cust: "Osallistumismaksu (Asiakkaat)",
    label_price_memb: "Osallistumismaksu (Jäsenet)", btn_publish_tour: "Julkaise turnaus etusivulle", admin_users_title: "Käyttäjien hallinta",
    th_role: "Rooli", th_group: "Ryhmä", empty_title: "Ei käynnissä olevia kisoja", empty_desc: "Tällä hetkellä ei ole avoimia LöScaba-turnauksia.",
    btn_join: "Ilmoittaudu kisaan mukaan", btn_waiting: "Odottaa järjestäjän hyväksyntää", btn_view_tour: "Näytä turnaus",
    modal_title: "Ilmoittautumistiedot", q_singles: "Haluatko osallistua singeliin (kaksinpeli)?", opt_yes: "Kyllä", opt_no: "Ei",
    q_class: "Mihin luokkaan haluat osallistua?", class_casual: "Hupi", class_inter: "Harraste", class_pro: "Kilpa",
    q_doubles: "Haluatko osallistua neluriin (nelinpeli)?", btn_send_req: "Lähetä pyyntö", btn_cancel: "Peruuta", tour_page_title: "Turnaussivu",
    btn_cancel_tour: "Peruuta nykyinen turnaus", label_darkmode: "Tumma tila (Dark Mode)", btn_save: "Tallenna"
  },
  en: {
    nav_login: "Login", menu_info: "Tournament Info", menu_scoring: "Scoring", menu_brackets: "Brackets",
    menu_fee: "Entry Fee", menu_side_act: "Side Activities", menu_courts: "Courts", menu_catering: "Catering",
    menu_prizes: "Prizes", menu_about: "About Us", menu_history: "History", menu_organizer: "Organizer",
    menu_sponsors: "Sponsors", menu_contact: "Contact Info", menu_settings: "Settings", login_title: "Sign In",
    label_email: "Username (Email)", label_password: "Password", label_remember: "Remember login on this device",
    txt_no_account: "No account?", link_create_acc: "Create an account here", register_title: "Create Account", label_fname: "First Name",
    label_lname: "Last Name", btn_google_login: "Sign in with Google", btn_google_reg: "Sign up with Google",
    txt_have_account: "Already have an account?", btn_logout: "Log Out", admin_title: "Admin Panel",
    admin_requests_title: "Pending Join Requests", th_name: "Name", th_class: "Class", th_actions: "Actions",
    admin_create_title: "Create New Tournament", label_tour_img: "Image (Image URL)", label_price_cust: "Entry Fee (Customers)",
    label_price_memb: "Entry Fee (Members)", btn_publish_tour: "Publish Tournament to Home", admin_users_title: "User Management",
    th_role: "Role", th_group: "Group", empty_title: "No Active Tournaments", empty_desc: "There are no open LöScaba tournaments at the moment.",
    btn_join: "Join Tournament", btn_waiting: "Awaiting organizer approval", btn_view_tour: "View Tournament",
    modal_title: "Registration Details", q_singles: "Do you want to participate in singles?", opt_yes: "Yes", opt_no: "No",
    q_class: "Which class do you want to join?", class_casual: "Casual", class_inter: "Intermediate", class_pro: "Pro",
    q_doubles: "Do you want to participate in doubles?", btn_send_req: "Send Request", btn_cancel: "Cancel", tour_page_title: "Tournament Page",
    btn_cancel_tour: "Cancel active tournament", label_darkmode: "Dark Mode", btn_save: "Save"
  }
};

let currentLang = 'fi';

function updateLanguageUI() {
  document.getElementById('lang-btn').innerText = currentLang === 'fi' ? 'EN' : 'FI';
  document.querySelectorAll('[data-txt]').forEach(element => {
    const key = element.getAttribute('data-txt');
    if (translations[currentLang][key]) {
      if (element.tagName === 'INPUT' && element.type === 'button') {
        element.value = translations[currentLang][key];
      } else {
        element.innerText = translations[currentLang][key];
      }
    }
  });
  renderTournamentDisplay();
}

document.getElementById('lang-btn').addEventListener('click', () => {
  currentLang = currentLang === 'fi' ? 'en' : 'fi';
  updateLanguageUI();
});

// ELEMENTTIEN HAKU
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const profileBtn = document.getElementById('profile-btn');
const logoHome = document.getElementById('logo-home');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');

// Navigaatio-lohkot
const homeSection = document.getElementById('home-section');
const profileSection = document.getElementById('profile-section');
const tournamentPageSection = document.getElementById('tournament-page-section');

const authSection = document.getElementById('auth-section');
const loginBox = document.getElementById('login-box');
const registerBox = document.getElementById('register-box');
const adminPanel = document.getElementById('admin-panel');

// Modalin elementit
const joinModal = document.getElementById('join-modal');
const joinSingles = document.getElementById('join-singles');
const joinClass = document.getElementById('join-class');
const joinDoubles = document.getElementById('join-doubles');

// APPI-TILA
let currentUser = null;
let activeTournament = null;
let userRegistrationStatus = null; 

function showSection(targetSection) {
  homeSection.classList.add('hidden');
  profileSection.classList.add('hidden');
  tournamentPageSection.classList.add('hidden');
  authSection.classList.add('hidden');
  targetSection.classList.remove('hidden');
}

// SIVUPALKKI
document.querySelectorAll('.dropdown-btn').forEach(btn => {
  btn.addEventListener('click', () => btn.parentElement.classList.toggle('active'));
});

function toggleSidebar() {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
}
menuBtn.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);

logoHome.addEventListener('click', () => {
  showSection(homeSection);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ASETUKSET - TOIMINNALLISUUS
settingsBtn.addEventListener('click', () => {
  if (!currentUser) {
    alert(currentLang === 'fi' ? "Kirjaudu ensin sisään muokataksesi asetuksia!" : "Please login first to edit settings!");
    toggleSidebar();
    return;
  }
  document.getElementById('settings-fname').value = currentUser.firstname || '';
  document.getElementById('settings-lname').value = currentUser.lastname || '';
  document.getElementById('settings-darkmode').checked = document.body.classList.contains('dark-mode');
  
  settingsModal.classList.remove('hidden');
  toggleSidebar();
});

document.getElementById('close-settings-btn').addEventListener('click', () => settingsModal.classList.add('hidden'));

document.getElementById('save-settings-btn').addEventListener('click', () => {
  const firstname = document.getElementById('settings-fname').value.trim();
  const lastname = document.getElementById('settings-lname').value.trim();
  const darkMode = document.getElementById('settings-darkmode').checked;

  if (!firstname || !lastname) return;

  if (darkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }

  db.collection("users").doc(currentUser.uid).update({
    firstname,
    lastname,
    theme: darkMode ? 'dark' : 'light'
  }).then(() => {
    currentUser.firstname = firstname;
    currentUser.lastname = lastname;
    currentUser.theme = darkMode ? 'dark' : 'light';
    updateUI();
    settingsModal.classList.add('hidden');
  }).catch(err => alert(err.message));
});

// SULJETAAN KIRJAUTUMISLAATIKKO JOS KLIKATAAN MUUALLE
document.addEventListener('click', (event) => {
  if (!authSection.classList.contains('hidden')) {
    if (!authSection.contains(event.target) && !profileBtn.contains(event.target)) {
      authSection.classList.add('hidden');
      homeSection.classList.remove('hidden');
    }
  }
});

// LOMAKKEEN VAIHDOT
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

profileBtn.addEventListener('click', () => {
  if (!currentUser) {
    homeSection.classList.add('hidden');
    profileSection.classList.add('hidden');
    tournamentPageSection.classList.add('hidden');
    authSection.classList.remove('hidden');
  } else {
    showSection(profileSection);
  }
});

joinSingles.addEventListener('change', () => {
  if(joinSingles.value === 'ei') {
    document.getElementById('class-group').classList.add('hidden');
  } else {
    document.getElementById('class-group').classList.remove('hidden');
  }
});

// FIREBASE AUTH-KUUNTELIJA
auth.onAuthStateChanged(user => {
  if (user) {
    db.collection("users").doc(user.uid).get().then(doc => {
      if (doc.exists) {
        currentUser = doc.data();
        currentUser.uid = user.uid;
        if (currentUser.theme === 'dark') {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }
        checkUserRegistration();
      } else {
        handleMissingFirestoreDoc(user);
      }
    });
  } else {
    currentUser = null;
    userRegistrationStatus = null;
    updateUI();
  }
});

function checkUserRegistration() {
  if (!currentUser) return;
  if (currentUser.role === 'admin') {
    userRegistrationStatus = 'approved';
    updateUI();
    return;
  }
  db.collection("tournaments").doc("active").collection("participants").doc(currentUser.uid).onSnapshot(doc => {
    if (doc.exists) {
      userRegistrationStatus = doc.data().status;
    } else {
      userRegistrationStatus = null;
    }
    updateUI();
  });
}

// KIRJAUTUMISEN JA REKISTERÖITYMISEN TOIMINNOT
document.getElementById('submit-login').addEventListener('click', () => {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;
  const rememberMe = document.getElementById('remember-me').checked;
  const persistence = rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;

  auth.setPersistence(persistence).then(() => {
    return auth.signInWithEmailAndPassword(email, pass);
  }).then(() => {
    showSection(profileSection);
  }).catch(error => alert(error.message));
});

document.getElementById('submit-register').addEventListener('click', () => {
  const firstname = document.getElementById('reg-firstname').value.trim();
  const lastname = document.getElementById('reg-lastname').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-password').value;

  if (!firstname || !lastname || !email || !pass) return;

  auth.createUserWithEmailAndPassword(email, pass).then(cred => {
    return db.collection("users").doc(cred.user.uid).set({ firstname, lastname, email, role: "user", group: "asiakas" });
  }).then(() => showSection(profileSection)).catch(error => alert(error.message));
});

const googleProvider = new firebase.auth.GoogleAuthProvider();
document.getElementById('google-login').addEventListener('click', () => {
  auth.signInWithPopup(googleProvider).then(() => showSection(profileSection)).catch(error => alert(error.message));
});
document.getElementById('google-register').addEventListener('click', () => {
  auth.signInWithPopup(googleProvider).then(() => showSection(profileSection)).catch(error => alert(error.message));
});

function handleMissingFirestoreDoc(user) {
  const firstname = prompt("Etunimi / Firstname:");
  const lastname = prompt("Sukunimi / Lastname:");
  if (!firstname || !lastname) { auth.signOut(); return; }
  
  db.collection("users").doc(user.uid).set({ firstname, lastname, email: user.email, role: "user", group: "asiakas" }).then(() => {
    currentUser = { firstname, lastname, email: user.email, role: "user", group: "asiakas", uid: user.uid };
    checkUserRegistration();
  });
}

document.getElementById('logout-btn').addEventListener('click', () => {
  auth.signOut().then(() => { showSection(homeSection); });
});

// UI PÄIVITYS
function updateUI() {
  if (currentUser) {
    profileBtn.innerText = `${currentUser.firstname}`;
    document.getElementById('profile-name').innerText = `${currentUser.firstname} ${currentUser.lastname}`;
    document.getElementById('role-badge').innerText = currentUser.role.toUpperCase();
    
    const kisaBox = document.getElementById('profile-kisa-box');
    if (currentUser.viimeisinKisa) {
      kisaBox.innerHTML = `<div class="profile-kisa-card-expanded"><div class="profile-kisa-body"><div class="profile-kisa-title">${currentUser.viimeisinKisa}</div></div></div>`;
    } else {
      kisaBox.innerHTML = `<p style="font-style:italic; color:#666;">Ei kisahistoriaa.</p>`;
    }

    if (currentUser.role === 'admin') {
      adminPanel.classList.remove('hidden');
      setupAdminListener();
      setupRequestsListener();
    } else {
      adminPanel.classList.add('hidden');
    }
  } else {
    profileBtn.innerText = currentLang === 'fi' ? "Kirjaudu" : "Login";
    adminPanel.classList.add('hidden');
  }
  renderTournamentDisplay();
}

// TURNAUKSEN REAALIAIKAINEN KUUNTELU
db.collection("tournaments").doc("active").onSnapshot(doc => {
  const cancelBtn = document.getElementById('cancel-tournament-btn');
  if (doc.exists && doc.data().published) {
    activeTournament = doc.data();
    if(cancelBtn) cancelBtn.classList.remove('hidden');
  } else {
    activeTournament = null;
    if(cancelBtn) cancelBtn.classList.add('hidden');
  }
  renderTournamentDisplay();
});

// PERUUTA TURNAUKSEN LUONTI (ADMIN)
document.getElementById('cancel-tournament-btn').addEventListener('click', () => {
  if(confirm(currentLang === 'fi' ? "Haluatko varmasti peruuttaa ja poistaa nykyisen turnauksen?" : "Are you sure you want to cancel and delete the active tournament?")) {
    db.collection("tournaments").doc("active").delete().then(() => {
      alert(currentLang === 'fi' ? "Turnaus peruutettu!" : "Tournament cancelled!");
    });
  }
});

// ETUSIVUN TURNAUSNÄKYMÄ
function renderTournamentDisplay() {
  const displayContainer = document.getElementById('tournament-display');
  if (!activeTournament) {
    displayContainer.innerHTML = `
      <div class="empty-tournament-container">
        <h2>${translations[currentLang].empty_title}</h2>
        <p>${translations[currentLang].empty_desc}</p>
      </div>
    `;
    return;
  }

  const name = currentLang === 'fi' ? activeTournament.nameFi : activeTournament.nameEn;
  const desc = currentLang === 'fi' ? activeTournament.descFi : activeTournament.descEn;

  let actionButtonHtml = '';
  if (!currentUser) {
    actionButtonHtml = `<button class="btn btn-primary" onclick="openJoinFlow()">${translations[currentLang].btn_join}</button>`;
  } else if (userRegistrationStatus === 'approved') {
    actionButtonHtml = `<button class="btn btn-success" onclick="openTournamentPage()">${translations[currentLang].btn_view_tour}</button>`;
  } else if (userRegistrationStatus === 'pending') {
    actionButtonHtml = `<button class="btn" disabled>${translations[currentLang].btn_waiting}</button>`;
  } else {
    actionButtonHtml = `<button class="btn btn-primary" onclick="openJoinFlow()">${translations[currentLang].btn_join}</button>`;
  }

  displayContainer.innerHTML = `
    <div class="card">
      <img src="${activeTournament.image}" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;">
      <h2>${name}</h2>
      <p style="margin: 10px 0 20px 0; color: #444; line-height: 1.5;">${desc}</p>
      <div class="kisa-info-box">
        <p>Asiakkaat: ${activeTournament.priceCustomer}</p>
        <p>Jäsenet: ${activeTournament.priceMember}</p>
      </div>
      ${actionButtonHtml}
    </div>
  `;
}

window.openJoinFlow = function() {
  if (!currentUser) {
    profileBtn.click();
    return;
  }
  joinModal.classList.remove('hidden');
};

document.getElementById('cancel-join-btn').addEventListener('click', () => joinModal.classList.add('hidden'));

document.getElementById('confirm-join-btn').addEventListener('click', () => {
  const singles = joinSingles.value;
  const pClass = singles === 'kylla' ? joinClass.value : '-';
  const doubles = joinDoubles.value;

  db.collection("tournaments").doc("active").collection("participants").doc(currentUser.uid).set({
    uid: currentUser.uid,
    name: `${currentUser.firstname} ${currentUser.lastname}`,
    singles,
    pClass,
    doubles,
    status: 'pending'
  }).then(() => {
    joinModal.classList.add('hidden');
  });
});

// TURNAUSSIVU & LOHKO/OTTELUKAAVIO SEURANTA
window.openTournamentPage = function() {
  showSection(tournamentPageSection);
  renderKaavioJaLohkot();
};

function renderKaavioJaLohkot() {
  const content = document.getElementById('tournament-page-content');
  const tName = currentLang === 'fi' ? activeTournament.nameFi : activeTournament.nameEn;
  const isAdmin = currentUser && currentUser.role === 'admin';

  db.collection("tournaments").doc("active").collection("ottelut").doc("data").onSnapshot(doc => {
    let otteluData = {
      l1: { p1: "Pelaaja A", p2: "Pelaaja B", s1: 0, s2: 0 },
      l2: { p1: "Pelaaja C", p2: "Pelaaja D", s1: 0, s2: 0 },
      f1: { p1: "Lohko 1 Voittaja", p2: "Lohko 2 Voittaja", s1: 0, s2: 0 }
    };

    if (doc.exists) {
      otteluData = doc.data();
    } else if (isAdmin) {
      db.collection("tournaments").doc("active").collection("ottelut").doc("data").set(otteluData);
    }

    content.innerHTML = `
      <h2>${tName} - ${translations[currentLang].tour_page_title}</h2>
      
      <div class="kaavio-container">
        <div class="lohko-box">
          <h3>Alkulohkot (Lohko 1 & 2)</h3>
          <div class="ottelu-rivi">
            <span>${otteluData.l1.p1} vs ${otteluData.l1.p2}</span>
            <div>
              <input type="number" class="score-input" value="${otteluData.l1.s1}" ${!isAdmin ? 'disabled' : ''} onchange="paivitaTulos('l1', 's1', this.value)">
              <input type="number" class="score-input" value="${otteluData.l1.s2}" ${!isAdmin ? 'disabled' : ''} onchange="paivitaTulos('l1', 's2', this.value)">
            </div>
          </div>
          <div class="ottelu-rivi">
            <span>${otteluData.l2.p1} vs ${otteluData.l2.p2}</span>
            <div>
              <input type="number" class="score-input" value="${otteluData.l2.s1}" ${!isAdmin ? 'disabled' : ''} onchange="paivitaTulos('l2', 's1', this.value)">
              <input type="number" class="score-input" value="${otteluData.l2.s2}" ${!isAdmin ? 'disabled' : ''} onchange="paivitaTulos('l2', 's2', this.value)">
            </div>
          </div>
        </div>

        <div class="lohko-box">
          <h3>Pudotuspelit (Finaalikaavio)</h3>
          <div class="ottelu-rivi" style="background:#f1f1f1; font-weight:bold; border-radius:6px; padding:12px;">
            <span>Finaali: ${otteluData.f1.p1} vs ${otteluData.f1.p2}</span>
            <div>
              <input type="number" class="score-input" value="${otteluData.f1.s1}" ${!isAdmin ? 'disabled' : ''} onchange="paivitaTulos('f1', 's1', this.value)">
              <input type="number" class="score-input" value="${otteluData.f1.s2}" ${!isAdmin ? 'disabled' : ''} onchange="paivitaTulos('f1', 's2', this.value)">
            </div>
          </div>
        </div>
      </div>

      <button class="btn btn-secondary" onclick="showSection(homeSection)" style="margin-top:20px; max-width:200px;">Takaisin etusivulle</button>
    `;
  });
}

window.paivitaTulos = function(otteluId, settiId, arvo) {
  const dataUpdate = {};
  dataUpdate[`${otteluId}.${settiId}`] = parseInt(arvo) || 0;
  db.collection("tournaments").doc("active").collection("ottelut").doc("data").update(dataUpdate);
};

// TURNAUKSEN JULKAISU
document.getElementById('submit-tournament').addEventListener('click', () => {
  const nameFi = document.getElementById('tour-name-fi').value.trim();
  const nameEn = document.getElementById('tour-name-en').value.trim();
  const image = document.getElementById('tour-image').value.trim();
  const descFi = document.getElementById('tour-desc-fi').value.trim();
  const descEn = document.getElementById('tour-desc-en').value.trim();
  const priceCustomer = document.getElementById('tour-price-customer').value.trim();
  const priceMember = document.getElementById('tour-price-member').value.trim();

  if (!nameFi || !nameEn || !descFi || !descEn || !priceCustomer || !priceMember) {
    alert("Täytä kaikki kentät!");
    return;
  }

  db.collection("tournaments").doc("active").set({
    nameFi, nameEn, image: image || "https://via.placeholder.com/600x300?text=LöScaba", descFi, descEn, priceCustomer, priceMember, published: true
  }).then(() => {
    alert("Turnaus julkaistu kahdella kielellä!");
  });
});

// ADMIN KUUNTELIJA - HAKEMUKSET
let requestsListenerUnsubscribe = null;
function setupRequestsListener() {
  if (requestsListenerUnsubscribe) requestsListenerUnsubscribe();
  requestsListenerUnsubscribe = db.collection("tournaments").doc("active").collection("participants")
    .where("status", "==", "pending").onSnapshot(snapshot => {
      const tbody = document.querySelector('#requests-table tbody');
      if(!tbody) return;
      tbody.innerHTML = '';
      
      snapshot.forEach(doc => {
        const req = doc.data();
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${req.name}</td>
          <td>${req.singles.toUpperCase()}</td>
          <td>${req.pClass.toUpperCase()}</td>
          <td>${req.doubles.toUpperCase()}</td>
          <td>
            <button class="action-btn" style="background-color:#27ae60; margin-right:5px;" onclick="handleRequest('${doc.id}', 'approved')">Kyllä</button>
            <button class="action-btn" style="background-color:#c0392b;" onclick="handleRequest('${doc.id}', 'rejected')">Hylkää</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    });
}

window.handleRequest = function(requestId, status) {
  if(status === 'approved') {
    db.collection("tournaments").doc("active").collection("participants").doc(requestId).update({ status: 'approved' });
  } else {
    db.collection("tournaments").doc("active").collection("participants").doc(requestId).delete();
  }
};

// ADMIN KUUNTELIJA - KÄYTTÄJÄT
let adminListenerUnsubscribe = null;
function setupAdminListener() {
  if (adminListenerUnsubscribe) adminListenerUnsubscribe();
  adminListenerUnsubscribe = db.collection("users").onSnapshot(snapshot => {
    const tbody = document.querySelector('#users-table tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    snapshot.forEach(doc => {
      const user = doc.data();
      tbody.appendChild(Object.assign(document.createElement('tr'), {
        innerHTML: `<td>${user.firstname} ${user.lastname}</td><td>${user.email}</td><td><span class="badge">${user.role}</span></td><td><strong>${user.group}</strong></td><td><button class="action-btn" onclick="toggleUserGroup('${doc.id}', '${user.group}')">Muuta</button></td>`
      }));
    });
  });
}

window.toggleUserGroup = function(userId, currentGroup) {
  db.collection("users").doc(userId).update({ group: currentGroup === 'asiakas' ? 'jäsen' : 'asiakas' });
};