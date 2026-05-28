function initAsetuksetPage() {
  const darkToggle = document.getElementById('darkmode-toggle');
  const emailToggle = document.getElementById('email-notif-toggle');
  
  if (!currentUser) return;

  if (darkToggle) darkToggle.checked = (currentUser.theme === 'dark');
  if (emailToggle) emailToggle.checked = (currentUser.emailNotification === true);

  tarkistaTurnausOsallistuminen();
}

function tarkistaTurnausOsallistuminen() {
  const quitZone = document.getElementById('quit-tournament-zone');
  const quitBtn = document.getElementById('quit-tournament-btn');

  if (!quitZone || !currentUser) return;

  db.collection("tournaments").doc("active").collection("participants").doc(currentUser.uid).onSnapshot(doc => {
    if (doc.exists && doc.data().status === 'approved') {
      quitZone.classList.remove('hidden');
    } else {
      quitZone.classList.add('hidden');
    }
  });

  if (quitBtn && !quitBtn.dataset.listenerAttached) {
    quitBtn.dataset.listenerAttached = "true";
    quitBtn.addEventListener('click', () => {
      if (confirm("Haluatko varmasti peruuttaa osallistumisesi turnaukseen? Nimesi poistetaan kaavioista.")) {
        
        const kokoNimi = `${currentUser.firstname} ${currentUser.lastname}`;
        
        // 1. Poistetaan participant-dokumentti
        db.collection("tournaments").doc("active").collection("participants").doc(currentUser.uid).delete().then(() => {
          
          // 2. Etsitään ja siivotaan lohkot, joissa kyseinen pelaaja tai pari on
          const lohkoIdt = ["K1", "K2", "H1", "H2", "F1", "FP1", "FP2", "FP3", "FP4"];
          
          lohkoIdt.forEach(lId => {
            const lRef = db.collection("tournaments").doc("active").collection("lohkot").doc(lId);
            
            db.runTransaction(transaction => {
              return transaction.get(lRef).then(lDoc => {
                if (lDoc.exists && lDoc.data().pelaajat) {
                  let vanhatPelaajat = lDoc.data().pelaajat;
                  // Poistetaan singelinimi tai neluripari, jossa pelaaja esiintyy
                  let uudetPelaajat = vanhatPelaajat.filter(nimi => !nimi.includes(currentUser.firstname));
                  transaction.update(lRef, { pelaajat: uudetPelaajat });
                }
              });
            }).catch(e => console.log("Lohkon siivousvirhe: ", e));
          });

          alert("Osallistuminen peruttu onnistuneesti.");
        });
      }
    });
  }
}

if (document.getElementById('save-settings-btn')) {
  document.getElementById('save-settings-btn').addEventListener('click', () => {
    if (!currentUser) { 
      alert("Kirjaudu ensin sisään!"); 
      return; 
    }

    const isDark = document.getElementById('darkmode-toggle').checked;
    const wantEmail = document.getElementById('email-notif-toggle').checked;

    db.collection("users").doc(currentUser.uid).update({
      theme: isDark ? 'dark' : 'light',
      emailNotification: wantEmail
    }).then(() => {
      if (isDark) { 
        document.body.classList.add('dark-mode'); 
      } else { 
        document.body.classList.remove('dark-mode'); 
      }
      alert("Asetukset tallennettu onnistuneesti!");
    }).catch(err => alert(err.message));
  });
}

window.addEventListener('authReady', initAsetuksetPage);