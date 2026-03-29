<?php
require_once '../includes/db.php';

// Set header for JSON response
header('Content-Type: application/json');

// Get the action from query parameters
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'register':
        registerUser($conn);
        break;
    case 'login':
        loginUser($conn);
        break;
    default:
        echo json_encode(["success" => false, "message" => "Invalid action"]);
        exit;
}

function registerUser($conn) {
    // Get JSON POST data
    $data = json_decode(file_get_contents("php://input"));
    
    if(!isset($data->username) || !isset($data->password)) {
        echo json_encode(["success" => false, "message" => "Missing credentials"]);
        return;
    }

    $username = $conn->real_escape_string($data->username);
    $password = $data->password;

    // Check if user already exists
    $check_sql = "SELECT id FROM users WHERE username = '$username'";
    $check_res = $conn->query($check_sql);
    
    if($check_res && $check_res->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "Username already exists"]);
        return;
    }

    $hashed_pw = password_hash($password, PASSWORD_DEFAULT);
    
    $sql = "INSERT INTO users (username, password) VALUES ('$username', '$hashed_pw')";
    
    if($conn->query($sql) === TRUE) {
        echo json_encode(["success" => true, "message" => "Registration successful. You can now login."]);
    } else {
        echo json_encode(["success" => false, "message" => "Error creating user: " . $conn->error]);
    }
}

function loginUser($conn) {
    // Get JSON POST data
    $data = json_decode(file_get_contents("php://input"));
    
    if(!isset($data->username) || !isset($data->password)) {
        echo json_encode(["success" => false, "message" => "Missing credentials"]);
        return;
    }

    $username = $conn->real_escape_string($data->username);
    $password = $data->password;

    $sql = "SELECT id, username, password FROM users WHERE username = '$username'";
    $res = $conn->query($sql);

    if($res && $res->num_rows > 0) {
        $user = $res->fetch_assoc();
        if(password_verify($password, $user['password'])) {
            // Success
            unset($user['password']); // don't send hash back
            echo json_encode(["success" => true, "data" => $user]);
        } else {
            echo json_encode(["success" => false, "message" => "Invalid password"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "User not found"]);
    }
}
?>
