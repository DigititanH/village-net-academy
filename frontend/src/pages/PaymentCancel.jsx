import { XCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "order";
  const id = searchParams.get("id");
  const isDonation = type === "donation";

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <XCircle size={72} className="text-red-400 mx-auto mb-6" />
        <h1 className="text-3xl font-black mb-3">
          {isDonation ? "Donation Not Completed" : "Payment Cancelled"}
        </h1>
        <p className="text-gray-400 mb-2">
          {isDonation
            ? "You left PayFast before completing your donation. No payment was taken."
            : "You left PayFast before completing payment. Your order is still pending and your cart items are saved."}
        </p>
        {id && (
          <p className="text-sm text-gray-500 mb-8">
            Reference: {isDonation ? "Donation" : "Order"} #{id}
          </p>
        )}
        {!id && <div className="mb-8" />}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isDonation ? (
            <>
              <Link to="/donation" className="btn-primary">Try Again</Link>
              <Link to="/" className="btn-secondary">Back to Home</Link>
            </>
          ) : (
            <>
              <Link to="/checkout" className="btn-primary">Back to Checkout</Link>
              <Link to="/cart" className="btn-secondary">View Cart</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
