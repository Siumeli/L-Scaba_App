function initAdminPage() {
  if (!currentUser || currentUser.role !== 'admin') {
    alert("Pääsy evätty!"); window.location.href = 'index.html'; return;
  }

  db.collection("tournaments").doc("active").onSnapshot(doc => {
    const delBtn = document.getElementById('adm-del-btn');
    if (doc.exists && doc.data().published) {
      if (delBtn) delBtn.classList.remove('hidden');
      // Täytetään lomake nykyisillä tiedoilla jos halutaan päivittää
      const d = doc.data();
      if(document.getElementById('adm-name-fi')) document.getElementById('adm-name-fi').value = d.nameFi || '';
      if(document.getElementById('adm-name-en')) document.getElementById('adm-name-en').value = d.nameEn || '';
      if(document.getElementById('adm-image')) document.getElementById('adm-image').value = d.image || '';
      if(document.getElementById('adm-date')) document.getElementById('adm-date').value = d.date || '';
      if(document.getElementById('adm-time')) document.getElementById('adm-time').value = d.time || '';
      if(document.getElementById('adm-location')) document.getElementById('adm-location').value = d.location || '';
      if(document.getElementById('adm-desc-fi')) document.getElementById('adm-desc-fi').value = d.descFi || '';
      if(document.getElementById('adm-desc-en')) document.getElementById('adm-desc-en').value = d.descEn || '';
      if(document.getElementById('adm-ad1')) document.getElementById('adm-ad1').value = d.ad1 || '';
      if(document.getElementById('adm-ad2')) document.getElementById('adm-ad2').value = d.ad2 || '';
    } else {
      if (delBtn) delBtn.classList.add('hidden');
    }
  });
  haeOdottavatPyyntojat();
}

if (document.getElementById('adm-publish-btn')) {
  document.getElementById('adm-publish-btn').addEventListener('click', () => {
    db.collection("tournaments").doc("active").set({
      nameFi: document.getElementById('adm-name-fi').value.trim(),
      nameEn: document.getElementById('adm-name-en').value.trim(),
      image: document.getElementById('adm-image').value.trim() || "https://via.placeholder.com/600x300",
      date: document.getElementById('adm-date').value,
      time: document.getElementById('adm-time').value,
      location: document.getElementById('adm-location').value.trim(),
      descFi: document.getElementById('adm-desc-fi').value.trim(),
      descEn: document.getElementById('adm-desc-en').value.trim(),
      ad1: document.getElementById('adm-ad1').value.trim(),
      ad2: document.getElementById('adm-ad2').value.trim(),
      published: true
    }).then(() => {
      // Alustetaan taulukon lohkorakenne tyhjäksi, jos uusi turnaus luodaan
      alustaTyhjatLohkot();
      alert("Turnaus ja mainokset päivitetty etusivulle!");
    });
  });
}

function alustaTyhjatLohkot() {
  const lohkot = ["K1", "K2", "H1", "H2", "F1", "FP1", "FP2", "FP3", "FP4"];
  lohkot.forEach(lId => {
    const docRef = db.collection("tournaments").doc("active").collection("lohkot").doc(lId);
    docRef.get().then(doc => {
      if (!doc.exists) {
        docRef.set({ pelaajat: [] });
      }
    });
  });
}

if (document.getElementById('adm-del-btn')) {
  document.getElementById('adm-del-btn').addEventListener('click', () => {
    if (confirm("Haluatko varmasti poistaa turnauksen ja kaikki sen tiedot?")) {
      db.collection("tournaments").doc("active").delete().then(() => {
        alert("Turnaus poistettu.");
        window.location.reload();
      });
    }
  });
}

function haeOdottavatPyyntojat() {
  db.collection("tournaments").doc("active").collection("participants").where("status", "==", "pending").onSnapshot(snap => {
    const tbody = document.querySelector('#adm-req-table tbody');
    if (!tbody) return; 
    tbody.innerHTML = '';
    
    snap.forEach(doc => {
      const d = doc.data();
      let singeliTeksti = "Ei";
      if (d.singles === "kyllä" || d.singles === "Kyllä") {
        const luokka = d.pClass ? d.pClass.toUpperCase() : "HUPI";
        singeliTeksti = `Kyllä (<span class="badge">${luokka}</span>)`;
      }

      let neluriTeksti = "Ei";
      if (d.doubles === "kyllä" || d.doubles === "Kyllä") {
        neluriTeksti = "Kyllä 🏸";
      }

      tbody.innerHTML += `
        <tr>
          <td style="font-weight: 600;">${d.name}</td>
          <td>${singeliTeksti}</td>
          <td>${neluriTeksti}</td>
          <td>
            <button onclick="pAsetaStatus('${doc.id}','approved')" class="btn btn-primary" style="padding:6px 10px; background:#2ecc71;">Hyväksy</button>
            <button onclick="pAsetaStatus('${doc.id}','rejected')" class="btn btn-secondary" style="padding:6px 10px; background:#e74c3c;">Hylkää</button>
          </td>
        </tr>
      `;
    });
  });
}

window.pAsetaStatus = function(uid, tila) {
  const pRef = db.collection("tournaments").doc("active").collection("participants").doc(uid);
  
  if (tila === 'approved') {
    pRef.get().then(docSnapshot => {
      if (docSnapshot.exists) {
        const pData = docSnapshot.data();
        pRef.update({ status: 'approved' }).then(() => {
          sijoitaPelaajaAutomaattisesti(pData);
        });
      }
    });
  } else {
    pRef.update({ status: tila }).then(() => alert("Tila päivitetty: " + tila));
  }
}

// AUTOMAATTINEN SIJOITTELU REAALIAIKAISESTI HYVÄKSYNNÄN YHTEYDESSÄ
function sijoitaPelaajaAutomaattisesti(pelaaja) {
  // Tarkistetaan singeliluokka
  if (pelaaja.singles === "kyllä" || pelaaja.singles === "Kyllä") {
    let kohdeLohko = "F1"; // Oletus Hupi (FUN)
    if (pelaaja.pClass === "kilpa") kohdeLohko = "K1";
    if (pelaaja.pClass === "harraste") kohdeLohko = "H1";

    lisaaPelaajaLohkoon(kohdeLohko, pelaaja.name);
  }

  // Tarkistetaan neluri (4PLAY)
  if (pelaaja.doubles === "kyllä" || pelaaja.doubles === "Kyllä") {
    lisaaPelaajaLohkoon("FP1", pelaaja.name + " / ?"); // Neluripari oletuksena avoin
  }
}

function lisaaPelaajaLohkoon(lohkoId, nimi) {
  const lRef = db.collection("tournaments").doc("active").collection("lohkot").doc(lohkoId);
  db.runTransaction(transaction => {
    return transaction.get(lRef).then(lDoc => {
      let lista = [];
      if (lDoc.exists && lDoc.data().pelaajat) {
        lista = lDoc.data().pelaajat;
      }
      if (!lista.includes(nimi)) {
        lista.push(nimi);
      }
      transaction.set(lRef, { pelaajat: lista }, { merge: true });
    });
  }).catch(err => console.log("Lohkosijoitusvirhe: ", err));
}

window.addEventListener('authReady', initAdminPage);