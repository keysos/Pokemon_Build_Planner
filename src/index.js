// Import UI components
import { initializeCardListeners } from "./ui/cards.js";
import { populatePokemonSelects, populateItemSelects, initializeAllPokemon } from "./ui/pokemonSelects.js";
import { updateTeamDefense } from "./ui/defenseTable.js";
import { updateTeamAttack } from "./ui/attackTable.js";
import { initMobileNavigation } from "./ui/mobileNavigation.js";
import { setupModalHeight } from "./events/listeners.js";

// Import storage
import { loadParty, saveParty } from "./storage/partyStorage.js";

// Import event listeners
import {
    setupFilterListeners,
    setupThemeToggle,
    setupClearButton,
    setupFileImport,
    setupExportButton,
    setupImportButton
} from "./events/listeners.js";

// Import DOM references
import { loadingScreen, mainApp, toggle } from "./dom.js";

// Main initialization function
async function init() {
    try {
        // Initialize all Pokemon data from API
        await initializeAllPokemon();

        // Populate UI elements
        await populatePokemonSelects();
        await populateItemSelects();

        // Setup event listeners
        setupFilterListeners();
        setupThemeToggle();
        setupClearButton();
        setupExportButton();
        setupImportButton();
        setupModalHeight();
        setupFileImport(async () => {
            await loadParty(populatePokemonSelects);
            loadingScreen.style.display = "none";
            mainApp.style.display = "flex";
            await updateTeamDefense();
            await updateTeamAttack();
        });
        

        // Initialize card event listeners
        initializeCardListeners();
        // Initialize cards mobile
        initMobileNavigation();

        // Load saved party and update UI
        await loadParty(populatePokemonSelects);
        await updateTeamDefense();
        await updateTeamAttack();
    } catch (err) {
        console.error("Init failed:", err);
    } finally {
        loadingScreen.style.display = "none";
        mainApp.style.display = "flex";
    }
}

// Setup theme preference on load
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
document.body.classList.toggle("darkmode", systemPrefersDark);
toggle.checked = systemPrefersDark;

// Start the application
init();
