import express from "express"
import { errorMiddleware } from "../middleware/errorMiddleware.js"
import { router } from "../routes/index.js"
import cors from "cors"

export const web = express()
web.use(express.json())
web.use(cors({
    origin: ["*"]
}))

web.use(router)
web.use(errorMiddleware)