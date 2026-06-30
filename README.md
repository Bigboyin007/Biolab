# BioChar Lab - Environmental Engineering Research Platform

A modern, dark-themed web application for environmental engineering research data analysis. Built specifically for biochar characterization and water treatment material analysis.

## Features

### XRD Analysis
- Upload XRD data files (.txt, .csv, .xy, .xrdml)
- Automatic peak detection with customizable threshold
- Smoothing and noise reduction
- d-spacing calculation using Bragg's law
- Export charts as PNG and data as CSV
- Sample data: Tea Branch Biochar, Activated Carbon, Fe-Modified Biochar

### FTIR Analysis
- Upload FTIR spectra (.txt, .csv, .spc, .jdx)
- Automatic functional group identification
- Transmittance/Absorbance mode toggle
- Pre-configured biochar functional group database
- Export charts as PNG

### BET Analysis
- Upload N₂ adsorption/desorption isotherm data
- Automatic isotherm type classification (Type I-IV)
- BET surface area calculation
- Pore volume and pore size estimation
- BET plot (linear region) visualization
- Export charts as PNG

### Research Projects
- Showcase current research projects
- Progress tracking
- Characterization method badges

## File Structure

```
├── index.html          # Main page
├── css/
│   └── style.css       # All styles (dark theme)
├── js/
│   ├── main.js         # Navigation, utilities, contact form
│   ├── xrd.js          # XRD analysis module
│   ├── ftir.js         # FTIR analysis module
│   └── bet.js          # BET analysis module
├── data/               # Sample data files (optional)
└── assets/             # Images and other assets
```

## How to Use

### 1. Local Use
Simply open `index.html` in any modern browser. No server required.

### 2. GitHub Pages Deployment
1. Create a new repository on GitHub
2. Upload all files (maintain folder structure)
3. Go to **Settings → Pages**
4. Select **Deploy from a branch**
5. Choose **main** branch and **/(root)** folder
6. Click **Save**
7. Your site will be live at `https://yourusername.github.io/repository-name/`

### Data Format

#### XRD Data
```
2theta, Intensity
10.0, 245
10.05, 248
10.10, 252
...
```

#### FTIR Data
```
Wavenumber, Transmittance
4000, 85.2
3998, 84.8
3996, 85.0
...
```

#### BET Data
```
P/P0, Adsorption, Desorption
0.00, 0.0, 0.0
0.01, 12.5, 12.3
0.02, 25.0, 24.8
...
```

## Technologies
- HTML5
- CSS3 (Custom properties, Grid, Flexbox)
- Vanilla JavaScript (no frameworks)
- Chart.js for data visualization
- Font Awesome for icons

## License
MIT License - Open source for research use.

---
Built for environmental engineering research. Open source.
