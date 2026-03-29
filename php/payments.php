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
        SELECT p.*, c.name 
        FROM payments p
        JOIN customers c ON c.id = p.customer_id
        WHERE p.user_id = $user_id
    ");

    $data=[];
    while($row=$res->fetch_assoc()) $data[]=$row;

    echo json_encode(["success"=>true,"data"=>$data]);
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $d = json_decode(file_get_contents("php://input"), true);

    $customer_id = (int)$d['customer_id'];
    $payment_date = $conn->real_escape_string($d['payment_date'] ?? date('Y-m-d'));
    $amount = (float)$d['amount'];
    $mode = $conn->real_escape_string($d['mode'] ?? 'cash');

    $sql = "INSERT INTO payments (user_id, customer_id, payment_date, amount, mode)
            VALUES ($user_id, $customer_id, '$payment_date', $amount, '$mode')";

    if ($conn->query($sql)) {
        echo json_encode(["success"=>true,"message"=>"Payment Added"]);
    } else {
        echo json_encode(["success"=>false,"error"=>$conn->error]);
    }
}
if ($_SERVER['REQUEST_METHOD'] == 'PUT') {
    $d = json_decode(file_get_contents("php://input"), true);

    $id = (int)$d['id'];
    $customer_id = (int)$d['customer_id'];
    $payment_date = $conn->real_escape_string($d['payment_date'] ?? date('Y-m-d'));
    $amount = (float)$d['amount'];
    $mode = $conn->real_escape_string($d['mode'] ?? 'cash');

    $sql = "UPDATE payments SET customer_id=$customer_id, payment_date='$payment_date', amount=$amount, mode='$mode' WHERE id=$id AND user_id=$user_id";

    if ($conn->query($sql)) {
        echo json_encode(["success"=>true,"message"=>"Payment Updated"]);
    } else {
        echo json_encode(["success"=>false,"error"=>$conn->error]);
    }
}

if ($_SERVER['REQUEST_METHOD'] == 'DELETE') {
    $d = json_decode(file_get_contents("php://input"), true);
    $id = (int)$d['id'];
    
    if ($conn->query("DELETE FROM payments WHERE id=$id AND user_id=$user_id")) {
        echo json_encode(["success"=>true,"message"=>"Deleted"]);
    } else {
        echo json_encode(["success"=>false,"error"=>$conn->error]);
    }
}
?>