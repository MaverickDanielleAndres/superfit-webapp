# SuperFit

SuperFit is a Next.js 16 application with client, coach, and admin experiences, including an authenticated image-based nutrition scan flow.

## Local Development

Install and run:

```bash
npm ci
npm run dev
```

App URL:

- http://localhost:3000

## QA and E2E Commands

```bash
npm run lint
npm run build
npm run ci:verify
npm run playwright:install
npm run test:e2e:scan
```

## CI/CD Workflows

### 1) CI and Container Build

Workflow: [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml)

Triggers:

- push
- pull_request
- workflow_dispatch

Jobs:

- Lint and Build
- Build and Publish Container (push events)

Container registry target:

- GHCR image: `ghcr.io/<owner>/superfit`

### 2) Authenticated UI Scan (Network Gated)

Workflow: [.github/workflows/authenticated-ui-scan.yml](.github/workflows/authenticated-ui-scan.yml)

Triggers:

- pull_request to main
- push to main
- schedule (every 30 minutes)
- workflow_dispatch

Jobs:

- Network-Gated Diary Scan E2E
- Checkpoint Summary and Status

Behavior:

- Validates required secrets.
- Waits for Supabase DNS + auth health endpoint.
- Runs authenticated diary scan E2E only when reachable.
- Fails the workflow if scan cannot pass.
- Posts checkpoint summary (PR comment or commit comment).
- Publishes commit status context: `Authenticated UI Scan / Checkpoints`.

### 3) Production Deploy (Render)

Workflow: [.github/workflows/deploy-render.yml](.github/workflows/deploy-render.yml)

Triggers:

- push to main
- workflow_dispatch

Gating:

- Deploy waits for required checks on the same commit SHA.
- Deploy proceeds only when all required checks conclude `success`.

Platform target:

- Render Deploy Hook

## Branch Protection (Required)

Configure branch protection for `main` with these settings:

1. Require a pull request before merging.
2. Require branches to be up to date before merging.
3. Require status checks to pass before merging.

Required checks list:

- `Lint and Build`
- `Network-Gated Diary Scan E2E`

Recommended additional signal:

- `Authenticated UI Scan / Checkpoints`

This setup blocks merge unless CI and the authenticated scan both pass.

## Containerization

Files:

- [Dockerfile](Dockerfile)
- [docker-compose.yml](docker-compose.yml)
- [.dockerignore](.dockerignore)

Local container run:

```bash
docker compose up --build
```

## Required GitHub Secrets

For authenticated scan + deploy workflows:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `USDA_API_KEY`
- `RENDER_DEPLOY_HOOK_URL`

## Notes

- The authenticated UI scan workflow intentionally fails when secrets are missing or Supabase is unreachable, so branch protection correctly blocks merge until scan validation is truly passing.
