// ========================================
// SUPABASE CONFIGURATION
// ========================================
// TODO: Replace with your Supabase credentials
const SUPABASE_URL = 'https://yfahcrsahzadaovwdbvy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmYWhjcnNhaHphZGFvdndkYnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDQ5NjEsImV4cCI6MjA4NjQ4MDk2MX0.rJ7zq5NqDUsrQr_07eJEVZxzbQkowJ9UxNSO1ZBn_cg';

// Initialize Supabase client
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// ========================================
// DATA STORAGE
// ========================================
class DataStorage {
    static async get(key) {
        // If Supabase is not configured, use localStorage
        if (!supabase || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        }
        
        try {
            const { data, error } = await supabase.from(key).select('*');
            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Error getting data:', err);
            return [];
        }
    }
    
    static async set(key, value) {
        // If Supabase is not configured, use localStorage
        if (!supabase || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            localStorage.setItem(key, JSON.stringify(value));
            return;
        }
        
        // For budgets
        if (key === 'budgets') {
            const budgetArray = Object.keys(value).map(category => ({
                category: category,
                amount: value[category]
            }));
            
            try {
                const { error } = await supabase.from(key).upsert(budgetArray, { onConflict: 'category' });
                if (error) throw error;
            } catch (err) {
                console.error('Error saving budgets:', err);
            }
        }
    }
    
    static async add(key, item) {
        // If Supabase is not configured, use localStorage
        if (!supabase || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            const items = JSON.parse(localStorage.getItem(key) || '[]');
            item.id = Date.now() + Math.random();
            items.push(item);
            localStorage.setItem(key, JSON.stringify(items));
            return item;
        }
        
        try {
            delete item.id; // Let database create ID
            const { data, error} = await supabase.from(key).insert([item]).select();
            if (error) throw error;
            return data[0];
        } catch (err) {
            console.error('Error adding data:', err);
            return null;
        }
    }
    
    static async delete(key, id) {
        // If Supabase is not configured, use localStorage
        if (!supabase || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            const items = JSON.parse(localStorage.getItem(key) || '[]');
            const filtered = items.filter(item => item.id !== id);
            localStorage.setItem(key, JSON.stringify(filtered));
            return;
        }
        
        try {
            const { error } = await supabase.from(key).delete().eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error('Error deleting data:', err);
        }
    }
}

// ========================================
// APP STATE
// ========================================
let currentTab = 'dashboard';
let incomes = [];
let expenses = [];
let budgets = getDefaultBudgets();
let emis = [];

function getDefaultBudgets() {
    return {
        'Groceries': 15000,
        'Transportation': 5000,
        'Dining Out': 8000,
        'Utilities': 3000,
        'Entertainment': 5000,
        'Healthcare': 3000,
        'Shopping': 10000,
        'Other': 5000
    };
}

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App starting...');
    await loadAllData();
    initializeTabs();
    initializeForms();
    setDefaultDates();
    loadBudgetValues();
    updateDashboard();
    console.log('App loaded successfully!');
});

async function loadAllData() {
    console.log('Loading data...');
    
    // Load incomes
    incomes = await DataStorage.get('incomes');
    console.log('Incomes loaded:', incomes.length);
    
    // Load expenses
    expenses = await DataStorage.get('expenses');
    console.log('Expenses loaded:', expenses.length);
    
    // Load EMIs
    emis = await DataStorage.get('emis');
    console.log('EMIs loaded:', emis.length);
    
    // Load budgets
    if (!supabase || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        const savedBudgets = localStorage.getItem('budgets');
        if (savedBudgets) {
            budgets = JSON.parse(savedBudgets);
        }
    } else {
        const budgetData = await DataStorage.get('budgets');
        if (budgetData && budgetData.length > 0) {
            budgets = {};
            budgetData.forEach(item => {
                budgets[item.category] = item.amount;
            });
        }
    }
    console.log('Budgets loaded:', Object.keys(budgets).length);
}

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const incomeDate = document.getElementById('incomeDate');
    const expenseDate = document.getElementById('expenseDate');
    if (incomeDate) incomeDate.value = today;
    if (expenseDate) expenseDate.value = today;
}

function loadBudgetValues() {
    Object.keys(budgets).forEach(category => {
        const inputId = 'budget' + category.replace(/\s/g, '');
        const input = document.getElementById(inputId);
        if (input) {
            input.value = budgets[category];
        }
    });
}

// ========================================
// TAB MANAGEMENT
// ========================================
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const activeContent = document.getElementById(`${tabName}-tab`);
    if (activeContent) activeContent.classList.add('active');
    
    currentTab = tabName;
    
    // Update content when switching tabs
    if (tabName === 'dashboard') {
        updateDashboard();
    } else if (tabName === 'income') {
        renderIncomeList();
    } else if (tabName === 'expense') {
        renderExpenseList();
    } else if (tabName === 'emi') {
        renderEMIList();
    }
}

// ========================================
// FORM HANDLERS
// ========================================
function initializeForms() {
    // Income Form
    const incomeForm = document.getElementById('incomeForm');
    if (incomeForm) {
        incomeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addIncome();
        });
    }
    
    // Expense Form
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addExpense();
        });
    }
    
    // Budget Form
    const budgetForm = document.getElementById('budgetForm');
    if (budgetForm) {
        budgetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveBudget();
        });
    }
    
    // EMI Form
    const emiForm = document.getElementById('emiForm');
    if (emiForm) {
        emiForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addEMI();
        });
    }
}

async function addIncome() {
    console.log('Adding income...');
    const income = {
        date: document.getElementById('incomeDate').value,
        source: document.getElementById('incomeSource').value,
        description: document.getElementById('incomeDescription').value,
        amount: parseFloat(document.getElementById('incomeAmount').value)
    };
    
    await DataStorage.add('incomes', income);
    incomes = await DataStorage.get('incomes');
    
    document.getElementById('incomeForm').reset();
    setDefaultDates();
    showSuccess('Income added successfully! 💰');
    renderIncomeList();
    updateDashboard();
    console.log('Income added!');
}

async function addExpense() {
    console.log('Adding expense...');
    const expense = {
        date: document.getElementById('expenseDate').value,
        category: document.getElementById('expenseCategory').value,
        description: document.getElementById('expenseDescription').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        payment_method: document.getElementById('paymentMethod').value
    };
    
    await DataStorage.add('expenses', expense);
    expenses = await DataStorage.get('expenses');
    
    document.getElementById('expenseForm').reset();
    setDefaultDates();
    showSuccess('Expense added successfully! 📝');
    renderExpenseList();
    updateDashboard();
    console.log('Expense added!');
}

async function saveBudget() {
    console.log('Saving budget...');
    const categories = ['Groceries', 'Transportation', 'DiningOut', 'Utilities', 
                       'Entertainment', 'Healthcare', 'Shopping', 'Other'];
    
    categories.forEach(cat => {
        const input = document.getElementById('budget' + cat);
        const actualCategory = cat === 'DiningOut' ? 'Dining Out' : cat;
        if (input && input.value) {
            budgets[actualCategory] = parseFloat(input.value);
        }
    });
    
    await DataStorage.set('budgets', budgets);
    showSuccess('Budget saved successfully! 🎯');
    updateDashboard();
    console.log('Budget saved!');
}

async function addEMI() {
    console.log('Adding EMI...');
    const emi = {
        name: document.getElementById('emiName').value,
        lender: document.getElementById('emiLender').value,
        payment_date: parseInt(document.getElementById('emiDate').value),
        amount: parseFloat(document.getElementById('emiAmount').value)
    };
    
    await DataStorage.add('emis', emi);
    emis = await DataStorage.get('emis');
    
    document.getElementById('emiForm').reset();
    showSuccess('EMI added successfully! 💳');
    renderEMIList();
    updateDashboard();
    console.log('EMI added!');
}

// ========================================
// CALCULATIONS
// ========================================
function calculateTotalIncome() {
    return incomes.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
}

function calculateTotalExpenses() {
    return expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
}

function calculateTotalEMI() {
    return emis.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
}

function calculateNetSavings() {
    return calculateTotalIncome() - calculateTotalExpenses() - calculateTotalEMI();
}

function calculateTotalBudget() {
    return Object.values(budgets).reduce((sum, val) => sum + val, 0);
}

function calculateBudgetUsed() {
    const totalBudget = calculateTotalBudget();
    const totalSpent = calculateTotalExpenses();
    return totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
}

function getExpensesByCategory(category) {
    return expenses
        .filter(e => e.category === category)
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
}

function getWeekNumber(date) {
    const day = new Date(date).getDate();
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    return 4;
}

function getExpensesByWeek(weekNum) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return expenses
        .filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getMonth() === currentMonth &&
                   expenseDate.getFullYear() === currentYear &&
                   getWeekNumber(e.date) === weekNum;
        })
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
}

// ========================================
// UI UPDATES
// ========================================
function updateDashboard() {
    updateSummaryCards();
    renderBudgetStatus();
    renderWeeklyBudget();
    renderRecentTransactions();
}

function updateSummaryCards() {
    const totalIncome = calculateTotalIncome();
    const totalExpenses = calculateTotalExpenses();
    const netSavings = calculateNetSavings();
    const budgetUsed = calculateBudgetUsed();
    
    const incomeEl = document.getElementById('totalIncome');
    const expensesEl = document.getElementById('totalExpenses');
    const savingsEl = document.getElementById('netSavings');
    const budgetEl = document.getElementById('budgetUsed');
    
    if (incomeEl) incomeEl.textContent = formatCurrency(totalIncome);
    if (expensesEl) expensesEl.textContent = formatCurrency(totalExpenses);
    if (savingsEl) savingsEl.textContent = formatCurrency(netSavings);
    if (budgetEl) budgetEl.textContent = budgetUsed.toFixed(1) + '%';
}

function renderBudgetStatus() {
    const container = document.getElementById('budgetStatusList');
    if (!container) return;
    
    if (Object.keys(budgets).length === 0) {
        container.innerHTML = '<div class="empty-state">📊<p>No budget set. Go to Budget tab to set up.</p></div>';
        return;
    }
    
    let html = '';
    let totalBudgeted = 0;
    let totalSpent = 0;
    
    Object.keys(budgets).forEach(category => {
        const budgeted = budgets[category];
        const spent = getExpensesByCategory(category);
        totalBudgeted += budgeted;
        totalSpent += spent;
        
        const remaining = budgeted - spent;
        const percentage = budgeted > 0 ? (spent / budgeted) * 100 : 0;
        
        let progressClass = '';
        if (percentage >= 100) progressClass = 'danger';
        else if (percentage >= 80) progressClass = 'warning';
        
        html += `
            <div class="budget-item">
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <h4>${category}</h4>
                        <span style="font-weight: 600;">${formatCurrency(spent)} / ${formatCurrency(budgeted)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <p style="margin-top: 0.25rem; font-size: 0.875rem; color: var(--text-light);">
                        ${remaining >= 0 ? 'Remaining' : 'Over budget'}: ${formatCurrency(Math.abs(remaining))}
                    </p>
                </div>
            </div>
        `;
    });
    
    // Add total summary
    const totalRemaining = totalBudgeted - totalSpent;
    const totalPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
    let totalProgressClass = '';
    if (totalPercentage >= 100) totalProgressClass = 'danger';
    else if (totalPercentage >= 80) totalProgressClass = 'warning';
    
    html += `
        <div class="budget-item" style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border: 2px solid var(--primary);">
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <h4 style="color: var(--primary);">📊 TOTAL</h4>
                    <span style="font-weight: 700; color: var(--primary);">${formatCurrency(totalSpent)} / ${formatCurrency(totalBudgeted)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${totalProgressClass}" style="width: ${Math.min(totalPercentage, 100)}%"></div>
                </div>
                <p style="margin-top: 0.25rem; font-size: 0.875rem; font-weight: 600; color: var(--primary);">
                    ${totalRemaining >= 0 ? 'Remaining' : 'Over budget'}: ${formatCurrency(Math.abs(totalRemaining))}
                </p>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function renderWeeklyBudget() {
    const container = document.getElementById('weeklyBudgetList');
    if (!container) return;
    
    const totalBudget = calculateTotalBudget();
    const weeklyBudget = totalBudget / 4;
    
    let html = '';
    for (let week = 1; week <= 4; week++) {
        const spent = getExpensesByWeek(week);
        const remaining = weeklyBudget - spent;
        const percentage = weeklyBudget > 0 ? (spent / weeklyBudget) * 100 : 0;
        
        let progressClass = '';
        if (percentage >= 100) progressClass = 'danger';
        else if (percentage >= 80) progressClass = 'warning';
        
        const weekRanges = ['1-7', '8-14', '15-21', '22-End'];
        
        html += `
            <div class="week-item">
                <div class="week-header">
                    <span class="week-title">Week ${week} (${weekRanges[week-1]})</span>
                    <span class="week-amount">${formatCurrency(spent)} / ${formatCurrency(weeklyBudget)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <p style="margin-top: 0.25rem; font-size: 0.875rem; color: var(--text-light);">
                    Remaining: ${formatCurrency(remaining)}
                </p>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function renderRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    if (!container) return;
    
    // Combine and sort all transactions
    const allTransactions = [
        ...incomes.map(i => ({...i, type: 'income'})),
        ...expenses.map(e => ({...e, type: 'expense'}))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    
    if (allTransactions.length === 0) {
        container.innerHTML = '<div class="empty-state">📋<p>No transactions yet. Add income or expenses to get started!</p></div>';
        return;
    }
    
    let html = '';
    allTransactions.forEach(t => {
        const isIncome = t.type === 'income';
        const icon = isIncome ? '💰' : '💸';
        const amountClass = isIncome ? 'amount-positive' : 'amount-negative';
        const sign = isIncome ? '+' : '-';
        
        html += `
            <div class="transaction-item">
                <div class="item-info">
                    <h4>${icon} ${t.description || t.source || t.category}</h4>
                    <p>${formatDate(t.date)} • ${t.source || t.category || ''}</p>
                </div>
                <div class="item-amount ${amountClass}">${sign}${formatCurrency(t.amount)}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderIncomeList() {
    const container = document.getElementById('incomeList');
    if (!container) return;
    
    if (incomes.length === 0) {
        container.innerHTML = '<div class="empty-state">💰<p>No income recorded yet. Add your first income above!</p></div>';
        return;
    }
    
    const sorted = [...incomes].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = '';
    sorted.forEach(income => {
        html += `
            <div class="transaction-item">
                <div class="item-info">
                    <h4>${income.source}</h4>
                    <p>${formatDate(income.date)} • ${income.description}</p>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="item-amount amount-positive">+${formatCurrency(income.amount)}</div>
                    <button class="btn btn-danger" onclick="deleteIncome(${income.id})">Delete</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderExpenseList() {
    const container = document.getElementById('expenseList');
    if (!container) return;
    
    if (expenses.length === 0) {
        container.innerHTML = '<div class="empty-state">💸<p>No expenses recorded yet. Add your first expense above!</p></div>';
        return;
    }
    
    const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = '';
    sorted.forEach(expense => {
        html += `
            <div class="transaction-item">
                <div class="item-info">
                    <h4>${expense.category}</h4>
                    <p>${formatDate(expense.date)} • ${expense.description} • ${expense.payment_method || expense.paymentMethod}</p>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="item-amount amount-negative">-${formatCurrency(expense.amount)}</div>
                    <button class="btn btn-danger" onclick="deleteExpense(${expense.id})">Delete</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderEMIList() {
    const container = document.getElementById('emiList');
    if (!container) return;
    
    if (emis.length === 0) {
        container.innerHTML = '<div class="empty-state">💳<p>No EMIs added yet. Add your first EMI above!</p></div>';
        return;
    }
    
    let html = '';
    emis.forEach(emi => {
        const today = new Date().getDate();
        const paymentDate = emi.payment_date || emi.paymentDate;
        const daysUntil = paymentDate - today;
        const status = daysUntil <= 0 ? '⚠️ DUE NOW' : daysUntil <= 5 ? '⚠️ DUE SOON' : '';
        
        html += `
            <div class="emi-item">
                <div class="item-info">
                    <h4>${emi.name} ${status}</h4>
                    <p>${emi.lender} • Payment Date: ${paymentDate}th of each month</p>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="item-amount">${formatCurrency(emi.amount)}/month</div>
                    <button class="btn btn-danger" onclick="deleteEMI(${emi.id})">Delete</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ========================================
// DELETE FUNCTIONS
// ========================================
async function deleteIncome(id) {
    if (confirm('Delete this income entry?')) {
        await DataStorage.delete('incomes', id);
        incomes = await DataStorage.get('incomes');
        renderIncomeList();
        updateDashboard();
        showSuccess('Income deleted');
    }
}

async function deleteExpense(id) {
    if (confirm('Delete this expense entry?')) {
        await DataStorage.delete('expenses', id);
        expenses = await DataStorage.get('expenses');
        renderExpenseList();
        updateDashboard();
        showSuccess('Expense deleted');
    }
}

async function deleteEMI(id) {
    if (confirm('Delete this EMI entry?')) {
        await DataStorage.delete('emis', id);
        emis = await DataStorage.get('emis');
        renderEMIList();
        updateDashboard();
        showSuccess('EMI deleted');
    }
}

// ========================================
// UTILITIES
// ========================================
function formatCurrency(amount) {
    return '₹' + parseFloat(amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function showSuccess(message) {
    const existing = document.querySelector('.success-message');
    if (existing) existing.remove();
    
    const div = document.createElement('div');
    div.className = 'success-message';
    div.textContent = message;
    
    const panel = document.querySelector('.tab-content.active .panel');
    if (panel) {
        panel.insertBefore(div, panel.firstChild);
        setTimeout(() => div.remove(), 3000);
    }
}
