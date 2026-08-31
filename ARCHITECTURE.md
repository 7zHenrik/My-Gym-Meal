# Architektur-Entscheidungen

Dieses Dokument erklärt **wie** die App gebaut ist und **warum**. Es richtet sich an eine
zukünftige Version von dir (oder einen anderen Entwickler / eine KI), die die App weiterbaut.

## Tech-Stack im Überblick

```
┌─────────────────────────────┐
│   Expo / React Native App   │  ← src/app (Screens), src/components (UI)
│   (iOS, Android, Web)       │
└──────────────┬───────────────┘
               │ HTTPS (Supabase JS SDK)
┌──────────────▼───────────────┐
│           Supabase            │
│  ─ Postgres-Datenbank         │
│  ─ Auth (E-Mail/Passwort)     │
│  ─ Storage (Bilder/Videos)    │
│  ─ Row Level Security (RLS)   │
└────────────────────────────────┘
```

**Kein eigener Server.** Die App spricht direkt (über das offizielle Supabase-SDK) mit Supabase.
Sicherheit wird nicht durch Server-Code, sondern durch **Row Level Security-Regeln direkt in der
Datenbank** durchgesetzt (siehe `supabase/migrations/0001_init.sql`). Das bedeutet: Selbst wenn
jemand den API-Schlüssel aus der App ausliest, kann er trotzdem nur seine eigenen Daten ändern —
das erzwingt die Datenbank, nicht der Client.

> **Hinweis zur SDK-Version:** Die App wurde ursprünglich mit Expo SDK 57 aufgebaut, dann aber
> bewusst auf **SDK 54** zurückgestuft. Grund: Die im App Store/Play Store veröffentlichte
> Expo-Go-App unterstützte zum Testzeitpunkt nur bis SDK 54 ("Project is incompatible with this
> version of Expo Go"). Da Expo Go der einfachste Weg ist, die App ohne eigenen Build auf einem
> echten Handy zu testen, hat Kompatibilität mit der aktuell installierbaren Expo-Go-Version Vorrang
> vor der neuesten SDK-Version. Falls Expo Go später eine neuere SDK-Version unterstützt, kann die
> App jederzeit wieder hochgestuft werden (`npx expo install expo@latest` und abhängige Pakete
> entsprechend anpassen).

### Warum Expo + React Native?

- Eine Codebasis für iOS und Android (Ziel laut Aufgabenstellung).
- Kann jederzeit ohne Architekturwechsel über [EAS Build](https://docs.expo.dev/build/introduction/)
  in den App Store / Play Store veröffentlicht werden.
- Riesige Community, sehr gute Dokumentation — wichtig für einen Einsteiger.
- Läuft während der Entwicklung direkt auf dem eigenen Handy über die Expo-Go-App, ganz ohne
  Xcode/Android Studio.

### Warum Supabase statt eigenem Backend?

- Postgres-Datenbank, Login-System und Datei-Speicher sind sofort einsatzbereit — kein Server,
  den man selbst betreiben, absichern und aktualisieren muss.
- **Row Level Security (RLS)** setzt die Sicherheitsanforderung "Nutzer dürfen nur eigene Inhalte
  bearbeiten" direkt in der Datenbank durch (nicht nur in der App-Oberfläche).
- Kostenloser Tarif reicht für den Start völlig aus.
- Der `anon`-Schlüssel ist bewusst dafür gemacht, öffentlich im Client-Code zu stehen — er gewährt
  keine Rechte, die nicht durch RLS-Regeln erlaubt sind. Der geheime `service_role`-Schlüssel wird
  **nirgendwo** in der App verwendet.

## Projektstruktur

```
src/
  app/                  → Bildschirme (expo-router: Ordnerstruktur = Navigation)
    (tabs)/              → Bottom-Tab-Bereich: Home, Entdecken, Hochladen, Gespeichert, Profil
    recipe/[id].tsx       → Rezept-Detailseite
    user/[id].tsx          → Öffentliches Profil eines anderen Nutzers
    auth/                 → Login / Registrierung
    edit-profile.tsx       → Eigenes Profil bearbeiten
    report.tsx              → Rezept/Kommentar melden
  components/           → Wiederverwendbare UI-Bausteine (RecipeCard, Button, Avatar, …)
  hooks/                 → React-Query-Hooks, die die API-Funktionen kapseln
  api/                    → Reine Funktionen, die mit Supabase sprechen (kein UI-Code)
  context/                → AuthProvider (wer ist eingeloggt?)
  constants/               → Design-Tokens (Farben, Abstände), Kategorien, Filter, App-Name
  types/                   → TypeScript-Typen, die die Datenbanktabellen beschreiben
  utils/                   → Kleine Hilfsfunktionen (Formatierung, Portionsumrechnung)
supabase/
  migrations/            → Die komplette Datenbankstruktur als SQL (manuell in Supabase ausführen)
```

**Warum diese Trennung von `api/` und `hooks/`?** `api/*.ts` enthält reine Datenzugriffs-Funktionen
(z. B. "hole Rezept X"). `hooks/*.ts` verbindet diese Funktionen mit React Query (Caching,
Ladezustände, Pagination). Screens rufen nur Hooks auf, nie direkt Supabase — das hält
UI-Code und Datenzugriff sauber getrennt und macht beides einzeln testbar/austauschbar.

## Datenmodell

Siehe `supabase/migrations/0001_init.sql` für die vollständige, kommentierte Struktur. Kurzfassung:

- **profiles** — ein öffentliches Profil pro Benutzerkonto (wird automatisch per Datenbank-Trigger
  erstellt, sobald sich jemand registriert)
- **recipes** — Rezepte inkl. Zutaten (`ingredients`, JSON-Array) und Zubereitungsschritten
  (`steps`, JSON-Array); `like_count`/`comment_count` werden per Trigger automatisch aktuell
  gehalten
- **categories** — einfache Liste, admin-erweiterbar
- **likes**, **saved_recipes** — je eine Zeile pro Nutzer×Rezept
- **comments** — Kommentare zu Rezepten
- **reports** — Meldungen zu Rezepten oder Kommentaren, mit `status`-Feld für eine spätere
  Moderations-Oberfläche

### Warum Zutaten/Schritte als JSON und nicht als eigene Tabellen?

Zutaten und Zubereitungsschritte gehören immer fest zu genau einem Rezept, werden nie eigenständig
abgefragt und ändern sich nur gemeinsam mit dem Rezept. Eigene Tabellen (`ingredients`,
`recipe_steps`) würden nur zusätzliche Joins erzeugen, ohne einen echten Vorteil zu bringen. Falls
später z. B. "finde alle Rezepte mit Zutat X" wichtig wird, lässt sich das immer noch nachrüsten.

## Admin-Bereich (vorbereitet, nicht gebaut)

Laut Aufgabenstellung reicht es für Version 1, **Datenstruktur und Berechtigungen** vorzubereiten:

- `profiles.role` (`'user' | 'admin'`) unterscheidet normale Nutzer von Admins.
- Die Funktion `public.is_admin()` in der Datenbank wird von den RLS-Regeln genutzt, damit Admins
  später fremde Rezepte/Kommentare löschen und Meldungen bearbeiten können — **ohne dass sich die
  Regeln ändern müssen**, sobald eine Admin-Oberfläche gebaut wird.
- Ein Nutzer wird aktuell manuell zum Admin gemacht (im Supabase Table Editor `role` auf `admin`
  setzen). Eine eigene Admin-Oberfläche in der App ist eine spätere Erweiterung.

## Bewusste Vereinfachungen in Version 1

Diese Punkte funktionieren, sind aber bewusst einfach gehalten, um die erste Version schlank zu
halten. Alle sind ohne Architekturänderung erweiterbar:

- **Video-Komprimierung** passiert aktuell **nicht** serverseitig (nur eine Größenbegrenzung von
  80 MB beim Upload). Eine serverseitige Kompression könnte später über eine
  [Supabase Edge Function](https://supabase.com/docs/guides/functions) mit `ffmpeg` ergänzt
  werden.
- **Like/Speichern-Status** wird pro Bildschirm lokal optimistisch verwaltet (sofortiges visuelles
  Feedback beim Antippen), statt global synchronisiert. Beim erneuten Öffnen eines Bildschirms wird
  der aktuelle Stand aus der Datenbank nachgeladen. Für eine App dieser Größe ist das ausreichend
  und deutlich einfacher zu warten als eine volle Client-seitige Zustandssynchronisation.
- **"Für dich" / "Trending"-Sortierung** ist noch nicht personalisiert — es gibt nur "Neu" und
  "Beliebt" (nach Like-Anzahl). Ein echter Empfehlungsalgorithmus ist eine spätere Erweiterung.
- **Portionsanpassung** skaliert nur die Zutatenmengen, nicht automatisch die angezeigten
  Nährwerte (die beziehen sich laut Vorgabe fest auf "1 Portion").
- **Bearbeiten von Rezepten** ist noch nicht möglich (nur Löschen durch den Autor/die Autorin).
  Das Upload-Formular könnte später leicht zu einem Bearbeiten-Formular erweitert werden, indem es
  optional mit vorhandenen Rezeptdaten vorausgefüllt wird.

## Branding / App-Name

Der Name "My Gym Meal" taucht im Code **nur** in `src/constants/app.ts` auf. Alle Bildschirme
importieren `APP_NAME` von dort, statt den Namen selbst zu enthalten. Um die App umzubenennen:

1. `src/constants/app.ts` anpassen.
2. `app.json` → `expo.name` (Name auf dem Homescreen) und `expo.slug` anpassen.
3. Icons/Splash-Screen in `assets/images/` austauschen.

## Geplante spätere Erweiterungen (laut Aufgabenstellung, nicht Teil von Version 1)

Personalisierter Feed, Follower-System, Benachrichtigungen, Wochenplan/Einkaufsliste, KI-Rezeptvorschläge,
Kalorientracker, verifizierte Creator, Challenges/Rankings. Die Datenbankstruktur (insbesondere
`profiles`, `recipes` mit stabilen IDs) ist so gewählt, dass keine dieser Erweiterungen einen
Umbau des bestehenden Datenmodells erfordert — sie kommen als neue Tabellen/Felder hinzu.
