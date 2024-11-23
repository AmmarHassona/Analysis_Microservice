from sklearn.linear_model import LinearRegression
import numpy as np

def train_budget_model(df):
    """Train a linear regression model to predict future spending."""
    df['month_num'] = df['month'] + (df['year'] - df['year'].min()) * 12  # Monthly feature to capture trend
    X = df[['month_num']]  # Only month_num for simplicity, add more features if needed
    y = df['total_spending']
    
    model = LinearRegression()
    model.fit(X, y)
    return model