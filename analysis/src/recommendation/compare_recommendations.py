# import pymongo
# import pandas as pd
# from data_preprocessing import get_preprocessed_data
# from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
# import numpy as np

# # MongoDB Setup
# client = pymongo.MongoClient("mongodb://localhost:27017/")
# db = client['analysis']
# collection = db['spending_recommendations']

# recommendations = list(collection.find())
# recommendations_df = pd.DataFrame(recommendations)

# def fetch_recommendations():
#     """Fetch recommendations from MongoDB and return as a pandas DataFrame."""
#     if 'month' in recommendations_df.columns:
#         recommendations_df['month'] = pd.to_datetime(recommendations_df['month'], format='%Y-%m')
#     return recommendations_df

# def evaluate_model(actual_spending, predicted_spending):
#     """Evaluate the model using MAE, MSE, RMSE, and R²."""
#     mae = mean_absolute_error(actual_spending, predicted_spending)
#     mse = mean_squared_error(actual_spending, predicted_spending)
#     rmse = np.sqrt(mse)
#     r2 = r2_score(actual_spending, predicted_spending)
    
#     print(f"Mean Absolute Error (MAE): {mae}")
#     print(f"Mean Squared Error (MSE): {mse}")
#     print(f"Root Mean Squared Error (RMSE): {rmse}")
#     print(f"R-squared (R²): {r2}")

# def compare_recommendations():
#     """Compare recommendations to actual spending sums."""
#     recommendations_df = fetch_recommendations()
#     actual_spending = get_preprocessed_data()
    
#     # Prepare data for comparison (this may need to be adapted depending on your data structure)
#     actual_spending['month'] = pd.to_datetime(
#         actual_spending[['year', 'month']].assign(day=1)
#     )
    
#     actual_sum = (
#         actual_spending.groupby(['user_id', 'category', 'month'])['total_spending']
#         .sum()
#         .reset_index()
#         .rename(columns={'total_spending': 'actual_spending'})
#     )
    
#     # Merge the actual spending with the recommendations
#     merged_data = pd.merge(
#         actual_sum, recommendations_df,
#         on=['user_id', 'category', 'month'], how='inner'
#     )
    
#     # Call the evaluate_model function to get metrics
#     evaluate_model(merged_data['actual_spending'], merged_data['predicted_spending'])
    
#     # Calculate the difference between actual and predicted spending
#     merged_data['spending_diff'] = merged_data['actual_spending'] - merged_data['predicted_spending']
#     print("Comparison between actual spending and predictions:")
#     print(merged_data)

#     print(merged_data.columns)

#     return merged_data

# # You can now run the compare_recommendations function to generate the comparison and evaluation
# if __name__ == "__main__":
#     compare_recommendations()

import pymongo
import pandas as pd
from model import fetch_data
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

# MongoDB Setup
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client['analysis']
collection = db['spending_recommendations']

def fetch_recommendations():
    """Fetch recommendations from MongoDB and return as a pandas DataFrame."""
    recommendations = list(collection.find())
    recommendations_df = pd.DataFrame(recommendations)
    if 'month' in recommendations_df.columns:
        recommendations_df['month'] = pd.to_datetime(recommendations_df['month'])  # Ensure datetime format
    return recommendations_df

def evaluate_model(actual_spending, predicted_spending):
    """Evaluate the model using MAE, MSE, RMSE, and R² metrics."""
    mae = mean_absolute_error(actual_spending, predicted_spending)
    mse = mean_squared_error(actual_spending, predicted_spending)
    rmse = np.sqrt(mse)
    r2 = r2_score(actual_spending, predicted_spending)
    
    print(f"Mean Absolute Error (MAE): {mae:.2f}")
    print(f"Mean Squared Error (MSE): {mse:.2f}")
    print(f"Root Mean Squared Error (RMSE): {rmse:.2f}")
    print(f"R-squared (R²): {r2:.2f}")
    return mae, mse, rmse, r2

def compare_recommendations():
    """Compare recommendations to actual spending sums and evaluate the model."""
    # Fetch data
    recommendations_df = fetch_recommendations()
    actual_spending = fetch_data()  # Ensure this returns the cleaned data

    # Validate input data
    if recommendations_df.empty:
        print("No recommendations found in the database. Please generate recommendations first.")
        return
    if actual_spending.empty:
        print("No actual spending data available. Ensure your database has the necessary records.")
        return

    # Prepare actual spending data
    if 'month' not in actual_spending.columns:
        raise ValueError("The 'actual_spending' DataFrame must include a 'month' column in datetime format.")
    actual_spending['month'] = pd.to_datetime(actual_spending['month'])  # Ensure datetime format
    actual_sum = (
        actual_spending.groupby(['user_id', 'category', 'month'])['amount']
        .sum()
        .reset_index()
        .rename(columns={'amount': 'actual_spending'})
    )

    # Merge actual spending with recommendations
    merged_data = pd.merge(
        actual_sum, recommendations_df,
        on=['user_id', 'category', 'month'], how='inner'
    )
    
    if merged_data.empty:
        print("No matching data found between actual spending and recommendations. Check your inputs.")
        return

    # Evaluate model performance
    print("\nModel Evaluation Metrics:")
    evaluate_model(merged_data['actual_spending'], merged_data['predicted_spending'])

    # Calculate the spending difference
    merged_data['spending_diff'] = merged_data['actual_spending'] - merged_data['predicted_spending']

    # Display results
    print("\nComparison between Actual Spending and Predictions:")
    print(merged_data[['user_id', 'category', 'month', 'actual_spending', 'predicted_spending', 'spending_diff']])

    return merged_data

# Execute the function when running the script
if __name__ == "__main__":
    compare_recommendations()