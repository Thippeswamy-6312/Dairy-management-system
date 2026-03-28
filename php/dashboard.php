<?php
header('Content-Type: application/json');
require_once '../includes/db.php';

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $today = date('Y-m-d');
    
    // Total Customers
    $res1 = $conn->query("SELECT COUNT(*) as total FROM customers");
    $total_customers = $res1->fetch_assoc()['total'];
    
    // Today's Milk Volume
    $res2 = $conn->query("SELECT SUM(liter_amount) as total FROM milk_records WHERE record_date = '$today'");
    $today_milk = $res2->fetch_assoc()['total'] ?? 0;
    
    // Today's Collection Amount
    $res3 = $conn->query("SELECT SUM(daily_amount) as total FROM milk_records WHERE record_date = '$today'");
    $today_collection = $res3->fetch_assoc()['total'] ?? 0;

    echo json_encode([
        "success" => true,
        "data" => [
            "total_customers" => $total_customers,
            "today_milk" => round($today_milk, 2),
            "today_collection" => round($today_collection, 2)
        ]
    ]);
}
?>
