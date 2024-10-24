import responseSuccess from "../lib/responseSuccess.js"
import { initialize, myProfile, sendBulkMessage, sendMediaMessage, sendMessage } from "../whatsapp.js"
import delayMs from "../lib/delay.js"

const sendMessageC = async (req, res, next) => {
    const { sender, number, text } = req.body

    try {
        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Text is required'
            })
        }

        const result = await sendMessage(sender, number, text)
        return responseSuccess(res, 'Message Has Been Sending', result)
    } catch (e) {
        next(e)
    }
}

const myProfileC = async (req, res, next) => {
    const { sender } = req.body

    try {
        const result = await myProfile(sender)
        return responseSuccess(res, 'My Profile', result)
    } catch (e) {
        next(e)
    }
}

const initializeC = async (req, res, next) => {
    const { sender } = req.body

    try {
        const result = await initialize(sender)

        if (result) {
            return responseSuccess(res, `${sender} Connected`)
        } else {
            return res.status(400).json({
                success: false,
                message: "Connection failed, please scan again"
            })
        }

    } catch (e) {
        next(e)
    }
}

const sendMediaMessageC = async (req, res, next) => {
    const { sender, number, fileName, caption, type, url, ptt } = req.body

    try {
        const result = await sendMediaMessage(sender, number, fileName, caption, type, url, ptt)
        return responseSuccess(res, 'Media Message Has Been Sending', result)
    } catch (e) {
        next(e)
    }
}

const sendBulkMessageC = async (req, res, next) => {
    const requests = req.body

    try {
        const result = await sendBulkMessage(requests)
        return responseSuccess(res, 'Message sent successfully', result)
    } catch (e) {
        next(e)
    }
}

export default {
    sendMessageC,
    myProfileC,
    initializeC,
    sendMediaMessageC,
    sendBulkMessageC
}