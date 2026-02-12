# 🗄️ Supabase Setup Guide

## Step-by-Step Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up or log in
4. Click "New Project"
5. Fill in:
   - Project name: "finance-dashboard" (or your choice)
   - Database password: (save this securely)
   - Region: Choose closest to you
6. Click "Create new project"
7. Wait for setup to complete (~2 minutes)

### 2. Create Database Tables

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy and paste this entire SQL script:

```sql
-- ============================================
-- PERSONAL FINANCE DASHBOARD DATABASE SCHEMA
-- ============================================

-- Table: incomes
-- Stores all income entries
CREATE TABLE incomes (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    source TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: expenses
-- Stores all expense entries
CREATE TABLE expenses (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: budgets
-- Stores budget amounts per category
CREATE TABLE budgets (
    id BIGSERIAL PRIMARY KEY,
    category TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: emis
-- Stores EMI/loan information
CREATE TABLE emis (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    lender TEXT NOT NULL,
    payment_date INTEGER NOT NULL CHECK (payment_date >= 1 AND payment_date <= 31),
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR BETTER PERFORMANCE
-- ============================================

CREATE INDEX idx_incomes_date ON incomes(date DESC);
CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_budgets_category ON budgets(category);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE emis ENABLE ROW LEVEL SECURITY;

-- Create policies
-- NOTE: For demo purposes, these allow all operations
-- In production, you should add authentication and user-specific policies

CREATE POLICY "Enable read access for all users" ON incomes
    FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON incomes
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete for all users" ON incomes
    FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON expenses
    FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON expenses
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete for all users" ON expenses
    FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON budgets
    FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON budgets
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON budgets
    FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON budgets
    FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON emis
    FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON emis
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete for all users" ON emis
    FOR DELETE USING (true);

-- ============================================
-- SAMPLE DATA (OPTIONAL)
-- ============================================

-- Insert default budget categories
INSERT INTO budgets (category, amount) VALUES
    ('Groceries', 15000),
    ('Transportation', 5000),
    ('Dining Out', 8000),
    ('Utilities', 3000),
    ('Entertainment', 5000),
    ('Healthcare', 3000),
    ('Shopping', 10000),
    ('Other', 5000)
ON CONFLICT (category) DO NOTHING;

-- Insert sample income (optional - remove if you don't want sample data)
INSERT INTO incomes (date, source, description, amount) VALUES
    (CURRENT_DATE, 'Salary', 'Monthly salary', 80000),
    (CURRENT_DATE - INTERVAL '15 days', 'Freelance', 'Side project', 15000);

-- Insert sample expenses (optional - remove if you don't want sample data)
INSERT INTO expenses (date, category, description, amount, payment_method) VALUES
    (CURRENT_DATE, 'Groceries', 'Weekly groceries', 5000, 'Credit Card'),
    (CURRENT_DATE - INTERVAL '2 days', 'Transportation', 'Petrol', 2000, 'Debit Card'),
    (CURRENT_DATE - INTERVAL '5 days', 'Dining Out', 'Restaurant', 1500, 'UPI');
```

4. Click **RUN** or press `Ctrl + Enter`
5. You should see "Success. No rows returned"

### 3. Get Your API Credentials

1. Go to **Settings** > **API** (left sidebar)
2. Find these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")
3. Copy both values - you'll need them!

### 4. Update Your App

1. Open `app.js` in your project
2. Find these lines at the top:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

3. Replace with your actual values:
```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_KEY = 'your-anon-key-here';
```

### 5. Add Supabase Library

1. Open `index.html`
2. Add this line BEFORE `<script src="app.js"></script>`:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### 6. Update Data Storage (Advanced)

The current app uses localStorage. To use Supabase, you need to update the `DataStorage` class in `app.js`.

Here's the updated version:

```javascript
// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Updated DataStorage class for Supabase
class DataStorage {
    static async get(key) {
        const { data, error } = await supabase.from(key).select('*');
        if (error) {
            console.error('Error fetching data:', error);
            return [];
        }
        return data || [];
    }
    
    static async getBudgets() {
        const { data, error } = await supabase.from('budgets').select('*');
        if (error) return getDefaultBudgets();
        
        const budgetObj = {};
        data.forEach(item => {
            budgetObj[item.category] = item.amount;
        });
        return budgetObj;
    }
    
    static async add(key, item) {
        delete item.id; // Remove id as it's auto-generated
        const { data, error } = await supabase.from(key).insert([item]).select();
        if (error) {
            console.error('Error adding data:', error);
            return null;
        }
        return data[0];
    }
    
    static async delete(key, id) {
        const { error } = await supabase.from(key).delete().eq('id', id);
        if (error) {
            console.error('Error deleting data:', error);
        }
    }
    
    static async saveBudgets(budgets) {
        const budgetArray = Object.keys(budgets).map(category => ({
            category: category,
            amount: budgets[category]
        }));
        
        const { data, error } = await supabase.from('budgets').upsert(
            budgetArray,
            { onConflict: 'category' }
        );
        
        if (error) {
            console.error('Error saving budgets:', error);
        }
    }
}

// Then update all DataStorage.get() calls to be async
// Example:
async function loadData() {
    incomes = await DataStorage.get('incomes');
    expenses = await DataStorage.get('expenses');
    budgets = await DataStorage.getBudgets();
    emis = await DataStorage.get('emis');
    updateDashboard();
}
```

## 🔍 Verify Everything Works

1. Open your app in the browser
2. Add a test income or expense
3. Go to Supabase > **Table Editor**
4. Select the relevant table (incomes/expenses)
5. You should see your data!

## 🔐 Production Security Tips

For a production app with user accounts:

1. Enable Supabase Authentication
2. Update RLS policies to use user ID:
```sql
CREATE POLICY "Users can only see their own data" ON incomes
    FOR SELECT USING (auth.uid() = user_id);
```

3. Add a `user_id` column to all tables
4. Never expose your `service_role` key

## 🆘 Troubleshooting

**Error: "Failed to fetch"**
- Check your Supabase URL and key are correct
- Verify your project is running in Supabase dashboard

**Error: "Permission denied"**
- Check RLS policies are set up correctly
- Verify tables have the correct policies

**Data not showing**
- Open browser console (F12) to see errors
- Check Supabase logs in the dashboard

## 📚 Useful Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

✅ **You're all set!** Your finance dashboard is now connected to Supabase.
