# --------------------------------------------------------------
#   SECCIÓ 1 — OVERVIEW
# --------------------------------------------------------------

from pathlib import Path
import pandas as pd

seasons = {
    "2020-21": "laliga_2020_standard.csv",
    "2021-22": "laliga_2021_standard.csv",
    "2022-23": "laliga_2022_standard.csv",
    "2023-24": "laliga_2023_standard.csv",
    "2024-25": "laliga_2024_standard.csv"
}

RAW_DIR = Path("data_raw")
PROCESSED_DIR = Path("data_processed")
PROCESSED_DIR.mkdir(exist_ok=True)
WEB_DATA_DIR = Path("../datastory/data")
WEB_DATA_DIR.mkdir(parents=True, exist_ok=True)


def extract_team_from_url(url):
    if not isinstance(url, str):
        return None
    name = url.split("/")[-1]
    return name.replace("-Stats", "").replace("-", " ")

all_data = []

for season, file in seasons.items():
    print(f"Processant temporada {season}...")

    df = pd.read_csv(RAW_DIR / file, header=[0, 1])

    # Aplanar columnes
    df.columns = [f"{a}_{b}".strip("_") for a, b in df.columns]

    # Normalitzar url
    df = df.rename(columns={"url_Unnamed: 31_level_1": "url"})

    # Crear team
    df["team"] = df["url"].apply(extract_team_from_url)
    df["season"] = season

    # Columnes clau
    df_section = pd.DataFrame({
        "team": df["team"],
        "season": season,
        "xGPerGame": df["Expected_xG"] / df["Playing Time_MP"],
        "xGAPerGame": df["Expected_npxG"] / df["Playing Time_MP"],
        "goals": df["Performance_Gls"]
    })

    df_section["xGPerGame"] = df_section["xGPerGame"].round(2)
    df_section["xGAPerGame"] = df_section["xGAPerGame"].round(2)

    all_data.append(df_section)

final_df = pd.concat(all_data, ignore_index=True)
final_df.to_csv(PROCESSED_DIR / "section1_overview.csv", index=False)
final_df.to_csv(WEB_DATA_DIR / "section1_overview.csv", index=False)

print("✅ section1_overview.csv creat correctament")
print(final_df.head())