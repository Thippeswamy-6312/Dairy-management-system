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
?>