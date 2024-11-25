# from sklearn.linear_model import LinearRegression
# import numpy as np

# def train_budget_model(df):
#     """Train a linear regression model to predict future spending."""
#     df['month_num'] = df['month'] + (df['year'] - df['year'].min()) * 12  # Monthly feature to capture trend
#     X = df[['month_num']]  # Only month_num for simplicity, add more features if needed
#     y = df['total_spending']
    
#     model = LinearRegression()
#     model.fit(X, y)
#     return model

import pymongo
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import OneHotEncoder
import numpy as np

# MongoDB Client Setup
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client['analysis']
collection = db['spending_trend_data']

def fetch_data():
    """Fetch spending data from MongoDB."""
    cursor = collection.find()
    df = pd.DataFrame(list(cursor))
    if '_id' in df.columns:
        df.drop('_id', axis=1, inplace=True)  # Drop MongoDB's default ID field
    return df

def preprocess_data(df):
    """Preprocess data to prepare it for the regression model."""
    if 'date' not in df.columns:
        raise ValueError("Data missing 'date' column.")

    # Convert 'date' to datetime format and extract month/year
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df['month'] = df['date'].dt.month
    df['year'] = df['date'].dt.year
    
    # Numeric representation of time (for trend analysis)
    df['month_num'] = df['month'] + (df['year'] - df['year'].min()) * 12

    # Lagged spending (spending from the previous month in the same category)
    df['lag_spending'] = df.groupby(['user_id', 'category'])['amount'].shift(1)

    # Category-specific average spending
    df['category_avg'] = df.groupby(['user_id', 'category'])['amount'].transform('mean')

    # Drop rows with missing values (from lagged spending)
    df.dropna(inplace=True)

    return df

def train_budget_model(df):
    """Train a regression model to predict spending."""
    # Define features and target
    features = ['month_num', 'lag_spending', 'category_avg', 'category']
    X = df[features]
    y = df['amount']

    # One-Hot Encoding for the 'category' column
    encoder = OneHotEncoder()
    category_encoded = encoder.fit_transform(X[['category']]).toarray()
    category_columns = encoder.get_feature_names_out(['category'])

    # Replace 'category' with the encoded columns in X
    X = pd.concat(
        [X.drop(columns=['category']).reset_index(drop=True), 
         pd.DataFrame(category_encoded, columns=category_columns).reset_index(drop=True)],
        axis=1
    )
    y = y.reset_index(drop=True)

    # Drop rows with missing values
    X = X.dropna()
    y = y[X.index]  # Ensure alignment between X and y

    # Split into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train a Random Forest Regressor
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Evaluate the model
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)

    print(f"Model Evaluation:\nMAE: {mae}\nMSE: {mse}\nRMSE: {rmse}\nR²: {r2}")

    return model

def main():
    # Fetch data from MongoDB
    raw_data = fetch_data()

    # Preprocess the data
    preprocessed_data = preprocess_data(raw_data)

    # Train and evaluate the model
    model = train_budget_model(preprocessed_data)

if __name__ == "__main__":
    main()