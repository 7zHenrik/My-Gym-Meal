# ProteinFeed 🍚💪

Eine mobile App zum **Entdecken, Teilen und Nachmachen von Fitness- und High-Protein-Rezepten**.
Kein Kalorien-Tracker, kein Ernährungstagebuch — einfach ein Feed voller geiler, proteinreicher
Rezepte, die du sofort nachkochen kannst.

> **Hinweis zum Namen:** "ProteinFeed" ist ein Arbeitstitel. Er steht an genau einer Stelle im
> Code (`src/constants/app.ts`) und kann dort jederzeit geändert werden, ohne im restlichen Code
> etwas anpassen zu müssen.

Dieses Dokument richtet sich bewusst an jemanden **ohne Programmiererfahrung**. Wenn ein Schritt
unklar ist, lies ihn einfach zweimal — jeder Klick ist genau beschrieben.

---

## Inhalt

1. [Was diese App kann](#was-diese-app-kann)
2. [Verwendete Technologien](#verwendete-technologien)
3. [Voraussetzungen](#voraussetzungen)
4. [Supabase einrichten (Datenbank, Login, Datei-Speicher)](#supabase-einrichten)
5. [Projekt installieren](#projekt-installieren)
6. [App starten](#app-starten)
7. [Deployment (echte iOS-/Android-App)](#deployment)
8. [Typische Fehler & Lösungen](#typische-fehler--lösungen)
9. [Weiterführende Dokumente](#weiterführende-dokumente)

---

## Was diese App kann

- Rezepte im Feed entdecken (Home), mit Sortierung "Neu" / "Beliebt"
- Rezepte durchsuchen und nach Kategorie, Protein- und Kalorienmenge filtern (Entdecken)
- Ein eigenes Rezept mit Bild, optional Video, Zutaten, Zubereitungsschritten und Nährwerten
  hochladen
- Rezepte liken und speichern ("Gespeichert")
- Kommentare schreiben
- Unangemessene Rezepte/Kommentare melden
- Ein eigenes Profil mit Bio, Profilbild und allen eigenen Rezepten
- Registrierung / Login / Logout mit E-Mail und Passwort

Was **bewusst fehlt** (siehe Aufgabenstellung): Kalorien-Tracking, Tagesziele, Barcode-Scanner,
Follower-System, KI-Funktionen. Die Datenbank ist aber so aufgebaut, dass all das später ergänzt
werden kann (siehe [ARCHITECTURE.md](./ARCHITECTURE.md)).

## Verwendete Technologien

| Bereich | Technologie | Warum |
|---|---|---|
| App (iOS/Android/Web) | [Expo](https://expo.dev) + React Native + TypeScript | Eine Codebasis für iOS und Android, riesige Community, sehr gut dokumentiert |
| Navigation | [expo-router](https://docs.expo.dev/router/introduction/) | Datei-basiertes Routing, offizieller Expo-Standard |
| Backend | [Supabase](https://supabase.com) (Postgres-Datenbank, Login, Datei-Speicher) | Kein eigener Server nötig; Login, Datenbank und Bild/Video-Uploads sind fertige Bausteine |
| Daten laden/cachen | [TanStack Query](https://tanstack.com/query) | Automatisches Laden, Zwischenspeichern, "Pull to Refresh", Pagination |
| Bilder | expo-image + expo-image-manipulator | Schnelles Laden, automatische Bildkomprimierung vor dem Upload |
| Video | expo-video | Video-Wiedergabe direkt in der App |

Mehr Hintergrund zu diesen Entscheidungen steht in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Voraussetzungen

Auf deinem Computer:

- [Node.js](https://nodejs.org) (Version 20 oder neuer)
- Ein Terminal/Kommandozeile
- Die kostenlose **Expo Go** App auf deinem Smartphone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)) — damit kannst du die App sofort auf deinem eigenen Handy testen, ohne sie im App Store zu veröffentlichen

Außerdem brauchst du einen **kostenlosen Supabase-Account** (siehe nächster Abschnitt).

## Supabase einrichten

Supabase ist der "Server" der App: Er speichert Benutzerkonten, Rezepte, Bilder und Videos.

### 1. Projekt erstellen

1. Gehe auf [supabase.com](https://supabase.com) und klicke auf **"Start your project"**.
2. Melde dich an (z. B. mit GitHub) und klicke auf **"New Project"**.
3. Vergib einen Projektnamen (z. B. "protein-feed"), ein Datenbank-Passwort (aufschreiben!) und
   wähle eine Region in deiner Nähe.
4. Klicke auf **"Create new project"** und warte ca. 1–2 Minuten, bis es fertig eingerichtet ist.

### 2. Datenbank einrichten

1. Öffne in deinem Supabase-Projekt links im Menü **"SQL Editor"**.
2. Klicke auf **"New query"**.
3. Öffne die Datei [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) aus
   diesem Projekt, kopiere den **gesamten Inhalt** und füge ihn in das SQL-Feld ein.
4. Klicke auf **"Run"** (unten rechts bzw. Strg/Cmd+Enter). Das erstellt alle Tabellen, Regeln und
   Datei-Speicher-Buckets.
5. Wiederhole das mit [`supabase/migrations/0002_seed_categories.sql`](./supabase/migrations/0002_seed_categories.sql)
   — das füllt die Kategorien-Liste (Frühstück, High Protein, Meal Prep, …).

### 3. API-Zugangsdaten kopieren

1. Klicke links im Menü auf **"Project Settings"** (Zahnrad-Symbol) → **"Data API"**.
2. Dort findest du die **Project URL** (z. B. `https://abcdefgh.supabase.co`).
3. Klicke auf **"API Keys"** und kopiere den Wert bei **"anon" / "public"** (ein langer Text, der
   mit `eyJ...` beginnt). Das ist **kein** geheimer Schlüssel — er ist extra dafür gemacht, in der
   App verwendet zu werden. Verwende **niemals** den "service_role"-Key in der App.

## Projekt installieren

Im Terminal, im Hauptordner dieses Projekts:

```bash
npm install
```

Das lädt alle benötigten Pakete herunter (dauert beim ersten Mal 1–2 Minuten).

### `.env`-Datei anlegen

1. Kopiere die Datei `.env.example` und benenne die Kopie in `.env` um.
2. Öffne `.env` und trage deine Werte aus Supabase ein:

```
EXPO_PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
```

Diese Datei wird **nicht** in Git eingecheckt (siehe `.gitignore`) — jeder, der das Projekt
weiterentwickelt, braucht seine eigene `.env`-Datei.

## App starten

```bash
npm run start
```

Es öffnet sich ein QR-Code im Terminal (bzw. im Browser).

- **Auf dem Handy:** Öffne die Expo-Go-App und scanne den QR-Code (iOS: über die normale
  Kamera-App scannen und den Hinweis antippen).
- **Am Computer testen:** Drücke im Terminal `w` für die Web-Vorschau, `i` für den iOS-Simulator
  (nur auf einem Mac) oder `a` für einen Android-Emulator.

Beim ersten Start solltest du den Home-Feed sehen (leer, bis das erste Rezept hochgeladen wurde).
Registriere ein Konto über **Profil → Anmelden → Jetzt registrieren** und lade dein erstes Rezept
über den **Hochladen**-Tab hoch.

## Deployment

Für eine erste Testversion reicht **Expo Go** völlig aus (siehe oben). Für eine echte
Veröffentlichung im App Store / Play Store nutzt man später
[EAS Build](https://docs.expo.dev/build/introduction/) von Expo:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios      # oder: android
```

Das ist bewusst **nicht** Teil der ersten Version — die App-Architektur (Expo + expo-router) ist
aber genau dafür gemacht, dass dieser Schritt später ohne Codeänderungen möglich ist.

## Typische Fehler & Lösungen

| Fehlermeldung / Problem | Lösung |
|---|---|
| `Supabase ist nicht konfiguriert…` beim Start | Die `.env`-Datei fehlt oder ist falsch ausgefüllt. Prüfe, ob `EXPO_PUBLIC_SUPABASE_URL` und `EXPO_PUBLIC_SUPABASE_ANON_KEY` korrekt gesetzt sind, und starte `npm run start` neu (Env-Variablen werden nur beim Start eingelesen). |
| Rezepte werden nicht angezeigt / Fehler beim Laden | Prüfe, ob du beide SQL-Dateien in Supabase ausgeführt hast (siehe oben). Prüfe im Supabase-Dashboard unter "Table Editor", ob die Tabellen `recipes`, `profiles` usw. existieren. |
| "Dieser Benutzername ist bereits vergeben" | Benutzernamen müssen eindeutig sein — wähle einen anderen. |
| Bild-/Video-Upload schlägt fehl | Prüfe deine Internetverbindung. Videos dürfen maximal 80 MB groß sein. |
| Änderungen im Code werden nicht angezeigt | Starte den Metro-Bundler neu: im Terminal `r` drücken, oder `npm run start` beenden (Strg+C) und neu starten. |
| `npm install` schlägt fehl | Prüfe deine Node.js-Version (`node --version`, mind. 20) und deine Internetverbindung. |

## Weiterführende Dokumente

- [ARCHITECTURE.md](./ARCHITECTURE.md) — technische Entscheidungen, Datenmodell, geplante Erweiterungen
- [`supabase/migrations/`](./supabase/migrations/) — die komplette Datenbankstruktur als SQL, mit Kommentaren
