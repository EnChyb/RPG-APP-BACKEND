# BACKEND - RPG-APP - NODE JS

## O projekcie

Projekt został utworzony przy użyciu Node JS w wersji 22.11, TypeScript oraz yarn.

## Jak zacząć

Upewnij się, że używasz NodeJS w wersji 22.11.0. Jeśli to konieczne, to pobierz NodeJS i zainstaluj.

1. Sklonuj repozytorium.
2. Zainstaluj paczki przy użyciu `yarn install`
3. Użyj trybu deweloperskiego za pomocą komendy `yarn dev`.

## GitFlow – Zasady pracy

1. **Gałąź `main`:**
   - To główna gałąź produkcyjna. Żadne zmiany nie powinny być wprowadzane bezpośrednio – wszystkie zmiany trafiają przez Pull Requesty.
2. **Gałąź `develop`:**
   - To główna gałąź deweloperska. Na jej bazie powstają gałęzie `feature` oraz `release`.
3. **Gałęzie `feature/*`:**

   - Służą do tworzenia nowych funkcjonalności.
   - Utwórz gałąź: `git checkout -b feature/nazwa-funkcjonalnosci` z gałęzi `develop`.
   - Po zakończeniu prac otwórz PR, aby scalić zmiany z `develop`.

4. **Gałęzie `release/*`:**

   - Powstają z gałęzi `develop`, gdy zbiór zmian jest gotowy do wydania.
   - Testuj i wprowadzaj poprawki na tej gałęzi.
   - Po zatwierdzeniu scal do `main` (oraz taguj wersję) i scal z powrotem do `develop`.

5. **Gałęzie `hotfix/*`:**
   - Używane do szybkich napraw krytycznych błędów na produkcji.
   - Utwórz z gałęzi `main`, wprowadź poprawki, a następnie scal z `main` i `develop`.

---

## Branch Protection

W repozytorium ustustawiono ochronę gałęzi `main` i `develop`:

- **Wymagane Pull Requesty:**  
  Zmiany trafiające do tych gałęzi muszą być zatwierdzone przez przynajmniej jednego recenzenta.

- **Ograniczone uprawnienia:**  
  Tylko wyznaczeni deweloperzy lub zespoły mogą bezpośrednio pushować zmiany.

---

## Instrukcje dla deweloperów

1. **Przed rozpoczęciem pracy:**

   - Zawsze pobierz najnowsze zmiany z gałęzi `develop`:
     ```bash
     git checkout develop
     git pull origin develop
     ```

2. **Tworzenie nowej funkcjonalności:**

   - Utwórz gałąź feature z `develop`:
     ```bash
     git checkout -b feature/nazwa-funkcjonalnosci
     ```
   - Wypchnij gałąź:
     ```bash
     git push -u origin feature/nazwa-funkcjonalnosci
     ```
   - Po zakończeniu prac otwórz Pull Request do `develop`.

3. **Przygotowanie wydania:**

   - Z gałęzi `develop` utwórz gałąź release, np.:
     ```bash
     git checkout -b release/v1.0.0
     git push -u origin release/v1.0.0
     ```
   - Po przetestowaniu i zatwierdzeniu zmian scal PR do `main` i oznacz wydanie tagiem.

4. **Naprawa błędów (hotfix):**

   - W przypadku krytycznych błędów utwórz gałąź hotfix z `main`:
     ```bash
     git checkout main
     git checkout -b hotfix/nazwa-hotfix
     git push -u origin hotfix/nazwa-hotfix
     ```
   - Po wprowadzeniu poprawek scal zmiany do `main` oraz `develop`.

5. **Po scaleniu:**
   - Usuń lokalne i zdalne gałęzie, które nie są już potrzebne.

---
