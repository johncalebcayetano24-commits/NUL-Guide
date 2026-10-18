# GitHub Pages deployment

Repository destination: [johncalebcayetano24-commits/NUL-Guide](https://github.com/johncalebcayetano24-commits/NUL-Guide).

The expected site address after a successful deployment is **https://johncalebcayetano24-commits.github.io/NUL-Guide/**. This guide describes the prepared workflow; its presence alone does not mean a remote deployment has completed. Check the repository's Actions run and Pages environment for the published result.

## Build modes and links

The regular `npm run build` keeps the local/root-hosted application at `/`. The separate `npm run build:pages` builds with Vite's **pages** mode and the `/NUL-Guide/` base path. This project-path requirement follows the [official Vite GitHub Pages guide](https://vite.dev/guide/static-deploy.html#github-pages).

Pages mode uses hash-based application routes. These links work without requiring GitHub Pages to serve an application file for every route:

| Destination | Published URL |
| --- | --- |
| Sign in | [Student sign-in](https://johncalebcayetano24-commits.github.io/NUL-Guide/#/login) |
| Staff sign-in | [Staff/Admin sign-in](https://johncalebcayetano24-commits.github.io/NUL-Guide/#/login?role=staff) |
| Student Home | [Student dashboard](https://johncalebcayetano24-commits.github.io/NUL-Guide/#/student/home) |
| Office Directory | [Office directory](https://johncalebcayetano24-commits.github.io/NUL-Guide/#/student/offices) |
| IT Services Office | [Office details](https://johncalebcayetano24-commits.github.io/NUL-Guide/#/student/offices/it) |
| Staff Dashboard | [Staff dashboard](https://johncalebcayetano24-commits.github.io/NUL-Guide/#/staff/dashboard) |

Routes still require the appropriate demo session. For example, a signed-out visitor opening a staff route is sent to staff sign-in.

The Pages build also generates `404.html` for older clean-path links. A request such as `https://johncalebcayetano24-commits.github.io/NUL-Guide/student/offices/it` is redirected to the corresponding `https://johncalebcayetano24-commits.github.io/NUL-Guide/#/student/offices/it` route. Use the hash links above when sharing new links. This redirect handles application navigation; genuinely missing graphics or other static files remain missing resources.

## Enable deployment in GitHub

1. Ensure the project source, lockfile, local assets, and `.github/workflows/pages.yml` are present in the public repository's **main** branch.
2. Open [repository Settings → Pages](https://github.com/johncalebcayetano24-commits/NUL-Guide/settings/pages).
3. Under **Build and deployment**, set **Source** to **GitHub Actions**. This is the configuration required for a custom Pages workflow. See [GitHub's custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
4. A push to **main** starts **Deploy NUL Guide to Pages**. To run it manually, open [the workflow's Actions page](https://github.com/johncalebcayetano24-commits/NUL-Guide/actions/workflows/pages.yml), choose **Run workflow**, and select **main**.
5. Inspect the run. It installs the lockfile's dependencies, runs unit tests, builds Pages mode, configures Pages, uploads `dist`, and deploys it.
6. When the deployment succeeds, open the URL shown by the **github-pages** environment. It should use the site address above.

The workflow only deploys **main**, including manual runs. Deployments are serialized so an active deployment can finish before a newer one starts.

It uses GitHub's built-in `GITHUB_TOKEN` with `contents: read`, `pages: write`, and `id-token: write`. No personal access token, repository secret, or custom credential is needed in the workflow. Action revisions are pinned to complete commit SHAs, with version comments, using the versions in the official Vite deployment guide verified on October 19, 2026. Git checkout credential persistence is disabled.

## Check the Pages build locally

Run these commands from the project folder:

```sh
npm ci
npm test
npm run build:pages
npm run preview:pages
```

Open **http://127.0.0.1:4183/NUL-Guide/#/login**. On Windows, use `npm.cmd` if PowerShell blocks the `npm.ps1` launcher. Stop an already-running preview before starting another on the configured port.

Check both demo roles, sidebar navigation, a direct hash link, and local graphics. The generated `dist` should contain `index.html`, `404.html`, and the production assets. This strict static preview returns a real HTTP 404 for missing clean paths, allowing the generated fallback to be tested rather than relying on a development-server rewrite. Run `npm run test:pages` while the preview is running for the deployment browser checks.

To return to the regular root build:

```sh
npm run build
npm run preview
```

Then open **http://127.0.0.1:4173/**. The original development command, `npm run dev`, also continues to serve the root application.

## Application behavior after hosting

Local deployment verification on October 19, 2026 passed `npm install`, all 32 unit tests, both build modes, and 64 Pages-specific browser checks at desktop and mobile widths. The strict static preview verified direct routes, refreshes, legacy clean links, asset/font paths, keyboard skip navigation, and the connected student/staff workflow. All 881 public asset files are included in Git. Generated browser evidence is kept locally under `qa/github-pages/` and excluded from commits.

Hosting preserves the existing student and staff screens, shared concern lifecycle, office editing, Smart Match, notifications, preferences, feedback, original graphics, and responsive layouts. The deployment changes URL handling and asset prefixes for the repository path.

This remains a front-end demonstration. Accounts, chat, delivery preferences, and campus directions retain the limitations documented in the [README](../README.md). Data is saved in each visitor's browser at the deployed origin. Publishing does not transfer local development records to the website, add a backend, synchronize unrelated visitors, or connect to official NU systems. The demo credentials remain documented in the README.

## Troubleshooting

- **No deployment run:** Check that the workflow exists on `main`, Actions is enabled for the repository, and Pages Source is **GitHub Actions**.
- **Skipped manual deployment:** Run the workflow from **main**. Other branches are intentionally excluded from publishing.
- **Unit tests or build failed:** Read the failing step in Actions, reproduce it locally, and commit the source or lockfile correction before retrying.
- **Pages authorization or environment failure:** Check the repository's Actions policy and the `github-pages` environment's deployment branch rules. The workflow already declares its required token permissions.
- **Blank page or missing graphics:** Confirm the deployed run used `npm run build:pages`, that the address includes the case-sensitive `/NUL-Guide/` path, and that `dist` was uploaded.
- **An old clean link reaches a 404:** Confirm the deployed artifact contains the generated `404.html`. Open the equivalent `/#/` route directly to check navigation separately.
- **Data differs from a local demonstration:** Production and localhost have different storage origins. Use **Restore sample data** from Profile or Help Center if the deployed browser needs a clean sample dataset.
