<?php
header("Content-Type: application/json");

// ✅ CONNECT YOUR EXISTING DB
$conn = new mysqli("localhost", "root", "", "dairy_db");

if ($conn->connect_error) {
    echo json_encode(["success"=>false, "error"=>"Database connection failed"]);
    exit;
}

// ✅ GET → FETCH CUSTOMERS
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $result = $conn->query("SELECT * FROM customers ORDER BY id DESC");

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

    $sql = "INSERT INTO customers (customer_code, name, phone, animal_type, address)
            VALUES ('$customer_code', '$name', '$phone', '$animal_type', '$address')";

    if ($conn->query($sql)) {
        echo json_encode(["success"=>true]);
    } else {
        echo json_encode(["success"=>false, "error"=>$conn->error]);
    }

    exit;
}
?>