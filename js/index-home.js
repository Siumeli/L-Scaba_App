function initHomePage() {
  db.collection("tournaments").doc("active").onSnapshot(doc => {
    const container = document.getElementById('home-tournament-container');
    const adsContainer = document.getElementById('home-ads-container');
    if (!container) return;

    if (doc.exists && doc.data().published) {
      const tour = doc.data();
      const title = currentLang === 'fi' ? tour.nameFi : tour.nameEn;
      const desc = currentLang === 'fi' ? tour.descFi : tour.descEn;
      
      // Muotoillaan pvm ja aika näkyviin siististi
      const pvm = tour.date ? tour.date : 'Ei ilmoitettu';
      const aika = tour.time ? tour.time : 'Ei ilmoitettu';
      const paikka = tour.location ? tour.location : 'Ei ilmoitettu';

      container.innerHTML = `
        <div class="card">
          <img src="${tour.image}" style="width:100%; height:200px; object-fit:cover; border-radius:6px; margin-bottom:15px;">
          <h2>${title}</h2>
          
          <div class="tournament-info-bar" style="margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.03); border-radius: 4px; font-size: 14px;">
            📍 <strong>Sijainti:</strong> ${paikka} <br>
            📅 <strong>Päivämäärä:</strong> ${pvm} | ⏰ <strong>Klo:</strong> ${aika}
          </div>

          <p style="margin: 10px 0; line-height:1.5;">${desc}</p>
          <div id="registration-zone" style="margin-top:15px;">
            <button id="home-join-btn" class="btn btn-primary">Ilmoittaudu kisaan mukaan</button>
          </div>
        </div>
      `;

      // MAINOKSIEN NÄYTTÄMINEN
      if (adsContainer) {
        adsContainer.innerHTML = '';
        if (tour.ad1) {
          adsContainer.innerHTML += `<div class="ad-box"><img src="${tour.ad1}" alt="Mainos 1"></div>`;
        }
        if (tour.ad2) {
          adsContainer.innerHTML += `<div class="ad-box"><img src="${tour.ad2}" alt="Mainos 2"></div>`;
        }
      }

      const joinBtn = document.getElementById('home-join-btn');
      if (joinBtn) joinBtn.addEventListener('click', avaaIlmoittautuminen);
      checkUserRegistration();
    } else {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding:40px 20px;">
          <h2>Ei käynnissä olevia turnauksia juuri nyt.</h2>
          <p style="color:var(--text-color); opacity:0.7; margin-top:10px;">Palaa takaisin myöhemmin!</p>
        </div>
      `;
      if (adsContainer) adsContainer.innerHTML = '';
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

function checkUserRegistration() {
  if (!currentUser) return;
  db.collection("tournaments").doc("active").collection("participants").doc(currentUser.uid).onSnapshot(doc => {
    const zone = document.getElementById('registration-zone');
    if (!zone) return;

    if (doc.exists) {
      const status = doc.data().status;
      if (status === 'pending') {
        zone.innerHTML = `<div class="badge" style="background:#f39c12; display:block; text-align:center; padding:10px;">Ilmoittautuminen odottaa hyväksyntää... ⏳</div>`;
      } else if (status === 'approved') {
        zone.innerHTML = `<button class="btn btn-primary" style="width:100%; background:#2ecc71;" onclick="window.location.href='turnaus.html'">Näytä turnauskaavio 🏸</button>`;
      } else if (status === 'rejected') {
        zone.innerHTML = `<div class="badge" style="background:#c0392b; display:block; text-align:center; padding:10px;">Ilmoittautuminen hylätty.</div>`;
      }
    }
  });
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
        status: 'pending'
      }).then(() => {
        document.getElementById('join-modal').classList.add('hidden');
        alert("Ilmoittautumispyyntö lähetetty onnistuneesti!");
      });
    });
  }
});

window.addEventListener('authReady', initHomePage);