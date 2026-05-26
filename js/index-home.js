function initHomePage() {
  db.collection("tournaments").doc("active").onSnapshot(doc => {
    const container = document.getElementById('home-tournament-container');
    if (!container) return;

    if (doc.exists && doc.data().published) {
      const tour = doc.data();
      const title = currentLang === 'fi' ? tour.nameFi : tour.nameEn;
      const desc = currentLang === 'fi' ? tour.descFi : tour.descEn;

      container.innerHTML = `
        <div class="card">
          <img src="${tour.image}" style="width:100%; height:200px; object-fit:cover; border-radius:6px; margin-bottom:15px;">
          <h2>${title}</h2>
          <p style="margin: 10px 0; line-height:1.5;">${desc}</p>
          <div id="registration-zone" style="margin-top:15px;">
            <button id="home-join-btn" class="btn btn-primary">Ilmoittaudu kisaan mukaan</button>
          </div>
        </div>
      `;

      const joinBtn = document.getElementById('home-join-btn');
      if (joinBtn) joinBtn.addEventListener('click', avaaIlmoittautuminen);
      checkUserRegistration();
    } else {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding:40px 20px;">
          <h2>Ei käynnissä olevia kisoja</h2>
          <p style="color:#7f8c8d; margin-top:10px;">Tällä hetkellä ei ole avoimia LöScaba-turnauksia.</p>
        </div>
      `;
    }
  });
}

function checkUserRegistration() {
  const zone = document.getElementById('registration-zone');
  if (!zone || !currentUser) return;

  db.collection("tournaments").doc("active").collection("participants").doc(currentUser.uid).get().then(doc => {
    if (doc.exists) {
      const status = doc.data().status;
      if (status === 'pending') {
        zone.innerHTML = `<button class="btn btn-secondary" disabled style="width:100%;">Odottaa järjestäjän hyväksyntää...</button>`;
      } else if (status === 'approved') {
        zone.innerHTML = `<button class="btn btn-primary" style="width:100%; background:#2ecc71;" onclick="window.location.href='turnaus.html'">Näytä turnauskaavio 🏸</button>`;
      }
    }
  });
}

function avaaIlmoittautuminen() {
  if (!currentUser) {
    alert("Sinun täytyy kirjautua sisään ilmoittautuaksesi!");
    window.location.href = 'profiili.html';
    return;
  }
  const modal = document.getElementById('join-modal');
  if (modal) modal.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('close-modal-btn');
  const confirmBtn = document.getElementById('confirm-join-btn');

  if (closeBtn) closeBtn.addEventListener('click', () => document.getElementById('join-modal').classList.add('hidden'));
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (!currentUser) return;
      db.collection("tournaments").doc("active").collection("participants").doc(currentUser.uid).set({
        name: `${currentUser.firstname} ${currentUser.lastname}`,
        singles: document.getElementById('modal-singles').value,
        pClass: document.getElementById('modal-class').value,
        doubles: document.getElementById('modal-doubles').value,
        status: "pending",
        uid: currentUser.uid
      }).then(() => {
        document.getElementById('join-modal').classList.add('hidden');
        initHomePage();
      });
    });
  }
});