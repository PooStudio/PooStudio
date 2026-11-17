<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="PooStudio — Create your account.">
  <meta name="theme-color" content="#f4f2ec">
  <title>POOSTUDIO ✦ Signup</title>
  <link rel="icon" href="logo.png" type="image/png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IM+Fell+English:ital@0;1&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/signupcss.css">
  <link rel="stylesheet" href="assets/css/dark-theme.css">
  <script src="assets/js/service-worker.js" defer></script>
  <?php require __DIR__ . '/includes/firebase-config.php'; ?>
</head>
<body class="signup-page">

  <div id="progress-line"></div>

  <main id="main">

    <nav id="nav">
      <a href="index.php" class="nav-logo">PS</a>
      <ul class="nav-links">
        <li><a href="index.php">Home</a></li>
        <li><a href="https://discord.gg/CDW93dgA4m" target="_blank" rel="noopener">Discord</a></li>
      </ul>
    </nav>

    <section id="signup-section">

      <div class="signup-left">
        <span class="section-tag">02 — Join</span>
        <h1 class="signup-display">CREATE<br>ACCOUNT</h1>
        <p class="signup-lede">Create your account and join us while the studio takes shape.</p>
        <p class="signup-body">
          Set up your profile, meet the community,<br>
          and follow along as we build.
        </p>
      </div>

      <div class="signup-right">

        <div class="security-notice" role="alert">
          <span class="notice-label">Security Notice</span>
          <p>Use a unique password for this site. Do not reuse passwords from other accounts.</p>
        </div>

        <form id="signup-form" novalidate>

          <div class="form-field">
            <label for="f-username">Username</label>
            <input id="f-username" type="text" name="username" placeholder="your_handle" required minlength="3" maxlength="20" autocomplete="username">
            <div class="field-error" id="err-username" role="alert"></div>
          </div>

          <div class="form-field">
            <label for="f-email">Email</label>
            <input id="f-email" type="email" name="email" placeholder="you@example.com" required autocomplete="email">
            <div class="field-error" id="err-email" role="alert"></div>
          </div>

          <div class="form-field">
            <label for="f-password">Password</label>
            <input id="f-password" type="password" name="password" placeholder="Min 8 characters" required minlength="8" autocomplete="new-password">
            <div class="field-error" id="err-password" role="alert"></div>
          </div>

          <div class="form-field">
            <label for="f-confirm">Confirm Password</label>
            <input id="f-confirm" type="password" name="confirm_password" placeholder="Repeat password" required minlength="8" autocomplete="new-password">
            <div class="field-error" id="err-confirm" role="alert"></div>
          </div>

          <button type="submit" class="btn-primary" id="submit-btn">Create Account</button>

          <div class="divider"><span>or</span></div>

          <button type="button" class="btn-google" id="google-signup-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

        </form>

        <p class="form-footer" id="signup-status" role="status" aria-live="polite"></p>
        <p class="form-footer">
          Already have an account? <a href="index.php">Sign in</a>
        </p>

      </div>
    </section>

    <footer>
      <div class="footer-left">
        <span class="footer-logo">POOSTUDIO</span>
        <p class="footer-copy">© <?= date('Y') ?> PooStudio</p>
      </div>
      <div class="footer-right">
        <div class="footer-links">
          <a href="privacy.php">Privacy</a>
          <a href="terms.php">Terms</a>
          <a href="index.php">Home</a>
        </div>
      </div>
    </footer>

  </main>

  <script>
    window.addEventListener('scroll', () => {
      const nav = document.getElementById('nav');
      nav.classList.toggle('scrolled', window.scrollY > 12);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      document.getElementById('progress-line').style.width =
        `${maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0}%`;
    });

    const form       = document.getElementById('signup-form');
    const usernameEl = document.getElementById('f-username');
    const emailEl    = document.getElementById('f-email');
    const passEl     = document.getElementById('f-password');
    const confirmEl  = document.getElementById('f-confirm');
    const errUser    = document.getElementById('err-username');
    const errEmail   = document.getElementById('err-email');
    const errPass    = document.getElementById('err-password');
    const errConfirm = document.getElementById('err-confirm');

    const emailRx = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

    function setErr(el, errEl, msg) {
      errEl.textContent = msg;
      el.classList.toggle('invalid', !!msg);
    }

    function validateAll() {
      let ok = true;
      const u = usernameEl.value.trim();
      if (!u) { setErr(usernameEl, errUser, 'Username required.'); ok = false; }
      else if (u.length < 3) { setErr(usernameEl, errUser, 'Min 3 characters.'); ok = false; }
      else setErr(usernameEl, errUser, '');

      const e = emailEl.value.trim();
      if (!e) { setErr(emailEl, errEmail, 'Email required.'); ok = false; }
      else if (!emailRx.test(e)) { setErr(emailEl, errEmail, 'Invalid email.'); ok = false; }
      else setErr(emailEl, errEmail, '');

      const p = passEl.value;
      if (!p) { setErr(passEl, errPass, 'Password required.'); ok = false; }
      else if (p.length < 8) { setErr(passEl, errPass, 'Min 8 characters.'); ok = false; }
      else setErr(passEl, errPass, '');

      const c = confirmEl.value;
      if (!c) { setErr(confirmEl, errConfirm, 'Please confirm password.'); ok = false; }
      else if (c !== passEl.value) { setErr(confirmEl, errConfirm, 'Passwords do not match.'); ok = false; }
      else setErr(confirmEl, errConfirm, '');

      return ok;
    }

    [usernameEl, emailEl, passEl, confirmEl].forEach(el => {
      el.addEventListener('input', validateAll);
    });
  </script>

  <script type="module">
    import { firebaseConfig, hasFirebaseConfig } from "./assets/js/firebase-config.js";
    import { initializeApp }           from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
    import { getAuth, createUserWithEmailAndPassword, signInWithPopup,
             GoogleAuthProvider, updateProfile, sendEmailVerification }
                                       from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

    const app  = hasFirebaseConfig() ? initializeApp(firebaseConfig) : null;
    const auth = app ? getAuth(app) : null;
    const googleProvider = new GoogleAuthProvider();
    const form = document.getElementById('signup-form');
    const errEmail = document.getElementById('err-email');
    const errPass = document.getElementById('err-password');
    const submitBtn = document.getElementById('submit-btn');
    const googleBtn = document.getElementById('google-signup-btn');
    const signupStatus = document.getElementById('signup-status');

    if (!auth) {
      console.warn('Signup is disabled because Firebase config is not configured.');
      signupStatus.textContent = 'Sign-up is unavailable because Firebase is not configured for this deployment.';
      if (submitBtn) submitBtn.disabled = true;
      if (googleBtn) googleBtn.disabled = true;
      form.querySelectorAll('input').forEach((field) => {
        field.disabled = true;
      });
    } else {

      form.addEventListener('submit', async e => {
        e.preventDefault();

        const username = document.getElementById('f-username').value.trim();
        const email = document.getElementById('f-email').value.trim();
        const password = document.getElementById('f-password').value;
        const confirm = document.getElementById('f-confirm').value;

        errEmail.textContent = '';
        errPass.textContent = '';

        if (password !== confirm) {
          document.getElementById('err-confirm').textContent = 'Passwords do not match.';
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';

        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);

          try { await updateProfile(cred.user, { displayName: username }); }
          catch (uErr) { console.warn('updateProfile failed', uErr); }

          try { await sendEmailVerification(cred.user); }
          catch (vErr) { console.warn('sendEmailVerification failed', vErr); }

          localStorage.setItem('poostudio_signup_time', Date.now());
          alert('Account created. A verification email has been sent.');
          window.location.href = 'index.php';

        } catch (err) {
          const c = err?.code || '';
          if (c.includes('email-already-in-use')) {
            errEmail.textContent = 'An account with this email already exists.';
          } else if (c.includes('invalid-email')) {
            errEmail.textContent = 'Invalid email address.';
          } else if (c.includes('weak-password')) {
            errPass.textContent = 'Password is too weak.';
          } else {
            errEmail.textContent = 'Signup failed. Please try again.';
            console.error('Signup error:', err);
          }
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account';
        }
      });

      googleBtn.addEventListener('click', async () => {
        try {
          const cred = await signInWithPopup(auth, googleProvider);

          if (!cred.user.displayName) {
            const username = prompt('Choose a username (3–20 characters):');
            if (username && username.length >= 3 && username.length <= 20) {
              try { await updateProfile(cred.user, { displayName: username }); }
              catch (uErr) { console.warn('updateProfile failed', uErr); }
            }
          }

          try { await sendEmailVerification(cred.user); }
          catch (vErr) { console.warn('sendEmailVerification failed', vErr); }

          localStorage.setItem('poostudio_signup_time', Date.now());
          alert('Account created with Google! A verification email has been sent.');
          window.location.href = 'index.php';

        } catch (err) {
          if (err?.code !== 'auth/popup-closed-by-user') {
            alert('Google sign-up failed: ' + (err.message || err.code));
          }
          console.error('Google sign-up error:', err);
        }
      });
    }
  </script>

</body>
</html>