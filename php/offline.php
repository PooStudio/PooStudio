<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#060714">
  <meta name="description" content="PooStudio is temporarily offline.">
  <title>Offline — PooStudio</title>
  <script src="assets/js/service-worker.js" defer></script>
  <link rel="stylesheet" href="assets/css/offline.css">
</head>
<body>
  <main class="offline-shell">
    <div class="topline"><span>PooStudio / Offline</span><span>Status // 503</span></div>
    <section class="signal-panel" aria-labelledby="offline-title">
      <div class="signal-mark" aria-hidden="true">PS</div>
      <div class="signal-label">Connection interrupted</div>
      <h1 id="offline-title">Signal lost.</h1>
      <p class="message">The studio cannot reach the network right now. Your local connection is quiet; nothing has been changed or sent.</p>
      <div class="status-row"><span class="status-dot" aria-hidden="true"></span><span>Awaiting network // retry when ready</span></div>
      <div class="actions">
        <button type="button" id="retry">Try connection again</button>
        <a href="index.php">Return to studio</a>
      </div>
    </section>
    <div class="meta">PooStudio <strong>//</strong> Built from the ground up</div>
  </main>
  <script>
    document.getElementById('retry').addEventListener('click', function () {
      window.location.reload();
    });
  </script>
</body>
</html>
