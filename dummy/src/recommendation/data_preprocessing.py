import pymongo
import pandas as pd

# MongoDB Client Setup
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client['analysis']
collection = db['spending_trend_data']

def fetch_data():
    """Fetch spending data from MongoDB."""
    cursor = collection.find()
    df = pd.DataFrame(list(cursor))
    return df

def preprocess_data(df):
    """Preprocess data to calculate total spending per category per month."""
    if 'date' not in df.columns:
        raise ValueError("Data missing 'date' column.")
    
    # Convert 'date' to datetime format and extract month, year
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df['month'] = df['date'].dt.month
    df['year'] = df['date'].dt.year
    
    # Group by user_id, category, and month, and calculate the total spending
    monthly_spending = df.groupby(['user_id', 'category', 'month', 'year']).agg(
        total_spending=('amount', 'sum')
    ).reset_index()

    return monthly_spending

def get_preprocessed_data():
    """Fetch and preprocess the data."""
    df = fetch_data()
    return preprocess_data(df)