# import pymongo
# from data_preprocessing import get_preprocessed_data
# from model import train_budget_model

# # MongoDB Setup
# client = pymongo.MongoClient("mongodb://localhost:27017/")
# db = client['analysis']
# collection = db['spending_recommendations']

# # Define category budgets (example, adjust as needed)
# category_budgets = {
#     "Food": 300,
#     "Bills": 350,
#     "Shopping": 500,
#     "Transportation": 500,
#     "Entertainment": 400
# }

# def generate_ml_recommendations():
#     """Generate recommendations using machine learning predictions."""
#     actual_spending = get_preprocessed_data()
#     actual_spending['month_num'] = actual_spending['month'] + (actual_spending['year'] - actual_spending['year'].min()) * 12
    
#     # Clear old recommendations from MongoDB
#     collection.delete_many({})
    
#     recommendations = []
#     for category in actual_spending['category'].unique():
#         category_data = actual_spending[actual_spending['category'] == category]
#         model = train_budget_model(category_data)
        
#         for _, row in category_data.iterrows():
#             user_id = row['user_id']
#             budget = category_budgets.get(category, None)
#             if budget is None:
#                 continue
            
#             next_month_num = row['month_num'] + 1
#             predicted_spending = model.predict([[next_month_num]])[0]
            
#             # Recommendation based on predicted spending
#             reason = f"Predicted spending ({predicted_spending:.2f}) compared to budget ({budget:.2f})"
#             recommended_amount = min(predicted_spending, budget)  # Use the smaller of predicted or budget
            
#             recommendation = {
#                 "user_id": user_id,
#                 "category": category,
#                 "recommended_amount": recommended_amount,
#                 "reason": reason,
#                 "month": f"{row['year']}-{str(row['month']).zfill(2)}",
#                 "predicted_spending": predicted_spending,
#             }
#             recommendations.append(recommendation)

#     collection.insert_many(recommendations)
#     print(f"Generated {len(recommendations)} ML-based recommendations.")

import pymongo
import pandas as pd
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from model import fetch_data, preprocess_data
from datetime import datetime

# MongoDB Setup
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client['analysis']
recommendation_collection = db['spending_recommendations']

# Default Category Budgets (can be adjusted dynamically later)
category_budgets = {
    "Food": 300,
    "Bills": 350,
    "Shopping": 500,
    "Transportation": 500,
    "Entertainment": 400
}

def generate_recommendations():
    """Generate spending recommendations and save them to MongoDB."""
    # Fetch and preprocess the data
    raw_data = fetch_data()  # Assume fetch_data() returns the required raw data
    if raw_data.empty:
        print("No data found in the database. Please populate it before running.")
        return

    preprocessed_data = preprocess_data(raw_data)  # Assume preprocess_data() preprocesses the raw data
    if preprocessed_data.empty:
        print("No valid data available after preprocessing. Check your data integrity.")
        return

    # Fit OneHotEncoder on all category data
    encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
    encoder.fit(preprocessed_data[['category']])

    recommendations = []

    # Process data for each category
    for category, category_data in preprocessed_data.groupby('category'):
        # Train a model for the specific category
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        
        # One-hot encode the category data
        category_encoded = encoder.transform(category_data[['category']])
        encoded_feature_names = encoder.get_feature_names_out(['category'])
        encoded_df = pd.DataFrame(category_encoded, columns=encoded_feature_names, index=category_data.index)

        # Add one-hot encoded columns only once during training
        if not set(encoded_feature_names).issubset(category_data.columns):
            category_data = pd.concat([category_data, encoded_df], axis=1)

        # Ensure `month_num` and other relevant features are included in the model
        features = ['month_num', 'lag_spending', 'category_avg'] + list(encoded_feature_names)
        X_train = category_data[features]
        y_train = category_data['amount']
        
        # Train the model
        model.fit(X_train, y_train)

        # Debug: Print feature names during training
        print("Training features:", X_train.columns.tolist())

        # Prepare data for prediction
        category_data['next_month_num'] = category_data['month_num'] + 1

        # Ensure no duplication of one-hot encoded columns during prediction
        if not set(encoded_feature_names).issubset(category_data.columns):
            category_encoded_for_prediction = encoder.transform(category_data[['category']])
            encoded_df_for_prediction = pd.DataFrame(category_encoded_for_prediction, columns=encoded_feature_names, index=category_data.index)
            category_data = pd.concat([category_data, encoded_df_for_prediction], axis=1)

        # Rename `next_month_num` to `month_num` for prediction
        category_data['month_num'] = category_data.pop('next_month_num')

        # Prepare the feature set for prediction
        features_for_prediction = ['month_num', 'lag_spending', 'category_avg'] + list(encoded_feature_names)
        X_predict = category_data[features_for_prediction]

        # Ensure the feature order matches the training data
        X_predict = X_predict[X_train.columns]

        # Debug: Print feature names during prediction
        print("Prediction features:", X_predict.columns.tolist())

        # Predict spending for the next month
        category_data['predicted_spending'] = model.predict(X_predict)

        # Generate recommendations
        for _, row in category_data.iterrows():
            user_id = row['user_id']
            budget = category_budgets.get(category, None)
            if budget is None:
                continue

            predicted_spending = row['predicted_spending']
            recommended_amount = min(predicted_spending, budget)
            reason = f"Predicted spending ({predicted_spending:.2f}) compared to budget ({budget:.2f})"

            recommendation = {
                "user_id": user_id,
                "category": category,
                "recommended_amount": recommended_amount,
                "reason": reason,
                "month": f"{row['year']}-{str(row['month']).zfill(2)}",
                "predicted_spending": predicted_spending,
                "generated_at": datetime.now()
            }
            recommendations.append(recommendation)

    # Save recommendations to MongoDB
    if recommendations:
        recommendation_collection.insert_many(recommendations)
        print(f"Generated and stored {len(recommendations)} recommendations.")
    else:
        print("No recommendations generated.")