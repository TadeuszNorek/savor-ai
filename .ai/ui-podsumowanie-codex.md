<conversation_summary>
<decisions>
1. Layout B dla MVP: lewa kolumna to wyszukiwanie + lista zapisanych przepisów, prawa kolumna to obszar roboczy (podgląd/generator/czat w przyszłości).
2. Generowanie przepisu wymaga logowania (brak trybu demo); RLS i zdarzenia działają tylko dla zalogowanych.
3. Jeden aktywny szkic na użytkownika; stan w pamięci + `sessionStorage`, przetrwa odświeżenie.
4. Nadpisywanie szkicu przy każdej nowej generacji; brak historii szkiców w MVP.
5. Prawa kolumna: zakładki „Generator” | „Podgląd”; po generacji auto‑przełączenie na „Podgląd (Szkic)”.
6. Mobile: pełnoekranowe trasy dla podglądu/generatora; Desktop: układ 2‑kolumnowy z zakładkami po prawej.
7. Kliknięcie przepisu w liście: podświetlenie elementu i nawigacja do `/app/recipes/:id`, zachowanie scrolla; podgląd pozostaje widoczny.
8. Klik tagu w szczegółach dodaje filtr w lewej kolumnie; podgląd pozostaje (nie przełącza automatycznie widoku).
9. Paginacja kursorem „Pokaż więcej” + umiarkowany cache TanStack Query; bez wirtualizacji listy na MVP.
10. Struktura routingu: `/login`, `/profile`, `/app` (layout z lewym panelem), `/app/generator`, `/app/recipes/:id`.
11. Komponenty (shadcn/ui + Tailwind): Tabs, Textarea z licznikiem, Button, Badge/Chips, Card/typografia (prose), Skeleton/Spinner, Alert/AlertDialog, Tooltip, Command/Combobox, Toaster.
12. Mapowanie błędów: 401 → `/login`, 404 → ekran „Nie znaleziono”, 400 walidacja → panel błędów, 413 → komunikat o limitach; retry 1× tylko dla generacji AI.
</decisions>
<matched_recommendations>
1. TanStack Query do fetch/cache/invalidacji (`profile`, `recipes:list(params)`, `recipe:id`), prefetch szczegółów na hover/focus.
2. Blokada „Unikaj”: ostrzeżenie + wyróżnienie trafionych składników, nieaktywny „Zapisz” z tooltipem i linkiem do „Edytuj profil”.
3. Walidacja `schema_v1` (Zod/ajv) po generacji; w przypadku błędów blokada zapisu i wyświetlenie detali naruszeń.
4. Wyraźne limity i stany generatora: licznik znaków promptu, „generowanie…/ponawiam (1/1)”, obsługa 400/413 i awarii AI.
5. Search + OR‑filtry tagów + sort „recent” w liście; zachowanie parametrów w query string.
6. Responsywność: desktop 2‑kolumnowy, mobile zakładki/pełnoekranowe trasy; dostępność WCAG AA (ARIA, focus ring, kontrast), dark mode z `prefers-color-scheme` + przełącznik.
7. Zdarzenia KPI: `session_start` wysyłane po ustaleniu sesji; pozostałe eventy logowane serwerowo.
</matched_recommendations>
<ui_architecture_planning_summary>
• Główne wymagania (PRD):
- Generowanie pojedynczego przepisu w twardym JSON (schema_v1), 1× retry i limity rozmiaru/znaków.
- Zapis do prywatnej kolekcji (RLS), lista + szczegóły (render JSON→MD/HTML), usuwanie.
- Profil preferencji (dietType?, dislikedIngredients[], preferredCuisines[]); blokada zapisu przy trafieniu „Unikaj”.
- Wyszukiwanie: full‑text tytuł/opis/składniki, filtry tagów (OR), sort „ostatnio dodane”.
- Autentykacja Supabase; logowanie zdarzeń (session_start, profile_edited, ai_prompt_sent, ai_recipe_generated, recipe_saved).
- UI: 2‑kolumny, edukacyjne chipy/placeholdery, dark mode, jasne komunikaty błędów i limitów.

• Kluczowe widoki i przepływy:
- Login/Signup: wejście do aplikacji (401→/login).
- Profile: pierwszy login → redirect do `/profile`, wypełnienie i zapis; re‑fetch i toast potwierdzenia.
- App Hub (`/app`):
  - Lewy panel: wyszukiwarka, filtry tagów (OR), sort, lista wyników; klik → highlight + route.
  - Prawy panel: Tabs „Generator” | „Podgląd”.
    • Generator: Textarea z limitami, przycisk „Generuj”, stany (loading/retry), walidacja JSON, powstaje „Szkic”.
    • Podgląd: render przepisu (typografia), blokada „Unikaj”, przyciski „Zapisz”/„Usuń” (dla zapisanych), „Przywróć szkic”.
- Szczegóły przepisu (`/app/recipes/:id`): pełne dane, tagi klikane dodają filtr po lewej, podgląd pozostaje.
- Usuwanie: potwierdzenie (AlertDialog), optimistyczne usunięcie i invalidacja listy.

• Integracja z API i stanem:
- Endpoints: `/api/recipes/generate`, `/api/recipes` (GET/POST), `/api/recipes/:id` (GET/DELETE), `/api/profile` (GET/POST), `/api/events` (POST).
- Klucze cache: `profile`, `recipes:list(params)`, `recipe:id`.
- Invalidacje: po zapisaniu/usunięciu przepisu oraz edycji profilu.
- Paginacja: cursor + „Pokaż więcej”; debouncing wpisywania (300–500 ms).
- Błędy: mapowanie 401/404/400/413 do UI; AI failure → komunikat i retry 1×.
- Szkic: trzymany w stanie + `sessionStorage`, nadpisywany przy nowej generacji; akcja „Przywróć szkic”.

• Responsywność, dostępność, bezpieczeństwo:
- Desktop: 2‑kolumny; Mobile: pełnoekranowe trasy (lista/generator/podgląd), zachowanie stanu między trasami.
- shadcn/ui + Tailwind: ARIA, focus management, kontrast WCAG AA, `Toaster` dla feedbacku.
- Dark mode: automatyka z `prefers-color-scheme` + przełącznik; stan w localStorage.
- Bezpieczeństwo: wymóg logowania do generacji i kolekcji; RLS w Supabase; brak PII w eventach; 401 redirect.
</ui_architecture_planning_summary>
<unresolved_issues>
1. Copy UX dla komunikatów (limity, blokada „Unikaj”, walidacja) — do dopracowania w UI.
2. Dokładne wartości limitów (UI: licznik/maxlength, komunikaty) — zgodnie z API planem, do potwierdzenia w implementacji.
3. Prefetch i cache parametry (staleTime, cacheTime) — do kalibracji po pierwszych testach wydajności.
</unresolved_issues>
</conversation_summary>
