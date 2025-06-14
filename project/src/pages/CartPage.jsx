import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext'

function CartPage() {
  const { cart, total, itemCount, updateQuantity, removeFromCart, clearCart } = useCart()
  const [checkoutStep, setCheckoutStep] = useState(0) // 0: cart, 1: shipping, 2: payment, 3: review, 4: confirmation

  const handleCheckout = () => {
    // Here we would normally process payment, but for this demo we'll just simulate a successful checkout
    setCheckoutStep(4)
    // Clear cart after successful checkout
    setTimeout(() => {
      clearCart()
    }, 1000)
  }

  if (itemCount === 0 && checkoutStep !== 4) {
    return (
      <div className="min-h-screen pt-24 pb-16 container-custom">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-xl shadow-md p-8">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Your cart is empty</h1>
            <p className="mt-2 text-gray-600">Looks like you haven't added any items to your cart yet.</p>
            <div className="mt-6">
              <Link to="/explore/products" className="btn-primary">
                Explore Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const stepContent = () => {
    switch (checkoutStep) {
      case 0: // Cart
        return (
          <div>
            <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Cart Items */}
              <div className="md:col-span-8">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {Object.entries(cart).map(([shopId, shopCart]) => (
                      <li key={shopId} className="p-4">
                        <div className="mb-3">
                          <Link 
                            to={`/shop/${shopId}`}
                            className="text-lg font-semibold text-primary-600 hover:text-primary-700 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            {shopCart.shopName}
                          </Link>
                        </div>
                        <ul className="space-y-4">
                          {shopCart.items.map((item) => (
                            <li key={item.productId} className="flex items-center py-4">
                              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-full w-full object-cover object-center"
                                />
                              </div>

                              <div className="ml-4 flex-1 flex flex-col">
                                <div>
                                  <div className="flex justify-between text-base font-medium text-gray-900">
                                    <h3>
                                      <Link to={`/product/${item.productId}`}>{item.name}</Link>
                                    </h3>
                                    <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                                  </div>
                                  <p className="mt-1 text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                                </div>
                                <div className="flex-1 flex items-end justify-between text-sm">
                                  <div className="flex items-center border border-gray-300 rounded-md">
                                    <button 
                                      onClick={() => updateQuantity(item.productId, shopId, item.quantity - 1)}
                                      className="p-2 text-gray-600 hover:text-gray-700"
                                    >
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                      </svg>
                                    </button>
                                    <input 
                                      type="number" 
                                      min="1" 
                                      value={item.quantity} 
                                      onChange={(e) => updateQuantity(item.productId, shopId, parseInt(e.target.value) || 1)}
                                      className="w-10 text-center border-0 focus:ring-0 p-0 text-gray-900"
                                    />
                                    <button 
                                      onClick={() => updateQuantity(item.productId, shopId, item.quantity + 1)}
                                      className="p-2 text-gray-600 hover:text-gray-700"
                                    >
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                    </button>
                                  </div>

                                  <div className="flex">
                                    <button
                                      type="button"
                                      onClick={() => removeFromCart(item.productId, shopId)}
                                      className="font-medium text-primary-600 hover:text-primary-500"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 pt-2 border-t border-dashed border-gray-200 flex justify-between">
                          <span className="text-sm text-gray-600">Subtotal</span>
                          <span className="font-medium">${shopCart.subtotal.toFixed(2)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Order Summary */}
              <div className="md:col-span-4">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span>$0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span>${(total * 0.1).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${(total + (total * 0.1)).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => setCheckoutStep(1)}
                      className="btn-primary w-full"
                    >
                      Proceed to Checkout
                    </button>
                    <button
                      onClick={() => clearCart()}
                      className="mt-3 btn-outline w-full"
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 1: // Shipping
        return (
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Shipping</h1>
              <button
                onClick={() => setCheckoutStep(0)}
                className="text-primary-600 hover:text-primary-700 flex items-center"
              >
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Cart
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <form className="space-y-4">
                <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" id="name" className="input mt-1" />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Street Address</label>
                    <input type="text" id="address" className="input mt-1" />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                    <input type="text" id="city" className="input mt-1" />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">State / Province</label>
                    <input type="text" id="state" className="input mt-1" />
                  </div>

                  <div>
                    <label htmlFor="zip" className="block text-sm font-medium text-gray-700">ZIP / Postal Code</label>
                    <input type="text" id="zip" className="input mt-1" />
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                    <select id="country" className="input mt-1">
                      <option>United States</option>
                      <option>Canada</option>
                      <option>Mexico</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input type="tel" id="phone" className="input mt-1" />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(2)}
                    className="btn-primary w-full"
                  >
                    Continue to Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )

      case 2: // Payment
        return (
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Payment</h1>
              <button
                onClick={() => setCheckoutStep(1)}
                className="text-primary-600 hover:text-primary-700 flex items-center"
              >
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Shipping
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <form className="space-y-4">
                <div>
                  <label htmlFor="card-name" className="block text-sm font-medium text-gray-700">Name on Card</label>
                  <input type="text" id="card-name" className="input mt-1" />
                </div>

                <div>
                  <label htmlFor="card-number" className="block text-sm font-medium text-gray-700">Card Number</label>
                  <input type="text" id="card-number" className="input mt-1" placeholder="•••• •••• •••• ••••" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="card-expiry" className="block text-sm font-medium text-gray-700">Expiration Date</label>
                    <input type="text" id="card-expiry" className="input mt-1" placeholder="MM / YY" />
                  </div>
                  <div>
                    <label htmlFor="card-cvc" className="block text-sm font-medium text-gray-700">CVC</label>
                    <input type="text" id="card-cvc" className="input mt-1" placeholder="•••" />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(3)}
                    className="btn-primary w-full"
                  >
                    Continue to Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        )

      case 3: // Review
        return (
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Review Order</h1>
              <button
                onClick={() => setCheckoutStep(2)}
                className="text-primary-600 hover:text-primary-700 flex items-center"
              >
                <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Payment
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Items</h2>
                  <ul className="divide-y divide-gray-200">
                    {Object.entries(cart).map(([shopId, shopCart]) => (
                      <li key={shopId} className="py-3">
                        <div className="text-sm font-medium text-gray-900 mb-1">{shopCart.shopName}</div>
                        <ul className="pl-4">
                          {shopCart.items.map(item => (
                            <li key={item.productId} className="flex justify-between text-sm py-1">
                              <span>{item.name} × {item.quantity}</span>
                              <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Shipping</h2>
                  <address className="not-italic text-gray-700">
                    John Doe<br />
                    123 Main St<br />
                    Anytown, CA 12345<br />
                    United States<br />
                    (123) 456-7890
                  </address>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Payment</h2>
                  <div className="flex items-center">
                    <div className="h-8 w-12 bg-gray-200 rounded flex items-center justify-center mr-2">
                      <span className="text-xs font-medium">VISA</span>
                    </div>
                    <span className="text-gray-700">•••• •••• •••• 4242</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Order Summary</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span>$0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span>${(total * 0.1).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${(total + (total * 0.1)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="btn-primary w-full"
                  >
                    Place Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 4: // Confirmation
        return (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="rounded-full bg-success-100 h-20 w-20 flex items-center justify-center mx-auto mb-4">
                <svg className="h-10 w-10 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
              <p className="text-gray-600 mb-6">
                Thank you for your order. We've received your payment and will process your items shortly.
                A confirmation email has been sent to your inbox.
              </p>
              <p className="font-medium mb-6">Order #ORD-2023-1234</p>
              <div className="flex justify-center space-x-4">
                <Link to="/" className="btn-primary">
                  Return Home
                </Link>
                <Link to="/explore/products" className="btn-outline">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Progress indicators for the checkout flow
  const CheckoutProgress = () => {
    if (checkoutStep === 0 || checkoutStep === 4) return null

    const steps = [
      { name: 'Shipping', step: 1 },
      { name: 'Payment', step: 2 },
      { name: 'Review', step: 3 }
    ]

    return (
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => (
            <div key={step.name} className="flex items-center">
              <div 
                className={`flex items-center justify-center h-10 w-10 rounded-full ${
                  checkoutStep >= step.step 
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                } transition-colors`}
              >
                {checkoutStep > step.step ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <div className={`ml-2 text-sm ${checkoutStep === step.step ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                {step.name}
              </div>
              {index < steps.length - 1 && (
                <div className={`ml-2 mr-2 h-0.5 w-10 ${checkoutStep > index + 1 ? 'bg-primary-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="min-h-screen pt-24 pb-16 container-custom"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <CheckoutProgress />
      {stepContent()}
    </motion.div>
  )
}

export default CartPage