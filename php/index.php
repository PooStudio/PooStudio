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
</head>
<body class="home-page">
  <a class="skip-link" href="#main">Skip to content</a>
  <div id="progress-line"></div>

  <nav id="nav" aria-label="Main navigation">
    <a href="index.php" class="nav-logo">PooStudio</a>
    <ul class="nav-links">
      <li><a href="#about">The studio</a></li>
      <li><a href="https://discord.gg/CDW93dgA4m" target="_blank" rel="noopener noreferrer">Community</a></li>
    </ul>
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
  </script>

</body>
</html>