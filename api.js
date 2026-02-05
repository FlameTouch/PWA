// API Module
// Модуль для роботи з API напоїв

// Використовуємо CORS проксі для обходу CORS помилок
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const API_BASE = 'https://www.thecocktaildb.com/api/json/v1/1/search.php?s=';

// Отримання напою за назвою через проксі
async function fetchDrinkByName(drinkName) {
    try {
        // Використовуємо проксі для обходу CORS
        const proxyUrl = `${CORS_PROXY}${encodeURIComponent(API_BASE + drinkName)}`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.drinks || [];
    } catch (error) {
        console.error(`Помилка завантаження ${drinkName}:`, error);
        // Якщо проксі не працює, спробуємо через Service Worker cache
        return await fetchDrinkFromCache(drinkName);
    }
}

// Отримання напою з кешу Service Worker
async function fetchDrinkFromCache(drinkName) {
    try {
        const url = `${API_BASE}${encodeURIComponent(drinkName)}`;
        const cache = await caches.open('drink-master-api-v4');
        const cachedResponse = await cache.match(url);
        
        if (cachedResponse) {
            const data = await cachedResponse.json();
            return data.drinks || [];
        }
    } catch (error) {
        console.error('Помилка отримання з кешу:', error);
    }
    return [];
}

// Завантаження списку напоїв
async function fetchDrinksList(drinkNames) {
    const allDrinks = [];
    const uniqueIds = new Set();
    
    for (const drinkName of drinkNames) {
        try {
            const drinks = await fetchDrinkByName(drinkName);
            for (const drink of drinks) {
                if (!uniqueIds.has(drink.idDrink)) {
                    uniqueIds.add(drink.idDrink);
                    allDrinks.push(drink);
                }
            }
        } catch (error) {
            console.error(`Помилка завантаження ${drinkName}:`, error);
        }
    }
    
    return allDrinks;
}

// Експорт функцій
export {
    fetchDrinkByName,
    fetchDrinksList,
    API_BASE
};
