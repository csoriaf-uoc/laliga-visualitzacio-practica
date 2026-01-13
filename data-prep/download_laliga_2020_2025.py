# --------------------------------------------------------------
#   LA LIGA 2020–2025 — DESCÀRREGA AUTOMÀTICA COMPLETA DE fbref
#   Autora: Crhistel Soria Fuentes
# --------------------------------------------------------------

import soccerdata as sd
from pathlib import Path

print(">>> Iniciant descàrrega automàtica de LaLiga 2020–2025...\n")

# ------------------------------------------------------------
# 1. DECLARACIONS
# ------------------------------------------------------------

LEAGUE = 'ESP-La Liga'
# SEASONS = [2024]  # 2024−25 (Pràctica Part I)
SEASONS = [2020, 2021, 2022, 2023, 2024]  # 5 temporades per la Part II: 2020−21 fins 2024−25
RAW_DIR = Path("data_raw")
RAW_DIR.mkdir(exist_ok=True)

# ------------------------------------------------------------
# 2. BUCLE PER TOTES LES TEMPORADES
# ------------------------------------------------------------

for season in SEASONS:
    print(f"\n=== PROCESSANT TEMPORADA {season} ===")

    fb = sd.FBref(leagues=LEAGUE, seasons=[season])

    # Descarregar dades per equip
    print(" > Descarregant dades per equip...")
    standard = fb.read_team_season_stats(stat_type="standard")
    shooting = fb.read_team_season_stats(stat_type="shooting")
    passing = fb.read_team_season_stats(stat_type="passing")
    defense = fb.read_team_season_stats(stat_type="defense")
    possession = fb.read_team_season_stats(stat_type="possession")
    misc = fb.read_team_season_stats(stat_type="misc")

    # Descarregar dades de partits
    print(" > Descarregant calendari de partits...")
    matches = fb.read_schedule()

    # Guardar CSVs originals
    print(" > Guardant CSVs...")

    standard.to_csv(RAW_DIR / f"laliga_{season}_standard.csv", index=False)
    shooting.to_csv(RAW_DIR / f"laliga_{season}_shooting.csv", index=False)
    passing.to_csv(RAW_DIR / f"laliga_{season}_passing.csv", index=False)
    defense.to_csv(RAW_DIR / f"laliga_{season}_defense.csv", index=False)
    possession.to_csv(RAW_DIR / f"laliga_{season}_possession.csv", index=False)
    misc.to_csv(RAW_DIR / f"laliga_{season}_misc.csv", index=False)
    matches.to_csv(RAW_DIR / f"laliga_{season}_matches.csv", index=False)

    print(f" ✓ CSVs guardats correctament per la temporada {season}.")

print("\n>>> PROCÉS COMPLET!")
