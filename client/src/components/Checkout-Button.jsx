import { toast } from "sonner"
import { checkout } from "../apis/checkout"
import { useAuth } from "../hooks/authContext"
import { clearCartInLocalStorage } from "../utils/cartStorage"

export const Checkout = ({ checkoutItems }) => {
    const { isAuthenticated } = useAuth()

    const handleCheckout = async (e) => {
        e.preventDefault()

        if (!isAuthenticated) {
            toast.error('Please log in before checking out.')
            return
        }
        const checkoutRes = await checkout()

        if (!checkoutRes.ok) {
            toast.error(checkoutRes.message || 'Something went wrong during checkout!')
            return
        }
        clearCartInLocalStorage()
    };

    return (
        <button
            onClick={handleCheckout}
            className="text-sm mt-2 bg-mainOrange hover:bg-mainTeal/70 text-white rounded-2xl py-2 px-6 hover:shadow-custom-teal transition-all delay-120"
        >
            Checkout
        </button>
    )
}
