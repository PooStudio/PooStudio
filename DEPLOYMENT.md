# PHP deployment

The site now needs a PHP 8.2+ web host; GitHub Pages and Firebase Hosting serve
static files and cannot execute PHP. Upload the repository contents to the
document root of an Apache host with PHP enabled. Enable `mod_rewrite` and
`mod_headers` (and allow `.htaccess` overrides) so redirects and security
headers work.

Set these environment variables in the host’s PHP/FPM configuration to enable
Firebase sign-in and the account pages:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

They are read by `includes/firebase-config.php` and rendered into the pages
that need Firebase. The Firebase web API key is public client configuration;
do not place service-account credentials or other private keys in these
variables.

For local development, set the same variables in your shell and run
`php -S 127.0.0.1:8000` from the repository root.

The GitHub workflow checks PHP syntax only. Configure deployment in the PHP
host’s own integration; a static-pages workflow cannot publish a working PHP
site.
