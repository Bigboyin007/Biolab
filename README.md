# Bio Lab - Environmental Engineering Research Platform

A professional dark-themed research platform with OriginPro-inspired design.

## Features
- **OriginPro 2024 Dark Theme** - VS Code-like dark UI with subtle background
- **Chinese/English Language Toggle** - Only on main page (saves preference across pages)
- **White Background Export** - PNG export with white background and no grid lines for publications
- **Separate Pages** - XRD, FTIR, BET each have dedicated analysis pages
- **Multiple Export Options** - PNG 300/600/1000 DPI, White BG, CSV, TXT, Full Report

## Website Name: Bio Lab

## Export Options
| Option | Description |
|--------|-------------|
| PNG (300 DPI) | Dark theme, with grid |
| PNG (600 DPI) | Dark theme, with grid |
| PNG (1000 DPI) | Dark theme, with grid |
| PNG (White BG, No Grid) | White background, no grid, dark text - for publications |
| Data (CSV) | Raw data export |
| Data (TXT) | Tab-delimited export |
| Full Report | Complete analysis summary |

## Structure
```
bio-lab/
├── index.html          # Home page (has language toggle)
├── css/style.css       # OriginPro dark theme
├── js/
│   ├── lang.js         # Language system (EN/ZH)
│   ├── main.js         # Shared utilities + white BG export
│   ├── xrd.js          # XRD analysis
│   ├── ftir.js         # FTIR analysis
│   └── bet.js          # BET analysis
├── pages/
│   ├── xrd.html        # XRD page (no lang toggle)
│   ├── ftir.html       # FTIR page (no lang toggle)
│   └── bet.html        # BET page (no lang toggle)
└── assets/
    └── origin-bg.png    # Background image
```

## Deploy to GitHub Pages
1. Create new repo on GitHub
2. Upload ALL files maintaining folder structure
3. Settings → Pages → Deploy from branch → main → Save
4. Visit: `https://yourusername.github.io/bio-lab/`
