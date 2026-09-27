import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchCheckoutStatus } from "../apis/checkout";

function OrderPlacer() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const [paymentStatus, setPaymentStatus] = useState("checking");

    useEffect(() => {
        let cancelled = false;
        let timer;
        let attempts = 0;
        const check = async () => {
            if (!sessionId) {
                setPaymentStatus("unverified");
                return;
            }
            try {
                const result = await fetchCheckoutStatus(sessionId);
                if (cancelled) return;
                if (result.status === "completed") setPaymentStatus("completed");
                else if (result.status === "failed") setPaymentStatus("failed");
                else if (++attempts < 15) timer = setTimeout(check, 2000);
                else setPaymentStatus("pending");
            } catch {
                if (!cancelled) setPaymentStatus("unverified");
            }
        };
        check();
        return () => { cancelled = true; clearTimeout(timer); };
    }, [sessionId]);

    const message = {
        checking: "Confirming your payment and order…",
        completed: "Your payment is confirmed and your order was placed successfully.",
        failed: "We could not complete the order. If you were charged, contact support with your payment receipt.",
        pending: "Payment was submitted and is still processing. Check your account orders shortly.",
        unverified: "We could not verify this checkout. Sign in and check your account orders before trying again.",
    }[paymentStatus];

    return (
        <div className="container mx-auto my-12 px-6 md:px-12">
            <div className="max-w-md mx-auto bg-neutral-400/20 border border-neutral-400/60 p-8 space-y-6">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-semibold text-neutral-800">
                        {paymentStatus === "completed" ? "Thank You for Your Purchase!" : "Checkout status"}
                    </h2>
                    <p className="text-lg text-neutral-600">{message}</p>
                </div>
                <div className="text-center md:space-y-8">
                    <p className="text-neutral-700">
                        {`If you're a registered member, you can `}
                        <Link 
                            to="/account" 
                            className="text-mainTeal font-medium hover:text-mainOrange"
                        >
                            track your order
                        </Link>
                        {` in your account.`}
                    </p>
                    <Link 
                        to="/products" 
                        className="text-sm font-medium inline-block bg-mainTeal text-white py-2 px-6 rounded-lg hover:bg-mainOrange transition ease-in-out duration-150"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default OrderPlacer;
