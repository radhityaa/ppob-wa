export default function formatReceipt(receipt) {
    try {
        if (receipt.endsWith("@g.us")) {
            return receipt;
        }
        let formatted = receipt.replace(/\D/g, "");

        if (formatted.startsWith("0")) {
            formatted = "62" + formatted.substr(1);
        }

        if (!formatted.endsWith("@c.us")) {
            formatted += "@c.us";
        }

        return formatted;
    } catch (error) {
        return receipt;
    }
}