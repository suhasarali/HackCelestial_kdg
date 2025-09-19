import pandas as pd
import os

def load_price_csv(file_path: str):
    base_dir = os.path.dirname(os.path.dirname(__file__))  # .../app
    abs_path = os.path.join(base_dir, file_path)

    if not os.path.exists(abs_path):
        raise FileNotFoundError(f"Price CSV not found: {abs_path}")

    df = pd.read_csv(abs_path)

    # Normalize column names
    df.columns = df.columns.str.strip()
    # Rename long column name for convenience
    if "Price Type(includes Retail,FH,FLC)" in df.columns:
        df.rename(columns={"Price Type(includes Retail,FH,FLC)": "PriceType"}, inplace=True)

    return df


def get_avg_price(df: pd.DataFrame, species: str, state: str, price_type: str):
    """
    Filter dataframe by species, state and price_type. 
    Return average price as integer (rounded, no decimals) or None if not found.
    """
    try:
        filtered_df = df[
            (df["Species"].str.lower() == species.lower()) &
            (df["State/UT"].str.lower() == state.lower()) &
            (df["PriceType"].str.lower() == price_type.lower())
        ]

        if filtered_df.empty:
            return None

        # Take first matching value, remove commas, convert to float, then int
        avg_price_str = str(filtered_df["Average Price (Rs./Kg)"].iloc[0])
        avg_price_int = int(float(avg_price_str.replace(",", "").strip()))

        return avg_price_int

    except KeyError as e:
        raise KeyError(f"Column not found: {e}")
    except ValueError:
        # If conversion fails
        return None
