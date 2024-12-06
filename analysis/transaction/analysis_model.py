import sys
import pandas as pd
import json
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score

def fetch_data(file_path):
    # Load and preprocess the CSV file
    data = pd.read_csv(file_path)

    # Rename columns for consistency
    data.rename(columns={
        'Transaction Date': 'transactionDate',
        'Amount': 'amount',
        'Vendor Name': 'vendorName',
        'Category': 'category',
        'Payment Method': 'paymentMethod',
        'Place': 'place',
        'User ID': 'userId'
    }, inplace=True, errors='ignore')

    # Drop unnecessary columns
    data = data.drop(columns=['Created At', 'Updated At', 'Notes', 'Card Last Four Digits', 'ID'], errors='ignore')

    # Parse dates and extract features
    data['transactionDate'] = pd.to_datetime(data['transactionDate'], errors='coerce')
    data = data.dropna(subset=['transactionDate'])

    data['year'] = data['transactionDate'].dt.year
    data['month'] = data['transactionDate'].dt.month
    data['day'] = data['transactionDate'].dt.day
    data['weekday'] = data['transactionDate'].dt.weekday

    # Rolling averages and other features
    data['amount_bin'] = pd.cut(data['amount'], bins=3, labels=['Low', 'Medium', 'High'])
    data['rolling_avg_amount'] = data.groupby('userId')['amount'].transform(lambda x: x.rolling(3, min_periods=1).mean())
    data['category_frequency'] = data.groupby(['userId', 'category'])['category'].transform('count')

    # Aggregate monthly totals
    monthly_totals = data.groupby(['userId', 'year', 'month'])['amount'].sum().reset_index(name='monthly_total')
    data = pd.merge(data, monthly_totals, on=['userId', 'year', 'month'], how='left')
    data['prev_month_total'] = data.groupby('userId')['monthly_total'].shift(1).fillna(0)

    # Encode categorical variables
    encoder = LabelEncoder()
    categorical_cols = ['vendorName', 'category', 'paymentMethod', 'place', 'amount_bin']
    category_mapping = {}

    for col in categorical_cols:
        if col == 'category':  # Save category mapping
            data[col] = encoder.fit_transform(data[col])
            category_mapping = dict(enumerate(encoder.classes_))
        else:
            data[col] = encoder.fit_transform(data[col])

    # Standardize numeric data
    scaler = StandardScaler()
    data[['amount']] = scaler.fit_transform(data[['amount']])

    # Define future amount as the target
    data['future_amount'] = data.groupby('userId')['amount'].shift(-1)
    data = data.dropna(subset=['future_amount'])

    return data, scaler, category_mapping

def analyze(file_path, budgets):
    # Fetch and preprocess the data
    data, scaler, category_mapping = fetch_data(file_path)

    # Define features and target
    x = data.drop(columns=['amount', 'future_amount', 'transactionDate', 'userId'], errors='ignore')
    y = data['future_amount']

    # Split data into training and testing sets
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)

    # Train the model using RandomForest with hyperparameter tuning
    param_grid = {
        'n_estimators': [200],
        'max_depth': [20],
        'min_samples_split': [5],
        'min_samples_leaf': [2]
    }
    grid_search = GridSearchCV(estimator=RandomForestRegressor(random_state=42), param_grid=param_grid, cv=5)
    grid_search.fit(x_train, y_train)

    # Make predictions
    y_pred = grid_search.predict(x)

    # Inverse transform scaled predictions
    y_pred_actual = scaler.inverse_transform(y_pred.reshape(-1, 1))
    y_actual = scaler.inverse_transform(y.values.reshape(-1, 1))

    # Add predictions and current amounts to the dataset
    data['Predicted Future Amount'] = y_pred_actual.flatten()
    data['Current Amount'] = scaler.inverse_transform(data['amount'].values.reshape(-1, 1)).flatten()

    # Aggregate data by category
    summary = data.groupby('category').agg({
        'Current Amount': 'sum',
        'Predicted Future Amount': 'sum'

    }).reset_index()

    # Map categories back to original names
    summary['Original Category'] = summary['category'].map(category_mapping)

    # Add budgets and recommendations
    summary['Budget'] = summary['Original Category'].map(budgets).fillna(0)
    summary['Budget Difference'] = summary['Predicted Future Amount'] - summary['Budget']
    summary['Recommendation'] = summary['Budget Difference'].apply(lambda x: 'Spend Less' if x > 0 else 'On Track')

    # Format output
    summary['Current Amount'] = summary['Current Amount'].round(2)
    summary['Predicted Future Amount'] = summary['Predicted Future Amount'].round(2)
    summary['Budget Difference'] = summary['Budget Difference'].round(2)
    summary['Recommended Budget'] = summary['Predicted Future Amount'] * 1.1
    # Drop the numerical category column to keep only the original category names
    summary = summary.drop(columns=['category'])

    return summary


if __name__ == "__main__":
    try:
        # Get file path and budgets from arguments
        file_path = sys.argv[1]
        budgets = json.loads(sys.argv[2])

        # Perform analysis
        result = analyze(file_path, budgets)
        print(result.to_json(orient='records'))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
