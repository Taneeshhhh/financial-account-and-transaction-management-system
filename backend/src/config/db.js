const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "your_password",
    database: "your_db_name"
});

db.connect((err) => {
    if (err) {  
        console.log("DB connection failed", err);
    } else {
        console.log("DB connected");
    }
});

module.exports = db;