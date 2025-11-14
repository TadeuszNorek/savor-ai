# GitHub Actions – CI/CD dla SavorAI

Poniżej znajdziesz analizę obecnego stanu CI, rekomendacje oraz gotowe przykłady workflowów dla lint/Unit/E2E oraz wdrożenia na VPS (np. Mikrus).

## Stan obecny (repo)

- Menedżer pakietów: npm
- Wymagana wersja Node: 22.14.0 (`.nvmrc`)
- Kluczowe skrypty (`package.json`):
  - `dev`, `build`, `preview`, `lint`, `lint:fix`, `format`
  - testy: `test`, `test:run`, `test:coverage`, `test:e2e`, `test:e2e:ui`
- Playwright startuje lokalny serwer deweloperski na 3000 i ładuje `.env.test` (`playwright.config.ts`)
- Istniejący workflow: `.github/workflows/test.yml` (Unit + E2E), ale używa Node 20 (niespójne z `.nvmrc`).

## Rekomendacje CI

1) Ujednolić Node do 22.x
   - W `actions/setup-node` ustaw: `node-version: '22.14.0'` lub `'22'`.

2) Dodać job „lint” i weryfikację formatowania
   - Uruchamiaj `npm run lint` oraz (opcjonalnie) `prettier --check .` (możesz dodać skrypt `format:check`).

3) Usprawnić E2E (Playwright)
   - Zamiast ręcznego `npx playwright install ...` użyj `microsoft/playwright-github-action@v1` (instaluje przeglądarki i cache’uje).
   - Playwright i tak odpala `npm run dev` z `.env.test` – zadbaj, by ten plik nie zawierał sekretów produkcyjnych. Docelowo generuj go z `secrets` na CI.

4) Concurrency i szybkość
   - Dodaj `concurrency` na poziomie workflow, by anulować poprzednie uruchomienia dla tej samej gałęzi.
   - Pozostań przy cache npm z `setup-node`.

5) Coverage i Codecov
   - Akcja Codecov (`codecov/codecov-action@v4`) działa tokenless dla publicznych repo; dla prywatnych dodaj `CODECOV_TOKEN` (Secrets) i rozważ `permissions: id-token: write`.

### Przykładowy workflow CI (lint + unit + e2e)

```yaml
name: CI

on:
  push:
    branches: [master, main, develop]
  pull_request:
    branches: [master, main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.14.0'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      # opcjonalnie, jeśli dodasz skrypt
      # - run: npm run format:check

  unit-tests:
    runs-on: ubuntu-latest
    needs: [lint]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.14.0'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
      - name: Upload coverage reports
        if: always()
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
        # Jeśli repo prywatne:
        # env:
        #   CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.14.0'
          cache: 'npm'
      - run: npm ci
      - name: Setup Playwright
        uses: microsoft/playwright-github-action@v1
      # Jeśli chcesz trzymać sekrety poza repo:
      # - name: Make .env.test
      #   run: |
      #     cat > .env.test << 'EOF'
      #     SUPABASE_URL=${{ secrets.E2E_SUPABASE_URL }}
      #     PUBLIC_SUPABASE_KEY=${{ secrets.E2E_SUPABASE_ANON_KEY }}
      #     SUPABASE_KEY=${{ secrets.E2E_SUPABASE_ANON_KEY }}
      #     EOF
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results/
          retention-days: 30
```

Uwagi:
- Zastąp w obecnym `test.yml` wersję Node 20 na 22.14.0 oraz rozważ scalenie/przemianowanie workflow na spójne „CI”.
- Jeśli obecny układ dwóch jobów Ci odpowiada – zaktualizuj tylko wersję Node i dodaj `concurrency`.

## Rekomendacje CD (VPS/Mikrus)

Masz adapter Node „standalone” w Astro, więc możesz:
1) Build na CI i wysyłać tylko artefakt `dist/` + pliki uruchomieniowe.
2) Lub wykonać build na serwerze (git pull → npm ci → npm run build). Opcja 1 jest szybsza i bardziej powtarzalna.

Poniżej wariant 1 – build na CI i wdrożenie przez SCP/SSH. Załóż w GitHub Secrets:
- `SSH_HOST`, `SSH_USER`, `SSH_KEY` (klucz prywatny), opcjonalnie `SSH_PORT` (domyślnie 22)
- `APP_DIR` – katalog docelowy na serwerze, np. `/var/www/savor-ai`
- (opcjonalnie) `ENV_PROD` – zawartość `.env` do wgrania na serwer

### Przykładowy workflow deploy (manualny i/lub na tag)

```yaml
name: Deploy

on:
  workflow_dispatch: {}
  push:
    tags: ['v*']

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.14.0'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - name: Package artifact
        run: |
          tar -czf release.tar.gz \
            dist \
            package.json \
            package-lock.json \
            astro.config.mjs
      - uses: actions/upload-artifact@v4
        with:
          name: release
          path: release.tar.gz
          retention-days: 7

  deploy:
    runs-on: ubuntu-latest
    needs: [build]
    environment: production
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: release
          path: .
      - name: Copy artifact to server
        uses: appleboy/scp-action@v0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          port: ${{ secrets.SSH_PORT || '22' }}
          source: release.tar.gz
          target: ${{ secrets.APP_DIR }}
      - name: Remote deploy
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          port: ${{ secrets.SSH_PORT || '22' }}
          script: |
            set -euo pipefail
            cd ${{ secrets.APP_DIR }}
            mkdir -p current
            tar -xzf release.tar.gz -C current
            # (opcjonalnie) utwórz/odśwież .env
            if [ -n "${ENV_PROD:-}" ]; then
              echo "$ENV_PROD" > current/.env
            fi
            # Uruchomienie w systemd/pm2 – przykład systemd niżej
            sudo systemctl restart savor-ai.service
```

### Jednostka systemd (serwer)

Zainstaluj Node 22 na serwerze i dodaj plik `/etc/systemd/system/savor-ai.service`:

```ini
[Unit]
Description=SavorAI (Astro Node SSR)
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/savor-ai/current
Environment=NODE_ENV=production
EnvironmentFile=/var/www/savor-ai/current/.env
ExecStart=/usr/bin/node dist/server/entry.mjs
Restart=always
RestartSec=5
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

Potem:

```bash
sudo systemctl daemon-reload
sudo systemctl enable savor-ai
sudo systemctl start savor-ai
```

Reverse proxy (Caddy/Nginx) kieruje ruch na port usługi (domyślnie 3000).

## Zarządzanie sekretami i env

- Nie trzymaj kluczy produkcyjnych w repo. W CI generuj `.env.test`/`.env` z `secrets`.
- Przykład tworzenia `.env.test` w jobie E2E:

```yaml
- name: Make .env.test
  run: |
    cat > .env.test << 'EOF'
    SUPABASE_URL=${{ secrets.E2E_SUPABASE_URL }}
    PUBLIC_SUPABASE_KEY=${{ secrets.E2E_SUPABASE_ANON_KEY }}
    SUPABASE_KEY=${{ secrets.E2E_SUPABASE_ANON_KEY }}
    EOF
```

## Dodatkowe usprawnienia

- Minimalne uprawnienia: w CI ustaw `permissions: contents: read`; w deploy, jeśli używasz Environments/Deployments, dodaj odpowiednie uprawnienia.
- Statusy wymagane: skonfiguruj w GitHub „branch protection”, aby PR wymagały przejścia `lint`, `unit-tests`, `e2e-tests`.
- Composite actions: powtarzalne kroki (setup Node 22 + npm ci) możesz wynieść do `.github/actions/setup-node-22/`.

## Podsumowanie zmian do rozważenia

- Zmień Node na 22.14.0 w `.github/workflows/test.yml` i dodaj `concurrency`.
- Dodaj job `lint` do CI.
- Użyj `microsoft/playwright-github-action@v1` w E2E.
- Dodaj osobny workflow `Deploy` z budowaniem artefaktu i wdrożeniem na VPS przez SSH.

