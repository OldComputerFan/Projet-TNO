<?php
header('Content-Type: application/json');

// Configuration de la base de données
$host = 'localhost';
$dbname = 'barbershop';
$user = 'root';
$pass = '';

// Fonction pour capitaliser prénom/nom (première lettre en majuscule, reste en minuscule, mot par mot)
function capitalizeName(string $name): string {
    $words = explode(' ', strtolower(trim($name)));
    $words = array_filter($words, fn($w) => strlen($w) > 0);
    $capitalizedWords = array_map(fn($w) => ucfirst($w), $words);
    return implode(' ', $capitalizedWords);
}

// Connexion à la base de données
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de connexion à la base']);
    exit;
}

// Récupération des données envoyées en POST
$name = isset($_POST['name']) ? ucfirst(strtoupper(trim($_POST['name']))) : '';
$firstname = isset($_POST['firstname']) ? ucfirst(strtoupper(trim($_POST['firstname']))) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$slot = isset($_POST['selectedSlot']) ? trim($_POST['selectedSlot']) : '';

// Validation des données
if (empty($name) || empty($firstname) || empty($email) || empty($slot)) {
    http_response_code(400);
    echo json_encode(['error' => 'Données incomplètes']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email invalide']);
    exit;
}

// Capitalisation serveur
$name = capitalizeName($name);
$firstname = capitalizeName($firstname);

// Vérifier le format du créneau horaire
if (!str_contains($slot, '|')) {
    http_response_code(400);
    echo json_encode(['error' => 'Format du créneau invalide']);
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

// Vérifier si l'utilisateur existe déjà
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
$userId = $stmt->fetchColumn();

if (!$userId) {
    // Ajouter un nouvel utilisateur avec prénom et nom capitalisés
    $stmt = $pdo->prepare("INSERT INTO users (firstname, name, email) VALUES (?, ?, ?)");
    $stmt->execute([$firstname, $name, $email]);
    $userId = $pdo->lastInsertId();
}

// Enregistrer le rendez-vous
$stmt = $pdo->prepare("INSERT INTO rdv (user_id, date, time) VALUES (?, ?, ?)");
$stmt->execute([$userId, $date, $time]);

echo json_encode(['success' => true]);
exit;
