let aktiivinenTabi = "K1";

const KAIKKI_TABIT = [
  { id: "K1", nimi: "Kilpa L1" },
  { id: "K2", nimi: "Kilpa L2" },
  { id: "H1", nimi: "Harraste L1" },
  { id: "H2", nimi: "Harraste L2" },
  { id: "F1", nimi: "Hupi L1" },
  { id: "FP1", nimi: "4PLAY L1" },
  { id: "FP2", nimi: "4PLAY L2" },
  { id: "FP3", nimi: "4PLAY L3" },
  { id: "FP4", nimi: "4PLAY L4" }
];

function initTournamentPage() {
  const adminPanel = document.getElementById('tournament-admin-panel');
  
  // Ohjauspaneelin näkyvyys adminille
  if (currentUser && currentUser.role === 'admin') {
    if (adminPanel) adminPanel.classList.remove('hidden');
  } else {
    if (adminPanel) adminPanel.classList.add('hidden');
  }

  // Rakennettaan välilehdet (tabit) heti, jotta ne ovat aina olemassa
  rakennaTabNavigation();

  // Tarkistetaan Firestoresta, onko turnaus luotu/aktivoitu adminin toimesta
  db.collection("tournaments").doc("active").get().then(doc => {
    if (doc.exists && doc.data().status === "active") {
      // Turnaus on käynnissä -> ladataan live-kaaviot ja ottelut
      lataaTurnausSisalto();
    } else {
      // Turnausta ei ole vielä aktivoitu adminpaneelista
      naytaOdotustilaViesti();
    }
  }).catch(err => {
    console.error("Virhe turnauksen tilan tarkistuksessa:", err);
    document.getElementById('tournament-page-content').innerText = "Virhe ladattaessa turnaustietoja.";
  });
}

// Luodaan navigointipalkki alapuolelle
function rakennaTabNavigation() {
  const navContainer = document.querySelector('.tab-navigation');
  if (!navContainer) return;

  navContainer.innerHTML = ""; // Tyhjennetään vanhat
  KAIKKI_TABIT.forEach(tabi => {
    const btn = document.createElement('button');
    btn.className = `tab-btn ${tabi.id === aktiivinenTabi ? 'active' : ''}`;
    btn.innerText = tabi.nimi;
    btn.onclick = () => {
      // Vaihdetaan aktiivinen tabi
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      aktiivinenTabi = tabi.id;
      
      // Tarkistetaan uudelleen tila vaihdon yhteydessä
      db.collection("tournaments").doc("active").get().then(doc => {
        if (doc.exists && doc.data().status === "active") {
          lataaTurnausSisalto();
        } else {
          naytaOdotustilaViesti();
        }
      });
    };
    navContainer.appendChild(btn);
  });
}

// Viesti, kun turnausta ei ole vielä aloitettu
function naytaOdotustilaViesti() {
  const content = document.getElementById('tournament-page-content');
  if (!content) return;

  content.innerHTML = `
    <div style="text-align: center; padding: 40px 20px;">
      <h2 style="margin-bottom: 10px; color: var(--text-color);">Kaaviot valmiina 🕒</h2>
      <p style="color: #718096;">Järjestäjä ei ole vielä virallisesti aloittanut turnausta. Pelaajien hyväksyntä ja ottelukaaviot päivittyvät tähän heti, kun turnaus käynnistetään Admin-paneelista.</p>
    </div>
  `;
}

// Alkuperäinen lataustoiminnallisuutesi (joka suoritetaan vain kun turnaus on 'active')
function lataaTurnausSisalto() {
  const content = document.getElementById('tournament-page-content');
  if (!content) return;

  // Tähän tulee nykyinen logiikkasi, joka hakee db.collection("tournaments").doc("active").collection("lohkot").doc(aktiivinenTabi)
  content.innerHTML = `<p>Ladataan lohkon <b>${aktiivinenTabi}</b> reaaliaikaisia tuloksia...</p>`;
  
  // Hae tähän lohkon ottelut ja pelaajat tyyliin:
  db.collection("tournaments").doc("active").collection("lohkot").doc(aktiivinenTabi).get().then(doc => {
    if (doc.exists) {
      // Rakenna ottelutaulukot ja näytä pelaajat tähän...
    } else {
      content.innerHTML = `<p>Lohkossa ${aktiivinenTabi} ei ole vielä pelaajia tai otteluita.</p>`;
    }
  });
}

// Kuuntelija sivun lataukselle, varmistaen että auth on valmis
document.addEventListener('DOMContentLoaded', () => {
  // Odotetaan pikahetki, jotta app.js ehtii asettaa currentUserin ja rakentaa yläpalkin
  setTimeout(() => {
    initTournamentPage();
  }, 200);
});