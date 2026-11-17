# PHP build and deployment

GitHub Pages cannot execute PHP. The GitHub Actions workflow uses PHP 8.2 to
render the pages into static HTML, then deploys that output to Pages. PHP runs
only during the build; the deployed site is static and account authentication
continues to use Firebase in the browser.

Add these repository Actions secrets to enable Firebase sign-in in the
generated site:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

They are read by `includes/firebase-config.php` at build time and rendered into
the pages that need Firebase. These values are public client configuration;
do not place service-account credentials or other private keys in these
secrets.

For local development with static output, set the same variables and run
`php scripts/build-static.php`; serve the generated `_site` directory with any
static web server. To run the PHP pages directly, set the same variables and
run `php -S 127.0.0.1:8000` from the repository root.

The workflow deploys on pushes to `main` and can be started manually. In the
repository’s Pages settings, set the publishing source to **GitHub Actions**.
The workflow validates pull requests by building the static site without
deploying it.
