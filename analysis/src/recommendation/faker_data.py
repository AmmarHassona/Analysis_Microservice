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
    client.drop_database('analysis')
    print("Database 'analysis' has been dropped.")

def generate_synthetic_data():
    user_id = 1 # One user
    categories = ['Food' , 'Entertainment' , 'Bills' , 'Shopping' , 'Transportation']
    current_year = datetime.now().year

    # Generate data
    data = []
    for category in categories:
        for month in range(1 , 13):
            date = datetime(current_year , month , random.randint(1 , 28))
            amount = round(random.uniform(10 , 500) , 2)
            vendor = fake.company()

            record = {
                "user_id": user_id ,
                "category": category ,
                "date": date ,
                "month": date.strftime('%Y-%m') ,
                "amount": amount ,
                "vendor": vendor
            }
            data.append(record)

    # Insert data into database
    if data:
        collection.insert_many(data)
        print(f"Inserted {len(data)} records into the 'spending_trend_data' collection.")
    else:
        print("No data to insert.")

    df = pd.DataFrame(data)
    print("Preview of the generated data:")
    print(df.head())

if __name__ == "__main__":
    #drop_dataset()
    generate_synthetic_data()