
// CONSTANTS + HELPERS //

const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const POKEMON_LIMIT = 649;

// lista dos 18 tipos Pokémon usada para percorrer e renderizar a tabela //

const DISPLAY_TYPES = [
    "bug",
    "dark",
    "dragon",
    "electric",
    "fairy",
    "fighting",

    "fire",
    "flying",
    "ghost",
    "grass",
    "ground",
    "ice",

    "normal",
    "poison",
    "psychic",
    "rock",
    "steel",
    "water"
];

// table team defence btw //

const TABLE_TYPES = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { grass: 2, ice: 2, bug: 2, steel: 2, fire: 0.5, water: 0.5, rock: 0.5, dragon: 0.5 },
    water: { fire: 2, ground: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
    electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, dragon: 0.5, ground: 0 },
    grass: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5 },
    ice: { grass: 2, ground: 2, flying: 2, dragon: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
    fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5, ghost: 0 },
    poison: { grass: 2, fairy: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
    ground: { fire: 2, electric: 2, poison: 2, rock: 2, steel: 2, grass: 0.5, bug: 0.5, flying: 0 },
    flying: { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, steel: 0.5, dark: 0 },
    bug: { grass: 2, psychic: 2, dark: 2, fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
    ghost: { psychic: 2, ghost: 2, dark: 0.5, normal: 0 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { psychic: 2, ghost: 2, fighting: 0.5, dark: 0.5, fairy: 0.5 },
    steel: { ice: 2, rock: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5 },
    fairy: { fighting: 2, dragon: 2, dark: 2, fire: 0.5, poison: 0.5, steel: 0.5 }
};


// CALCULTATE HOW MUCH A SPECIFIC POKEMON IS AFFECTED BY A TYPE //

function getDefensiveMultiplier(defendingTypes, attackType) {

    let multiplier = 1;

    defendingTypes.forEach(type => {
        multiplier *= (
            TABLE_TYPES[attackType]?.[type] ?? 1
        );
    });

    return multiplier;
}

// TURN MULTIPLIERS INTO DEFENSE POINTS //

function defensiveScore(multiplier) {

    switch (multiplier) {

        case 0:
            return 2;

        case 0.25:
            return 1.5;

        case 0.5:
            return 1;

        case 1:
            return 0;

        case 2:
            return -1;

        case 4:
            return -2;

        default:
            return 0;
    }
}

// calcula o total de pontos da equipe //

function calculateTeamDefense(team) {

    const result = {};

    DISPLAY_TYPES.forEach(attackType => {

        let score = 0;

        team.forEach(pokemon => {

            const multiplier =
                getDefensiveMultiplier(
                    pokemon.types,
                    attackType
                );

            score += defensiveScore(multiplier);
        });

        result[attackType] =
            Number(score.toFixed(1));
    });

    return result;
}


// BUILD AN ARRAY FILLED WITH THE POKEMON AND THEIR TYPE //

async function buildCurrentTeam() {

    const team = [];

    for (const card of pokemonCards) {

        const pokemonName =
            card.querySelector(".pokemon-select").value;

        if (!pokemonName) continue;

        try {

            const res =
                await fetch(
                    `${POKEAPI_BASE}/pokemon/${pokemonName}`
                );

            const data =
                await res.json();

            team.push({
                name: pokemonName,
                types: data.types.map(
                    t => t.type.name
                )
            });

        } catch (err) {
            console.error(err);
        }
    }

    return team;
}


// RENDER THE TEAM DEFENCE TABLE //

function renderTeamDefense(defense) {

    const grid =
        document.getElementById(
            "team-defence-grid"
        );

    if (!grid) return;

    grid.innerHTML = "";

    DISPLAY_TYPES.forEach(type => {

        const value =
            defense[type];

        let colorClass =
            "defence-neutral";

        if (value > 0)
            colorClass =
                "defence-positive";

        if (value < 0)
            colorClass =
                "defence-negative";

        const item =
            document.createElement("div");

        item.className =
            "defence-type";

        item.innerHTML = `
      <div class="defence-label ${type}">
        ${formatName(type)}
      </div>

      <div class="defence-value ${colorClass}">
        ${value > 0 ? "+" : ""}${value}
      </div>
    `;

        grid.appendChild(item);
    });
}

// UPDATE THE TABLE //

async function updateTeamDefense() {

    const team =
        await buildCurrentTeam();

    const defense =
        calculateTeamDefense(team);

    renderTeamDefense(defense);
}

const GEN_RANGES = {
    1: [1, 151],
    2: [152, 251],
    3: [252, 386],
    4: [387, 493],
    5: [494, 649],
};


function formatName(name) {
    return name
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function getDexNumber(url) {
    const parts = url.split("/").filter(Boolean);
    return parseInt(parts[parts.length - 1]);
}

// DOM REFERENCES //

const pokemonCards = document.querySelectorAll(".pokemon-card");
const typeFilter = document.getElementById("type-selector");
const genFilter = document.getElementById("gen-selector");
const loadingScreen = document.getElementById("loading");
const mainApp = document.getElementById("app");
const toggle = document.getElementById("theme-toggle");
const clearBtn = document.getElementById("clear-all-btn");
const exportProfileBtn = document.getElementById("export-profile-btn");
const importProfileBtn = document.getElementById("import-profile-btn");
const fileInput = document.getElementById("import-file");

let allPokemon = [];

// STORAGE //
function saveParty() {
    const team = Array.from(pokemonCards).map(card => ({
        pokemon: card.querySelector(".pokemon-select").value,
        item: card.querySelector(".item-select").value,
        ability: card.querySelector(".ability-select").value,
        moves: Array.from(card.querySelectorAll(".move-select")).map(s => ({
            name: s.value,
            type: s.className.replace("move-select", "").trim()
        }))
    }));

    sessionStorage.setItem("pokemonParty", JSON.stringify(team));
}

async function loadParty() {

    try {
        const saved = sessionStorage.getItem("pokemonParty");

        if (!saved) return;

        const team = JSON.parse(saved);

        await populatePokemonSelects();

        for (let i = 0; i < pokemonCards.length; i++) {
            const card = pokemonCards[i];
            const savedCard = team[i];

            if (!savedCard?.pokemon) continue;

            const pokemonSelect = card.querySelector(".pokemon-select");
            const abilitySelect = card.querySelector(".ability-select");
            const moveSelects = card.querySelectorAll(".move-select");
            const itemSelect = card.querySelector(".item-select");

            pokemonSelect.value = savedCard.pokemon;

            try {
                pokemonSelect.dispatchEvent(new Event("change"));
            } catch (e) {
                console.warn("Pokemon load failed:", e);
            }

            await new Promise(resolve => setTimeout(resolve, 400));


            abilitySelect.value = savedCard.ability;
            itemSelect.value = savedCard.item;
            moveSelects.forEach((select, i) => {
                const saved = savedCard.moves[i];
                select.value = saved?.name ?? "";
                select.className = `move-select ${saved?.type ?? ""}`.trim();
            });
        }
    } catch (err) {
        console.warn("Pokemon load failed:", err);
    } finally {
        loadingScreen.style.display = "none";
        mainApp.style.display = "flex";
    }
}

// API + DATA //

async function getFilteredPokemon() {

    try {
        const type = typeFilter.value;
        const gen = genFilter.value;

        let result = allPokemon;

        if (type) {
            const res = await fetch(`${POKEAPI_BASE}/type/${type}`);
            const data = await res.json();
            const typeNames = new Set(data.pokemon.map(p => p.pokemon.name));
            result = result.filter(p => typeNames.has(p.name));
        }

        if (gen) {
            const [min, max] = GEN_RANGES[gen];
            result = result.filter(p => {
                const num = getDexNumber(p.url);
                return num >= min && num <= max;
            });
        }

        return result;
    } catch (err) {
        console.warn("Type and gen filter failed:", err);
    }
}

async function populatePokemonSelects() {

    try {
        const filtered = await getFilteredPokemon();
        const selects = document.querySelectorAll(".pokemon-select");

        selects.forEach(select => {
            const current = select.value;

            select.innerHTML = '<option value="" disabled selected hidden>Name</option>';

            filtered.forEach(pokemon => {
                const option = document.createElement("option");
                option.value = pokemon.name;
                option.textContent = formatName(pokemon.name);
                select.appendChild(option);
            });

            if (filtered.some(p => p.name === current)) {
                select.value = current;
            } else if (current) {
                const option = document.createElement("option");
                option.value = current;
                option.textContent = formatName(current);
                option.disabled = true;
                select.appendChild(option);
                select.value = current;
            }
        });
    } catch (err) {
        console.error("Failed to load pokemons", err);
    }
}
async function populateItemSelects() {
    try {
        const res = await fetch(`${POKEAPI_BASE}/item-attribute/holdable`);
        const data = await res.json();

        const sortedItems = data.items.sort((a, b) => a.name.localeCompare(b.name));

        const itemSelects = document.querySelectorAll(".item-select");

        itemSelects.forEach(select => {
            select.innerHTML = '<option value="" disabled selected hidden>Item</option>';
            sortedItems.forEach(item => {
                const option = document.createElement("Option");
                option.value = item.name;
                option.textContent = formatName(item.name);
                select.appendChild(option);
            })
        })
    } catch (err) {
        console.error("Item load failed:", err);
    }
}

// GLOBAL EVENT LISTENERS //

typeFilter.addEventListener("change", () => {
    populatePokemonSelects();
});
genFilter.addEventListener("change", () => {
    populatePokemonSelects();
});

toggle.addEventListener("change", () => {
    document.body.classList.toggle("darkmode", toggle.checked);
});

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

importProfileBtn.addEventListener("click", () => {
    fileInput.click();
});


// CARDS LOGIC //

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
                        const res =
                            await fetch(move.url);

                        const moveData =
                            await res.json();

                        return {
                            name: move.name,
                            type: moveData.type.name
                        };
                    } catch (err) {
                        return null;
                    }
                })
            )).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));

            currentMoves = currentMoves.filter(Boolean);

            updateMoveOptions();

            saveParty();
            await updateTeamDefense();
        } catch (err) {
            console.error("Pokemon load failed:", err);
        }

    });

    function buildMoveOptionsHTML(excludeNames, selectedName) {
        let html = '<option value="">Move</option>';

        currentMoves.forEach(move => {
            const isExcluded =
                excludeNames.has(move.name) && move.name !== selectedName;

            if (isExcluded) return;

            const selected = move.name === selectedName ? " selected" : "";

            html += `<option value="${move.name}"${selected} class="${move.type}">${formatName(move.name)}</option>`;
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

            select.className = `move-select ${move?.type ?? ""}`
        });
    }

    moveSelects.forEach(select => {
        select.addEventListener("change", () => {
            updateMoveOptions();
            saveParty();
        });
    });

    abilitySelect.addEventListener("change", saveParty);
    card.querySelector(".item-select").addEventListener("change", saveParty);
});

// MAIN CORE STARTUP

async function init() {

    try {
        const res = await fetch(`${POKEAPI_BASE}/pokemon?limit=${POKEMON_LIMIT}`);
        const data = await res.json();
        allPokemon = data.results;

        await populatePokemonSelects();
        await populateItemSelects();
        await loadParty();
        await updateTeamDefense();
    } catch (err) {
        console.error("Init failed:", err);
    } finally {
        loadingScreen.style.display = "none";
        mainApp.style.display = "flex";
    }

}

const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

document.body.classList.toggle("darkmode", systemPrefersDark);
toggle.checked = systemPrefersDark;

init();