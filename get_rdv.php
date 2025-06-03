<?php
header('Content-Type: application/json'); // Définir le type de contenu en JSON

// Configuration de la base de données
try {
    $pdo = new PDO("mysql:host=localhost;dbname=barbershop;charset=utf8mb4", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // On récupère les rendez-vous
    $stmt = $pdo->query("SELECT date, time FROM rdv");
    $rdvs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // On formate les rendez-vous pour le JSON
    echo json_encode($rdvs);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>