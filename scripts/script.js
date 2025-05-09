document.addEventListener("DOMContentLoaded", () => {
    const rdvForm = document.getElementById("formulaire-rdv");
    const confirmation = document.getElementById("confirmation");
    const newsletterForm = document.getElementById("form-newsletter");
    const newsletterConfirm = document.getElementById("newsletter-confirm");

    rdvForm.addEventListener("submit", (e) => {
        e.preventDefault();
        confirmation.style.display = "block";
        rdvForm.reset();
    });

    newsletterForm.addEventListener("submit", (e) => {
        e.preventDefault();
        newsletterConfirm.style.display = "block";
        newsletterForm.reset();
    });
});
