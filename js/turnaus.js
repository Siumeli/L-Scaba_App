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
  
  // Varmistetaan näkyvyys: admin näkee aina, pelaaja jos hyväksytty
  if (currentUser && currentUser.role === 'admin') {
    if (adminPanel) adminPanel.classList.remove('hidden');
    lataaTurnausSisalto();
  } else if (currentUser) {
    db.collection("tournaments").doc("active").collection("participants").doc(currentUser.uid).get().then(doc => {
      if (doc.exists && doc.data().status === 'approved') {
        lataaTurnausSisalto();
      } else {
        NaytaEvattyPääsy();
      }
    });
  } else {
    NaytaEvattyPääsy();
  }
}

function NaytaEvattyPääsy() {
  const content = document.getElementById('tournament-page-content');
  if (content) {
    content.innerHTML = `
      <div style="text-align:center; padding: 40px 10px;">
        <h2 style="color:var(--primary-color);">Pääsy evätty</h2>
        <p style="margin-top:10px; opacity:0.8;">Sinun täytyy olla ilmoittautunut ja adminin hyväksymä nähdäksesi ottelukaaviot.</p>
      </div>
    `;
  }
}

function lataaTurnausSisalto() {
  rakennaVälilehdet();
  kuunteleLohkonDataa(aktiivinenTabi);
}

function rakennaVälilehdet() {
  let nav = document.querySelector('.tab-navigation');
  if (!nav) {
    nav = document.createElement('nav');
    nav.className = 'tab-navigation';
    document.getElementById('tournament-page-content').before(nav);
  }
  
  nav.innerHTML = KAIKKI_TABIT.map(t => `
    <button class="tab-btn ${t.id === aktiivinenTabi ? 'active' : ''}" onclick="vaihdaTabi('${t.id}')">${t.nimi}</button>
  `).join('');
}

window.vaihdaTabi = function(tabId) {
  aktiivinenTabi = tabId;
  rakennaVälilehdet();
  kuunteleLohkonDataa(tabId);
};

function kuunteleLohkonDataa(lohkoId) {
  const content = document.getElementById('tournament-page-content');
  if (!content) return;

  db.collection("tournaments").doc("active").collection("lohkot").doc(lohkoId).onSnapshot(doc => {
    if (!doc.exists || !doc.data().pelaajat || doc.data().pelaajat.length === 0) {
      content.innerHTML = `<p style="text-align:center; padding:20px; opacity:0.6;">Ei vielä pelaajia tässä lohkossa.</p>`;
      return;
    }

    const data = doc.data();
    const pelaajat = data.pelaajat.filter(p => p.trim() !== "");
    const ottelutulokset = data.ottelut || {};

    // Luodaan Round Robin -ottelulista (kaikki kaikkia vastaan) dynaamisesti
    let ottelut = [];
    for (let i = 0; i < pelaajat.length; i++) {
      for (let j = i + 1; j < pelaajat.length; j++) {
        ottelut.push({ p1: pelaajat[i], p2: pelaajat[j] });
      }
    }

    // Lasketaan Leaderboard-pisteet lennosta ottelutulosten perusteella
    let stats = {};
    pelaajat.forEach(p => stats[p] = { ottelut: 0, erat: 0 });

    Object.keys(ottelutulokset).forEach(avain => {
      const tulos = ottelutulokset[avain]; // muotoa {s1: 2, s2: 1}
      const [p1, p2] = avain.split("_vs_");
      
      if(stats[p1] && stats[p2] && tulos.s1 !== undefined && tulos.s2 !== undefined) {
        const s1 = parseInt(tulos.s1) || 0;
        const s2 = parseInt(tulos.s2) || 0;

        stats[p1].erat += s1;
        stats[p2].erat += s2;

        if (s1 > s2) stats[p1].ottelut += 1;
        if (s2 > s1) stats[p2].ottelut += 1;
      }
    });

    // Järjestetään tilasto: 1. Voitetut ottelut, 2. Voitetut erät
    const jarjestettyLeaderboard = Object.keys(stats).map(nimi => ({
      nimi, ...stats[nimi]
    })).sort((a, b) => b.ottelut - a.ottelut || b.erat - a.erat);

    // Rakennetaan HTML
    let html = `
      <div class="card" style="margin-bottom:25px;">
        <h3 style="color:var(--primary-color); margin-bottom:15px;">Tilanne / Leaderboard</h3>
        <table>
          <thead>
            <tr>
              <th>Sija</th>
              <th>Pelaaja / Pari</th>
              <th>Voitetut ottelut</th>
              <th>Voitetut erät</th>
            </tr>
          </thead>
          <tbody>
            ${jarjestettyLeaderboard.map((row, index) => `
              <tr>
                <td><strong>${index + 1}.</strong></td>
                <td style="font-weight:600;">${row.nimi}</td>
                <td><span class="badge" style="background:#2ecc71;">${row.ottelut} Voittoa</span></td>
                <td>${row.erat} Erää</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3 style="color:var(--primary-color); margin-bottom:15px;">Ottelukaaviot ja tulokset</h3>
        <div class="kaavio-container">
    `;

    const isAdmin = currentUser && currentUser.role === 'admin';

    ottelut.forEach((o, index) => {
      const otteluAvain = `${o.p1}_vs_${o.p2}`;
      const t = ottelutulokset[otteluAvain] || { s1: "", s2: "" };

      html += `
        <div class="ottelu-rivi">
          <div style="flex:1; font-weight:600; font-size:0.95rem;">
            <span style="color:var(--primary-color);">M${index+1}:</span> ${o.p1} <span style="opacity:0.5;">vs</span> ${o.p2}
          </div>
          <div style="display:flex; gap:5px; align-items:center;">
            <input type="number" min="0" placeholder="0" class="score-input" 
              id="score1_${index}" value="${t.s1}" ${!isAdmin ? 'disabled' : ''}>
            <span style="opacity:0.5;">-</span>
            <input type="number" min="0" placeholder="0" class="score-input" 
              id="score2_${index}" value="${t.s2}" ${!isAdmin ? 'disabled' : ''}>
            ${isAdmin ? `
              <button class="btn btn-primary" style="padding:6px 12px; font-size:0.8rem; margin-left:10px; border-radius:6px;" 
                onclick="tallennaOtteluTulos('${o.p1}', '${o.p2}', ${index})">Tallenna</button>
            ` : ''}
          </div>
        </div>
      `;
    });

    html += `</div></div>`;
    content.innerHTML = html;
  });
}

window.tallennaOtteluTulos = function(p1, p2, index) {
  const s1Val = document.getElementById(`score1_${index}`).value;
  const s2Val = document.getElementById(`score2_${index}`).value;

  if (s1Val === "" || s2Val === "") {
    alert("Syötä molemmat eräpisteet!"); return;
  }

  const otteluAvain = `${p1}_vs_${p2}`;
  
  db.collection("tournaments").doc("active").collection("lohkot").doc(aktiivinenTabi).set({
    ottelut: {
      [otteluAvain]: {
        s1: parseInt(s1Val),
        s2: parseInt(s2Val)
      }
    }
  }, { merge: true }).then(() => {
    console.log("Tulos päivitetty onnistuneesti!");
  }).catch(err => alert("Virhe tallennuksessa: " + err.message));
};

// Sekoitustoiminto lohkon sisäisille pelaajille
if (document.getElementById('shuffle-players-btn')) {
  document.getElementById('shuffle-players-btn').addEventListener('click', () => {
    if (confirm(`Haluatko varmasti sekoittaa lohkon ${aktiivinenTabi} pelaajien järjestyksen?`)) {
      const lRef = db.collection("tournaments").doc("active").collection("lohkot").doc(aktiivinenTabi);
      lRef.get().then(doc => {
        if(doc.exists && doc.data().pelaajat) {
          let lista = doc.data().pelaajat.filter(n => n.trim() !== '');
          for (let i = lista.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lista[i], lista[j]] = [lista[j], lista[i]];
          }
          lRef.update({ pelaajat: lista }).then(() => alert("Lohko sekoitettu!"));
        }
      });
    }
  });
}

window.addEventListener('authReady', initTournamentPage);