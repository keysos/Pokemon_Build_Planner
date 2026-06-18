
// CONSTANTS + HELPERS //

const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const POKEMON_LIMIT = 649;

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