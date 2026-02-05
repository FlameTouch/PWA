// State Management Module
// Модуль для управління станом додатку

const appState = {
    drinks: [],
    filteredDrinks: [],
    favorites: [],
    currentView: 'drinks-view',
    currentDrink: null,
    searchTerm: '',
    categoryFilter: 'all',
    isOnline: navigator.onLine,
    db: null
};

// Отримання стану
function getState() {
    return appState;
}

// Оновлення напоїв
function setDrinks(drinks) {
    appState.drinks = drinks;
    appState.filteredDrinks = drinks;
}

// Оновлення відфільтрованих напоїв
function setFilteredDrinks(drinks) {
    appState.filteredDrinks = drinks;
}

// Додавання/видалення з улюблених
function toggleFavorite(drinkId) {
    const index = appState.favorites.indexOf(drinkId);
    if (index > -1) {
        appState.favorites.splice(index, 1);
    } else {
        appState.favorites.push(drinkId);
    }
    saveFavorites();
}

// Збереження улюблених у localStorage
function saveFavorites() {
    localStorage.setItem('drinkMasterFavorites', JSON.stringify(appState.favorites));
}

// Завантаження улюблених з localStorage
function loadFavorites() {
    const saved = localStorage.getItem('drinkMasterFavorites');
    if (saved) {
        appState.favorites = JSON.parse(saved);
    }
}

// Встановлення поточного напою
function setCurrentDrink(drink) {
    appState.currentDrink = drink;
}

// Встановлення поточного виду
function setCurrentView(viewId) {
    appState.currentView = viewId;
}

// Оновлення пошукового терміну
function setSearchTerm(term) {
    appState.searchTerm = term.toLowerCase();
}

// Встановлення фільтру категорії
function setCategoryFilter(category) {
    appState.categoryFilter = category;
}

// Оновлення статусу онлайн/офлайн
function setOnlineStatus(isOnline) {
    appState.isOnline = isOnline;
}

// Встановлення бази даних
function setDB(db) {
    appState.db = db;
}

// Експорт
export {
    getState,
    setDrinks,
    setFilteredDrinks,
    toggleFavorite,
    saveFavorites,
    loadFavorites,
    setCurrentDrink,
    setCurrentView,
    setSearchTerm,
    setCategoryFilter,
    setOnlineStatus,
    setDB
};
