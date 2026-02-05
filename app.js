// Main Application File
// Головний файл додатку, який ініціалізує та координує всі модулі

// Імпорт модулів (використовуємо динамічний імпорт для сумісності)
import { initDB, saveDrinksToDB, loadDrinksFromDB } from './database.js';
import { fetchDrinksList } from './api.js';
import { 
    getState, 
    setDrinks, 
    setFilteredDrinks, 
    setDB, 
    setOnlineStatus,
    loadFavorites 
} from './state.js';
import { 
    switchView, 
    renderDrinks, 
    showDrinkDetail, 
    showFavorites 
} from './views.js';
import { 
    shareDrink, 
    initializeNativeFeatures, 
    vibrateOnFavorite,
    findNearbyBars,
    showNotificationPrompt 
} from './native-features.js';

// Прикладні дані напоїв для офлайн режиму
function getSampleDrinks() {
    return [
        {
            idDrink: '1',
            strDrink: 'Mojito',
            strCategory: 'Cocktail',
            strAlcoholic: 'Alcoholic',
            strGlass: 'Highball glass',
            strInstructions: 'Muddle mint leaves with sugar and lime juice. Add a splash of soda water and fill the glass with cracked ice. Pour the rum and top with soda water. Garnish with sprigs of mint leaves and lemon slice.',
            strDrinkThumb: null,
            strIngredient1: 'White rum',
            strMeasure1: '2-3 oz',
            strIngredient2: 'Lime',
            strMeasure2: 'Juice of 1',
            strIngredient3: 'Sugar',
            strMeasure3: '2 tsp',
            strIngredient4: 'Mint',
            strMeasure4: '2-4',
            strIngredient5: 'Soda water',
            strMeasure5: 'Top'
        },
        {
            idDrink: '2',
            strDrink: 'Margarita',
            strCategory: 'Cocktail',
            strAlcoholic: 'Alcoholic',
            strGlass: 'Cocktail glass',
            strInstructions: 'Rub the rim of the glass with the lime slice to make the salt stick to it. Take care to moisten only the outer rim and sprinkle the salt on it. Shake the other ingredients with ice, then carefully pour into the glass.',
            strDrinkThumb: null,
            strIngredient1: 'Tequila',
            strMeasure1: '1 1/2 oz',
            strIngredient2: 'Triple sec',
            strMeasure2: '1/2 oz',
            strIngredient3: 'Lime juice',
            strMeasure3: '1 oz',
            strIngredient4: 'Salt',
            strMeasure4: 'Coarse'
        },
        {
            idDrink: '3',
            strDrink: 'Old Fashioned',
            strCategory: 'Cocktail',
            strAlcoholic: 'Alcoholic',
            strGlass: 'Old-fashioned glass',
            strInstructions: 'Place sugar cube in old fashioned glass and saturate with bitters, add a dash of plain water. Muddle until dissolved. Fill the glass with ice cubes and add whiskey. Garnish with orange twist, and a cocktail cherry.',
            strDrinkThumb: null,
            strIngredient1: 'Bourbon',
            strMeasure1: '4.5 cL',
            strIngredient2: 'Angostura bitters',
            strMeasure2: '2 dashes',
            strIngredient3: 'Sugar',
            strMeasure3: '1 cube',
            strIngredient4: 'Water',
            strMeasure4: 'dash'
        },
        {
            idDrink: '4',
            strDrink: 'Kamikaze',
            strCategory: 'Shot',
            strAlcoholic: 'Alcoholic',
            strGlass: 'Shot glass',
            strInstructions: 'Shake all ingredients together with ice. Strain into glass, rim glass with sugar, and serve.',
            strDrinkThumb: null,
            strIngredient1: 'Vodka',
            strMeasure1: '1 oz',
            strIngredient2: 'Triple sec',
            strMeasure2: '1 oz',
            strIngredient3: 'Lime juice',
            strMeasure3: '1 oz'
        },
        {
            idDrink: '5',
            strDrink: 'B-52',
            strCategory: 'Shot',
            strAlcoholic: 'Alcoholic',
            strGlass: 'Shot glass',
            strInstructions: 'Layer ingredients into a shot glass. Start with Kahlua, then Baileys, and top with Grand Marnier.',
            strDrinkThumb: null,
            strIngredient1: 'Baileys irish cream',
            strMeasure1: '1/3 oz',
            strIngredient2: 'Grand Marnier',
            strMeasure2: '1/3 oz',
            strIngredient3: 'Kahlua',
            strMeasure3: '1/3 oz'
        },
        {
            idDrink: '6',
            strDrink: 'Lemon Drop',
            strCategory: 'Shot',
            strAlcoholic: 'Alcoholic',
            strGlass: 'Shot glass',
            strInstructions: 'Shake with ice, strain into shot glass. Serve with a lemon wedge.',
            strDrinkThumb: null,
            strIngredient1: 'Vodka',
            strMeasure1: '1 oz',
            strIngredient2: 'Lemon juice',
            strMeasure2: '1 oz',
            strIngredient3: 'Sugar',
            strMeasure3: '1 tsp'
        },
        {
            idDrink: '7',
            strDrink: 'Jager Bomb',
            strCategory: 'Shot',
            strAlcoholic: 'Alcoholic',
            strGlass: 'Shot glass',
            strInstructions: 'Drop shot glass of Jägermeister into a glass of energy drink.',
            strDrinkThumb: null,
            strIngredient1: 'Jägermeister',
            strMeasure1: '1 shot',
            strIngredient2: 'Energy drink',
            strMeasure2: '1 can'
        }
    ];
}

// Завантаження напоїв з API або бази даних
async function loadDrinks() {
    const appState = getState();
    const loadingEl = document.getElementById('loading');
    const drinksListEl = document.getElementById('drinks-list');
    const emptyStateEl = document.getElementById('empty-state');

    loadingEl.classList.remove('hidden');
    drinksListEl.innerHTML = '';
    emptyStateEl.classList.add('hidden');

    try {
        const popularDrinks = [
            'margarita', 'mojito', 'cosmopolitan', 'old fashioned', 
            'negroni', 'daiquiri', 'martini', 'whiskey sour',
            'manhattan', 'bloody mary', 'pina colada', 'caipirinha',
            'moscow mule', 'gin tonic', 'whiskey', 'vodka', 'rum',
            'bourbon', 'scotch', 'brandy', 'cognac', 'champagne',
            'wine', 'beer', 'cider', 'sangria', 'mimosa',
            'bellini', 'screwdriver', 'sex on the beach',
            'long island iced tea', 'mai tai', 'hurricane', 'zombie',
            'kamikaze', 'b52', 'lemon drop', 'jagerbomb', 'jager bomb',
            'tequila', 'fireball', 'irish car bomb', 'buttery nipple',
            'red headed slut', 'sake bomb', 'white russian', 'black russian', 
            'irish coffee', 'espresso martini'
        ];

        let allDrinks = [];
        let drinksFromDB = [];

        // Завантаження з бази даних
        try {
            drinksFromDB = await loadDrinksFromDB(appState.db);
            if (drinksFromDB && drinksFromDB.length > 0) {
                console.log(`Завантажено ${drinksFromDB.length} напоїв з IndexedDB`);
                allDrinks = drinksFromDB;
            }
        } catch (error) {
            console.error('Помилка завантаження з IndexedDB:', error);
        }

        // Завантаження з API, якщо онлайн
        if (appState.isOnline) {
            try {
                const newDrinks = await fetchDrinksList(popularDrinks);
                
                const existingIds = new Set(allDrinks.map(d => d.idDrink));
                const uniqueNewDrinks = newDrinks.filter(d => !existingIds.has(d.idDrink));
                allDrinks = allDrinks.concat(uniqueNewDrinks);

                if (uniqueNewDrinks.length > 0) {
                    try {
                        await saveDrinksToDB(appState.db, uniqueNewDrinks);
                    } catch (error) {
                        console.error('Помилка збереження в IndexedDB:', error);
                    }
                }
            } catch (error) {
                console.error('Помилка завантаження з API:', error);
            }
        }

        // Видалення дублікатів
        const uniqueDrinks = [];
        const seenIds = new Set();
        for (const drink of allDrinks) {
            if (!seenIds.has(drink.idDrink)) {
                seenIds.add(drink.idDrink);
                uniqueDrinks.push(drink);
            }
        }

        // Якщо немає напоїв, використовуємо приклади
        if (uniqueDrinks.length === 0) {
            const sampleDrinks = getSampleDrinks();
            uniqueDrinks.push(...sampleDrinks);
            try {
                await saveDrinksToDB(appState.db, sampleDrinks);
            } catch (error) {
                console.error('Помилка збереження прикладів:', error);
            }
        }

        setDrinks(uniqueDrinks);
        renderDrinks(uniqueDrinks);
    } catch (error) {
        console.error('Помилка завантаження напоїв:', error);
        const sampleDrinks = getSampleDrinks();
        setDrinks(sampleDrinks);
        setFilteredDrinks(sampleDrinks);
        renderDrinks(sampleDrinks);
    } finally {
        loadingEl.classList.add('hidden');
    }
}

// Налаштування навігації
function setupNavigation() {
    const appState = getState();
    
    document.getElementById('favorites-btn').addEventListener('click', () => {
        showFavorites();
    });

    document.getElementById('back-btn').addEventListener('click', () => {
        switchView('drinks-view');
    });

    document.getElementById('back-from-favorites-btn').addEventListener('click', () => {
        switchView('drinks-view');
    });

    document.getElementById('share-btn').addEventListener('click', () => {
        shareDrink();
    });
}

// Налаштування пошуку та фільтрів
async function setupSearchAndFilters() {
    const { setSearchTerm, setCategoryFilter } = await import('./state.js');
    const { filterDrinks } = await import('./filters.js');
    
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        setSearchTerm(e.target.value);
        filterDrinks();
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setCategoryFilter(btn.dataset.category);
            filterDrinks();
        });
    });
}

// Обробка онлайн/офлайн статусу
function handleOnline() {
    setOnlineStatus(true);
    updateOnlineStatus();
    loadDrinks(); 
}

function handleOffline() {
    setOnlineStatus(false);
    updateOnlineStatus();
}

function updateOnlineStatus() {
    const appState = getState();
    const indicator = document.getElementById('offline-indicator');
    if (appState.isOnline) {
        indicator.classList.add('hidden');
    } else {
        indicator.classList.remove('hidden');
    }
}

// Ініціалізація додатку
async function initializeApp() {
    try {
        // Ініціалізація бази даних
        const db = await initDB();
        setDB(db);
    } catch (error) {
        console.error('Помилка ініціалізації IndexedDB:', error);
    }
    
    // Реєстрація Service Worker
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            console.log('Service Worker зареєстровано:', registration);
        } catch (error) {
            console.error('Помилка реєстрації Service Worker:', error);
        }
    } else {
        console.warn('Service Worker не підтримується в цьому браузері');
    }

    // Завантаження улюблених
    loadFavorites();

    // Завантаження напоїв
    await loadDrinks();

    // Налаштування обробників подій
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    updateOnlineStatus();

    // Налаштування UI
    setupNavigation();
    await setupSearchAndFilters();
    initializeNativeFeatures();

    // Показ запроту на сповіщення
    if (Notification.permission === 'default') {
        setTimeout(() => {
            showNotificationPrompt();
        }, 3000);
    }
}

// Запуск додатку
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});
