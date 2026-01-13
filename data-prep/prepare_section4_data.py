# --------------------------------------------------------------
#   SECCIÓ 4 — ESTILS DE JOC (Radar charts)
# --------------------------------------------------------------

from pathlib import Path
import pandas as pd
import re

# ------------------------------------------------------------
# PATHS
# ------------------------------------------------------------
RAW_DIR = Path("data_raw")
PROCESSED_DIR = Path("data_processed")
PROCESSED_DIR.mkdir(exist_ok=True)

WEB_DATA_DIR = Path("../datastory/data")
WEB_DATA_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = PROCESSED_DIR / "section4_style.csv"

TOPICS = ["standard", "passing", "possession", "defense", "shooting"]


# ------------------------------------------------------------
# UTILITATS
# ------------------------------------------------------------
def season_label(y: int) -> str:
    return f"{y}-{str(y + 1)[-2:]}"


def parse_filename(path: Path):
    m = re.match(r"laliga_(\d{4})_([a-zA-Z]+)\.csv$", path.name)
    if not m:
        return None, None
    return int(m.group(1)), m.group(2).lower()


def read_fbref_csv(path: Path) -> pd.DataFrame:
    """
    Llegeix CSV FBref amb header multinivell parcial,
    aplana columnes i conserva totes les dades reals.
    """
    df = pd.read_csv(path, header=[0, 1])

    # Aplanar columnes (multinivell parcial inclòs)
    df.columns = [f"{a}_{b}".strip("_").strip() for a, b in df.columns]

    # Eliminar NOMÉS players_used (la resta de columnes són dades vàlides)
    drop_cols = [c for c in df.columns if "players_used" in c.lower()]
    df = df.drop(columns=drop_cols, errors="ignore")

    # Trobar la columna url (pot tenir sufixos)
    url_col = None
    for c in df.columns:
        if c.lower().startswith("url"):
            url_col = c
            break

    if url_col is None:
        raise ValueError(f"No s'ha trobat columna 'url' a {path.name}")

    # Renombrar a 'url' per simplificar
    df = df.rename(columns={url_col: "url"})

    # Crear team
    df["team"] = (
        df["url"]
        .astype(str)
        .str.split("/")
        .str[-1]
        .str.replace("-Stats", "", regex=False)
        .str.replace("-", " ", regex=False)
        .str.strip()
    )

    return df


def resolve_column(df: pd.DataFrame, target: str) -> str:
    """
    Retorna el nom real de la columna que coincideix amb target.
    Prova diverses estratègies: exacta, prefix, sufix.
    """
    # 1. Intentar coincidència exacta
    for c in df.columns:
        if c.strip() == target:
            return c

    # 2. Intentar coincidència per prefix (ex: "Poss_Unnamed..." o "Tkl+Int_Unnamed...")
    for c in df.columns:
        if c.startswith(target + "_"):
            return c

    # 3. Intentar coincidència per sufix (ex: "Progression_PrgP")
    for c in df.columns:
        if c.endswith("_" + target):
            return c

    raise ValueError(f"No s'ha trobat la columna '{target}'. Columnes disponibles: {df.columns.tolist()}")


def to_per90(series: pd.Series, minutes: pd.Series) -> pd.Series:
    return series / minutes


def normalize_by_season(df: pd.DataFrame, cols: list[str]) -> pd.DataFrame:
    for c in cols:
        df[c + "_norm"] = df.groupby("season")[c].transform(
            lambda x: (x - x.min()) / (x.max() - x.min())
            if x.max() != x.min() else 0.5
        )
    return df


# ------------------------------------------------------------
# 1) DETECTAR FITXERS
# ------------------------------------------------------------
files = []
for f in RAW_DIR.glob("laliga_*_*.csv"):
    y, t = parse_filename(f)
    if t in TOPICS:
        files.append((y, t, f))

by_season = {}
for y, t, f in files:
    by_season.setdefault(y, {})[t] = f

print("📥 Temporades trobades:", sorted(by_season.keys()))

# ------------------------------------------------------------
# 2) MERGE PER TEMPORADA
# ------------------------------------------------------------
all_seasons = []

for y in sorted(by_season):
    base = read_fbref_csv(by_season[y]["standard"])
    base["season"] = season_label(y)

    merged = base

    for topic in ["passing", "possession", "defense", "shooting"]:
        tmp = read_fbref_csv(by_season[y][topic])
        tmp["season"] = season_label(y)

        # Eliminar url per evitar duplicats
        tmp = tmp.drop(columns=["url"], errors="ignore")

        merged = merged.merge(
            tmp,
            on=["season", "team"],
            how="inner"
        )

    all_seasons.append(merged)

df = pd.concat(all_seasons, ignore_index=True)
print("✅ Taula integrada:", df.shape)

# ------------------------------------------------------------
# 3) VARIABLES DELS RADARS
# ------------------------------------------------------------
out = df[["season", "team"]].copy()
minutes = df[resolve_column(df, "Playing Time_90s")]

# ========================
# RADAR OFENSIU
# ========================
out["possession_pct"] = df[resolve_column(df, "Poss")]
out["xg_per90"] = df[resolve_column(df, "Per 90 Minutes_xG")]
out["shots_per90"] = df[resolve_column(df, "Standard_Sh/90")]
out["touches_att_pen_area_per90"] = to_per90(
    df[resolve_column(df, "Touches_Att Pen")], minutes
)
out["progressive_passes_per90"] = to_per90(
    df[resolve_column(df, "PrgP")], minutes
)

# ========================
# RADAR DEFENSIU
# ========================
out["tackles_interceptions_per90"] = to_per90(
    df[resolve_column(df, "Tkl+Int")], minutes
)
out["tackles_won_per90"] = to_per90(
    df[resolve_column(df, "TklW")], minutes
)
out["blocks_per90"] = to_per90(
    df[resolve_column(df, "Blocks_Sh")] + df[resolve_column(df, "Blocks_Pass")],
    minutes
)
out["interceptions_per90"] = to_per90(
    df[resolve_column(df, "Int")], minutes
)
out["def_actions_att_third_per90"] = to_per90(
    df[resolve_column(df, "Att 3rd")], minutes
)

# ========================
# RADAR PROGRESSIÓ
# ========================
out["progressive_carries_per90"] = to_per90(
    df[resolve_column(df, "PrgC")], minutes
)
out["long_pass_pct"] = df[resolve_column(df, "Long_Cmp%")]
out["crosses_into_pen_area_per90"] = to_per90(
    df[resolve_column(df, "CrsPA")], minutes
)
out["touches_per_possession"] = (
        df[resolve_column(df, "Touches_Touches")] /
        df[resolve_column(df, "Poss")]
)

# ------------------------------------------------------------
# 4) NORMALITZACIÓ
# ------------------------------------------------------------
value_cols = [c for c in out.columns if c not in ["season", "team"]]
out = normalize_by_season(out, value_cols)

# ------------------------------------------------------------
# 5) EXPORT FINAL
# ------------------------------------------------------------
out.to_csv(OUTPUT_FILE, index=False)
out.to_csv(WEB_DATA_DIR / "section4_style.csv", index=False)

print("\n✅ section4_style.csv creat correctament")
print(out.head())