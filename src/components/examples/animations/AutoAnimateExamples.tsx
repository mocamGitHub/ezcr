'use client';

import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useState } from 'react';

/**
 * AUTOANIMATE EXAMPLES FOR EZ CYCLE RAMP
 *
 * AutoAnimate automatically animates DOM changes (add, remove, move)
 * with ZERO configuration. Perfect for lists, grids, and dynamic content.
 *
 * Installation: pnpm add @formkit/auto-animate
 *
 * Pros:
 * - Zero configuration
 * - Tiny bundle size (~3KB)
 * - Works with any list/grid
 * - Automatic animations
 *
 * Perfect for:
 * - Product filtering
 * - Shopping cart
 * - Search results
 * - CRM tables
 * - Any dynamic lists
 */

// ============================================================================
// 1. PRODUCT FILTERING WITH AUTO-ANIMATION
// ============================================================================

interface Product {
  id: string;
  name: string;
  price: number;
  category: 'standard' | 'premium' | 'custom';
  image: string;
}

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Standard Aluminum Ramp',
    price: 299.99,
    category: 'standard',
    image: '/placeholder.jpg',
  },
  {
    id: '2',
    name: 'Premium Carbon Fiber Ramp',
    price: 599.99,
    category: 'premium',
    image: '/placeholder.jpg',
  },
  {
    id: '3',
    name: 'Custom Extended Ramp',
    price: 899.99,
    category: 'custom',
    image: '/placeholder.jpg',
  },
  {
    id: '4',
    name: 'Standard Folding Ramp',
    price: 349.99,
    category: 'standard',
    image: '/placeholder.jpg',
  },
  {
    id: '5',
    name: 'Premium Telescoping Ramp',
    price: 649.99,
    category: 'premium',
    image: '/placeholder.jpg',
  },
];

export function AnimatedProductFilter() {
  const [parent] = useAutoAnimate(); // 👈 That's it! One line.
  const [filter, setFilter] = useState<'all' | 'standard' | 'premium' | 'custom'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price'>('name');

  const filteredProducts = SAMPLE_PRODUCTS.filter(
    (p) => filter === 'all' || p.category === filter
  ).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return a.price - b.price;
  });

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded px-4 py-2 ${
            filter === 'all' ? 'bg-primary text-white' : 'bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('standard')}
          className={`rounded px-4 py-2 ${
            filter === 'standard' ? 'bg-primary text-white' : 'bg-gray-200'
          }`}
        >
          Standard
        </button>
        <button
          onClick={() => setFilter('premium')}
          className={`rounded px-4 py-2 ${
            filter === 'premium' ? 'bg-primary text-white' : 'bg-gray-200'
          }`}
        >
          Premium
        </button>
        <button
          onClick={() => setFilter('custom')}
          className={`rounded px-4 py-2 ${
            filter === 'custom' ? 'bg-primary text-white' : 'bg-gray-200'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setSortBy('name')}
          className={`rounded px-4 py-2 text-sm ${
            sortBy === 'name' ? 'bg-secondary text-white' : 'bg-gray-100'
          }`}
        >
          Sort by Name
        </button>
        <button
          onClick={() => setSortBy('price')}
          className={`rounded px-4 py-2 text-sm ${
            sortBy === 'price' ? 'bg-secondary text-white' : 'bg-gray-100'
          }`}
        >
          Sort by Price
        </button>
      </div>

      {/* Product Grid - AutoAnimated! */}
      <div
        ref={parent} // 👈 Add ref to parent container
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {filteredProducts.map((product) => (
          <div
            key={product.id} // 👈 Key is required for AutoAnimate
            className="rounded-lg border bg-white p-4 shadow-sm"
          >
            <div className="mb-2 h-32 rounded bg-gray-200" />
            <h3 className="font-semibold">{product.name}</h3>
            <p className="mt-1 text-lg font-bold text-primary">
              ${product.price.toFixed(2)}
            </p>
            <span className="mt-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800">
              {product.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 2. SHOPPING CART WITH AUTO-ANIMATION
// ============================================================================

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export function AnimatedShoppingCart() {
  const [parent] = useAutoAnimate();
  const [items, setItems] = useState<CartItem[]>([
    { id: '1', name: 'Standard Ramp', quantity: 1, price: 299.99 },
    { id: '2', name: 'Premium Ramp', quantity: 1, price: 599.99 },
  ]);

  const addItem = () => {
    const newItem: CartItem = {
      id: Date.now().toString(),
      name: `Ramp ${items.length + 1}`,
      quantity: 1,
      price: Math.random() * 500 + 200,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="rounded-lg border bg-white p-6 shadow-lg">
      <h2 className="mb-4 text-2xl font-bold">Shopping Cart</h2>

      {/* Cart Items - AutoAnimated! */}
      <div ref={parent} className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-500">
            Your cart is empty
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border bg-gray-50 p-4"
            >
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-600">
                  ${item.price.toFixed(2)} each
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="rounded-full bg-gray-200 px-3 py-1 hover:bg-gray-300"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="rounded-full bg-gray-200 px-3 py-1 hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>

                <p className="w-24 text-right font-bold text-primary">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>

                <button
                  onClick={() => removeItem(item.id)}
                  className="rounded-full bg-red-100 p-2 text-red-600 hover:bg-red-200"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary */}
      <div className="mt-6 border-t pt-4">
        <div className="flex items-center justify-between text-xl font-bold">
          <span>Total:</span>
          <span className="text-primary">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={addItem}
          className="flex-1 rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-primary/90"
        >
          Add Item
        </button>
        <button
          onClick={() => setItems([])}
          className="rounded-lg border px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
        >
          Clear Cart
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 3. SEARCH RESULTS WITH AUTO-ANIMATION
// ============================================================================

const SAMPLE_DOCS = [
  'How to install your EZ Cycle Ramp',
  'Maintenance tips for aluminum ramps',
  'Weight capacity specifications',
  'Warranty information',
  'Custom ramp configuration guide',
  'Shipping and delivery details',
  'Returns and refund policy',
  'Safety guidelines for ramp usage',
];

export function AnimatedSearchResults() {
  const [parent] = useAutoAnimate();
  const [searchQuery, setSearchQuery] = useState('');

  const results = SAMPLE_DOCS.filter((doc) =>
    doc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search documentation..."
        className="w-full rounded-lg border px-4 py-3 text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />

      <div ref={parent} className="space-y-2">
        {results.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-500">
            No results found for "{searchQuery}"
          </div>
        ) : (
          results.map((doc) => (
            <div
              key={doc}
              className="cursor-pointer rounded-lg border bg-white p-4 hover:border-primary hover:bg-blue-50"
            >
              <p className="font-medium">{doc}</p>
            </div>
          ))
        )}
      </div>

      <p className="text-sm text-gray-600">
        {results.length} result{results.length !== 1 ? 's' : ''} found
      </p>
    </div>
  );
}

// ============================================================================
// 4. CRM CUSTOMER TABLE WITH AUTO-ANIMATION
// ============================================================================

interface Customer {
  id: string;
  name: string;
  email: string;
  orders: number;
  status: 'active' | 'inactive';
}

const SAMPLE_CUSTOMERS: Customer[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', orders: 5, status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', orders: 3, status: 'active' },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com', orders: 1, status: 'inactive' },
  { id: '4', name: 'Alice Johnson', email: 'alice@example.com', orders: 8, status: 'active' },
];

export function AnimatedCRMTable() {
  const [parent] = useAutoAnimate();
  const [customers, setCustomers] = useState(SAMPLE_CUSTOMERS);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredCustomers = customers.filter(
    (c) => filterStatus === 'all' || c.status === filterStatus
  );

  const removeCustomer = (id: string) => {
    setCustomers(customers.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Customer Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`rounded px-3 py-1 text-sm ${
              filterStatus === 'all' ? 'bg-primary text-white' : 'bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`rounded px-3 py-1 text-sm ${
              filterStatus === 'active' ? 'bg-primary text-white' : 'bg-gray-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`rounded px-3 py-1 text-sm ${
              filterStatus === 'inactive' ? 'bg-primary text-white' : 'bg-gray-200'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Orders</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody ref={parent}>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="border-t">
                <td className="px-6 py-4 font-medium">{customer.name}</td>
                <td className="px-6 py-4 text-gray-600">{customer.email}</td>
                <td className="px-6 py-4">{customer.orders}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs ${
                      customer.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {customer.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => removeCustomer(customer.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// DEMO PAGE
// ============================================================================

export function AutoAnimateDemo() {
  return (
    <div className="space-y-12 p-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">AutoAnimate Examples</h1>
        <p className="text-gray-600">
          Zero-config animations for lists, grids, and dynamic content
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-2xl font-bold">1. Product Filtering</h2>
        <AnimatedProductFilter />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">2. Shopping Cart</h2>
        <AnimatedShoppingCart />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">3. Search Results</h2>
        <AnimatedSearchResults />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">4. CRM Customer Table</h2>
        <AnimatedCRMTable />
      </section>
    </div>
  );
}
