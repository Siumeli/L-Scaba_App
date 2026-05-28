function initHomePage() {
  db.collection("tournaments").doc("active").onSnapshot(doc => {
    const container = document.getElementById('home-tournament-container');
    const adsContainer = document.getElementById('home-ads-container');
    
    if (!container) return;

    // 1. TURNAUKSEN NÄYTTÄMINEN
    if (doc.exists && doc.data().published) {
      const tour = doc.data();
      const title = currentLang === 'fi' ? tour.nameFi : tour.nameEn;
      const desc = currentLang === 'fi' ? tour.descFi : tour.descEn;
      
      const pvm = tour.date ? tour.date : 'Ei ilmoitettu';
      const aika = tour.time ? tour.time : 'Ei ilmoitettu';
      const paikka = tour.location ? tour.location : 'Ei ilmoitettu';

      container.innerHTML = `
        <div class="card">
          <img src="${tour.image}" style="width:100%; height:220px; object-fit:cover; border-radius:8px; margin-bottom:15px;">
          <h2 style="color:var(--primary-color); font-size:1.8rem; margin-bottom:10px;">${title}</h2>
          
          <div class="tournament-info-bar" style="margin: 15px 0; padding: 15px; background: rgba(230,126,34,0.05); border-left: 4px solid var(--primary-color); border-radius: 4px; font-size: 15px; line-height: 1.6;">
            📍 <strong>Sijainti:</strong> ${paikka} <br>
            📅 <strong>Päivämäärä:</strong> ${pvm} | ⏰ <strong>Klo:</strong> ${aika}
          </div>

          <p style="margin: 15px 0; line-height:1.6; white-space: pre-wrap;">${desc}</p>
          <div id="registration-zone" style="margin-top:20px;">
            <button id="home-join-btn" class="btn btn-primary" style="width:100%; padding:14px;">Ilmoittaudu kisaan mukaan</button>
          </div>
        </div>
      `;

      const joinBtn = document.getElementById('home-join-btn');
      if (joinBtn) joinBtn.addEventListener('click', avaaIlmoittautuminen);
      checkUserRegistration();
    } else {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding:50px 20px;">
          <h2 style="color:var(--primary-color);">Ei aktiivisia turnauksia juuri nyt.</h2>
          <p style="color:var(--text-color); opacity:0.7; margin-top:12px; font-size:1.1rem;">Palaa takaisin myöhemmin!</p>
        </div>
      `;
    }

    // 2. MAINOKSIEN NÄYTTÄMINEN (Lataa aina jos dataa löytyy dokumentista)
    if (adsContainer) {
      adsContainer.innerHTML = '';
      if (doc.exists) {
        const d = doc.data();
        
        // Mainos 1 piirto
        if (d.ad1) {
          const otsikko1 = d.ad1Title ? `<h4 style="margin-bottom:10px; color:var(--primary-color); font-weight:700;">${d.ad1Title}</h4>` : '';
          let ad1Content = `${otsikko1}<img src="${d.ad1}" alt="Mainos 1" style="width:100%; border-radius:6px; display:block; object-fit:contain; max-height:250px;">`;
          
          if (d.ad1Link) {
            adsContainer.innerHTML += `<div class="ad-box"><a href="${d.ad1Link}" target="_blank">${ad1Content}</a></div>`;
          } else {
            adsContainer.innerHTML += `<div class="ad-box">${ad1Content}</div>`;
          }
        }
        
        // Mainos 2 piirto
        if (d.ad2) {
          const otsikko2 = d.ad2Title ? `<h4 style="margin-bottom:10px; color:var(--primary-color); font-weight:700;">${d.ad2Title}</h4>` : '';
          let ad2Content = `${otsikko2}<img src="${d.ad2}" alt="Mainos 2" style="width:100%; border-radius:6px; display:block; object-fit:contain; max-height:250px;">`;
          
          if (d.ad2Link) {
            adsContainer.innerHTML += `<div class="ad-box"><a href="${d.ad2Link}" target="_blank">${ad2Content}</a></div>`;
          } else {
            adsContainer.innerHTML += `<div class="ad-box">${ad2Content}</div>`;
          }
        }
      }
    }
  });
}

function avaaIlmoittautuminen() {
  if (!currentUser) {
    alert("Sinun täytyy kirjautua sisään ilmoittautuaksesi!");
    window.location.href = 'profiili.html'; return;
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
        zone.innerHTML = `<div class="badge" style="display:block; text-align:center; padding:12px; font-size:1rem; background:#f39c12;">Ilmoittautuminen odottaa hyväksyntää... ⏳</div>`;
      } else if (status === 'approved') {
        zone.innerHTML = `<button class="btn btn-primary" style="width:100%; background:#2ecc71;" onclick="window.location.href='turnaus.html'">Näytä turnauskaavio 🏸</button>`;
      } else if (status === 'rejected') {
        zone.innerHTML = `<div class="badge" style="display:block; text-align:center; padding:12px; font-size:1rem; background:#c0392b;">Ilmoittautuminen hylätty.</div>`;
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