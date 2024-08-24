const db = require('../config/db');

const createKpiTable = `
CREATE TABLE IF NOT EXISTS kpi_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    target VARCHAR(255) NOT NULL,
    achievement INT NOT NULL
)`;

db.query(createKpiTable, (err, results) => {
    if (err) throw err;
    console.log("KPI data table created or already exists");
});
