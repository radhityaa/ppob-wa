import express from "express"
import whatsappController from "../controller/whatsappController.js"
import { checkDestination } from "../middleware/middleware.js"

const router = new express.Router()

router.post("/api/v1/send-message", checkDestination, whatsappController.sendMessageC)
router.post("/api/v1/send-media-message", checkDestination, whatsappController.sendMediaMessageC)
router.post("/api/v1/send-bulk-message", whatsappController.sendBulkMessageC)
router.post("/api/v1/my-profile", checkDestination, whatsappController.myProfileC)
router.post("/api/v1/initialize", checkDestination, whatsappController.initializeC)

export {
    router
}
