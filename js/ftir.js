// ===== FTIR ANALYSIS MODULE =====
let ftirChart = null;
let ftirData = { wavenumber: [], transmittance: [] };
let ftirMode = 'transmittance';
let ftirMetadata = {};

const functionalGroups = [
    { range: [3600, 3200], name: 'O-H stretching', vibration: 'Hydroxyl, phenolic', intensity: 'Broad, strong', shape: 'Broad' },
    { range: [3100, 2800], name: 'C-H stretching', vibration: 'Aliphatic CH₂, CH₃', intensity: 'Weak to medium', shape: 'Sharp' },
    { range: [1750, 1700], name: 'C=O stretching', vibration: 'Carboxyl, ketone', intensity: 'Weak', shape: 'Sharp' },
    { range: [1680, 1620], name: 'C=C stretching', vibration: 'Aromatic ring', intensity: 'Medium', shape: 'Sharp' },
    { range: [1600, 1500], name: 'C=C aromatic', vibration: 'Aromatic skeleton', intensity: 'Medium', shape: 'Sharp' },
    { range: [1460, 1430], name: 'C-H bending', vibration: 'CH₂, CH₃', intensity: 'Medium', shape: 'Sharp' },
    { range: [1380, 1350], name: 'C-H bending', vibration: 'CH₃ symmetric', intensity: 'Weak', shape: 'Sharp' },
    { range: [1300, 1200], name: 'C-O stretching', vibration: 'Phenolic, ether', intensity: 'Medium', shape: 'Broad' },
    { range: [1200, 1000], name: 'C-O-C stretching', vibration: 'Ether, polysaccharide', intensity: 'Strong', shape: 'Broad' },
    { range: [900, 700], name: 'C-H out-of-plane', vibration: 'Aromatic substitution', intensity: 'Medium', shape: 'Sharp' },
    { range: [700, 400], name: 'Si-O-Si', vibration: 'Silicate minerals', intensity: 'Strong', shape: 'Broad' },
];

document.addEventListener('DOMContentLoaded', () => {
    const ftirInput = document.getElementById('ftirFileInput');
    if (ftirInput) ftirInput.addEventListener('change', handleFTIRUpload);
});

function handleFTIRUpload(e) {
    const files = e.target.files;
    if (!files.length) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => parseFTIRData(event.target.result, file.name);
    reader.readAsText(file);
}

function parseFTIRData(content, filename) {
    const lines = content.trim().split('\n');
    const wavenumber = [];
    const transmittance = [];

    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#') || line.startsWith('%')) continue;
        let parts = line.split(',');
        if (parts.length >= 2) {
            const w = parseFloat(parts[0]);
            const t = parseFloat(parts[1]);
            if (!isNaN(w) && !isNaN(t)) { wavenumber.push(w); transmittance.push(t); continue; }
        }
        parts = line.split(/\t+/);
        if (parts.length >= 2) {
            const w = parseFloat(parts[0]);
            const t = parseFloat(parts[1]);
            if (!isNaN(w) && !isNaN(t)) { wavenumber.push(w); transmittance.push(t); }
        }
    }

    if (wavenumber.length === 0) { showNotification('Could not parse FTIR data', 'error'); return; }

    ftirData = { wavenumber, transmittance };
    ftirMode = 'transmittance';

    const minT = Math.min(...transmittance);
    const maxT = Math.max(...transmittance);
    const resolution = wavenumber.length > 1 ? Math.abs(wavenumber[1] - wavenumber[0]).toFixed(2) : '--';

    ftirMetadata = {
        filename: filename,
        totalPoints: wavenumber.length,
        minWavenumber: Math.min(...wavenumber).toFixed(1),
        maxWavenumber: Math.max(...wavenumber).toFixed(1),
        resolution: resolution,
        minTransmittance: minT.toFixed(2),
        maxTransmittance: maxT.toFixed(2),
        meanTransmittance: (transmittance.reduce((a,b) => a+b, 0) / transmittance.length).toFixed(2),
        snr: ((maxT - minT) / (Math.sqrt(transmittance.reduce((sq, n) => sq + Math.pow(n - transmittance.reduce((a,b) => a+b, 0)/transmittance.length, 2), 0) / transmittance.length))).toFixed(1),
        date: new Date().toLocaleString()
    };

    plotFTIRChart(filename);
    identifyFunctionalGroups();
    updateFTIRStats();
    updateFTIRMetadata();
    showNotification(`Loaded ${wavenumber.length} points from ${filename}`);
}

function plotFTIRChart(title = 'FTIR Spectrum') {
    const ctx = document.getElementById('ftirChart');
    if (!ctx) return;
    if (ftirChart) ftirChart.destroy();

    document.getElementById('ftirChartTitle').textContent = title;

    let data = ftirMode === 'transmittance' ? ftirData.transmittance : 
               ftirData.transmittance.map(t => 2 - Math.log10(t / 100));

    if (ftirMode === 'transmittance') {
        const maxT = Math.max(...data);
        data = data.map(t => (t / maxT) * 100);
    }

    ftirChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: ftirData.wavenumber.map(w => w.toFixed(1)),
            datasets: [{
                label: ftirMode === 'transmittance' ? 'Transmittance (%)' : 'Absorbance (a.u.)',
                data: data,
                borderColor: '#ec4899',
                backgroundColor: 'rgba(236, 72, 153, 0.05)',
                borderWidth: 1.5,
                pointRadius: 0,
                pointHoverRadius: 4,
                fill: false,
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
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: '#334155',
                    borderWidth: 1,
                    callbacks: {
                        title: (items) => `${ftirMode === 'transmittance' ? 'T' : 'A'} at ${items[0].label} cm⁻¹`,
                        label: (item) => `${ftirMode === 'transmittance' ? 'Transmittance' : 'Absorbance'}: ${item.raw.toFixed(2)}${ftirMode === 'transmittance' ? '%' : ''}`
                    }
                }
            },
            scales: {
                x: {
                    reverse: true,
                    title: { display: true, text: 'Wavenumber (cm⁻¹)', color: '#64748b', font: { size: 13, weight: 600 } },
                    grid: { color: '#1e293b' }
                },
                y: {
                    title: { display: true, text: ftirMode === 'transmittance' ? 'Transmittance (%)' : 'Absorbance (a.u.)', color: '#64748b', font: { size: 13, weight: 600 } },
                    grid: { color: '#1e293b' }
                }
            }
        }
    });

    document.getElementById('ftirChartInfo').innerHTML = 
        `<span><i class="fas fa-check-circle" style="color: #ec4899"></i> ${ftirData.wavenumber.length} points | Range: ${ftirData.wavenumber[0].toFixed(1)} - ${ftirData.wavenumber[ftirData.wavenumber.length-1].toFixed(1)} cm⁻¹ | Resolution: ${ftirMetadata.resolution} cm⁻¹</span>`;
}

function identifyFunctionalGroups() {
    const tbody = document.getElementById('fgTableBody');
    if (!tbody) return;

    const found = [];
    functionalGroups.forEach(fg => {
        let minVal = Infinity;
        let minWavenumber = 0;
        let hasData = false;

        for (let i = 0; i < ftirData.wavenumber.length; i++) {
            if (ftirData.wavenumber[i] >= fg.range[0] && ftirData.wavenumber[i] <= fg.range[1]) {
                hasData = true;
                if (ftirData.transmittance[i] < minVal) {
                    minVal = ftirData.transmittance[i];
                    minWavenumber = ftirData.wavenumber[i];
                }
            }
        }

        if (hasData) {
            const avgTransmittance = ftirData.transmittance.reduce((a,b) => a+b, 0) / ftirData.transmittance.length;
            const dipDepth = (avgTransmittance - minVal) / avgTransmittance;
            const isDetected = dipDepth > 0.05;

            found.push({
                ...fg,
                detectedWavenumber: minWavenumber,
                dipDepth: dipDepth,
                detected: isDetected,
                observedIntensity: isDetected ? (dipDepth * 100).toFixed(1) + '% dip' : '--'
            });
        }
    });

    found.sort((a, b) => b.dipDepth - a.dipDepth);

    tbody.innerHTML = found.map(fg => `
        <tr>
            <td>${fg.detectedWavenumber.toFixed(1)}</td>
            <td><strong>${fg.name}</strong></td>
            <td>${fg.vibration}</td>
            <td>${fg.range[0]}-${fg.range[1]}</td>
            <td>${fg.observedIntensity}</td>
            <td>${fg.shape}</td>
            <td>
                <span style="color: ${fg.detected ? '#10b981' : '#64748b'}; font-weight: 600;">
                    <i class="fas fa-${fg.detected ? 'check-circle' : 'times-circle'}"></i>
                    ${fg.detected ? 'Detected' : 'Not Detected'}
                </span>
            </td>
        </tr>
    `).join('');

    document.getElementById('ftirBands').textContent = found.filter(f => f.detected).length;
}

function updateFTIRStats() {
    document.getElementById('ftirRange').textContent = `${ftirMetadata.minWavenumber} - ${ftirMetadata.maxWavenumber}`;
    document.getElementById('ftirResolution').textContent = ftirMetadata.resolution + ' cm⁻¹';
    document.getElementById('ftirMinT').textContent = ftirMetadata.minTransmittance + '%';
    document.getElementById('ftirMaxT').textContent = ftirMetadata.maxTransmittance + '%';
    document.getElementById('ftirSNR').textContent = ftirMetadata.snr;
}

function updateFTIRMetadata() {
    const panel = document.getElementById('ftirMetadataPanel');
    const grid = document.getElementById('ftirMetadataGrid');
    if (!panel || !grid) return;

    panel.style.display = 'block';
    grid.innerHTML = `
        <div class="metadata-item"><div class="metadata-label">File Name</div><div class="metadata-value">${ftirMetadata.filename}</div></div>
        <div class="metadata-item"><div class="metadata-label">Total Points</div><div class="metadata-value highlight">${ftirMetadata.totalPoints}</div></div>
        <div class="metadata-item"><div class="metadata-label">Wavenumber Range</div><div class="metadata-value">${ftirMetadata.minWavenumber} - ${ftirMetadata.maxWavenumber} cm⁻¹</div></div>
        <div class="metadata-item"><div class="metadata-label">Resolution</div><div class="metadata-value">${ftirMetadata.resolution} cm⁻¹</div></div>
        <div class="metadata-item"><div class="metadata-label">Min Transmittance</div><div class="metadata-value">${ftirMetadata.minTransmittance}%</div></div>
        <div class="metadata-item"><div class="metadata-label">Max Transmittance</div><div class="metadata-value highlight">${ftirMetadata.maxTransmittance}%</div></div>
        <div class="metadata-item"><div class="metadata-label">Mean Transmittance</div><div class="metadata-value">${ftirMetadata.meanTransmittance}%</div></div>
        <div class="metadata-item"><div class="metadata-label">Signal/Noise Ratio</div><div class="metadata-value">${ftirMetadata.snr}</div></div>
    `;
}

function toggleFTIRMode() {
    ftirMode = ftirMode === 'transmittance' ? 'absorbance' : 'transmittance';
    if (ftirData.wavenumber.length > 0) plotFTIRChart();
}

function resetFTIRChart() {
    if (ftirChart) { ftirChart.destroy(); ftirChart = null; }
    ftirData = { wavenumber: [], transmittance: [] };
    document.getElementById('ftirChartInfo').innerHTML = '<span><i class="fas fa-info-circle"></i> Upload data or select a sample</span>';
    document.getElementById('fgTableBody').innerHTML = '<tr><td colspan="7" class="empty-row">Upload FTIR data to identify functional groups</td></tr>';
    document.getElementById('ftirRange').textContent = '--';
    document.getElementById('ftirResolution').textContent = '--';
    document.getElementById('ftirMinT').textContent = '--';
    document.getElementById('ftirMaxT').textContent = '--';
    document.getElementById('ftirBands').textContent = '--';
    document.getElementById('ftirSNR').textContent = '--';
    const panel = document.getElementById('ftirMetadataPanel');
    if (panel) panel.style.display = 'none';
}

function exportFTIRChart(dpi) {
    exportChartAtDPI(ftirChart, dpi, `ftir-spectrum-${dpi}dpi.png`);
}

function exportFTIRData(format) {
    if (!ftirData.wavenumber.length) { showNotification('No data to export', 'error'); return; }

    let content = '';
    if (format === 'csv') {
        content = 'Wavenumber_cm-1,Transmittance_pct\n';
        for (let i = 0; i < ftirData.wavenumber.length; i++) {
            content += `${ftirData.wavenumber[i].toFixed(2)},${ftirData.transmittance[i].toFixed(2)}\n`;
        }
    } else {
        content = 'FTIR Data\n=========\n';
        for (let i = 0; i < ftirData.wavenumber.length; i++) {
            content += `${ftirData.wavenumber[i].toFixed(2)}\t${ftirData.transmittance[i].toFixed(2)}\n`;
        }
    }
    downloadFile(content, `ftir-data.${format}`, format === 'csv' ? 'text/csv' : 'text/plain');
    showNotification(`Data exported as ${format.toUpperCase()}`);
}

function exportFTIRReport() {
    if (!ftirData.wavenumber.length) { showNotification('No data to export', 'error'); return; }

    let report = `FTIR ANALYSIS REPORT\n=====================\n\n`;
    report += `File: ${ftirMetadata.filename}\n`;
    report += `Date: ${ftirMetadata.date}\n`;
    report += `Mode: ${ftirMode}\n\n`;
    report += `SPECTRUM METADATA\n-----------------\n`;
    report += `Range: ${ftirMetadata.minWavenumber} - ${ftirMetadata.maxWavenumber} cm⁻¹\n`;
    report += `Resolution: ${ftirMetadata.resolution} cm⁻¹\n`;
    report += `Points: ${ftirMetadata.totalPoints}\n`;
    report += `SNR: ${ftirMetadata.snr}\n\n`;
    report += `FUNCTIONAL GROUPS\n-----------------\n`;

    const tbody = document.getElementById('fgTableBody');
    if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 7) {
                report += `${cells[0].textContent} cm⁻¹: ${cells[1].textContent} - ${cells[6].textContent}\n`;
            }
        });
    }

    downloadFile(report, 'ftir-analysis-report.txt', 'text/plain');
    showNotification('Full report exported');
}

function applyBaselineCorrection() {
    showNotification('Baseline correction applied (simulated)');
    if (ftirData.wavenumber.length > 0) plotFTIRChart();
}

function smoothFTIR() {
    const val = document.getElementById('ftirSmooth').value;
    document.getElementById('ftirSmoothVal').textContent = val;
    showNotification('Smoothing applied (simulated)');
    if (ftirData.wavenumber.length > 0) plotFTIRChart();
}

function normalizeFTIR() {
    showNotification('Normalization applied (simulated)');
    if (ftirData.wavenumber.length > 0) plotFTIRChart();
}

// Sample data
function loadSampleFTIR(type) {
    let wavenumber = [], transmittance = [];

    if (type === 'raw') {
        for (let w = 4000; w >= 400; w -= 2) {
            wavenumber.push(w);
            let t = 85 + Math.random() * 5;
            t -= 35 * Math.exp(-Math.pow(w - 3420, 2) / 40000);
            t -= 15 * Math.exp(-Math.pow(w - 2920, 2) / 800);
            t -= 10 * Math.exp(-Math.pow(w - 2850, 2) / 800);
            t -= 12 * Math.exp(-Math.pow(w - 1700, 2) / 400);
            t -= 20 * Math.exp(-Math.pow(w - 1600, 2) / 900);
            t -= 10 * Math.exp(-Math.pow(w - 1460, 2) / 400);
            t -= 8 * Math.exp(-Math.pow(w - 1380, 2) / 400);
            t -= 18 * Math.exp(-Math.pow(w - 1110, 2) / 900);
            t -= 8 * Math.exp(-Math.pow(w - 880, 2) / 200);
            t -= 10 * Math.exp(-Math.pow(w - 810, 2) / 200);
            t -= 6 * Math.exp(-Math.pow(w - 750, 2) / 200);
            t -= 15 * Math.exp(-Math.pow(w - 470, 2) / 400);
            transmittance.push(Math.max(t, 10));
        }
    } else if (type === 'modified') {
        for (let w = 4000; w >= 400; w -= 2) {
            wavenumber.push(w);
            let t = 88 + Math.random() * 4;
            t -= 25 * Math.exp(-Math.pow(w - 3440, 2) / 50000);
            t -= 8 * Math.exp(-Math.pow(w - 2920, 2) / 1000);
            t -= 15 * Math.exp(-Math.pow(w - 1580, 2) / 1200);
            t -= 12 * Math.exp(-Math.pow(w - 1100, 2) / 1200);
            t -= 8 * Math.exp(-Math.pow(w - 470, 2) / 500);
            transmittance.push(Math.max(t, 15));
        }
    } else if (type === 'fe_modified') {
        for (let w = 4000; w >= 400; w -= 2) {
            wavenumber.push(w);
            let t = 86 + Math.random() * 4;
            t -= 30 * Math.exp(-Math.pow(w - 3430, 2) / 45000);
            t -= 12 * Math.exp(-Math.pow(w - 2920, 2) / 900);
            t -= 18 * Math.exp(-Math.pow(w - 1620, 2) / 1000);
            t -= 15 * Math.exp(-Math.pow(w - 1110, 2) / 1000);
            t -= 10 * Math.exp(-Math.pow(w - 580, 2) / 300);
            t -= 12 * Math.exp(-Math.pow(w - 470, 2) / 400);
            transmittance.push(Math.max(t, 12));
        }
    } else if (type === 'chitosan') {
        for (let w = 4000; w >= 400; w -= 2) {
            wavenumber.push(w);
            let t = 87 + Math.random() * 4;
            t -= 40 * Math.exp(-Math.pow(w - 3400, 2) / 50000);
            t -= 20 * Math.exp(-Math.pow(w - 2920, 2) / 800);
            t -= 25 * Math.exp(-Math.pow(w - 1650, 2) / 600);
            t -= 15 * Math.exp(-Math.pow(w - 1590, 2) / 500);
            t -= 12 * Math.exp(-Math.pow(w - 1420, 2) / 400);
            t -= 18 * Math.exp(-Math.pow(w - 1080, 2) / 800);
            t -= 10 * Math.exp(-Math.pow(w - 1030, 2) / 400);
            transmittance.push(Math.max(t, 12));
        }
    }

    ftirData = { wavenumber, transmittance };
    ftirMode = 'transmittance';

    const titles = { raw: 'Raw Tea Branch Biochar FTIR', modified: 'KOH-Activated Biochar FTIR', fe_modified: 'Fe-Modified Biochar FTIR', chitosan: 'Chitosan-Biochar Composite FTIR' };

    const minT = Math.min(...transmittance);
    const maxT = Math.max(...transmittance);
    const resolution = wavenumber.length > 1 ? Math.abs(wavenumber[1] - wavenumber[0]).toFixed(2) : '--';

    ftirMetadata = {
        filename: type + '-sample.ftir',
        totalPoints: wavenumber.length,
        minWavenumber: Math.min(...wavenumber).toFixed(1),
        maxWavenumber: Math.max(...wavenumber).toFixed(1),
        resolution: resolution,
        minTransmittance: minT.toFixed(2),
        maxTransmittance: maxT.toFixed(2),
        meanTransmittance: (transmittance.reduce((a,b) => a+b, 0) / transmittance.length).toFixed(2),
        snr: ((maxT - minT) / (Math.sqrt(transmittance.reduce((sq, n) => sq + Math.pow(n - transmittance.reduce((a,b) => a+b, 0)/transmittance.length, 2), 0) / transmittance.length))).toFixed(1),
        date: new Date().toLocaleString()
    };

    plotFTIRChart(titles[type] || 'FTIR Spectrum');
    identifyFunctionalGroups();
    updateFTIRStats();
    updateFTIRMetadata();
    showNotification('Sample FTIR data loaded');
}
