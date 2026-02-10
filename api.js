// API Module
// Модуль для роботи з API напоїв

// НОВИЙ „API” без CORS:
// Замість зовнішнього serwisu używamy lokalnego pliku JSON `/drinks.json`
// Dzięki temu nie ma problemu z CORS, a nadal korzystamy z fetch + Service Workera.

const LOCAL_DRINKS_URL = '/drinks.json';

// Pobranie wszystkich drinków z lokalnego „API”
async function fetchAllDrinks() {
    try {
        const response = await fetch(LOCAL_DRINKS_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.drinks || [];
    } catch (error) {
        console.error('Błąd wczytywania lokalnych drinków:', error);
        return [];
    }
}

// Pobranie drinków po nazwie (filtrowanie po stronie klienta)
async function fetchDrinkByName(drinkName) {
    const allDrinks = await fetchAllDrinks();
    if (!drinkName) {
        return allDrinks;
    }
    const term = drinkName.toLowerCase();
    return allDrinks.filter(d =>
        (d.strDrink && d.strDrink.toLowerCase().includes(term)) ||
        (d.strInstructions && d.strInstructions.toLowerCase().includes(term))
    );
}

// Pobranie listy drinków – w naszym przypadku po prostu wszystkie z pliku
async function fetchDrinksList(drinkNames) {
    return await fetchAllDrinks();
}

// Експорт функцій
export {
    fetchDrinkByName,
    fetchDrinksList,
    LOCAL_DRINKS_URL
};
