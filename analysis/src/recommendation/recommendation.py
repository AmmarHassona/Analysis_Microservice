import pymongo
from data_preprocessing import get_preprocessed_data
from model import train_budget_model

# MongoDB Setup
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client['analysis']
collection = db['spending_recommendations']

# Define category budgets (example, adjust as needed)
category_budgets = {
    "Food": 500,
    "Bills": 400,
    "Shopping": 300,
    "Transportation": 250,
    "Entertainment": 200
}

def generate_ml_recommendations():
    """Generate recommendations using machine learning predictions."""
    actual_spending = get_preprocessed_data()
    actual_spending['month_num'] = actual_spending['month'] + (actual_spending['year'] - actual_spending['year'].min()) * 12
    
    # Clear old recommendations from MongoDB
    collection.delete_many({})
    
    recommendations = []
    for category in actual_spending['category'].unique():
        category_data = actual_spending[actual_spending['category'] == category]
        model = train_budget_model(category_data)
        
        for _, row in category_data.iterrows():
            user_id = row['user_id']
            budget = category_budgets.get(category, None)
            if budget is None:
                continue
            
            next_month_num = row['month_num'] + 1
            predicted_spending = model.predict([[next_month_num]])[0]
            
            # Recommendation based on predicted spending
            reason = f"Predicted spending ({predicted_spending:.2f}) compared to budget ({budget:.2f})"
            recommended_amount = min(predicted_spending, budget)  # Use the smaller of predicted or budget
            
            recommendation = {
                "user_id": user_id,
                "category": category,
                "recommended_amount": recommended_amount,
                "reason": reason,
                "month": f"{row['year']}-{str(row['month']).zfill(2)}",
                "predicted_spending": predicted_spending,
            }
            recommendations.append(recommendation)

    collection.insert_many(recommendations)
    print(f"Generated {len(recommendations)} ML-based recommendations.")