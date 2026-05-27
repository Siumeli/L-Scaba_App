let aktiivinenTabi = "K1"; // Oletuksena näytetään Kilpa 1 lohko

const KAIKKI_TABIT = [
  { id: "K1", nimi: "Kilpa L1" },
  { id: "K2", nimi: "Kilpa L2" },
  { id: "H1", nimi: "Harraste L1" },
  { id: "H2", nimi: "Harraste L2" },
  { id: "F1", nimi: "Hupi L1" },
  { id: "FP1", nimi: "4PLAY L1" },
  { id: "FP2", nimi: "4PLAY L2" },
  { id: "FP3", nimi: "4PLAY L3" },
  { id: "FP4", nimi: "4PLAY L4" },
  { id: "CUP_K", nimi: "Kilpa CUP" },
  { id: "CUP_H", nimi: "Harraste CUP" },
  { id: "CUP_F", nimi: "Hupi CUP" },
  { id: "CUP_FP", nimi: "4PLAY CUP" }
];

function initTournamentPage() {
  // Tarkistetaan onko käyttäjä admin ja näytetään ohjauspaneeli turnaussivulla
  const adminPanel = document.getElementById('tournament-admin-panel');
  if (currentUser && currentUser.role === 'admin') {
    if (adminPanel) adminPanel.classList.remove('hidden');
  }

  rakennaVälilehtiNavigointi();

  db.collection("tournaments").doc("active").onSnapshot(doc => {
    const content = document.getElementById('tournament-page-content');
    if (!content) return;
    if (doc.exists && doc.data().published) {
      kuunteleJaRenderoiValittuTabi(doc.data());
    } else {
      content.innerHTML = "<h2>Ei käynnissä olevia turnauksia juuri nyt.</h2>";
    }
  });
}

function rakennaVälilehtiNavigointi() {
  const tBar = document.getElementById('tournament-tabs');
  if (!tBar) return;
  tBar.innerHTML = '';

  KAIKKI_TABIT.forEach(tab => {
    const aktiivinenLuokka = tab.id === aktiivinenTabi ? 'active' : '';
    tBar.innerHTML += `
      <button class="tab-item ${aktiivinenLuokka}" onclick="vaihdaTabi('${tab.id}')">
        ${tab.nimi}
      </button>
    `;
  });
}

window.vaihdaTabi = function(tabId) {
  aktiivinenTabi = tabId;
  rakennaVälilehtiNavigointi();
  // Pakotetaan uudelleenrenderöinti hakemalla aktiivisen turnauksen tiedot uudestaan
  db.collection("tournaments").doc("active").get().then(doc => {
    if(doc.exists) kuunteleJaRenderoiValittuTabi(doc.data());
  });
}

function kuunteleJaRenderoiValittuTabi(tourData) {
  const content = document.getElementById('tournament-page-content');
  const otsikko = currentLang === 'fi' ? tourData.nameFi : tourData.nameEn;
  const isAdmin = currentUser && currentUser.role === 'admin';

  // JOS KYSEESSÄ ON LOHKOTAULUKKO (K1-FP4)
  if (!aktiivinenTabi.startsWith("CUP_")) {
    db.collection("tournaments").doc("active").collection("lohkot").doc(aktiivinenTabi).onSnapshot(doc => {
      let pelaajat = [];
      if (doc.exists && doc.data().pelaajat) {
        pelaajat = doc.data().pelaajat;
      }

      let taulukkoRivit = '';
      // Luodaan tyhjä Sheets-tyylinen ruudukko (vähintään 8 riviä oletuksena)
      const rivimaara = Math.max(8, pelaajat.length);
      for (let i = 0; i < rivimaara; i++) {
        const pNimi = pelaajat[i] || '';
        taulukkoRivit += `
          <tr>
            <td style="text-align:center; font-weight:bold; width:40px;">${i + 1}</td>
            <td>
              ${isAdmin 
                ? `<input type="text" class="player-edit-input" style="width:100%; border:none; background:transparent;" value="${pNimi}" onchange="paivitaPelaajaNimiPaikalle('${aktiivinenTabi}', ${i}, this.value)">`
                : `<span>${pNimi || '<span style="color:#ccc; font-style:italic;">Tyhjä</span>'}</span>`
              }
            </td>
            <td><input type="number" class="score-input" placeholder="0" disabled></td>
            <td><input type="number" class="score-input" placeholder="0" disabled></td>
          </tr>
        `;
      }

      content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
          <h2>${otsikko} - ${aktiivinenTabi} Lohkovaihe</h2>
          ${isAdmin ? '<span class="badge" style="background:#e74c3c;">Muokkaustila</span>' : ''}
        </div>
        <div class="sheets-table-container">
          <table class="sheets-style-table">
            <thead>
              <tr>
                <th>Sija</th>
                <th>Pelaaja / Tiimi</th>
                <th>Erät +</th>
                <th>Erät -</th>
              </tr>
            </thead>
            <tbody>
              ${taulukkoRivit}
            </tbody>
          </table>
        </div>
      `;
    });
  } 
  // JOS KYSEESSÄ ON PUDOTUSPELIKAAVIO (CUP-KAAVIOT)
  else {
    db.collection("tournaments").doc("active").collection("cup_kaaviot").doc(aktiivinenTabi).onSnapshot(doc => {
      let dataset = { 
        m1: { p1: "Pelaaja A", p2: "Pelaaja B", s1: 0, s2: 0 },
        m2: { p1: "Pelaaja C", p2: "Pelaaja D", s1: 0, s2: 0 },
        finaali: { p1: "Voittaja M1", p2: "Voittaja M2", s1: 0, s2: 0 }
      };
      if (doc.exists) dataset = doc.data();

      content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
          <h2>${otsikko} - ${aktiivinenTabi.replace("CUP_", "")} Pudotuspelit</h2>
        </div>
        <div class="kaavio-container">
          <div class="lohko-box">
            <h3>Semifinaalit</h3>
            <div class="ottelu-rivi">
              <div>${dataset.m1.p1} vs ${dataset.m1.p2}</div>
              <div><strong>${dataset.m1.s1} - ${dataset.m1.s2}</strong></div>
            </div>
            <div class="ottelu-rivi">
              <div>${dataset.m2.p1} vs ${dataset.m2.p2}</div>
              <div><strong>${dataset.m2.s1} - ${dataset.m2.s2}</strong></div>
            </div>
          </div>
          <div class="lohko-box" style="border-left: 4px solid #e74c3c;">
            <h3>FINAALI</h3>
            <div class="ottelu-rivi">
              <div>${dataset.finaali.p1} vs ${dataset.finaali.p2}</div>
              <div><strong>${dataset.finaali.s1} - ${dataset.finaali.s2}</strong></div>
            </div>
          </div>
        </div>
      `;
    });
  }
}

// Salli adminin muokata yksittäistä solua suoraan Sheets-tyyliin
window.paivitaPelaajaNimiPaikalle = function(lohkoId, indeksi, uusiNimi) {
  const lRef = db.collection("tournaments").doc("active").collection("lohkot").doc(lohkoId);
  lRef.get().then(doc => {
    let pelaajat = [];
    if(doc.exists && doc.data().pelaajat) pelaajat = doc.data().pelaajat;
    pelaajat[indeksi] = uusiNimi.trim();
    lRef.set({ pelaajat: pelaajat }, { merge: true });
  });
}

// SEKOITUSTOIMINTO (SHUFFLE): Vain saman lohkon/luokan sisäiset paikat muuttuvat
if (document.getElementById('shuffle-players-btn')) {
  document.getElementById('shuffle-players-btn').addEventListener('click', () => {
    if(aktiivinenTabi.startsWith("CUP_")) {
      alert("Voit sekoittaa vain lohkovaiheen taulukoita!");
      return;
    }
    
    if (confirm(`Haluatko varmasti sekoittaa lohkon ${aktiivinenTabi} pelaajien paikat?`)) {
      const lRef = db.collection("tournaments").doc("active").collection("lohkot").doc(aktiivinenTabi);
      
      lRef.get().then(doc => {
        if(doc.exists && doc.data().pelaajat) {
          let lista = doc.data().pelaajat.filter(n => n !== ''); // Otetaan vain olemassa olevat nimet
          
          // Fisher-Yates shuffle sekoitusalgoritmi
          for (let i = lista.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lista[i], lista[j]] = [lista[j], lista[i]];
          }
          
          lRef.set({ pelaajat: lista }).then(() => {
            alert("Pelaajat sekoitettu onnistuneesti lohkon sisällä!");
          });
        } else {
          alert("Lohkossa ei ole vielä pelaajia sekoitettavaksi.");
        }
      });
    }
  });
}

window.addEventListener('authReady', initTournamentPage);