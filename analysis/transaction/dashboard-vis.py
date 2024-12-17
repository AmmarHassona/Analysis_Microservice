import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import glob
import os

def visualize_data(file_path , budgets):
    data = pd.read_csv(file_path)

    data.rename(columns = {
        'Transaction Date': 'transactionDate',
        'Amount': 'amount',
        'Vendor Name': 'vendorName',
        'Category': 'category',
        'Payment Method': 'paymentMethod',
        'Place': 'place',
        'User ID': 'userId'
    } , inplace = True , errors = 'ignore')

    data['amount'] = data['amount'].astype(float)

    # Histogram: Vendor Name vs. Amount
    plt.figure(figsize=(12, 6))
    sns.barplot(x='vendorName', y='amount', data=data, ci=None)
    plt.title('Histogram: Vendor Name vs. Amount')
    plt.xticks(rotation=45, ha='right')
    plt.xlabel('Vendor Name')
    plt.ylabel('Amount')
    plt.tight_layout()
    plt.show()

    # Pie Chart: Total Amount by Payment Method
    payment_method_totals = data.groupby('paymentMethod')['amount'].sum()
    plt.figure(figsize=(8, 8))
    payment_method_totals.plot(kind='pie', autopct='%1.1f%%', startangle=140)
    plt.title('Total Amount by Payment Method')
    plt.ylabel('')
    plt.show()

    # Pie Chart: Total Amount by Category
    category_totals = data.groupby('category')['amount'].sum()
    plt.figure(figsize=(8, 8))
    category_totals.plot(kind='pie', autopct='%1.1f%%', startangle=140)
    plt.title('Total Amount by Category')
    plt.ylabel('')
    plt.show()

    # Bar Chart: Total Spending by Category vs. Budget
    # Define sample budgets
    budgets = {
        'Electronics': 50000,
        'Groceries': 20000,
        'Food': 10000,
        'Automobile': 15000,
        'Books': 5000,
        'Health': 10000,
        'Furniture': 30000,
        'Entertainment': 10000,
        'Travel': 20000,
        'Fitness': 15000,
        'Maintenance': 12000
    }

    category_spending = data.groupby('category')['amount'].sum().reset_index()
    category_spending['budget'] = category_spending['category'].map(budgets)
    category_spending['difference'] = category_spending['amount'] - category_spending['budget']

    plt.figure(figsize=(12, 6))
    sns.barplot(x='category', y='amount', data=category_spending, label='Spending', color='blue')
    sns.barplot(x='category', y='budget', data=category_spending, label='Budget', color='orange', alpha=0.6)
    plt.xticks(rotation=45, ha='right')
    plt.title('Total Spending by Category vs. Budget')
    plt.xlabel('Category')
    plt.ylabel('Amount')
    plt.legend()
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":

    file_path = 'C:/Users/MSI/Documents/GitHub/Analysis_microservice/imports/aa4f64e4-7b48-459b-84a7-450fd22b7b5a_transactions.csv'
    budgets = {
        'Electronics': 50000,
        'Groceries': 20000,
        'Food': 10000,
        'Automobile': 15000,
        'Books': 5000,
        'Health': 10000,
        'Furniture': 30000,
        'Entertainment': 10000,
        'Travel': 20000,
        'Fitness': 15000,
        'Maintenance': 12000
    }

    visualize_data(file_path , budgets)