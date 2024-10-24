import 'dotenv/config.js'
import { Server } from "socket.io"
import logger from "./app/logger.js"
import { web } from "./app/web.js"
import { connectToWhatsApp, deleteDevice } from "./whatsapp.js"
import axios from "axios"

const PORT = process.env.PORT || 4000
const PORTSOCKET = process.env.PORT_SOCKET || 3000
const URL = process.env.URL || 'http://localhost:4000'
const ENDPOINT = process.env.ENDPOINT_API || 'http://localhost:8000'

axios.defaults.baseURL = ENDPOINT

const io = new Server(PORTSOCKET, {
    cors: {
        origin: "*"
    }
})

io.on('connection', (sock) => {

    sock.on('startConnection', (data) => {
        const { sender } = data
        connectToWhatsApp(sender, io)
    })

    sock.on('logoutDevice', (device) => {
        deleteDevice(device, io)
    })
})


web.listen(PORT, () => {
    logger('info', 'server', `Server runnning on ${URL}`)
})