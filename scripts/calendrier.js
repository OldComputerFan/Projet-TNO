document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  const selectedSlotInput = document.getElementById("selectedSlot");
  const form = document.getElementById("registrationForm");

  let selected = null;
  const timeSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
  const daysToShow = 5;
  const slotData = {};

  const joursFeries = [
    "2025-01-01", "2025-04-21", "2025-05-01", "2025-05-08", "2025-05-29",
    "2025-06-09", "2025-07-14", "2025-08-15", "2025-11-01", "2025-11-11", "2025-12-25"
  ];

  function generateSlots() {
    const today = new Date();
    for (let d = 0; d < daysToShow; d++) {
      const date = new Date();
      date.setDate(today.getDate() + d);
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
  }

  async function fetchReservedSlots() {
    try {
      const res = await fetch("get_rdv.php");
      if (!res.ok) throw new Error("Erreur HTTP");

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Données non valides");
      return data;
    } catch (e) {
      console.error("Erreur lors du fetch des réservations :", e);
      return [];
    }
  }

  function renderCalendar() {
    calendarEl.innerHTML = '';
    const today = new Date();

    for (let d = 0; d < daysToShow; d++) {
      const date = new Date();
      date.setDate(today.getDate() + d);
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

        // Marquer la sélection
        if (selected === `${dateStr}|${time}`) {
          slotDiv.classList.add('selected');
        }

        dayCol.appendChild(slotDiv);
      });

      calendarEl.appendChild(dayCol);
    }
  }

  async function initCalendar() {
    generateSlots();
    const reserved = await fetchReservedSlots();
    console.log("Contenu de reserved :", reserved);

    reserved.forEach(slot => {
      if (slotData[slot.date] && slotData[slot.date][slot.time]) {
        slotData[slot.date][slot.time].reserved = true;
      }
    });

    renderCalendar();
  }

  document.getElementById("cancelSlotBtn").addEventListener("click", function () {
    if (confirm('Êtes-vous sûr de vouloir annuler la sélection ?')) {
      selected = null;
      selectedSlotInput.value = "";
      renderCalendar();
    }
  });

  form.addEventListener("submit", function (e) {
    if (!selectedSlotInput.value) {
      e.preventDefault();
      alert("Veuillez sélectionner un créneau.");
      return;
    }

    // Le formulaire est soumis normalement en POST vers sauv_rdv.php (cf. HTML)
  });

  initCalendar();
});
