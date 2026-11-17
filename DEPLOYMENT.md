# Static site deployment

The PHP source pages and build script live in `php/`. GitHub Actions uses PHP
8.2 to render them into static files for GitHub Pages; visitors only use clean
directory URLs: `/`, `/home/`, `/about/`, `/privacy/`, `/terms/`, and
`/offline/`.

Run `php php/build-static.php` to build locally, then serve `_site` with a
static web server. The workflow builds and deploys on pushes to `main` and can
also be started manually. Set the repository’s Pages publishing source to
**GitHub Actions**.

The `CNAME` file preserves `laggy.world`; point the domain DNS records to
GitHub Pages.
