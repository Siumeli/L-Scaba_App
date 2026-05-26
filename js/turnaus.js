function initTournamentPage() {
  db.collection("tournaments").doc("active").onSnapshot(doc => {
    const content = document.getElementById('tournament-page-content');
    if (!content) return;
    if (doc.exists && doc.data().published) {
      renderLiveBrackets(doc.data());
    } else {
      content.innerHTML = "<h2>Ei käynnissä olevia turnauksia juuri nyt.</h2>";
    }
  });
}

function renderLiveBrackets(tour) {
  const content = document.getElementById('tournament-page-content');
  const isAdmin = currentUser && currentUser.role === 'admin';

  db.collection("tournaments").doc("active").collection("ottelut").doc("data").onSnapshot(doc => {
    let dataset = { l1: { p1: "Pelaaja 1", p2: "Pelaaja 2", s1: 0, s2: 0 } };
    if (doc.exists) dataset = doc.data();

    content.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <h2>${currentLang === 'fi' ? tour.nameFi : tour.nameEn}</h2>
        ${isAdmin ? '<span class="badge" style="background:#e74c3c;">Muokkaustila</span>' : ''}
      </div>
      <div class="kaavio-container">
        <div class="lohko-box">
          <h3>Ottelu 1 (Google Sheets Livenä)</h3>
          <div class="ottelu-rivi">
            <div>
              ${isAdmin 
                ? `<input type="text" class="player-edit-input" value="${dataset.l1.p1}" onchange="sheetsMuutaTeksti('l1','p1',this.value)"> vs 
                   <input type="text" class="player-edit-input" value="${dataset.l1.p2}" onchange="sheetsMuutaTeksti('l1','p2',this.value)">`
                : `<span>${dataset.l1.p1} vs ${dataset.l1.p2}</span>`
              }
            </div>
            <div>
              <input type="number" class="score-input" value="${dataset.l1.s1}" ${!isAdmin ? 'disabled' : ''} onchange="sheetsMuutaPiste('l1','s1',this.value)">
              <input type="number" class="score-input" value="${dataset.l1.s2}" ${!isAdmin ? 'disabled' : ''} onchange="sheetsMuutaPiste('l1','s2',this.value)">
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

window.sheetsMuutaTeksti = function(mId, pId, v) {
  let u = {}; u[`${mId}.${pId}`] = v;
  db.collection("tournaments").doc("active").collection("ottelut").doc("data").update(u);
};
window.sheetsMuutaPiste = function(mId, sId, v) {
  let u = {}; u[`${mId}.${sId}`] = parseInt(v) || 0;
  db.collection("tournaments").doc("active").collection("ottelut").doc("data").update(u);
};