// TODO: Korvaa nämä tiedot oman Firebase-projektisi asetuksilla (löydät ne Firebase consolesta)
const firebaseConfig = {
  apiKey: "AIzaSyA3mlwqFf-hk6_vlk6GMo8bXanmC1MaIqU",
  authDomain: "loscaba-81da2.firebaseapp.com",
  projectId: "loscaba-81da2",
  storageBucket: "loscaba-81da2.firebasestorage.app",
  messagingSenderId: "291152980965",
  appId: "1:291152980965:web:606b9a6c99c8f753b59d0c",
  measurementId: "G-C6VX2Q9RPE"
};

// Alustetaan Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Haetaan elementit
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const profileBtn = document.getElementById('profile-btn');
const logoHome = document.getElementById('logo-home');

const authSection = document.getElementById('auth-section');
const loginBox = document.getElementById('login-box');
const registerBox = document.getElementById('register-box');
const profileSection = document.getElementById('profile-section');
const adminSection = document.getElementById('admin-section');

// Sivupalkin dropdownit
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

// Klikkaamalla LöScaba-logoa pääsee takaisin "aloitussivulle" (sulkee lomakkeet/paneelit näkyvistä tarvittaessa)
logoHome.addEventListener('click', () => {
  if (currentUser) {
    profileSection.classList.remove('hidden');
    authSection.classList.add('hidden');
    if (currentUser.role === 'admin') adminSection.classList.remove('hidden');
  } else {
    authSection.classList.remove('hidden');
    profileSection.classList.add('hidden');
    adminSection.classList.add('hidden');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Lomakkeiden vaihdot
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

// Sovelluksen sisäinen tila kirjautuneesta käyttäjästä (Firestore-dokumentti)
let currentUser = null;

// Firebasen automaattinen kirjautumistilan kuuntelija (hoitaa "muista minut" istunnot laitteella)
auth.onAuthStateChanged(user => {
  if (user) {
    // Haetaan käyttäjän lisätiedot Firestoresta uid:n perusteella
    db.collection("users").doc(user.uid).get().then(doc => {
      if (doc.exists) {
        currentUser = doc.data();
        currentUser.uid = user.uid; // Tallennetaan id muistiin taulukkomuutoksia varten
        updateUI();
      } else {
        // Jos käyttäjä on kirjautunut esim. Googlella ensi kertaa, eikä Firestore-dokumenttia vielä ole
        handleMissingFirestoreDoc(user);
      }
    }).catch(error => {
      console.error("Virhe ladattaessa käyttäjätietoja: ", error);
    });
  } else {
    currentUser = null;
    updateUI();
  }
});

// Sähköposti/salasana kirjautuminen
document.getElementById('submit-login').addEventListener('click', () => {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;
  const rememberMe = document.getElementById('remember-me').checked;

  // Määritetään Firebasen istunnon kesto (muistetaanko laite vai ei)
  const persistence = rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;

  auth.setPersistence(persistence).then(() => {
    return auth.signInWithEmailAndPassword(email, pass);
  }).then(() => {
    // Tyhjennetään kentät, onAuthStateChanged hoitaa UI:n päivityksen
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
  }).catch(error => {
    alert("Kirjautumisvirhe: " + error.message);
  });
});

// Sähköposti/salasana rekisteröityminen
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
    // Luodaan Firestoreen uusi dokumentti käyttäjän tiedoilla
    const userData = {
    firstname: firstname,
    lastname: lastname,
    email: email,
    role: "user",
    group: "asiakas"
    };
    
    return db.collection("users").doc(cred.user.uid).set(userData);
  }).then(() => {
    document.getElementById('reg-firstname').value = '';
    document.getElementById('reg-lastname').value = '';
    document.getElementById('reg-email').value = '';
    document.getElementById('reg-password').value = '';
    registerBox.classList.add('hidden');
    loginBox.classList.remove('hidden');
  }).catch(error => {
    alert("Rekisteröintivirhe: " + error.message);
  });
});

// Google-kirjautumisen ja -rekisteröinnin logiikka
const googleProvider = new firebase.auth.GoogleAuthProvider();

document.getElementById('google-login').addEventListener('click', () => {
  auth.signInWithPopup(googleProvider).catch(error => alert(error.message));
});

document.getElementById('google-register').addEventListener('click', () => {
  auth.signInWithPopup(googleProvider).catch(error => alert(error.message));
});

// Funktio, joka kysyy nimen jos tili luodaan Googlen kautta eikä Firestoresta löydy valmiita tietoja
function handleMissingFirestoreDoc(user) {
  // Puretaan Googlen antama koko nimi oletukseksi jos mahdollista
  const displayName = user.displayName || "";
  const nameParts = displayName.split(" ");
  const defaultFirst = nameParts[0] || "";
  const defaultLast = nameParts.slice(1).join(" ") || "";

  const firstname = prompt("Syötä etunimesi LöScaba-profiilia varten:", defaultFirst);
  const lastname = prompt("Syötä sukunimesi LöScaba-profiilia varten:", defaultLast);

  if (!firstname || !lastname) {
    alert("Etu- ja sukunimi ovat pakollisia. Kirjaudutaan ulos.");
    auth.signOut();
    return;
  }

  const userData = {
    firstname: firstname,
    lastname: lastname,
    email: user.email,
    role: "user",
    group: "asiakas",
    singeliLuokka: "Harraste",
    singeliSijoitus: "Ei sijoitusta",
    nelinpeli: "Ei",
    nelinpeliSijoitus: "-"
  };

  db.collection("users").doc(user.uid).set(userData).then(() => {
    currentUser = userData;
    currentUser.uid = user.uid;
    updateUI();
  });
}

// Uloskirjautuminen
document.getElementById('logout-btn').addEventListener('click', () => {
  auth.signOut().then(() => {
    currentUser = null;
    updateUI();
  });
});

// Profiilinappi
profileBtn.addEventListener('click', () => {
  if (!currentUser) {
    authSection.classList.remove('hidden');
    authSection.scrollIntoView({ behavior: 'smooth' });
  } else {
    profileSection.classList.remove('hidden');
    profileSection.scrollIntoView({ behavior: 'smooth' });
  }
});

// UI Päivitys
function updateUI() {
  if (currentUser) {
    profileBtn.innerText = `${currentUser.firstname}`;
    authSection.classList.add('hidden');
    
    document.getElementById('profile-name').innerText = `${currentUser.firstname} ${currentUser.lastname}`;
    document.getElementById('role-badge').innerText = currentUser.role.toUpperCase();
    
    // Haetaan kisa-info-laatikko elementtinä, jotta voimme muuttaa sen sisältöä dynaamisesti
    const kisaBox = document.querySelector('.kisa-info-box');

    // TARKISTUS: Onko käyttäjällä tallennettua kisaa?
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
      // Jos kisoja ei ole vielä takana
      kisaBox.innerHTML = `
        <h3>Viimeisin LöScaba kisasi</h3>
        <p style="color: #666; font-style: italic; margin-top: 10px;">Ei kisoja tallennettuna.</p>
      `;
    }
    
    profileSection.classList.remove('hidden');

    if (currentUser.role === 'admin') {
      adminSection.classList.remove('hidden');
      setupAdminListener(); 
    } else {
      adminSection.classList.add('hidden');
    }
  } else {
    profileBtn.innerText = "Kirjaudu";
    profileSection.classList.add('hidden');
    adminSection.classList.add('hidden');
    authSection.classList.add('hidden'); 
  }
}

// Reaaliaikainen Admin-taulukon päivitys suoraan Firestoresta
let adminListenerUnsubscribe = null;

function setupAdminListener() {
  // Estetään päällekkäiset kuuntelijat
  if (adminListenerUnsubscribe) adminListenerUnsubscribe();

  adminListenerUnsubscribe = db.collection("users").onSnapshot(snapshot => {
    const tbody = document.querySelector('#users-table tbody');
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
          <button class="action-btn" onclick="toggleUserGroup('${userId}', '${user.group}')">
            Muuta ryhmää
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// Globaali funktio ryhmän vaihtoon Firestore-tietokannassa
window.toggleUserGroup = function(userId, currentGroup) {
  const newGroup = (currentGroup === 'asiakas') ? 'jäsen' : 'asiakas';
  
  db.collection("users").doc(userId).update({
    group: newGroup
  }).catch(error => {
    alert("Virhe ryhmää muutettaessa: " + error.message);
  });
};