# Dokument wymagań produktu (PRD) - SavorAI (MVP)

## 1. Przegląd produktu
SavorAI to prosta aplikacja webowa, która łączy generowanie dopasowanych przepisów przez AI z wygodnym katalogowaniem i przeszukiwaniem zapisanych receptur. MVP dostarcza: profil preferencji żywieniowych, jednorazową generację jednego przepisu w formacie JSON, zapis i przegląd własnej kolekcji, minimalne wyszukiwanie oraz podstawowe metryki użycia. Stack: TypeScript + Astro + React (islands), TailwindCSS, Supabase (Auth, Postgres, RLS), integracja AI: Gemini (free).

## 2. Problem użytkownika
Użytkownicy tracą czas na ręczne wyszukiwanie i dopasowywanie przepisów do diety, alergii i preferencji smakowych. Narzędzia AI potrafią tworzyć/modyfikować receptury, ale brakuje im wygodnego przechowywania i organizacji, z kolei aplikacje do notowania przepisów są mało interaktywne. SavorAI rozwiązuje oba problemy jednocześnie: inteligentnie generuje dopasowany przepis i pozwala go prosto zapisać, otagować, obejrzeć i odnaleźć.

## 3. Wymagania funkcjonalne
1. Generowanie jednego przepisu przez AI z uwzględnieniem profilu (dietType, dislikedIngredients, preferredCuisines); output jako twardy JSON zgodny z schema_v1.
2. Zapis przepisu do prywatnej kolekcji użytkownika; lista i widok szczegółów (render z JSON do MD/HTML).
3. Wyszukiwanie minimalne: full-text po tytule/opisie/składnikach, filtr tagów w logice OR, sortowanie „ostatnio dodane”.
4. Profil użytkownika v1: edycja pól (dietType?, dislikedIngredients[], preferredCuisines[]); opcja dark mode (poza KPI profilu).
5. Blokada zapisu, gdy przepis zawiera element z listy Unikaj (contains, case-insensitive).
6. Autentykacja: rejestracja/logowanie; RLS w Supabase per user_id.
7. Logowanie zdarzeń: session_start, profile_edited, ai_prompt_sent, ai_recipe_generated, recipe_saved; prosty eksport NDJSON do zliczeń KPI.
8. Limitacje i niezawodność: limit długości promptu i rozmiaru odpowiedzi; 1× retry przy błędzie AI; jasne komunikaty w UI.
9. UI: layout 2-kolumnowy (lewa: lista/podgląd, prawa: generator), edukacyjne placeholdery i chipy przykładów, dark mode.

## 4. Granice produktu
Poza MVP: interaktywny czat z kontekstem, automatyczne uczenie preferencji z historii, import z URL/plików, multimedia (zdjęcia/wideo), udostępnianie/komentarze, edycja przepisów po zapisie (tylko podgląd), walidacja alergenów słownikami, auto-tagowanie przez AI (do backlogu). Dane publiczne i współdzielenie kolekcji wyłączone.

## 5. Historyjki użytkowników
US-001 — Rejestracja i logowanie  
Opis: Jako nowy użytkownik chcę utworzyć konto i zalogować się, aby moja kolekcja była prywatna.  
Kryteria akceptacji:  
- Mogę zarejestrować się i zalogować za pomocą e-mail/hasła.  
- Po zalogowaniu widzę pusty stan kolekcji.  
- Bez logowania nie mogę zapisać przepisu ani podejrzeć kolekcji.

US-002 — Edycja profilu preferencji  
Opis: Jako użytkownik chcę zapisać dietę, nielubiane składniki i preferowane kuchnie.  
Kryteria akceptacji:  
- Formularz umożliwia podanie co najmniej jednego pola.  
- Zapis profilu loguje zdarzenie profile_edited.  
- Zapisany profil jest wstrzykiwany do kolejnych promptów AI.

US-003 — Tryb ciemny  
Opis: Jako użytkownik chcę włączyć dark mode.  
Kryteria akceptacji:  
- Przełącznik dark mode działa i zapamiętuje preferencję.  
- Zmiana nie wpływa na KPI profilu.

US-004 — Edukacyjne placeholdery i przykłady  
Opis: Jako użytkownik chcę zobaczyć przykładowe zapytania, aby szybciej zacząć.  
Kryteria akceptacji:  
- W polu promptu widzę placeholdery/chipy np. „Obiad śródziemnomorski 30 min”.  
- Klik w chip wstawia gotowy prompt.

US-005 — Generowanie przepisu przez AI  
Opis: Jako użytkownik chcę wygenerować pojedynczy przepis zgodny z moim profilem.  
Kryteria akceptacji:  
- Po wysłaniu promptu powstaje dokładnie jeden przepis w schema_v1.  
- Błędy AI skutkują jednym automatycznym ponowieniem i czytelnym komunikatem.  
- Zdarzenia ai_prompt_sent i ai_recipe_generated są logowane.

US-006 — Walidacja formatu JSON  
Opis: Jako właściciel produktu chcę, aby każdy przepis spełniał schema_v1.  
Kryteria akceptacji:  
- Niepoprawny JSON wyświetla błąd i nie jest prezentowany do zapisu.  
- W logach znajduje się informacja o błędzie walidacji.

US-007 — Blokada „Unikaj”  
Opis: Jako użytkownik chcę uniknąć zapisu przepisu zawierającego nielubiane składniki.  
Kryteria akceptacji:  
- Gdy ingredients zawiera element z listy dislikedIngredients (contains, case-insensitive), przycisk Zapisz jest nieaktywny i pojawia się ostrzeżenie.  
- Po zmianie profilu i ponownej generacji blokada działa zgodnie z nową listą.

US-008 — Zapis przepisu  
Opis: Jako użytkownik chcę zapisać wygenerowany przepis do mojej kolekcji.  
Kryteria akceptacji:  
- Klik Zapisz utrwala pełny JSON, przypisany do user_id.  
- recipe_saved jest logowane; rekord zawiera created_at/updated_at.

US-009 — Lista i widok szczegółów  
Opis: Jako użytkownik chcę przeglądać listę i szczegóły przepisów.  
Kryteria akceptacji:  
- Lista pokazuje karty z tytułem, tagami, timestampem.  
- Widok szczegółów renderuje MD/HTML z JSON; dane źródłowe pozostają w JSON.  
- Brak edycji; informacja „tylko podgląd”.

US-010 — Wyszukiwanie i sortowanie  
Opis: Jako użytkownik chcę znaleźć przepisy po słowach kluczowych i tagach.  
Kryteria akceptacji:  
- Full-text tytuł/opis/składniki działa.  
- Filtr tagów działa w logice OR (dowolny z wybranych).  
- Sort „ostatnio dodane” jest domyślny.

US-011 — Usuwanie przepisu  
Opis: Jako użytkownik chcę usunąć przepis z kolekcji.  
Kryteria akceptacji:  
- Mogę usunąć przepis; pojawia się potwierdzenie.  
- Po usunięciu nie jest on widoczny na liście.  
- Operacja dotyczy wyłącznie moich danych (RLS).

US-012 — Puste stany i komunikaty  
Opis: Jako użytkownik chcę zrozumiałe puste stany i błędy.  
Kryteria akceptacji:  
- Dla pustej listy widzę CTA do generacji.  
- Komunikaty limitu promptu/odpowiedzi są precyzyjne i wskazują maksima.

US-013 — Zdarzenia i eksport KPI  
Opis: Jako analityk chcę eksportować zdarzenia do oceny KPI.  
Kryteria akceptacji:  
- Zdarzenia są zapisywane z timestampem i user_id.  
- Prostym poleceniem generuję NDJSON do dalszych agregacji.

US-014 — Bezpieczeństwo dostępu (RLS)  
Opis: Jako użytkownik oczekuję prywatności moich przepisów i profilu.  
Kryteria akceptacji:  
- Zapytania do bazy zwracają wyłącznie rekordy z moim user_id.  
- Próba dostępu do cudzych rekordów jest odrzucana.

US-015 — Sesja użytkownika  
Opis: Jako zespół chcemy znać aktywność tygodniową.  
Kryteria akceptacji:  
- Rozpoczęcie każdej sesji rejestruje session_start.  
- AUW liczony na podstawie unikalnych user_id z session_start w tygodniu.

US-016 — Limit promptu i odpowiedzi  
Opis: Jako użytkownik chcę wiedzieć o limitach zanim wyślę prompt.  
Kryteria akceptacji:  
- UI wskazuje maksymalną długość promptu.  
- Przy przekroczeniu limitu komunikat blokuje wysyłkę.

## 6. Metryki sukcesu
KPI-1 Wypełnienie profilu: co najmniej 90% aktywnych użytkowników ma zapisane minimum jedno pole profilu (dietType lub dislikedIngredients lub preferredCuisines; dark mode wyłączony).  
KPI-2 Aktywność generowania: co najmniej 75% AUW (użytkowników z ≥1 session_start w danym tygodniu) wygenerowało co najmniej jeden przepis (ai_recipe_generated) w tym tygodniu.  
Demo KPI: wyszukiwanie „krewetki” zwraca wynik; filtr tagu „owoce morza” zawęża listę zgodnie z logiką OR.  
Źródła danych: tabela events (session_start, profile_edited, ai_prompt_sent, ai_recipe_generated, recipe_saved) oraz tabele profili i przepisów. Eksport: NDJSON.

