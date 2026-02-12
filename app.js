// ========================================
// SUPABASE CONFIGURATION
// ========================================
// TODO: Replace with your Supabase credentials
const SUPABASE_URL = 'https://ibwhxapresrcmyzumcoh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2h4YXByZXNyY215enVtY29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDEwOTYsImV4cCI6MjA4NjExNzA5Nn0.aWs7bgiXF6ObCG0e9JK07MLDCbIoy9L6XPA0tVQ1G14';

// Initialize Supabase
   const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ========================================
// DATA STORAGE (Using localStorage for demo)
// Replace with Supabase calls
// ========================================
class DataStorage {
    static async get(key) {
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
        try {
            delete item.id; // Let database create ID
            const { data, error } = await supabase.from(key).insert([item]).select();
            if (error) throw error;
            return data[0];
        } catch (err) {
            console.error('Error adding data:', err);
            return null;
        }
    }
    
    static async delete(key, id) {
        try {
            const { error } = await supabase.from(key).delete().eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error('Error deleting data:', err);
        }
    }
}
    
    static set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
    
    static add(key, item) {
        const items = this.get(key);
        item.id = Date.now() + Math.random();
        items.push(item);
        this.set(key, items);
        return item;
    }
    
    static delete(key, id) {
        const items = this.get(key);
        const filtered = items.filter(item => item.id !== id);
        this.set(key, filtered);
    }
}

// ========================================
// APP STATE
// ========================================
let currentTab = 'dashboard';
let incomes = DataStorage.get('incomes');
let expenses = DataStorage.get('expenses');
let budgets = getDefaultBudgets();
let emis = DataStorage.get('emis');

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
       await loadAllData();
       initializeTabs();
       initializeForms();
       setDefaultDates();
       loadBudgetValues();
       updateDashboard();
   });
   
   async function loadAllData() {
       incomes = await DataStorage.get('incomes');
       expenses = await DataStorage.get('expenses');
       emis = await DataStorage.get('emis');
       
       // Load budgets
       const budgetData = await DataStorage.get('budgets');
       if (budgetData && budgetData.length > 0) {
           budgets = {};
           budgetData.forEach(item => {
               budgets[item.category] = item.amount;
           });
       }
   }

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('incomeDate').value = today;
    document.getElementById('expenseDate').value = today;
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
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
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
    document.getElementById('incomeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addIncome();
    });
    
    // Expense Form
    document.getElementById('expenseForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addExpense();
    });
    
    // Budget Form
    document.getElementById('budgetForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveBudget();
    });
    
    // EMI Form
    document.getElementById('emiForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addEMI();
    });
}

async function addIncome() {
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
   }
}

async function addExpense() {
    const expense = {
        date: document.getElementById('expenseDate').value,
        category: document.getElementById('expenseCategory').value,
        description: document.getElementById('expenseDescription').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        paymentMethod: document.getElementById('paymentMethod').value
    };
    
    await DataStorage.add('expenses', expense);
    expenses = await DataStorage.get('expenses');
    
    document.getElementById('expenseForm').reset();
    setDefaultDates();
    showSuccess('Expense added successfully! 📝');
    renderExpenseList();
    updateDashboard();
}

async function saveBudget() {
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
}

async function addEMI() {
    const emi = {
        name: document.getElementById('emiName').value,
        lender: document.getElementById('emiLender').value,
        paymentDate: parseInt(document.getElementById('emiDate').value),
        amount: parseFloat(document.getElementById('emiAmount').value)
    };
    
    await DataStorage.add('emis', emi);
    emis = await DataStorage.get('emis');
    
    document.getElementById('emiForm').reset();
    showSuccess('EMI added successfully! 💳');
    renderEMIList();
    updateDashboard();
}

// ========================================
// CALCULATIONS
// ========================================
function calculateTotalIncome() {
    return incomes.reduce((sum, item) => sum + item.amount, 0);
}

function calculateTotalExpenses() {
    return expenses.reduce((sum, item) => sum + item.amount, 0);
}

function calculateTotalEMI() {
    return emis.reduce((sum, item) => sum + item.amount, 0);
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
        .reduce((sum, e) => sum + e.amount, 0);
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
        .reduce((sum, e) => sum + e.amount, 0);
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
    
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('netSavings').textContent = formatCurrency(netSavings);
    document.getElementById('budgetUsed').textContent = budgetUsed.toFixed(1) + '%';
}

function renderBudgetStatus() {
    const container = document.getElementById('budgetStatusList');
    
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
    
    // Add total summary at the end
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
    
    // Combine and sort all transactions
    const allTransactions = [
        ...incomes.map(i => ({...i, type: 'income'})),
        ...expenses.map(e => ({...e, type: 'expense'}))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    
    if (allTransactions.length === 0) {
        container.innerHTML = '<div class="empty-state">📋<p>No transactions yet</p></div>';
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
    
    if (incomes.length === 0) {
        container.innerHTML = '<div class="empty-state">💰<p>No income recorded yet</p></div>';
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
    
    if (expenses.length === 0) {
        container.innerHTML = '<div class="empty-state">💸<p>No expenses recorded yet</p></div>';
        return;
    }
    
    const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = '';
    sorted.forEach(expense => {
        html += `
            <div class="transaction-item">
                <div class="item-info">
                    <h4>${expense.category}</h4>
                    <p>${formatDate(expense.date)} • ${expense.description} • ${expense.paymentMethod}</p>
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
    
    if (emis.length === 0) {
        container.innerHTML = '<div class="empty-state">💳<p>No EMIs added yet</p></div>';
        return;
    }
    
    let html = '';
    emis.forEach(emi => {
        const today = new Date().getDate();
        const daysUntil = emi.paymentDate - today;
        const status = daysUntil <= 0 ? '⚠️ DUE NOW' : daysUntil <= 5 ? '⚠️ DUE SOON' : '';
        
        html += `
            <div class="emi-item">
                <div class="item-info">
                    <h4>${emi.name} ${status}</h4>
                    <p>${emi.lender} • Payment Date: ${emi.paymentDate}th of each month</p>
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
function deleteIncome(id) {
    if (confirm('Delete this income entry?')) {
        DataStorage.delete('incomes', id);
        incomes = DataStorage.get('incomes');
        renderIncomeList();
        updateDashboard();
        showSuccess('Income deleted');
    }
}

function deleteExpense(id) {
    if (confirm('Delete this expense entry?')) {
        DataStorage.delete('expenses', id);
        expenses = DataStorage.get('expenses');
        renderExpenseList();
        updateDashboard();
        showSuccess('Expense deleted');
    }
}

function deleteEMI(id) {
    if (confirm('Delete this EMI entry?')) {
        DataStorage.delete('emis', id);
        emis = DataStorage.get('emis');
        renderEMIList();
        updateDashboard();
        showSuccess('EMI deleted');
    }
}

// ========================================
// UTILITIES
// ========================================
function formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN', {
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
