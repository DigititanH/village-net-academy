import { useEffect, useState } from "react";
import { CheckCircle, GraduationCap, Heart } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import api from "../lib/api";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const pfPaymentId = searchParams.get("m_payment_id");
  const parsedPf = pfPaymentId?.match(/^(order|donation|ccna)-(\d+)$/);
  const type = searchParams.get("type") || parsedPf?.[1] || "order";
  const id = searchParams.get("id") || parsedPf?.[2] || null;
  const { clearCart } = useCart();
  const [status, setStatus] = useState("pending");
  const [donationAcademy, setDonationAcademy] = useState("");
  const [ccnaCourse, setCcnaCourse] = useState("");

  useEffect(() => {
    if (type === "order") {
      clearCart().catch(() => {});
    }

    if (!id) {
      setStatus("done");
      return;
    }

    const check = async () => {
      try {
        if (type === "donation") {
          const stored = sessionStorage.getItem(`donation-${id}-academy`);
          if (stored) {
            setDonationAcademy(stored);
            sessionStorage.removeItem(`donation-${id}-academy`);
          } else {
            try {
              const res = await api.get(`/donations/${id}/summary`);
              if (res.data.academy) setDonationAcademy(res.data.academy);
            } catch { /* optional */ }
          }
          setStatus("done");
          return;
        }
        if (type === "ccna") {
          const res = await api.get(`/ccna/enrolments/${id}/summary`);
          if (res.data.course_title) setCcnaCourse(res.data.course_title);
          if (res.data.payment_status === "active") setStatus("paid");
          else setStatus("pending");
          return;
        }
        const res = await api.get(`/orders/${id}`);
        if (res.data.payment_status === "paid") setStatus("paid");
        else setStatus("pending");
      } catch {
        setStatus("pending");
      }
    };

    check();
    const interval = setInterval(check, 3000);
    const timeout = setTimeout(() => clearInterval(interval), 30000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [type, id, clearCart]);

  const isDonation = type === "donation";
  const isCcna = type === "ccna";
  const Icon = isDonation ? Heart : isCcna ? GraduationCap : CheckCircle;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <Icon size={72} className="text-burnt-600 mx-auto mb-6" />
        <h1 className="text-3xl font-black mb-3 bg-gradient-to-r from-burnt-400 to-primary-400 bg-clip-text text-transparent">
          {isDonation ? "Thank You!" : isCcna ? "CCNA Subscription Submitted" : "Payment Successful!"}
        </h1>
        <p className="text-gray-400 mb-4">
          {isDonation
            ? "Your donation payment was submitted via PayFast. You will receive confirmation once processing completes."
            : isCcna
              ? status === "paid"
                ? `Enrolment #${id} is active. Our team will email onboarding details shortly.`
                : `Payment received. Enrolment #${id} is being confirmed by PayFast — this usually takes a few seconds.`
              : status === "paid"
                ? `Order #${id} is confirmed and paid. We will process your shipment soon.`
                : `Payment received. Order #${id} is being confirmed — this usually takes a few seconds.`}
        </p>
        {isDonation && donationAcademy && (
          <p className="text-sm text-burnt-600/80 mb-8 px-4 py-3 rounded-xl bg-burnt-800/20 border border-burnt-700/30 max-w-sm mx-auto">
            Donating to: <strong className="text-burnt-600">{donationAcademy}</strong>
          </p>
        )}
        {isCcna && ccnaCourse && (
          <p className="text-sm text-burnt-600/80 mb-8 px-4 py-3 rounded-xl bg-burnt-800/20 border border-burnt-700/30 max-w-sm mx-auto">
            Course: <strong className="text-burnt-600">{ccnaCourse}</strong>
          </p>
        )}
        {!(isDonation && donationAcademy) && !(isCcna && ccnaCourse) && <div className="mb-8" />}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isDonation ? (
            <Link to="/" className="btn-primary">Back to Home</Link>
          ) : isCcna ? (
            <>
              <Link to="/courses" className="btn-primary">Back to Courses</Link>
              <Link to="/contact" className="btn-secondary">Contact Support</Link>
            </>
          ) : (
            <>
              <Link to="/my-orders" className="btn-primary">View My Orders</Link>
              <Link to="/shop" className="btn-secondary">Continue Shopping</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
