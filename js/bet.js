// ===== BET ANALYSIS MODULE =====
let betChart = null;
let betData = { p_rel: [], adsorption: [], desorption: [] };
let betPlotMode = 'isotherm'; // 'isotherm' or 'bett'

// BET parameters
let betResults = {
    surfaceArea: null,
    poreVolume: null,
    poreSize: null,
    r2: null
};

document.addEventListener('DOMContentLoaded', () => {
    const betInput = document.getElementById('betFileInput');
    if (betInput) {
        betInput.addEventListener('change', handleBETUpload);
    }
});

function handleBETUpload(e) {
    const files = e.target.files;
    if (!files.length) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
        const content = event.target.result;
        parseBETData(content, file.name);
    };

    reader.readAsText(file);
}

function parseBETData(content, filename) {
    const lines = content.trim().split('\n');
    const p_rel = [];
    const adsorption = [];
    const desorption = [];

    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#') || line.startsWith('%')) continue;

        let parts = line.split(',');
        if (parts.length >= 2) {
            const p = parseFloat(parts[0]);
            const a = parseFloat(parts[1]);
            if (!isNaN(p) && !isNaN(a)) {
                p_rel.push(p);
                adsorption.push(a);
                if (parts.length >= 3) {
                    const d = parseFloat(parts[2]);
                    if (!isNaN(d)) desorption.push(d);
                }
                continue;
            }
        }

        parts = line.split(/\t+/);
        if (parts.length >= 2) {
            const p = parseFloat(parts[0]);
            const a = parseFloat(parts[1]);
            if (!isNaN(p) && !isNaN(a)) {
                p_rel.push(p);
                adsorption.push(a);
                if (parts.length >= 3) {
                    const d = parseFloat(parts[2]);
                    if (!isNaN(d)) desorption.push(d);
                }
            }
        }
    }

    if (p_rel.length === 0) {
        showNotification('Could not parse BET data', 'error');
        return;
    }

    betData = { p_rel, adsorption, desorption };
    betPlotMode = 'isotherm';
    plotBETChart(filename);
    classifyIsotherm();
    showNotification(`Loaded ${p_rel.length} data points from ${filename}`);
}

function plotBETChart(title = 'N₂ Adsorption/Desorption Isotherm') {
    const ctx = document.getElementById('betChart').getContext('2d');

    if (betChart) betChart.destroy();

    document.getElementById('betChartTitle').textContent = title;

    const datasets = [{
        label: 'Adsorption',
        data: betData.adsorption,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.1
    }];

    if (betData.desorption.length > 0) {
        datasets.push({
            label: 'Desorption',
            data: betData.desorption,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
            fill: false,
            tension: 0.1,
            borderDash: [5, 5]
        });
    }

    betChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: betData.p_rel.map(p => p.toFixed(3)),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    labels: { color: '#94a3b8' }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: '#334155',
                    borderWidth: 1,
                    callbacks: {
                        title: (items) => `P/P₀ = ${items[0].label}`,
                        label: (item) => `${item.dataset.label}: ${item.raw.toFixed(2)} cm³/g STP`
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Relative Pressure (P/P₀)',
                        color: '#64748b',
                        font: { size: 13, weight: 600 }
                    },
                    grid: { color: '#1e293b' }
                },
                y: {
                    title: {
                        display: true,
                        text: 'N₂ Adsorbed (cm³/g STP)',
                        color: '#64748b',
                        font: { size: 13, weight: 600 }
                    },
                    grid: { color: '#1e293b' }
                }
            }
        }
    });

    const info = betData.desorption.length > 0 
        ? `${betData.p_rel.length} points | Adsorption + Desorption`
        : `${betData.p_rel.length} points | Adsorption only`;
    document.getElementById('betChartInfo').innerHTML = 
        `<span><i class="fas fa-check-circle" style="color: #10b981"></i> ${info}</span>`;
}

function classifyIsotherm() {
    const types = document.querySelectorAll('.iso-type');
    types.forEach(t => t.classList.remove('active'));

    if (betData.p_rel.length < 10) return;

    const maxAds = Math.max(...betData.adsorption);
    const minAds = Math.min(...betData.adsorption);
    const range = maxAds - minAds;

    // Check for hysteresis (desorption different from adsorption)
    const hasHysteresis = betData.desorption.length > 0 && 
        betData.desorption.some((d, i) => Math.abs(d - betData.adsorption[i]) > range * 0.05);

    // Check plateau at high P/P0
    const lastPoints = betData.adsorption.slice(-5);
    const avgLast = lastPoints.reduce((a,b) => a+b, 0) / lastPoints.length;
    const hasPlateau = lastPoints.every(v => Math.abs(v - avgLast) < range * 0.1);

    // Check steep rise at low P/P0 (micropore filling)
    const lowP = betData.adsorption.filter((_, i) => betData.p_rel[i] < 0.1);
    const steepLowP = lowP.length > 0 && lowP[lowP.length - 1] > maxAds * 0.3;

    let type = '';
    let typeId = '';

    if (steepLowP && hasPlateau && !hasHysteresis) {
        type = 'Type I - Microporous material (Langmuir type)';
        typeId = 'isoType1';
    } else if (!steepLowP && !hasHysteresis) {
        type = 'Type II - Non-porous or macroporous material';
        typeId = 'isoType2';
    } else if (!steepLowP && hasHysteresis) {
        type = 'Type IV - Mesoporous material with hysteresis';
        typeId = 'isoType4';
    } else if (steepLowP && hasHysteresis) {
        type = 'Type IV - Mesoporous with some microporosity';
        typeId = 'isoType4';
    } else {
        type = 'Type II - Typical for non-porous/macroporous materials';
        typeId = 'isoType2';
    }

    document.getElementById('isoClassification').innerHTML = 
        `<span style="color: var(--primary); font-weight: 600;"><i class="fas fa-check-circle"></i> ${type}</span>`;

    if (typeId) {
        document.getElementById(typeId).classList.add('active');
    }
}

function calculateBET() {
    if (!betData.p_rel.length) {
        showNotification('Please upload BET data first', 'error');
        return;
    }

    const crossSection = parseFloat(document.getElementById('crossSection').value) || 16.2;
    const molWeight = parseFloat(document.getElementById('molWeight').value) || 28.0134;
    const stpCondition = parseFloat(document.getElementById('stpCondition').value) || 22414;

    // BET linear region: typically 0.05 < P/P0 < 0.35
    const betRegion = [];
    for (let i = 0; i < betData.p_rel.length; i++) {
        if (betData.p_rel[i] > 0.05 && betData.p_rel[i] < 0.35) {
            betRegion.push({
                p: betData.p_rel[i],
                v: betData.adsorption[i]
            });
        }
    }

    if (betRegion.length < 3) {
        showNotification('Not enough data points in BET region (0.05-0.35 P/P0)', 'error');
        return;
    }

    // Linear regression: 1/[V(P0/P - 1)] vs P/P0
    const x = [];
    const y = [];

    betRegion.forEach(pt => {
        if (pt.v > 0 && pt.p > 0 && pt.p < 1) {
            x.push(pt.p);
            y.push(1 / (pt.v * (1/pt.p - 1)));
        }
    });

    if (x.length < 3) {
        showNotification('Insufficient data for BET calculation', 'error');
        return;
    }

    // Linear regression
    const n = x.length;
    const sumX = x.reduce((a,b) => a+b, 0);
    const sumY = y.reduce((a,b) => a+b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R²
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - sumY/n, 2), 0);
    const r2 = 1 - (ssRes / ssTot);

    // BET monolayer volume
    const vm = 1 / (slope + intercept);

    // BET surface area (m²/g)
    const na = 6.022e23; // Avogadro's number
    const surfaceArea = (vm * na * crossSection * 1e-20) / (stpCondition * molWeight * 1e-3);

    // Total pore volume at P/P0 ≈ 0.99
    const highP = betData.adsorption.filter((_, i) => betData.p_rel[i] > 0.95);
    const poreVolume = highP.length > 0 ? highP[highP.length - 1] * 0.001547 : 0; // cm³/g liquid N₂

    // Average pore size (BJH approximation)
    const poreSize = surfaceArea > 0 ? (4 * poreVolume / surfaceArea) * 1000 : 0; // nm

    betResults = { surfaceArea, poreVolume, poreSize, r2 };

    document.getElementById('betSurfaceArea').textContent = surfaceArea.toFixed(2);
    document.getElementById('betPoreVolume').textContent = poreVolume.toFixed(3);
    document.getElementById('betPoreSize').textContent = poreSize.toFixed(2);
    document.getElementById('betR2').textContent = r2.toFixed(4);

    showNotification(`BET Surface Area: ${surfaceArea.toFixed(2)} m²/g`);
}

function toggleBETPlot() {
    betPlotMode = betPlotMode === 'isotherm' ? 'bett' : 'isotherm';
    if (betData.p_rel.length > 0) {
        if (betPlotMode === 'bett') {
            plotBETTPlot();
        } else {
            plotBETChart();
        }
    }
}

function plotBETTPlot() {
    const ctx = document.getElementById('betChart').getContext('2d');

    if (betChart) betChart.destroy();

    document.getElementById('betChartTitle').textContent = 'BET Plot (Linear Region)';

    // Calculate 1/[V(P0/P - 1)] vs P/P0
    const x = [];
    const y = [];

    for (let i = 0; i < betData.p_rel.length; i++) {
        if (betData.p_rel[i] > 0.05 && betData.p_rel[i] < 0.35 && betData.adsorption[i] > 0) {
            x.push(betData.p_rel[i]);
            y.push(1 / (betData.adsorption[i] * (1/betData.p_rel[i] - 1)));
        }
    }

    betChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'BET Data Points',
                data: x.map((xi, i) => ({ x: xi, y: y[i] })),
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(16, 185, 129, 0.5)',
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (item) => `P/P₀ = ${item.raw.x.toFixed(3)}, 1/[V(P₀/P-1)] = ${item.raw.y.toFixed(4)}`
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'P/P₀',
                        color: '#64748b',
                        font: { size: 13, weight: 600 }
                    },
                    grid: { color: '#1e293b' }
                },
                y: {
                    title: {
                        display: true,
                        text: '1/[V(P₀/P - 1)]',
                        color: '#64748b',
                        font: { size: 13, weight: 600 }
                    },
                    grid: { color: '#1e293b' }
                }
            }
        }
    });
}

function resetBETChart() {
    if (betChart) {
        betChart.destroy();
        betChart = null;
    }
    betData = { p_rel: [], adsorption: [], desorption: [] };
    document.getElementById('betChartInfo').innerHTML = 
        '<span><i class="fas fa-info-circle"></i> Upload data or select a sample to begin</span>';
    document.getElementById('betSurfaceArea').textContent = '--';
    document.getElementById('betPoreVolume').textContent = '--';
    document.getElementById('betPoreSize').textContent = '--';
    document.getElementById('betR2').textContent = '--';
    document.querySelectorAll('.iso-type').forEach(t => t.classList.remove('active'));
    document.getElementById('isoClassification').textContent = 'Upload data to classify isotherm type';
}

function exportBETChart() {
    if (!betChart) {
        showNotification('No chart to export', 'error');
        return;
    }
    const link = document.createElement('a');
    link.download = 'bet-isotherm.png';
    link.href = betChart.toBase64Image();
    link.click();
    showNotification('Chart exported as PNG');
}

// ===== SAMPLE BET DATA =====
function loadSampleBET(type) {
    let p_rel = [], adsorption = [], desorption = [];

    if (type === 'biochar') {
        // Type I-like isotherm for biochar (microporous)
        for (let p = 0; p <= 1.0; p += 0.01) {
            p_rel.push(p);
            let v = 0;
            if (p < 0.01) v = 120 * p / 0.01;
            else if (p < 0.1) v = 120 + 30 * (p - 0.01) / 0.09;
            else v = 150 + 20 * (p - 0.1) / 0.9;
            v += Math.random() * 3;
            adsorption.push(v);
            desorption.push(v - Math.random() * 2);
        }
    } else if (type === 'activated') {
        // Type IV with hysteresis for activated carbon (mesoporous)
        for (let p = 0; p <= 1.0; p += 0.01) {
            p_rel.push(p);
            let v = 0;
            if (p < 0.01) v = 80 * p / 0.01;
            else if (p < 0.4) v = 80 + 100 * (p - 0.01) / 0.39;
            else if (p < 0.8) v = 180 + 200 * (p - 0.4) / 0.4;
            else v = 380 + 150 * (p - 0.8) / 0.2;
            v += Math.random() * 5;
            adsorption.push(v);

            // Desorption with hysteresis
            let dv = v;
            if (p > 0.4) dv -= 30 * (p - 0.4);
            dv += Math.random() * 3;
            desorption.push(Math.max(dv, adsorption[adsorption.length-1] * 0.8));
        }
    }

    betData = { p_rel, adsorption, desorption };
    betPlotMode = 'isotherm';
    plotBETChart(type === 'biochar' ? 'Biochar N₂ Isotherm' : 'Activated Carbon N₂ Isotherm');
    classifyIsotherm();
    showNotification('Sample BET data loaded');
}
