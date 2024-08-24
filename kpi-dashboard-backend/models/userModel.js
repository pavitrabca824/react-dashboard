const db = require('../config/db');

const createUserTable = `
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
)`;

db.query(createUserTable, (err, results) => {
    if (err) throw err;
    console.log("Users table created or already exists");
});
