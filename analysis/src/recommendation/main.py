from model import fetch_data , preprocess_data
from recommendation import generate_recommendations
import pymongo

client = pymongo.MongoClient("mongodb://localhost:27017/")
recommendation_collection = client['analysis']['spending_recommendations']

def display_recommendations():
    recommendations = list(recommendation_collection.find())
    if recommendations:
        print("\nGenerated Recommendations:")
        for recommendation in recommendations:
            print(f"User: {recommendation['user_id']}, "
                  f"Category: {recommendation['category']}, "
                  f"Recommended Amount: ${recommendation['recommended_amount']:.2f}, "
                  f"Reason: {recommendation['reason']}, "
                  f"Month: {recommendation['month']}")
    else:
        print("\nNo recommendations found in the database.")

def main():
    print("Fetching and Preprocessing Data:")
    raw_data = fetch_data()
    if raw_data.empty:
        print("No data found in the database. Please populate it before running.")
        return

    preprocessed_data = preprocess_data(raw_data)
    if preprocessed_data.empty:
        print("No valid data available after preprocessing.")
        return

    print("Training Models and Generating Recommendations:")
    generate_recommendations()

    print("Displaying Recommendations:")
    display_recommendations()

if __name__ == "__main__":
    print("Starting the recommendation system...")
    main()