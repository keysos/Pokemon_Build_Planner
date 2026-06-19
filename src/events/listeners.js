import {
    typeFilter,
    genFilter,
    toggle,
    clearBtn,
    exportProfileBtn,
    importProfileBtn,
    fileInput,
    pokemonCards,
    loadingScreen,
    mainApp,
    tooltip
} from "../dom.js";
import { populatePokemonSelects } from "../ui/pokemonSelects.js";
import { updateTeamDefense } from "../ui/defenseTable.js";
import { saveParty } from "../storage/partyStorage.js";
import { formatName } from "../utils/helpers.js";
import { getDefensiveMultiplier } from "../utils/defenseCalculator.js";

// Handle type filter changes
export function setupFilterListeners() {
    typeFilter.addEventListener("change", () => {
        populatePokemonSelects();
    });

    genFilter.addEventListener("change", () => {
        populatePokemonSelects();
    });
}

// Handle theme toggle
export function setupThemeToggle() {
    toggle.addEventListener("change", () => {
        document.body.classList.toggle("darkmode", toggle.checked);
    });
}

// Handle clear all button
export function setupClearButton() {
    clearBtn.addEventListener("click", () => {
        if (!confirm("Clear all Pokemon from your team?")) return;

        pokemonCards.forEach(card => {
            const sprite = card.querySelector(".pokemon-img");
            const pokemonSelect = card.querySelector(".pokemon-select");
            const abilitySelect = card.querySelector(".ability-select");
            const moveSelects = card.querySelectorAll(".move-select");
            const pokemonTypeContainer = card.querySelector(".pokemon-type");
            const itemSelect = card.querySelector(".item-select");

            moveSelects.forEach(select => {
                select.value = '';
                select.className = "";
            })

            abilitySelect.value = "";
            pokemonSelect.value = "";
            itemSelect.value = "";
            sprite.src = "/assets/unknown_sprite.png";

            pokemonTypeContainer.innerHTML = "";
        });

        saveParty();
        updateTeamDefense();
    });
}

// Handle file import
export function setupFileImport(loadParty) {
    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);

                sessionStorage.setItem("pokemonParty", JSON.stringify(data));

                loadingScreen.style.display = "block";
                mainApp.style.display = "none";

                loadParty();

            } catch (err) {
                alert("Invalid save file!");
                console.error(err);
            }
        };
        reader.readAsText(file);
    })
}

// Handle profile export
export function setupExportButton() {
    exportProfileBtn.addEventListener("click", () => {
        const json = sessionStorage.getItem("pokemonParty");

        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;
        a.download = "profile.json";
        a.click();

        URL.revokeObjectURL(url);
    })
}

// Handle profile import button
export function setupImportButton() {
    importProfileBtn.addEventListener("click", () => {
        fileInput.click();
    });
}

export function attachTooltips(team) {
    const POKEAPI_BASE = "https://pokeapi.co/api/v2";
    const defenceTypes = document.querySelectorAll(".defence-type");

    defenceTypes.forEach(card => {
        card.addEventListener("mouseenter", async () => {
            const type = card.dataset.type;
            const score = card.dataset.score;
            
            // Build HTML with team pokemon and their weakness/resistance
            let tooltipHTML = `<strong>${formatName(type)}</strong>`;
            
            // Add pokemon with their sprites
            if (team && team.length > 0) {
                tooltipHTML += `<div class="tooltip-pokemon-grid">`;
                
                for (const pokemon of team) {
                    try {
                        const res = await fetch(`${POKEAPI_BASE}/pokemon/${pokemon.name}`);
                        const data = await res.json();
                        
                        // Calculate multiplier for this pokemon against the attacking type
                        const multiplier = getDefensiveMultiplier(pokemon.types, type);
                        
                        const sprite = data.sprites.versions["generation-viii"].icons.front_default
                        const statusLabel = multiplier > 1 ? "⚠️ WEAK" : multiplier < 1 ? "✓ RESIST" : "→ NORMAL";
                        
                        tooltipHTML += `
                            <div class="tooltip-pokemon-item">
                                <img src="${sprite}" class="tooltip-pokemon-sprite">
                                <div>${formatName(pokemon.name)}</div>
                                <small>${statusLabel}</small>
                            </div>
                        `;
                    } catch (err) {
                        console.error("Error fetching pokemon sprite:", err);
                    }
                }
                
                tooltipHTML += `</div>`;
            }
            
            tooltip.innerHTML = tooltipHTML;
            tooltip.style.display = "block";
        });

        card.addEventListener("mousemove", e => {
            tooltip.style.left = `${e.clientX - tooltip.offsetWidth / 2}px`;
            tooltip.style.top = `${e.clientY + 15}px`;
        });

        card.addEventListener("mouseleave", () => {
            tooltip.style.display = "none";
        });
    });
}
