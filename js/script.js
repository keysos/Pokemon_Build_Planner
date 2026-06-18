const POKEAPI_BASE = "https://pokeapi.co/api/v2";

function formatName(name) {
    return name
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}


const pokemonCards = document.querySelectorAll(".pokemon-card");

pokemonCards.forEach(card => {
    const sprite = card.querySelector(".pokemon-img");
    const pokemonSelect = card.querySelector(".pokemon-select");
    const abilitySelect = card.querySelector(".ability-select");
    const moveSelects = card.querySelectorAll(".move-select");

    let currentMoves = [];

    pokemonSelect.addEventListener("change", async e => {
        const pokemonName = e.target.value;

        if (!pokemonName) return;

        const res = await fetch(`${POKEAPI_BASE}/pokemon/${pokemonName}`);
        const data = await res.json();

        sprite.src = data.sprites.front_default;

        abilitySelect.innerHTML = '<option value=""></option>';

        data.abilities.forEach(entry => {
            const option = document.createElement("option");
            option.value = entry.ability.name;
            option.textContent = formatName(entry.ability.name);
            abilitySelect.appendChild(option);
        });

        currentMoves = data.moves.map(move => move.move);

        updateMoveOptions();
    });

    function buildMoveOptionsHTML(excludeNames, selectedName) {
        let html = '<option value=""></option>';

        currentMoves.forEach(move => {
            const isExcluded =
                excludeNames.has(move.name) && move.name !== selectedName;

            if (isExcluded) return;

            const selected = move.name === selectedName ? " selected" : "";

            html += `<option value="${move.name}"${selected}>${formatName(move.name)}</option>`;
        });

        return html;
    }

    function updateMoveOptions() {
        const selectedMoves = Array.from(moveSelects).map(s => s.value);

        moveSelects.forEach((select, index) => {
            const otherSelected = selectedMoves.filter((_, i) => i !== index);
            const excludeNames = new Set(otherSelected.filter(Boolean));
            select.innerHTML = buildMoveOptionsHTML(excludeNames, select.value);
        });
    }

    moveSelects.forEach(select => {
        select.addEventListener("change", updateMoveOptions);
    });
});

async function populatePokemonSelects() {
    const res = await fetch(`${POKEAPI_BASE}/pokemon?limit=386`);
    const data = await res.json();

    const selects = document.querySelectorAll(".pokemon-select");

    selects.forEach(select => {
        data.results.forEach(pokemon => {
            const option = document.createElement("option");
            option.value = pokemon.name;
            option.textContent = formatName(pokemon.name);
            select.appendChild(option);
        });
    });
}

populatePokemonSelects();