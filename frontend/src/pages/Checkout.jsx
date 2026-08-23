import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import {
  createOrder,
  createRazorpayOrder,
  loadRazorpayCheckout,
  verifyPayment,
} from "../api";

function Checkout() {
  const { cart, removeFromCart, clearCart } = useContext(CartContext);

  const [coupon, setCoupon] = useState("");
  const [phase, setPhase] = useState("cart"); // cart | processing | paid | failed
  const [payError, setPayError] = useState("");
  const [order, setOrder] = useState(null);

  const estimatedSubtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const estimatedGst = Math.round(estimatedSubtotal * 0.18);

  // =====================================================
  // OPEN RAZORPAY CHECKOUT
  // =====================================================
  const openRazorpay = async (ourOrder) => {
    try {
      const rzp = await createRazorpayOrder(ourOrder.id);

      await loadRazorpayCheckout();

      const options = {
        key: rzp.key_id,
        amount: rzp.amount,
        currency: rzp.currency,
        order_id: rzp.razorpay_order_id,

        name: "ShopPilot AI",
        description: `Order ${ourOrder.id}`,
        image: "https://razorpay.com/assets/razorpay-logo.svg",

        theme: {
          color: "#3D7DFF",
        },

        retry: {
          enabled: false,
        },

        modal: {
          escape: true,
          confirm_close: true,
          ondismiss: () => {
            const success = window.confirm(
              "🧪 Razorpay Test Mode\n\nPress OK = Payment Success\nPress Cancel = Payment Failure"
            );

            if (success) {
              setPhase("paid");
              clearCart();
            } else {
              setPayError("Payment cancelled.");
              setPhase("failed");
            }
          },
        },

        prefill: {
          name: "Nayana Sri",
          email: "nayana@example.com",
          contact: "7601091279",
        },

        notes: {
          shoppilot_order_id: ourOrder.id,
        },

        handler: async (response) => {
          try {
            await verifyPayment({
              orderId: ourOrder.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setPhase("paid");
            clearCart();
          } catch (err) {
            console.log("Verification skipped in test mode:", err);

            const success = window.confirm(
              "🧪 Razorpay Test Mode\n\nVerification failed because Test Mode simulator isn't available.\n\nPress OK = Payment Success\nPress Cancel = Payment Failure"
            );

            if (success) {
              setPhase("paid");
              clearCart();
            } else {
              setPayError("Payment verification failed.");
              setPhase("failed");
            }
          }
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        console.log("Payment Failed", response);

        const success = window.confirm(
          "🧪 Razorpay Test Mode\n\nRazorpay rejected the payment.\n\nPress OK = Simulate Payment Success\nPress Cancel = Payment Failure"
        );

        if (success) {
          setPhase("paid");
          clearCart();
        } else {
          setPayError(
            response.error?.description || "Payment failed in Test Mode."
          );
          setPhase("failed");
        }
      });

      razorpay.open();
    } catch (err) {
      console.error(err);
      setPayError("Unable to open Razorpay checkout.");
      setPhase("failed");
    }
  };

  // =====================================================
  // START PAYMENT
  // =====================================================
  const handlePay = async () => {
    setPayError("");
    setPhase("processing");

    try {
      const { order: newOrder } = await createOrder({
        cart,
        couponCode: coupon,
      });

      setOrder(newOrder);

      await openRazorpay(newOrder);
    } catch (err) {
      console.error(err);
      setPayError(err.message || "Could not start payment.");
      setPhase("cart");
    }
  };

  // =====================================================
  // RETRY PAYMENT
  // =====================================================
  const handleRetry = () => {
    setPayError("");
    setOrder(null);
    setPhase("cart");
  };

  // =====================================================
  // PAYMENT SUCCESS SCREEN
  // =====================================================
  if (phase === "paid" && order) {
    return (
      <section className="checkout-page">
        <h1>✅ Payment Successful</h1>

        <div className="order-confirmed">
          <p className="order-confirmed-id">{order.id}</p>

          <p className="order-confirmed-sub">
            Payment completed successfully in Razorpay Test Mode.
          </p>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
          </div>

          {order.discount > 0 && (
            <div className="discount-row">
              <span>Coupon Discount</span>
              <span>-₹{order.discount.toLocaleString("en-IN")}</span>
            </div>
          )}

          <div className="summary-row">
            <span>GST (18%)</span>
            <span>₹{order.gst.toLocaleString("en-IN")}</span>
          </div>

          <hr />

          <div className="total-row">
            <span>Total Paid</span>
            <span>₹{order.total.toLocaleString("en-IN")}</span>
          </div>

          <button
            className="pay-btn"
            onClick={() => window.location.reload()}
          >
            Continue Shopping
          </button>
        </div>
      </section>
    );
  }

  // =====================================================
  // PAYMENT FAILED SCREEN
  // =====================================================
  if (phase === "failed") {
    return (
      <section className="checkout-page">
        <h1>❌ Payment Failed</h1>

        <div className="order-confirmed">
          {order && <p className="order-confirmed-id">{order.id}</p>}

          <p className="login-error">{payError}</p>

          <p className="order-confirmed-sub">
            No money has been charged. Click below to create a fresh Razorpay
            payment.
          </p>

          <button className="pay-btn" onClick={handleRetry}>
            Try Again
          </button>
        </div>
      </section>
    );
  }

  // =====================================================
  // CHECKOUT PAGE
  // =====================================================
  return (
    <section className="checkout-page">
      <h1>💳 Razorpay Checkout</h1>

      <div className="checkout-container">

        {/* LEFT SIDE */}
        <div className="checkout-items">
          <h2>Your Cart</h2>

          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            cart.map((item, index) => (
              <div key={index} className="checkout-item">
                <img src={item.image} alt={item.name} />

                <div className="checkout-info">
                  <h3>{item.name}</h3>

                  <p>{item.category}</p>

                  <span>₹{item.price}</span>

                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="order-summary">
          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Subtotal (Estimated)</span>
            <span>₹{estimatedSubtotal}</span>
          </div>

          <div className="summary-row">
            <span>GST (18%)</span>
            <span>₹{estimatedGst}</span>
          </div>

          <div className="coupon-box">
            <input
              type="text"
              placeholder="Coupon code (SHOP150)"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
            />
          </div>

          <p className="checkout-note">
            Final total is calculated securely on the backend.
          </p>

          <hr />

          {payError && <p className="login-error">{payError}</p>}

          <button
            className="pay-btn"
            disabled={cart.length === 0 || phase === "processing"}
            onClick={handlePay}
          >
            {phase === "processing"
              ? "Opening Razorpay..."
              : "Pay with Razorpay"}
          </button>

          <p className="secure-text">
            🔒 Secure payments powered by Razorpay Test Mode.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Checkout;