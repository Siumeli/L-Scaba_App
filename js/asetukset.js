function initAsetuksetPage() {
  const darkToggle = document.getElementById('darkmode-toggle');
  const emailToggle = document.getElementById('email-notif-toggle');
  
  if (!currentUser) return;

  if (darkToggle) darkToggle.checked = (currentUser.theme === 'dark');
  if (emailToggle) emailToggle.checked = (currentUser.emailNotification === true);
}

if (document.getElementById('save-settings-btn')) {
  document.getElementById('save-settings-btn').addEventListener('click', () => {
    if (!currentUser) { alert("Kirjaudu ensin sisään!"); return; }

    const isDark = document.getElementById('darkmode-toggle').checked;
    const wantEmail = document.getElementById('email-notif-toggle').checked;

    db.collection("users").doc(currentUser.uid).update({
      theme: isDark ? 'dark' : 'light',
      emailNotification: wantEmail
    }).then(() => {
      if (isDark) { document.body.classList.add('dark-mode'); } 
      else { document.body.classList.remove('dark-mode'); }
      alert("Asetukset tallennettu onnistuneesti!");
    }).catch(err => alert(err.message));
  });
}