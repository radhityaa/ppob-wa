import { responseError } from "../lib/responseError.js"

const errorMiddleware = async (err, req, res, next) => {
    if (!err) {
        next()
        return
    }

    if (err instanceof responseError) {
        res.status(err.status).json({
            success: false,
            message: err.message
        }).end()
    } else {
        res.status(500).json({
            success: false,
            message: err.message
        }).end()
    }
}

export {
    errorMiddleware
}