export default function responseSuccess(res, message, data = null) {
    res.status(200).json({
        success: true,
        message,
        data
    })
}