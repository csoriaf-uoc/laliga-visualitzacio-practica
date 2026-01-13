# --------------------------------------------------------------
#   SECCIÓ 2 — EFICIÈNCIA (xG vs GOLS REALS)
# --------------------------------------------------------------

import pandas as pd
from pathlib import Path

# ------------------------------------------------------------
# PATHS
# ------------------------------------------------------------

BASE_PATH = Path("data_processed")

SECTION1_NAME = "section1_overview.csv"
SECTION2_NAME = "section2_efficiency.csv"

INPUT_FILE = BASE_PATH / SECTION1_NAME
OUTPUT_FILE = BASE_PATH / SECTION2_NAME

MATCHES_PER_SEASON = 38  # A LaLiga són 38 partits

WEB_DATA_DIR = Path("../datastory/data")
WEB_DATA_DIR.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------
# CÀRREGA DE DADES
# ------------------------------------------------------------

print("📥 Llegint section1_overview.csv...")
df = pd.read_csv(INPUT_FILE)

# Comprovació mínima
required_columns = {"team", "season", "xGPerGame", "goals"}
missing = required_columns - set(df.columns)

if missing:
    raise ValueError(f"❌ Falten columnes necessàries: {missing}")

# ------------------------------------------------------------
# TRANSFORMACIÓ
# ------------------------------------------------------------

print("🔧 Calculant xG totals...")

df_section2 = (
    df[["team", "season", "xGPerGame", "goals"]]
    .assign(
        xG=lambda x: (x["xGPerGame"] * MATCHES_PER_SEASON).round(1)
    )
    .drop(columns=["xGPerGame"])
    .sort_values(["season", "team"])
    .reset_index(drop=True)
)

# Reordenar columnes
df_section2 = df_section2[["team", "season", "xG", "goals"]]

# ------------------------------------------------------------
# GUARDAR CSV
# ------------------------------------------------------------

df_section2.to_csv(OUTPUT_FILE, index=False)
df_section2.to_csv(WEB_DATA_DIR / SECTION2_NAME, index=False)

print("✅ section2_efficiency.csv creat correctament")
print(df_section2.head())
