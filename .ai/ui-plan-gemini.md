# Architektura UI dla SavorAI

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla SavorAI opiera się na nowoczesnym podejściu "Master-Detail", zaimplementowanym w dwukolumnowym layoucie na urządzeniach desktopowych. Lewa kolumna ("Master") służy do nawigacji i zarządzania listą zapisanych przepisów, podczas gdy prawa kolumna ("Detail") jest dynamicznym obszarem roboczym, gdzie odbywa się generowanie przepisów AI oraz ich szczegółowy podgląd.

Na urządzeniach mobilnych, dla zachowania optymalnego doświadczenia użytkownika, layout przełącza się na jednokolumnowy, a nawigacja między listą a generatorem odbywa się za pomocą zakładek.

Kluczowe założenia architektury:
- **Reaktywność:** Interfejs natychmiastowo reaguje na akcje użytkownika, minimalizując przeładowania strony.
- **Komponentowość:** UI jest zbudowane z reużywalnych komponentów (z biblioteki `shadcn/ui`), co zapewnia spójność i ułatwia rozwój.
- **Zarządzanie stanem:** Stan aplikacji jest podzielony na globalny (sesja użytkownika, zarządzany przez React Context) oraz stan serwera (dane z API, zarządzane przez TanStack Query), co optymalizuje komunikację z backendem.
- **Jasna komunikacja:** Aplikacja wykorzystuje szkielety (skeletons) dla stanów ładowania, dedykowane widoki dla pustych stanów oraz toasty/alerty do komunikacji błędów, zapewniając użytkownikowi ciągłą informację zwrotną.

## 2. Lista widoków

### 1. Widok Logowania / Rejestracji
- **Nazwa widoku:** AuthenticationView
- **Ścieżka widoku:** `/login`
- **Główny cel:** Umożliwienie nowym użytkownikom rejestracji, a powracającym zalogowania się do aplikacji.
- **Kluczowe informacje do wyświetlenia:** Formularz z polami na e-mail i hasło, przełącznik między logowaniem a rejestracją.
- **Kluczowe komponenty widoku:** `Card`, `Input`, `Button`, `Label`.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Jasne komunikaty o błędach walidacji (np. "Hasło jest za krótkie") wyświetlane inline.
    - **Dostępność:** Wszystkie pola formularza mają powiązane etykiety (`<label>`). Widoczny styl dla stanu `:focus` na elementach interaktywnych.
    - **Bezpieczeństwo:** Pole hasła używa `type="password"`.

### 2. Widok Profilu Użytkownika
- **Nazwa widoku:** ProfileView
- **Ścieżka widoku:** `/profile`
- **Główny cel:** Personalizacja doświadczenia poprzez zdefiniowanie preferencji żywieniowych, które są automatycznie uwzględniane podczas generowania przepisów.
- **Kluczowe informacje do wyświetlenia:** Formularz do edycji diety, nielubianych składników i preferowanych kuchni. Przełącznik trybu ciemnego.
- **Kluczowe komponenty widoku:** `Select` (dla diety), `Input` z obsługą tagów (dla list), `Switch` (dla trybu ciemnego), `Button`.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Po pierwszej rejestracji użytkownik jest tu przekierowywany, aby zachęcić go do wypełnienia profilu. Zmiany są zapisywane po kliknięciu przycisku, a sukces komunikowany jest przez toast.
    - **Dostępność:** Wszystkie kontrolki formularza są w pełni dostępne z klawiatury i poprawnie opisane dla czytników ekranu.

### 3. Główny Widok Aplikacji
- **Nazwa widoku:** AppView
- **Ścieżka widoku:** `/app`
- **Główny cel:** Centralne miejsce do interakcji z kluczowymi funkcjami: generowaniem, zapisywaniem i przeglądaniem przepisów. Składa się z dwóch głównych paneli.

#### 3.1 Panel Listy Przepisów (lewa kolumna)
- **Główny cel:** Przeglądanie, wyszukiwanie i zarządzanie zapisaną kolekcją przepisów.
- **Kluczowe informacje do wyświetlenia:** Lista kart przepisów (tytuł, tagi, data dodania), pole wyszukiwania, klikalne filtry tagów.
- **Kluczowe komponenty widoku:** `Input` (wyszukiwarka), `Badge` (filtry tagów), `Card` (element listy), `Button` z ikoną (do usuwania), `Dialog` (potwierdzenie usunięcia), `Skeleton` (stan ładowania), komponent pustego stanu.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Wyszukiwanie działa z opóźnieniem (debounce) podczas pisania. Kliknięcie w tag na karcie przepisu dodaje go jako filtr. Pusty stan zawiera wezwanie do działania (CTA) zachęcające do generacji.
    - **Dostępność:** Lista jest semantycznie poprawna. Każdy element interaktywny (przycisk, filtr) jest dostępny z klawiatury.

#### 3.2 Panel Roboczy (prawa kolumna)
- **Główny cel:** Dynamiczny obszar do generowania nowych przepisów lub wyświetlania szczegółów istniejącego.
- **Kluczowe informacje do wyświetlenia:**
    - **Stan generatora:** Pole tekstowe na prompt, przykładowe prompty (chipy), przycisk "Generuj", subtelna informacja o użyciu profilu.
    - **Stan podglądu:** Pełna treść przepisu (składniki, instrukcje), przycisk "Zapisz", ostrzeżenie o nielubianych składnikach.
- **Kluczowe komponenty widoku:** `Textarea`, `Badge` (przykładowe prompty), `Button`, `Tooltip`, `Alert`, `Toast`.
- **UX, dostępność i względy bezpieczeństwa:**
    - **UX:** Pole z promptem pozostaje edytowalne po generacji, co ułatwia iterację. Blokada zapisu przepisu z nielubianym składnikiem jest jasno zakomunikowana przez nieaktywny przycisk i tooltip.
    - **Dostępność:** Treść przepisu jest ustrukturyzowana za pomocą nagłówków i list dla lepszej nawigacji.

## 3. Mapa podróży użytkownika

1.  **Rejestracja i Onboarding:** Użytkownik tworzy konto na `/login`, po czym jest przekierowywany na `/profile` w celu uzupełnienia preferencji.
2.  **Pierwsza Generacja:** Po zapisaniu profilu trafia do `/app`. W prawej kolumnie widzi generator. Używa przykładowego promptu, klika "Generuj".
3.  **Podgląd i Zapis:** W prawej kolumnie pojawia się wygenerowany przepis. Przycisk "Zapisz" jest aktywny. Użytkownik klika go, otrzymuje potwierdzenie (toast), a przepis pojawia się na liście w lewej kolumnie.
4.  **Wyszukiwanie i Przeglądanie:** Użytkownik wpisuje frazę w polu wyszukiwania na liście. Lista dynamicznie się filtruje. Klika na inny przepis na liście, a jego szczegóły natychmiast pojawiają się w prawej kolumnie.
5.  **Usuwanie:** Użytkownik klika ikonę kosza na karcie przepisu, potwierdza akcję w oknie dialogowym, a przepis znika z listy.

## 4. Układ i struktura nawigacji

- **Nawigacja Globalna:** Prosty nagłówek aplikacji zawiera logo, link do profilu (`/profile`), przełącznik trybu ciemnego i przycisk wylogowania. Jest on widoczny we wszystkich widokach po zalogowaniu.
- **Nawigacja Wewnętrzna (`/app`):**
    - **Desktop:** Interakcja odbywa się w układzie "Master-Detail". Wybór elementu na liście (Master) aktualizuje zawartość panelu roboczego (Detail).
    - **Mobile:** Layout staje się jednokolumnowy. Na górze ekranu pojawiają się dwie zakładki: "Kolekcja" (prowadząca do listy przepisów) i "Generator" (prowadząca do panelu roboczego).

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów UI z biblioteki `shadcn/ui`, które będą stanowić podstawę systemu projektowego:

- **`Button`:** Do wszystkich akcji (generowanie, zapis, usuwanie).
- **`Input`:** Do wyszukiwania, pól formularzy.
- **`Card`:** Do wyświetlania elementów na liście przepisów oraz jako kontener dla formularzy.
- **`Dialog`:** Do modalnych okien potwierdzeń (np. przed usunięciem).
- **`Skeleton`:** Do wskazywania stanu ładowania danych, zapobiegając przesunięciom layoutu.
- **`Toast`:** Do wyświetlania krótkich, nieblokujących powiadomień (np. "Przepis zapisany").
- **`Tooltip`:** Do dostarczania dodatkowych informacji kontekstowych (np. przyczyna blokady zapisu).
- **`Badge` / `Chip`:** Do wyświetlania tagów, filtrów i przykładowych promptów.
- **`Switch`:** Do przełączania trybu ciemnego.
- **`Alert`:** Do wyświetlania ważnych ostrzeżeń (np. o nielubianych składnikach).
