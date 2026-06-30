// ===== FTIR ANALYSIS MODULE =====
let ftirChart = null;
let ftirData = { wavenumber: [], transmittance: [] };
let ftirMode = 'transmittance'; // or 'absorbance'

// Common biochar functional groups
const functionalGroups = [
    { range: [3600, 3200], name: 'O-H stretching', vibration: 'Hydroxyl, phenolic', intensity: 'Broad, strong' },
    { range: [3100, 2800], name: 'C-H stretching', vibration: 'Aliphatic CH₂, CH₃', intensity: 'Weak to medium' },
    { range: [1750, 1700], name: 'C=O stretching', vibration: 'Carboxyl, ketone', intensity: 'Weak' },
    { range: [1680, 1620], name: 'C=C stretching', vibration: 'Aromatic ring', intensity: 'Medium' },
    { range: [1600, 1500], name: 'C=C aromatic', vibration: 'Aromatic skeleton', intensity: 'Medium' },
    { range: [1460, 1430], name: 'C-H bending', vibration: 'CH₂, CH₃', intensity: 'Medium' },
    { range: [1380, 1350], name: 'C-H bending', vibration: 'CH₃ symmetric', intensity: 'Weak' },
    { range: [1300, 1200], name: 'C-O stretching', vibration: 'Phenolic, ether', intensity: 'Medium' },
    { range: [1200, 1000], name: 'C-O-C stretching', vibration: 'Ether, polysaccharide', intensity: 'Strong' },
    { range: [900, 700], name: 'C-H out-of-plane', vibration: 'Aromatic substitution', intensity: 'Medium' },
    { range: [700, 400], name: 'Si-O-Si', vibration: 'Silicate minerals', intensity: 'Strong' },
];

document.addEventListener('DOMContentLoaded', () => {
    const ftirInput = document.getElementById('ftirFileInput');
    if (ftirInput) {
        ftirInput.addEventListener('change', handleFTIRUpload);
    }
});

function handleFTIRUpload(e) {
    const files = e.target.files;
    if (!files.length) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
        const content = event.target.result;
        parseFTIRData(content, file.name);
    };

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
            if (!isNaN(w) && !isNaN(t)) {
                wavenumber.push(w);
                transmittance.push(t);
                continue;
            }
        }

        parts = line.split(/\t+/);
        if (parts.length >= 2) {
            const w = parseFloat(parts[0]);
            const t = parseFloat(parts[1]);
            if (!isNaN(w) && !isNaN(t)) {
                wavenumber.push(w);
                transmittance.push(t);
            }
        }
    }

    if (wavenumber.length === 0) {
        showNotification('Could not parse FTIR data', 'error');
        return;
    }

    ftirData = { wavenumber, transmittance };
    ftirMode = 'transmittance';
    plotFTIRChart(filename);
    identifyFunctionalGroups();
    showNotification(`Loaded ${wavenumber.length} data points from ${filename}`);
}

function plotFTIRChart(title = 'FTIR Spectrum') {
    const ctx = document.getElementById('ftirChart').getContext('2d');

    if (ftirChart) ftirChart.destroy();

    document.getElementById('ftirChartTitle').textContent = title;

    let data = ftirMode === 'transmittance' ? ftirData.transmittance : 
               ftirData.transmittance.map(t => 2 - Math.log10(t / 100));

    // Normalize transmittance to 0-100%
    if (ftirMode === 'transmittance') {
        const maxT = Math.max(...data);
        data = data.map(t => (t / maxT) * 100);
    }

    ftirChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ftirData.wavenumber.map(w => w.toFixed(1)),
            datasets: [{
                label: ftirMode === 'transmittance' ? 'Transmittance (%)' : 'Absorbance (a.u.)',
                data: data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
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
            interaction: {
                mode: 'index',
                intersect: false
            },
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
                    title: {
                        display: true,
                        text: 'Wavenumber (cm⁻¹)',
                        color: '#64748b',
                        font: { size: 13, weight: 600 }
                    },
                    grid: { color: '#1e293b' }
                },
                y: {
                    title: {
                        display: true,
                        text: ftirMode === 'transmittance' ? 'Transmittance (%)' : 'Absorbance (a.u.)',
                        color: '#64748b',
                        font: { size: 13, weight: 600 }
                    },
                    grid: { color: '#1e293b' }
                }
            }
        }
    });

    document.getElementById('ftirChartInfo').innerHTML = 
        `<span><i class="fas fa-check-circle" style="color: #3b82f6"></i> ${ftirData.wavenumber.length} points | Range: ${ftirData.wavenumber[0].toFixed(1)} - ${ftirData.wavenumber[ftirData.wavenumber.length-1].toFixed(1)} cm⁻¹</span>`;
}

function identifyFunctionalGroups() {
    const tbody = document.getElementById('fgTableBody');
    if (!tbody) return;

    const found = [];

    functionalGroups.forEach(fg => {
        // Find minimum in the range (transmittance dip = absorption peak)
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
            const isDetected = dipDepth > 0.05; // 5% dip threshold

            found.push({
                ...fg,
                detectedWavenumber: minWavenumber,
                dipDepth: dipDepth,
                detected: isDetected
            });
        }
    });

    // Sort by detection confidence
    found.sort((a, b) => b.dipDepth - a.dipDepth);

    tbody.innerHTML = found.map(fg => `
        <tr>
            <td>${fg.detectedWavenumber.toFixed(1)}</td>
            <td><strong>${fg.name}</strong></td>
            <td>${fg.vibration}</td>
            <td>${fg.intensity}</td>
            <td>
                <span style="color: ${fg.detected ? '#10b981' : '#64748b'}; font-weight: 600;">
                    <i class="fas fa-${fg.detected ? 'check-circle' : 'times-circle'}"></i>
                    ${fg.detected ? 'Detected' : 'Not Detected'}
                </span>
            </td>
        </tr>
    `).join('');
}

function toggleFTIRMode() {
    ftirMode = ftirMode === 'transmittance' ? 'absorbance' : 'transmittance';
    if (ftirData.wavenumber.length > 0) {
        plotFTIRChart();
    }
}

function resetFTIRChart() {
    if (ftirChart) {
        ftirChart.destroy();
        ftirChart = null;
    }
    ftirData = { wavenumber: [], transmittance: [] };
    document.getElementById('ftirChartInfo').innerHTML = 
        '<span><i class="fas fa-info-circle"></i> Upload data or select a sample to begin</span>';
    document.getElementById('fgTableBody').innerHTML = 
        '<tr><td colspan="5" class="empty-row">Upload FTIR data to identify functional groups</td></tr>';
}

function exportFTIRChart() {
    if (!ftirChart) {
        showNotification('No chart to export', 'error');
        return;
    }
    const link = document.createElement('a');
    link.download = 'ftir-spectrum.png';
    link.href = ftirChart.toBase64Image();
    link.click();
    showNotification('Chart exported as PNG');
}

// ===== SAMPLE FTIR DATA =====
function loadSampleFTIR(type) {
    let wavenumber = [], transmittance = [];

    if (type === 'raw') {
        // Raw tea branch biochar FTIR
        for (let w = 4000; w >= 400; w -= 2) {
            wavenumber.push(w);
            let t = 85 + Math.random() * 5;
            // O-H broad peak ~3400
            t -= 35 * Math.exp(-Math.pow(w - 3420, 2) / 40000);
            // C-H ~2920, 2850
            t -= 15 * Math.exp(-Math.pow(w - 2920, 2) / 800);
            t -= 10 * Math.exp(-Math.pow(w - 2850, 2) / 800);
            // C=O ~1700
            t -= 12 * Math.exp(-Math.pow(w - 1700, 2) / 400);
            // C=C aromatic ~1600
            t -= 20 * Math.exp(-Math.pow(w - 1600, 2) / 900);
            // C-H bending ~1460, 1380
            t -= 10 * Math.exp(-Math.pow(w - 1460, 2) / 400);
            t -= 8 * Math.exp(-Math.pow(w - 1380, 2) / 400);
            // C-O ~1110
            t -= 18 * Math.exp(-Math.pow(w - 1110, 2) / 900);
            // C-H out of plane ~880, 810, 750
            t -= 8 * Math.exp(-Math.pow(w - 880, 2) / 200);
            t -= 10 * Math.exp(-Math.pow(w - 810, 2) / 200);
            t -= 6 * Math.exp(-Math.pow(w - 750, 2) / 200);
            // Si-O ~470
            t -= 15 * Math.exp(-Math.pow(w - 470, 2) / 400);
            transmittance.push(Math.max(t, 10));
        }
    } else if (type === 'modified') {
        // KOH activated - fewer peaks, more amorphous
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
    }

    ftirData = { wavenumber, transmittance };
    ftirMode = 'transmittance';
    plotFTIRChart(type === 'raw' ? 'Raw Tea Branch Biochar FTIR' : 'KOH-Activated Biochar FTIR');
    identifyFunctionalGroups();
    showNotification('Sample FTIR data loaded');
}
