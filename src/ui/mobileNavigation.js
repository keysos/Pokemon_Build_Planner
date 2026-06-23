// FIX mobile slot navigation
import { pokemonCards } from "../dom.js";

export function initMobileNavigation() {
    if (window.innerWidth > 750) return;

    const forms = document.querySelectorAll(".pokemon-card-form");
    const buttons = document.querySelectorAll(".team-slot-btn");

    function showSlot(index) {
        forms.forEach((form, i) => {
            form.classList.toggle("active", i === index);
        });

        buttons.forEach(btn => btn.classList.remove("active"));
        buttons[index].classList.add("active");
    }

    // inicial: só slot 0
    showSlot(0);

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const index = Number(btn.dataset.slot);
            showSlot(index);
        });
    });
}