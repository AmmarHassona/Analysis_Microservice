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
    client.drop_database(db)
    print('DB has been dropped.')

def generate_synthetic_data(num_records):
    """Generate synthetic spending data for every month for each category."""
    data = []
    user_id = 1  # Single user
    categories = ['Food', 'Entertainment', 'Bills', 'Shopping', 'Transportation']

    # Loop through each category
    for category in categories:
        for month in range(1, 13):  # Ensure spending for every month
            # Generate a random date within the month
            year = datetime.now().year
            day = random.randint(1, 28)  # To keep things simple for February
            date = datetime(year, month, day)

            # Generate a random spending amount and vendor
            amount = round(random.uniform(10, 500), 2)
            vendor = fake.company()

            # Append the generated record
            data.append({
                "user_id": user_id,
                "category": category,
                "date": date,
                "amount": amount,
                "vendor": vendor,
                "created_at": datetime.now()
            })
    
    # Convert the data to a DataFrame (optional, for debugging)
    df = pd.DataFrame(data, columns=['user_id', 'category', 'date', 'amount', 'vendor', 'created_at'])
    print(df.head())  # Print a preview of the data

    # Insert the data into MongoDB
    if data:
        collection.insert_many(data)
        print(f"Inserted {len(data)} records into MongoDB.")
    else:
        print("No data to insert.")

# Generate data for a single user with spending for every month and category
generate_synthetic_data(60)  # 60 records (5 categories * 12 months)