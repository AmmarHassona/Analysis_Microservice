from flask import Flask, jsonify
from recommendation import generate_recommendations
from model import fetch_data

app = Flask(__name__)

@app.route('/generate-recommendations', methods=['GET'])
def generate_recommendation_api():
    generate_recommendations()
    return jsonify({"message": "Recommendations generated successfully!"}), 200

@app.route('/get-trends', methods=['GET'])
def get_trends_api():
    trends = fetch_data()
    return jsonify(trends.to_dict(orient='records')), 200

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
