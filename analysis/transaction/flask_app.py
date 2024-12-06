from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys

# Add the transaction directory to the Python path dynamically
current_dir = os.path.dirname(os.path.abspath(__file__))
transaction_dir = os.path.join(current_dir, 'transaction')
sys.path.append(transaction_dir)

from analysis_model import analyze  # Now this import should work

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Path for imports directory
IMPORTS_DIR = os.path.join(os.getcwd(), 'imports')


@app.route('/get-comparison/<string:userId>', methods=['POST'])
def get_comparison_route(userId):
    try:
        # Get budgets from request body
        data = request.json
        budgets = data.get('budgets')

        if not budgets:
            return jsonify({"error": "Budgets not provided"}), 400

        # Construct the file path for the user's CSV file
        file_path = os.path.join(IMPORTS_DIR, f"{userId}_transactions.csv")

        if not os.path.exists(file_path):
            return jsonify({"error": f"File not found: {file_path}"}), 404

        # Perform predictions using the analysis model
        try:
            predictions = analyze(file_path, budgets)
            return jsonify(predictions), 200
        except Exception as e:
            return jsonify({"error": f"Error in analysis: {str(e)}"}), 500

    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
