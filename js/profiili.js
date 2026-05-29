function initProfilePage() {
  const authSec = document.getElementById('auth-section');
  const profSec = document.getElementById('profile-section');

  if (!currentUser) {
    if (authSec) authSec.classList.remove('hidden');
    if (profSec) profSec.classList.add('hidden');
  } else {
    if (authSec) authSec.classList.add('hidden');
    if (profSec) {
      profSec.classList.remove('hidden');
      document.getElementById('profile-name').innerText = `${currentUser.firstname} ${currentUser.lastname}`;
      document.getElementById('profile-email-view').innerText = `Tili: ${currentUser.email}`;
      document.getElementById('role-badge').innerText = currentUser.role.toUpperCase();
      
      // Ladataan turnaushistoria heti kun profiili on alustettu
      loadTournamentHistory();
    }
  }
}

// Haetaan käyttäjän turnaushistoria Firestoresta
function loadTournamentHistory() {
  const historyList = document.getElementById('history-list');
  if (!historyList) return;

  // Haetaan kaikki turnaukset, jotka ovat päättyneet (status: 'ended' tai 'finished')
  // Huom: Voit muuttaa hakuehtoja sen mukaan, miten olet Firestoren rakentanut.
  db.collection("tournaments")
    .where("status", "==", "finished")
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        historyList.innerHTML = `<p style="text-align: center; opacity: 0.7; padding: 20px 0;">Ei aiempia turnauksia.</p>`;
        return;
      }

      let html = '<table><thead><tr><th>Turnaus</th><th>Päivämäärä</th><th>Kaavio</th></tr></thead><tbody>';
      let hasTournaments = false;

      snapshot.forEach(doc => {
        const data = doc.data();
        // Tarkistetaan tässä, oliko käyttäjä mukana turnauksessa, tai haetaan suoraan kaikki vanhat kisa-arkistot
        html += `
          <tr>
            <td><strong>${data.name || 'Nimetön turnaus'}</strong></td>
            <td>${data.date || 'Ei pvm'}</td>
            <td>
              <a href="turnaus.html?id=${doc.id}" class="btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 4px; text-decoration: none;">
                Katso kaavio
              </a>
            </td>
          </tr>
        `;
        hasTournaments = true;
      });

      html += '</tbody></table>';
      historyList.innerHTML = hasTournaments ? html : `<p style="text-align: center; opacity: 0.7; padding: 20px 0;">Ei aiempia turnauksia.</p>`;
    })
    .catch(err => {
      console.error("Virhe historian latauksessa:", err);
      historyList.innerHTML = `<p style="text-align: center; color: #e74c3c; padding: 20px 0;">Virhe ladattaessa historiaa.</p>`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const toReg = document.getElementById('go-to-register');
  const toLog = document.getElementById('go-to-login');
  
  if (toReg) toReg.addEventListener('click', () => {
    document.getElementById('login-box').classList.add('hidden');
    document.getElementById('register-box').classList.remove('hidden');
  });
  if (toLog) toLog.addEventListener('click', () => {
    document.getElementById('register-box').classList.add('hidden');
    document.getElementById('login-box').classList.remove('hidden');
  });

  // Välilehtien logiikka
  const tabInfoBtn = document.getElementById('tab-info-btn');
  const tabHistoryBtn = document.getElementById('tab-history-btn');
  const infoContent = document.getElementById('profile-info-content');
  const historyContent = document.getElementById('profile-history-content');

  if (tabInfoBtn && tabHistoryBtn) {
    tabInfoBtn.addEventListener('click', () => {
      tabInfoBtn.classList.add('active');
      tabHistoryBtn.classList.remove('active');
      infoContent.classList.remove('hidden');
      historyContent.classList.add('hidden');
    });

    tabHistoryBtn.addEventListener('click', () => {
      tabHistoryBtn.classList.add('active');
      tabInfoBtn.classList.remove('active');
      historyContent.classList.remove('hidden');
      infoContent.classList.add('hidden');
    });
  }

  if (document.getElementById('submit-login')) {
    document.getElementById('submit-login').addEventListener('click', () => {
      auth.signInWithEmailAndPassword(document.getElementById('login-email').value.trim(), document.getElementById('login-password').value).catch(err => alert(err.message));
    });
  }

  if (document.getElementById('submit-register')) {
    document.getElementById('submit-register').addEventListener('click', () => {
      const firstname = document.getElementById('reg-firstname').value.trim();
      const lastname = document.getElementById('reg-lastname').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      auth.createUserWithEmailAndPassword(email, document.getElementById('reg-password').value).then(cred => {
        return db.collection("users").doc(cred.user.uid).set({ firstname, lastname, email, role: "user", group: "asiakas", theme: "light", emailNotification: false });
      }).catch(err => alert(err.message));
    });
  }

  if (document.getElementById('logout-btn')) {
    document.getElementById('logout-btn').addEventListener('click', () => {
      auth.signOut().then(() => window.location.href = 'index.html');
    });
  }

  // Funktio hoitamaan Google-kirjautumisen popup-ikkunalla
function handleGoogleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  
  auth.signInWithPopup(provider)
    .then(cred => {
      // Tarkistetaan, löytyykö käyttäjälle jo Firestore-dokumentti
      const userDocRef = db.collection("users").doc(cred.user.uid);
      
      return userDocRef.get().then(doc => {
        if (!doc.exists) {
          // Jos käyttäjä kirjautuu ekkaa kertaa, napataan tiedot Google-tililtä
          const displayName = cred.user.displayName || "";
          const nameParts = displayName.split(" ");
          const firstname = nameParts[0] || "Google";
          const lastname = nameParts.slice(1).join(" ") || "Käyttäjä";
          const email = cred.user.email || "";

          // Luodaan uusi profiili Firestoreen
          return userDocRef.set({
            firstname: firstname,
            lastname: lastname,
            email: email,
            role: "user",
            group: "asiakas",
            theme: "light",
            emailNotification: false
          });
        }
      });
    })
    .catch(err => {
      console.error("Google-kirjautumisvirhe: ", err);
      alert("Google-kirjautuminen epäonnistui: " + err.message);
    });
}

// Laita tämä muiden tapahtumankuuntelijoiden (kuten 'submit-login') sekaan DOMContentLoaded-lohkoon
const googleLoginBtn = document.getElementById('google-login');
const googleRegBtn = document.getElementById('google-reg');

if (googleLoginBtn) {
  googleLoginBtn.addEventListener('click', handleGoogleLogin);
}
if (googleRegBtn) {
  googleRegBtn.addEventListener('click', handleGoogleLogin);
}
});