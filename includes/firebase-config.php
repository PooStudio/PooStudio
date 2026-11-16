<?php
$firebaseConfig = [
    'apiKey' => getenv('FIREBASE_API_KEY') ?: '',
    'authDomain' => getenv('FIREBASE_AUTH_DOMAIN') ?: '',
    'projectId' => getenv('FIREBASE_PROJECT_ID') ?: '',
    'storageBucket' => getenv('FIREBASE_STORAGE_BUCKET') ?: '',
    'messagingSenderId' => getenv('FIREBASE_MESSAGING_SENDER_ID') ?: '',
    'appId' => getenv('FIREBASE_APP_ID') ?: '',
];
?>
<script>
  window.__POOSTUDIO_CONFIG__ = <?= json_encode(
      ['firebase' => $firebaseConfig],
      JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT | JSON_THROW_ON_ERROR
  ) ?>;
</script>
