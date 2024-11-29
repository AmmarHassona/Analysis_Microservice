import pymongo
import pandas as pd
from model import fetch_data
from sklearn.metrics import mean_absolute_error , mean_squared_error , r2_score
import numpy as np

client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client['analysis']
collection = db['spending_recommendations']

def fetch_recommendations():
    recommendations = list(collection.find())
    recommendations_df = pd.DataFrame(recommendations)
    if 'month' in recommendations_df.columns:
        recommendations_df['month'] = pd.to_datetime(recommendations_df['month'])
    return recommendations_df

def evaluate_model(actual_spending , predicted_spending):
    mae = mean_absolute_error(actual_spending , predicted_spending)
    mse = mean_squared_error(actual_spending , predicted_spending)
    rmse = np.sqrt(mse)
    r2 = r2_score(actual_spending , predicted_spending)
    
    print(f"Mean Absolute Error (MAE): {mae:.2f}")
    print(f"Mean Squared Error (MSE): {mse:.2f}")
    print(f"Root Mean Squared Error (RMSE): {rmse:.2f}")
    print(f"R-squared (R²): {r2:.2f}")
    return mae , mse , rmse , r2

def compare_recommendations():
    recommendations_df = fetch_recommendations()
    actual_spending = fetch_data()

    if recommendations_df.empty:
        print("No recommendations found in the database. Please generate recommendations first.")
        return
    if actual_spending.empty:
        print("No actual spending data available. Ensure your database has the necessary records.")
        return

    if 'month' not in actual_spending.columns:
        raise ValueError("'actual_spending' DataFrame does not include 'month' column in datetime format.")
    actual_spending['month'] = pd.to_datetime(actual_spending['month'])
    actual_sum = (
        actual_spending.groupby(['user_id' , 'category' , 'month'])['amount']
        .sum()
        .reset_index()
        .rename(columns={'amount': 'actual_spending'})
    )

    # Merge actual spending with recommendations
    merged_data = pd.merge(
        actual_sum , recommendations_df ,
        on = ['user_id' , 'category' , 'month'] , how = 'inner'
    )
    
    if merged_data.empty:
        print("No matching data found between actual spending and recommendations.")
        return

    # Evaluate model performance
    print("\nModel Evaluation Metrics:")
    evaluate_model(merged_data['actual_spending'] , merged_data['predicted_spending'])

    # Calculate the spending difference
    merged_data['spending_diff'] = merged_data['actual_spending'] - merged_data['predicted_spending']

    # Display results
    print("\nComparison between Actual Spending and Predictions:")
    print(merged_data[['user_id' , 'category' , 'month' , 'actual_spending' , 'predicted_spending' , 'spending_diff']])

    return merged_data

if __name__ == "__main__":
    compare_recommendations()