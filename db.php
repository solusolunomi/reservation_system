<?php
// db.php：DB接続専用ファイル

$host = "127.0.0.1";
$db   = "classroom_reservation_system";
$user = "root";
$pass = "";
$charset = "utf8mb4";

$dsn = "mysql:host={$host};dbname={$db};charset={$charset}";

try {
  $pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
} catch (PDOException $e) {
  exit("DB接続失敗: " . $e->getMessage());
}
