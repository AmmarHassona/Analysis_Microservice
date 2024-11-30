from flask import Flask, jsonify
from recommendation import generate_recommendations
from model import fetch_data
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/generate-recommendations', methods=['GET'])
def generate_recommendation_api():
    recommendations = generate_recommendations()
    if recommendations:
        return jsonify({
            "status": "success",  # Add the status field
            "message": "Recommendations generated successfully!",
            "recommendations": recommendations
        }), 200
    else:
        return jsonify({
            "status": "error",  # Add the status field
            "message": "No recommendations generated.",
            "recommendations": []
        }), 200

@app.route('/get-trends', methods=['GET'])
def get_trends_api():
    trends = fetch_data()
    return jsonify({
        "status": "success",  # Add the status field
        "trends": trends.to_dict(orient='records')
    }), 200

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)