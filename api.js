// API Module
// Модуль для роботи з API напоїв

// Використовуємо Service Worker для обходу CORS
// Service Worker може робити запити без CORS обмежень
const API_BASE = 'https://www.thecocktaildb.com/api/json/v1/1/search.php?s=';

// Отримання напою за назвою
// Запит буде оброблений Service Worker, який спробує отримати дані
// Якщо CORS блокує, Service Worker поверне дані з кешу
async function fetchDrinkByName(drinkName) {
    try {
        const url = `${API_BASE}${encodeURIComponent(drinkName)}`;
        
        // Робимо запит - Service Worker перехопить його в fetch event
        // і спробує отримати дані (Service Worker має більші права для запитів)
        const response = await fetch(url);
        
        // Перевірка на успішну відповідь
        if (response && response.ok) {
            const data = await response.json();
            return data.drinks || [];
        }
        
        // Якщо відповідь не OK, спробувати з кешу
        return await fetchDrinkFromCache(drinkName);
    } catch (error) {
        console.error(`Помилка завантаження ${drinkName}:`, error);
        // Якщо мережа не працює або CORS блокує, спробуємо через кеш
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
