function initProfilePage() {
  const authSec = document.getElementById('auth-section');
  const profSec = document.getElementById('profile-section');

  if (!currentUser) {
    if (authSec) authSec.classList.remove('hidden');
    if (profSec) profSec.classList.add('hidden');
  } else {
    if (authSec) authSec.classList.add('hidden');
    if (profSec) {
      profSec.classList.remove('hidden');
      document.getElementById('profile-name').innerText = `${currentUser.firstname} ${currentUser.lastname}`;
      document.getElementById('profile-email-view').innerText = `Tili: ${currentUser.email}`;
      document.getElementById('role-badge').innerText = currentUser.role.toUpperCase();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const toReg = document.getElementById('go-to-register');
  const toLog = document.getElementById('go-to-login');
  
  if (toReg) toReg.addEventListener('click', () => {
    document.getElementById('login-box').classList.add('hidden');
    document.getElementById('register-box').classList.remove('hidden');
  });
  if (toLog) toLog.addEventListener('click', () => {
    document.getElementById('register-box').classList.add('hidden');
    document.getElementById('login-box').classList.remove('hidden');
  });

  if (document.getElementById('submit-login')) {
    document.getElementById('submit-login').addEventListener('click', () => {
      auth.signInWithEmailAndPassword(document.getElementById('login-email').value.trim(), document.getElementById('login-password').value).catch(err => alert(err.message));
    });
  }

  if (document.getElementById('submit-register')) {
    document.getElementById('submit-register').addEventListener('click', () => {
      const firstname = document.getElementById('reg-firstname').value.trim();
      const lastname = document.getElementById('reg-lastname').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      auth.createUserWithEmailAndPassword(email, document.getElementById('reg-password').value).then(cred => {
        return db.collection("users").doc(cred.user.uid).set({ firstname, lastname, email, role: "user", group: "asiakas", theme: "light", emailNotification: false });
      }).catch(err => alert(err.message));
    });
  }

  if (document.getElementById('logout-btn')) {
    document.getElementById('logout-btn').addEventListener('click', () => {
      auth.signOut().then(() => window.location.href = 'index.html');
    });
  }
});