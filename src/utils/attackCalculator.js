import { TABLE_TYPES, DISPLAY_TYPES } from "./constants.js";

// Calculate how effective a move type is against a set of defending types
export function getOffensiveMultiplier(moveType, defendingTypes) {
    let multiplier = 1;

    defendingTypes.forEach(type => {
        multiplier *= (TABLE_TYPES[moveType]?.[type] ?? 1);
    });

    return multiplier;
}

export function calculateTeamOffense(team) {
    const result = {};
    const coverage = {};

    DISPLAY_TYPES.forEach(defendingType => {
        let score = 0;
        const hits = [];
        const scoredSlots = new Set();

        team.forEach(pokemon => {
            if (!pokemon.moves) return;

            pokemon.moves.forEach(move => {

                if (move.damageClass === "status") return;

                const multiplier = getOffensiveMultiplier(move.type, [defendingType]);

                if (multiplier > 1) {

                    if (!scoredSlots.has(pokemon.index)) {
                        score += 1;
                        scoredSlots.add(pokemon.index);
                    }

                    hits.push({
                        index: pokemon.index,
                        pokemon: pokemon.name,
                        move: move.name,
                        moveType: move.type,
                        multiplier
                    });
                }
            });
        });

        result[defendingType] = score;
        coverage[defendingType] = hits;
    });

    return { scores: result, coverage };
}
