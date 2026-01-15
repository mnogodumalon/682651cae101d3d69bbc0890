# Design Brief: Schichtplaner

## 1. App Analysis

### What This App Does
Der Schichtplaner verwaltet Unternehmen, Mitarbeitende, Schichtarten und konkrete Schichteinteilungen. Nutzer planen, wem welche Schicht an welchem Tag zugewiesen ist, inkl. Uhrzeiten und Notizen.

### Who Uses This
Schichtleiter:innen, HR- oder Standortverantwortliche in kleinen bis mittleren Betrieben, die täglich prüfen müssen, ob die Schichten der kommenden Tage sauber besetzt sind.

### The ONE Thing Users Care About Most
„Wie viele Schichten sind in den nächsten 7 Tagen geplant – und wer hat die nächste Schicht?“ Das beantwortet sofort die Frage nach Tages- und Wochenabdeckung.

### Primary Actions (IMPORTANT!)
1. Schicht zuweisen → Primary Action Button
2. Mitarbeitende anlegen
3. Schichtart anlegen
4. Unternehmen anlegen

---

## 2. What Makes This Design Distinctive

### Visual Identity
Die Oberfläche wirkt wie ein analoger Dienstplan, modern übersetzt: ein warmes Papier‑ähnliches Off‑White als Basis, dunkles Graphit für Text und ein petrolfarbener Akzent als „Planungs‑Tinte“. Die Primäraktion in Terrakotta erinnert an einen markierten Eintrag im Kalender.

### Layout Strategy
Asymmetrische Desktop‑Layoutlogik: links die große, ruhige „Planungs‑Fläche“ mit Hero‑KPI und Verlauf, rechts die kompakte „Kontroll‑Spalte“ für Stammdaten (Mitarbeitende, Unternehmen, Schichtarten). Der Hero ist sichtbar größer, nutzt viel Weißraum und enthält eine eigene visuelle „Timeline‑Leiste“. Sekundäre KPIs sind kleiner, gruppiert und unterstützen, ohne zu konkurrieren.

### Unique Element
Die „Timeline‑Leiste“ im Hero: eine dünne horizontale Linie mit kurzen Tick‑Marks und einem farbigen „Heute“‑Pill. Sie zieht sich unter die Hero‑Zahl und macht die Planung emotional greifbar – wie eine reale Schichtliste.

---

## 3. Theme & Colors

### Font
- **Family:** Space Grotesk
- **URL:** `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap`
- **Why this font:** Geometrisch, technisch, aber freundlich – perfekt für Planungsdaten ohne steril zu wirken.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(34 36% 97%)` | `--background` |
| Main text | `hsl(210 18% 18%)` | `--foreground` |
| Card background | `hsl(30 20% 99%)` | `--card` |
| Card text | `hsl(210 18% 18%)` | `--card-foreground` |
| Borders | `hsl(210 20% 88%)` | `--border` |
| Primary action | `hsl(18 84% 52%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(186 55% 35%)` | `--accent` |
| Muted background | `hsl(32 25% 93%)` | `--muted` |
| Muted text | `hsl(210 10% 45%)` | `--muted-foreground` |
| Success/positive | `hsl(150 45% 36%)` | (component use) |
| Error/negative | `hsl(0 72% 55%)` | `--destructive` |

### Why These Colors
Warmes Papier + Graphit erzeugt Ruhe und Professionalität. Petrol sorgt für die „Planungs‑Tinte“ und klare Akzente, Terrakotta macht die Primäraktion sofort sichtbar und menschlich.

### Background Treatment
Subtiles Doppel‑Layering: eine sehr leichte radiale Aufhellung oben links und eine feine, fast unsichtbare lineare Textur (wie ein dezentes Raster). Kein flaches Weiß.

---

## 4. Mobile Layout (Phone)

### Layout Approach
Ein vertikaler Fluss mit einem dominanten Hero oben (erste 45–50% des Viewports). Darunter horizontale KPI‑Chips (scrollbar‑frei), dann Chart und Listen. Der „Timeline‑Leiste“‑Akzent gibt dem Hero sofort Wiedererkennung.

### What Users See (Top to Bottom)

**Header:**
App‑Titel „Schichtplaner“, darunter ein kleiner Zeitraum‑Hinweis (z. B. „Nächste 7 Tage“). Rechts kein Button – die Primäraktion sitzt unten fixiert.

**Hero Section (The FIRST thing users see):**
Große Karte mit der Zahl „Schichten nächste 7 Tage“. Ziffer ca. 48–56px, fett. Direkt darunter: „Nächste Schicht“ mit Datum, Uhrzeit und Name. Unter der Zahl die Timeline‑Leiste mit „Heute“‑Pill in Petrol.

**Section 2: KPI‑Chips (Horizontal Scroll)**
Drei kompakte Chips: „Mitarbeitende“, „Unternehmen“, „Schichtarten“. Chips haben abgerundete Ecken und einen leichten Schatten.

**Section 3: Schichtlast (Chart)**
Kompakter Area‑Chart „Schichten pro Tag (14 Tage)“. Mobile: nur jeder 2. Datums‑Tick, Tooltip beim Antippen.

**Section 4: Anstehende Schichten**
Liste als Karten‑Zeilen: Datum links, Zeitspanne + Name, darunter Unternehmen und Schichtart. Jede Zeile tappable für Details.

**Section 5: Stammdaten‑Überblick**
Zwei kompakte Karten untereinander: „Unternehmen“ (Name + Ort), „Schichtarten“ (Name + Zeit). Mitarbeiterliste auf Mobile bleibt sichtbar, aber als kurze Liste mit 4 Einträgen.

**Bottom Navigation / Action:**
Fixierter Primary Action Button „Schicht zuweisen“ über der unteren Safe‑Area.

### Mobile-Specific Adaptations
Chart wird flacher, weniger Achsenticks. KPI‑Chips statt großer Cards. Listen bleiben vollständig sichtbar, keine Inhalte werden versteckt.

### Touch Targets
Buttons min. 44px Höhe, List items 56–64px Zeilenhöhe.

### Interactive Elements (if applicable)
Tapping auf eine Schicht öffnet ein Detail‑Dialog mit allen Feldern und Notiz.

---

## 5. Desktop Layout

### Overall Structure
12‑Spalten‑Grid. Linke 8 Spalten = Planung (Hero + Chart + Schichtenliste). Rechte 4 Spalten = Stammdaten‑Spalte (KPIs + Listen). Der Blick geht zuerst zum Hero links oben, dann zum Chart, dann zu den anstehenden Schichten.

### Section Layout
- **Top Area:**
  - Links (8/12): Hero‑Karte mit Timeline‑Leiste.
  - Rechts (4/12): KPI‑Stack (Mitarbeitende, Unternehmen, Schichtarten) als kleine Karten.
- **Main Content:**
  - Links (8/12): Chart „Schichten pro Tag (14 Tage)“.
  - Rechts (4/12): „Unternehmen“‑Liste.
- **Bottom Area:**
  - Links (8/12): „Anstehende Schichten“ (Liste mit Details).
  - Rechts (4/12): „Mitarbeitende“‑Liste und darunter „Schichtarten“‑Liste.

### What Appears on Hover
Schicht‑Einträge heben sich mit Schatten + leichtem Hintergrund hervor; kleine „Details anzeigen“‑Chevron erscheint rechts.

### Clickable/Interactive Areas (if applicable)
Klick auf eine Schicht öffnet einen Detail‑Dialog mit Mitarbeiter, Unternehmen, Schichtart, Uhrzeit und Notiz.

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Schichten nächste 7 Tage
- **Data source:** Schichteinteilung
- **Calculation:** Count aller Schichten mit Datum zwischen heute und heute+6 Tage
- **Display:** Große Zahl (48–56px), darunter „Nächste Schicht“ (Datum + Zeit + Mitarbeiter). Timeline‑Leiste mit „Heute“‑Pill unter der Zahl.
- **Context shown:** „Heute: X Schichten“ als kleiner Pill rechts oben in der Karte.
- **Why this is the hero:** Nutzer sehen sofort, ob die kommende Woche abgedeckt ist und wer als nächstes dran ist.

### Secondary KPIs

**Mitarbeitende gesamt**
- Source: Mitarbeiterverwaltung
- Calculation: Count
- Format: number
- Display: Kleine Karte im KPI‑Stack

**Unternehmen aktiv**
- Source: Unternehmensverwaltung
- Calculation: Count
- Format: number
- Display: Kleine Karte im KPI‑Stack

**Schichtarten**
- Source: Schichtartenverwaltung
- Calculation: Count
- Format: number
- Display: Kleine Karte im KPI‑Stack

### Chart (if applicable)
- **Type:** Area‑Chart (ruhig, zeigt Verlauf der Schichtlast)
- **Title:** Schichten pro Tag (14 Tage)
- **What question it answers:** „Wann ist die nächste Hochlast?“
- **Data source:** Schichteinteilung
- **X-axis:** zuweisung_datum (als Datum)
- **Y-axis:** Anzahl Schichten pro Tag
- **Mobile simplification:** Weniger X‑Ticks, flacheres Chart‑Höhenverhältnis

### Lists/Tables (if applicable)

**Anstehende Schichten**
- Purpose: Schnell prüfen, wer wann arbeitet
- Source: Schichteinteilung
- Fields shown: Datum, Beginn/Ende, Mitarbeiter, Unternehmen, Schichtart, Notiz‑Indikator
- Mobile style: Karten‑Zeilen
- Desktop style: Karten‑Zeilen mit Hover
- Sort: Datum + Beginn aufsteigend
- Limit: 8

**Mitarbeitende**
- Purpose: Schnellkontakt
- Source: Mitarbeiterverwaltung
- Fields shown: Vorname/Nachname, E‑Mail oder Telefon
- Mobile style: einfache Liste
- Desktop style: kompakte Liste
- Sort: Nachname
- Limit: 5 (Mobile 4)

**Unternehmen**
- Purpose: Standort‑Kontext
- Source: Unternehmensverwaltung
- Fields shown: Name, Ort, Straße + Hausnummer
- Mobile style: kompakte Karten
- Desktop style: kompakte Karten
- Sort: Name
- Limit: 4

**Schichtarten**
- Purpose: Überblick über verfügbare Schichten
- Source: Schichtartenverwaltung
- Fields shown: Name, Beginn‑/Endezeit
- Mobile style: einfache Liste
- Desktop style: kompakte Liste
- Sort: Name
- Limit: 4

### Primary Action Button (REQUIRED!)

- **Label:** Schicht zuweisen
- **Action:** add_record
- **Target app:** Schichteinteilung
- **What data:** Datum, Beginn, Ende, Mitarbeiter, Unternehmen, Schichtart, Notiz
- **Mobile position:** bottom_fixed
- **Desktop position:** header
- **Why this action:** Das tägliche Kerngeschäft ist das Zuweisen neuer Schichten.

---

## 7. Visual Details

### Border Radius
rounded (12px)

### Shadows
subtle – weiche, kurze Schatten mit sehr geringer Opazität (kein „floating card“‑Look)

### Spacing
spacious – klare Abstände, Hero mit viel Weißraum

### Animations
- **Page load:** staggered fade‑up (Hero zuerst, dann KPIs, dann Listen)
- **Hover effects:** Karten heben sich leicht an, Hintergrund wird minimal dunkler
- **Tap feedback:** leichte Skalierung (0.98) bei Buttons/List items

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --background: hsl(34 36% 97%);
  --foreground: hsl(210 18% 18%);

  --card: hsl(30 20% 99%);
  --card-foreground: hsl(210 18% 18%);

  --popover: hsl(30 20% 99%);
  --popover-foreground: hsl(210 18% 18%);

  --primary: hsl(18 84% 52%);
  --primary-foreground: hsl(0 0% 100%);

  --secondary: hsl(32 30% 92%);
  --secondary-foreground: hsl(210 18% 22%);

  --muted: hsl(32 25% 93%);
  --muted-foreground: hsl(210 10% 45%);

  --accent: hsl(186 55% 35%);
  --accent-foreground: hsl(0 0% 100%);

  --destructive: hsl(0 72% 55%);

  --border: hsl(210 20% 88%);
  --input: hsl(210 20% 88%);
  --ring: hsl(186 55% 35%);
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above
- [ ] All CSS variables copied exactly
- [ ] Mobile layout matches Section 4
- [ ] Desktop layout matches Section 5
- [ ] Hero element is prominent as described
- [ ] Colors create the mood described in Section 2
