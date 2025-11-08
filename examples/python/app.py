import os
from flask import Flask, jsonify, request
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

API_TOKEN = os.getenv('REVERT_API_TOKEN')
TENANT_ID = os.getenv('REVERT_TENANT_ID')
BASE_URL = os.getenv('REVERT_API_BASE_URL', 'http://localhost:4001')

headers = {
    'x-revert-api-token': API_TOKEN,
    'x-revert-t-id': TENANT_ID,
}


def make_request(method, endpoint, **kwargs):
    """Helper function to make API requests"""
    url = f"{BASE_URL}{endpoint}"
    try:
        response = requests.request(method, url, headers=headers, **kwargs)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {'status': 'error', 'message': str(e)}, response.status_code if response else 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    page_size = request.args.get('pageSize', 10)
    data = make_request('GET', '/crm/contacts', params={'pageSize': page_size})
    return jsonify(data) if isinstance(data, dict) else data[0], data[1] if isinstance(data, tuple) else 200


@app.route('/api/contacts/<contact_id>', methods=['GET'])
def get_contact(contact_id):
    data = make_request('GET', f'/crm/contacts/{contact_id}')
    return jsonify(data) if isinstance(data, dict) else data[0], data[1] if isinstance(data, tuple) else 200


@app.route('/api/contacts', methods=['POST'])
def create_contact():
    body = request.get_json()
    payload = {
        'firstName': body.get('firstName'),
        'lastName': body.get('lastName'),
        'email': body.get('email'),
        'phone': body.get('phone'),
        'additional': body.get('additional', {}),
    }
    data = make_request('POST', '/crm/contacts', json=payload)
    return jsonify(data) if isinstance(data, dict) else data[0], 201 if isinstance(data, dict) and data.get('status') == 'ok' else (data[1] if isinstance(data, tuple) else 400)


@app.route('/api/companies', methods=['GET'])
def get_companies():
    page_size = request.args.get('pageSize', 10)
    data = make_request('GET', '/crm/companies', params={'pageSize': page_size})
    return jsonify(data) if isinstance(data, dict) else data[0], data[1] if isinstance(data, tuple) else 200


@app.route('/api/connection', methods=['GET'])
def get_connection():
    data = make_request('GET', '/connection')
    return jsonify(data) if isinstance(data, dict) else data[0], data[1] if isinstance(data, tuple) else 200


@app.route('/api/field-mappings', methods=['GET'])
def get_field_mappings():
    data = make_request('GET', '/field-mapping/mappings')
    return jsonify(data) if isinstance(data, dict) else data[0], data[1] if isinstance(data, tuple) else 200


if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    app.run(debug=True, port=port)
