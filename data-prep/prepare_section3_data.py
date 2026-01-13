# --------------------------------------------------------------
#   SECCIÓ 3 — EVOLUCIÓ TEMPORAL (Connected Scatterplot)
# --------------------------------------------------------------

import pandas as pd
from pathlib import Path

# ------------------------------------------------------------
# PATHS
# ------------------------------------------------------------

RAW_DATA_PATH = Path("data_raw")
OUTPUT_PATH = Path("data_processed")
OUTPUT_PATH.mkdir(exist_ok=True)

OUTPUT_FILE = OUTPUT_PATH / "section3_evolution.csv"

WEB_DATA_DIR = Path("../datastory/data")
WEB_DATA_DIR.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------
# UTILITATS
# ------------------------------------------------------------

def parse_score(score):
    """Converteix '2–1' → (2,1)"""
    if pd.isna(score):
        return None, None
    home, away = score.replace("–", "-").split("-")
    return int(home), int(away)

# ------------------------------------------------------------
# PROCESSAMENT
# ------------------------------------------------------------

all_seasons_data = []

print("📥 Buscant fitxers FBref a ./data_raw ...")

for file in sorted(RAW_DATA_PATH.glob("laliga_*_matches.csv")):
    start_year = int(file.stem.split("_")[1])  # ex: 2024
    season = f"{start_year}-{str(start_year + 1)[-2:]}"  # 2024-25

    print(f"\n📅 Processant temporada {season} ...")

    df = pd.read_csv(file)

    required_cols = {
        "week",
        "home_team",
        "away_team",
        "score",
        "home_xg",
        "away_xg",
    }

    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"❌ Falten columnes a {file.name}: {missing}")

    # Parsejar score
    df[["home_goals", "away_goals"]] = df["score"].apply(
        lambda s: pd.Series(parse_score(s))
    )

    rows = []

    for _, r in df.iterrows():
        matchday = int(r["week"])

        # --- HOME TEAM ---
        home_points = (
            3 if r["home_goals"] > r["away_goals"]
            else 1 if r["home_goals"] == r["away_goals"]
            else 0
        )

        rows.append({
            "team": r["home_team"],
            "season": season,
            "matchday": matchday,
            "points": home_points,
            "goal_diff": r["home_goals"] - r["away_goals"],
            "xg_diff": r["home_goals"] - r["home_xg"],
        })

        # --- AWAY TEAM ---
        away_points = (
            3 if r["away_goals"] > r["home_goals"]
            else 1 if r["away_goals"] == r["home_goals"]
            else 0
        )

        rows.append({
            "team": r["away_team"],
            "season": season,
            "matchday": matchday,
            "points": away_points,
            "goal_diff": r["away_goals"] - r["home_goals"],
            "xg_diff": r["away_goals"] - r["away_xg"],
        })

    season_df = pd.DataFrame(rows)

    # Ordenar i acumular
    season_df = season_df.sort_values(["team", "matchday"])

    season_df["points_cum"] = season_df.groupby("team")["points"].cumsum()
    season_df["goal_diff_cum"] = season_df.groupby("team")["goal_diff"].cumsum()
    season_df["xg_diff_cum"] = season_df.groupby("team")["xg_diff"].cumsum()

    all_seasons_data.append(
        season_df[[
            "team",
            "season",
            "matchday",
            "points_cum",
            "goal_diff_cum",
            "xg_diff_cum",
        ]]
    )


# ------------------------------------------------------------
# GUARDAR RESULTAT FINAL
# ------------------------------------------------------------

final_df = pd.concat(all_seasons_data).reset_index(drop=True)

final_df["team"] = final_df["team"].replace({
    "Betis": "Real Betis"
})

final_df.to_csv(OUTPUT_FILE, index=False)
final_df.to_csv(WEB_DATA_DIR / "section3_evolution.csv", index=False)

print("\n✅ section3_evolution.csv creat correctament")
print(final_df.head())