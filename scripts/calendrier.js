document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  const selectedSlotInput = document.getElementById("selectedSlot");
  const form = document.getElementById("registrationForm");
  console.log("Calendrier initialisé");

  let selected = null;
  const timeSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]; //Créneaux horaires disponibles
  // Nombre de jours à afficher dans le calendrier
  // La valeur peut être ajustée selon les besoins, Défaut: 5 jours
  const daysToShow = 8;
  const slotData = {};

  // Liste des jours fériés pour l'année 2025, à modifier pour les années suivantes
  const joursFeries = [
    "2025-01-01", "2025-04-21", "2025-05-01", "2025-05-08", "2025-05-29",
    "2025-06-09", "2025-07-14", "2025-08-15", "2025-11-01", "2025-11-11", "2025-12-25"
  ];

  // Génère les créneaux horaires pour les jours à venir
  // en tenant compte des jours fériés
function generateSlots() {
  const today = new Date();

  for (let d = 0; d < daysToShow; d++) {
    const date = new Date(today);          // Clone la date du jour
    date.setDate(today.getDate() + d);     // Ajoute d jours
    const dateStr = date.toISOString().split('T')[0];

    const isHoliday = joursFeries.includes(dateStr);
    slotData[dateStr] = {};
    timeSlots.forEach(time => {
      slotData[dateStr][time] = {
        active: !isHoliday,
        reserved: false
      };
    });
  }
  console.log("daysToShow =", daysToShow);
}



  // Récupère les créneaux réservés depuis le serveur
  // en utilisant une requête AJAX
  // Retourne un tableau d'objets avec les dates et heures réservées
  async function fetchReservedSlots() {
    try {
      const res = await fetch("get_rdv.php"); // Obtenir les réservations et afficher les créneaux réservés
      if (!res.ok) throw new Error("Erreur HTTP");

      const data = await res.json(); // Convertit la réponse en JSON
      if (!Array.isArray(data)) throw new Error("Données non valides"); // Vérifie que les données sont un tableau
      // Filtre les réservations pour ne garder que celles qui ont une date et une heure
      return data;
    } catch (e) {
      console.error("Erreur lors du fetch des réservations :", e);
      return [];
    }
  }

  // Rendu du calendrier avec les créneaux horaires
  // Affiche les jours et créneaux disponibles, réservés ou passés
  // Met à jour l'interface utilisateur en fonction des données
  function renderCalendar() {
  calendarEl.innerHTML = '';
  const today = new Date();

  for (let d = 0; d < daysToShow; d++) {
    const date = new Date(today);          // Clone la date du jour
    date.setDate(today.getDate() + d);     // Ajoute d jours
    const dateStr = date.toISOString().split('T')[0];
    const readableDate = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });

    const isHoliday = joursFeries.includes(dateStr);
    const dayCol = document.createElement('div');
    dayCol.classList.add('day-column');
    dayCol.innerHTML = `<h4>${readableDate}${isHoliday ? " 🎉" : ""}</h4>`;

    timeSlots.forEach(time => {
      const slot = slotData[dateStr][time];
      const slotDiv = document.createElement('div');
      slotDiv.classList.add('slot');
      slotDiv.textContent = time;

      const now = new Date();
      const slotDateTime = new Date(dateStr + 'T' + time + ':00');
      const isPast = slotDateTime < now;

      if (isPast) {
        slot.active = false;
      }

      if (!slot.active) {
        slotDiv.classList.add('inactive');
        slotDiv.textContent += isPast ? " - Passé" : " - Inactif";
      } else if (slot.reserved) {
        slotDiv.classList.add('reserved');
        slotDiv.textContent += " - Réservé";
      } else {
        slotDiv.classList.add('available');
        slotDiv.textContent += " - Disponible";

        slotDiv.onclick = () => {
          selected = `${dateStr}|${time}`;
          selectedSlotInput.value = selected;
          renderCalendar();
        };
      }

      if (selected === `${dateStr}|${time}`) {
        slotDiv.classList.add('selected');
      }

      dayCol.appendChild(slotDiv);
    });

    calendarEl.appendChild(dayCol);
  }
}


  // Initialise le calendrier en générant les créneaux horaires
  // et en récupérant les créneaux réservés depuis le serveur
  // Affiche le calendrier avec les créneaux disponibles, réservés ou passés
  async function initCalendar() {
    generateSlots(); // Génère les créneaux horaires pour les jours à venir
    const reserved = await fetchReservedSlots(); // Récupère les créneaux réservés depuis le serveur

    reserved.forEach(slot => { // Pour chaque créneau réservé
      if (slotData[slot.date] && slotData[slot.date][slot.time]) {
        slotData[slot.date][slot.time].reserved = true; // Marque le créneau comme réservé
      }
    });

    renderCalendar();
  }

  // Gestionnaire d'événement pour le bouton d'annulation de la sélection
  // Affiche une confirmation avant d'annuler la sélection
  // Réinitialise la sélection et le champ de saisie du créneau
  // Met à jour le calendrier pour refléter l'annulation
  document.getElementById("cancelSlotBtn").addEventListener("click", function () {
    if (confirm('Êtes-vous sûr de vouloir annuler la sélection ?')) {
      selected = null;
      selectedSlotInput.value = "";
      renderCalendar();
    }
  });

  // Gestionnaire d'événement pour la soumission du formulaire
  // Envoie les données du formulaire au serveur pour enregistrer le rendez-vous
  // Affiche un message de confirmation ou d'erreur en fonction de la réponse du serveur
  form.addEventListener("submit", async function (e) { // Gestionnaire d'événement pour la soumission du formulaire
    e.preventDefault();

    const messageDiv = document.getElementById("confirmationMessage"); // Récupère le div pour afficher les messages de confirmation
    messageDiv.style.display = "none"; // Masque le message de confirmation au début

    if (!selectedSlotInput.value) {
      alert("Veuillez sélectionner un créneau."); // Alerte si aucun créneau n'est sélectionné
      return;
    }

    const formData = new FormData(form); // Crée un objet FormData à partir du formulaire

    try {
        const response = await fetch("sauv_rdv.php", { // Envoie les données du formulaire au serveur
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (result.success) { // Si la réponse du serveur indique un succès
        alert("🎉 Votre rendez-vous a bien été enregistré !");
        messageDiv.textContent = "✅ Rendez-vous confirmé avec succès.";
        messageDiv.style.display = "block";
        messageDiv.style.backgroundColor = "#d4edda";
        messageDiv.style.color = "#155724";
        messageDiv.style.border = "1px solid #c3e6cb";

        form.reset(); // Réinitialise le formulaire
        selected = null;
        selectedSlotInput.value = "";
        await initCalendar(); // Réinitialise le calendrier pour refléter les changements
      } else {
        messageDiv.textContent = "❌ Erreur : " + (result.error || "Inconnue"); // Affiche un message d'erreur si la réponse du serveur indique une erreur
        messageDiv.style.display = "block";
        messageDiv.style.backgroundColor = "#f8d7da";
        messageDiv.style.color = "#721c24";
        messageDiv.style.border = "1px solid #f5c6cb";
      }
    } catch (err) {
      console.error("Erreur AJAX :", err); // Gère les erreurs de la requête AJAX
      messageDiv.textContent = "❌ Une erreur s'est produite. Veuillez réessayer.";
      messageDiv.style.display = "block";
      messageDiv.style.backgroundColor = "#f8d7da";
      messageDiv.style.color = "#721c24";
      messageDiv.style.border = "1px solid #f5c6cb";
    }
  });

  initCalendar(); // Initialise le calendrier au chargement de la page
});
