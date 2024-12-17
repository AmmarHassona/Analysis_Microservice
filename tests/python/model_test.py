import pytest
import pandas as pd
from io import StringIO
import sys
import os

# Add the `analysis` folder to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../analysis')))

from transaction.analysis_model import fetch_data, visualize_data, analyze

MOCK_CSV = """
Transaction Date,Amount,Vendor Name,Category,Payment Method,Place,User ID
2024-01-01,100,Amazon,Shopping,Credit Card,Online,1
2024-01-02,150,Walmart,Grocery,Cash,Store,1
2024-01-03,200,Target,Grocery,Credit Card,Online,1
2024-01-04,110,Starbucks,Shopping,Cash,Store,1
2024-01-04,500,Starbucks,Shopping,Cash,Store,1
2024-01-04,550,Starbucks,Shopping,Cash,Store,1
2024-01-04,150,Starbucks,Shopping,Cash,Store,1
2024-01-04,55,Starbucks,Shopping,Cash,Store,1
2024-01-04,80,Starbucks,Shopping,Cash,Store,1
2024-01-04,70,Starbucks,Shopping,Cash,Store,1
"""

@pytest.fixture
def mock_csv():
    return StringIO(MOCK_CSV)

def test_fetch_data(mock_csv):
    data, scaler, category_mapping = fetch_data(mock_csv)
    assert 'year' in data.columns
    assert 'rolling_avg_amount' in data.columns
    assert len(data) > 0

def test_analyze(mock_csv):
    budgets = {"Shopping": 120, "Grocery": 180}
    summary = analyze(mock_csv, budgets)
    assert 'Recommendation' in summary.columns
    assert summary['Recommendation'].isin(['Spend Less', 'On Track']).all()

def test_visualize_data(mock_csv):
    budgets = {"Shopping": 120, "Grocery": 180}
    images = visualize_data(mock_csv, budgets)
    assert 'vendor_vs_amount' in images
    assert 'payment_method_pie' in images