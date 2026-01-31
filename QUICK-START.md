# 🚀 Szybki Start - Drink Master PWA

## Krok 1: Dodaj ikony PNG

Aplikacja wymaga ikon w formacie PNG. Dodaj swoje ikony do folderu `icons/`:

**Wymagane rozmiary:**
- 72x72 px
- 96x96 px
- 128x128 px
- 144x144 px
- 152x152 px
- 192x192 px (wymagane minimum)
- 384x384 px
- 512x512 px (wymagane minimum)

**Nazwy plików:** `icon-{rozmiar}x{rozmiar}.png` (np. `icon-192x192.png`)

**Ważne:** Aplikacja nie będzie działać poprawnie bez ikon PNG!

## Krok 2: Uruchom lokalny serwer

Service Worker wymaga HTTPS lub localhost. Uruchom lokalny serwer HTTP:

### Node.js (http-server)
```bash
npx http-server -p 8000
```

## Krok 3: Otwórz aplikację

Przejdź do: `http://localhost:8000`

## Krok 4: Sprawdź działanie

1. **Service Worker**: Otwórz DevTools (F12) → Application → Service Workers
2. **Offline**: W DevTools → Network → zaznacz "Offline" i odśwież stronę
3. **Udostępnianie**: Otwórz szczegóły drinka i kliknij 📤
4. **Powiadomienia**: Kliknij "Włącz powiadomienia" gdy pojawi się prompt

## Krok 5: Zainstaluj jako PWA

### Chrome/Edge (Desktop)
- Kliknij ikonę instalacji w pasku adresu
- Lub: Menu → "Zainstaluj Drink Master"

### Chrome (Android)
- Menu (⋮) → "Dodaj do ekranu głównego"

### Safari (iOS)
- Przycisk Udostępnij → "Dodaj do ekranu głównego"

## Rozwiązywanie problemów

### Service Worker nie działa
- Upewnij się, że używasz localhost (nie file://)
- Sprawdź konsolę przeglądarki (F12)
- Wyczyść cache: DevTools → Application → Clear storage

### Ikony nie wyświetlają się
- Sprawdź czy pliki PNG istnieją w folderze `icons/`
- Sprawdź konsolę przeglądarki pod kątem błędów 404

## Gotowe do wdrożenia?

1. Dodaj ikony PNG do folderu `icons/`
2. Przetestuj lokalnie
3. Prześlij na hosting z HTTPS
4. Sprawdź działanie na produkcji

Powodzenia! 🍹
