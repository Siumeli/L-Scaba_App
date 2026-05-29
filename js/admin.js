function initAdminPage() {
  if (!currentUser || currentUser.role !== 'admin') {
    alert("Pääsy evätty!"); window.location.href = 'index.html'; return;
  }

  document.querySelectorAll('textarea.auto-resize').forEach(textarea => {
    textarea.addEventListener('input', autoResizeTextarea);
  });

  db.collection("tournaments").doc("active").onSnapshot(doc => {
    const delBtn = document.getElementById('adm-del-btn');
    const delAd1Btn = document.getElementById('adm-del-ad1-btn');
    const delAd2Btn = document.getElementById('adm-del-ad2-btn');

    if (doc.exists) {
      const d = doc.data();
      
      if(d.published && delBtn) delBtn.classList.remove('hidden');

      if(document.getElementById('adm-name-fi')) document.getElementById('adm-name-fi').value = d.nameFi || '';
      if(document.getElementById('adm-name-en')) document.getElementById('adm-name-en').value = d.nameEn || '';
      if(document.getElementById('adm-image')) document.getElementById('adm-image').value = d.image || '';
      if(document.getElementById('adm-date')) document.getElementById('adm-date').value = d.date || '';
      if(document.getElementById('adm-time')) document.getElementById('adm-time').value = d.time || '';
      if(document.getElementById('adm-location')) document.getElementById('adm-location').value = d.location || '';
      
      if(document.getElementById('adm-desc-fi')) {
        document.getElementById('adm-desc-fi').value = d.descFi || '';
        adjustHeight(document.getElementById('adm-desc-fi'));
      }
      if(document.getElementById('adm-desc-en')) {
        document.getElementById('adm-desc-en').value = d.descEn || '';
        adjustHeight(document.getElementById('adm-desc-en'));
      }
      
      if(document.getElementById('adm-ad1-title')) document.getElementById('adm-ad1-title').value = d.ad1Title || '';
      if(document.getElementById('adm-ad1')) document.getElementById('adm-ad1').value = d.ad1 || '';
      if(document.getElementById('adm-ad1-link')) document.getElementById('adm-ad1-link').value = d.ad1Link || '';
      if(d.ad1 && delAd1Btn) { delAd1Btn.classList.remove('hidden'); } else if(delAd1Btn) { delAd1Btn.classList.add('hidden'); }

      if(document.getElementById('adm-ad2-title')) document.getElementById('adm-ad2-title').value = d.ad2Title || '';
      if(document.getElementById('adm-ad2')) document.getElementById('adm-ad2').value = d.ad2 || '';
      if(document.getElementById('adm-ad2-link')) document.getElementById('adm-ad2-link').value = d.ad2Link || '';
      if(d.ad2 && delAd2Btn) { delAd2Btn.classList.remove('hidden'); } else if(delAd2Btn) { delAd2Btn.classList.add('hidden'); }
    } else {
      if (delBtn) delBtn.classList.add('hidden');
    }
  });
  haeOdottavatPyyntojat();
}

function autoResizeTextarea(e) { adjustHeight(e.target); }
function adjustHeight(element) {
  element.style.height = 'auto';
  element.style.height = element.scrollHeight + 'px';
}

function lueKuvaBase64(fileInput, urlInputId, callback) {
  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) { callback(e.target.result); };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    callback(document.getElementById(urlInputId).value.trim());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const setupFileListener = (fileId, textId) => {
    const fileIn = document.getElementById(fileId);
    if(fileIn) {
      fileIn.addEventListener('change', function() {
        if(this.files && this.files[0]) {
          document.getElementById(textId).value = `Ladattu tiedosto: ${this.files[0].name}`;
        }
      });
    }
  };
  setupFileListener('adm-image-file', 'adm-image');
  setupFileListener('adm-ad1-file', 'adm-ad1');
  setupFileListener('adm-ad2-file', 'adm-ad2');
});

if (document.getElementById('adm-publish-btn')) {
  document.getElementById('adm-publish-btn').addEventListener('click', () => {
    const fileInput = document.getElementById('adm-image-file');
    lueKuvaBase64(fileInput, 'adm-image', (kuvaData) => {
      db.collection("tournaments").doc("active").set({
        nameFi: document.getElementById('adm-name-fi').value.trim(),
        nameEn: document.getElementById('adm-name-en').value.trim(),
        image: kuvaData || "https://via.placeholder.com/600x300",
        date: document.getElementById('adm-date').value,
        time: document.getElementById('adm-time').value,
        location: document.getElementById('adm-location').value.trim(),
        descFi: document.getElementById('adm-desc-fi').value.trim(),
        descEn: document.getElementById('adm-desc-en').value.trim(),
        status: "active",
        published: true
      }, { merge: true }).then(() => {
        alustaTyhjatLohkot();
        console.log("Turnaus aloitettu ja kaaviot aktivoitu!");
        alert("Turnaus luotu/päivitetty!");
      });
    });
  });
}

if (document.getElementById('adm-save-ad1-btn')) {
  document.getElementById('adm-save-ad1-btn').addEventListener('click', () => {
    const fileInput = document.getElementById('adm-ad1-file');
    lueKuvaBase64(fileInput, 'adm-ad1', (kuvaData) => {
      db.collection("tournaments").doc("active").set({
        ad1Title: document.getElementById('adm-ad1-title').value.trim(),
        ad1: kuvaData,
        ad1Link: document.getElementById('adm-ad1-link').value.trim()
      }, { merge: true }).then(() => alert("Mainos 1 tallennettu!"));
    });
  });
}

if (document.getElementById('adm-del-ad1-btn')) {
  document.getElementById('adm-del-ad1-btn').addEventListener('click', () => {
    if(confirm("Haluatko poistaa Mainoksen 1?")) {
      db.collection("tournaments").doc("active").set({
        ad1Title: "", ad1: "", ad1Link: ""
      }, { merge: true }).then(() => {
        document.getElementById('adm-ad1-title').value = '';
        document.getElementById('adm-ad1').value = '';
        document.getElementById('adm-ad1-link').value = '';
        document.getElementById('adm-ad1-file').value = '';
        alert("Mainos 1 poistettu!");
      });
    }
  });
}

if (document.getElementById('adm-save-ad2-btn')) {
  document.getElementById('adm-save-ad2-btn').addEventListener('click', () => {
    const fileInput = document.getElementById('adm-ad2-file');
    lueKuvaBase64(fileInput, 'adm-ad2', (kuvaData) => {
      db.collection("tournaments").doc("active").set({
        ad2Title: document.getElementById('adm-ad2-title').value.trim(),
        ad2: kuvaData,
        ad2Link: document.getElementById('adm-ad2-link').value.trim()
      }, { merge: true }).then(() => alert("Mainos 2 Tallennettu!"));
    });
  });
}

if (document.getElementById('adm-del-ad2-btn')) {
  document.getElementById('adm-del-ad2-btn').addEventListener('click', () => {
    if(confirm("Haluatko poistaa Mainoksen 2?")) {
      db.collection("tournaments").doc("active").set({
        ad2Title: "", ad2: "", ad2Link: ""
      }, { merge: true }).then(() => {
        document.getElementById('adm-ad2-title').value = '';
        document.getElementById('adm-ad2').value = '';
        document.getElementById('adm-ad2-link').value = '';
        document.getElementById('adm-ad2-file').value = '';
        alert("Mainos 2 poistettu!");
      });
    }
  });
}

function alustaTyhjatLohkot() {
  const lohkot = ["K1", "K2", "H1", "H2", "F1", "FP1", "FP2", "FP3", "FP4"];
  lohkot.forEach(lId => {
    const docRef = db.collection("tournaments").doc("active").collection("lohkot").doc(lId);
    docRef.get().then(doc => { if (!doc.exists) { docRef.set({ pelaajat: [] }); } });
  });
}

if (document.getElementById('adm-del-btn')) {
  document.getElementById('adm-del-btn').addEventListener('click', () => {
    if (confirm("Haluatko varmasti poistaa turnauksen?")) {
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
    if (!tbody) return; tbody.innerHTML = '';
    snap.forEach(doc => {
      const d = doc.data();
      let singeliTeksti = "Ei";
      if (d.singles === "kyllä" || d.singles === "Kyllä") {
        singeliTeksti = `Kyllä (<span class="badge">${(d.pClass || 'HUPI').toUpperCase()}</span>)`;
      }
      let neluriTeksti = d.doubles === "kyllä" || d.doubles === "Kyllä" ? "Kyllä 🏸" : "Ei";
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
        pRef.update({ status: 'approved' }).then(() => sijoitaPelaajaAutomaattisesti(pData));
      }
    });
  } else {
    pRef.update({ status: tila }).then(() => alert("Tila päivitetty: " + tila));
  }
}

function sijoitaPelaajaAutomaattisesti(pelaaja) {
  if (pelaaja.singles === "kyllä" || pelaaja.singles === "Kyllä") {
    let kohdeLohko = "F1"; 
    
    if (pelaaja.pClass === "kilpa") {
      lisaaTasapainotettuPelaaja(["K1", "K2"], pelaaja.name);
    } else if (pelaaja.pClass === "harraste") {
      lisaaTasapainotettuPelaaja(["H1", "H2"], pelaaja.name);
    } else {
      lisaaPelaajaLohkoon("F1", pelaaja.name);
    }
  }

  if (pelaaja.doubles === "kyllä" || pelaaja.doubles === "Kyllä") {
    lisaaTasapainotettuPelaaja(["FP1", "FP2", "FP3", "FP4"], pelaaja.name + " / ?"); 
  }
}

function lisaaTasapainotettuPelaaja(lohkoLista, nimi) {
  let hakuLupaukset = lohkoLista.map(lId => db.collection("tournaments").doc("active").collection("lohkot").doc(lId).get());
  
  Promise.all(hakuLupaukset).then(snapshots => {
    let valittuLohkoId = lohkoLista[0];
    let pieninMaara = Infinity;

    snapshots.forEach((snap, index) => {
      let pLista = snap.exists && snap.data().pelaajat ? snap.data().pelaajat : [];
      if (pLista.length < pieninMaara) {
        pieninMaara = pLista.length;
        valittuLohkoId = lohkoLista[index];
      }
    });

    lisaaPelaajaLohkoon(valittuLohkoId, nimi);
  });
}

function lisaaPelaajaLohkoon(lohkoId, nimi) {
  const lRef = db.collection("tournaments").doc("active").collection("lohkot").doc(lohkoId);
  db.runTransaction(transaction => {
    return transaction.get(lRef).then(lDoc => {
      let lista = lDoc.exists && lDoc.data().pelaajat ? lDoc.data().pelaajat : [];
      if (!lista.includes(nimi)) { lista.push(nimi); }
      transaction.set(lRef, { pelaajat: lista }, { merge: true });
    });
  }).then(() => alert(`${nimi} lisätty automaattisesti lohkoon: ${lohkoId}`))
    .catch(err => console.log("Lohkosijoitusvirhe: ", err));
}

window.addEventListener('authReady', initAdminPage);