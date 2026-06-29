// ===== MAIN SHARED JS =====

// Toggle download dropdown menu
function toggleDownloadMenu(menuId) {
    const menu = document.getElementById(menuId);
    if (!menu) return;

    // Close all other menus first
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

// Export chart at specific DPI
function exportChartAtDPI(chart, dpi, filename) {
    if (!chart) {
        showNotification('No chart to export', 'error');
        return;
    }

    const scale = dpi / 96; // Standard screen DPI is 96
    const originalWidth = chart.width;
    const originalHeight = chart.height;

    // Temporarily resize canvas for high DPI
    chart.resize(originalWidth * scale, originalHeight * scale);
    chart.update('none');

    const link = document.createElement('a');
    link.download = filename;
    link.href = chart.toBase64Image();
    link.click();

    // Restore original size
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
            navbar.style.background = window.scrollY > 50 ? 'rgba(15, 15, 35, 0.95)' : 'rgba(15, 15, 35, 0.85)';
        });
    }

    // Setup drag and drop for all pages
    setupDragDrop('xrdUploadArea', 'xrdFileInput');
    setupDragDrop('ftirUploadArea', 'ftirFileInput');
    setupDragDrop('betUploadArea', 'betFileInput');
});
