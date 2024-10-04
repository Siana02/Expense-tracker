const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON bodies

// Mock user data
const users = [
    { id: 1, username: 'user1', password: '$2b$10$Xbcd...hashedPassword' } // hashed password example
];

// Middleware for authentication (JWT)
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, 'SECRET_KEY', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// POST /api/auth/login - Authenticate user and issue JWT token
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    // Find user by username
    const user = users.find(u => u.username === username);
    if (!user) return res.status(400).send('Cannot find user');

    // Validate password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(403).send('Invalid credentials');

    // Generate JWT
    const token = jwt.sign({ username: user.username }, 'SECRET_KEY');
    res.json({ token });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


// In-memory storage for expenses
const expenses = [];

// GET /api/expenses - Retrieve all expenses for a user
app.get('/api/expenses', authenticateToken, (req, res) => {
    res.json(expenses.filter(expense => expense.user === req.user.username));
});

// POST /api/expenses - Add a new expense
app.post('/api/expenses', authenticateToken, (req, res) => {
    const { date, amount, category, description } = req.body;
    const newExpense = {
        id: expenses.length + 1,
        user: req.user.username,
        date,
        amount,
        category,
        description
    };
    expenses.push(newExpense);
    res.status(201).json(newExpense);
});

// PUT /api/expenses/:id - Update an existing expense
app.put('/api/expenses/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { date, amount, category, description } = req.body;

    const expense = expenses.find(exp => exp.id === parseInt(id) && exp.user === req.user.username);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    // Update fields
    expense.date = date;
    expense.amount = amount;
    expense.category = category;
    expense.description = description;

    res.json(expense);
});

// DELETE /api/expenses/:id - Delete an existing expense
app.delete('/api/expenses/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const index = expenses.findIndex(exp => exp.id === parseInt(id) && exp.user === req.user.username);
    if (index === -1) return res.status(404).json({ error: 'Expense not found' });

    expenses.splice(index, 1);
    res.status(204).send();
});

// GET /api/expense - Calculate total expense for a user
app.get('/api/expense', authenticateToken, (req, res) => {
    const total = expenses
        .filter(exp => exp.user === req.user.username)
        .reduce((sum, exp) => sum + exp.amount, 0);

    res.json({ total });
});
const { body, validationResult } = require('express-validator');

app.post(
    '/api/expenses',
    authenticateToken,
    [
        body('amount').isNumeric().withMessage('Amount must be a number'),
        body('category').isString().withMessage('Category is required')
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { date, amount, category, description } = req.body;
        const newExpense = {
            id: expenses.length + 1,
            user: req.user.username,
            date,
            amount,
            category,
            description
        };
        expenses.push(newExpense);
        res.status(201).json(newExpense);
    }
);
