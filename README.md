# Slepička Tamagotchi 0.6.4

Obsah:
- `index.html` – hlavní stránka
- `css/style.css` – kompletní vzhled včetně nové vrstvy 0.5.0
- `js/game.js` – herní logika z verze 0.4.8

Fáze 1 mění hlavně scénu: vícevrstvé pozadí, kopce, stromy, plot, terén, nový kurník, den/noc a reakce prostředí na počasí.
Herní logika, ukládání, Open-Meteo, minihra a životní fáze zůstávají zachované.

Pro GitHub Pages nahrajte celý obsah této složky do kořene repozitáře.


## Verze 0.6.0 – vložený asset pack
- Do hry byly vložené obrázkové assety: kurník, slepička, kuřátko, 3 fáze vajíčka a farmářské doplňky.
- Struktura pro GitHub Pages: `index.html`, `css/style.css`, `js/game.js`, `assets/`.
- Nahraj na GitHub celý obsah složky, ne jen samotné HTML.


## 0.6.2 – čistá dynamická scéna
- odstraněny duplicitní obří assety z 0.6.1
- kurník je součástí jednoho kvalitního ilustrovaného prostředí
- automatické roční období podle měsíce
- jaro, léto, podzim a zima mají vlastní kompletní scénu
- déšť přepne scénu na mokrou variantu a přidá animované kapky
- sníh přepne scénu na zimní variantu a přidá více vrstev vloček
- zachované herní objekty: krmítko, napáječka, prachová koupel, hnízdo, lampa a bidlo


## 0.6.3 – počasí a roční období nahrané do hry
- V assets jsou přímo nahrané kompletní obrázky pro jaro, léto, podzim, zimu, déšť a sněžení.
- Hra je používá automaticky podle počasí a ročního období.
- Nic dalšího nemusíš doplňovat, stačí nahrát celý obsah ZIPu.


## 0.6.4 – opravy chyb
- opraven pád `render()` na obrazovce nové hry, když ještě neexistuje uložený stav
- opraven výpočet východu a západu slunce pro aktuální místní datum (původně se mohl počítat předchozí den)
- opraven ukazatel postupu fáze, který nyní začíná od 0 % po přechodu do nové životní fáze
- bezpečnější načítání starších a poškozených záloh + migrace chybějících hodnot
- bezpečnější vykreslování deníku a aktivity bez vkládání HTML ze zálohy
- odstraněny duplicitní staré vrstvy deště/sněhu, které se překrývaly s novým počasím
- odstraněn druhý starý déšť generovaný mimo hlavní weather overlay
- počasí se při dlouho otevřené hře automaticky obnovuje každých 15 minut
- export zálohy po stažení uvolní dočasnou URL
