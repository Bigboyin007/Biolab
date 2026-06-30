// ===== XRD ANALYSIS MODULE =====
let xrdChart = null;
let xrdData = { twoTheta: [], intensity: [] };
let xrdPeaks = [];

// Chart.js default config for dark theme
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = '#334155';
Chart.defaults.font.family = 'Inter, sans-serif';

// Initialize XRD file input
document.addEventListener('DOMContentLoaded', () => {
    const xrdInput = document.getElementById('xrdFileInput');
    if (xrdInput) {
        xrdInput.addEventListener('change', handleXRDUpload);
    }
});

function handleXRDUpload(e) {
    const files = e.target.files;
    if (!files.length) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
        const content = event.target.result;
        parseXRDData(content, file.name);
    };

    reader.readAsText(file);
}

function parseXRDData(content, filename) {
    const lines = content.trim().split('
');
    const twoTheta = [];
    const intensity = [];

    // Try different formats
    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#') || line.startsWith('%')) continue;

        // Try comma-separated
        let parts = line.split(',');
        if (parts.length >= 2) {
            const t = parseFloat(parts[0]);
            const i = parseFloat(parts[1]);
            if (!isNaN(t) && !isNaN(i)) {
                twoTheta.push(t);
                intensity.push(i);
                continue;
            }
        }

        // Try tab-separated
        parts = line.split(/	+/);
        if (parts.length >= 2) {
            const t = parseFloat(parts[0]);
            const i = parseFloat(parts[1]);
            if (!isNaN(t) && !isNaN(i)) {
                twoTheta.push(t);
                intensity.push(i);
                continue;
            }
        }

        // Try space-separated (2 or more spaces)
        parts = line.split(/\s{2,}/);
        if (parts.length >= 2) {
            const t = parseFloat(parts[0]);
            const i = parseFloat(parts[1]);
            if (!isNaN(t) && !isNaN(i)) {
                twoTheta.push(t);
                intensity.push(i);
            }
        }
    }

    if (twoTheta.length === 0) {
        showNotification('Could not parse XRD data. Please check file format.', 'error');
        return;
    }

    xrdData = { twoTheta, intensity };
    plotXRDChart(filename);
    updateXRDParams();
    showNotification(`Loaded ${twoTheta.length} data points from ${filename}`);
}

function plotXRDChart(title = 'XRD Pattern') {
    const ctx = document.getElementById('xrdChart').getContext('2d');

    if (xrdChart) {
        xrdChart.destroy();
    }

    document.getElementById('xrdChartTitle').textContent = title;

    // Normalize intensity to percentage
    const maxInt = Math.max(...xrdData.intensity);
    const normalizedInt = xrdData.intensity.map(i => (i / maxInt) * 100);

    xrdChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: xrdData.twoTheta.map(t => t.toFixed(2)),
            datasets: [{
                label: 'Intensity (%)',
                data: normalizedInt,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
                        title: (items) => `2θ = ${items[0].label}°`,
                        label: (item) => `Intensity: ${item.raw.toFixed(2)}%`
                    }
                },
                annotation: {
                    annotations: {}
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '2θ (degrees)',
                        color: '#64748b',
                        font: { size: 13, weight: 600 }
                    },
                    grid: { color: '#1e293b' }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Intensity (%)',
                        color: '#64748b',
                        font: { size: 13, weight: 600 }
                    },
                    min: 0,
                    max: 105,
                    grid: { color: '#1e293b' }
                }
            }
        }
    });

    document.getElementById('xrdChartInfo').innerHTML = 
        `<span><i class="fas fa-check-circle" style="color: #10b981"></i> ${xrdData.twoTheta.length} points | Range: ${xrdData.twoTheta[0].toFixed(2)}° - ${xrdData.twoTheta[xrdData.twoTheta.length-1].toFixed(2)}°</span>`;
}

function updateXRDParams() {
    const maxInt = Math.max(...xrdData.intensity);
    const minTheta = Math.min(...xrdData.twoTheta);
    const maxTheta = Math.max(...xrdData.twoTheta);

    document.getElementById('xrdRange').textContent = `${minTheta.toFixed(2)}° - ${maxTheta.toFixed(2)}°`;
    document.getElementById('xrdMaxInt').textContent = maxInt.toFixed(0);
    document.getElementById('xrdPeakCount').textContent = '0';
    document.getElementById('xrdFWHM').textContent = '--';
}

function detectPeaks() {
    if (!xrdData.twoTheta.length) {
        showNotification('Please upload XRD data first', 'error');
        return;
    }

    const threshold = parseInt(document.getElementById('peakThreshold').value) || 10;
    const smoothLevel = parseInt(document.getElementById('smoothFactor').value) || 5;

    // Smooth data using moving average
    let smoothed = [...xrdData.intensity];
    if (smoothLevel > 0) {
        for (let s = 0; s < smoothLevel; s++) {
            const temp = [];
            for (let i = 0; i < smoothed.length; i++) {
                const window = [];
                for (let j = Math.max(0, i - 2); j <= Math.min(smoothed.length - 1, i + 2); j++) {
                    window.push(smoothed[j]);
                }
                temp.push(window.reduce((a, b) => a + b, 0) / window.length);
            }
            smoothed = temp;
        }
    }

    // Find peaks
    xrdPeaks = [];
    const maxInt = Math.max(...smoothed);
    const thresholdVal = maxInt * (threshold / 100);

    for (let i = 2; i < smoothed.length - 2; i++) {
        if (smoothed[i] > thresholdVal &&
            smoothed[i] > smoothed[i-1] && 
            smoothed[i] > smoothed[i-2] &&
            smoothed[i] > smoothed[i+1] && 
            smoothed[i] > smoothed[i+2]) {

            // Quadratic interpolation for more precise peak position
            const y1 = smoothed[i-1], y2 = smoothed[i], y3 = smoothed[i+1];
            const x1 = xrdData.twoTheta[i-1], x2 = xrdData.twoTheta[i], x3 = xrdData.twoTheta[i+1];

            const a = (y1 - 2*y2 + y3) / 2;
            const b = (y3 - y1) / 2;
            let peakShift = 0;
            if (a !== 0) peakShift = -b / (2 * a);

            const peakTheta = x2 + peakShift * (x3 - x1) / 2;
            const peakInt = y2 + a * peakShift * peakShift + b * peakShift;

            // Calculate FWHM
            const halfMax = peakInt / 2;
            let leftIdx = i, rightIdx = i;
            while (leftIdx > 0 && smoothed[leftIdx] > halfMax) leftIdx--;
            while (rightIdx < smoothed.length - 1 && smoothed[rightIdx] > halfMax) rightIdx++;

            const fwhm = xrdData.twoTheta[rightIdx] - xrdData.twoTheta[leftIdx];

            xrdPeaks.push({
                theta: peakTheta,
                intensity: peakInt,
                fwhm: fwhm,
                relativeIntensity: (peakInt / maxInt) * 100
            });
        }
    }

    // Sort by intensity (descending)
    xrdPeaks.sort((a, b) => b.intensity - a.intensity);

    // Update chart with peak annotations
    updatePeakAnnotations();
    updatePeakList();
    updateXRDPeakParams();

    showNotification(`Detected ${xrdPeaks.length} peaks`);
}

function updatePeakAnnotations() {
    if (!xrdChart) return;

    const annotations = {};
    xrdPeaks.slice(0, 10).forEach((peak, idx) => {
        annotations[`peak${idx}`] = {
            type: 'line',
            xMin: peak.theta,
            xMax: peak.theta,
            borderColor: 'rgba(245, 158, 11, 0.6)',
            borderWidth: 1,
            borderDash: [4, 4],
            label: {
                display: true,
                content: `${peak.theta.toFixed(2)}°`,
                position: 'top',
                color: '#fbbf24',
                font: { size: 10 }
            }
        };
    });

    xrdChart.options.plugins.annotation.annotations = annotations;
    xrdChart.update('none');
}

function updatePeakList() {
    const list = document.getElementById('peakList');
    if (xrdPeaks.length === 0) {
        list.innerHTML = '<p class="empty-state">No peaks detected</p>';
        return;
    }

    list.innerHTML = xrdPeaks.slice(0, 15).map((peak, idx) => `
        <div class="peak-item">
            <span class="peak-angle">${peak.theta.toFixed(3)}°</span>
            <span class="peak-intensity">I = ${peak.relativeIntensity.toFixed(1)}%</span>
        </div>
    `).join('');
}

function updateXRDPeakParams() {
    document.getElementById('xrdPeakCount').textContent = xrdPeaks.length;

    if (xrdPeaks.length > 0) {
        const avgFWHM = xrdPeaks.reduce((sum, p) => sum + p.fwhm, 0) / xrdPeaks.length;
        document.getElementById('xrdFWHM').textContent = avgFWHM.toFixed(3) + '°';
    }
}

function smoothData() {
    const val = document.getElementById('smoothFactor').value;
    document.getElementById('smoothFactorVal').textContent = val;
    if (xrdData.twoTheta.length > 0) {
        detectPeaks();
    }
}

function calculateDSpacing() {
    if (!xrdPeaks.length) {
        showNotification('Detect peaks first', 'error');
        return;
    }

    const wavelength = parseFloat(document.getElementById('wavelength').value) || 1.5406;
    const list = document.getElementById('dSpacingList');

    list.innerHTML = xrdPeaks.slice(0, 10).map(peak => {
        const thetaRad = (peak.theta * Math.PI) / 360; // θ in radians
        const d = wavelength / (2 * Math.sin(thetaRad));
        return `
            <div class="d-spacing-item">
                <span class="d-value">d = ${d.toFixed(4)} Å</span>
                <span class="d-theta">at 2θ = ${peak.theta.toFixed(2)}°</span>
            </div>
        `;
    }).join('');
}

function resetXRDChart() {
    if (xrdChart) {
        xrdChart.options.plugins.annotation.annotations = {};
        xrdChart.update();
    }
    xrdPeaks = [];
    document.getElementById('peakList').innerHTML = '<p class="empty-state">No peaks detected</p>';
    document.getElementById('dSpacingList').innerHTML = '<p class="empty-state">Select peaks to calculate d-spacing</p>';
    document.getElementById('xrdPeakCount').textContent = '0';
    document.getElementById('xrdFWHM').textContent = '--';
}

function toggleXRDGrid() {
    if (!xrdChart) return;
    const show = xrdChart.options.scales.x.grid.color !== 'transparent';
    xrdChart.options.scales.x.grid.color = show ? 'transparent' : '#1e293b';
    xrdChart.options.scales.y.grid.color = show ? 'transparent' : '#1e293b';
    xrdChart.update();
}

function exportXRDChart() {
    if (!xrdChart) {
        showNotification('No chart to export', 'error');
        return;
    }
    const link = document.createElement('a');
    link.download = 'xrd-pattern.png';
    link.href = xrdChart.toBase64Image();
    link.click();
    showNotification('Chart exported as PNG');
}

function exportXRDData() {
    if (!xrdData.twoTheta.length) {
        showNotification('No data to export', 'error');
        return;
    }

    let csv = '2θ (degrees),Intensity\n';
    for (let i = 0; i < xrdData.twoTheta.length; i++) {
        csv += `${xrdData.twoTheta[i].toFixed(4)},${xrdData.intensity[i].toFixed(2)}\n`;
    }

    if (xrdPeaks.length > 0) {
        csv += '\nPeak Data\n';
        csv += 'Peak #,2θ (degrees),Relative Intensity (%),FWHM (degrees)\n';
        xrdPeaks.forEach((peak, idx) => {
            csv += `${idx+1},${peak.theta.toFixed(4)},${peak.relativeIntensity.toFixed(2)},${peak.fwhm.toFixed(4)}\n`;
        });
    }

    downloadFile(csv, 'xrd-data.csv', 'text/csv');
    showNotification('Data exported as CSV');
}

// ===== SAMPLE XRD DATA =====
function loadSampleXRD(type) {
    let twoTheta = [], intensity = [];

    if (type === 'biochar') {
        // Tea branch biochar XRD pattern (amorphous carbon with some crystallinity)
        for (let t = 10; t <= 80; t += 0.05) {
            twoTheta.push(t);
            let int = 200 + Math.random() * 50;
            // Broad peak at ~23° (002) for amorphous carbon
            int += 3000 * Math.exp(-Math.pow(t - 23.5, 2) / 8);
            // Broad peak at ~43° (100) for carbon
            int += 1500 * Math.exp(-Math.pow(t - 43.2, 2) / 12);
            // Small peak at ~26° (graphite)
            int += 800 * Math.exp(-Math.pow(t - 26.5, 2) / 3);
            intensity.push(int);
        }
    } else if (type === 'activated') {
        // KOH activated carbon - more amorphous
        for (let t = 10; t <= 80; t += 0.05) {
            twoTheta.push(t);
            let int = 300 + Math.random() * 80;
            int += 2500 * Math.exp(-Math.pow(t - 24.0, 2) / 15);
            int += 1000 * Math.exp(-Math.pow(t - 44.0, 2) / 18);
            intensity.push(int);
        }
    } else if (type === 'composite') {
        // Fe-modified biochar with Fe3O4 peaks
        for (let t = 10; t <= 80; t += 0.05) {
            twoTheta.push(t);
            let int = 250 + Math.random() * 60;
            // Carbon peaks
            int += 2000 * Math.exp(-Math.pow(t - 23.0, 2) / 10);
            int += 800 * Math.exp(-Math.pow(t - 43.5, 2) / 14);
            // Fe3O4 peaks
            int += 3500 * Math.exp(-Math.pow(t - 30.1, 2) / 0.8);
            int += 2000 * Math.exp(-Math.pow(t - 35.5, 2) / 0.8);
            int += 1800 * Math.exp(-Math.pow(t - 43.1, 2) / 0.8);
            int += 1200 * Math.exp(-Math.pow(t - 53.5, 2) / 0.8);
            int += 1000 * Math.exp(-Math.pow(t - 57.0, 2) / 0.8);
            int += 800 * Math.exp(-Math.pow(t - 62.6, 2) / 0.8);
            intensity.push(int);
        }
    }

    xrdData = { twoTheta, intensity };
    plotXRDChart(type === 'biochar' ? 'Tea Branch Biochar XRD' : 
                 type === 'activated' ? 'KOH-Activated Carbon XRD' : 'Fe-Modified Biochar XRD');
    updateXRDParams();
    showNotification('Sample XRD data loaded');
}

// Update threshold display
document.addEventListener('DOMContentLoaded', () => {
    const peakThreshold = document.getElementById('peakThreshold');
    if (peakThreshold) {
        peakThreshold.addEventListener('input', (e) => {
            document.getElementById('peakThresholdVal').textContent = e.target.value + '%';
        });
    }
});
