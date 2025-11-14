<user_journey_analysis>
- Ścieżki użytkownika (wg PRD i spec auth):
  - Start niezalogowany → przejście do /login.
  - Rejestracja → (opcjonalna) weryfikacja e‑mail → zalogowany.
  - Logowanie → zalogowany.
  - Zapomniane hasło → e‑mail → reset → powrót do /login.
  - Zalogowany → /app (pusty stan kolekcji). Jeśli brak profilu, CTA do
    uzupełnienia → /profile → zapis profilu.
  - Dostęp do głównej funkcjonalności (generacja, zapis, lista) tylko po
    zalogowaniu (RLS po stronie serwera).
  - 401 w trakcie pracy → powrót do /login.
- Główne stany: Niezalogowany, Logowanie, Rejestracja, Reset Hasła,
  Zalogowany (/app), Edycja Profilu (/profile).
- Punkty decyzyjne: Czy konto wymaga weryfikacji e‑mail? Czy profil istnieje?
  Czy generowany przepis zawiera składniki z „Unikaj”? (blokada zapisu).
- Cel stanów: umożliwić bezpieczne wejście do aplikacji i korzystanie z
  funkcji po zalogowaniu, zgodnie z US‑001 i resztą US.
</user_journey_analysis>

<mermaid_diagram>
```mermaid
stateDiagram-v2
  [*] --> Niezalogowany

  state "Niezalogowany" as Niezalogowany {
    [*] --> EkranWejsciowy
    EkranWejsciowy --> Logowanie: Klik "Zaloguj"
    EkranWejsciowy --> Rejestracja: Klik "Utwórz konto"
    EkranWejsciowy --> ResetHasla: Klik "Zapomniałem hasła"

    state "Proces Logowania" as Logowanie {
      [*] --> FormularzLog
      FormularzLog --> WalidacjaLog
      WalidacjaLog --> SesjaOK: Dane poprawne
      WalidacjaLog --> BladLog: Dane błędne
      BladLog --> FormularzLog
      SesjaOK --> [*]
      note right of SesjaOK
        Po sukcesie: session_start,
        redirect do /app
      end note
    }

    state "Proces Rejestracji" as Rejestracja {
      [*] --> FormularzRej
      FormularzRej --> WalidacjaRej
      WalidacjaRej --> if_verify
      state if_verify <<choice>>
      if_verify --> WeryfikacjaEmail: Wymagana weryfikacja
      if_verify --> SesjaRejOK: Bez weryfikacji
      WeryfikacjaEmail --> SesjaRejOK: Link kliknięty
      SesjaRejOK --> [*]
      note right of SesjaRejOK
        Po sukcesie: session_start,
        redirect do /app
      end note
    }

    state "Reset Hasła" as ResetHasla {
      [*] --> FormularzEmail
      FormularzEmail --> MailWyslany: Wyślij link resetu
      MailWyslany --> UstawHaslo: Otwórz link
      UstawHaslo --> Potwierdzenie: Zmień hasło
      Potwierdzenie --> [*]: Powrót do /login
    }
  }

  Niezalogowany --> Zalogowany: Sesja aktywna

  state "Zalogowany" as Zalogowany {
    [*] --> App
    state "Aplikacja" as App {
      [*] --> PustyStanKolekcji
      PustyStanKolekcji --> Lista: Gdy są przepisy
      PustyStanKolekcji --> CTAProfil: Brak profilu → CTA
      CTAProfil --> Profil: Przejdź do /profile

      state "Profil" as Profil {
        [*] --> EdycjaProfilu
        EdycjaProfilu --> ZapisProfilu: Zapis
        ZapisProfilu --> [*]: Sukces (profile_edited)
      }

      state "Przepisy" as Recipes {
        [*] --> Generacja
        Generacja --> Podglad: Sukces generacji
        Podglad --> if_unikaj
        state if_unikaj <<choice>>
        if_unikaj --> BlokadaZapisu: Zawiera "Unikaj"
        if_unikaj --> Zapis: Brak "Unikaj"
        BlokadaZapisu --> EdycjaProfilu: CTA do profilu
        Zapis --> Lista: recipe_saved
      }

      Lista --> [*]
    }
  }

  Zalogowany --> Niezalogowany: 401/wylogowanie
```
</mermaid_diagram>

