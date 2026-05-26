function initAdminPage() {
  if (!currentUser || currentUser.role !== 'admin') {
    alert("Pääsy evätty!"); window.location.href = 'index.html'; return;
  }

  db.collection("tournaments").doc("active").onSnapshot(doc => {
    const delBtn = document.getElementById('adm-del-btn');
    if (doc.exists && doc.data().published) {
      if (delBtn) delBtn.classList.remove('hidden');
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
      descFi: document.getElementById('adm-desc-fi').value.trim(),
      descEn: document.getElementById('adm-desc-en').value.trim(),
      published: true
    }).then(() => alert("Turnaus on nyt etusivulla!"));
  });
}

if (document.getElementById('adm-del-btn')) {
  document.getElementById('adm-del-btn').addEventListener('click', () => {
    if (confirm("Haluatko varmasti poistaa nykyisen turnauksen?")) {
      db.collection("tournaments").doc("active").delete().then(() => alert("Turnaus poistettu."));
    }
  });
}

function haeOdottavatPyyntojat() {
  db.collection("tournaments").doc("active").collection("participants").where("status", "==", "pending").onSnapshot(snap => {
    const tbody = document.querySelector('#adm-req-table tbody');
    if (!tbody) return; tbody.innerHTML = '';
    snap.forEach(doc => {
      const d = doc.data();
      tbody.innerHTML += `
        <tr>
          <td>${d.name}</td>
          <td>${d.pClass.toUpperCase()}</td>
          <td>
            <button onclick="pAsetaStatus('${doc.id}','approved')" class="btn btn-primary" style="padding:4px 8px; background:#2ecc71;">Hyväksy</button>
            <button onclick="pAsetaStatus('${doc.id}','rejected')" class="btn btn-secondary" style="padding:4px 8px; background:#e74c3c;">Hylkää</button>
          </td>
        </tr>
      `;
    });
  });
}

window.pAsetaStatus = function(id, s) {
  db.collection("tournaments").doc("active").collection("participants").doc(id).update({ status: s });
};