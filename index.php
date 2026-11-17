<?php
$pageTitle = 'PooStudio — A creative studio in progress';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="PooStudio is a creative studio building a home for ideas, tools and the people behind them." />
  <meta name="theme-color" content="#151a25" />
  <title><?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?></title>
  <link rel="icon" href="logo.png" type="image/png" />
  <link rel="stylesheet" href="assets/css/home.css">
  <link rel="stylesheet" href="assets/css/dark-theme.css">
  <script src="assets/js/service-worker.js" defer></script>
  <?php require __DIR__ . '/includes/firebase-config.php'; ?>
</head>
<body class="home-page">
  <a class="skip-link" href="#main">Skip to content</a>
  <div id="progress-line"></div>

  <nav id="nav" aria-label="Main navigation">
    <a href="index.php" class="nav-logo">PooStudio</a>
    <ul class="nav-links">
      <li><a href="#about">The studio</a></li>
      <li><a href="https://discord.gg/CDW93dgA4m" target="_blank" rel="noopener noreferrer">Community</a></li>
      <li id="auth-nav">
        <a href="profile.php">Profile</a>
        <span id="signed-in-indicator"></span>
      </li>
    </ul>
    <button class="nav-signin" id="login-trigger" type="button">Member sign in</button>
  </nav>

  <main id="main">

    <section id="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <span class="hero-tag">A creative studio, in progress</span>
        <h1 class="hero-title" id="hero-title">Make room for what’s next.</h1>
        <p class="hero-body">
          PooStudio is building a home for ideas, tools and the people behind them.
          We’re taking our time and sharing the work as it comes together.
        </p>
        <div class="hero-actions">
          <a class="button-link button-primary" href="#about">Get to know the studio</a>
          <a class="button-link button-secondary" href="https://discord.gg/CDW93dgA4m" target="_blank" rel="noopener noreferrer">Join the conversation</a>
        </div>
      </div>
      <div class="hero-art">
        <img src="logo.png" alt="PooStudio monogram" width="1024" height="1024">
      </div>
    </section>

    <section id="about" aria-labelledby="about-title">
      <div class="section-num">01 / The studio</div>
      <div class="about-content">
        <h2 class="about-big" id="about-title">Good ideas need room to <em>become.</em></h2>
        <p class="about-small">
          We’re creating a thoughtful, useful place for people who like to make things.
          The platform is still taking shape; the focus is on building it carefully,
          listening to the people who will use it, and making the details count.
        </p>
      </div>
    </section>

    <section id="studio-note" aria-labelledby="studio-note-title">
      <div class="studio-note-copy">
        <span class="status-label">What’s happening</span>
        <h2 id="studio-note-title">Still in the workshop.</h2>
        <p>We’re building behind the scenes. Join the community for updates, questions and the occasional first look.</p>
      </div>
      <a class="studio-note-link" href="https://discord.gg/CDW93dgA4m" target="_blank" rel="noopener noreferrer">Find us on Discord <span aria-hidden="true">&nbsp;↗</span></a>
    </section>

    <footer>
      <div class="footer-left">
        <a class="footer-logo" href="index.php">PooStudio</a>
        <p class="footer-copy">© <?= date('Y') ?> PooStudio</p>
      </div>
      <div class="footer-links">
        <a href="privacy.php">Privacy</a>
        <a href="terms.php">Terms</a>
        <a href="https://discord.gg/CDW93dgA4m" target="_blank" rel="noopener noreferrer">Discord</a>
      </div>
    </footer>

  </main>
  <div id="login-modal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="login-title">
    <div class="login-panel">
      <button class="login-close" id="login-close" type="button" aria-label="Close sign-in dialog">Close</button>
      <div class="login-label">Access</div>
      <div class="login-title" id="login-title">Sign In</div>
      <p class="login-sub">Sign in to your PooStudio account.</p>

      <form id="login-form" novalidate>
        <div class="login-field">
          <label for="login-email">Email</label>
          <input id="login-email" type="email" name="email" placeholder="you@example.com" autocomplete="email" />
        </div>
        <div class="field-error" id="email-error" role="alert" aria-live="polite"></div>

        <div class="login-field">
          <label for="login-password">Password</label>
          <input id="login-password" type="password" name="password" placeholder="Password" autocomplete="current-password" />
        </div>
        <div class="field-error" id="password-error" role="alert" aria-live="polite"></div>

        <button type="submit" class="login-submit" id="login-submit" disabled>Login</button>

        <div class="login-divider"><span>or</span></div>

        <button type="button" class="google-btn" id="google-signin">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </form>

      <p class="login-footer">
        No account? <a href="signup.php">Sign up</a>
      </p>
      <p id="login-status" role="status"></p>
    </div>
  </div>

  <script>
    const progressLine = document.getElementById('progress-line');
    const nav = document.getElementById('nav');
    const updateScrollState = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      progressLine.style.width = `${maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0}%`;
      nav.classList.toggle('scrolled', window.scrollY > 12);
    };
    window.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();

    const loginModal = document.getElementById('login-modal');
    const loginTrigger = document.getElementById('login-trigger');
    const loginClose = document.getElementById('login-close');
    const loginForm = document.getElementById('login-form');
    const emailInput = loginForm.querySelector('input[type="email"]');
    const passInput = loginForm.querySelector('input[type="password"]');
    const emailError = document.getElementById('email-error');
    const passError = document.getElementById('password-error');
    const submitBtn = document.getElementById('login-submit');

    const emailRx = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

    function validateEmail() {
      const v = emailInput.value.trim();
      if (!v) { emailError.textContent = ''; emailInput.classList.remove('invalid'); return false; }
      if (!emailRx.test(v)) { emailError.textContent = 'Enter a valid email address.'; emailInput.classList.add('invalid'); return false; }
      emailError.textContent = ''; emailInput.classList.remove('invalid'); return true;
    }

    function validatePass() {
      const v = passInput.value;
      if (!v) { passError.textContent = ''; passInput.classList.remove('invalid'); return false; }
      if (v.length < 6) { passError.textContent = 'Use at least 6 characters.'; passInput.classList.add('invalid'); return false; }
      passError.textContent = ''; passInput.classList.remove('invalid'); return true;
    }

    [emailInput, passInput].forEach(el => {
      el.addEventListener('input', () => { submitBtn.disabled = !(validateEmail() && validatePass()); });
    });

    function openLogin() {
      loginModal.classList.add('open');
      loginModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('login-open');
      emailInput.focus();
    }
    function closeLogin() {
      loginModal.classList.remove('open');
      loginModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('login-open');
      loginTrigger.focus();
    }
    window.closeLoginDialog = closeLogin;

    loginTrigger.addEventListener('click', openLogin);
    loginClose.addEventListener('click', closeLogin);
    loginModal.addEventListener('click', e => { if (e.target === loginModal) closeLogin(); });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && loginModal.classList.contains('open')) closeLogin();
    });
  </script>

  <script type="module">
    import { firebaseConfig, hasFirebaseConfig } from "./assets/js/firebase-config.js";
    import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
    import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

    const app = hasFirebaseConfig() ? initializeApp(firebaseConfig) : null;
    const auth = app ? getAuth(app) : null;
    const googleProvider = new GoogleAuthProvider();
    const form = document.getElementById('login-form');
    const submitButton = document.getElementById('login-submit');
    const googleButton = document.getElementById('google-signin');
    const emailError = document.getElementById('email-error');
    const passError = document.getElementById('password-error');
    const status = document.getElementById('login-status');

    if (!auth) {
      console.warn('Authentication is disabled because Firebase config is not configured for this deployment.');
      submitButton.disabled = true;
      googleButton.disabled = true;
      form.querySelectorAll('input').forEach((field) => { field.disabled = true; });
      status.textContent = 'Sign-in is temporarily unavailable.';
    } else {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value.trim();
        const pass = form.querySelector('input[type="password"]').value;
        try {
          const cred = await signInWithEmailAndPassword(auth, email, pass);
          if (!cred.user.emailVerified) {
            await signOut(auth);
            passError.textContent = 'Verify your email before signing in.';
            return;
          }
          window.closeLoginDialog();
          window.location.reload();
        } catch (err) {
          const c = err?.code || '';
          if (c.includes('user-not-found') || c.includes('invalid-email')) emailError.textContent = 'No account found.';
          else if (c.includes('wrong-password')) passError.textContent = 'Incorrect password.';
          else if (c.includes('too-many-requests')) passError.textContent = 'Too many attempts. Try later.';
          else emailError.textContent = 'Login failed.';
        }
      });

      googleButton.addEventListener('click', async () => {
        try {
          await signInWithPopup(auth, googleProvider);
          window.closeLoginDialog();
          window.location.reload();
        } catch (err) {
          alert('Google sign-in failed: ' + (err.message || err.code));
        }
      });

      window.poostudioAuthSignOut = async () => {
        try { await signOut(auth); window.location.reload(); } catch(e) { console.error(e); }
      };

      onAuthStateChanged(auth, user => {
        const authNav = document.getElementById('auth-nav');
        const indicator = document.getElementById('signed-in-indicator');
        if (user) {
          authNav.style.display = 'flex';
          if (indicator) indicator.textContent = '— ' + (user.displayName || user.email);
          window.userIsLoggedIn = true;
        } else {
          authNav.style.display = 'none';
        }
      });
    }
  </script>

</body>
</html>