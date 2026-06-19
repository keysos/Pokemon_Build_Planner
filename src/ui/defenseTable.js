import { DISPLAY_TYPES } from "../utils/constants.js";
import { calculateTeamDefense } from "../utils/defenseCalculator.js";
import { buildCurrentTeam } from "./pokemonSelects.js";
import { formatName } from "../utils/helpers.js";
import { attachTooltips } from "../events/listeners.js";

// Render the team defense table
export function renderTeamDefense(defense, team) {
    const grid = document.getElementById("team-defence-grid");

    if (!grid) return;

    grid.innerHTML = "";

    DISPLAY_TYPES.forEach(type => {
        const value = defense[type];

        let colorClass = "defence-neutral";

        if (value > 0)
            colorClass = "defence-positive";

        if (value < 0)
            colorClass = "defence-negative";

        const item = document.createElement("div");

        item.className = "defence-type";
        item.dataset.type = type;
        item.dataset.score = value;

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

    attachTooltips(team);
}

// Update the team defense table
export async function updateTeamDefense() {
    const team = await buildCurrentTeam();
    const defense = calculateTeamDefense(team);
    renderTeamDefense(defense, team);
}
