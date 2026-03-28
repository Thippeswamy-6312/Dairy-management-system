<?php
header('Content-Type: application/json');
require_once '../includes/db.php';

if ($_SERVER['REQUEST_METHOD'] == 'GET') {

    $res = $conn->query("
        SELECT p.*, c.name 
        FROM payments p
        JOIN customers c ON c.id = p.customer_id
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

    $sql = "INSERT INTO payments (customer_id, payment_date, amount, mode)
            VALUES ($customer_id, '$payment_date', $amount, '$mode')";

    if ($conn->query($sql)) {
        echo json_encode(["success"=>true,"message"=>"Payment Added"]);
    } else {
        echo json_encode(["success"=>false,"error"=>$conn->error]);
    }
}
?>