# BioChar Lab - OriginPro 2024 Style

A professional dark-themed research platform inspired by OriginPro 2024 interface design.

## Features
- **OriginPro 2024 Dark Theme** - VS Code-like dark UI with subtle background image
- **Chinese/English Language Toggle** - Switch between languages on any page
- **Separate Pages** - XRD, FTIR, BET each have dedicated analysis pages
- **Multiple Export Options** - PNG 300/600/1000 DPI, CSV, TXT, Full Report
- **Comprehensive Metadata** - Auto-display file info, statistics, parameters

## Color Scheme (OriginPro Style)
- Background: #1e1e1e (dark gray)
- Panel: #252526
- Accent: #007acc (blue)
- Success: #4ec9b0 (teal)
- Warning: #ce9178 (orange)
- Text: #cccccc

## Structure
```
biochar-lab/
├── index.html
├── css/style.css
├── js/
│   ├── lang.js          # Language system (EN/ZH)
│   ├── main.js          # Shared utilities
│   ├── xrd.js           # XRD analysis
│   ├── ftir.js          # FTIR analysis
│   └── bet.js           # BET analysis
├── pages/
│   ├── xrd.html
│   ├── ftir.html
│   └── bet.html
└── assets/
    └── origin-bg.png    # OriginPro background image
```

## Deploy to GitHub Pages
1. Create new repo on GitHub
2. Upload ALL files maintaining folder structure
3. Settings → Pages → Deploy from branch → main → Save
4. Visit: `https://yourusername.github.io/biochar-lab/`
