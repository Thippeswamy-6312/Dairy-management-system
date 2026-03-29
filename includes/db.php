<?php
$conn = new mysqli("localhost", "root", "", "dairy_db");

if ($conn->connect_error) {
    die(json_encode(["success"=>false,"message"=>"DB Failed"]));
}

// Automatically initialize the users table for authentication
$users_table_query = "CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";
$conn->query($users_table_query);

// Helper to add missing columns securely
function addColumnIfNotExists($conn, $table, $column) {
    // Check if table exists first
    $table_check = $conn->query("SHOW TABLES LIKE '$table'");
    if ($table_check && $table_check->num_rows > 0) {
        $res = $conn->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
        if ($res && $res->num_rows == 0) {
            $conn->query("ALTER TABLE `$table` ADD COLUMN `$column` INT NOT NULL DEFAULT 1");
        }
    }
}

// Ensure existing tables have user_id assigned (DEFAULT 1 for primary initial user)
addColumnIfNotExists($conn, 'customers', 'user_id');
addColumnIfNotExists($conn, 'milk_records', 'user_id');
addColumnIfNotExists($conn, 'payments', 'user_id');
?>