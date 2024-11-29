import pymongo
import pandas as pd
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from model import fetch_data , preprocess_data
from datetime import datetime

client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client['analysis']
recommendation_collection = db['spending_recommendations']

# Default Category Budgets
category_budgets = {
    "Food": 300,
    "Bills": 350,
    "Shopping": 500,
    "Transportation": 500,
    "Entertainment": 400
}

def generate_recommendations():
    # Fetch and preprocess the data
    raw_data = fetch_data()
    if raw_data.empty:
        print("No data found in the database. Please populate it before running.")
        return

    preprocessed_data = preprocess_data(raw_data)
    if preprocessed_data.empty:
        print("No valid data available after preprocessing. Check your data integrity.")
        return

    # Fit OneHotEncoder on all category data
    encoder = OneHotEncoder(sparse_output = False , handle_unknown = "ignore")
    encoder.fit(preprocessed_data[['category']])

    recommendations = []

    # Process data for each category
    for category, category_data in preprocessed_data.groupby('category'):
        # Train model for the specific category
        model = RandomForestRegressor(n_estimators = 100 , random_state = 42)
        
        # One-hot encode the category data
        category_encoded = encoder.transform(category_data[['category']])
        encoded_feature_names = encoder.get_feature_names_out(['category'])
        encoded_df = pd.DataFrame(category_encoded , columns = encoded_feature_names , index = category_data.index)

        # Add one-hot encoded columns only once during training
        if not set(encoded_feature_names).issubset(category_data.columns):
            category_data = pd.concat([category_data , encoded_df] , axis = 1)

        features = ['month_num' , 'lag_spending' , 'category_avg'] + list(encoded_feature_names)
        X_train = category_data[features]
        y_train = category_data['amount']
        
        model.fit(X_train , y_train)

        # Debug
        print("Training features: ", X_train.columns.tolist())

        # Prepare data for prediction
        category_data['next_month_num'] = category_data['month_num'] + 1

        # Ensure no duplication of one-hot encoded columns during prediction
        if not set(encoded_feature_names).issubset(category_data.columns):
            category_encoded_for_prediction = encoder.transform(category_data[['category']])
            encoded_df_for_prediction = pd.DataFrame(category_encoded_for_prediction , columns = encoded_feature_names , index = category_data.index)
            category_data = pd.concat([category_data , encoded_df_for_prediction] , axis = 1)

        # Rename next_month_num to month_num for prediction
        category_data['month_num'] = category_data.pop('next_month_num')

        # Prepare the feature set for prediction
        features_for_prediction = ['month_num' , 'lag_spending' , 'category_avg'] + list(encoded_feature_names)
        X_predict = category_data[features_for_prediction]

        # Ensure the feature order matches the training data
        X_predict = X_predict[X_train.columns]

        # Debug
        print("Prediction features: " , X_predict.columns.tolist())

        # Predict spending for the next month
        category_data['predicted_spending'] = model.predict(X_predict)

        # Generate recommendations
        for _ , row in category_data.iterrows():
            user_id = row['user_id']
            budget = category_budgets.get(category , None)
            if budget is None:
                continue

            predicted_spending = row['predicted_spending']
            recommended_amount = min(predicted_spending , budget)
            reason = f"Predicted spending ({predicted_spending:.2f}) compared to budget ({budget:.2f})"

            recommendation = {
                "user_id": user_id ,
                "category": category ,
                "recommended_amount": recommended_amount ,
                "reason": reason ,
                "month": f"{row['year']}-{str(row['month']).zfill(2)}" ,
                "predicted_spending": predicted_spending ,
                "generated_at": datetime.now()
            }
            recommendations.append(recommendation)

    # Save recommendations to database
    if recommendations:
        recommendation_collection.insert_many(recommendations)
        print(f"Generated and stored {len(recommendations)} recommendations.")
    else:
        print("No recommendations generated.")