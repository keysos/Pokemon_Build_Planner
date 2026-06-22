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
    tooltip,
    manualModal,
    openManualBtn,
    closeManualBtn
} from "../dom.js";
import { populatePokemonSelects } from "../ui/pokemonSelects.js";
import { updateTeamDefense } from "../ui/defenseTable.js";
import { updateTeamAttack } from "../ui/attackTable.js";
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

        pokemonCards.forEach((card, index) => {
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
            sprite.src = "assets/unknown_sprite.png";

            pokemonTypeContainer.innerHTML = "";

            const button = document.querySelector(`.team-slot-btn[data-slot="${index}"]`);

            if (button) {
                const slotImg = button.querySelector(".slot-img");

                slotImg.src = "";
                button.classList.remove("has-pokemon");
            }
        });



        saveParty();
        updateTeamDefense();
        updateTeamAttack();
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
                const cols = Math.min(team.length, 3);
                tooltipHTML += `<div class="tooltip-pokemon-grid" style="--cols: ${cols};">`;

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
            const app = document.getElementById("app");
            const zoomLevel = window.getComputedStyle(app).zoom || 1;

            const adjustedX = e.clientX / zoomLevel;
            const adjustedY = e.clientY / zoomLevel;

            tooltip.style.left = `${adjustedX + 15}px`;
            tooltip.style.top = `${adjustedY + 15}px`;
        });

        card.addEventListener("mouseleave", () => {
            tooltip.style.display = "none";
        });
    });
}

export function attachAttackTooltips(coverage) {
    const POKEAPI_BASE = "https://pokeapi.co/api/v2";
    const attackTypes = document.querySelectorAll("#team-attack-grid .defence-type");

    attackTypes.forEach(card => {
        card.addEventListener("mouseenter", async () => {

            const type = card.dataset.type;
            const hits = coverage?.[type] ?? [];

            let tooltipHTML = `<strong>${formatName(type)}</strong>`;

            if (hits.length > 0) {
                const grouped = [];
                const groupIndex = new Map();

                hits.forEach(hit => {
                    if (!groupIndex.has(hit.index)) {
                        groupIndex.set(hit.index, grouped.length);
                        grouped.push({ pokemon: hit.pokemon, moves: [] });
                    }

                    grouped[groupIndex.get(hit.index)].moves.push(hit);
                });

                const cols = Math.min(grouped.length, 3);
                tooltipHTML += `<div class="tooltip-pokemon-grid" style="--cols: ${cols};">`;

                for (const group of grouped) {
                    try {
                        const res = await fetch(`${POKEAPI_BASE}/pokemon/${group.pokemon}`);
                        const data = await res.json();

                        const sprite = data.sprites.versions["generation-viii"].icons.front_default;

                        const movesHTML = group.moves
                            .map(hit => {
                                const label = hit.multiplier >= 4 ? "⚡ 4x" : "⚡ 2x";
                                return `<small>${formatName(hit.move)} (${label})</small>`;
                            })
                            .join("");

                        tooltipHTML += `
                            <div class="tooltip-pokemon-item">
                                <img src="${sprite}" class="tooltip-pokemon-sprite">
                                <div>${formatName(group.pokemon)}</div>
                                ${movesHTML}
                            </div>
                        `;
                    } catch (err) {
                        console.error("Error fetching pokemon sprite:", err);
                    }
                }

                tooltipHTML += `</div>`;
            } else {
                tooltipHTML += `<div class="tooltip-empty">No coverage yet</div>`;
            }

            tooltip.innerHTML = tooltipHTML;
            tooltip.style.display = "block";
        });

        card.addEventListener("mousemove", e => {
            const app = document.getElementById("app");
            const zoomLevel = window.getComputedStyle(app).zoom || 1;

            const adjustedX = e.clientX / zoomLevel;
            const adjustedY = e.clientY / zoomLevel;
            const offset = 15;
            const margin = 8;

            // Place it first so we can measure its real rendered size
            tooltip.style.left = `${adjustedX + offset}px`;
            tooltip.style.top = `${adjustedY + offset}px`;

            const rect = tooltip.getBoundingClientRect();

            // Flip above the cursor if it would overflow the bottom edge
            if (rect.bottom > window.innerHeight - margin) {
                tooltip.style.top = `${adjustedY - rect.height - offset}px`;
            }

            // Pull it left if it would overflow the right edge
            if (rect.right > window.innerWidth - margin) {
                tooltip.style.left = `${adjustedX - rect.width - offset}px`;
            }
        });

        card.addEventListener("mouseleave", () => {
            tooltip.style.display = "none";
        });
    });
}

openManualBtn.addEventListener("click", () => {
    manualModal.showModal();
})

closeManualBtn.addEventListener("click", () => {
    manualModal.close();
})

manualModal.addEventListener("click", (e) => {

    const rect = manualModal.getBoundingClientRect();

    const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

    if (!inside) {
        manualModal.close();
    }
})


export function resetScroll() {
    manualModal.scrollTop = 0;
}

export function setupModalHeight() {
    openManualBtn?.addEventListener("click", () => {
        manualModal.showModal();
        requestAnimationFrame(resetScroll);
    });
}