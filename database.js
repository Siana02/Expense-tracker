// database.js
const { Sequelize, DataTypes } = require('sequelize');

// Create a Sequelize instance
const sequelize = new Sequelize('expense_tracker', 'siana', 'your_password', {
    host: 'localhost',
    dialect: 'mysql', // or 'mariadb'
});

// Test the connection
sequelize.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

// Define the User model
const User = sequelize.define('User', {
    user_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'Users',
    timestamps: true,
});

// Define the Category model
const Category = sequelize.define('Category', {
    category_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    category_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'Categories',
    timestamps: true,
});

// Define the Expense model
const Expense = sequelize.define('Expense', {
    expense_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
    },
    category_id: {
        type: DataTypes.INTEGER,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
}, {
    tableName: 'Expenses',
    timestamps: true,
});

// Set up associations
User.hasMany(Expense, { foreignKey: 'user_id' });
Expense.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Category, { foreignKey: 'user_id' });
Category.belongsTo(User, { foreignKey: 'user_id' });

Category.hasMany(Expense, { foreignKey: 'category_id' });
Expense.belongsTo(Category, { foreignKey: 'category_id' });

// Sync the database
sequelize.sync({ force: false }) // Set to true to drop existing tables and recreate
    .then(() => {
        console.log('Database & tables created!');
    })
    .catch(err => {
        console.error('Error creating database & tables:', err);
    });
