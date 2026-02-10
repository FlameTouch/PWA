// API Module
// Модуль для роботи з API напоїв (локальний JSON без CORS)

// Локальне "API" - файл drinks.json у корені застосунку
const LOCAL_DRINKS_URL = '/drinks.json';

// Завантаження всіх напоїв з локального JSON
async function fetchAllDrinks() {
    try {
        const response = await fetch(LOCAL_DRINKS_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.drinks || [];
    } catch (error) {
        console.error('Помилка завантаження локальних напоїв:', error);
        return [];
    }
}

// Отримання напоїв за назвою (фільтрація на клієнті)
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

// Завантаження списку напоїв (для popularDrinks) - у нашому випадку просто всі напої
async function fetchDrinksList(drinkNames) {
    return await fetchAllDrinks();
}

// Експорт функцій
export {
    fetchDrinkByName,
    fetchDrinksList,
    LOCAL_DRINKS_URL
};

