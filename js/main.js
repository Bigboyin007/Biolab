// ===== MAIN SHARED JS =====

// Toggle download dropdown menu
function toggleDownloadMenu(menuId) {
    const menu = document.getElementById(menuId);
    if (!menu) return;
    document.querySelectorAll('.download-menu').forEach(m => {
        if (m.id !== menuId) m.classList.remove('show');
    });
    menu.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.download-dropdown')) {
        document.querySelectorAll('.download-menu').forEach(m => m.classList.remove('show'));
    }
});

// Show notification
function showNotification(message, type = 'success') {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'};
        color: white;
        border-radius: 12px;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        font-size: 0.9rem;
    `;
    notif.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);

// Download file helper
function downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Export chart with white background and NO grid
function exportChartWhiteBG(chart, dpi, filename) {
    if (!chart) {
        showNotification('No chart to export', 'error');
        return;
    }

    const scale = dpi / 96;
    const originalWidth = chart.width;
    const originalHeight = chart.height;

    // Save original settings
    const origXGrid = chart.options.scales.x.grid.color;
    const origYGrid = chart.options.scales.y.grid.color;
    const origXColor = chart.options.scales.x.ticks.color;
    const origYColor = chart.options.scales.y.ticks.color;
    const origXTitleColor = chart.options.scales.x.title?.color;
    const origYTitleColor = chart.options.scales.y.title?.color;
    const origBorder = chart.options.scales.x.border?.color;

    // Apply white background settings
    chart.options.scales.x.grid.color = 'transparent';
    chart.options.scales.y.grid.color = 'transparent';
    chart.options.scales.x.ticks.color = '#333333';
    chart.options.scales.y.ticks.color = '#333333';
    if (chart.options.scales.x.title) chart.options.scales.x.title.color = '#333333';
    if (chart.options.scales.y.title) chart.options.scales.y.title.color = '#333333';

    // Temporarily resize for high DPI
    chart.resize(originalWidth * scale, originalHeight * scale);
    chart.update('none');

    // Create a temporary canvas with white background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = chart.canvas.width;
    tempCanvas.height = chart.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Fill white background
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw chart on top
    tempCtx.drawImage(chart.canvas, 0, 0);

    // Export
    const link = document.createElement('a');
    link.download = filename;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();

    // Restore original settings
    chart.options.scales.x.grid.color = origXGrid;
    chart.options.scales.y.grid.color = origYGrid;
    chart.options.scales.x.ticks.color = origXColor;
    chart.options.scales.y.ticks.color = origYColor;
    if (chart.options.scales.x.title) chart.options.scales.x.title.color = origXTitleColor;
    if (chart.options.scales.y.title) chart.options.scales.y.title.color = origYTitleColor;

    chart.resize(originalWidth, originalHeight);
    chart.update('none');

    showNotification(`Chart exported: ${filename}`);
}

// Export chart at specific DPI (dark theme, with grid)
function exportChartAtDPI(chart, dpi, filename) {
    if (!chart) {
        showNotification('No chart to export', 'error');
        return;
    }

    const scale = dpi / 96;
    const originalWidth = chart.width;
    const originalHeight = chart.height;

    chart.resize(originalWidth * scale, originalHeight * scale);
    chart.update('none');

    const link = document.createElement('a');
    link.download = filename;
    link.href = chart.toBase64Image();
    link.click();

    chart.resize(originalWidth, originalHeight);
    chart.update('none');

    showNotification(`Chart exported at ${dpi} DPI`);
}

// Drag and drop setup
function setupDragDrop(areaId, inputId) {
    const area = document.getElementById(areaId);
    const input = document.getElementById(inputId);
    if (!area || !input) return;

    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('dragover');
    });
    area.addEventListener('dragleave', () => area.classList.remove('dragover'));
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            input.files = e.dataTransfer.files;
            input.dispatchEvent(new Event('change'));
        }
    });
    area.addEventListener('click', () => input.click());
}

// Format number
function formatNumber(num, decimals = 2) {
    return Number(num).toFixed(decimals);
}

// Navbar scroll effect
document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.style.background = window.scrollY > 50 ? 'rgba(30, 30, 30, 0.98)' : 'rgba(37, 37, 38, 0.95)';
        });
    }

    setupDragDrop('xrdUploadArea', 'xrdFileInput');
    setupDragDrop('ftirUploadArea', 'ftirFileInput');
    setupDragDrop('betUploadArea', 'betFileInput');
});
