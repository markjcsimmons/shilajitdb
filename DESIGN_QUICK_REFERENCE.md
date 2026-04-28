# ShilajitDB Design System — Quick Reference

**Fast lookup for common design patterns and color usage.**

---

## 🎨 Colors (Copy-Paste Ready)

### Backgrounds
```
#080B14  Page background (navy)
#0F1320  Cards, surface (lighter navy)
#171C2E  Hover state, elevated surface
#1F2540  Deep surface, nested
```

### Text
```
#FFFFFF  Primary text (white) — headlines, main content
#A0AACC  Secondary text (slate) — body copy, descriptions
#636A90  Muted text (indigo) — metadata, labels, timestamps
```

### Interactive
```
#3D7AFF  Cobalt accent (buttons, links, active states)
#6E9FFF  Cobalt bright (hover, focus)
#252A40  Borders (default)
#313760  Borders (strong, higher contrast)
```

### Semantic (Grades)
```
#22C55E  Ultra Premium (green)
#3B82F6  Premium (blue)
#EAB308  Average (yellow)
#EF4444  Poor (red)
```

---

## 📝 Typography

### Display Headings (h1)
```css
font-family: 'Playfair Display';
font-size: 48px;
font-weight: 700;
line-height: 1.2;
color: #FFFFFF;
```

### Subheadings (h2)
```css
font-family: 'Playfair Display';
font-size: 30px;
font-weight: 600;
line-height: 1.2;
color: #FFFFFF;
```

### Body Copy
```css
font-family: 'DM Sans';
font-size: 16px;
font-weight: 400;
line-height: 1.65;
color: #A0AACC;
```

### Labels (all-caps)
```css
font-family: 'DM Sans';
font-size: 12px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.15em;
color: #636A90;
```

### Data/Numbers (monospace)
```css
font-family: 'JetBrains Mono';
font-size: 14px;
font-weight: 500;
color: #FFFFFF;
```

---

## 🧩 Common Components

### Primary Button
```jsx
className="bg-[#3D7AFF] text-[#080B14] font-bold px-6 py-3 rounded-md hover:bg-[#6E9FFF] transition-colors"
```

### Secondary Button
```jsx
className="border border-[#313760] text-[#EEF0F8] px-6 py-3 rounded-md hover:bg-[#171C2E] transition-colors"
```

### Card
```jsx
className="bg-[#0F1320] border border-[#252A40] rounded-lg p-4 hover:bg-[#171C2E] shadow-[0_1px_3px_rgba(0,0,0,0.55)]"
```

### Filter Chip (Active)
```jsx
className="bg-[#3D7AFF] text-[#FFFFFF] px-3 py-1 rounded-full text-xs font-medium"
```

### Filter Chip (Inactive)
```jsx
className="border border-[#313760] text-[#8892B8] px-3 py-1 rounded-full text-xs hover:text-[#EEF0F8]"
```

### Badge (Grade)
```jsx
// Ultra Premium
className="bg-[#052010] text-[#22C55E] px-2 py-1 rounded text-xs font-semibold"

// Premium
className="bg-[#051428] text-[#3B82F6] px-2 py-1 rounded text-xs font-semibold"

// Average
className="bg-[#201800] text-[#EAB308] px-2 py-1 rounded text-xs font-semibold"

// Poor
className="bg-[#200505] text-[#EF4444] px-2 py-1 rounded text-xs font-semibold"
```

### Input Field
```jsx
className="bg-[#0F1320] border border-[#252A40] text-[#FFFFFF] rounded-md px-3 py-2 placeholder-[#636A90] focus:outline-none focus:ring-2 focus:ring-[#3D7AFF]"
```

---

## 📐 Spacing & Layout

```
4px   space-1   Minimal gaps
8px   space-2   Small gaps
12px  space-3   Compact spacing
16px  space-4   Standard padding
24px  space-6   Section spacing
32px  space-8   Block spacing
48px  space-12  Major sections
```

**Max width:** 1200px (6xl in Tailwind)  
**Padding (page):** 16px (px-4)  
**Card radius:** 8px  
**Button radius:** 6px  
**Pill radius:** 9999px  

---

## 🔄 States & Transitions

### Hover (Background)
- `#0F1320` → `#171C2E` (cards)
- `#171C2E` → `#1F2540` (elevated)
- Opacity +10% (text links)

### Focus (All Interactive)
```css
outline: 2px solid #3D7AFF;
outline-offset: 2px;
```

### Transitions
```css
transition: all 100ms ease;     /* default */
transition: background 150ms;   /* filter transitions */
```

---

## 📱 Responsive Breakpoints

| Name | Size | Usage |
|------|------|-------|
| mobile | < 640px | Default |
| sm | 640px | Tablets |
| md | 768px | Small desktop |
| lg | 1024px | Desktop |
| xl | 1280px | Max width container |

---

## 🚀 Copy-Paste Templates

### Hero Section
```jsx
<div className="-mx-4 border-b border-[#252A40] px-4 py-16 md:py-20">
  <div className="max-w-6xl mx-auto">
    <h1 className="font-serif text-4xl md:text-6xl font-bold text-[#FFFFFF] mb-4">
      Headline
    </h1>
    <p className="text-base leading-relaxed text-[#A0AACC] mb-8 max-w-lg">
      Supporting text
    </p>
  </div>
</div>
```

### 3-Column Grid
```jsx
<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
  {items.map(item => (
    <div key={item.id} className="rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:bg-[#171C2E]">
      {/* content */}
    </div>
  ))}
</div>
```

### Stats Bar
```jsx
<div className="grid grid-cols-2 sm:grid-cols-4 border border-[#252A40] rounded-lg overflow-hidden">
  {stats.map(stat => (
    <div key={stat.label} className="bg-[#0F1320] border-r border-[#252A40] p-5 last:border-r-0">
      <div className="font-mono text-2xl font-semibold text-[#FFFFFF]">
        {stat.value}
      </div>
      <div className="text-xs text-[#636A90] mt-1">
        {stat.label}
      </div>
    </div>
  ))}
</div>
```

---

## ✅ Checklist for New Components

- [ ] Background: Use appropriate surface color (#0F1320, #171C2E, or #1F2540)
- [ ] Text: Primary #FFFFFF, secondary #A0AACC, muted #636A90
- [ ] Borders: 1px #252A40 (or #313760 for strong)
- [ ] Focus ring: 2px #3D7AFF with 2px offset
- [ ] Hover: +1 surface level (e.g., #0F1320 → #171C2E)
- [ ] Rounded: 8px for cards, 6px for buttons, 4px for badges
- [ ] Transition: 100ms ease by default
- [ ] Font: Playfair (display), DM Sans (body), JetBrains Mono (data)
- [ ] Contrast: Verify WCAG AA (7:1 for normal text on #080B14)

---

## 📚 Full Reference

For complete specifications, see:
- `DESIGN_SYSTEM.md` — Full design system specification
- `DESIGN_IMPLEMENTATION_CHECKLIST.md` — Implementation checklist
- `app/design-tokens.css` — CSS variables file (reference)
