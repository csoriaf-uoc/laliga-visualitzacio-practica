# Visualització de dades - LaLiga (2020–2025)

Aquest projecte presenta una visualització interactiva sobre l’evolució i el rendiment dels equips de LaLiga al llarg de diverses temporades, aproximadament entre les temporades 2020 i 2025.

L’objectiu principal és analitzar el rendiment esportiu dels equips a partir de mètriques avançades com els *expected goals* (xG), la diferència entre xG a favor i en contra, l’eficiència golejadora i l’estil de joc, combinant anàlisi quantitativa i narrativa visual.

## 🔗 Visualització interactiva
La visualització està disponible públicament a través de GitHub Pages:

👉 **[Enllaç a la visualització](https://csoriaf-uoc.github.io/laliga-datastory/)**

## 📊 Conjunt de dades
Les dades utilitzades corresponen a diverses temporades de LaLiga i inclouen informació sobre:
- expected goals (xG)
- gols reals
- rendiment per jornada
- mètriques d’estil de joc ofensiu, defensiu i de progressió

Les dades han estat prèviament processades amb Python, generant fitxers CSV específics per a cada secció de la visualització, amb l’objectiu de facilitar-ne la representació visual i la comparació entre equips.

## 🛠️ Tecnologies utilitzades
- **HTML / CSS** per a l’estructura i el disseny visual
- **JavaScript i D3.js** per a la visualització interactiva de dades
- **Python** per al processament, neteja i síntesi de les dades
- **GitHub Pages** per a la publicació del projecte

## 📁 Estructura del projecte
```
.
├── data-prep/
│   ├── data_processed/
│   │   ├── section1_overview.csv
│   │   ├── section2_efficiency.csv
│   │   ├── section3_evolution.csv
│   │   ├── section4_style.csv
│   │   └── section5_summary.csv
│   ├── data_raw/
│   │   ├── laliga_2020_defense.csv
│   │   ├── laliga_2020_matches.csv
│   │   ├── laliga_2020_misc.csv
│   │   ├── laliga_2020_passing.csv
│   │   ├── laliga_2020_possession.csv
│   │   ├── laliga_2020_shooting.csv
│   │   ├── laliga_2020_standard.csv
│   │   ├── laliga_2021_defense.csv
│   │   ├── laliga_2021_matches.csv
│   │   ├── laliga_2021_misc.csv
│   │   ├── laliga_2021_passing.csv
│   │   ├── laliga_2021_possession.csv
│   │   ├── laliga_2021_shooting.csv
│   │   ├── laliga_2021_standard.csv
│   │   ├── laliga_2022_defense.csv
│   │   ├── laliga_2022_matches.csv
│   │   ├── laliga_2022_misc.csv
│   │   ├── laliga_2022_passing.csv
│   │   ├── laliga_2022_possession.csv
│   │   ├── laliga_2022_shooting.csv
│   │   ├── laliga_2022_standard.csv
│   │   ├── laliga_2023_defense.csv
│   │   ├── laliga_2023_matches.csv
│   │   ├── laliga_2023_misc.csv
│   │   ├── laliga_2023_passing.csv
│   │   ├── laliga_2023_possession.csv
│   │   ├── laliga_2023_shooting.csv
│   │   ├── laliga_2023_standard.csv
│   │   ├── laliga_2024_defense.csv
│   │   ├── laliga_2024_matches.csv
│   │   ├── laliga_2024_misc.csv
│   │   ├── laliga_2024_passing.csv
│   │   ├── laliga_2024_possession.csv
│   │   ├── laliga_2024_shooting.csv
│   │   └── laliga_2024_standard.csv
│   ├── download_laliga_2020_2025.py
│   ├── prepare_section1_data.py
│   ├── prepare_section2_data.py
│   ├── prepare_section3_data.py
│   ├── prepare_section4_data.py
│   └── prepare_section5_data.py
├── datastory/
│   ├── css/
│   │   └── styles.css
│   ├── data/
│   │   ├── section1_overview.csv
│   │   ├── section2_efficiency.csv
│   │   ├── section3_evolution.csv
│   │   ├── section4_style.csv
│   │   └── section5_summary.csv
│   ├── js/
│   │   └── main.js
│   └── index.html
├── env/
└── README.md
```

## ▶️ Execució local
Per executar el projecte en local, cal servir-lo mitjançant un servidor web (per exemple, `python -m http.server`) i accedir a `index.html` des del navegador.

## 👤 Autoria
Crhistel Soria  
Màster Universitari en Ciència de Dades – UOC  
Assignatura: Visualització de Dades
