<?php
header("Content-Type: application/json");

$user_id = isset($_SERVER['HTTP_X_USER_ID']) ? (int)$_SERVER['HTTP_X_USER_ID'] : 0;
if (!$user_id) {
    echo json_encode(["success"=>false, "error"=>"Unauthorized"]);
    exit;
}

// ✅ CONNECT YOUR EXISTING DB
$conn = new mysqli("localhost", "root", "", "dairy_db");

if ($conn->connect_error) {
    echo json_encode(["success"=>false, "error"=>"Database connection failed"]);
    exit;
}

// ✅ GET → FETCH CUSTOMERS
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $result = $conn->query("SELECT * FROM customers WHERE user_id=$user_id ORDER BY id DESC");

    $data = [];

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
    }

    echo json_encode(["success"=>true, "data"=>$data]);
    exit;
}

// ✅ POST → INSERT CUSTOMER
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $input = json_decode(file_get_contents("php://input"), true);

    if (!$input) {
        echo json_encode(["success"=>false, "error"=>"Invalid input"]);
        exit;
    }

    // Match column names with your DB
    $customer_code = $conn->real_escape_string($input['customer_code']);
    $name          = $conn->real_escape_string($input['name']);
    $phone         = $conn->real_escape_string($input['phone']);
    $animal_type   = $conn->real_escape_string($input['animal_type']);
    $address       = $conn->real_escape_string($input['address']);

    $sql = "INSERT INTO customers (user_id, customer_code, name, phone, animal_type, address)
            VALUES ($user_id, '$customer_code', '$name', '$phone', '$animal_type', '$address')";

    if ($conn->query($sql)) {
        echo json_encode(["success"=>true]);
    } else {
        echo json_encode(["success"=>false, "error"=>$conn->error]);
    }

    exit;
}
// ✅ PUT → UPDATE CUSTOMER
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input) {
        echo json_encode(["success"=>false, "error"=>"Invalid input"]);
        exit;
    }

    $id = (int)$input['id'];
    $customer_code = $conn->real_escape_string($input['customer_code']);
    $name          = $conn->real_escape_string($input['name']);
    $phone         = $conn->real_escape_string($input['phone']);
    $animal_type   = $conn->real_escape_string($input['animal_type']);
    $address       = $conn->real_escape_string($input['address']);

    $sql = "UPDATE customers SET customer_code='$customer_code', name='$name', phone='$phone', animal_type='$animal_type', address='$address' WHERE id=$id AND user_id=$user_id";

    if ($conn->query($sql)) {
        echo json_encode(["success"=>true]);
    } else {
        echo json_encode(["success"=>false, "error"=>$conn->error]);
    }
    exit;
}

// ✅ DELETE → DELETE CUSTOMER
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input) {
        echo json_encode(["success"=>false, "error"=>"Invalid input"]);
        exit;
    }
    $id = (int)$input['id'];

    if ($conn->query("DELETE FROM customers WHERE id=$id AND user_id=$user_id")) {
        echo json_encode(["success"=>true]);
    } else {
        echo json_encode(["success"=>false, "error"=>$conn->error]);
    }
    exit;
}
?>