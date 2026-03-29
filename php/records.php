<?php
header('Content-Type: application/json');
require_once '../includes/db.php';

$user_id = isset($_SERVER['HTTP_X_USER_ID']) ? (int)$_SERVER['HTTP_X_USER_ID'] : 0;
if (!$user_id) {
    echo json_encode(["success"=>false, "error"=>"Unauthorized"]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] == 'GET') {

    $res = $conn->query("
        SELECT mr.*, c.name 
        FROM milk_records mr
        JOIN customers c ON c.id = mr.customer_id
        WHERE mr.user_id = $user_id
        ORDER BY mr.id DESC
    ");

    $data = [];
    while ($row = $res->fetch_assoc()) $data[] = $row;

    echo json_encode(["success"=>true,"data"=>$data]);
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $d = json_decode(file_get_contents("php://input"), true);

    $customer_id = (int)$d['customer_id'];
    $record_date = $conn->real_escape_string($d['record_date']);
    $shift = $conn->real_escape_string($d['shift']);
    $liter_amount = (float)$d['liter_amount'];
    $fat_percentage = (float)$d['fat_percentage'];
    $rate_per_liter = (float)$d['rate_per_liter'];
    $collected_amount = isset($d['collected_amount']) ? (float)$d['collected_amount'] : 0.0;
    
    $amount = $liter_amount * $rate_per_liter;
    $balance = $amount - $collected_amount;

    $sql = "INSERT INTO milk_records 
            (user_id, customer_id, record_date, shift, liter_amount, fat_percentage, rate_per_liter, daily_amount, collected_amount, balance)
            VALUES 
            ($user_id, $customer_id, '$record_date', '$shift', $liter_amount, $fat_percentage, $rate_per_liter, $amount, $collected_amount, $balance)";

    if ($conn->query($sql)) {
        echo json_encode(["success"=>true,"message"=>"Saved"]);
    } else {
        echo json_encode(["success"=>false,"error"=>$conn->error]);
    }
}
if ($_SERVER['REQUEST_METHOD'] == 'PUT') {
    $d = json_decode(file_get_contents("php://input"), true);
    
    $id = (int)$d['id'];
    $customer_id = (int)$d['customer_id'];
    $record_date = $conn->real_escape_string($d['record_date']);
    $shift = $conn->real_escape_string($d['shift']);
    $liter_amount = (float)$d['liter_amount'];
    $fat_percentage = (float)$d['fat_percentage'];
    $rate_per_liter = (float)$d['rate_per_liter'];
    $collected_amount = isset($d['collected_amount']) ? (float)$d['collected_amount'] : 0.0;
    
    $amount = $liter_amount * $rate_per_liter;
    $balance = $amount - $collected_amount;

    $sql = "UPDATE milk_records SET 
            customer_id=$customer_id, 
            record_date='$record_date', 
            shift='$shift', 
            liter_amount=$liter_amount, 
            fat_percentage=$fat_percentage, 
            rate_per_liter=$rate_per_liter, 
            daily_amount=$amount, 
            collected_amount=$collected_amount, 
            balance=$balance
            WHERE id=$id AND user_id=$user_id";

    if ($conn->query($sql)) {
        echo json_encode(["success"=>true,"message"=>"Updated"]);
    } else {
        echo json_encode(["success"=>false,"error"=>$conn->error]);
    }
}

if ($_SERVER['REQUEST_METHOD'] == 'DELETE') {
    $d = json_decode(file_get_contents("php://input"), true);
    $id = (int)$d['id'];
    
    if ($conn->query("DELETE FROM milk_records WHERE id=$id AND user_id=$user_id")) {
        echo json_encode(["success"=>true,"message"=>"Deleted"]);
    } else {
        echo json_encode(["success"=>false,"error"=>$conn->error]);
    }
}
?>