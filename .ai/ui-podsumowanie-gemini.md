<conversation_summary>
<decisions>
1.  **Struktura widoków:** Zaakceptowano podział na widoki: `/login` (logowanie/rejestracja), `/app` (główny widok z listą przepisów i generatorem), oraz `/profile` (edycja profilu użytkownika).
2.  **Przepływ pierwszego logowania:** Użytkownik po pierwszej rejestracji zostanie przekierowany na stronę `/profile`, aby zachęcić go do uzupełnienia danych.
3.  **Komunikacja o użyciu profilu:** Informacja o tym, że profil użytkownika jest używany do generowania przepisów, musi być subtelna i nie rzucać się w oczy (np. wyszarzona ikona lub tekst).
4.  **UI blokady zapisu:** Warunkowo zaakceptowano, że przepis zawierający nielubiane składniki będzie blokowany poprzez dezaktywację przycisku "Zapisz" i wyświetlenie tooltipa z informacją. Kwestia ta pozostaje otwarta do dalszego przemyślenia.
5.  **Stany ładowania i błędów:** Zaakceptowano użycie komponentów typu "skeleton" podczas ładowania danych oraz "toast/alert" do komunikowania błędów API.
6.  **Tryb ciemny:** Zaimplementowany zostanie przełącznik trybu ciemnego, prawdopodobnie z użyciem biblioteki `next-themes`.
7.  **Biblioteka komponentów:** Jako bazowy zestaw komponentów UI zostanie wykorzystana biblioteka `shadcn/ui`, z możliwością dodawania lub usuwania komponentów w przyszłości.
8.  **Responsywność:** Na urządzeniach mobilnych zostanie zastosowany layout jednokolumnowy, a nawigacja między listą a generatorem będzie odbywać się za pomocą zakładek.
9.  **Zarządzanie stanem:** Stan globalny (sesja, dane użytkownika) będzie zarządzany przez `React Context`. Stan serwera będzie obsługiwany przez `TanStack Query (React Query)`, pod warunkiem, że nie skomplikuje to znacząco prac nad MVP.
10. **Puste stany:** Zostaną zaprojektowane dedykowane puste stany dla listy przepisów i braku wyników wyszukiwania, zawierające wezwanie do działania (CTA).
11. **Layout aplikacji:** Dla MVP zostanie zaimplementowany układ "Master-Detail" (lewa kolumna: lista/wyszukiwarka, prawa kolumna: generator/podgląd). Jest to optymalne rozwiązanie dla obecnych wymagań, z zaplanowaną ewolucją do układu "Czat-Wynik" w przyszłości.
</decisions>
<matched_recommendations>
1.  **Struktura widoków:** Propozycja stworzenia widoków `/login`, `/app` (jako dwukolumnowy layout), `/app/recipes`, `/app/recipes/[id]`, `/app/generate` i `/profile` została w pełni zaakceptowana.
2.  **Onboarding użytkownika:** Rekomendacja przekierowania do profilu po pierwszym logowaniu została zaakceptowana.
3.  **Feedback dla użytkownika:** Rekomendacja użycia subtelnych wskaźników (ikony, "chipy") do informowania o aktywnych filtrach z profilu została dopasowana do wymagań użytkownika.
4.  **Walidacja UI:** Rekomendacja dezaktywacji przycisku "Zapisz" i pokazania ikony z tooltipem w przypadku wykrycia nielubianego składnika została warunkowo zaakceptowana.
5.  **Zestaw komponentów:** Rekomendowany zestaw komponentów `shadcn/ui` (`Button`, `Input`, `Card`, `Dialog`, `Sheet`, `Skeleton`, `Toast`, `Tooltip`, `Badge`) został zaakceptowany jako punkt wyjścia.
6.  **Layout mobilny:** Rekomendacja zmiany layoutu na jednokolumnowy na mobile z nawigacją opartą na zakładkach została zaakceptowana.
7.  **Zarządzanie stanem:** Rekomendacja użycia `React Context` dla stanu globalnego i `TanStack Query` dla stanu serwera została warunkowo zaakceptowana.
8.  **Puste stany:** Rekomendacja zaprojektowania pustych stanów z CTA została zaakceptowana.
9.  **Iteracja promptu:** Rekomendacja, aby pole z promptem pozostawało edytowalne po generacji, została zaakceptowana jako usprawnienie przepływu użytkownika.
10. **Interfejs wyszukiwania:** Rekomendacja implementacji wyszukiwania z polem `Input` i klikalnymi `Badge` dla tagów została zaakceptowana.
</matched_recommendations>
<ui_architecture_planning_summary>
Na podstawie przeprowadzonej sesji planistycznej, architektura UI dla MVP aplikacji SavorAI została zdefiniowana w następujący sposób:

**a. Główne wymagania dotyczące architektury UI:**
Aplikacja będzie posiadać dwukolumnowy layout typu "Master-Detail" na desktopie (lewa kolumna: lista/wyszukiwarka, prawa kolumna: generator/podgląd), z możliwością przełączenia na tryb ciemny. Układ ten został wybrany jako optymalny dla MVP, z zaplanowaną ewolucją do modelu "Czat-Wynik" w przyszłych wersjach. Interfejs ma być minimalistyczny i prowadzić użytkownika za pomocą edukacyjnych placeholderów i subtelnych wskazówek wizualnych. Kluczowe jest zapewnienie jasnej komunikacji o stanach aplikacji (ładowanie, błędy, puste stany).

**b. Kluczowe widoki, ekrany i przepływy użytkownika:**
-   **`/login`**: Strona uwierzytelniania (rejestracja/logowanie).
-   **`/profile`**: Strona do zarządzania profilem preferencji żywieniowych.
-   **`/app`**: Główny widok aplikacji, który w ramach layoutu "Master-Detail" zawiera:
    -   **Lewa kolumna**: Lista zapisanych przepisów (`/app/recipes`) z wyszukiwaniem i filtrowaniem.
    -   **Prawa kolumna**: Obszar roboczy, w którym domyślnie znajduje się interfejs do generowania przepisów (`/app/generate`), a po wybraniu przepisu z listy lub jego wygenerowaniu, pojawia się jego pełny podgląd.
-   **Przepływ użytkownika:** Nowy użytkownik po rejestracji jest kierowany do uzupełnienia profilu. Następnie trafia do głównego widoku, gdzie może generować i zapisywać przepisy. Interfejs ma ułatwiać iteracyjne poprawianie zapytań do AI.

**c. Strategia integracji z API i zarządzania stanem:**
-   **Integracja z API:** Komunikacja z backendem (Supabase) będzie odbywać się poprzez zdefiniowane w planie API endpointy REST.
-   **Zarządzanie stanem:**
    -   **Stan globalny/sesji:** `React Context`.
    -   **Stan lokalny komponentów:** `useState` / `useReducer`.
    -   **Stan serwera (dane z API):** `TanStack Query (React Query)` zostanie użyty do pobierania, buforowania i mutowania danych, pod warunkiem, że jego implementacja nie opóźni znacząco prac nad MVP.

**d. Kwestie dotyczące responsywności, dostępności i bezpieczeństwa:**
-   **Responsywność:** Aplikacja będzie w pełni responsywna. Na ekranach poniżej breakpointu `md` (Tailwind CSS), dwukolumnowy layout przełączy się w tryb jednokolumnowy ("stacked"), a nawigacja między listą a generatorem będzie realizowana za pomocą zakładek.
-   **Dostępność (a11y):** Priorytetem jest osiągnięcie standardu WCAG AA. Zostanie to zrealizowane poprzez:
    -   Użycie semantycznego HTML i atrybutów ARIA tam, gdzie to konieczne.
    -   Staranne zarządzanie focusem (widoczne `focus ring`).
    -   Wykorzystanie `shadcn/ui` jako bazy dla dostępnych komponentów.
-   **Tryb Ciemny (Dark Mode):** Domyślny motyw będzie ustawiany na podstawie systemowej preferencji (`prefers-color-scheme`). Użytkownik będzie miał możliwość ręcznego przełączenia motywu za pomocą dedykowanego przełącznika, a jego wybór zostanie zapisany w `localStorage`.
-   **Bezpieczeństwo:** Kwestie bezpieczeństwa na poziomie UI sprowadzają się do prawidłowej obsługi sesji użytkownika (tokeny JWT) i zapewnienia, że interfejs nie pozwala na akcje, do których użytkownik nie ma uprawnień (co jest gwarantowane przez RLS w Supabase).

</ui_architecture_planning_summary>
<unresolved_issues>
1.  Ostateczny sposób wizualnego przedstawienia blokady zapisu przepisu, gdy zawiera on nielubiane składniki (punkt 4). Użytkownik potrzebuje więcej czasu na przemyślenie, czy proponowane rozwiązanie (nieaktywny przycisk + tooltip) jest optymalne.
</unresolved_issues>
</conversation_summary>