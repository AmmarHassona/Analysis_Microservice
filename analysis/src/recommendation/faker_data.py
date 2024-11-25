import random
from faker import Faker
import pymongo
import pandas as pd
from datetime import datetime

# MongoDB Setup
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client['analysis']
collection = db['spending_trend_data']

# Faker Setup
fake = Faker()

def drop_dataset():
    """Drop the existing dataset in the analysis database."""
    client.drop_database('analysis')
    print("Database 'analysis' has been dropped.")

def generate_synthetic_data():
    """
    Generate synthetic spending data for a single user 
    across all categories for every month of the current year.
    """
    user_id = 1  # Single user
    categories = ['Food', 'Entertainment', 'Bills', 'Shopping', 'Transportation']
    current_year = datetime.now().year

    # Generate synthetic data
    data = []
    for category in categories:
        for month in range(1, 13):  # Iterate through all months
            date = datetime(current_year, month, random.randint(1, 28))  # Avoid date errors
            amount = round(random.uniform(10, 500), 2)
            vendor = fake.company()

            record = {
                "user_id": user_id,
                "category": category,
                "date": date,
                "month": date.strftime('%Y-%m'),
                "amount": amount,
                "vendor": vendor
            }
            data.append(record)

    # Insert the data into MongoDB
    if data:
        collection.insert_many(data)
        print(f"Inserted {len(data)} records into the 'spending_trend_data' collection.")
    else:
        print("No data to insert.")

    # Optional: Preview the generated data using pandas
    df = pd.DataFrame(data)
    print("Preview of the generated data:")
    print(df.head())

# Main execution
if __name__ == "__main__":
    #drop_dataset()
    generate_synthetic_data()  # Generate new synthetic data