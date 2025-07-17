function addToCart() {
  const product = {
    name: productData.name,
    price: productData.price,
    image: productData.image,
    qty: 1,
    id: productData.id
  };

  let cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
  // Prevent duplicate
  const exists = cartItems.some(item => item.id === product.id);
  if (exists) {
    alert("Item already in cart!");
  } else {
    cartItems.push(product);
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    alert("Added to Cart!");
  }
}

function addToFavourites() {
  const product = {
    name: productData.name,
    price: productData.price,
    image: productData.image,
    id: productData.id
  };

  let favItems = JSON.parse(localStorage.getItem("favItems")) || [];
  favItems.push(product);
  localStorage.setItem("favItems", JSON.stringify(favItems));
  alert("Added to Favourites!");
}



let cart = JSON.parse(localStorage.getItem("cartItems")) || [];

function renderCart() {
  const cartContainer = document.getElementById("cart-items");
  if (!cartContainer) return;
  if (cart.length === 0) {
    cartContainer.innerHTML = '<p class="empty-msg">Your cart is empty.</p>';
    document.getElementById("subtotal").innerText = "Subtotal: ₹0"; 
    document.getElementById("tax").innerText = "Tax (10%): ₹0";
    document.getElementById("total").innerText = "Total: ₹0";
    document.getElementById("shipping").innerText = "";
    const checkoutBtn = document.getElementById("checkout");
    const clearCartBtn = document.getElementById("clear-cart");
    if (checkoutBtn) checkoutBtn.style.display = "none";
    if (clearCartBtn) clearCartBtn.style.display = "none";
    return;
  }
  cartContainer.innerHTML = "";
  let subtotal = 0;

  cart.forEach((item, index) => {
    if (!item.qty) item.qty = 1; // fallback if missing qty
    subtotal += item.price * item.qty;
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="item-details">
        <h3>${item.name}</h3>
        <p>Price: ₹${item.price}</p>
        <div class="quantity-controls">
          <button onclick="changeQty(${index}, -1)">-</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${index}, 1)">+</button>
          <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
        </div>
      </div>
    `;
    cartContainer.appendChild(div);
  });

  document.getElementById("subtotal").innerText = `Subtotal: ₹${subtotal}`;
  let tax = Math.round(subtotal * 0.1);
  document.getElementById("tax").innerText = `Tax (10%): ₹${tax}`;
  let total = subtotal + tax + 49;
  document.getElementById("total").innerText = `Total: ₹${total}`;
}

function changeQty(index, delta) {
  if (cart[index].qty + delta >= 1) {
    cart[index].qty += delta;
    localStorage.setItem("cartItems", JSON.stringify(cart));
    renderCart();
  }
}

function removeItem(index) {
  cart.splice(index, 1);
  localStorage.setItem("cartItems", JSON.stringify(cart));
  renderCart();
}

function clearCart() {
  localStorage.removeItem("cartItems");
  cart = [];
  renderCart();
}

renderCart();

document.addEventListener("DOMContentLoaded", function() {
  // Favourites rendering logic
  const favItems = JSON.parse(localStorage.getItem("favItems")) || [];
  const container = document.getElementById("favouritesList");

  if (container) {
    if (favItems.length === 0) {
      container.innerHTML = '<p class="empty-msg">No favourites added yet.</p>';
    } else {
      favItems.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "fav-item";
        div.innerHTML = `
          <img src="${item.image || 'https://via.placeholder.com/250x200'}" alt="${item.name}">
          <h3>${item.name}</h3>
          <p>₹${item.price}</p>
          <button class="add-cart" onclick="addToCartFromFav(${index})">Add to Cart</button>
          <button class="remove-fav" onclick="removeFromFavourites(${index})">Remove</button>
        `;
        container.appendChild(div);
      });
    }
  }

  // Use unique function names to avoid conflicts
  window.addToCartFromFav = function(index) {
    const product = favItems[index];
    const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
    // Check if product already exists in cart
    const exists = cartItems.some(item => item.id === product.id);
    if (exists) {
      alert("Item already in cart!");
    } else {
      cartItems.push({ ...product, qty: 1 });
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
      // Remove from favourites
      favItems.splice(index, 1);
      localStorage.setItem("favItems", JSON.stringify(favItems));
      alert("Added to cart!");
      location.reload(); // Refresh to update the favourites list
    }
  };

  window.removeFromFavourites = function(index) {
    favItems.splice(index, 1);
    localStorage.setItem("favItems", JSON.stringify(favItems));
    location.reload();
  };
});
