// IndexedDB Database Module
// Модуль для роботи з базою даних IndexedDB

const DB_NAME = 'DrinkMasterDB';
const DB_VERSION = 1;
const STORE_NAME = 'drinks';

// Ініціалізація бази даних
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('IndexedDB помилка:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            console.log('IndexedDB відкрито успішно');
            resolve(request.result);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'idDrink' });
                objectStore.createIndex('strDrink', 'strDrink', { unique: false });
                objectStore.createIndex('strCategory', 'strCategory', { unique: false });
                console.log('IndexedDB схема створена');
            }
        };
    });
}

// Збереження напоїв у базу даних
async function saveDrinksToDB(db, drinks) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        drinks.forEach(drink => {
            store.put(drink);
        });
        
        transaction.oncomplete = () => {
            console.log(`Збережено ${drinks.length} напоїв у IndexedDB`);
            resolve();
        };
        
        transaction.onerror = () => {
            console.error('Помилка збереження в IndexedDB:', transaction.error);
            reject(transaction.error);
        };
    });
}

// Завантаження всіх напоїв з бази даних
async function loadDrinksFromDB(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const drinks = request.result;
            console.log(`Завантажено ${drinks.length} напоїв з IndexedDB`);
            resolve(drinks);
        };
        
        request.onerror = () => {
            console.error('Помилка завантаження з IndexedDB:', request.error);
            reject(request.error);
        };
    });
}

// Очищення бази даних
async function clearDB(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        
        request.onsuccess = () => {
            console.log('База даних очищена');
            resolve();
        };
        
        request.onerror = () => {
            console.error('Помилка очищення бази даних:', request.error);
            reject(request.error);
        };
    });
}

// Експорт функцій
export {
    initDB,
    saveDrinksToDB,
    loadDrinksFromDB,
    clearDB,
    DB_NAME,
    STORE_NAME
};
