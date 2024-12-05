from flask import Flask, jsonify, request
from flask_cors import CORS
from analysis_model import get_predictions

app = Flask(__name__)
CORS(app)

@app.route('/get-comparison', methods=['POST'])
def get_comparison_route():
    budgets = request.json.get('budgets', {})
    print('Received Budgets in Flask:', budgets)  # Log the budgets data here

    if not budgets:
        return jsonify({"error": "No budgets provided"}), 400

    predictions = get_predictions(budgets)
    return jsonify(predictions.to_dict(orient='records'))

if __name__ == '__main__':
    app.run(debug = True , host = '0.0.0.0' , port = 5000)