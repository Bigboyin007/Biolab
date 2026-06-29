# Bio Lab - Multi-Page Research Platform

A modern, colorful web application for environmental engineering research with separate pages for each analysis tool.



## Features

### XRD Analysis Page
- Upload .txt, .csv, .xy, .xrdml files
- Peak detection with customizable threshold, smoothing, width
- **Detailed peak table**: 2θ, Intensity, Relative %, FWHM, d-spacing, Area, Crystallite Size
- **Metadata panel**: filename, points, range, step size, max intensity, mean, std dev
- **d-spacing calculation** with Bragg's law
- **Crystallinity index** and average peak area
- **Sample data**: Tea Branch Biochar, KOH-Activated, Fe-Modified, ZnO, TiO₂

### FTIR Analysis Page
- Upload .txt, .csv, .spc, .jdx, .dpt files
- **Functional group identification** with 11 pre-configured groups
- **Spectrum statistics**: range, resolution, min/max T, detected bands, SNR
- **Baseline correction**: None, Linear, Polynomial, Rubber Band
- **Smoothing**: Savitzky-Golay filter
- **Normalization**: Max, Area, Min-Max
- **Sample data**: Raw Biochar, KOH-Activated, Fe-Modified, Chitosan-Biochar

### BET Analysis Page
- Upload .txt, .csv, .xls, .xlsx files
- **BET calculator** with customizable parameters
- **Results**: Surface Area, Pore Volume, Micropore Volume, Mesopore Volume, Pore Size, R², Vm, C
- **Isotherm classification**: Type I-VI with auto-detection
- **Detailed data table**: all points with hysteresis and BET range flag
- **Sample data**: Biochar, Activated Carbon, Mesoporous Silica, Macroporous Carbon



