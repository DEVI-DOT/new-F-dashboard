# 💰 Personal Finance Dashboard

A modern, easy-to-use web application to track your income, expenses, budget, and EMIs in real-time.

## ✨ Features

- **Dashboard Overview**: See your total income, expenses, savings, and budget usage at a glance
- **Income Tracking**: Record all income sources with dates and descriptions
- **Expense Tracking**: Track expenses by category with payment methods
- **Budget Management**: Set monthly budgets per category and track spending
- **Weekly Budget**: Automatically breaks down monthly budget into weekly targets
- **EMI Tracker**: Keep track of all EMI payments and get alerts for upcoming dues
- **Real-time Calculations**: All totals and percentages update automatically
- **Clean, Modern UI**: Easy to use on desktop and mobile devices

## 🚀 Quick Start

### Option 1: Local Development (Using localStorage)

1. Clone this repository
2. Open `index.html` in your browser
3. Start tracking your finances!

Data is stored in your browser's localStorage.

### Option 2: Deploy to GitHub Pages + Supabase

#### Step 1: Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to SQL Editor and run this schema:

```sql
-- Create tables
CREATE TABLE incomes (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    source TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE expenses (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE budgets (
    id BIGSERIAL PRIMARY KEY,
    category TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE emis (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    lender TEXT NOT NULL,
    payment_date INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE emis ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for demo - customize for production)
CREATE POLICY "Enable all for incomes" ON incomes FOR ALL USING (true);
CREATE POLICY "Enable all for expenses" ON expenses FOR ALL USING (true);
CREATE POLICY "Enable all for budgets" ON budgets FOR ALL USING (true);
CREATE POLICY "Enable all for emis" ON emis FOR ALL USING (true);
```

4. Get your Supabase URL and anon key from Settings > API

#### Step 2: Configure the App

1. Open `app.js`
2. Replace these lines at the top:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

3. Add Supabase JS library to `index.html` (add before `<script src="app.js"></script>`):

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

4. Update the DataStorage class in `app.js` to use Supabase:

```javascript
// Replace the DataStorage class with Supabase calls
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

class DataStorage {
    static async get(table) {
        const { data, error } = await supabase.from(table).select('*');
        return data || [];
    }
    
    static async add(table, item) {
        const { data, error } = await supabase.from(table).insert([item]).select();
        return data[0];
    }
    
    static async delete(table, id) {
        const { error } = await supabase.from(table).delete().eq('id', id);
    }
    
    static async set(table, value) {
        // For budgets table
        const { data, error } = await supabase.from(table).upsert(
            Object.keys(value).map(category => ({
                category: category,
                amount: value[category]
            })),
            { onConflict: 'category' }
        );
    }
}
```

#### Step 3: Deploy to GitHub Pages

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

2. Go to your repository Settings > Pages
3. Select "main" branch as source
4. Your site will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO/`

## 📁 File Structure

```
finance-dashboard/
├── index.html          # Main HTML structure
├── styles.css          # All styles and responsive design
├── app.js              # JavaScript logic and data handling
└── README.md           # This file
```

## 🎯 How to Use

### 1. Add Income
- Click "Add Income" tab
- Select date, source, description, and amount
- Click "Add Income" button

### 2. Add Expense
- Click "Add Expense" tab
- Select date, category, description, amount, and payment method
- Click "Add Expense" button

### 3. Set Budget
- Click "Budget" tab
- Enter budget amounts for each category
- Click "Save Budget"
- The dashboard will automatically track your spending vs budget

### 4. Track EMIs
- Click "EMI Tracker" tab
- Enter EMI name, lender, payment date, and amount
- Click "Add EMI"
- Get alerts for upcoming payments on the dashboard

## 🔐 Security Notes

For production use:
1. Set up proper Row Level Security (RLS) policies in Supabase
2. Implement user authentication
3. Never commit your Supabase keys to GitHub
4. Use environment variables for sensitive data

## 🎨 Customization

### Change Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary: #6366f1;        /* Main theme color */
    --success: #10b981;        /* Income/positive color */
    --danger: #ef4444;         /* Expense/negative color */
    --warning: #f59e0b;        /* Warning color */
}
```

### Add Categories
Edit the expense categories in `index.html` and budget form:
```html
<option value="YourCategory">🆕 Your Category</option>
```

## 📱 Mobile Support

The app is fully responsive and works great on mobile devices!

## 🆘 Need Help?

If you encounter any issues:
1. Check browser console for errors (F12)
2. Verify Supabase credentials are correct
3. Check Supabase logs for database errors
4. Ensure tables are created properly

## 📝 License

Free to use and modify for personal and commercial projects.

---

**Made with ❤️ for better financial management**
