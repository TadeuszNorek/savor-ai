<conversation_summary>
<decisions>
1.  **Typ diety (`dietType`)**: Zostanie zaimplementowany jako typ `ENUM` w celu zapewnienia spójności danych.
2.  **Klucz główny dla przepisów**: Tabela `recipes` będzie używać `BIGSERIAL` jako klucza głównego.
3.  **Wyszukiwanie pełnotekstowe (FTS)**: Zostanie utworzona dedykowana kolumna `tsvector` z indeksem GIN w tabeli `recipes` w celu wydajnego wyszukiwania.
4.  **Filtrowanie po tagach**: Tagi będą przechowywane jako tablica tekstowa (`TEXT[]`) w tabeli `recipes`, a do optymalizacji zapytań zostanie użyty indeks GIN.
5.  **Typ zdarzeń analitycznych (`event_type`)**: Zostanie użyty typ `TEXT` z ograniczeniem `CHECK`, aby zapewnić elastyczność i jednocześnie integralność danych.
6.  **Partycjonowanie tabeli `events`**: Tabela zostanie zaprojektowana w sposób umożliwiający partycjonowanie w przyszłości (dzięki kolumnie `created_at`), ale mechanizm ten nie zostanie zaimplementowany w ramach MVP.
7.  **Dostęp administracyjny**: Dostęp do danych analitycznych (tabela `events`) dla administratora/analityka będzie realizowany za pomocą klucza `service_role` z Supabase, który omija polityki RLS.
8.  **Relacje między tabelami**: Wszystkie główne tabele (`profiles`, `recipes`, `events`) będą bezpośrednio powiązane z tabelą `auth.users` poprzez klucz obcy `user_id`, z ustawioną opcją `ON DELETE CASCADE`.
</decisions>

<matched_recommendations>
1.  Zastosowanie typu `ENUM` dla `dietType` w celu zapewnienia spójności danych i ułatwienia przyszłych analiz.
2.  Stworzenie dedykowanej kolumny `tsvector` oraz indeksu GIN w celu drastycznego przyspieszenia wyszukiwania pełnotekstowego.
3.  Implementacja przechowywania tagów jako `TEXT[]` z indeksem GIN jako najprostszego i najwydajniejszego rozwiązania dla MVP.
4.  Wykorzystanie klucza `service_role` jako standardowego i bezpiecznego sposobu na dostęp administracyjny do danych z pominięciem RLS w Supabase.
5.  Ustanowienie `auth.users.id` jako centralnego punktu dla kluczy obcych we wszystkich tabelach, co upraszcza architekturę i polityki bezpieczeństwa.
6.  Zastosowanie `ON DELETE CASCADE` w relacjach, aby automatycznie zarządzać integralnością danych po usunięciu użytkownika.
</matched_recommendations>

<database_planning_summary>
Na podstawie wymagań produktu (PRD) i dyskusji, schemat bazy danych dla MVP SavorAI zostanie zbudowany w oparciu o trzy główne tabele: `profiles`, `recipes` i `events`, wszystkie hostowane na PostgreSQL w ramach Supabase.

**a. Główne wymagania dotyczące schematu bazy danych:**
Schemat musi obsługiwać profile preferencji użytkowników, przechowywać przepisy w formacie JSON, umożliwiać wydajne wyszukiwanie pełnotekstowe oraz filtrowanie po tagach. Musi również logować zdarzenia użytkowników na potrzeby analityki i metryk KPI.

**b. Kluczowe encje i ich relacje:**
- **`profiles`**: Tabela przechowująca preferencje użytkownika (dieta, nielubiane składniki). Połączona relacją jeden-do-jednego z `auth.users`.
- **`recipes`**: Tabela przechowująca zapisane przez użytkowników przepisy. Połączona relacją wiele-do-jednego z `auth.users`.
- **`events`**: Tabela do logowania zdarzeń systemowych (np. logowanie, generowanie przepisu). Połączona relacją wiele-do-jednego z `auth.users`.
Wszystkie relacje zostaną zabezpieczone kluczem obcym `user_id` z opcją `ON DELETE CASCADE`.

**c. Ważne kwestie dotyczące bezpieczeństwa i skalowalności:**
- **Bezpieczeństwo**: Dostęp do danych będzie chroniony przez polityki Row-Level Security (RLS) na poziomie bazy danych, zapewniając, że użytkownicy mogą modyfikować i odczytywać wyłącznie własne dane. Dostęp administracyjny do celów analitycznych będzie realizowany za pomocą bezpiecznego klucza `service_role`.
- **Skalowalność**: Wydajność zapytań zostanie zapewniona przez strategiczne użycie indeksów GIN dla wyszukiwania pełnotekstowego i filtrowania po tagach. Tabela `events` jest zaprojektowana z myślą o przyszłym partycjonowaniu, co pozwoli na zarządzanie jej rozmiarem w miarę wzrostu aplikacji.

</database_planning_summary>

<unresolved_issues>
Na tym etapie wszystkie kluczowe kwestie dotyczące projektu schematu bazy danych dla MVP zostały omówione i rozwiązane. Nie ma nierozwiązanych problemów.
</unresolved_issues>
</conversation_summary>
