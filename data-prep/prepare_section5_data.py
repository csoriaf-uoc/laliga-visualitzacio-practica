# --------------------------------------------------------------
#   SECCIÓ 5 — CONCLUSIONS
# --------------------------------------------------------------
import pandas as pd
from pathlib import Path

# -------------------------------
# Paths
# -------------------------------
INPUT_PATH = "data_processed/"
OUTPUT_PATH = "data_processed/"

WEB_DATA_DIR = Path("../datastory/data")
WEB_DATA_DIR.mkdir(parents=True, exist_ok=True)

SECTION1_FILE = "section1_overview.csv"
SECTION2_FILE = "section2_efficiency.csv"
SECTION3_FILE = "section3_evolution.csv"
SECTION4_FILE = "section4_style.csv"

OUTPUT_FILE = "section5_summary.csv"


# -------------------------------
# Load data
# -------------------------------
df_s1 = pd.read_csv(INPUT_PATH + SECTION1_FILE)
df_s2 = pd.read_csv(INPUT_PATH + SECTION2_FILE)
df_s3 = pd.read_csv(INPUT_PATH + SECTION3_FILE)
df_s4 = pd.read_csv(INPUT_PATH + SECTION4_FILE)


# -------------------------------
# KPI 1 — Performance xG
# -------------------------------
df_s1["performance_xg"] = df_s1["xGPerGame"] - df_s1["xGAPerGame"]
df_perf = df_s1[["season", "team", "performance_xg"]]


# -------------------------------
# KPI 2 — Efficiency
# -------------------------------
df_s2["efficiency"] = df_s2["goals"] - df_s2["xG"]
df_eff = df_s2[["season", "team", "efficiency"]]


# -------------------------------
# Merge KPI 1 & 2
# -------------------------------
df = df_perf.merge(df_eff, on=["season", "team"], how="inner")


# -------------------------------
# KPI 3 — Trend (from xg_diff_cum)
# -------------------------------
trend_rows = []

for (season, team), g in df_s3.groupby(["season", "team"]):
    g = g.sort_values("matchday")

    n = len(g)
    if n < 6:
        trend = "stable"
    else:
        first = g.iloc[: n // 3]["xg_diff_cum"].mean()
        last = g.iloc[- n // 3 :]["xg_diff_cum"].mean()
        delta = last - first

        if delta > 0.3:
            trend = "up"
        elif delta < -0.3:
            trend = "down"
        else:
            trend = "stable"

    trend_rows.append({
        "season": season,
        "team": team,
        "trend": trend
    })

df_trend = pd.DataFrame(trend_rows)
df = df.merge(df_trend, on=["season", "team"], how="left")


# -------------------------------
# KPI 4 — Play style (rule-based)
# -------------------------------
def classify_style(row):
    if (
        row["xg_per90_norm"] > 0.6
        and row["progressive_passes_per90_norm"] > 0.6
    ):
        return "Ofensiu"
    elif (
        row["tackles_interceptions_per90_norm"] > 0.6
        and row["blocks_per90_norm"] > 0.6
    ):
        return "Defensiu"
    else:
        return "Equilibrat"


df_s4["play_style"] = df_s4.apply(classify_style, axis=1)
df_style = df_s4[["season", "team", "play_style"]]

df = df.merge(df_style, on=["season", "team"], how="left")


# -------------------------------
# Guardar CSV final
# -------------------------------
df.to_csv(OUTPUT_PATH + OUTPUT_FILE, index=False)
df.to_csv(WEB_DATA_DIR / OUTPUT_FILE, index=False)

print(f"✅ {OUTPUT_FILE} creat correctament")