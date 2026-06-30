// ===== XRD ANALYSIS MODULE =====
let xrdChart = null;
let xrdData = { twoTheta: [], intensity: [] };
let xrdPeaks = [];
let xrdMetadata = {};

Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = '#334155';
Chart.defaults.font.family = 'Inter, sans-serif';

document.addEventListener('DOMContentLoaded', () => {
    const xrdInput = document.getElementById('xrdFileInput');
    if (xrdInput) xrdInput.addEventListener('change', handleXRDUpload);
});

function handleXRDUpload(e) {
    const files = e.target.files;
    if (!files.length) return;
    const file = files[0];
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'xlsx' || ext === 'xls') {
        // Read Excel file using SheetJS
        const reader = new FileReader();
        reader.onload = function(event) {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            // Convert to same format as text files
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
            parseXRDData(content, file.name);
        };
        reader.readAsArrayBuffer(file);
    } else {
        // Read text file (existing code)
        const reader = new FileReader();
        reader.onload = (event) => parseXRDData(event.target.result, file.name);
        reader.readAsText(file);
    }
}

function parseXRDData(content, filename) {
    const lines = content.trim().split('\n');
    const twoTheta = [];
    const intensity = [];

    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#') || line.startsWith('%')) continue;

        let parts = line.split(',');
        if (parts.length >= 2) {
            const t = parseFloat(parts[0]);
            const i = parseFloat(parts[1]);
            if (!isNaN(t) && !isNaN(i)) { twoTheta.push(t); intensity.push(i); continue; }
        }
        parts = line.split(/\t+/);
        if (parts.length >= 2) {
            const t = parseFloat(parts[0]);
            const i = parseFloat(parts[1]);
            if (!isNaN(t) && !isNaN(i)) { twoTheta.push(t); intensity.push(i); }
        }
    }

    if (twoTheta.length === 0) {
        showNotification('Could not parse XRD data', 'error');
        return;
    }

    xrdData = { twoTheta, intensity };
    xrdMetadata = {
        filename: filename,
        totalPoints: twoTheta.length,
        min2Theta: Math.min(...twoTheta),
        max2Theta: Math.max(...twoTheta),
        stepSize: (twoTheta[1] - twoTheta[0]).toFixed(4),
        maxIntensity: Math.max(...intensity),
        minIntensity: Math.min(...intensity),
        meanIntensity: (intensity.reduce((a,b) => a+b, 0) / intensity.length).toFixed(2),
        stdIntensity: Math.sqrt(intensity.reduce((sq, n) => sq + Math.pow(n - intensity.reduce((a,b) => a+b, 0)/intensity.length, 2), 0) / intensity.length).toFixed(2),
        date: new Date().toLocaleString()
    };

    plotXRDChart(filename);
    updateXRDParams();
    updateXRDMetadata();
    showNotification(`Loaded ${twoTheta.length} points from ${filename}`);
}

function plotXRDChart(title = 'XRD Pattern') {
    const ctx = document.getElementById('xrdChart');
    if (!ctx) return;

    if (xrdChart) xrdChart.destroy();

    document.getElementById('xrdChartTitle').textContent = title;

    const maxInt = Math.max(...xrdData.intensity);
    const normalizedInt = xrdData.intensity.map(i => (i / maxInt) * 100);

    xrdChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: xrdData.twoTheta.map(t => t.toFixed(2)),
            datasets: [{
                label: 'Intensity (%)',
                data: normalizedInt,
                borderColor: '#4ec9b0',
                backgroundColor: 'rgba(78, 201, 176, 0.05)',
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
                annotation: { annotations: {} }
            },
            scales: {
                x: {
                    title: { display: true, text: '2θ (degrees)', color: '#64748b', font: { size: 13, weight: 600 } },
                    grid: { color: '#1e293b' }
                },
                y: {
                    title: { display: true, text: 'Intensity (%)', color: '#64748b', font: { size: 13, weight: 600 } },
                    min: 0, max: 105,
                    grid: { color: '#1e293b' }
                }
            }
        }
    });

    document.getElementById('xrdChartInfo').innerHTML = 
        `<span><i class="fas fa-check-circle" style="color: #6366f1"></i> ${xrdData.twoTheta.length} points | Range: ${xrdData.twoTheta[0].toFixed(2)}° - ${xrdData.twoTheta[xrdData.twoTheta.length-1].toFixed(2)}° | Step: ${xrdMetadata.stepSize}°</span>`;
}

function updateXRDParams() {
    const maxInt = Math.max(...xrdData.intensity);
    const minTheta = Math.min(...xrdData.twoTheta);
    const maxTheta = Math.max(...xrdData.twoTheta);

    document.getElementById('xrdRange').textContent = `${minTheta.toFixed(2)}° - ${maxTheta.toFixed(2)}°`;
    document.getElementById('xrdMaxInt').textContent = maxInt.toFixed(0);
    document.getElementById('xrdPeakCount').textContent = '0';
    document.getElementById('xrdFWHM').textContent = '--';
    document.getElementById('xrdCrystallinity').textContent = '--';
    document.getElementById('xrdAvgArea').textContent = '--';
}

function updateXRDMetadata() {
    const panel = document.getElementById('xrdMetadataPanel');
    const grid = document.getElementById('xrdMetadataGrid');
    if (!panel || !grid) return;

    panel.style.display = 'block';
    grid.innerHTML = `
        <div class="metadata-item"><div class="metadata-label">File Name</div><div class="metadata-value">${xrdMetadata.filename}</div></div>
        <div class="metadata-item"><div class="metadata-label">Total Points</div><div class="metadata-value highlight">${xrdMetadata.totalPoints}</div></div>
        <div class="metadata-item"><div class="metadata-label">2θ Range</div><div class="metadata-value">${xrdMetadata.min2Theta.toFixed(2)}° - ${xrdMetadata.max2Theta.toFixed(2)}°</div></div>
        <div class="metadata-item"><div class="metadata-label">Step Size</div><div class="metadata-value">${xrdMetadata.stepSize}°</div></div>
        <div class="metadata-item"><div class="metadata-label">Max Intensity</div><div class="metadata-value highlight">${xrdMetadata.maxIntensity.toFixed(0)} cps</div></div>
        <div class="metadata-item"><div class="metadata-label">Mean Intensity</div><div class="metadata-value">${xrdMetadata.meanIntensity} cps</div></div>
        <div class="metadata-item"><div class="metadata-label">Std Deviation</div><div class="metadata-value">${xrdMetadata.stdIntensity} cps</div></div>
        <div class="metadata-item"><div class="metadata-label">Loaded</div><div class="metadata-value">${xrdMetadata.date}</div></div>
    `;
}

function detectPeaks() {
    if (!xrdData.twoTheta.length) { showNotification('Upload XRD data first', 'error'); return; }

    const threshold = parseInt(document.getElementById('peakThreshold').value) || 10;
    const smoothLevel = parseInt(document.getElementById('smoothFactor').value) || 5;
    const peakWidth = parseInt(document.getElementById('peakWidth').value) || 5;

    let smoothed = [...xrdData.intensity];
    for (let s = 0; s < smoothLevel; s++) {
        const temp = [];
        for (let i = 0; i < smoothed.length; i++) {
            const window = [];
            for (let j = Math.max(0, i - 2); j <= Math.min(smoothed.length - 1, i + 2); j++) window.push(smoothed[j]);
            temp.push(window.reduce((a, b) => a + b, 0) / window.length);
        }
        smoothed = temp;
    }

    xrdPeaks = [];
    const maxInt = Math.max(...smoothed);
    const thresholdVal = maxInt * (threshold / 100);
    const halfWindow = Math.floor(peakWidth / 2);

    for (let i = halfWindow; i < smoothed.length - halfWindow; i++) {
        let isPeak = true;
        for (let j = 1; j <= halfWindow; j++) {
            if (smoothed[i] <= smoothed[i-j] || smoothed[i] <= smoothed[i+j]) { isPeak = false; break; }
        }

        if (isPeak && smoothed[i] > thresholdVal) {
            const y1 = smoothed[i-1], y2 = smoothed[i], y3 = smoothed[i+1];
            const x2 = xrdData.twoTheta[i];
            const a = (y1 - 2*y2 + y3) / 2;
            const b = (y3 - y1) / 2;
            let peakShift = a !== 0 ? -b / (2 * a) : 0;
            const peakTheta = x2 + peakShift * (xrdData.twoTheta[i+1] - xrdData.twoTheta[i-1]) / 2;
            const peakInt = y2 + a * peakShift * peakShift + b * peakShift;

            // FWHM
            const halfMax = peakInt / 2;
            let leftIdx = i, rightIdx = i;
            while (leftIdx > 0 && smoothed[leftIdx] > halfMax) leftIdx--;
            while (rightIdx < smoothed.length - 1 && smoothed[rightIdx] > halfMax) rightIdx++;
            const fwhm = xrdData.twoTheta[rightIdx] - xrdData.twoTheta[leftIdx];

            // Peak area (trapezoidal)
            let area = 0;
            for (let k = leftIdx; k < rightIdx; k++) {
                area += (smoothed[k] + smoothed[k+1]) / 2 * (xrdData.twoTheta[k+1] - xrdData.twoTheta[k]);
            }

            // Scherrer equation for crystallite size (assuming K=0.9)
            const wavelength = parseFloat(document.getElementById('wavelength').value) || 1.5406;
            const thetaRad = (peakTheta * Math.PI) / 360;
            const fwhmRad = fwhm * Math.PI / 180;
            const crystalliteSize = fwhmRad > 0 ? (0.9 * wavelength) / (fwhmRad * Math.cos(thetaRad)) : 0;

            xrdPeaks.push({
                theta: peakTheta,
                intensity: peakInt,
                fwhm: fwhm,
                relativeIntensity: (peakInt / maxInt) * 100,
                area: area,
                crystalliteSize: crystalliteSize,
                dSpacing: wavelength / (2 * Math.sin(thetaRad))
            });
        }
    }

    xrdPeaks.sort((a, b) => b.intensity - a.intensity);

    updatePeakAnnotations();
    updatePeakList();
    updateDetailedPeakTable();
    updateXRDPeakParams();

    showNotification(`Detected ${xrdPeaks.length} peaks`);
}

function updatePeakAnnotations() {
    if (!xrdChart) return;
    const annotations = {};
    xrdPeaks.slice(0, 10).forEach((peak, idx) => {
        annotations[`peak${idx}`] = {
            type: 'line',
            xMin: peak.theta, xMax: peak.theta,
            borderColor: 'rgba(206, 145, 120, 0.6)',
            borderWidth: 1, borderDash: [4, 4],
            label: { display: true, content: `${peak.theta.toFixed(2)}°`, position: 'top', color: '#ce9178', font: { size: 10 } }
        };
    });
    xrdChart.options.plugins.annotation.annotations = annotations;
    xrdChart.update('none');
}

function updatePeakList() {
    const list = document.getElementById('peakList');
    if (!list) return;
    if (xrdPeaks.length === 0) { list.innerHTML = '<p class="empty-state">No peaks detected</p>'; return; }

    list.innerHTML = xrdPeaks.slice(0, 15).map((peak, idx) => `
        <div class="peak-item">
            <span class="peak-angle">${peak.theta.toFixed(3)}°</span>
            <span class="peak-intensity">I = ${peak.relativeIntensity.toFixed(1)}% | FWHM = ${peak.fwhm.toFixed(3)}°</span>
        </div>
    `).join('');
}

function updateDetailedPeakTable() {
    const tbody = document.getElementById('detailedPeakTableBody');
    if (!tbody) return;
    if (xrdPeaks.length === 0) { tbody.innerHTML = '<tr><td colspan="8" class="empty-row">Upload data and detect peaks</td></tr>'; return; }

    tbody.innerHTML = xrdPeaks.map((peak, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td><strong>${peak.theta.toFixed(3)}</strong></td>
            <td>${peak.intensity.toFixed(0)}</td>
            <td>${peak.relativeIntensity.toFixed(1)}%</td>
            <td>${peak.fwhm.toFixed(3)}</td>
            <td>${peak.dSpacing.toFixed(4)}</td>
            <td>${peak.area.toFixed(1)}</td>
            <td>${peak.crystalliteSize > 0 ? peak.crystalliteSize.toFixed(2) + ' nm' : '--'}</td>
        </tr>
    `).join('');
}

function updateXRDPeakParams() {
    document.getElementById('xrdPeakCount').textContent = xrdPeaks.length;

    if (xrdPeaks.length > 0) {
        const avgFWHM = xrdPeaks.reduce((sum, p) => sum + p.fwhm, 0) / xrdPeaks.length;
        document.getElementById('xrdFWHM').textContent = avgFWHM.toFixed(3) + '°';

        // Crystallinity index (approximate: ratio of peak area to total area)
        const totalArea = xrdPeaks.reduce((sum, p) => sum + p.area, 0);
        const baselineArea = xrdData.intensity.reduce((sum, i) => sum + i, 0) * (xrdData.twoTheta[1] - xrdData.twoTheta[0]);
        const crystallinity = baselineArea > 0 ? (totalArea / baselineArea * 100).toFixed(1) : '--';
        document.getElementById('xrdCrystallinity').textContent = crystallinity + '%';

        const avgArea = totalArea / xrdPeaks.length;
        document.getElementById('xrdAvgArea').textContent = avgArea.toFixed(1);
    }
}

function smoothData() {
    const val = document.getElementById('smoothFactor').value;
    document.getElementById('smoothFactorVal').textContent = val;
    if (xrdData.twoTheta.length > 0) detectPeaks();
}

function calculateDSpacing() {
    if (!xrdPeaks.length) { showNotification('Detect peaks first', 'error'); return; }

    const wavelength = parseFloat(document.getElementById('wavelength').value) || 1.5406;
    const list = document.getElementById('dSpacingList');

    list.innerHTML = xrdPeaks.slice(0, 10).map(peak => `
        <div class="d-spacing-item">
            <span class="d-value">d = ${peak.dSpacing.toFixed(4)} Å</span>
            <span class="d-theta">2θ = ${peak.theta.toFixed(2)}° | Size = ${peak.crystalliteSize > 0 ? peak.crystalliteSize.toFixed(2) + ' nm' : '--'}</span>
        </div>
    `).join('');
}

function resetXRDChart() {
    if (xrdChart) { xrdChart.options.plugins.annotation.annotations = {}; xrdChart.update(); }
    xrdPeaks = [];
    document.getElementById('peakList').innerHTML = '<p class="empty-state">No peaks detected</p>';
    document.getElementById('dSpacingList').innerHTML = '<p class="empty-state">Detect peaks to calculate d-spacing</p>';
    document.getElementById('detailedPeakTableBody').innerHTML = '<tr><td colspan="8" class="empty-row">Upload data and detect peaks</td></tr>';
    document.getElementById('xrdPeakCount').textContent = '0';
    document.getElementById('xrdFWHM').textContent = '--';
    document.getElementById('xrdCrystallinity').textContent = '--';
    document.getElementById('xrdAvgArea').textContent = '--';
}

function toggleXRDGrid() {
    if (!xrdChart) return;
    const show = xrdChart.options.scales.x.grid.color !== 'transparent';
    xrdChart.options.scales.x.grid.color = show ? 'transparent' : '#1e293b';
    xrdChart.options.scales.y.grid.color = show ? 'transparent' : '#1e293b';
    xrdChart.update();
}

function exportXRDChart(dpi) {
    if (dpi === 'white') {
        exportChartWhiteBG(xrdChart, 300, 'xrd-pattern-white-bg.png');
    } else {
        exportChartAtDPI(xrdChart, dpi, `xrd-pattern-${dpi}dpi.png`);
    }
}

function exportXRDData(format) {
    if (!xrdData.twoTheta.length) { showNotification('No data to export', 'error'); return; }

    let content = '';
    if (format === 'csv') {
        content = '2theta_degrees,Intensity_cps\n';
        for (let i = 0; i < xrdData.twoTheta.length; i++) {
            content += `${xrdData.twoTheta[i].toFixed(4)},${xrdData.intensity[i].toFixed(2)}\n`;
        }
    } else {
        content = 'XRD Data\n========\n';
        for (let i = 0; i < xrdData.twoTheta.length; i++) {
            content += `${xrdData.twoTheta[i].toFixed(4)}\t${xrdData.intensity[i].toFixed(2)}\n`;
        }
    }

    if (xrdPeaks.length > 0) {
        content += '\n\nPeak Data\n=========\n';
        content += 'Peak#,2theta,Intensity,Relative%,FWHM,d-spacing,Area,CrystalliteSize_nm\n';
        xrdPeaks.forEach((peak, idx) => {
            content += `${idx+1},${peak.theta.toFixed(4)},${peak.intensity.toFixed(0)},${peak.relativeIntensity.toFixed(2)},${peak.fwhm.toFixed(4)},${peak.dSpacing.toFixed(4)},${peak.area.toFixed(1)},${peak.crystalliteSize.toFixed(2)}\n`;
        });
    }

    downloadFile(content, `xrd-data.${format}`, format === 'csv' ? 'text/csv' : 'text/plain');
    showNotification(`Data exported as ${format.toUpperCase()}`);
}

function exportPeakData() {
    if (!xrdPeaks.length) { showNotification('No peaks to export', 'error'); return; }

    let csv = 'Peak #,2θ (°),Intensity (cps),Relative Intensity (%),FWHM (°),d-spacing (Å),Peak Area,Crystallite Size (nm)\n';
    xrdPeaks.forEach((peak, idx) => {
        csv += `${idx+1},${peak.theta.toFixed(4)},${peak.intensity.toFixed(0)},${peak.relativeIntensity.toFixed(2)},${peak.fwhm.toFixed(4)},${peak.dSpacing.toFixed(4)},${peak.area.toFixed(1)},${peak.crystalliteSize.toFixed(2)}\n`;
    });

    downloadFile(csv, 'xrd-peak-data.csv', 'text/csv');
    showNotification('Peak data exported as CSV');
}

function exportXRDReport() {
    if (!xrdData.twoTheta.length) { showNotification('No data to export', 'error'); return; }

    let report = `XRD ANALYSIS REPORT\n====================\n\n`;
    report += `File: ${xrdMetadata.filename}\n`;
    report += `Date: ${xrdMetadata.date}\n`;
    report += `Instrument: ${document.getElementById('instrument')?.value || 'Not specified'}\n`;
    report += `Wavelength: ${document.getElementById('wavelength')?.value || '1.5406'} Å\n\n`;
    report += `DATA SUMMARY\n-------------\n`;
    report += `Total Points: ${xrdMetadata.totalPoints}\n`;
    report += `2θ Range: ${xrdMetadata.min2Theta.toFixed(2)}° - ${xrdMetadata.max2Theta.toFixed(2)}°\n`;
    report += `Step Size: ${xrdMetadata.stepSize}°\n`;
    report += `Max Intensity: ${xrdMetadata.maxIntensity.toFixed(0)} cps\n\n`;
    report += `PEAK DATA\n---------\n`;
    report += `Total Peaks Detected: ${xrdPeaks.length}\n\n`;
    if (xrdPeaks.length > 0) {
        report += '#\t2θ (°)\tIntensity\tRel%\tFWHM (°)\td (Å)\tArea\tSize (nm)\n';
        xrdPeaks.forEach((p, i) => {
            report += `${i+1}\t${p.theta.toFixed(3)}\t${p.intensity.toFixed(0)}\t${p.relativeIntensity.toFixed(1)}\t${p.fwhm.toFixed(3)}\t${p.dSpacing.toFixed(4)}\t${p.area.toFixed(1)}\t${p.crystalliteSize.toFixed(2)}\n`;
        });
    }

    downloadFile(report, 'xrd-analysis-report.txt', 'text/plain');
    showNotification('Full report exported');
}

// Sample data
function loadSampleXRD(type) {
    let twoTheta = [], intensity = [];

    if (type === 'biochar') {
        for (let t = 10; t <= 80; t += 0.05) {
            twoTheta.push(t);
            let int = 200 + Math.random() * 50;
            int += 3000 * Math.exp(-Math.pow(t - 23.5, 2) / 8);
            int += 1500 * Math.exp(-Math.pow(t - 43.2, 2) / 12);
            int += 800 * Math.exp(-Math.pow(t - 26.5, 2) / 3);
            intensity.push(int);
        }
    } else if (type === 'activated') {
        for (let t = 10; t <= 80; t += 0.05) {
            twoTheta.push(t);
            let int = 300 + Math.random() * 80;
            int += 2500 * Math.exp(-Math.pow(t - 24.0, 2) / 15);
            int += 1000 * Math.exp(-Math.pow(t - 44.0, 2) / 18);
            intensity.push(int);
        }
    } else if (type === 'composite') {
        for (let t = 10; t <= 80; t += 0.05) {
            twoTheta.push(t);
            let int = 250 + Math.random() * 60;
            int += 2000 * Math.exp(-Math.pow(t - 23.0, 2) / 10);
            int += 800 * Math.exp(-Math.pow(t - 43.5, 2) / 14);
            int += 3500 * Math.exp(-Math.pow(t - 30.1, 2) / 0.8);
            int += 2000 * Math.exp(-Math.pow(t - 35.5, 2) / 0.8);
            int += 1800 * Math.exp(-Math.pow(t - 43.1, 2) / 0.8);
            int += 1200 * Math.exp(-Math.pow(t - 53.5, 2) / 0.8);
            int += 1000 * Math.exp(-Math.pow(t - 57.0, 2) / 0.8);
            int += 800 * Math.exp(-Math.pow(t - 62.6, 2) / 0.8);
            intensity.push(int);
        }
    } else if (type === 'zno') {
        for (let t = 20; t <= 80; t += 0.05) {
            twoTheta.push(t);
            let int = 100 + Math.random() * 30;
            int += 5000 * Math.exp(-Math.pow(t - 31.77, 2) / 0.5);
            int += 3000 * Math.exp(-Math.pow(t - 34.42, 2) / 0.5);
            int += 2500 * Math.exp(-Math.pow(t - 36.25, 2) / 0.5);
            int += 1500 * Math.exp(-Math.pow(t - 47.54, 2) / 0.5);
            int += 1200 * Math.exp(-Math.pow(t - 56.60, 2) / 0.5);
            int += 1000 * Math.exp(-Math.pow(t - 62.86, 2) / 0.5);
            int += 800 * Math.exp(-Math.pow(t - 67.96, 2) / 0.5);
            intensity.push(int);
        }
    } else if (type === 'tio2') {
        for (let t = 20; t <= 80; t += 0.05) {
            twoTheta.push(t);
            let int = 80 + Math.random() * 20;
            int += 4000 * Math.exp(-Math.pow(t - 25.28, 2) / 0.4);
            int += 2000 * Math.exp(-Math.pow(t - 37.80, 2) / 0.4);
            int += 1500 * Math.exp(-Math.pow(t - 48.05, 2) / 0.4);
            int += 1200 * Math.exp(-Math.pow(t - 53.89, 2) / 0.4);
            int += 1000 * Math.exp(-Math.pow(t - 55.06, 2) / 0.4);
            int += 800 * Math.exp(-Math.pow(t - 62.69, 2) / 0.4);
            intensity.push(int);
        }
    }

    xrdData = { twoTheta, intensity };
    xrdMetadata = {
        filename: type + '-sample.xrd',
        totalPoints: twoTheta.length,
        min2Theta: Math.min(...twoTheta),
        max2Theta: Math.max(...twoTheta),
        stepSize: (twoTheta[1] - twoTheta[0]).toFixed(4),
        maxIntensity: Math.max(...intensity),
        minIntensity: Math.min(...intensity),
        meanIntensity: (intensity.reduce((a,b) => a+b, 0) / intensity.length).toFixed(2),
        stdIntensity: Math.sqrt(intensity.reduce((sq, n) => sq + Math.pow(n - intensity.reduce((a,b) => a+b, 0)/intensity.length, 2), 0) / intensity.length).toFixed(2),
        date: new Date().toLocaleString()
    };

    const titles = {
        biochar: 'Tea Branch Biochar XRD',
        activated: 'KOH-Activated Carbon XRD',
        composite: 'Fe-Modified Biochar XRD',
        zno: 'ZnO Nanoparticles XRD',
        tio2: 'TiO₂ Anatase XRD'
    };
    plotXRDChart(titles[type] || 'XRD Pattern');
    updateXRDParams();
    updateXRDMetadata();
    showNotification('Sample XRD data loaded');
}

document.addEventListener('DOMContentLoaded', () => {
    const peakThreshold = document.getElementById('peakThreshold');
    if (peakThreshold) {
        peakThreshold.addEventListener('input', (e) => {
            document.getElementById('peakThresholdVal').textContent = e.target.value + '%';
        });
    }
    const peakWidth = document.getElementById('peakWidth');
    if (peakWidth) {
        peakWidth.addEventListener('input', (e) => {
            document.getElementById('peakWidthVal').textContent = e.target.value;
        });
    }
});
