import { POKEAPI_BASE } from "../utils/constants.js";
import { formatName } from "../utils/helpers.js";
import { pokemonCards } from "../dom.js";
import { saveParty } from "../storage/partyStorage.js";
import { updateTeamDefense } from "./defenseTable.js";
import { updateTeamAttack } from "./attackTable.js";

// Initialize card event listeners for each Pokemon card
export function initializeCardListeners() {
    pokemonCards.forEach(card => {
        const sprite = card.querySelector(".pokemon-img");
        const pokemonSelect = card.querySelector(".pokemon-select");
        const abilitySelect = card.querySelector(".ability-select");
        const moveSelects = card.querySelectorAll(".move-select");
        const pokemonTypeContainer = card.querySelector(".pokemon-type");

        let currentMoves = [];

        abilitySelect.disabled = true;
        moveSelects.forEach(select => select.disabled = true);

        pokemonSelect.addEventListener("change", async e => {
            try {
                const pokemonName = e.target.value;

                if (!pokemonName) return;

                abilitySelect.disabled = false;
                moveSelects.forEach(select => select.disabled = false);

                const res = await fetch(`${POKEAPI_BASE}/pokemon/${pokemonName}`);
                const data = await res.json();

                sprite.src = data.sprites.versions["generation-v"]["black-white"].animated.front_default;
                
                // update slot image (mobile)
                if (window.innerWidth <= 750) {

                    const slotIndex = Array.from(pokemonCards).indexOf(card);

                    const button = document.querySelector(
                    `.team-slot-btn[data-slot="${slotIndex}"]`
                    );

                    if (button) {
                      const img = button.querySelector(".slot-img");

                      img.src = data.sprites.versions["generation-viii"].icons.front_default;
                    
                      button.classList.add("has-pokemon");
                    }
                }


                pokemonTypeContainer.innerHTML = '';

                data.types.forEach(entry => {
                    const div = document.createElement("div");
                    div.classList.add("type", entry.type.name);
                    div.textContent = formatName(entry.type.name);
                    pokemonTypeContainer.appendChild(div);
                })

                abilitySelect.innerHTML = '<option value="" disabled selected hidden>Ability</option>';
                data.abilities.forEach(entry => {
                    const option = document.createElement("option");
                    option.value = entry.ability.name;
                    option.textContent = formatName(entry.ability.name);
                    abilitySelect.appendChild(option);
                });

                currentMoves = (await Promise.all(
                    data.moves.map(async ({ move }) => {
                        try {
                            const res = await fetch(move.url);
                            const moveData = await res.json();

                            return {
                                name: move.name,
                                type: moveData.type.name,
                                damageClass: moveData.damage_class.name
                            };
                        } catch (err) {
                            return null;
                        }
                    })
                )).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));

                currentMoves = currentMoves.filter(Boolean);

                if (currentMoves.length === 1) {
                    const onlyMove = currentMoves[0];

                    moveSelects.forEach((select, index) => {
                        if (index === 0) {
                            select.innerHTML = `<option value="${onlyMove.name}" selected class="${onlyMove.type}" data-damage-class="${onlyMove.damageClass}">${formatName(onlyMove.name)}</option>`;
                            select.value = onlyMove.name;
                            select.className = `move-select ${onlyMove.type}`;
                            select.dataset.damageClass = onlyMove.damageClass;
                            select.disabled = false;
                        } else {
                            select.innerHTML = '<option value="" selected hidden>Move</option>';
                            select.value = "";
                            select.className = "move-select";
                            select.dataset.damageClass = "";
                            select.disabled = true;
                        }
                    });
                } else {
                    updateMoveOptions();
                }

                updateMoveOptions();

                saveParty();
                await updateTeamDefense();
                await updateTeamAttack();
            } catch (err) {
                console.error("Pokemon load failed:", err);
            }
        });

        function buildMoveOptionsHTML(excludeNames, selectedName) {
            let html = '<option value="">Move</option>';

            currentMoves.forEach(move => {
                const isExcluded = excludeNames.has(move.name) && move.name !== selectedName;

                if (isExcluded) return;

                const selected = move.name === selectedName ? " selected" : "";

                html += `<option value="${move.name}"${selected} class="${move.type}" data-damage-class="${move.damageClass}">${formatName(move.name)}</option>`;
            });

            return html;
        }

        function updateMoveOptions() {
            const selectedMoves = Array.from(moveSelects).map(s => s.value);

            moveSelects.forEach((select, index) => {
                const otherSelected = selectedMoves.filter((_, i) => i !== index);
                const excludeNames = new Set(otherSelected.filter(Boolean));
                select.innerHTML = buildMoveOptionsHTML(excludeNames, select.value);

                const move = currentMoves.find(m => m.name === select.value);

                select.className = `move-select ${move?.type ?? ""}`;
                select.dataset.damageClass = move?.damageClass ?? "";
            });
        }

        moveSelects.forEach(select => {
            select.addEventListener("change", () => {
                updateMoveOptions();
                saveParty();
                updateTeamAttack();
            });
        });

        abilitySelect.addEventListener("change", saveParty);
        card.querySelector(".item-select").addEventListener("change", saveParty);
    });
}
