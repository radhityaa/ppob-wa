import formatReceipt from "../lib/formatReceipt.js";
import { isExist } from "../whatsapp.js"

const checkDestination = async (req, res, next) => {
    const { sender, number } = req.body;

    if (!sender) {
        return res.status(400).json({
            success: false,
            message: "The sender is required",
        })
    }

    if (!number) {
        return res.status(400).json({
            success: false,
            message: "The number is required",
        })
    }

    const check = await isExist(sender, formatReceipt(number));
    if (!check) {
        return res.send({
            success: false,
            message:
                "The destination Number not registered in WhatsApp or your sender not connected",
        });
    }
    next();

}

export {
    checkDestination
}