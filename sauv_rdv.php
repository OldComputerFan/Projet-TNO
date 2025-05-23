<?php
header('Content-Type: application/json');

$host = 'localhost';
$dbname = 'barbershop';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de connexion à la base']);
    exit;
}

// Récupération des données POST classiques
$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$slot = isset($_POST['selectedSlot']) ? trim($_POST['selectedSlot']) : '';

if (empty($name) || empty($email) || empty($slot)) {
    http_response_code(400);
    echo json_encode(['error' => 'Données incomplètes']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email invalide']);
    exit;
}

list($date, $time) = explode('|', $slot);

// Vérifier si le créneau est déjà réservé
$stmt = $pdo->prepare("SELECT COUNT(*) FROM rdv WHERE date = ? AND time = ?");
$stmt->execute([$date, $time]);
if ($stmt->fetchColumn() > 0) {
    http_response_code(409);
    echo json_encode(['error' => 'Ce créneau est déjà réservé']);
    exit;
}

// Vérifier si user existe, sinon l’ajouter
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
$userId = $stmt->fetchColumn();

if (!$userId) {
    $stmt = $pdo->prepare("INSERT INTO users (name, email) VALUES (?, ?)");
    $stmt->execute([$name, $email]);
    $userId = $pdo->lastInsertId();
}

// Insérer le rendez-vous
$stmt = $pdo->prepare("INSERT INTO rdv (user_id, date, time) VALUES (?, ?, ?)");
$stmt->execute([$userId, $date, $time]);

echo json_encode(['success' => true]);

header('Location: calendrier.html');
exit;
?>
