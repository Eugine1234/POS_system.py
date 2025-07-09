const API_BASE_URL = 'http://127.0.0.1:5000'; // Or http://localhost:5000

async function addProduct() {
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const expiryDate = document.getElementById('productExpiry').value;
    const batchNumber = document.getElementById('productBatch').value;
    const messageElement = document.getElementById('addProductMessage');

    if (!name || isNaN(price) || isNaN(stock)) {
        messageElement.textContent = 'Please fill in product name, price, and stock.';
        messageElement.className = 'error';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                price: price,
                stock: stock,
                expiry_date: expiryDate,
                batch_number: batchNumber
            }),
        });

        const data = await response.json();
        if (response.ok) {
            messageElement.textContent = data.message;
            messageElement.className = 'success';
            // Clear inputs
            document.getElementById('productName').value = '';
            document.getElementById('productPrice').value = '';
            document.getElementById('productStock').value = '';
            document.getElementById('productExpiry').value = '';
            document.getElementById('productBatch').value = '';
            fetchProducts(); // Refresh product list
        } else {
            messageElement.textContent = `Error: ${data.error || 'Something went wrong'}`;
            messageElement.className = 'error';
        }
    } catch (error) {
        console.error('Error adding product:', error);
        messageElement.textContent = 'Failed to connect to the server.';
        messageElement.className = 'error';
    }
}

async function fetchProducts() {
    const productListElement = document.getElementById('productList');
    productListElement.innerHTML = '<li>Loading products...</li>';
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        const products = await response.json();

        productListElement.innerHTML = ''; // Clear existing list
        if (products.length === 0) {
            productListElement.innerHTML = '<li>No products added yet.</li>';
        } else {
            products.forEach(product => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>${product.name}</strong> (ID: ${product.id}) - Price: $${product.price.toFixed(2)} - Stock: ${product.stock}
                    ${product.expiry_date ? `(Expires: ${product.expiry_date})` : ''}
                    ${product.batch_number ? `(Batch: ${product.batch_number})` : ''}
                `;
                productListElement.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        productListElement.innerHTML = '<li class="error">Failed to load products.</li>';
    }
}

async function makeSale() {
    const productId = parseInt(document.getElementById('saleProductId').value);
    const quantity = parseInt(document.getElementById('saleQuantity').value);
    const messageElement = document.getElementById('saleMessage');

    if (isNaN(productId) || isNaN(quantity) || quantity <= 0) {
        messageElement.textContent = 'Please enter valid Product ID and Quantity.';
        messageElement.className = 'error';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/sales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity
            }),
        });

        const data = await response.json();
        if (response.ok) {
            messageElement.textContent = data.message + ` (Total: $${data.total_price.toFixed(2)}, Remaining Stock: ${data.remaining_stock})`;
            messageElement.className = 'success';
            document.getElementById('saleProductId').value = '';
            document.getElementById('saleQuantity').value = '';
            fetchProducts(); // Refresh product list to show updated stock
        } else {
            messageElement.textContent = `Error: ${data.error || 'Something went wrong'}`;
            messageElement.className = 'error';
        }
    } catch (error) {
        console.error('Error making sale:', error);
        messageElement.textContent = 'Failed to connect to the server.';
        messageElement.className = 'error';
    }
}

// Initial fetch when page loads
document.addEventListener('DOMContentLoaded', fetchProducts);