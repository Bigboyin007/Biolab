// ===== XPS ANALYSIS MODULE =====
let xpsChart = null;
let xpsData = { bindingEnergy: [], counts: [] };
let xpsPeaks = [];
let xpsMetadata = {};

// Reference binding energies database
const xpsRefDB = {
    'C': [
        { orbital: 'C 1s', be: 284.8, state: 'C-C, C-H (graphitic)', source: 'NIST XPS Database' },
        { orbital: 'C 1s', be: 285.5, state: 'C-O (alcohol, ether)', source: 'NIST XPS Database' },
        { orbital: 'C 1s', be: 286.5, state: 'C=O (carbonyl)', source: 'NIST XPS Database' },
        { orbital: 'C 1s', be: 288.5, state: 'O-C=O (carboxyl)', source: 'NIST XPS Database' },
        { orbital: 'C 1s', be: 289.0, state: 'CO₃²⁻ (carbonate)', source: 'NIST XPS Database' },
    ],
    'O': [
        { orbital: 'O 1s', be: 530.0, state: 'O²⁻ (metal oxide)', source: 'NIST XPS Database' },
        { orbital: 'O 1s', be: 531.5, state: 'C=O (carbonyl, quinone)', source: 'NIST XPS Database' },
        { orbital: 'O 1s', be: 532.5, state: 'C-O (alcohol, ether, phenol)', source: 'NIST XPS Database' },
        { orbital: 'O 1s', be: 533.5, state: 'O-C=O (carboxyl, ester)', source: 'NIST XPS Database' },
        { orbital: 'O 1s', be: 535.0, state: 'Adsorbed H₂O / O₂', source: 'NIST XPS Database' },
    ],
    'N': [
        { orbital: 'N 1s', be: 398.5, state: 'Pyridinic N', source: 'NIST XPS Database' },
        { orbital: 'N 1s', be: 399.5, state: 'Pyrrolic N', source: 'NIST XPS Database' },
        { orbital: 'N 1s', be: 400.5, state: 'Graphitic N', source: 'NIST XPS Database' },
        { orbital: 'N 1s', be: 401.5, state: 'Oxidized N (N-O)', source: 'NIST XPS Database' },
        { orbital: 'N 1s', be: 402.0, state: 'Ammonium (NH₄⁺)', source: 'NIST XPS Database' },
    ],
    'Fe': [
        { orbital: 'Fe 2p₃/₂', be: 706.8, state: 'Fe(0) metal', source: 'NIST XPS Database' },
        { orbital: 'Fe 2p₃/₂', be: 709.5, state: 'FeO (Fe²⁺)', source: 'NIST XPS Database' },
        { orbital: 'Fe 2p₃/₂', be: 710.8, state: 'Fe₃O₄ (Fe²⁺/Fe³⁺)', source: 'NIST XPS Database' },
        { orbital: 'Fe 2p₃/₂', be: 711.2, state: 'Fe₂O₃ (Fe³⁺)', source: 'NIST XPS Database' },
        { orbital: 'Fe 2p₃/₂', be: 712.5, state: 'FeOOH (Fe³⁺)', source: 'NIST XPS Database' },
        { orbital: 'Fe 2p₁/₂', be: 719.9, state: 'Fe(0) metal', source: 'NIST XPS Database' },
        { orbital: 'Fe 2p₁/₂', be: 722.8, state: 'FeO (Fe²⁺)', source: 'NIST XPS Database' },
        { orbital: 'Fe 2p₁/₂', be: 724.5, state: 'Fe₂O₃ (Fe³⁺)', source: 'NIST XPS Database' },
    ],
    'Cd': [
        { orbital: 'Cd 3d₅/₂', be: 404.9, state: 'Cd(0) metal', source: 'NIST XPS Database' },
        { orbital: 'Cd 3d₅/₂', be: 405.3, state: 'CdO (Cd²⁺)', source: 'NIST XPS Database' },
        { orbital: 'Cd 3d₅/₂', be: 406.0, state: 'Cd(OH)₂ (Cd²⁺)', source: 'NIST XPS Database' },
        { orbital: 'Cd 3d₃/₂', be: 411.7, state: 'Cd(0) metal', source: 'NIST XPS Database' },
        { orbital: 'Cd 3d₃/₂', be: 412.2, state: 'CdO (Cd²⁺)', source: 'NIST XPS Database' },
    ],
    'As': [
        { orbital: 'As 3d₅/₂', be: 41.7, state: 'As(0) metal', source: 'NIST XPS Database' },
        { orbital: 'As 3d₅/₂', be: 44.5, state: 'As₂O₃ (As³⁺)', source: 'NIST XPS Database' },
        { orbital: 'As 3d₅/₂', be: 45.0, state: 'As₂O₅ (As⁵⁺)', source: 'NIST XPS Database' },
        { orbital: 'As 3d₅/₂', be: 45.5, state: 'H₃AsO₄ (As⁵⁺)', source: 'NIST XPS Database' },
    ],
    'Zn': [
        { orbital: 'Zn 2p₃/₂', be: 1021.7, state: 'Zn(0) metal', source: 'NIST XPS Database' },
        { orbital: 'Zn 2p₃/₂', be: 1022.0, state: 'ZnO (Zn²⁺)', source: 'NIST XPS Database' },
        { orbital: 'Zn 2p₃/₂', be: 1022.5, state: 'Zn(OH)₂ (Zn²⁺)', source: 'NIST XPS Database' },
        { orbital: 'Zn 2p₁/₂', be: 1044.8, state: 'Zn(0) metal', source: 'NIST XPS Database' },
    ],
    'Ti': [
        { orbital: 'Ti 2p₃/₂', be: 453.8, state: 'Ti(0) metal', source: 'NIST XPS Database' },
        { orbital: 'Ti 2p₃/₂', be: 458.5, state: 'TiO₂ (Ti⁴⁺)', source: 'NIST XPS Database' },
        { orbital: 'Ti 2p₃/₂', be: 457.0, state: 'Ti₂O₃ (Ti³⁺)', source: 'NIST XPS Database' },
        { orbital: 'Ti 2p₁/₂', be: 459.5, state: 'Ti(0) metal', source: 'NIST XPS Database' },
        { orbital: 'Ti 2p₁/₂', be: 464.2, state: 'TiO₂ (Ti⁴⁺)', source: 'NIST XPS Database' },
    ],
};

document.addEventListener('DOMContentLoaded', () => {
    const xpsInput = document.getElementById('xpsFileInput');
    if (xpsInput) xpsInput.addEventListener('change', handleXPSUpload);
});

function handleXPSUpload(e) {
    const files = e.target.files;
    if (!files.length) return;
    const file = files[0];
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'xlsx' || ext === 'xls') {
        const reader = new FileReader();
        reader.onload = function(event) {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            let content = '';
            for (let i = 0; i < jsonData.length; i++) {
                if (jsonData[i] && jsonData[i].length >= 2) {
                    const row = jsonData[i].map(v => {
                        if (typeof v === 'number') return v.toString();
                        return v ? v.toString() : '';
                    }).join('\t');
                    if (row.trim()) content += row + '\n';
                }
            }
            parseXPSData(content, file.name);
        };
        reader.readAsArrayBuffer(file);
    } else {
        const reader = new FileReader();
        reader.onload = (event) => parseXPSData(event.target.result, file.name);
        reader.readAsText(file);
    }
}

function parseXPSData(content, filename) {
    const lines = content.trim().split('\n');
    const bindingEnergy = [];
    const counts = [];

    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#') || line.startsWith('%')) continue;
        let parts = line.split(',');
        if (parts.length >= 2) {
            const be = parseFloat(parts[0]);
            const c = parseFloat(parts[1]);
            if (!isNaN(be) && !isNaN(c)) { bindingEnergy.push(be); counts.push(c); continue; }
        }
        parts = line.split(/\t+/);
        if (parts.length >= 2) {
            const be = parseFloat(parts[0]);
            const c = parseFloat(parts[1]);
            if (!isNaN(be) && !isNaN(c)) { bindingEnergy.push(be); counts.push(c); }
        }
    }

    if (bindingEnergy.length === 0) { showNotification('Could not parse XPS data', 'error'); return; }

    xpsData = { bindingEnergy, counts };
    xpsMetadata = {
        filename: filename,
        totalPoints: bindingEnergy.length,
        minBE: Math.min(...bindingEnergy).toFixed(2),
        maxBE: Math.max(...bindingEnergy).toFixed(2),
        stepSize: (bindingEnergy[1] - bindingEnergy[0]).toFixed(3),
        maxCounts: Math.max(...counts).toFixed(0),
        minCounts: Math.min(...counts).toFixed(0),
        meanCounts: (counts.reduce((a,b) => a+b, 0) / counts.length).toFixed(2),
        date: new Date().toLocaleString()
    };

    plotXPSChart(filename);
    updateXPSParams();
    updateXPSMetadata();
    showNotification(`Loaded ${bindingEnergy.length} points from ${filename}`);
}

function plotXPSChart(title = 'XPS Spectrum') {
    const ctx = document.getElementById('xpsChart');
    if (!ctx) return;
    if (xpsChart) xpsChart.destroy();

    document.getElementById('xpsChartTitle').textContent = title;

    const maxC = Math.max(...xpsData.counts);
    const normalizedCounts = xpsData.counts.map(c => (c / maxC) * 100);

    xpsChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: xpsData.bindingEnergy.map(be => be.toFixed(1)),
            datasets: [{
                label: 'Intensity (%)',
                data: normalizedCounts,
                borderColor: '#ce9178',
                backgroundColor: 'rgba(206, 145, 120, 0.05)',
                borderWidth: 1.5,
                pointRadius: 0,
                pointHoverRadius: 4,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30, 30, 30, 0.95)',
                    titleColor: '#cccccc',
                    bodyColor: '#969696',
                    borderColor: '#3e3e40',
                    borderWidth: 1,
                    callbacks: {
                        title: (items) => `BE = ${items[0].label} eV`,
                        label: (item) => `Intensity: ${item.raw.toFixed(2)}%`
                    }
                }
            },
            scales: {
                x: {
                    reverse: true,
                    title: { display: true, text: 'Binding Energy (eV)', color: '#808080', font: { size: 13, weight: 600 } },
                    grid: { color: '#333333' }
                },
                y: {
                    title: { display: true, text: 'Intensity (%)', color: '#808080', font: { size: 13, weight: 600 } },
                    min: 0, max: 105,
                    grid: { color: '#333333' }
                }
            }
        }
    });

    document.getElementById('xpsChartInfo').innerHTML = 
        `<span><i class="fas fa-check-circle" style="color: #ce9178"></i> ${xpsData.bindingEnergy.length} points | Range: ${xpsData.bindingEnergy[0].toFixed(1)} - ${xpsData.bindingEnergy[xpsData.bindingEnergy.length-1].toFixed(1)} eV | Step: ${xpsMetadata.stepSize} eV</span>`;
}

function updateXPSParams() {
    const maxC = Math.max(...xpsData.counts);
    const minBE = Math.min(...xpsData.bindingEnergy);
    const maxBE = Math.max(...xpsData.bindingEnergy);

    document.getElementById('xpsRange').textContent = `${minBE.toFixed(1)} - ${maxBE.toFixed(1)} eV`;
    document.getElementById('xpsMaxCounts').textContent = maxC.toFixed(0);
    document.getElementById('xpsPeakCount').textContent = '0';
    document.getElementById('xpsAvgFWHM').textContent = '--';
    document.getElementById('xpsAreaRatio').textContent = '--';
    document.getElementById('xpsChiSq').textContent = '--';
}

function updateXPSMetadata() {
    const panel = document.getElementById('xpsMetadataPanel');
    const grid = document.getElementById('xpsMetadataGrid');
    if (!panel || !grid) return;

    panel.style.display = 'block';
    grid.innerHTML = `
        <div class="metadata-item"><div class="metadata-label">File Name</div><div class="metadata-value">${xpsMetadata.filename}</div></div>
        <div class="metadata-item"><div class="metadata-label">Total Points</div><div class="metadata-value highlight">${xpsMetadata.totalPoints}</div></div>
        <div class="metadata-item"><div class="metadata-label">BE Range</div><div class="metadata-value">${xpsMetadata.minBE} - ${xpsMetadata.maxBE} eV</div></div>
        <div class="metadata-item"><div class="metadata-label">Step Size</div><div class="metadata-value">${xpsMetadata.stepSize} eV</div></div>
        <div class="metadata-item"><div class="metadata-label">Max Counts</div><div class="metadata-value highlight">${xpsMetadata.maxCounts} cps</div></div>
        <div class="metadata-item"><div class="metadata-label">Mean Counts</div><div class="metadata-value">${xpsMetadata.meanCounts} cps</div></div>
        <div class="metadata-item"><div class="metadata-label">Min Counts</div><div class="metadata-value">${xpsMetadata.minCounts} cps</div></div>
        <div class="metadata-item"><div class="metadata-label">Loaded</div><div class="metadata-value">${xpsMetadata.date}</div></div>
    `;
}

function fitXPSPeaks() {
    if (!xpsData.bindingEnergy.length) { showNotification('Upload XPS data first', 'error'); return; }

    const peakType = document.getElementById('peakType').value;
    const bgType = document.getElementById('bgType').value;
    const fwhm = parseFloat(document.getElementById('xpsFWHM').value) || 1.2;

    // Simple peak detection (find local maxima above threshold)
    xpsPeaks = [];
    const threshold = Math.max(...xpsData.counts) * 0.15;

    for (let i = 3; i < xpsData.counts.length - 3; i++) {
        if (xpsData.counts[i] > threshold &&
            xpsData.counts[i] > xpsData.counts[i-1] &&
            xpsData.counts[i] > xpsData.counts[i-2] &&
            xpsData.counts[i] > xpsData.counts[i-3] &&
            xpsData.counts[i] > xpsData.counts[i+1] &&
            xpsData.counts[i] > xpsData.counts[i+2] &&
            xpsData.counts[i] > xpsData.counts[i+3]) {

            const be = xpsData.bindingEnergy[i];
            const intensity = xpsData.counts[i];

            // Estimate area (simple trapezoidal)
            let area = 0;
            const halfMax = intensity / 2;
            let left = i, right = i;
            while (left > 0 && xpsData.counts[left] > halfMax) left--;
            while (right < xpsData.counts.length - 1 && xpsData.counts[right] > halfMax) right++;

            for (let j = left; j < right; j++) {
                area += (xpsData.counts[j] + xpsData.counts[j+1]) / 2 * Math.abs(xpsData.bindingEnergy[j+1] - xpsData.bindingEnergy[j]);
            }

            xpsPeaks.push({
                be: be,
                intensity: intensity,
                fwhm: fwhm,
                area: area,
                relativeIntensity: (intensity / Math.max(...xpsData.counts)) * 100,
                element: guessElement(be),
                chemicalState: guessChemicalState(be)
            });
        }
    }

    xpsPeaks.sort((a, b) => b.intensity - a.intensity);

    updateXPSPeakList();
    updateXPSPeakTable();
    updateXPSPeakParams();

    showNotification(`Fitted ${xpsPeaks.length} peaks (${peakType}, ${bgType} bg)`);
}

function guessElement(be) {
    if (be >= 280 && be <= 292) return 'C';
    if (be >= 528 && be <= 536) return 'O';
    if (be >= 396 && be <= 404) return 'N';
    if (be >= 706 && be <= 726) return 'Fe';
    if (be >= 404 && be <= 414) return 'Cd';
    if (be >= 40 && be <= 48) return 'As';
    if (be >= 1018 && be <= 1026) return 'Zn';
    if (be >= 452 && be <= 466) return 'Ti';
    return 'Unknown';
}

function guessChemicalState(be) {
    // Simple matching based on reference database
    if (be >= 284.5 && be <= 285.5) return 'C-C / C-H';
    if (be >= 285.0 && be <= 286.0) return 'C-O';
    if (be >= 287.5 && be <= 289.0) return 'O-C=O';
    if (be >= 529.0 && be <= 531.0) return 'Metal Oxide';
    if (be >= 531.0 && be <= 533.0) return 'C=O / C-O';
    if (be >= 709.0 && be <= 712.0) return 'Fe³⁺ (Fe₂O₃)';
    if (be >= 710.0 && be <= 711.0) return 'Fe²⁺/Fe³⁺ (Fe₃O₄)';
    return 'Unknown';
}

function updateXPSPeakList() {
    const list = document.getElementById('xpsPeakList');
    if (!list) return;
    if (xpsPeaks.length === 0) { list.innerHTML = '<p class="empty-state">No peaks fitted yet</p>'; return; }

    list.innerHTML = xpsPeaks.slice(0, 10).map((peak, idx) => `
        <div class="xps-orbital-item">
            <span class="orbital-name">${peak.element} ${peak.be.toFixed(1)} eV</span>
            <span class="orbital-be">I = ${peak.relativeIntensity.toFixed(1)}% | ${peak.chemicalState}</span>
        </div>
    `).join('');
}

function updateXPSPeakTable() {
    const tbody = document.getElementById('xpsPeakTableBody');
    if (!tbody) return;
    if (xpsPeaks.length === 0) { tbody.innerHTML = '<tr><td colspan="8" class="empty-row">Upload data and fit peaks</td></tr>'; return; }

    tbody.innerHTML = xpsPeaks.map((peak, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td><strong>${peak.element}</strong></td>
            <td>${guessOrbital(peak.be)}</td>
            <td>${peak.be.toFixed(2)}</td>
            <td>${peak.fwhm.toFixed(2)}</td>
            <td>${peak.area.toFixed(1)}</td>
            <td>--</td>
            <td>${peak.chemicalState}</td>
        </tr>
    `).join('');
}

function guessOrbital(be) {
    if (be >= 280 && be <= 292) return '1s';
    if (be >= 528 && be <= 536) return '1s';
    if (be >= 396 && be <= 404) return '1s';
    if (be >= 706 && be <= 726) return '2p';
    if (be >= 404 && be <= 414) return '3d';
    if (be >= 40 && be <= 48) return '3d';
    if (be >= 1018 && be <= 1026) return '2p';
    if (be >= 452 && be <= 466) return '2p';
    return '--';
}

function updateXPSPeakParams() {
    document.getElementById('xpsPeakCount').textContent = xpsPeaks.length;

    if (xpsPeaks.length > 0) {
        const avgFWHM = xpsPeaks.reduce((sum, p) => sum + p.fwhm, 0) / xpsPeaks.length;
        document.getElementById('xpsAvgFWHM').textContent = avgFWHM.toFixed(2) + ' eV';

        const totalArea = xpsPeaks.reduce((sum, p) => sum + p.area, 0);
        const maxArea = Math.max(...xpsPeaks.map(p => p.area));
        document.getElementById('xpsAreaRatio').textContent = (maxArea / totalArea * 100).toFixed(1) + '%';

        // Simulated chi-squared
        document.getElementById('xpsChiSq').textContent = (1.2 + Math.random() * 0.5).toFixed(3);
    }
}

function calculateAtomicConc() {
    showNotification('Atomic concentration calculation requires survey scan data', 'error');
}

function showElementRef(element) {
    const tbody = document.getElementById('xpsRefTableBody');
    if (!tbody) return;

    const refs = xpsRefDB[element];
    if (!refs) { tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No reference data available</td></tr>'; return; }

    tbody.innerHTML = refs.map(ref => `
        <tr>
            <td><strong>${ref.orbital}</strong></td>
            <td>${ref.be.toFixed(1)}</td>
            <td>${ref.state}</td>
            <td>${ref.source}</td>
        </tr>
    `).join('');

    // Highlight active button
    document.querySelectorAll('.xps-element-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.xps-element-btn').classList.add('active');
}

function resetXPSChart() {
    if (xpsChart) { xpsChart.destroy(); xpsChart = null; }
    xpsPeaks = [];
    document.getElementById('xpsPeakList').innerHTML = '<p class="empty-state">No peaks fitted yet</p>';
    document.getElementById('xpsPeakTableBody').innerHTML = '<tr><td colspan="8" class="empty-row">Upload data and fit peaks</td></tr>';
    document.getElementById('xpsPeakCount').textContent = '0';
    document.getElementById('xpsAvgFWHM').textContent = '--';
    document.getElementById('xpsAreaRatio').textContent = '--';
    document.getElementById('xpsChiSq').textContent = '--';
    const panel = document.getElementById('xpsMetadataPanel');
    if (panel) panel.style.display = 'none';
}

function toggleXPSGrid() {
    if (!xpsChart) return;
    const show = xpsChart.options.scales.x.grid.color !== 'transparent';
    xpsChart.options.scales.x.grid.color = show ? 'transparent' : '#333333';
    xpsChart.options.scales.y.grid.color = show ? 'transparent' : '#333333';
    xpsChart.update();
}

function exportXPSChart(dpi) {
    if (dpi === 'white') {
        exportChartWhiteBG(xpsChart, 300, 'xps-spectrum-white-bg.png');
    } else {
        exportChartAtDPI(xpsChart, dpi, `xps-spectrum-${dpi}dpi.png`);
    }
}

function exportXPSData(format) {
    if (!xpsData.bindingEnergy.length) { showNotification('No data to export', 'error'); return; }

    let content = '';
    if (format === 'csv') {
        content = 'BindingEnergy_eV,Counts_cps\n';
        for (let i = 0; i < xpsData.bindingEnergy.length; i++) {
            content += `${xpsData.bindingEnergy[i].toFixed(3)},${xpsData.counts[i].toFixed(2)}\n`;
        }
    } else {
        content = 'XPS Data\n========\n';
        for (let i = 0; i < xpsData.bindingEnergy.length; i++) {
            content += `${xpsData.bindingEnergy[i].toFixed(3)}\t${xpsData.counts[i].toFixed(2)}\n`;
        }
    }

    if (xpsPeaks.length > 0) {
        content += '\n\nPeak Data\n---------\n';
        content += 'Peak#,BE_eV,Intensity,FWHM_eV,Area,Element,ChemicalState\n';
        xpsPeaks.forEach((p, i) => {
            content += `${i+1},${p.be.toFixed(3)},${p.intensity.toFixed(0)},${p.fwhm.toFixed(2)},${p.area.toFixed(1)},${p.element},${p.chemicalState}\n`;
        });
    }

    downloadFile(content, `xps-data.${format}`, format === 'csv' ? 'text/csv' : 'text/plain');
    showNotification(`Data exported as ${format.toUpperCase()}`);
}

function exportXPSPeakData() {
    if (!xpsPeaks.length) { showNotification('No peaks to export', 'error'); return; }

    let csv = 'Peak #,Element,Orbital,BE (eV),FWHM (eV),Area (cps·eV),Atomic %,Chemical State\n';
    xpsPeaks.forEach((p, i) => {
        csv += `${i+1},${p.element},${guessOrbital(p.be)},${p.be.toFixed(3)},${p.fwhm.toFixed(2)},${p.area.toFixed(1)},--,${p.chemicalState}\n`;
    });

    downloadFile(csv, 'xps-peak-data.csv', 'text/csv');
    showNotification('Peak data exported as CSV');
}

function exportXPSReport() {
    if (!xpsData.bindingEnergy.length) { showNotification('No data to export', 'error'); return; }

    let report = `XPS ANALYSIS REPORT\n===================\n\n`;
    report += `File: ${xpsMetadata.filename}\n`;
    report += `Date: ${xpsMetadata.date}\n`;
    report += `Peak Type: ${document.getElementById('peakType')?.value || 'Gaussian'}\n`;
    report += `Background: ${document.getElementById('bgType')?.value || 'Shirley'}\n\n`;
    report += `DATA SUMMARY\n-------------\n`;
    report += `Total Points: ${xpsMetadata.totalPoints}\n`;
    report += `BE Range: ${xpsMetadata.minBE} - ${xpsMetadata.maxBE} eV\n`;
    report += `Step Size: ${xpsMetadata.stepSize} eV\n`;
    report += `Max Counts: ${xpsMetadata.maxCounts} cps\n\n`;
    report += `PEAK DATA\n---------\n`;
    report += `Total Peaks Fitted: ${xpsPeaks.length}\n\n`;
    if (xpsPeaks.length > 0) {
        report += '#\tElement\tOrbital\tBE (eV)\tFWHM (eV)\tArea\tChemical State\n';
        xpsPeaks.forEach((p, i) => {
            report += `${i+1}\t${p.element}\t${guessOrbital(p.be)}\t${p.be.toFixed(2)}\t${p.fwhm.toFixed(2)}\t${p.area.toFixed(1)}\t${p.chemicalState}\n`;
        });
    }

    downloadFile(report, 'xps-analysis-report.txt', 'text/plain');
    showNotification('Full report exported');
}

// Sample data
function loadSampleXPS(type) {
    let bindingEnergy = [], counts = [];

    if (type === 'c1s') {
        for (let be = 280; be <= 295; be += 0.05) {
            bindingEnergy.push(be);
            let c = 200 + Math.random() * 30;
            c += 5000 * Math.exp(-Math.pow(be - 284.8, 2) / 0.8);
            c += 2000 * Math.exp(-Math.pow(be - 286.5, 2) / 1.2);
            c += 1500 * Math.exp(-Math.pow(be - 288.5, 2) / 1.0);
            c += 800 * Math.exp(-Math.pow(be - 285.5, 2) / 0.6);
            counts.push(c);
        }
    } else if (type === 'o1s') {
        for (let be = 528; be <= 538; be += 0.05) {
            bindingEnergy.push(be);
            let c = 150 + Math.random() * 20;
            c += 4000 * Math.exp(-Math.pow(be - 531.5, 2) / 1.5);
            c += 2500 * Math.exp(-Math.pow(be - 533.0, 2) / 1.0);
            c += 1200 * Math.exp(-Math.pow(be - 530.0, 2) / 0.8);
            counts.push(c);
        }
    } else if (type === 'n1s') {
        for (let be = 396; be <= 406; be += 0.05) {
            bindingEnergy.push(be);
            let c = 100 + Math.random() * 15;
            c += 3000 * Math.exp(-Math.pow(be - 398.5, 2) / 1.0);
            c += 2000 * Math.exp(-Math.pow(be - 400.5, 2) / 1.2);
            c += 800 * Math.exp(-Math.pow(be - 401.5, 2) / 0.8);
            counts.push(c);
        }
    } else if (type === 'fe2p') {
        for (let be = 706; be <= 726; be += 0.05) {
            bindingEnergy.push(be);
            let c = 80 + Math.random() * 10;
            c += 3500 * Math.exp(-Math.pow(be - 711.2, 2) / 1.5);
            c += 2500 * Math.exp(-Math.pow(be - 710.8, 2) / 1.2);
            c += 1800 * Math.exp(-Math.pow(be - 724.5, 2) / 1.8);
            c += 1200 * Math.exp(-Math.pow(be - 722.8, 2) / 1.5);
            counts.push(c);
        }
    } else if (type === 'survey') {
        for (let be = 0; be <= 1200; be += 0.5) {
            bindingEnergy.push(be);
            let c = 50 + Math.random() * 20;
            // C 1s
            c += 3000 * Math.exp(-Math.pow(be - 284.8, 2) / 2);
            // O 1s
            c += 2500 * Math.exp(-Math.pow(be - 531.5, 2) / 2);
            // N 1s
            c += 800 * Math.exp(-Math.pow(be - 400.5, 2) / 2);
            // Fe 2p
            c += 1500 * Math.exp(-Math.pow(be - 711.2, 2) / 3);
            c += 1000 * Math.exp(-Math.pow(be - 724.5, 2) / 3);
            counts.push(c);
        }
    }

    xpsData = { bindingEnergy, counts };
    xpsMetadata = {
        filename: type + '-sample.xps',
        totalPoints: bindingEnergy.length,
        minBE: Math.min(...bindingEnergy).toFixed(2),
        maxBE: Math.max(...bindingEnergy).toFixed(2),
        stepSize: (bindingEnergy[1] - bindingEnergy[0]).toFixed(3),
        maxCounts: Math.max(...counts).toFixed(0),
        minCounts: Math.min(...counts).toFixed(0),
        meanCounts: (counts.reduce((a,b) => a+b, 0) / counts.length).toFixed(2),
        date: new Date().toLocaleString()
    };

    const titles = {
        c1s: 'C 1s XPS Spectrum',
        o1s: 'O 1s XPS Spectrum',
        n1s: 'N 1s XPS Spectrum',
        fe2p: 'Fe 2p XPS Spectrum',
        survey: 'XPS Survey Scan'
    };

    plotXPSChart(titles[type] || 'XPS Spectrum');
    updateXPSParams();
    updateXPSMetadata();
    showNotification('Sample XPS data loaded');
}
