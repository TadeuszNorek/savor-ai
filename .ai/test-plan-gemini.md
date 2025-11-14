# Plan Testów dla Aplikacji SavorAI

## 1. Wprowadzenie

### 1.1. Cel Dokumentu
Niniejszy dokument określa strategię, zakres, zasoby i harmonogram działań związanych z testowaniem aplikacji SavorAI. Celem jest zapewnienie wysokiej jakości produktu końcowego poprzez systematyczną weryfikację funkcjonalności, wydajności, bezpieczeństwa i użyteczności.

### 1.2. Opis Aplikacji
SavorAI to nowoczesna aplikacja webowa typu "master-detail" przeznaczona do generowania, zarządzania i przeglądania przepisów kulinarnych. Aplikacja wykorzystuje sztuczną inteligencję do tworzenia przepisów na podstawie zapytań użytkownika. Zbudowana jest w oparciu o stack technologiczny obejmujący Astro, React, TypeScript, Supabase (dla backendu i bazy danych) oraz Tailwind CSS.

**Główne funkcjonalności:**
- Uwierzytelnianie użytkowników (rejestracja, logowanie, reset hasła).
- Zarządzanie profilem preferencji dietetycznych.
- Generator przepisów AI.
- Zapisywanie, przeglądanie, edytowanie i usuwanie przepisów.
- Wyszukiwanie, filtrowanie i sortowanie listy przepisów.

---

## 2. Zakres Testów

### 2.1. Funkcjonalności w Zakresie (In-Scope)
- **Moduł Uwierzytelniania:** Pełen cykl życia użytkownika (rejestracja, logowanie, wylogowanie, odzyskiwanie hasła).
- **Moduł Profilu Użytkownika:** Tworzenie i aktualizacja preferencji dietetycznych (dieta, nielubiane składniki, preferowane kuchnie).
- **Moduł Generatora AI:** Generowanie przepisów na podstawie promptów tekstowych, obsługa stanów ładowania i błędów.
- **Moduł Zarządzania Przepisami (CRUD):** Zapisywanie wygenerowanych przepisów, przeglądanie szczegółów, usuwanie.
- **Lista Przepisów:** Wyszukiwanie pełnotekstowe, filtrowanie po tagach, sortowanie (najnowsze/najstarsze), paginacja ("ładuj więcej").
- **Interfejs Użytkownika (UI):** Responyswność (mobile, tablet, desktop), przełączanie motywu (jasny/ciemny), spójność wizualna, obsługa komponentów UI (modale, toasty, podpowiedzi).
- **API Backendu:** Walidacja zapytań i odpowiedzi dla wszystkich endpointów.
- **Bezpieczeństwo:** Ochrona endpointów API, walidacja danych wejściowych po stronie serwera.
- **Użyteczność:** Podstawowa weryfikacja intuicyjności interfejsu i przepływów użytkownika.

### 2.2. Funkcjonalności Poza Zakresem (Out-of-Scope)
- **Testy wydajnościowe i obciążeniowe:** Symulacja dużego ruchu i obciążenia serwera.
- **Jakość generowanych treści AI:** Testy nie będą weryfikować merytorycznej poprawności czy smaku przepisów generowanych przez AI, a jedynie poprawność struktury danych.
- **Testy kompatybilności z niszowymi przeglądarkami:** Testy będą prowadzone na najnowszych wersjach Chrome, Firefox i Safari.
- **Infrastruktura Supabase:** Testy nie obejmują wewnętrznego działania usług Supabase.
- **Testy A/B i analityka:** Weryfikacja poprawności działania narzędzi do analityki (np. logowanie zdarzeń `session_start`).

---

## 3. Rodzaje Testów

- **Testy Jednostkowe (Unit Tests):** Weryfikacja pojedynczych komponentów React, funkcji pomocniczych (`utils`), hooków i logiki biznesowej (np. mappery DTO) w izolacji.
- **Testy Integracyjne (Integration Tests):** Sprawdzanie współpracy między komponentami (np. formularz i jego pola) oraz integracji frontendu z API (np. czy komponent poprawnie pobiera i wyświetla dane z endpointu).
- **Testy End-to-End (E2E):** Symulacja pełnych przepływów użytkownika w przeglądarce, np. od rejestracji, przez wygenerowanie i zapisanie przepisu, po jego odnalezienie na liście.
- **Testy API (API Testing):** Bezpośrednie odpytywanie endpointów API w celu weryfikacji logiki biznesowej, kodów odpowiedzi, formatów danych i obsługi błędów.
- **Testy UI i Kompatybilności:** Weryfikacja poprawnego renderowania interfejsu na różnych rozmiarach ekranu i w głównych przeglądarkach.
- **Testy Bezpieczeństwa (Manualne):** Podstawowa weryfikacja zabezpieczeń, np. próby dostępu do chronionych zasobów bez autoryzacji.
- **Testy Użyteczności (Manualne):** Ocena ogólnej intuicyjności i wygody korzystania z aplikacji.

---

## 4. Strategia Testowania

### 4.1. Frontend (React/Astro)
- **Testy Jednostkowe:** Każdy komponent UI (`/components/ui`), hook (`/lib/hooks`), funkcja pomocnicza (`/lib/utils`, `/lib/mappers`) powinien mieć dedykowane testy jednostkowe. Użyjemy `Vitest` z `React Testing Library` do renderowania komponentów i weryfikacji ich zachowania.
- **Testy Integracyjne:** Kluczowe widoki, takie jak `ProfileView`, `AppLayout`, `LeftPanel` i `RightPanel`, będą testowane w celu sprawdzenia, czy poprawnie integrują mniejsze komponenty i reagują na interakcje użytkownika. Mockowane będą wywołania API za pomocą `msw` (Mock Service Worker).
- **Testy E2E:** Użyjemy `Playwright` lub `Cypress` do zautomatyzowania kluczowych scenariuszy użytkownika.

### 4.2. Backend (API Routes)
- Testy będą realizowane na poziomie integracyjnym. Dla każdego endpointu (`/pages/api/**/*.ts`) stworzony zostanie zestaw testów weryfikujących:
    - Poprawne przetwarzanie prawidłowych zapytań (happy path).
    - Obsługę błędów walidacji (np. brakujące pola, nieprawidłowe typy danych).
    - Zabezpieczenia (np. próba dostępu do zasobu innego użytkownika).
    - Poprawność kodów statusu HTTP i formatów odpowiedzi.
- Do testowania API użyjemy `Vitest` w środowisku Node.js z biblioteką `supertest` lub natywnym `fetch`.

### 4.3. Baza Danych (Supabase)
- Logika biznesowa w bazie danych (np. funkcja `insert_recipe_safe`) będzie testowana pośrednio przez testy API.
- Migracje schematu (`/supabase/migrations`) będą testowane manualnie na środowisku deweloperskim.

---

## 5. Scenariusze Testowe (Przykłady)

### 5.1. Uwierzytelnianie i Zarządzanie Kontem
| ID | Opis Scenariusza | Oczekiwany Rezultat | Priorytet |
|---|---|---|---|
| AUTH-01 | Rejestracja nowego użytkownika z poprawnymi danymi. | Użytkownik zostaje utworzony, zalogowany i przekierowany do aplikacji. | Krytyczny |
| AUTH-02 | Próba rejestracji z zajętym adresem e-mail. | Wyświetlany jest komunikat o błędzie "Email already in use". | Wysoki |
| AUTH-03 | Logowanie z poprawnymi danymi. | Użytkownik zostaje zalogowany i przekierowany do aplikacji. | Krytyczny |
| AUTH-04 | Logowanie z niepoprawnym hasłem. | Wyświetlany jest komunikat o błędzie "Invalid login credentials". | Wysoki |
| AUTH-05 | Wylogowanie użytkownika. | Użytkownik zostaje wylogowany i przekierowany na stronę główną. | Krytyczny |
| AUTH-06 | Dostęp do chronionej strony (`/app`) bez zalogowania. | Użytkownik zostaje przekierowany na stronę logowania (`/login`). | Krytyczny |

### 5.2. Zarządzanie Profilem Użytkownika
| ID | Opis Scenariusza | Oczekiwany Rezultat | Priorytet |
|---|---|---|---|
| PROF-01 | Użytkownik po raz pierwszy tworzy profil, wypełniając wszystkie pola. | Profil zostaje zapisany. Po odświeżeniu strony dane są poprawnie wczytane do formularza. | Wysoki |
| PROF-02 | Użytkownik aktualizuje istniejący profil, zmieniając typ diety. | Zmiana zostaje zapisana. Przycisk "Save" jest aktywny tylko po dokonaniu zmian. | Wysoki |
| PROF-03 | Próba zapisania formularza bez wypełnienia ani jednego pola. | Wyświetlany jest błąd walidacji "At least one field must be filled". | Średni |
| PROF-04 | Dodanie więcej niż 100 nielubianych składników. | Wyświetlany jest błąd walidacji "Maximum 100 ingredients allowed". | Średni |

### 5.3. Generowanie Przepisów (AI)
| ID | Opis Scenariusza | Oczekiwany Rezultat | Priorytet |
|---|---|---|---|
| GEN-01 | Wygenerowanie przepisu na podstawie poprawnego promptu. | Przycisk "Generate" przechodzi w stan ładowania, a następnie wygenerowany przepis pojawia się w panelu podglądu. | Krytyczny |
| GEN-02 | Próba generowania z pustym promptem. | Przycisk "Generate" jest nieaktywny. | Wysoki |
| GEN-03 | Próba generowania z promptem > 2000 znaków. | Przycisk "Generate" jest nieaktywny, licznik znaków pokazuje przekroczenie limitu. | Średni |
| GEN-04 | Obsługa błędu API podczas generowania (np. 429 Too Many Requests). | Wyświetlany jest odpowiedni komunikat o błędzie z informacją dla użytkownika. | Wysoki |

### 5.4. Zarządzanie Przepisami (CRUD i Lista)
| ID | Opis Scenariusza | Oczekiwany Rezultat | Priorytet |
|---|---|---|---|
| REC-01 | Zapisanie wygenerowanego przepisu. | Przepis pojawia się na górze listy przepisów. Panel podglądu przechodzi w tryb "saved". | Krytyczny |
| REC-02 | Usunięcie zapisanego przepisu. | Po potwierdzeniu w oknie dialogowym przepis znika z listy. | Wysoki |
| REC-03 | Wyszukanie przepisu po słowie kluczowym z jego tytułu. | Na liście pozostają tylko pasujące przepisy. | Wysoki |
| REC-04 | Filtrowanie po tagu. | Po kliknięciu na tag, lista zostaje przefiltrowana. | Wysoki |
| REC-05 | Sortowanie listy przepisów (najnowsze/najstarsze). | Kolejność przepisów na liście zmienia się zgodnie z wybraną opcją. | Średni |
| REC-06 | Paginacja - kliknięcie "Load More". | Do listy doładowywane są kolejne przepisy. | Wysoki |

---

## 6. Środowisko Testowe i Narzędzia

- **System operacyjny:** Windows, macOS, Linux
- **Przeglądarki:** Chrome (latest), Firefox (latest), Safari (latest)
- **Frameworki do testów:**
    - **Jednostkowe/Integracyjne:** `Vitest`
    - **E2E:** `Playwright`
    - **Asercje:** `React Testing Library`, `jest-dom`
- **Mockowanie API:** `Mock Service Worker (msw)`
- **Zarządzanie zależnościami:** `npm`
- **CI/CD:** GitHub Actions (uruchamianie testów automatycznych przy każdym pushu/pull requeście).
- **Zarządzanie zadaniami i błędami:** GitHub Issues.

---

## 7. Kryteria Wejścia/Wyjścia

### 7.1. Kryteria Wejścia (Rozpoczęcie Testów)
- Zakończenie implementacji danej funkcjonalności.
- Pomyślne przejście testów jednostkowych i integracyjnych w CI.
- Dostępność stabilnego środowiska deweloperskiego/testowego.

### 7.2. Kryteria Wyjścia (Zakończenie Testów)
- Pomyślne wykonanie wszystkich zdefiniowanych scenariuszy testowych.
- Brak otwartych błędów o priorytecie `Krytyczny` i `Wysoki`.
- Pokrycie kodu testami (Code Coverage) na poziomie co najmniej 80% dla nowej logiki biznesowej.

---

## 8. Raportowanie Błędów

Każdy zidentyfikowany błąd zostanie zgłoszony jako "Issue" w repozytorium GitHub projektu. Zgłoszenie powinno zawierać:
- Tytuł zwięźle opisujący problem.
- Szczegółowy opis kroków do reprodukcji błędu.
- Oczekiwany vs. rzeczywisty rezultat.
- Zrzuty ekranu lub nagrania wideo.
- Informacje o środowisku (przeglądarka, system operacyjny).
- Priorytet błędu (Krytyczny, Wysoki, Średni, Niski).
- Sugerowane etykiety (np. `bug`, `ui`, `backend`).
