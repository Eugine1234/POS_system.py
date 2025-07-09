from flask import Flask, request, jsonify
from database import init_db, get_db_connection
import sqlite3

app = Flask(__name__)

# Initialize the database when the app starts
init_db()

# --- API Endpoints ---

@app.route('/')
def hello_world():
    
    return 'Pharmacy POS Backend is running!'

@app.route('/products', methods=['POST'])
def add_product():
    data = request.json
    name = data.get('name')
    price = data.get('price')
    stock = data.get('stock')
    expiry_date = data.get('expiry_date') # Optional
    batch_number = data.get('batch_number') # Optional

    if not all([name, price, stock is not None]): # Check for essential fields
        return jsonify({'error': 'Missing required product data (name, price, stock)'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO products (name, price, stock, expiry_date, batch_number) VALUES (?, ?, ?, ?, ?)",
            (name, price, stock, expiry_date, batch_number)
        )
        conn.commit()
        product_id = cursor.lastrowid
        conn.close()
        return jsonify({'message': 'Product added successfully', 'product_id': product_id}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': f'Product with name "{name}" already exists.'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    products = conn.execute('SELECT * FROM products').fetchall()
    conn.close()
    return jsonify([dict(row) for row in products])

@app.route('/sales', methods=['POST'])
def make_sale():
    data = request.json
    product_id = data.get('product_id')
    quantity = data.get('quantity')

    if not all([product_id, quantity]):
        return jsonify({'error': 'Missing product_id or quantity'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 1. Get product details and check stock
        cursor.execute("SELECT name, price, stock FROM products WHERE id = ?", (product_id,))
        product = cursor.fetchone()

        if not product:
            conn.close()
            return jsonify({'error': 'Product not found'}), 404

        current_stock = product['stock']
        product_name = product['name']
        product_price = product['price']

        if current_stock < quantity:
            conn.close()
            return jsonify({'error': f'Insufficient stock for {product_name}. Available: {current_stock}'}), 400

        # 2. Calculate total price
        total_price = product_price * quantity

        # 3. Update stock
        new_stock = current_stock - quantity
        cursor.execute("UPDATE products SET stock = ? WHERE id = ?", (new_stock, product_id))

        # 4. Record sale
        cursor.execute(
            "INSERT INTO sales (product_id, quantity, total_price) VALUES (?, ?, ?)",
            (product_id, quantity, total_price)
        )
        conn.commit()
        sale_id = cursor.lastrowid
        conn.close()

        return jsonify({
            'message': 'Sale recorded successfully',
            'sale_id': sale_id,
            'product_name': product_name,
            'quantity': quantity,
            'total_price': total_price,
            'remaining_stock': new_stock
        }), 201

    except Exception as e:
        conn.rollback() # Rollback changes if an error occurs
        conn.close()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Use 0.0.0.0 to make it accessible from other devices on the network
    # For development, you might use 127.0.0.1 (localhost)
    app.run(debug=True, host='0.0.0.0', port=5000)