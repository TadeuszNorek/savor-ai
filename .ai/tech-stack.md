Frontend - Astro z React dla komponentów interaktywnych:
- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:
- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Tutaj przeanalizuj 2 opcje:
1. Komunikacja z modelami przez usługę Openrouter.ai:
- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API
2. Wykorzystanie api key od google aistudio
- Spore jak na potrzeby mvp projektu i jego prezentacji limity tokenów w ramach korzystanie z darmowego limitu

Testowanie:
1. Testy jednostkowe (Unit Tests):
- Vitest - szybki framework testowy z native ESM support, kompatybilny z ekosystemem Vite
- @testing-library/react - biblioteka do testowania komponentów React z perspektywy użytkownika
- @testing-library/jest-dom - custom matchers dla asercji DOM
- MSW (Mock Service Worker) - mockowanie requestów HTTP w testach
- c8 - coverage reports dla Vitest
- Pokrycie: utility functions, type guards, validators, React hooks, komponenty UI
- Cel: minimum 80% code coverage

2. Testy E2E (End-to-End Tests):
- Playwright - framework do automatyzacji przeglądarek z multi-browser support
- Wsparcie dla Chrome, Firefox, Safari
- Auto-wait mechanisms dla stabilnych testów
- Screenshot/video recording dla failed tests
- Playwright UI dla interaktywnego debugowania
- Pokrycie: critical user journeys (autentykacja, generowanie przepisów, CRUD, wyszukiwanie)

CI/CD i Hosting:
- Github Actions do tworzenia pipeline'ów CI/CD (w tym automatyczne uruchamianie testów)
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker