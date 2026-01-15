# Design Brief: Schichtplaner Dashboard

## 1. App Analysis

### What This App Does
Schichtplaner ist ein Living-Apps-Backend, mit dem Personalverantwortliche ihre Mitarbeiter, Schichtarten und Schichteinteilungen über mehrere Unternehmens­standorte hinweg organisieren. Das Dashboard dient als **Cockpit**, das den aktuellen Einsatzplan auf einen Blick sichtbar macht und tägliche Planungsaufgaben beschleunigt.

### Who Uses This
Disponent:innen / Filial­leiter:innen ohne IT-Know-how. Sie öffnen das Dashboard morgens auf dem Tablet oder Laptop, um Schichten zu prüfen, spontan anzupassen und neue Schichten zu erstellen.

### The ONE Thing Users Care About Most
„Wie viele Schichten stehen **heute** an und sind alle besetzt?“  
Deshalb wird **Schichten heute** als hero-KPI prominent dargestellt.

### Primary Actions (IMPORTANT!)
1. **Schicht hinzufügen** → Primary Action Button (öffnet Formular zum Anlegen eines Schichteinteilung-Datensatzes)
2. Mitarbeiterdetails ansehen
3. Offene Schichten nachbesetzen

---

## 2. What Makes This Design Distinctive

### Visual Identity
Ein warmer Off-White-Hintergrund mit **Terracotta-Akzent** vermittelt ein menschliches, nahbares Gefühl – passend zur Arbeit mit Menschen & Schichten. Die kräftige Akzentfarbe erscheint ausschließlich auf primären Interaktionen, sodass der Blick sofort versteht, wo gehandelt werden kann.

### Layout Strategy
Asymmetrischer Aufbau:  
– Links oben der **Hero-KPI** (Schichten heute) dominiert → 48 px Zahl, 60 % Viewport-Breite.  
– Rechts daneben eine vertikale Spalte mit drei Secondary-KPIs in gleich hohen Cards.  
– Darunter ein breites Balkendiagramm (Schichten 7 Tage).  
– Ganz unten eine Liste „Nächste Schichten“.  
Größen- und Weißraum-Variation erzeugen Spannung, ohne das Layout zu überladen.

### Unique Element
Der Hero-KPI ist von einem **feinen progress-Ring** (8 px, Rundkappen) umgeben, der den Fortschritt zu „Schichten diese Woche“ live darstellt – ein Game-like Feedback, das im Shift-Management selten zu sehen ist.

---

## 3. Theme & Colors

### Font
- **Family:** Space Grotesk  
- **URL:** `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;700&display=swap`  
- **Why this font:** Klare, technisch-moderne Grotesk mit eigenem Charakter – perfekt für numerische KPIs und Tabellendaten.

### Color Palette
Alle Farben als komplette hsl() Funktionen:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(30 33% 97%)` | `--background` |
| Main text | `hsl(24 15% 15%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(24 15% 15%)` | `--card-foreground` |
| Borders | `hsl(24 20% 90%)` | `--border` |
| Primary action | `hsl(14 74% 55%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(36 100% 50%)` | `--accent` |
| Muted background | `hsl(30 33% 95%)` | `--muted` |
| Muted text | `hsl(24 8% 40%)` | `--muted-foreground` |
| Success/positive | `hsl(142 70% 45%)` | (component use) |
| Error/negative | `hsl(0 70% 52%)` | `--destructive` |

### Why These Colors
Terracotta (Primary) zieht die Aufmerksamkeit auf Aktionen, während das sanft-warme Off-White Ruhe vermittelt. Das Ergebnis ist freundlich, aber klar fokussiert.

### Background Treatment
Leicht texturierter Offset-White (2 % Rauschen über CSS-Noise) verhindert sterile Leere und unterstreicht die menschliche Komponente.

---

## 4. Mobile Layout (Phone)

### Layout Approach
Vertikale Ein-Spalten-Abfolge mit klarer Hierarchie. Der Hero-KPI belegt 60 % der ersten Viewport-Höhe; Secondary-KPIs erscheinen in horizontal scrollbarer Card-Leiste darunter.

### What Users See (Top to Bottom)

**Header:** Titel „Schichtplan“ links, rechts kleines „+“ Icon (fallback Primary Action)  

**Hero Section (The FIRST thing users see):**  
– Große Zahl „Schichten heute“ (48 px, weight 700)  
– Progress-Ring um die Zahl (8 px stroke)  
– Untertitel „heute geplant“  

**Section 2: Sekundäre KPIs**  
Horizontal scrollbare Cards (Mitarbeiter heute, Offene Schichten, Schichten Woche)

**Section 3: Schichten 7 Tage**  
Balkendiagramm, volle Breite

**Section 4: Nächste Schichten**  
Liste der nächsten 5 Schichten (Datum, Zeit, Mitarbeiter, Schichtart, Unternehmen)

**Bottom Navigation / Action:**  
Fixierter runder FAB rechts unten (56 px) mit „+“-Symbol → öffnet Formular „Schicht hinzufügen“

### Mobile-Specific Adaptations
Sekundär-KPIs als horizontale Scroll-Cards, um Breite zu sparen. Liste erhält Touch-freundliche 56 px Zeilenhöhe.

### Touch Targets
Alle Buttons ≥ 44 × 44 px.

### Interactive Elements (if applicable)
Tap auf Listen-Eintrag öffnet Living-Apps Datensatz in neuem Tab.

---

## 5. Desktop Layout

### Overall Structure
Zwei Spalten:  
– **Linke 70 %**: Hero-KPI oben, darunter Balkendiagramm, dann Liste  
– **Rechte 30 %**: Vertikale Stack der drei Secondary-KPIs  
Augenfluss: Hero → Secondary-KPIs → Chart → Liste.

### Section Layout
• Top area (linke Spalte): Hero-KPI (60 % Breite, 180 px Höhe)  
• Right column: Secondary-KPIs (je 100 % Breite, 120 px Höhe, 12 px Gap)  
• Chart: 100 % linke Spalte, 260 px Höhe  
• Liste: volle linke Spalte unter Chart

### What Appears on Hover
Listen­zeile erhöht Schatten + zeigt kleinen „Externen Link“-Icon.

### Clickable/Interactive Areas (if applicable)
• Secondary-KPI „Offene Schichten“ klickbar → Filter Liste auf offene Schichten.  
• FAB / Primary Action oben rechts im Header.

---

## 6. Components

### Hero KPI
- **Title:** Schichten heute  
- **Data source:** Schichteinteilung  
- **Calculation:** `count(records where zuweisung_datum === today)`  
- **Display:** 48 px bold Zahl, progress-Ring drumherum  
- **Context shown:** Innenliegende kleine Beschriftung „von Woche“ zeigt Anteil der Wochen-Schichten (Schichten heute ÷ Schichten Woche).  
- **Why this is the hero:** Planung startet immer tagesaktuell – Benutzer wollen sofort sehen, wie viel heute ansteht.

### Secondary KPIs

**Mitarbeiter heute**  
- Source: Schichteinteilung + Mitarbeiterverwaltung  
- Calculation: `unique count(zuweisung_mitarbeiter) where zuweisung_datum === today`  
- Format: number  
- Display: Card, 28 px Zahl, Icon „users“

**Offene Schichten**  
- Source: Schichteinteilung  
- Calculation: `count(records with zuweisung_mitarbeiter == null and date ≤ today+7)`  
- Format: number  
- Display: Card, 28 px Zahl, Icon „alert-triangle“ (border accent)  

**Schichten Woche**  
- Source: Schichteinteilung  
- Calculation: `count(records where date in current_week)`  
- Format: number  
- Display: Card, 28 px Zahl, Icon „calendar“

### Chart
- **Type:** Bar – Balken sind für absolute Mengen intuitiver als Linien  
- **Title:** Schichten – nächste 7 Tage  
- **What question it answers:** „Wie verteilt sich die Arbeitslast in den kommenden Tagen?“  
- **Data source:** Schichteinteilung  
- **X-axis:** Datum (YYYY-MM-DD)  
- **Y-axis:** Anzahl Schichten  
- **Mobile simplification:** Scroll-snap nach links/rechts für 2 Tage-Chunks

### Lists/Tables

**Nächste Schichten**  
- Purpose: Schneller Überblick + Zugriff  
- Source: Schichteinteilung (+ Lookups)  
- Fields shown: Datum, Start-/Ende, Mitarbeitername, Schichtart, Unternehmen  
- Mobile style: Card-Rows  
- Desktop style: Tabelle  
- Sort: ascending by zuweisung_datum, zuweisung_beginn  
- Limit: 5 Einträge

### Primary Action Button (REQUIRED!)

- **Label:** „Schicht hinzufügen“  
- **Action:** add_record  
- **Target app:** Schichteinteilung  
- **What data:** zuweisung_datum, zuweisung_schichtart, zuweisung_mitarbeiter, zuweisung_unternehmen, zuweisung_beginn, zuweisung_ende, zuweisung_notiz  
- **Mobile position:** bottom_fixed (FAB)  
- **Desktop position:** header (Button rechts)  
- **Why this action:** Neue Schichten einzuplanen ist die häufigste Tätigkeit im Tagesgeschäft.

---

## 7. Visual Details

### Border Radius
rounded (8 px)

### Shadows
subtle (0 px 4 px 6 px - 3 px rgba(0,0,0,0.04))

### Spacing
normal – 16 px base grid

### Animations
- **Page load:** fade  
- **Hover effects:** slight translate-y -2 px + stronger shadow on Cards  
- **Tap feedback:** opacity 90 % on Buttons

---

## 8. CSS Variables (Copy Exactly!)

```css
:root {
  --background: hsl(30 33% 97%);
  --foreground: hsl(24 15% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(24 15% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(24 15% 15%);
  --primary: hsl(14 74% 55%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(30 33% 95%);
  --secondary-foreground: hsl(24 15% 15%);
  --muted: hsl(30 33% 95%);
  --muted-foreground: hsl(24 8% 40%);
  --accent: hsl(36 100% 50%);
  --accent-foreground: hsl(24 15% 15%);
  --destructive: hsl(0 70% 52%);
  --border: hsl(24 20% 90%);
  --input: hsl(24 20% 90%);
  --ring: hsl(14 74% 55%);
}
```

---

## 9. Implementation Checklist
- [ ] Font loaded from URL above
- [ ] All CSS variables copied exactly
- [ ] Mobile layout matches Section 4
- [ ] Desktop layout matches Section 5
- [ ] Hero element is prominent as described
- [ ] Colors create the mood described in Section 2

---

## Quality Checklist
- [x] One clear hero element
- [x] Distinctive terracotta accent
- [x] Mobile ≠ squeezed desktop
- [x] Memorable progress-Ring detail
- [x] Primary action defined and justified

