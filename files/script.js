// ===== GLOBAL VARIABLES =====
let transactions = [];
let categories = [
    { name: 'Gaji', type: 'income', color: '#28a745' },
    { name: 'Bonus', type: 'income', color: '#20c997' },
    { name: 'Investasi', type: 'income', color: '#17a2b8' },
    { name: 'Makanan', type: 'expense', color: '#dc3545' },
    { name: 'Transportasi', type: 'expense', color: '#fd7e14' },
    { name: 'Hiburan', type: 'expense', color: '#e83e8c' },
    { name: 'Tagihan', type: 'expense', color: '#6f42c1' },
    { name: 'Belanja', type: 'expense', color: '#6610f2' },
    { name: 'Kesehatan', type: 'expense', color: '#d63384' },
    { name: 'Pendidikan', type: 'expense', color: '#0d6efd' }
];

let currentPage = 1;
const itemsPerPage = 10;
let currentTransactionType = 'income';
let charts = {};
let currencySymbol = 'Rp';
let sortOrder = 'date-desc'; // date-desc, date-asc, amount-desc, amount-asc

// ===== AUTO REFRESH VARIABLES =====
let autoRefreshInterval;
let nextRefreshTime;
let autoRefreshEnabled = true;
let refreshIntervalMinutes = 1;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Money Manager - Initializing...');
    
    // Initialize UI
    initializeUI();
    
    // Load data
    loadData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize charts
    initializeCharts();
    
    // Start auto-refresh
    startAutoRefresh(refreshIntervalMinutes);
});

// ===== UI INITIALIZATION =====
function initializeUI() {
    // Set current date in forms
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    document.getElementById('reportStart').value = new Date(new Date().setDate(1)).toISOString().split('T')[0];
    document.getElementById('reportEnd').value = today;
    
    // Load categories to select elements
    populateCategories();
    
    // Load username
    const savedName = localStorage.getItem('mm_username') || 'Pengguna';
    document.getElementById('userName').value = savedName;
    document.getElementById('username').textContent = savedName;
    
    // Load currency
    const savedCurrency = localStorage.getItem('mm_currency') || 'IDR';
    setCurrency(savedCurrency);
    
    // Load sort order
    const savedSort = localStorage.getItem('mm_sortOrder') || 'date-desc';
    sortOrder = savedSort;
    
    // Load auto-refresh settings
    const savedAutoRefresh = localStorage.getItem('mm_autoRefresh');
    if (savedAutoRefresh !== null) {
        autoRefreshEnabled = savedAutoRefresh === 'true';
    }
    
    const savedInterval = localStorage.getItem('mm_refreshInterval');
    if (savedInterval) {
        refreshIntervalMinutes = parseInt(savedInterval);
    }
    
    // Initialize filter selects
    initializeFilters();
    
    // Update auto-refresh UI
    updateAutoRefreshUI();
    
    // Update last updated time
    updateLastUpdatedTime();
}

function initializeFilters() {
    // Populate filter categories
    const filterCategory = document.getElementById('filterCategory');
    if (filterCategory) {
        filterCategory.innerHTML = '<option value="all">Semua Kategori</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            filterCategory.appendChild(option);
        });
    }
    
    // Set sort select value
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.value = sortOrder;
    }
    
    // Set auto-refresh toggle
    const autoRefreshToggle = document.getElementById('autoRefreshToggle');
    if (autoRefreshToggle) {
        autoRefreshToggle.checked = autoRefreshEnabled;
    }
    
    // Set refresh interval
    const refreshIntervalSelect = document.getElementById('refreshInterval');
    if (refreshIntervalSelect) {
        refreshIntervalSelect.value = refreshIntervalMinutes;
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Sidebar toggle
    document.getElementById('menuToggle').addEventListener('click', toggleSidebar);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            navigateTo(target);
        });
    });
    
    // Dashboard - Add Transaction button
    const addTransactionBtn = document.querySelector('[data-target="add"]');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo('add');
        });
    }
    
    // Add another add button if exists
    const addBtn2 = document.querySelector('.btn-primary[data-target="add"]');
    if (addBtn2) {
        addBtn2.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo('add');
        });
    }
    
    // Add transaction type selection
    document.querySelectorAll('.type-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            currentTransactionType = this.getAttribute('data-type');
            
            // Show step 2
            document.getElementById('step1').classList.remove('active');
            document.getElementById('step2').classList.add('active');
            
            // Filter categories
            populateCategories(currentTransactionType);
        });
    });
    
    // Transaction form
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', saveTransaction);
    }
    
    // Quick amount buttons
    document.querySelectorAll('.quick-amount').forEach(btn => {
        btn.addEventListener('click', function() {
            const amount = this.getAttribute('data-amount');
            document.getElementById('amount').value = amount;
        });
    });
    
    // Back button
    const backBtn = document.getElementById('backStep');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            document.getElementById('step2').classList.remove('active');
            document.getElementById('step1').classList.add('active');
        });
    }
    
    // Cancel button
    const cancelBtn = document.querySelector('[onclick="navigateTo(\'transactions\')"]');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            navigateTo('transactions');
        });
    }
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Settings tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchSettingsTab(tabId);
        });
    });
    
    // Save profile
    document.getElementById('saveProfile').addEventListener('click', saveProfile);
    
    // Currency change
    const currencySelect = document.getElementById('currency');
    if (currencySelect) {
        currencySelect.addEventListener('change', function() {
            setCurrency(this.value);
        });
    }
    
    // Sort change
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortOrder = this.value;
            localStorage.setItem('mm_sortOrder', sortOrder);
            renderTransactionsTable();
        });
    }
    
    // Filter changes
    document.getElementById('filterType')?.addEventListener('change', applyFilters);
    document.getElementById('filterCategory')?.addEventListener('change', applyFilters);
    document.getElementById('filterDate')?.addEventListener('change', applyFilters);
    
    // Data management
    document.getElementById('exportData')?.addEventListener('click', exportData);
    document.getElementById('importData')?.addEventListener('click', importData);
    document.getElementById('clearData')?.addEventListener('click', clearData);
    
    // Search
    document.getElementById('searchInput').addEventListener('input', function() {
        filterTransactions(this.value);
    });
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', function() {
        loadData();
        showToast('Data diperbarui', 'success');
    });
    
    // Generate Report button
    const generateReportBtn = document.querySelector('[onclick="generateReport()"]');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateReport);
    }
    
    // Pagination
    document.getElementById('prevPage').addEventListener('click', prevPage);
    document.getElementById('nextPage').addEventListener('click', nextPage);
    
    // Chart period change
    const chartPeriod = document.getElementById('chartPeriod');
    if (chartPeriod) {
        chartPeriod.addEventListener('change', updateChartPeriod);
    }
    
    // Auto-refresh toggle
    const autoRefreshToggle = document.getElementById('autoRefreshToggle');
    if (autoRefreshToggle) {
        autoRefreshToggle.addEventListener('change', function() {
            autoRefreshEnabled = this.checked;
            localStorage.setItem('mm_autoRefresh', autoRefreshEnabled);
            
            if (autoRefreshEnabled) {
                startAutoRefresh(refreshIntervalMinutes);
                showToast('Auto-refresh diaktifkan', 'success');
            } else {
                stopAutoRefresh();
                showToast('Auto-refresh dimatikan', 'warning');
            }
            
            updateAutoRefreshUI();
        });
    }
    
    // Refresh interval change
    const refreshIntervalSelect = document.getElementById('refreshInterval');
    if (refreshIntervalSelect) {
        refreshIntervalSelect.addEventListener('change', function() {
            refreshIntervalMinutes = parseInt(this.value);
            localStorage.setItem('mm_refreshInterval', refreshIntervalMinutes);
            
            if (autoRefreshEnabled) {
                startAutoRefresh(refreshIntervalMinutes);
                showToast(`Interval diubah ke ${refreshIntervalMinutes} menit`, 'info');
            }
            
            updateAutoRefreshUI();
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Yakin ingin logout?')) {
                localStorage.removeItem('mm_username');
                window.location.reload();
            }
        });
    }
    
    // Auto-save checkbox
    const autoSaveCheckbox = document.getElementById('autoSaveData');
    if (autoSaveCheckbox) {
        autoSaveCheckbox.addEventListener('change', function() {
            localStorage.setItem('mm_autoSave', this.checked);
        });
    }
    
    // Auto-export backup checkbox
    const autoExportCheckbox = document.getElementById('autoExportBackup');
    if (autoExportCheckbox) {
        autoExportCheckbox.addEventListener('change', function() {
            localStorage.setItem('mm_autoExport', this.checked);
        });
    }
}

// ===== AUTO REFRESH FUNCTIONS =====
function startAutoRefresh(intervalMinutes = 1) {
    // Stop existing interval if any
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // Convert minutes to milliseconds
    const intervalMs = intervalMinutes * 60 * 1000;
    
    // Calculate next refresh time
    updateNextRefreshTime(intervalMs);
    
    // Start new interval
    autoRefreshInterval = setInterval(() => {
        if (autoRefreshEnabled) {
            loadData();
            updateNextRefreshTime(intervalMs);
            showToast('Data diperbarui otomatis', 'info');
            console.log('Auto-refresh: Data updated at', new Date().toLocaleTimeString());
        }
    }, intervalMs);
    
    console.log(`Auto-refresh started: ${intervalMinutes} menit`);
    updateAutoRefreshUI();
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        nextRefreshTime = null;
        console.log('Auto-refresh stopped');
    }
    updateAutoRefreshUI();
}

function updateNextRefreshTime(intervalMs) {
    nextRefreshTime = new Date(Date.now() + intervalMs);
    updateAutoRefreshUI();
}

function updateAutoRefreshUI() {
    const statusText = document.getElementById('autoRefreshStatusText');
    const intervalText = document.getElementById('autoRefreshIntervalText');
    const nextRefreshElement = document.getElementById('nextRefreshTime');
    const sidebarStatus = document.getElementById('autoRefreshStatus');
    const indicator = document.getElementById('autoRefreshIndicator');
    
    if (statusText) {
        statusText.textContent = autoRefreshEnabled ? 'Aktif' : 'Tidak Aktif';
        statusText.style.color = autoRefreshEnabled ? 'var(--success)' : 'var(--danger)';
    }
    
    if (intervalText) {
        intervalText.textContent = `${refreshIntervalMinutes} menit`;
    }
    
    if (nextRefreshElement && nextRefreshTime) {
        const timeStr = nextRefreshTime.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        nextRefreshElement.textContent = timeStr;
    }
    
    if (sidebarStatus) {
        sidebarStatus.textContent = autoRefreshEnabled ? 'ON' : 'OFF';
        sidebarStatus.style.color = autoRefreshEnabled ? 'var(--success)' : 'var(--danger)';
    }
    
    if (indicator) {
        indicator.style.color = autoRefreshEnabled ? 'var(--success)' : 'var(--text-secondary)';
        indicator.title = autoRefreshEnabled ? 
            `Auto-refresh aktif (${refreshIntervalMinutes} menit)` : 
            'Auto-refresh tidak aktif';
    }
}

// ===== NAVIGATION =====
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

function navigateTo(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-target') === sectionId) {
            item.classList.add('active');
        }
    });
    
    // Handle section-specific initialization
    switch(sectionId) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'transactions':
            renderTransactionsTable();
            break;
        case 'add':
            resetTransactionForm();
            break;
        case 'reports':
            generateReport();
            break;
        case 'settings':
            updateSettingsInfo();
            break;
    }
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
        toggleSidebar();
    }
}

// ===== DATA MANAGEMENT =====
function loadData() {
    // Load from localStorage
    const saved = localStorage.getItem('mm_transactions');
    if (saved) {
        try {
            transactions = JSON.parse(saved);
            updateLastUpdatedTime();
        } catch (e) {
            console.error('Error loading data:', e);
            transactions = [];
        }
    }
    
    // Add sample data if empty
    if (transactions.length === 0) {
        addSampleData();
    }
    
    // Update UI
    updateDashboard();
    renderTransactionsTable();
    updateRecentTransactions();
    updateSidebarStats();
    updateSettingsInfo();
    
    // Check for auto-export backup
    checkAutoExportBackup();
}

function saveData() {
    localStorage.setItem('mm_transactions', JSON.stringify(transactions));
    localStorage.setItem('mm_categories', JSON.stringify(categories));
    updateLastUpdatedTime();
}

function updateLastUpdatedTime() {
    const lastUpdatedElement = document.getElementById('lastUpdated');
    if (lastUpdatedElement) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        lastUpdatedElement.textContent = timeStr;
    }
}

function checkAutoExportBackup() {
    const autoExportEnabled = localStorage.getItem('mm_autoExport') === 'true';
    const lastExport = localStorage.getItem('mm_lastExportDate');
    const today = new Date().toDateString();
    
    if (autoExportEnabled && lastExport !== today) {
        // Export backup
        createAutoBackup();
        localStorage.setItem('mm_lastExportDate', today);
    }
}

function createAutoBackup() {
    const data = {
        transactions: transactions,
        categories: categories,
        exportedAt: new Date().toISOString(),
        type: 'auto-backup'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    localStorage.setItem(`mm_backup_${new Date().toISOString().split('T')[0]}`, dataStr);
    console.log('Auto-backup created');
}

// ===== TRANSACTIONS =====
function saveTransaction(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value;
    
    if (!amount || amount <= 0) {
        showToast('Masukkan jumlah yang valid', 'error');
        return;
    }
    
    if (!category) {
        showToast('Pilih kategori', 'error');
        return;
    }
    
    const transaction = {
        id: Date.now(),
        type: currentTransactionType,
        amount: amount,
        category: category,
        date: date,
        description: description,
        createdAt: new Date().toISOString()
    };
    
    transactions.unshift(transaction);
    saveData();
    
    showToast('Transaksi berhasil disimpan', 'success');
    resetTransactionForm();
    navigateTo('transactions');
}

function deleteTransaction(id) {
    if (confirm('Hapus transaksi ini?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        renderTransactionsTable();
        updateDashboard();
        showToast('Transaksi dihapus', 'success');
    }
}

function resetTransactionForm() {
    const form = document.getElementById('transactionForm');
    if (form) {
        form.reset();
    }
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('step1').classList.add('active');
    document.getElementById('step2').classList.remove('active');
}

// ===== RENDERING & FILTERING =====
function renderTransactionsTable(filtered = null) {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;
    
    let data = filtered || transactions;
    
    // Apply sorting
    data = sortTransactions(data);
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageData = data.slice(startIndex, startIndex + itemsPerPage);
    
    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-database text-muted d-block mb-2" style="font-size: 2rem;"></i>
                    <span class="text-muted">Tidak ada transaksi</span>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    pageData.forEach(transaction => {
        const isIncome = transaction.type === 'income';
        
        html += `
            <tr>
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.description || '-'}</td>
                <td>${transaction.category}</td>
                <td>
                    <span class="badge ${isIncome ? 'income' : 'expense'}">
                        ${isIncome ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                </td>
                <td class="${isIncome ? 'text-success' : 'text-danger'} font-weight-bold">
                    ${isIncome ? '+' : '-'}${formatCurrency(transaction.amount)}
                </td>
                <td>
                    <div class="d-flex gap-2">
                        <button class="btn-icon" onclick="editTransaction(${transaction.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="deleteTransaction(${transaction.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Update pagination
    updatePagination(data.length);
}

function sortTransactions(data) {
    switch(sortOrder) {
        case 'date-asc':
            return [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
        case 'date-desc':
            return [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
        case 'amount-asc':
            return [...data].sort((a, b) => a.amount - b.amount);
        case 'amount-desc':
            return [...data].sort((a, b) => b.amount - a.amount);
        default:
            return [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
}

function applyFilters() {
    const typeFilter = document.getElementById('filterType')?.value || 'all';
    const categoryFilter = document.getElementById('filterCategory')?.value || 'all';
    const dateFilter = document.getElementById('filterDate')?.value;
    
    let filtered = transactions;
    
    if (typeFilter !== 'all') {
        filtered = filtered.filter(t => t.type === typeFilter);
    }
    
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(t => t.category === categoryFilter);
    }
    
    if (dateFilter) {
        filtered = filtered.filter(t => t.date === dateFilter);
    }
    
    currentPage = 1;
    renderTransactionsTable(filtered);
}

function filterTransactions(searchTerm) {
    const filtered = transactions.filter(t => 
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.amount.toString().includes(searchTerm)
    );
    
    currentPage = 1;
    renderTransactionsTable(filtered);
}

function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    if (pageInfo) pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTransactionsTable();
    }
}

function nextPage() {
    const totalPages = Math.ceil(transactions.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTransactionsTable();
    }
}

function updateRecentTransactions() {
    const container = document.getElementById('recentTransactionsList');
    if (!container) return;
    
    const recent = transactions.slice(0, 5);
    
    if (recent.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-database text-muted d-block mb-2" style="font-size: 2rem;"></i>
                <span class="text-muted">Belum ada transaksi</span>
            </div>
        `;
        return;
    }
    
    let html = '';
    recent.forEach(transaction => {
        const isIncome = transaction.type === 'income';
        
        html += `
            <div class="transaction-item">
                <div class="transaction-icon ${isIncome ? 'income' : 'expense'}">
                    <i class="fas fa-${isIncome ? 'arrow-down' : 'arrow-up'}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.category}</div>
                    <div class="transaction-meta">${formatDate(transaction.date)}</div>
                </div>
                <div class="transaction-amount ${isIncome ? 'income' : 'expense'}">
                    ${isIncome ? '+' : '-'}${formatCurrency(transaction.amount)}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateDashboard() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    let prevMonthlyIncome = 0;
    let prevMonthlyExpense = 0;
    let totalIncome = 0;
    let totalExpense = 0;
    
    transactions.forEach(t => {
        const transDate = new Date(t.date);
        const transMonth = transDate.getMonth();
        const transYear = transDate.getFullYear();
        
        // Current month
        if (transMonth === currentMonth && transYear === currentYear) {
            if (t.type === 'income') monthlyIncome += t.amount;
            else monthlyExpense += t.amount;
        }
        
        // Previous month
        if (transMonth === prevMonth && transYear === prevYear) {
            if (t.type === 'income') prevMonthlyIncome += t.amount;
            else prevMonthlyExpense += t.amount;
        }
        
        // All time
        if (t.type === 'income') totalIncome += t.amount;
        else totalExpense += t.amount;
    });
    
    const monthlyBalance = monthlyIncome - monthlyExpense;
    const totalBalance = totalIncome - totalExpense;
    
    // Calculate trends
    const incomeTrend = prevMonthlyIncome > 0 ? 
        ((monthlyIncome - prevMonthlyIncome) / prevMonthlyIncome * 100).toFixed(1) : 0;
    const expenseTrend = prevMonthlyExpense > 0 ? 
        ((monthlyExpense - prevMonthlyExpense) / prevMonthlyExpense * 100).toFixed(1) : 0;
    
    // Update stats
    document.getElementById('monthlyIncome').textContent = formatCurrency(monthlyIncome);
    document.getElementById('monthlyExpense').textContent = formatCurrency(monthlyExpense);
    document.getElementById('currentBalance').textContent = formatCurrency(totalBalance);
    
    // Update trends
    const incomeTrendEl = document.getElementById('incomeTrend');
    const expenseTrendEl = document.getElementById('expenseTrend');
    const balanceTrendEl = document.getElementById('balanceTrend');
    
    if (incomeTrendEl) {
        incomeTrendEl.textContent = `${incomeTrend >= 0 ? '+' : ''}${incomeTrend}% dari bulan lalu`;
        incomeTrendEl.style.color = incomeTrend >= 0 ? 'var(--success)' : 'var(--danger)';
    }
    
    if (expenseTrendEl) {
        expenseTrendEl.textContent = `${expenseTrend >= 0 ? '+' : ''}${expenseTrend}% dari bulan lalu`;
        expenseTrendEl.style.color = expenseTrend >= 0 ? 'var(--danger)' : 'var(--success)';
    }
    
    if (balanceTrendEl) {
        const balanceChange = monthlyBalance - (prevMonthlyIncome - prevMonthlyExpense);
        const trendText = balanceChange > 0 ? 'Meningkat' : balanceChange < 0 ? 'Menurun' : 'Stabil';
        balanceTrendEl.textContent = trendText;
        balanceTrendEl.style.color = balanceChange > 0 ? 'var(--success)' : 
                                    balanceChange < 0 ? 'var(--danger)' : 'var(--text-secondary)';
    }
    
    const totalTransactions = document.getElementById('totalTransactions');
    if (totalTransactions) totalTransactions.textContent = transactions.length;
    
    // Update charts
    if (charts.incomeExpense) {
        updateCharts();
    }
}

function updateSidebarStats() {
    const sidebarBalance = document.getElementById('sidebarBalance');
    const sidebarTransactions = document.getElementById('sidebarTransactions');
    
    if (sidebarBalance) {
        sidebarBalance.textContent = formatCurrency(
            transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
        );
    }
    
    if (sidebarTransactions) {
        sidebarTransactions.textContent = transactions.length;
    }
}

// ===== CHARTS =====
function initializeCharts() {
    const incomeExpenseCtx = document.getElementById('incomeExpenseChart');
    if (incomeExpenseCtx) {
        charts.incomeExpense = new Chart(incomeExpenseCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
                datasets: [
                    {
                        label: 'Pemasukan',
                        data: [5000000, 5500000, 6000000, 5800000, 6200000, 6500000],
                        backgroundColor: '#28a745'
                    },
                    {
                        label: 'Pengeluaran',
                        data: [3500000, 3800000, 4000000, 4200000, 3900000, 4100000],
                        backgroundColor: '#dc3545'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return currencySymbol + ' ' + (value / 1000000).toFixed(1) + 'JT';
                            }
                        }
                    }
                }
            }
        });
    }
    
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        charts.category = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: ['Makanan', 'Transportasi', 'Hiburan', 'Tagihan', 'Belanja', 'Lainnya'],
                datasets: [{
                    data: [30, 25, 15, 20, 5, 5],
                    backgroundColor: ['#dc3545', '#fd7e14', '#e83e8c', '#6f42c1', '#6610f2', '#6c757d']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

function updateCharts() {
    if (!charts.incomeExpense) return;
    
    // Get current month data
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate monthly data for last 6 months
    const monthlyData = { income: [], expense: [] };
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];
    
    for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(currentYear, currentMonth - i, 1);
        const monthIndex = targetDate.getMonth();
        const year = targetDate.getFullYear();
        
        let monthIncome = 0;
        let monthExpense = 0;
        
        transactions.forEach(t => {
            const transDate = new Date(t.date);
            if (transDate.getMonth() === monthIndex && transDate.getFullYear() === year) {
                if (t.type === 'income') monthIncome += t.amount;
                else monthExpense += t.amount;
            }
        });
        
        monthlyData.income.push(monthIncome);
        monthlyData.expense.push(monthExpense);
    }
    
    // Update income/expense chart
    charts.incomeExpense.data.datasets[0].data = monthlyData.income;
    charts.incomeExpense.data.datasets[1].data = monthlyData.expense;
    charts.incomeExpense.update();
    
    // Update category chart
    if (charts.category) {
        const categoryTotals = {};
        transactions.forEach(t => {
            if (t.type === 'expense') {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            }
        });
        
        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);
        const colors = labels.map(label => {
            const cat = categories.find(c => c.name === label);
            return cat ? cat.color : '#6c757d';
        });
        
        charts.category.data.labels = labels;
        charts.category.data.datasets[0].data = data;
        charts.category.data.datasets[0].backgroundColor = colors;
        charts.category.update();
    }
}

function updateChartPeriod() {
    const period = document.getElementById('chartPeriod')?.value || 'month';
    updateChartsForPeriod(period);
}

function updateChartsForPeriod(period) {
    // Implement chart update based on period
    // For simplicity, we'll just update with current data
    updateCharts();
}

// ===== PDF EXPORT FUNCTIONS =====
function exportToPDF() {
    const startDate = document.getElementById('reportStart')?.value;
    const endDate = document.getElementById('reportEnd')?.value;
    
    if (!startDate || !endDate) {
        showToast('Pilih tanggal mulai dan akhir', 'error');
        return;
    }
    
    // Filter transactions for the report period
    const filtered = transactions.filter(t => {
        const transDate = new Date(t.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return transDate >= start && transDate <= end;
    });
    
    if (filtered.length === 0) {
        showToast('Tidak ada transaksi untuk diexport', 'warning');
        return;
    }
    
    // Calculate totals
    const income = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;
    
    // Create PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('LAPORAN KEUANGAN', 105, 15, { align: 'center' });
    
    // Add period
    doc.setFontSize(12);
    doc.text(`Periode: ${formatDate(startDate)} - ${formatDate(endDate)}`, 105, 25, { align: 'center' });
    
    // Add summary
    doc.setFontSize(10);
    let yPos = 40;
    
    doc.text(`Total Pemasukan: ${formatCurrency(income)}`, 20, yPos);
    yPos += 7;
    doc.text(`Total Pengeluaran: ${formatCurrency(expense)}`, 20, yPos);
    yPos += 7;
    doc.text(`Saldo Bersih: ${formatCurrency(balance)}`, 20, yPos);
    yPos += 7;
    doc.text(`Jumlah Transaksi: ${filtered.length}`, 20, yPos);
    
    // Add table
    const tableColumn = ["Tanggal", "Kategori", "Jenis", "Jumlah", "Deskripsi"];
    const tableRows = [];
    
    // Sort by date
    const sorted = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sorted.forEach(transaction => {
        const isIncome = transaction.type === 'income';
        const transactionData = [
            formatDate(transaction.date),
            transaction.category,
            isIncome ? "Pemasukan" : "Pengeluaran",
            (isIncome ? "+" : "-") + formatCurrency(transaction.amount),
            transaction.description || "-"
        ];
        tableRows.push(transactionData);
    });
    
    // Auto-table plugin
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: yPos + 10,
        theme: 'striped',
        headStyles: { fillColor: [67, 97, 238] },
        margin: { top: 20 },
        styles: {
            fontSize: 8,
            cellPadding: 2
        },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 30 },
            2: { cellWidth: 25 },
            3: { cellWidth: 35 },
            4: { cellWidth: 75 }
        }
    });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
            `Dicetak pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
        doc.text(
            `Halaman ${i} dari ${pageCount}`,
            doc.internal.pageSize.width - 20,
            doc.internal.pageSize.height - 10,
            { align: 'right' }
        );
    }
    
    // Save PDF
    const fileName = `Laporan_Keuangan_${startDate}_${endDate}.pdf`;
    doc.save(fileName);
    
    showToast('Laporan PDF berhasil dibuat', 'success');
}

function exportChartToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('GRAFIK KEUANGAN', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 105, 22, { align: 'center' });
    
    // Get chart as image
    const incomeExpenseCanvas = document.getElementById('incomeExpenseChart');
    const categoryCanvas = document.getElementById('categoryChart');
    
    let yPos = 30;
    
    if (incomeExpenseCanvas) {
        const incomeExpenseImg = incomeExpenseCanvas.toDataURL('image/png');
        doc.addImage(incomeExpenseImg, 'PNG', 20, yPos, 170, 80);
        yPos += 90;
    }
    
    if (categoryCanvas) {
        const categoryImg = categoryCanvas.toDataURL('image/png');
        doc.addImage(categoryImg, 'PNG', 60, yPos, 90, 80);
        yPos += 90;
    }
    
    // Add stats
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    
    transactions.forEach(t => {
        const transDate = new Date(t.date);
        if (transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear) {
            if (t.type === 'income') monthlyIncome += t.amount;
            else monthlyExpense += t.amount;
        }
    });
    
    doc.setFontSize(12);
    doc.text(`Pemasukan Bulan Ini: ${formatCurrency(monthlyIncome)}`, 20, yPos);
    yPos += 7;
    doc.text(`Pengeluaran Bulan Ini: ${formatCurrency(monthlyExpense)}`, 20, yPos);
    yPos += 7;
    doc.text(`Saldo: ${formatCurrency(monthlyIncome - monthlyExpense)}`, 20, yPos);
    
    // Save PDF
    doc.save(`Grafik_Keuangan_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('Grafik diexport ke PDF', 'success');
}

function exportCategoryChartToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('GRAFIK KATEGORI PENGELUARAN', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 105, 22, { align: 'center' });
    
    // Get chart as image
    const categoryCanvas = document.getElementById('categoryChart');
    
    if (categoryCanvas) {
        const categoryImg = categoryCanvas.toDataURL('image/png');
        doc.addImage(categoryImg, 'PNG', 60, 30, 90, 90);
    }
    
    // Add category details
    const categoryTotals = {};
    transactions.forEach(t => {
        if (t.type === 'expense') {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        }
    });
    
    let yPos = 130;
    doc.setFontSize(12);
    doc.text('Detail Kategori Pengeluaran:', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    Object.entries(categoryTotals).forEach(([category, amount]) => {
        if (yPos > 280) {
            doc.addPage();
            yPos = 20;
        }
        doc.text(`${category}: ${formatCurrency(amount)}`, 25, yPos);
        yPos += 7;
    });
    
    // Save PDF
    doc.save(`Grafik_Kategori_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('Grafik kategori diexport ke PDF', 'success');
}

function exportDashboardToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('DASHBOARD KEUANGAN', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Periode: ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`, 105, 22, { align: 'center' });
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`, 105, 28, { align: 'center' });
    
    // Get stats
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    let totalIncome = 0;
    let totalExpense = 0;
    
    transactions.forEach(t => {
        const transDate = new Date(t.date);
        if (transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear) {
            if (t.type === 'income') monthlyIncome += t.amount;
            else monthlyExpense += t.amount;
        }
        
        if (t.type === 'income') totalIncome += t.amount;
        else totalExpense += t.amount;
    });
    
    const monthlyBalance = monthlyIncome - monthlyExpense;
    const totalBalance = totalIncome - totalExpense;
    
    // Add stats box
    doc.setDrawColor(67, 97, 238);
    doc.setFillColor(240, 242, 255);
    doc.rect(15, 35, 180, 40, 'F');
    doc.rect(15, 35, 180, 40);
    
    doc.setFontSize(12);
    doc.text('STATISTIK BULAN INI', 105, 45, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Pemasukan: ${formatCurrency(monthlyIncome)}`, 25, 55);
    doc.text(`Pengeluaran: ${formatCurrency(monthlyExpense)}`, 105, 55);
    doc.text(`Saldo: ${formatCurrency(monthlyBalance)}`, 25, 65);
    doc.text(`Total Transaksi: ${transactions.length}`, 105, 65);
    
    // Add recent transactions
    let yPos = 85;
    doc.setFontSize(14);
    doc.text('TRANSAKSI TERBARU', 20, yPos);
    yPos += 10;
    
    const recent = transactions.slice(0, 10);
    
    if (recent.length > 0) {
        doc.setFontSize(9);
        doc.setDrawColor(200, 200, 200);
        
        // Table header
        doc.setFillColor(240, 240, 240);
        doc.rect(20, yPos, 170, 7, 'F');
        doc.text('Tanggal', 22, yPos + 5);
        doc.text('Kategori', 55, yPos + 5);
        doc.text('Jenis', 95, yPos + 5);
        doc.text('Jumlah', 125, yPos + 5);
        doc.text('Deskripsi', 155, yPos + 5);
        
        yPos += 7;
        
        // Table rows
        recent.forEach((transaction, index) => {
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            
            const isIncome = transaction.type === 'income';
            doc.text(formatDate(transaction.date), 22, yPos + 5);
            doc.text(transaction.category, 55, yPos + 5);
            doc.text(isIncome ? 'Pemasukan' : 'Pengeluaran', 95, yPos + 5);
            doc.text((isIncome ? '+' : '-') + formatCurrency(transaction.amount), 125, yPos + 5);
            doc.text(transaction.description || '-', 155, yPos + 5);
            
            // Add horizontal line
            if (index < recent.length - 1) {
                doc.line(20, yPos + 7, 190, yPos + 7);
            }
            
            yPos += 7;
        });
    } else {
        doc.text('Tidak ada transaksi', 20, yPos);
    }
    
    // Add charts if available
    const incomeExpenseCanvas = document.getElementById('incomeExpenseChart');
    if (incomeExpenseCanvas && yPos < 150) {
        doc.addPage();
        yPos = 20;
        const incomeExpenseImg = incomeExpenseCanvas.toDataURL('image/png');
        doc.addImage(incomeExpenseImg, 'PNG', 20, yPos, 170, 80);
        yPos += 90;
        
        const categoryCanvas = document.getElementById('categoryChart');
        if (categoryCanvas) {
            const categoryImg = categoryCanvas.toDataURL('image/png');
            doc.addImage(categoryImg, 'PNG', 60, yPos, 90, 80);
        }
    }
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
            `Money Manager - Halaman ${i} dari ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }
    
    // Save PDF
    doc.save(`Dashboard_Keuangan_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('Dashboard diexport ke PDF', 'success');
}

function exportAllToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('LAPORAN SEMUA TRANSAKSI', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Total: ${transactions.length} transaksi`, 105, 22, { align: 'center' });
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 105, 28, { align: 'center' });
    
    // Calculate totals
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;
    
    // Add summary
    let yPos = 40;
    doc.setFontSize(12);
    doc.text('Ringkasan:', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Total Pemasukan: ${formatCurrency(income)}`, 25, yPos);
    yPos += 7;
    doc.text(`Total Pengeluaran: ${formatCurrency(expense)}`, 25, yPos);
    yPos += 7;
    doc.text(`Saldo Akhir: ${formatCurrency(balance)}`, 25, yPos);
    yPos += 10;
    
    // Add table
    const tableColumn = ["Tanggal", "Kategori", "Jenis", "Jumlah", "Deskripsi"];
    const tableRows = [];
    
    // Sort by date
    const sorted = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sorted.forEach(transaction => {
        const isIncome = transaction.type === 'income';
        const transactionData = [
            formatDate(transaction.date),
            transaction.category,
            isIncome ? "Pemasukan" : "Pengeluaran",
            (isIncome ? "+" : "-") + formatCurrency(transaction.amount),
            transaction.description || "-"
        ];
        tableRows.push(transactionData);
    });
    
    // Auto-table plugin
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: yPos,
        theme: 'striped',
        headStyles: { fillColor: [67, 97, 238] },
        margin: { top: 20 },
        styles: {
            fontSize: 8,
            cellPadding: 2
        },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 30 },
            2: { cellWidth: 25 },
            3: { cellWidth: 35 },
            4: { cellWidth: 75 }
        }
    });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
            `Money Manager - Halaman ${i} dari ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }
    
    // Save PDF
    doc.save(`Semua_Transaksi_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('Semua transaksi diexport ke PDF', 'success');
}

function exportFilteredToPDF() {
    const typeFilter = document.getElementById('filterType')?.value || 'all';
    const categoryFilter = document.getElementById('filterCategory')?.value || 'all';
    const dateFilter = document.getElementById('filterDate')?.value;
    
    let filtered = transactions;
    
    if (typeFilter !== 'all') {
        filtered = filtered.filter(t => t.type === typeFilter);
    }
    
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(t => t.category === categoryFilter);
    }
    
    if (dateFilter) {
        filtered = filtered.filter(t => t.date === dateFilter);
    }
    
    if (filtered.length === 0) {
        showToast('Tidak ada transaksi untuk diexport', 'warning');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('LAPORAN TRANSAKSI TERFILTER', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Total: ${filtered.length} transaksi`, 105, 22, { align: 'center' });
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 105, 28, { align: 'center' });
    
    // Add filter info
    let yPos = 40;
    doc.setFontSize(10);
    doc.text(`Filter Jenis: ${typeFilter === 'all' ? 'Semua' : typeFilter === 'income' ? 'Pemasukan' : 'Pengeluaran'}`, 20, yPos);
    yPos += 7;
    doc.text(`Filter Kategori: ${categoryFilter === 'all' ? 'Semua' : categoryFilter}`, 20, yPos);
    yPos += 7;
    doc.text(`Filter Tanggal: ${dateFilter || 'Semua'}`, 20, yPos);
    yPos += 10;
    
    // Add table
    const tableColumn = ["Tanggal", "Kategori", "Jenis", "Jumlah", "Deskripsi"];
    const tableRows = [];
    
    // Sort by date
    const sorted = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sorted.forEach(transaction => {
        const isIncome = transaction.type === 'income';
        const transactionData = [
            formatDate(transaction.date),
            transaction.category,
            isIncome ? "Pemasukan" : "Pengeluaran",
            (isIncome ? "+" : "-") + formatCurrency(transaction.amount),
            transaction.description || "-"
        ];
        tableRows.push(transactionData);
    });
    
    // Auto-table plugin
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: yPos,
        theme: 'striped',
        headStyles: { fillColor: [67, 97, 238] },
        margin: { top: 20 },
        styles: {
            fontSize: 8,
            cellPadding: 2
        }
    });
    
    // Save PDF
    doc.save(`Transaksi_Terfilter_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('Transaksi terfilter diexport ke PDF', 'success');
}

function exportRecentToPDF() {
    const recent = transactions.slice(0, 10);
    
    if (recent.length === 0) {
        showToast('Tidak ada transaksi terbaru', 'warning');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('TRANSAKSI TERBARU', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`10 transaksi terbaru`, 105, 22, { align: 'center' });
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 105, 28, { align: 'center' });
    
    // Add table
    const tableColumn = ["Tanggal", "Kategori", "Jenis", "Jumlah", "Deskripsi"];
    const tableRows = [];
    
    recent.forEach(transaction => {
        const isIncome = transaction.type === 'income';
        const transactionData = [
            formatDate(transaction.date),
            transaction.category,
            isIncome ? "Pemasukan" : "Pengeluaran",
            (isIncome ? "+" : "-") + formatCurrency(transaction.amount),
            transaction.description || "-"
        ];
        tableRows.push(transactionData);
    });
    
    // Auto-table plugin
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [67, 97, 238] },
        margin: { top: 20 },
        styles: {
            fontSize: 8,
            cellPadding: 2
        }
    });
    
    // Save PDF
    doc.save(`Transaksi_Terbaru_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('Transaksi terbaru diexport ke PDF', 'success');
}

// ===== UTILITIES =====
function formatCurrency(amount) {
    if (currencySymbol === 'Rp') {
        return currencySymbol + ' ' + Math.round(amount).toLocaleString('id-ID');
    } else if (currencySymbol === '$') {
        return currencySymbol + ' ' + (amount / 14000).toFixed(2);
    } else if (currencySymbol === '€') {
        return currencySymbol + ' ' + (amount / 16000).toFixed(2);
    }
    return currencySymbol + ' ' + amount.toLocaleString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function populateCategories(type = null) {
    const select = document.getElementById('category');
    if (!select) return;
    
    select.innerHTML = '<option value="">Pilih Kategori</option>';
    
    const filtered = type ? categories.filter(c => c.type === type) : categories;
    
    filtered.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

function calculateDataSize() {
    const dataStr = JSON.stringify(transactions);
    const sizeInBytes = new Blob([dataStr]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(3);
    
    return {
        bytes: sizeInBytes,
        kb: sizeInKB,
        mb: sizeInMB,
        humanReadable: sizeInBytes > 1024 * 1024 ? 
            `${sizeInMB} MB` : 
            `${sizeInKB} KB`
    };
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type]}"></i>
        </div>
        <div class="toast-content">
            <div>${message}</div>
        </div>
        <button class="btn-icon" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 3000);
}

// ===== THEME MANAGEMENT =====
function toggleTheme() {
    const current = document.body.getAttribute('data-theme') || 'light';
    const newTheme = current === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('mm_theme', theme);
    
    // Update theme toggle icon
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// ===== CURRENCY MANAGEMENT =====
function setCurrency(currencyCode) {
    switch(currencyCode) {
        case 'USD':
            currencySymbol = '$';
            break;
        case 'EUR':
            currencySymbol = '€';
            break;
        case 'IDR':
        default:
            currencySymbol = 'Rp';
    }
    
    localStorage.setItem('mm_currency', currencyCode);
    
    // Update currency select
    const currencySelect = document.getElementById('currency');
    if (currencySelect) {
        currencySelect.value = currencyCode;
    }
    
    // Update UI with new currency
    updateDashboard();
    updateSidebarStats();
    renderTransactionsTable();
    
    showToast(`Mata uang diubah ke ${currencyCode}`, 'info');
}

// ===== SETTINGS =====
function switchSettingsTab(tabId) {
    // Update tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`.settings-tab[data-tab="${tabId}"]`).classList.add('active');
    
    // Update panels
    document.querySelectorAll('.settings-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const panel = document.getElementById(`${tabId}Panel`);
    if (panel) {
        panel.classList.add('active');
    }
}

function saveProfile() {
    const name = document.getElementById('userName').value;
    localStorage.setItem('mm_username', name);
    document.getElementById('username').textContent = name;
    showToast('Profil disimpan', 'success');
}

function updateSettingsInfo() {
    const totalDataCount = document.getElementById('totalDataCount');
    const dataSize = document.getElementById('dataSize');
    
    if (totalDataCount) {
        totalDataCount.textContent = transactions.length;
    }
    
    if (dataSize) {
        const size = calculateDataSize();
        dataSize.textContent = size.humanReadable;
    }
}

// ===== DATA EXPORT/IMPORT =====
function exportData() {
    const data = {
        transactions: transactions,
        categories: categories,
        exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `money_manager_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('Data berhasil diexport', 'success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                
                if (confirm(`Import ${data.transactions.length} transaksi?`)) {
                    transactions = data.transactions;
                    categories = data.categories || categories;
                    saveData();
                    loadData();
                    showToast('Data berhasil diimport', 'success');
                }
            } catch (error) {
                showToast('Error membaca file', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function clearData() {
    if (confirm('Hapus semua data? Tindakan ini tidak dapat dibatalkan.')) {
        transactions = [];
        saveData();
        loadData();
        showToast('Semua data telah dihapus', 'success');
    }
}

// ===== REPORT GENERATION =====
function generateReport() {
    const startDate = document.getElementById('reportStart')?.value;
    const endDate = document.getElementById('reportEnd')?.value;
    
    if (!startDate || !endDate) {
        showToast('Pilih tanggal mulai dan akhir', 'error');
        return;
    }
    
    const filtered = transactions.filter(t => {
        const transDate = new Date(t.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return transDate >= start && transDate <= end;
    });
    
    if (filtered.length === 0) {
        showToast('Tidak ada transaksi pada periode ini', 'warning');
        return;
    }
    
    const income = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;
    
    // Update report display
    const reportIncome = document.getElementById('reportIncome');
    const reportExpense = document.getElementById('reportExpense');
    const reportBalance = document.getElementById('reportBalance');
    const reportCount = document.getElementById('reportCount');
    
    if (reportIncome) reportIncome.textContent = formatCurrency(income);
    if (reportExpense) reportExpense.textContent = formatCurrency(expense);
    if (reportBalance) reportBalance.textContent = formatCurrency(balance);
    if (reportCount) reportCount.textContent = filtered.length;
    
    // Create simple report table
    createReportTable(filtered);
    
    showToast(`Laporan untuk ${filtered.length} transaksi dibuat`, 'success');
}

function createReportTable(data) {
    const tableBody = document.getElementById('reportTableBody');
    if (!tableBody) return;
    
    let html = '';
    data.forEach(transaction => {
        const isIncome = transaction.type === 'income';
        
        html += `
            <tr>
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.category}</td>
                <td>${isIncome ? 'Pemasukan' : 'Pengeluaran'}</td>
                <td class="${isIncome ? 'text-success' : 'text-danger'}">
                    ${isIncome ? '+' : '-'}${formatCurrency(transaction.amount)}
                </td>
                <td>${transaction.description || '-'}</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// ===== SAMPLE DATA =====
function addSampleData() {
    const sampleTransactions = [
        {
            id: 1,
            type: 'income',
            amount: 5000000,
            category: 'Gaji',
            date: new Date().toISOString().split('T')[0],
            description: 'Gaji bulan Maret',
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            type: 'expense',
            amount: 150000,
            category: 'Makanan',
            date: new Date().toISOString().split('T')[0],
            description: 'Makan siang dengan klien',
            createdAt: new Date().toISOString()
        },
        {
            id: 3,
            type: 'expense',
            amount: 100000,
            category: 'Transportasi',
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            description: 'Bensin mingguan',
            createdAt: new Date().toISOString()
        },
        {
            id: 4,
            type: 'income',
            amount: 1000000,
            category: 'Bonus',
            date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
            description: 'Bonus project selesai',
            createdAt: new Date().toISOString()
        },
        {
            id: 5,
            type: 'expense',
            amount: 350000,
            category: 'Belanja',
            date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
            description: 'Belanja bulanan',
            createdAt: new Date().toISOString()
        }
    ];
    
    transactions.push(...sampleTransactions);
    saveData();
}

// ===== GLOBAL FUNCTIONS =====
window.editTransaction = function(id) {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
        currentTransactionType = transaction.type;
        
        // Select type card
        document.querySelectorAll('.type-card').forEach(card => {
            card.classList.remove('selected');
            if (card.getAttribute('data-type') === transaction.type) {
                card.classList.add('selected');
            }
        });
        
        // Fill form
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('category').value = transaction.category;
        document.getElementById('date').value = transaction.date;
        document.getElementById('description').value = transaction.description || '';
        
        // Show form
        document.getElementById('step1').classList.remove('active');
        document.getElementById('step2').classList.add('active');
        populateCategories(currentTransactionType);
        
        // Change save button to update
        const saveBtn = document.getElementById('saveTransaction');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Transaksi';
            saveBtn.onclick = function(e) {
                e.preventDefault();
                updateTransaction(id);
            };
        }
        
        navigateTo('add');
    }
};

window.updateTransaction = function(id) {
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value;
    
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        transactions[index] = {
            ...transactions[index],
            amount,
            category,
            date,
            description
        };
        
        saveData();
        showToast('Transaksi diperbarui', 'success');
        resetTransactionForm();
        navigateTo('transactions');
    }
};

// Auto-save every minute
setInterval(() => {
    const autoSaveEnabled = localStorage.getItem('mm_autoSave') !== 'false';
    if (autoSaveEnabled && transactions.length > 0) {
        saveData();
    }
}, 60000);