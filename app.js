// Dane drinków (będą buforowane w Service Worker)
const DRINKS_API = 'https://www.thecocktaildb.com/api/json/v1/1/search.php?s=';

// Stan aplikacji
const appState = {
    drinks: [],
    filteredDrinks: [],
    favorites: [],
    currentView: 'drinks-view',
    currentDrink: null,
    searchTerm: '',
    categoryFilter: 'all',
    isOnline: navigator.onLine
};

// Inicjalizacja aplikacji
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Funkcja inicjalizująca aplikację
async function initializeApp() {
    // Sprawdź czy Service Worker jest obsługiwany
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
        } catch (error) {
            console.error('Service Worker registration error:', error);
        }
    }

    // Załaduj ulubione z localStorage
    loadFavorites();

    // Załaduj drinki
    await loadDrinks();

    // Nasłuchuj zdarzeń online/offline
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    updateOnlineStatus();

    // Nasłuchuj zdarzeń nawigacji
    setupNavigation();

    // Nasłuchuj wyszukiwania i filtrów
    setupSearchAndFilters();

    // Inicjalizuj natywne funkcje
    initializeNativeFeatures();

    // Sprawdź czy użytkownik już udzielił zgody na powiadomienia
    if (Notification.permission === 'default') {
        setTimeout(() => {
            showNotificationPrompt();
        }, 3000);
    }
}

// Załaduj drinki z API lub cache
async function loadDrinks() {
    const loadingEl = document.getElementById('loading');
    const drinksListEl = document.getElementById('drinks-list');
    const emptyStateEl = document.getElementById('empty-state');

    loadingEl.classList.remove('hidden');
    drinksListEl.innerHTML = '';
    emptyStateEl.classList.add('hidden');

    try {
        // List of popular drinks to search
        const popularDrinks = [
            // Cocktails
            'margarita', 'mojito', 'cosmopolitan', 'old fashioned', 
            'negroni', 'daiquiri', 'martini', 'whiskey sour',
            'manhattan', 'bloody mary', 'pina colada', 'caipirinha',
            // Shots
            'kamikaze', 'b52', 'lemon drop', 'jagerbomb', 'jager bomb',
            'tequila', 'fireball', 'irish car bomb', 'buttery nipple',
            'red headed slut', 'sake bomb', 'screwdriver', 'sex on the beach'
        ];

        let allDrinks = [];

        // Jeśli jesteśmy online, pobierz z API
        if (appState.isOnline) {
            for (const drinkName of popularDrinks) {
                try {
                    const response = await fetch(`${DRINKS_API}${drinkName}`);
                    const data = await response.json();
                    if (data.drinks) {
                        allDrinks = allDrinks.concat(data.drinks);
                    }
                } catch (error) {
                    console.error(`Error fetching ${drinkName}:`, error);
                }
            }
        }

        // Usuń duplikaty
        const uniqueDrinks = [];
        const seenIds = new Set();
        for (const drink of allDrinks) {
            if (!seenIds.has(drink.idDrink)) {
                seenIds.add(drink.idDrink);
                uniqueDrinks.push(drink);
            }
        }

        // Jeśli nie ma drinków, użyj przykładowych danych (dla trybu offline)
        if (uniqueDrinks.length === 0) {
            uniqueDrinks.push(...getSampleDrinks());
        }

        appState.drinks = uniqueDrinks;
        appState.filteredDrinks = uniqueDrinks;
        renderDrinks();
    } catch (error) {
        console.error('Error loading drinks:', error);
        // Użyj przykładowych danych w przypadku błędu
        appState.drinks = getSampleDrinks();
        appState.filteredDrinks = appState.drinks;
        renderDrinks();
    } finally {
        loadingEl.classList.add('hidden');
    }
}

// Przykładowe dane drinków (dla trybu offline)
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

// Renderuj listę drinków
function renderDrinks(drinks = appState.filteredDrinks) {
    const drinksListEl = document.getElementById('drinks-list');
    const emptyStateEl = document.getElementById('empty-state');

    if (drinks.length === 0) {
        drinksListEl.innerHTML = '';
        emptyStateEl.classList.remove('hidden');
        return;
    }

    emptyStateEl.classList.add('hidden');
    drinksListEl.innerHTML = drinks.map(drink => createDrinkCard(drink)).join('');
    
    // Dodaj event listenery do kart
    drinksListEl.querySelectorAll('.drink-card').forEach(card => {
        card.addEventListener('click', () => {
            const drinkId = card.dataset.drinkId;
            showDrinkDetail(drinkId);
        });
    });

    // Dodaj event listenery do przycisków ulubionych
    drinksListEl.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const drinkId = btn.dataset.drinkId;
            toggleFavorite(drinkId);
        });
    });
}

// Utwórz kartę drinka
function createDrinkCard(drink) {
    const isFavorite = appState.favorites.includes(drink.idDrink);
    const emoji = getDrinkEmoji(drink.strCategory);
    
    return `
        <div class="drink-card" data-drink-id="${drink.idDrink}">
            <div class="drink-image">
                ${drink.strDrinkThumb ? 
                    `<img src="${drink.strDrinkThumb}" alt="${drink.strDrink}" onerror="this.parentElement.innerHTML='${emoji}'">` : 
                    emoji
                }
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                        data-drink-id="${drink.idDrink}" 
                        aria-label="Add to favorites">
                    ${isFavorite ? '⭐' : '☆'}
                </button>
            </div>
            <div class="drink-content">
                <h3 class="drink-name">${drink.strDrink}</h3>
            </div>
        </div>
    `;
}

// Pobierz emoji dla kategorii drinka
function getDrinkEmoji(category) {
    const emojiMap = {
        'Cocktail': '🍹',
        'Shot': '🥃',
        'Ordinary Drink': '🍸',
        'Punch / Party Drink': '🍻',
        'Beer': '🍺',
        'Soft Drink': '🥤'
    };
    return emojiMap[category] || '🍹';
}

// Pokaż szczegóły drinka
function showDrinkDetail(drinkId) {
    const drink = appState.drinks.find(d => d.idDrink === drinkId);
    if (!drink) return;

    appState.currentDrink = drink;
    const detailView = document.getElementById('detail-view');
    const drinkDetailEl = document.getElementById('drink-detail');

    // Pobierz składniki
    const ingredients = [];
    for (let i = 1; i <= 15; i++) {
        const ingredient = drink[`strIngredient${i}`];
        const measure = drink[`strMeasure${i}`];
        if (ingredient) {
            ingredients.push({ ingredient, measure: measure || '' });
        }
    }

    const isFavorite = appState.favorites.includes(drink.idDrink);
    const emoji = getDrinkEmoji(drink.strCategory);

    drinkDetailEl.innerHTML = `
        <div class="detail-header">
            <div class="detail-image">
                ${drink.strDrinkThumb ? 
                    `<img src="${drink.strDrinkThumb}" alt="${drink.strDrink}" class="detail-image" onerror="this.parentElement.innerHTML='${emoji}'">` : 
                    emoji
                }
            </div>
            <h2 class="detail-name">${drink.strDrink}</h2>
            <p class="detail-category">${drink.strCategory || 'Cocktail'}</p>
        </div>

        <div class="detail-section">
            <h3>Ingredients</h3>
            <ul class="ingredients-list">
                ${ingredients.map(ing => `
                    <li>${ing.measure ? `<strong>${ing.measure}</strong> ` : ''}${ing.ingredient}</li>
                `).join('')}
            </ul>
        </div>

        <div class="detail-section">
            <h3>Instructions</h3>
            <p class="instructions">${drink.strInstructions || 'No instructions available'}</p>
        </div>

        <div class="detail-actions">
            <button class="btn-primary favorite-detail-btn ${isFavorite ? 'active' : ''}" 
                    data-drink-id="${drink.idDrink}">
                ${isFavorite ? '⭐ Remove from favorites' : '☆ Add to favorites'}
            </button>
        </div>
    `;

    // Event listener dla przycisku ulubionych w szczegółach
    const favoriteBtn = drinkDetailEl.querySelector('.favorite-detail-btn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', () => {
            toggleFavorite(drink.idDrink);
            showDrinkDetail(drink.idDrink); // Refresh view
        });
    }

    switchView('detail-view');
}

// Przełącz widok
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
    appState.currentView = viewId;
}

// Konfiguracja nawigacji
function setupNavigation() {
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

// Pokaż ulubione
function showFavorites() {
    const favoritesView = document.getElementById('favorites-view');
    const favoritesListEl = document.getElementById('favorites-list');
    const favoritesEmptyEl = document.getElementById('favorites-empty');

    if (appState.favorites.length === 0) {
        favoritesListEl.innerHTML = '';
        favoritesEmptyEl.classList.remove('hidden');
    } else {
        favoritesEmptyEl.classList.add('hidden');
        const favoriteDrinks = appState.drinks.filter(d => 
            appState.favorites.includes(d.idDrink)
        );
        renderDrinks(favoriteDrinks);
        favoritesListEl.innerHTML = favoriteDrinks.map(drink => createDrinkCard(drink)).join('');
        
        // Dodaj event listenery
        favoritesListEl.querySelectorAll('.drink-card').forEach(card => {
            card.addEventListener('click', () => {
                const drinkId = card.dataset.drinkId;
                showDrinkDetail(drinkId);
            });
        });

        favoritesListEl.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const drinkId = btn.dataset.drinkId;
                toggleFavorite(drinkId);
                showFavorites(); // Refresh view
            });
        });
    }

    switchView('favorites-view');
}

// Przełącz ulubione
function toggleFavorite(drinkId) {
    const index = appState.favorites.indexOf(drinkId);
    if (index > -1) {
        appState.favorites.splice(index, 1);
    } else {
        appState.favorites.push(drinkId);
    }
    saveFavorites();
    renderDrinks();
}

// Zapisz ulubione do localStorage
function saveFavorites() {
    localStorage.setItem('drinkMasterFavorites', JSON.stringify(appState.favorites));
}

// Załaduj ulubione z localStorage
function loadFavorites() {
    const saved = localStorage.getItem('drinkMasterFavorites');
    if (saved) {
        appState.favorites = JSON.parse(saved);
    }
}

// Konfiguracja wyszukiwania i filtrów
function setupSearchAndFilters() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        appState.searchTerm = e.target.value.toLowerCase();
        filterDrinks();
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            appState.categoryFilter = btn.dataset.category;
            filterDrinks();
        });
    });
}

// Filtruj drinki
function filterDrinks() {
    let filtered = appState.drinks;

    // Filtruj po kategorii
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

    // Filtruj po wyszukiwaniu
    if (appState.searchTerm) {
        filtered = filtered.filter(drink =>
            drink.strDrink.toLowerCase().includes(appState.searchTerm) ||
            (drink.strInstructions && drink.strInstructions.toLowerCase().includes(appState.searchTerm))
        );
    }

    appState.filteredDrinks = filtered;
    renderDrinks();
}

// NATYWNE FUNKCJE URZĄDZENIA

// 1. Web Share API - udostępnij drink
function shareDrink() {
    const drink = appState.currentDrink;
    if (!drink) return;

    if (navigator.share) {
        const shareData = {
            title: `Check out this drink: ${drink.strDrink}`,
            text: `Ingredients: ${getIngredientsText(drink)}`,
            url: window.location.href
        };

        navigator.share(shareData)
            .then(() => console.log('Shared successfully'))
            .catch((error) => {
                console.error('Share error:', error);
                // Fallback - copy to clipboard
                copyToClipboard(`${drink.strDrink}\n${getIngredientsText(drink)}`);
            });
    } else {
        // Fallback for browsers without Web Share API
        copyToClipboard(`${drink.strDrink}\n${getIngredientsText(drink)}`);
        alert('Copied to clipboard!');
    }
}

// Pobierz tekst składników
function getIngredientsText(drink) {
    const ingredients = [];
    for (let i = 1; i <= 15; i++) {
        const ingredient = drink[`strIngredient${i}`];
        const measure = drink[`strMeasure${i}`];
        if (ingredient) {
            ingredients.push(`${measure || ''} ${ingredient}`.trim());
        }
    }
    return ingredients.join(', ');
}

// Skopiuj do schowka
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (error) {
        console.error('Copy error:', error);
    }
}

// 2. Powiadomienia Push
function initializeNotifications() {
    const enableBtn = document.getElementById('enable-notifications-btn');
    const dismissBtn = document.getElementById('dismiss-notifications-btn');

    if (enableBtn) {
        enableBtn.addEventListener('click', async () => {
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    showNotification('Notifications enabled!', 'You will receive reminders about new drinks.');
                    scheduleNotification();
                    hideNotificationPrompt();
                }
            }
        });
    }

    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            hideNotificationPrompt();
            localStorage.setItem('notificationPromptDismissed', 'true');
        });
    }
}

// Pokaż powiadomienie
function showNotification(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png'
        });
    }
}

// Zaplanuj powiadomienie (przykładowe - codziennie o 18:00)
function scheduleNotification() {
    // W rzeczywistej aplikacji można użyć Background Sync API
    // Tutaj pokazujemy przykład z setTimeout
    setTimeout(() => {
        if (Notification.permission === 'granted') {
            showNotification('🍹 Time for a drink!', 'Check out new drink recipes in the Drink Master app!');
        }
    }, 60000); // Po 1 minucie (dla demonstracji)
}

// Pokaż prompt powiadomień
function showNotificationPrompt() {
    const prompt = document.getElementById('notification-prompt');
    const dismissed = localStorage.getItem('notificationPromptDismissed');
    if (!dismissed && Notification.permission === 'default') {
        prompt.classList.remove('hidden');
    }
}

// Ukryj prompt powiadomień
function hideNotificationPrompt() {
    const prompt = document.getElementById('notification-prompt');
    prompt.classList.add('hidden');
}

// Inicjalizuj wszystkie natywne funkcje
function initializeNativeFeatures() {
    initializeNotifications();
}

// Obsługa statusu online/offline
function handleOnline() {
    appState.isOnline = true;
    updateOnlineStatus();
    loadDrinks(); // Refresh drinks when we come back online
}

function handleOffline() {
    appState.isOnline = false;
    updateOnlineStatus();
}

function updateOnlineStatus() {
    const indicator = document.getElementById('offline-indicator');
    if (appState.isOnline) {
        indicator.classList.add('hidden');
    } else {
        indicator.classList.remove('hidden');
    }
}
