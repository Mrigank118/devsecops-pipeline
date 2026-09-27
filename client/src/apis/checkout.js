const url = process.env.REACT_APP_API_URL || "http://localhost:3000";


// Initiate checkout session
export const checkout = async () => {
    try {
        const response = await fetch(`${url}/api/cart/checkout`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const result = await response.json()

        if (response.ok) {
            window.location.href = result.url // Redirect to Stripe Checkout
            return { ok: true }
        } else {
            return { ok: false, message: result.message || 'Checkout failed.' }
        }
    } catch (error) {
        return { ok: false, message: 'Error redirecting to checkout', error }
    }
}

export const fetchCheckoutStatus = async (sessionId) => {
    const response = await fetch(`${url}/api/cart/checkout-status/${encodeURIComponent(sessionId)}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to verify checkout status');
    return result;
}
