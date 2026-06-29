// ===== BET ANALYSIS MODULE =====
let betChart = null;
let betData = { p_rel: [], adsorption: [], desorption: [] };
let betPlotMode = 'isotherm';
let betMetadata = {};
let betResults = { surfaceArea: null, poreVolume: null, poreSize: null, r2: null, vm: null, c: null };

document.addEventListener('DOMContentLoaded', () => {
    const betInput = document.getElementById('betFileInput');
    if (betInput) betInput.addEventListener('change', handleBETUpload);
});

function handleBETUpload(e) {
    const files = e.target.files;
    if (!files.length) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => parseBETData(event.target.result, file.name);
    reader.readAsText(file);
}

function parseBETData(content, filename) {
    const lines = content.trim().split('\n');
    const p_rel = [], adsorption = [], desorption = [];

    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#') || line.startsWith('%')) continue;
        let parts = line.split(',');
        if (parts.length >= 2) {
            const p = parseFloat(parts[0]);
            const a = parseFloat(parts[1]);
            if (!isNaN(p) && !isNaN(a)) {
                p_rel.push(p); adsorption.push(a);
                if (parts.length >= 3) { const d = parseFloat(parts[2]); if (!isNaN(d)) desorption.push(d); }
                continue;
            }
        }
        parts = line.split(/\t+/);
        if (parts.length >= 2) {
            const p = parseFloat(parts[0]);
            const a = parseFloat(parts[1]);
            if (!isNaN(p) && !isNaN(a)) {
                p_rel.push(p); adsorption.push(a);
                if (parts.length >= 3) { const d = parseFloat(parts[2]); if (!isNaN(d)) desorption.push(d); }
            }
        }
    }

    if (p_rel.length === 0) { showNotification('Could not parse BET data', 'error'); return; }

    betData = { p_rel, adsorption, desorption };
    betPlotMode = 'isotherm';

    betMetadata = {
        filename: filename,
        totalPoints: p_rel.length,
        minP: Math.min(...p_rel).toFixed(4),
        maxP: Math.max(...p_rel).toFixed(4),
        maxAdsorption: Math.max(...adsorption).toFixed(2),
        hasDesorption: desorption.length > 0,
        date: new Date().toLocaleString()
    };

    plotBETChart(filename);
    classifyIsotherm();
    updateBETMetadata();
    updateBETDataTable();
    showNotification(`Loaded ${p_rel.length} points from ${filename}`);
}

function plotBETChart(title = 'N₂ Adsorption/Desorption Isotherm') {
    const ctx = document.getElementById('betChart');
    if (!ctx) return;
    if (betChart) betChart.destroy();

    document.getElementById('betChartTitle').textContent = title;

    const datasets = [{
        label: 'Adsorption',
        data: betData.adsorption,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
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
            backgroundColor: 'rgba(249, 115, 22, 0.08)',
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
            fill: false,
            tension: 0.1,
            borderDash: [5, 5]
        });
    }

    betChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: betData.p_rel.map(p => p.toFixed(3)),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: true, labels: { color: '#94a3b8' } },
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
                    title: { display: true, text: 'Relative Pressure (P/P₀)', color: '#64748b', font: { size: 13, weight: 600 } },
                    grid: { color: '#1e293b' }
                },
                y: {
                    title: { display: true, text: 'N₂ Adsorbed (cm³/g STP)', color: '#64748b', font: { size: 13, weight: 600 } },
                    grid: { color: '#1e293b' }
                }
            }
        }
    });

    const info = betData.desorption.length > 0 
        ? `${betData.p_rel.length} points | Adsorption + Desorption`
        : `${betData.p_rel.length} points | Adsorption only`;
    document.getElementById('betChartInfo').innerHTML = `<span><i class="fas fa-check-circle" style="color: #06b6d4"></i> ${info}</span>`;
}

function classifyIsotherm() {
    document.querySelectorAll('.iso-type').forEach(t => t.classList.remove('active'));
    if (betData.p_rel.length < 10) return;

    const maxAds = Math.max(...betData.adsorption);
    const minAds = Math.min(...betData.adsorption);
    const range = maxAds - minAds;

    const hasHysteresis = betData.desorption.length > 0 && 
        betData.desorption.some((d, i) => Math.abs(d - betData.adsorption[i]) > range * 0.05);

    const lastPoints = betData.adsorption.slice(-5);
    const avgLast = lastPoints.reduce((a,b) => a+b, 0) / lastPoints.length;
    const hasPlateau = lastPoints.every(v => Math.abs(v - avgLast) < range * 0.1);

    const lowP = betData.adsorption.filter((_, i) => betData.p_rel[i] < 0.1);
    const steepLowP = lowP.length > 0 && lowP[lowP.length - 1] > maxAds * 0.3;

    let type = '', typeId = '';

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

    document.getElementById('isoClassification').innerHTML = `<span style="color: var(--primary); font-weight: 600;"><i class="fas fa-check-circle"></i> ${type}</span>`;
    if (typeId) document.getElementById(typeId).classList.add('active');
}

function calculateBET() {
    if (!betData.p_rel.length) { showNotification('Upload BET data first', 'error'); return; }

    const crossSection = parseFloat(document.getElementById('crossSection').value) || 16.2;
    const molWeight = parseFloat(document.getElementById('molWeight').value) || 28.0134;
    const stpCondition = parseFloat(document.getElementById('stpCondition').value) || 22414;
    const betMinP = parseFloat(document.getElementById('betMinP').value) || 0.05;
    const betMaxP = parseFloat(document.getElementById('betMaxP').value) || 0.35;

    const betRegion = [];
    for (let i = 0; i < betData.p_rel.length; i++) {
        if (betData.p_rel[i] > betMinP && betData.p_rel[i] < betMaxP) {
            betRegion.push({ p: betData.p_rel[i], v: betData.adsorption[i] });
        }
    }

    if (betRegion.length < 3) { showNotification('Not enough data in BET region', 'error'); return; }

    const x = [], y = [];
    betRegion.forEach(pt => {
        if (pt.v > 0 && pt.p > 0 && pt.p < 1) {
            x.push(pt.p);
            y.push(1 / (pt.v * (1/pt.p - 1)));
        }
    });

    if (x.length < 3) { showNotification('Insufficient data for BET', 'error'); return; }

    const n = x.length;
    const sumX = x.reduce((a,b) => a+b, 0);
    const sumY = y.reduce((a,b) => a+b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - sumY/n, 2), 0);
    const r2 = 1 - (ssRes / ssTot);

    const vm = 1 / (slope + intercept);
    const na = 6.022e23;
    const surfaceArea = (vm * na * crossSection * 1e-20) / (stpCondition * molWeight * 1e-3);

    const highP = betData.adsorption.filter((_, i) => betData.p_rel[i] > 0.95);
    const poreVolume = highP.length > 0 ? highP[highP.length - 1] * 0.001547 : 0;

    // Estimate micropore volume (t-plot method approximation)
    const lowPAds = betData.adsorption.filter((_, i) => betData.p_rel[i] < 0.01);
    const microVolume = lowPAds.length > 0 ? lowPAds[lowPAds.length - 1] * 0.001547 : 0;
    const mesoVolume = poreVolume - microVolume;

    const poreSize = surfaceArea > 0 ? (4 * poreVolume / surfaceArea) * 1000 : 0;

    // BET constant C
    const c = intercept > 0 ? (slope / intercept) + 1 : 0;

    betResults = { surfaceArea, poreVolume, poreSize, r2, vm, c, microVolume, mesoVolume };

    document.getElementById('betSurfaceArea').textContent = surfaceArea.toFixed(2);
    document.getElementById('betPoreVolume').textContent = poreVolume.toFixed(3);
    document.getElementById('betMicroVolume').textContent = microVolume.toFixed(3);
    document.getElementById('betMesoVolume').textContent = mesoVolume.toFixed(3);
    document.getElementById('betPoreSize').textContent = poreSize.toFixed(2);
    document.getElementById('betR2').textContent = r2.toFixed(4);
    document.getElementById('betVm').textContent = vm.toFixed(3);
    document.getElementById('betC').textContent = c.toFixed(2);

    showNotification(`BET Surface Area: ${surfaceArea.toFixed(2)} m²/g | R² = ${r2.toFixed(4)}`);
}

function updateBETMetadata() {
    const panel = document.getElementById('betMetadataPanel');
    const grid = document.getElementById('betMetadataGrid');
    if (!panel || !grid) return;

    panel.style.display = 'block';
    grid.innerHTML = `
        <div class="metadata-item"><div class="metadata-label">File Name</div><div class="metadata-value">${betMetadata.filename}</div></div>
        <div class="metadata-item"><div class="metadata-label">Total Points</div><div class="metadata-value highlight">${betMetadata.totalPoints}</div></div>
        <div class="metadata-item"><div class="metadata-label">P/P₀ Range</div><div class="metadata-value">${betMetadata.minP} - ${betMetadata.maxP}</div></div>
        <div class="metadata-item"><div class="metadata-label">Max Adsorption</div><div class="metadata-value highlight">${betMetadata.maxAdsorption} cm³/g</div></div>
        <div class="metadata-item"><div class="metadata-label">Has Desorption</div><div class="metadata-value">${betMetadata.hasDesorption ? 'Yes' : 'No'}</div></div>
        <div class="metadata-item"><div class="metadata-label">Loaded</div><div class="metadata-value">${betMetadata.date}</div></div>
    `;
}

function updateBETDataTable() {
    const tbody = document.getElementById('betDataTableBody');
    if (!tbody) return;

    const betMinP = parseFloat(document.getElementById('betMinP')?.value) || 0.05;
    const betMaxP = parseFloat(document.getElementById('betMaxP')?.value) || 0.35;

    tbody.innerHTML = betData.p_rel.map((p, i) => {
        const ads = betData.adsorption[i];
        const des = betData.desorption[i] !== undefined ? betData.desorption[i] : '--';
        const hysteresis = betData.desorption[i] !== undefined ? (betData.desorption[i] - ads).toFixed(2) : '--';
        const betY = ads > 0 && p > 0 ? (1 / (ads * (1/p - 1))).toFixed(4) : '--';
        const inRange = p > betMinP && p < betMaxP ? '<span style="color:#10b981;font-weight:600;"><i class="fas fa-check"></i> Yes</span>' : '<span style="color:#64748b;">No</span>';

        return `<tr>
            <td>${i+1}</td>
            <td>${p.toFixed(4)}</td>
            <td>${ads.toFixed(3)}</td>
            <td>${des}</td>
            <td>${hysteresis}</td>
            <td>${betY}</td>
            <td>${inRange}</td>
        </tr>`;
    }).join('');
}

function toggleBETPlot() {
    betPlotMode = betPlotMode === 'isotherm' ? 'bett' : 'isotherm';
    if (betData.p_rel.length > 0) {
        if (betPlotMode === 'bett') plotBETTPlot();
        else plotBETChart();
    }
}

function plotBETTPlot() {
    const ctx = document.getElementById('betChart');
    if (!ctx) return;
    if (betChart) betChart.destroy();

    document.getElementById('betChartTitle').textContent = 'BET Plot (Linear Region)';

    const x = [], y = [];
    for (let i = 0; i < betData.p_rel.length; i++) {
        if (betData.p_rel[i] > 0.05 && betData.p_rel[i] < 0.35 && betData.adsorption[i] > 0) {
            x.push(betData.p_rel[i]);
            y.push(1 / (betData.adsorption[i] * (1/betData.p_rel[i] - 1)));
        }
    }

    betChart = new Chart(ctx.getContext('2d'), {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'BET Data Points',
                data: x.map((xi, i) => ({ x: xi, y: y[i] })),
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.5)',
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
                    title: { display: true, text: 'P/P₀', color: '#64748b', font: { size: 13, weight: 600 } },
                    grid: { color: '#1e293b' }
                },
                y: {
                    title: { display: true, text: '1/[V(P₀/P - 1)]', color: '#64748b', font: { size: 13, weight: 600 } },
                    grid: { color: '#1e293b' }
                }
            }
        }
    });
}

function resetBETChart() {
    if (betChart) { betChart.destroy(); betChart = null; }
    betData = { p_rel: [], adsorption: [], desorption: [] };
    document.getElementById('betChartInfo').innerHTML = '<span><i class="fas fa-info-circle"></i> Upload data or select a sample</span>';
    document.getElementById('betSurfaceArea').textContent = '--';
    document.getElementById('betPoreVolume').textContent = '--';
    document.getElementById('betMicroVolume').textContent = '--';
    document.getElementById('betMesoVolume').textContent = '--';
    document.getElementById('betPoreSize').textContent = '--';
    document.getElementById('betR2').textContent = '--';
    document.getElementById('betVm').textContent = '--';
    document.getElementById('betC').textContent = '--';
    document.querySelectorAll('.iso-type').forEach(t => t.classList.remove('active'));
    document.getElementById('isoClassification').textContent = 'Upload data to classify isotherm type';
    document.getElementById('betDataTableBody').innerHTML = '<tr><td colspan="7" class="empty-row">Upload data to see isotherm details</td></tr>';
    const panel = document.getElementById('betMetadataPanel');
    if (panel) panel.style.display = 'none';
}

function exportBETChart(dpi) {
    exportChartAtDPI(betChart, dpi, `bet-isotherm-${dpi}dpi.png`);
}

function exportBETData(format) {
    if (!betData.p_rel.length) { showNotification('No data to export', 'error'); return; }

    let content = '';
    if (format === 'csv') {
        content = 'P_P0,Adsorption_cm3_g,Desorption_cm3_g\n';
        for (let i = 0; i < betData.p_rel.length; i++) {
            content += `${betData.p_rel[i].toFixed(4)},${betData.adsorption[i].toFixed(3)},${betData.desorption[i] !== undefined ? betData.desorption[i].toFixed(3) : ''}\n`;
        }
    } else {
        content = 'BET Data\n========\n';
        for (let i = 0; i < betData.p_rel.length; i++) {
            content += `${betData.p_rel[i].toFixed(4)}\t${betData.adsorption[i].toFixed(3)}\t${betData.desorption[i] !== undefined ? betData.desorption[i].toFixed(3) : ''}\n`;
        }
    }
    downloadFile(content, `bet-data.${format}`, format === 'csv' ? 'text/csv' : 'text/plain');
    showNotification(`Data exported as ${format.toUpperCase()}`);
}

function exportBETReport() {
    if (!betData.p_rel.length) { showNotification('No data to export', 'error'); return; }

    let report = `BET ANALYSIS REPORT\n===================\n\n`;
    report += `File: ${betMetadata.filename}\n`;
    report += `Date: ${betMetadata.date}\n\n`;
    report += `ISOTHERM METADATA\n-----------------\n`;
    report += `Points: ${betMetadata.totalPoints}\n`;
    report += `P/P₀ Range: ${betMetadata.minP} - ${betMetadata.maxP}\n`;
    report += `Max Adsorption: ${betMetadata.maxAdsorption} cm³/g\n`;
    report += `Desorption Data: ${betMetadata.hasDesorption ? 'Yes' : 'No'}\n\n`;

    if (betResults.surfaceArea) {
        report += `BET RESULTS\n-----------\n`;
        report += `Surface Area: ${betResults.surfaceArea.toFixed(2)} m²/g\n`;
        report += `Pore Volume: ${betResults.poreVolume.toFixed(3)} cm³/g\n`;
        report += `Micropore Volume: ${betResults.microVolume.toFixed(3)} cm³/g\n`;
        report += `Mesopore Volume: ${betResults.mesoVolume.toFixed(3)} cm³/g\n`;
        report += `Average Pore Size: ${betResults.poreSize.toFixed(2)} nm\n`;
        report += `Monolayer Volume: ${betResults.vm.toFixed(3)} cm³/g\n`;
        report += `BET Constant C: ${betResults.c.toFixed(2)}\n`;
        report += `R²: ${betResults.r2.toFixed(4)}\n`;
    }

    downloadFile(report, 'bet-analysis-report.txt', 'text/plain');
    showNotification('Full report exported');
}

// Sample data
function loadSampleBET(type) {
    let p_rel = [], adsorption = [], desorption = [];

    if (type === 'biochar') {
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
        for (let p = 0; p <= 1.0; p += 0.01) {
            p_rel.push(p);
            let v = 0;
            if (p < 0.01) v = 80 * p / 0.01;
            else if (p < 0.4) v = 80 + 100 * (p - 0.01) / 0.39;
            else if (p < 0.8) v = 180 + 200 * (p - 0.4) / 0.4;
            else v = 380 + 150 * (p - 0.8) / 0.2;
            v += Math.random() * 5;
            adsorption.push(v);
            let dv = v;
            if (p > 0.4) dv -= 30 * (p - 0.4);
            dv += Math.random() * 3;
            desorption.push(Math.max(dv, adsorption[adsorption.length-1] * 0.8));
        }
    } else if (type === 'mesoporous') {
        for (let p = 0; p <= 1.0; p += 0.01) {
            p_rel.push(p);
            let v = 0;
            if (p < 0.01) v = 50 * p / 0.01;
            else if (p < 0.3) v = 50 + 150 * (p - 0.01) / 0.29;
            else if (p < 0.6) v = 200 + 300 * (p - 0.3) / 0.3;
            else v = 500 + 100 * (p - 0.6) / 0.4;
            v += Math.random() * 4;
            adsorption.push(v);
            let dv = v;
            if (p > 0.35) dv -= 50 * (p - 0.35);
            dv += Math.random() * 3;
            desorption.push(Math.max(dv, adsorption[adsorption.length-1] * 0.7));
        }
    } else if (type === 'macroporous') {
        for (let p = 0; p <= 1.0; p += 0.01) {
            p_rel.push(p);
            let v = 0;
            if (p < 0.01) v = 30 * p / 0.01;
            else if (p < 0.3) v = 30 + 80 * (p - 0.01) / 0.29;
            else if (p < 0.6) v = 110 + 150 * (p - 0.3) / 0.3;
            else v = 260 + 200 * (p - 0.6) / 0.4;
            v += Math.random() * 3;
            adsorption.push(v);
            desorption.push(v - Math.random() * 1);
        }
    }

    betData = { p_rel, adsorption, desorption };
    betPlotMode = 'isotherm';

    betMetadata = {
        filename: type + '-sample.bet',
        totalPoints: p_rel.length,
        minP: Math.min(...p_rel).toFixed(4),
        maxP: Math.max(...p_rel).toFixed(4),
        maxAdsorption: Math.max(...adsorption).toFixed(2),
        hasDesorption: desorption.length > 0,
        date: new Date().toLocaleString()
    };

    const titles = { biochar: 'Biochar N₂ Isotherm', activated: 'Activated Carbon N₂ Isotherm', mesoporous: 'Mesoporous Silica N₂ Isotherm', macroporous: 'Macroporous Carbon N₂ Isotherm' };

    plotBETChart(titles[type] || 'N₂ Isotherm');
    classifyIsotherm();
    updateBETMetadata();
    updateBETDataTable();
    showNotification('Sample BET data loaded');
}
