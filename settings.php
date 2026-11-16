<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Manage your PooStudio account settings.">
  <title>Account settings | PooStudio</title>
  <link rel="icon" href="logo.png" type="image/png">
  <link rel="stylesheet" href="assets/css/settings.css">
  <script src="assets/js/service-worker.js" defer></script>
  <?php require __DIR__ . '/includes/firebase-config.php'; ?>
</head>
<body>

<main class="settings-page">
  <div class="settings-container">
    <header class="settings-header">
      <a href="profile.php" class="settings-back">← Profile</a>
      <a href="index.php" class="settings-brand">PooStudio</a>
    </header>

    <section class="settings-card" aria-labelledby="settings-title">
      <p class="settings-kicker">Account</p>
      <h1 id="settings-title">Settings</h1>
      <div id="message-container" aria-live="polite"></div>

      <section class="settings-section">
        <label for="settings-display-name">Display name</label>
        <div class="settings-form-row">
          <input id="settings-display-name" type="text" placeholder="Enter a display name" autocomplete="nickname">
          <button id="settings-save-name" class="btn btn-primary" type="button">Save name</button>
        </div>
      </section>

      <section class="settings-section">
        <label for="settings-avatar-input">Profile picture</label>
        <div class="settings-form-row settings-avatar-row">
          <input id="settings-avatar-input" type="file" accept="image/*" class="visually-hidden-file">
          <button id="settings-upload-avatar" class="btn btn-secondary" type="button">Choose photo</button>
          <button id="settings-save-avatar" class="btn btn-primary" type="button" style="display:none;">Save photo</button>
          <div id="avatar-preview" class="avatar-preview" aria-label="Profile picture preview"></div>
        </div>
      </section>

      <section class="settings-actions" aria-label="Account security">
        <button id="verify-email" class="btn btn-secondary" type="button">Send verification email</button>
        <button id="change-password" class="btn btn-secondary" type="button">Change password</button>
        <button id="logout" class="btn btn-danger" type="button">Sign out</button>
      </section>
    </section>
  </div>
</main>

<script type="module">
  import { firebaseConfig, hasFirebaseConfig } from "./assets/js/firebase-config.js";
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
  import { getAuth, onAuthStateChanged, signOut, sendEmailVerification, updatePassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
  import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";
  import { getFirestore, doc, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

  const app = hasFirebaseConfig() ? initializeApp(firebaseConfig) : null;
  const auth = app ? getAuth(app) : null;
  const storage = app ? getStorage(app) : null;
  const db = app ? getFirestore(app) : null;

  if (!auth || !storage || !db) {
    console.warn('Settings are unavailable because Firebase config is missing.');
  }
  const msgContainer = document.getElementById('message-container');

  function showMessage(text, isError = false) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${isError ? 'error' : ''}`;
    messageEl.textContent = text;
    msgContainer.appendChild(messageEl);
    setTimeout(() => { messageEl.remove(); }, 4000);
  }

  function setAvatarImage(container, source, altText, allowData = false) {
    try {
      const url = new URL(source, window.location.href);
      const safeDataImage = allowData && /^data:image\/(jpeg|png|webp);base64,/i.test(source);
      if (url.protocol !== 'https:' && url.origin !== window.location.origin && !safeDataImage) throw new Error('unsafe image URL');
      const image = document.createElement('img');
      image.src = url.href;
      image.alt = altText;
      image.loading = 'lazy';
      image.referrerPolicy = 'no-referrer';
      image.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      container.replaceChildren(image);
    } catch (_error) {
      container.textContent = 'U';
    }
  }

  function populateUser(user) {
    if (!user) return;
    document.getElementById('settings-display-name').value = user.displayName || '';
    const preview = document.getElementById('avatar-preview');
    if (user.photoURL) {
      setAvatarImage(preview, user.photoURL, 'Avatar');
    } else {
      preview.textContent = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
    }
  }

  if (auth) {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = 'index.php';
        return;
      }
      populateUser(user);
    });
  }

  async function uploadAvatarFile(file) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      showMessage('Choose a JPEG, PNG, or WebP image under 10 MB.', true);
      return;
    }
    const user = auth.currentUser;
    if (!user) { showMessage('Not authenticated', true); return; }
    try {
      async function resizeImage(fileBlob, size = 256) {
        const img = await createImageBitmap(fileBlob);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const { width, height } = img;
        const min = Math.min(width, height);
        const sx = (width - min) / 2;
        const sy = (height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        return await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
      }

      const resizedBlob = await resizeImage(file, 256);
      const avatarRef = ref(storage, `avatars/${user.uid}/avatar.jpg`);
      await uploadBytes(avatarRef, resizedBlob, { contentType: 'image/jpeg' });
      const url = await getDownloadURL(avatarRef);
      await updateProfile(user, { photoURL: url });
      populateUser(user);
      showMessage('Profile picture updated.');
    } catch (err) {
      console.error(err);
      showMessage('Upload failed: ' + (err.message || err.code), true);
    }
  }

  let selectedAvatarFileSettings = null;
  const settingsAvatarInput = document.getElementById('settings-avatar-input');
  const settingsSaveAvatarBtn = document.getElementById('settings-save-avatar');
  const settingsUploadTrigger = document.getElementById('settings-upload-avatar');
  if (settingsAvatarInput) {
    settingsAvatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      selectedAvatarFileSettings = file;
      const preview = document.getElementById('avatar-preview');
      const reader = new FileReader();
      reader.onload = () => { setAvatarImage(preview, reader.result, 'Preview', true); };
      reader.readAsDataURL(file);
      if (settingsSaveAvatarBtn) settingsSaveAvatarBtn.style.display = 'inline-block';
    });
  }

  if (settingsUploadTrigger) {
    settingsUploadTrigger.addEventListener('click', () => {
      if (settingsAvatarInput) settingsAvatarInput.click();
    });
  }

  if (settingsSaveAvatarBtn) {
    settingsSaveAvatarBtn.addEventListener('click', async () => {
      if (!selectedAvatarFileSettings) return;
      await uploadAvatarFile(selectedAvatarFileSettings);
      selectedAvatarFileSettings = null;
      settingsSaveAvatarBtn.style.display = 'none';
    });
  }

  document.getElementById('settings-save-name').addEventListener('click', async () => {
    if (!auth || !db) { console.warn('Auth is unavailable because Firebase config is missing.'); return; }
    const newName = document.getElementById('settings-display-name').value.trim();
    if (!newName) { showMessage('Please enter a display name', true); return; }
    const user = auth.currentUser;
    if (!user) { showMessage('Not authenticated', true); return; }
    try {
      const claimUsername = async (user, desiredName) => {
        const key = desiredName.trim().toLowerCase().replace(/\s+/g, '-');
        if (!/^[a-z0-9](?:[a-z0-9._-]{0,31})$/.test(key)) throw new Error('invalid-username');
        const desiredRef = doc(db, 'usernames', key);
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(desiredRef);
          if (snap.exists() && snap.data().uid !== user.uid) throw new Error('username-taken');
          tx.set(desiredRef, { uid: user.uid, createdAt: serverTimestamp() });
          const old = user.displayName ? user.displayName.trim().toLowerCase().replace(/\s+/g, '-') : '';
          if (old && old !== key) {
            const oldRef = doc(db, 'usernames', old);
            const oldSnap = await tx.get(oldRef);
            if (oldSnap.exists() && oldSnap.data().uid === user.uid) tx.delete(oldRef);
          }
        });
      };

      await claimUsername(user, newName);
      await updateProfile(user, { displayName: newName });
      showMessage('Display name updated.');
    } catch (err) {
      if (err && err.message === 'username-taken') {
        showMessage('That display name is already taken', true);
      } else if (err && err.message === 'invalid-username') {
        showMessage('Use 1-32 letters, numbers, spaces, dots, hyphens, or underscores.', true);
      } else {
        console.error(err);
        showMessage('Name update failed.', true);
      }
    }
  });

  document.getElementById('verify-email').addEventListener('click', async () => {
    if (!auth) { console.warn('Auth is unavailable because Firebase config is missing.'); return; }
    const user = auth.currentUser;
    if (!user) { showMessage('Not authenticated', true); return; }
    try { await sendEmailVerification(user); showMessage('Verification email sent.'); } catch (err) { showMessage('Failed: ' + (err.message || err.code), true); }
  });

  document.getElementById('change-password').addEventListener('click', async () => {
    if (!auth) { console.warn('Auth is unavailable because Firebase config is missing.'); return; }
    const newPassword = prompt('Enter your new password (min 8 chars):');
    if (!newPassword || newPassword.length < 8) { showMessage('Password must be at least 8 characters', true); return; }
    const user = auth.currentUser;
    if (!user) { showMessage('Not authenticated', true); return; }
    try { await updatePassword(user, newPassword); showMessage('Password updated.'); setTimeout(() => { signOut(auth); window.location.href='index.php'; }, 1800); } catch (err) { showMessage('Failed: ' + (err.message || err.code), true); }
  });

  document.getElementById('logout').addEventListener('click', async () => {
    if (!auth) { console.warn('Auth is unavailable because Firebase config is missing.'); return; }
    try { await signOut(auth); window.location.href = 'index.php'; } catch (err) { showMessage('Logout failed: ' + (err.message || err.code), true); }
  });

</script>

</body>
</html>
