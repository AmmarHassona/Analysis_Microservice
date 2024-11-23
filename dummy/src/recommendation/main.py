from recommendation import generate_ml_recommendations
import pymongo
import pandas as pd

# MongoDB Setup
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client['analysis']
collection = db['spending_recommendations']

def display_recommendations():
    """Fetch and display recommendations from MongoDB."""
    recommendations = list(collection.find())
    if recommendations:
        print("\nGenerated Recommendations:")
        for recommendation in recommendations:
            print(recommendation)
    else:
        print("\nNo recommendations found in the database.")

if __name__ == "__main__":
    print("Generating budget-aware recommendations...")
    generate_ml_recommendations()
    display_recommendations()