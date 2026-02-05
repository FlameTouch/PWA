// Filters Module
// Модуль для фільтрації та пошуку напоїв

import { getState, setFilteredDrinks } from './state.js';
import { renderDrinks } from './views.js';

// Фільтрація напоїв за пошуковим терміном та категорією
function filterDrinks() {
    const appState = getState();
    let filtered = appState.drinks;

    // Фільтр за категорією
    if (appState.categoryFilter !== 'all') {
        const categoryMap = {
            'cocktail': 'Cocktail',
            'shot': 'Shot',
            'mocktail': 'Non alcoholic'
        };
        const category = categoryMap[appState.categoryFilter];
        if (category) {
            filtered = filtered.filter(drink => 
                drink.strCategory === category || 
                (appState.categoryFilter === 'mocktail' && drink.strAlcoholic === 'Non alcoholic')
            );
        }
    }

    // Фільтр за пошуковим терміном
    if (appState.searchTerm) {
        filtered = filtered.filter(drink =>
            drink.strDrink.toLowerCase().includes(appState.searchTerm) ||
            (drink.strInstructions && drink.strInstructions.toLowerCase().includes(appState.searchTerm))
        );
    }

    setFilteredDrinks(filtered);
    renderDrinks(filtered);
}

// Експорт
export {
    filterDrinks
};
