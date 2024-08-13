const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// Mock user data
const users = [
    {
        id: 1,
        username: 'testuser',
        password: '$2a$10$somethinghashed', // This should be a hashed password
    }
];

// Mock expense data
let expenses = [
    { id: 1, userId: 1, date: '2024-08-13', amount: 50, category: 'Food', description: 'Groceries' },
    { id: 2, userId: 1, date: '2024-08-14', amount: 20, category: 'Transport', description: 'Bus fare' }
];

// Secret key for JWT
const JWT_SECRET = 'your_jwt_secret_key';

// Helper function to find a user by username
function findUserByUsername(username) {
    return users.find(user => user.username === username);
}

// Helper function to authenticate a user
function authenticateToken(req, res, next) {
    const token = req.header('Authorization').replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Access denied, no token provided' });

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token' });
    }
}

// POST /api/auth/login: User authentication
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    // Find user by username
    const user = findUserByUsername(username);
    if (!user) return res.status(400).json({ message: 'Invalid username or password' });

    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(400).json({ message: 'Invalid username or password' });

    // Generate JWT
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

// GET /api/expenses: Retrieve all expenses for a user
app.get('/api/expenses', authenticateToken, (req, res) => {
    const userExpenses = expenses.filter(expense => expense.userId === req.user.id);
    res.json(userExpenses);
});

// POST /api/expenses: Add a new expense
app.post('/api/expenses', authenticateToken, (req, res) => {
    const { date, amount, category, description } = req.body;
    const newExpense = {
        id: expenses.length + 1,
        userId: req.user.id,
        date,
        amount,
        category,
        description
    };
    expenses.push(newExpense);
    res.json(newExpense);
});

// PUT /api/expenses/:id: Update an existing expense
app.put('/api/expenses/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { date, amount, category, description } = req.body;

    const expense = expenses.find(exp => exp.id === parseInt(id) && exp.userId === req.user.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    expense.date = date || expense.date;
    expense.amount = amount || expense.amount;
    expense.category = category || expense.category;
    expense.description = description || expense.description;

    res.json(expense);
});

// DELETE /api/expenses/:id: Delete an existing expense
app.delete('/api/expenses/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    expenses = expenses.filter(exp => exp.id !== parseInt(id) || exp.userId !== req.user.id);
    res.json({ message: 'Expense deleted' });
});

// GET /api/expense: Calculate the total expense for a user
app.get('/api/expense', authenticateToken, (req, res) => {
    const userExpenses = expenses.filter(expense => expense.userId === req.user.id);
    const totalExpense = userExpenses.reduce((total, expense) => total + expense.amount, 0);
    res.json({ totalExpense });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
