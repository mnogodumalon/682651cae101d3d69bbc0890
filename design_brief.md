# Design Brief: Schichtplaner Dashboard

## 1. App Analysis

### What This App Does
Dieses System verwaltet Schichten fuer Unternehmen: Mitarbeitende werden bestimmten Schichtarten und Firmen an einem Datum zugewiesen. Die Nutzer muessen schnell sehen, ob heute und in den naechsten Tagen alles besetzt ist, und neue Schichten mit wenigen Klicks eintragen.

### Who Uses This
Teamleitungen und Disponenten, die taeglich Schichten planen und kurzfristig anpassen. Sie brauchen eine klare Tagesansicht, eine Vorschau auf die naechsten Tage und schnelle Eingabe neuer Zuweisungen.

### The ONE Thing Users Care About Most
Ob die Schichten heute (und in den naechsten Tagen) abgedeckt sind und wer als naechstes arbeitet.

### Primary Actions (IMPORTANT!)
1. Schicht zuweisen -> Primary Action Button
2. Mitarbeiter pflegen (selten)
3. Schichtarten definieren (selten)

---

## 2. What Makes This Design Distinctive

### Visual Identity
Ein warmes, papierartiges Grundlayout mit einem kuehlen Petrol als Primarakzent vermittelt Ruhe und Planungssicherheit. Ein einzelner, leuchtender Amber-Akzent markiert Zeitfenster und hebt die aktuelle Tageslast hervor, ohne laut zu wirken.

### Layout Strategy
Die Seite ist asymmetrisch: Links dominiert ein grosser Hero-Block fuer die heutige Auslastung, rechts sind die naechsten Schichten als fokussierte Liste. Das erzeugt einen klaren Blickfluss von "Heute" zu "Naechste". Sekundaere KPIs sitzen als schmaler, ruhiger Statistikstreifen darunter, damit sie sichtbar bleiben, aber nicht konkurrieren. Visuelles Interesse entsteht durch die Groessenvariation (Hero gross, KPIs klein), eine horizontale Wochenleiste im Hero und bewusst wechselnde Abstaende zwischen den Bereichen.

### Unique Element
Eine "Week Pulse"-Leiste im Hero: sieben schmale Tageskacheln mit Mini-Zahlen. Der heutige Tag hat eine kuerzere, farbige Unterstreichung in Amber, sodass der Blick sofort auf die aktuelle Auslastung springt.

---

## 3. Theme & Colors

### Font
- **Family:** Space Grotesk
- **URL:** `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap`
- **Why this font:** Modern, technisch klar, aber mit genug Charakter fuer ein professionelles Planungstool.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(36 33% 96%)` | `--background` |
| Main text | `hsl(210 18% 12%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(210 18% 12%)` | `--card-foreground` |
| Borders | `hsl(24 12% 86%)` | `--border` |
| Primary action | `hsl(192 48% 32%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(27 78% 58%)` | `--accent` |
| Muted background | `hsl(34 26% 93%)` | `--muted` |
| Muted text | `hsl(210 10% 45%)` | `--muted-foreground` |
| Success/positive | `hsl(150 45% 38%)` | (component use) |
| Error/negative | `hsl(0 70% 50%)` | `--destructive` |

### Why These Colors
Der warme Hintergrund nimmt die Hektik aus der Planung. Petrol wirkt verlaesslich und professionell fuer Primaraktionen. Amber dient als einziger heller Akzent fuer den Fokus auf "Heute" und Zeitpunkte.

### Background Treatment
Ein sanfter Verlauf von `--background` nach `--muted` von oben nach unten, plus zwei sehr weiche, unscharfe Kreise in `--accent` und `--primary` im Hintergrund (niedrige Deckkraft), um Tiefe zu erzeugen.

---

## 4. Mobile Layout (Phone)

### Layout Approach
Mobile zeigt zuerst die heutige Auslastung als Hero, darunter die Week Pulse-Leiste als horizontale Scrollreihe. Die naechsten Schichten folgen unmittelbar, damit der Nutzer mit dem Daumen schnell reagieren kann.

### What Users See (Top to Bottom)

**Header:**
Titel "Schichtplaner" links, kleines Datum rechts (heutiges Datum). Kein weiterer Text.

**Hero Section (The FIRST thing users see):**
Grosses Card-Panel mit dem KPI "Schichten heute" (48px Zahl), darunter eine kurze Zeile "Naechste Schicht: <Uhrzeit>". Darunter die Week Pulse-Leiste (7 kleine Kacheln, horizontal scrollbar). Der Hero nimmt ca. 55-60% der ersten Ansicht ein.

**Section 2: Naechste Schichten**
Liste der naechsten 5 Zuweisungen als kompakte Karten: Name, Schichtart, Unternehmen, Datum + Zeit. Jede Karte hat eine kleine farbige Zeitmarke links.

**Section 3: Schichten in den naechsten 14 Tagen**
Ein schlanker Area-Chart (ca. 220px hoch) mit Tageszaehlern.

**Section 4: Schnellzahlen**
Drei kleine KPI-Karten nebeneinander (horizontal scrollbar), fuer Mitarbeiter, Unternehmen, Schichtarten.

**Section 5: Ohne Zuweisung (7 Tage)**
Liste der Mitarbeiter ohne Schicht in den naechsten 7 Tagen, als einfache Zeilenkarten.

**Bottom Navigation / Action:**
Fixed Primary Button am unteren Rand: "Schicht zuweisen".

### Mobile-Specific Adaptations
Chart-Hoehe reduziert, Listen kompakter. Week Pulse wird horizontal gescrollt statt in zwei Reihen.

### Touch Targets
Buttons mindestens 44px hoch, Listeneintraege vollflaechig anklickbar, aber nur visuelles Feedback (keine Drill-Downs).

### Interactive Elements (if applicable)
Nur der Primary Action Button oeffnet ein Formular. Listen zeigen kein Detail-Overlay.

---

## 5. Desktop Layout

### Overall Structure
Zwei-Spalten-Layout: links 2/3 Breite, rechts 1/3. Der Blick geht zuerst zum Hero links oben, dann zur rechten "Naechste Schichten"-Liste, danach zum Chart unter dem Hero.

### Section Layout
- **Top area:** Header mit Titel, Datum und Primary Action Button rechts.
- **Left column:** Hero-Card oben, darunter der 14-Tage-Chart.
- **Right column:** Naechste Schichten (Listenkarten), darunter "Ohne Zuweisung".
- **Bottom strip:** Drei kleine KPI-Karten nebeneinander ueber die volle Breite.

### What Appears on Hover
Karten heben sich leicht an (subtile Schatten) und bekommen eine etwas dunklere Umrandung.

### Clickable/Interactive Areas (if applicable)
Nur der Primary Action Button und das Formular sind interaktiv. Listen sind nicht klickbar.

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Schichten heute
- **Data source:** Schichteinteilung
- **Calculation:** Count aller Zuweisungen mit Datum = heute
- **Display:** Sehr grosse Zahl (48px), darunter eine kleine Zeile mit naechster Schichtzeit. Week Pulse-Leiste darunter.
- **Context shown:** Mini-Text "Naechste Schicht: HH:MM" und Week Pulse (naechste 7 Tage).
- **Why this is the hero:** Der Dienstplaner muss sofort sehen, wie voll der heutige Tag ist.

### Secondary KPIs

**Mitarbeiter gesamt**
- Source: Mitarbeiterverwaltung
- Calculation: Count
- Format: number
- Display: Kleine Card

**Unternehmen gesamt**
- Source: Unternehmensverwaltung
- Calculation: Count
- Format: number
- Display: Kleine Card

**Schichtarten gesamt**
- Source: Schichtartenverwaltung
- Calculation: Count
- Format: number
- Display: Kleine Card

### Chart (if applicable)
- **Type:** Area chart (Trend wirkt weicher und passt zur Planung)
- **Title:** Schichten in den naechsten 14 Tagen
- **What question it answers:** Wann ist die naechste starke Auslastung?
- **Data source:** Schichteinteilung
- **X-axis:** Datum (dd.MM)
- **Y-axis:** Anzahl Schichten
- **Mobile simplification:** Weniger Achsenbeschriftungen, Hoehe reduziert.

### Lists/Tables (if applicable)

**Naechste Schichten**
- Purpose: Sofort sehen, wer als naechstes arbeitet
- Source: Schichteinteilung + Mitarbeiterverwaltung + Unternehmensverwaltung + Schichtartenverwaltung
- Fields shown: Mitarbeitername, Schichtart, Unternehmen, Datum, Beginn-Ende
- Mobile style: Kartenliste
- Desktop style: Kartenliste
- Sort: Nach Datum + Beginn
- Limit: 5

**Ohne Zuweisung (7 Tage)**
- Purpose: Luecken in der Planung erkennen
- Source: Mitarbeiterverwaltung + Schichteinteilung
- Fields shown: Mitarbeitername, Kontakt (Email oder Telefon, falls vorhanden)
- Mobile style: Einfache Zeilenkarten
- Desktop style: Einfache Zeilenkarten
- Sort: Alphabetisch
- Limit: 6

### Primary Action Button (REQUIRED!)

- **Label:** Schicht zuweisen
- **Action:** add_record
- **Target app:** Schichteinteilung
- **What data:** Datum, Beginn, Ende, Mitarbeiter, Unternehmen, Schichtart, Notiz
- **Mobile position:** bottom_fixed
- **Desktop position:** header
- **Why this action:** Neue Zuweisungen sind die haeufigste Aufgabe im Schichtplan.

---

## 7. Visual Details

### Border Radius
rounded (12px)

### Shadows
subtle, weiche Schatten mit geringer Deckkraft

### Spacing
spacious - klare Abstaende zwischen Hero, Listen und KPIs

### Animations
- **Page load:** fade + leichtes Stagger fuer Sektionen
- **Hover effects:** leichte Schattenverstaerkung
- **Tap feedback:** leichte Skalierung (0.98) bei Buttons

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
:root {
  --background: hsl(36 33% 96%);
  --foreground: hsl(210 18% 12%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(210 18% 12%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(210 18% 12%);
  --primary: hsl(192 48% 32%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(36 20% 92%);
  --secondary-foreground: hsl(210 18% 18%);
  --muted: hsl(34 26% 93%);
  --muted-foreground: hsl(210 10% 45%);
  --accent: hsl(27 78% 58%);
  --accent-foreground: hsl(210 18% 12%);
  --destructive: hsl(0 70% 50%);
  --border: hsl(24 12% 86%);
  --input: hsl(24 12% 86%);
  --ring: hsl(192 48% 32%);
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
