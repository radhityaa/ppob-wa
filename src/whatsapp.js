import { Boom } from "@hapi/boom"
import baileys from "@whiskeysockets/baileys"
import fs from "fs"
import P from "pino"
import QRCode from "qrcode"
import readline from "readline"
import logger from "./app/logger.js"
import delayMs from "./lib/delay.js"
import formatReceipt from "./lib/formatReceipt.js"
import autoReply from "./utils/autoReply.js"

const {
    makeWASocket,
    BinaryInfo,
    delay,
    DisconnectReason,
    downloadAndProcessHistorySyncNotification,
    encodeWAM,
    fetchLatestBaileysVersion,
    getAggregateVotesInPollMessage,
    getHistoryMsg,
    isJidNewsletter,
    makeCacheableSignalKeyStore,
    makeInMemoryStore,
    proto,
    useMultiFileAuthState,
    Mimetype
} = baileys

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

const pino = P({ timestamp: () => `,"time":"${new Date().toJSON()}"` }, P.destination('./logs/wa-logs.txt'))
pino.level = 'trace'

let sock = []
let qrcode = []
let intervalStore = []

async function connectToWhatsApp(sender, io = null) {
    const { state, saveCreds } = await useMultiFileAuthState(`./credentials/${sender}`)

    sock[sender] = makeWASocket({
        browser: ['AyasyaTech', "Chrome", ""],
        logger: pino,
        printQRInTerminal: true,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino)
        }
    })

    sock[sender].ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (connection === 'connecting') {
            if (sock[sender].user) {
                logger("info", `Reconnecting`, `${sock[sender].user.id.split(":")[0]}`)
            }
        }

        if (qr) {
            QRCode.toDataURL(qr, function (err, url) {
                if (err) {
                    console.log(err)
                }
                qrcode[sender] = url
                if (io !== null) {
                    io.emit("qrcode", {
                        sender,
                        data: url,
                        message: "Please scan with your Whatsapp Account",
                    })
                }
            })
        }

        if (connection === 'open') {
            logger("primary", "Connected", sock[sender].user.id.split(":")[0])

            if (io !== null) {
                io.emit("connection-open", {
                    sender,
                    user: sock[sender].user,
                })
            }
            delete qrcode[sender]
        }

        if (connection === "close") {
            if ((lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
                delete qrcode[sender]
                if (io != null)
                    io.emit("message", {
                        sender: sender,
                        message: "Connecting..",
                    })
                if (lastDisconnect.error?.output?.payload?.message === "QR refs attempts ended") {
                    delete qrcode[sender]
                    sock[sender].ws.close()
                    if (io != null)
                        io.emit("message", {
                            sender: sender,
                            message:
                                "Request QR ended. reload scan to request QR again",
                        })
                    return
                }
                if (lastDisconnect?.error.output.payload.message != "Stream Errored (conflict)") {
                    connectToWhatsApp(sender, io)
                }
            } else {
                logger("error", "closed", "Connection closed. You are logged out.")
                if (io !== null) {
                    io.emit("message", {
                        sender,
                        message: "Connection closed. You are logged out.",
                    })
                }
                clearConnection(sender)
            }
        }
    })

    sock[sender].ev.on('creds.update', saveCreds)

    sock[sender].ev.on('contacts.upsert', function (contacts) {
        console.log(contacts) // work insert to database
    })

    sock[sender].ev.on('messages.upsert', async (m) => {
        console.log(JSON.stringify(m, undefined, 2))

        if (m.type === 'notify') {
            const message = m.messages[0];

            if (!message.key.fromMe && message.message.conversation) {
                const cleanedPhone = message.key.remoteJid.replace('@s.whatsapp.net', '')
                const receivedMsg = message.message.conversation;
                const replyMessage = await autoReply(receivedMsg, cleanedPhone, sock[sender]);
                await sock[sender].sendMessage(message.key.remoteJid, { text: replyMessage });
            }
        }
    })

    return {
        sock: sock[sender],
        qrcode: qrcode[sender]
    }
}

async function connectWaBeforeSend(sender) {
    let status = undefined
    let connect
    connect = await connectToWhatsApp(sender)

    await connect.sock.ev.on("connection.update", (con) => {
        const { connection, qr } = con
        if (connection === "open") {
            status = true
        }
        if (qr) {
            status = false
        }
    })

    let counter = 0
    while (typeof status === "undefined") {
        counter++
        if (counter > 4) {
            break
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    return status
}

async function isExist(sender, number) {
    if (typeof sock[sender] === "undefined") {
        const status = await connectWaBeforeSend(sender)
        if (!status) {
            return false
        }
    }
    try {
        if (number.includes("@g.us")) {
            return true
        } else {
            const [result] = await sock[sender].onWhatsApp(number)

            return result
        }
    } catch (error) {
        return false
    }
}

function clearConnection() {
    clearInterval(intervalStore[sender])

    delete sock[sender]
    delete qrcode[sender]
    if (fs.existsSync(`./credentials/${sender}`)) {
        fs.rmSync(
            `./credentials/${sender}`,
            { recursive: true, force: true },
            (err) => {
                if (err) console.log(err)
            }
        )
        console.log(`credentials/${sender} is deleted`)
    }
}

async function sendMessage(sender, number, text) {
    const numberFormatted = formatReceipt(number)
    return sock[sender].sendMessage(numberFormatted, { text })
}

async function sendBulkMessage(requests) {
    if (!Array.isArray(requests)) {
        throw new Error('Requests must be an array')
    }

    const results = []
    const errors = []

    setImmediate(async () => {
        for (const [index, request] of requests.entries()) {
            const { sender, number, delay = 1000, text } = request

            if (!sender || !number) {
                errors.push({ index, error: 'Sender and number are required' })
                continue
            }

            try {
                if (typeof sock[sender] === "undefined") {
                    const status = await connectWaBeforeSend(sender)
                    if (!status) {
                        errors.push({ index, error: `Unable to connect for sender ${sender}` })
                        continue
                    }
                }

                const numberFormatted = formatReceipt(number)

                if (index > 0) {
                    await delayMs(delay)
                }

                const result = await sock[sender].sendMessage(numberFormatted, { text })
                results.push({ index, result })
            } catch (e) {
                errors.push({ index, error: e.message })
            }
        }

        console.log('Bulk message results:', { results, errors })
    })

    return {
        status: true,
        message: 'Bulk message process started in background'
    }

}

async function myProfile(sender) {
    const user = await sock[sender].user
    return {
        number: `${user.id.split(':')[0]}`,
        lid: `${user.lid.split(':')[0]}`,
        name: user.name
    }
}

async function initialize(sender) {
    const path = `./credentials/${sender}`


    if (fs.existsSync(path)) {
        sock[sender] = undefined
        return connectWaBeforeSend(sender)

    }
}

async function deleteDevice(sender, io = null) {
    if (io !== null) {
        io.emit("message", {
            sender,
            message: "Logout Progress",
        })
    }

    if (typeof sock[sender] === "undefined") {
        const status = await connectWaBeforeSend(sender)

        if (status) {
            sock[sender].logout()
            delete sock[sender]
        }
    } else {
        sock[sender].logout()
        delete sock[sender]
    }

    delete sock[sender]
    clearInterval(intervalStore[sender])

    if (io != null) {
        io.emit("Unauthorized", sender)
        io.emit("message", {
            sender,
            message: "Connection closed. You are logged out.",
        })
    }

    if (fs.existsSync(`./credentials/${sender}`)) {
        fs.rmSync(
            `./credentials/${sender}`,
            { recursive: true, force: true },
            (err) => {
                if (err) console.log(err)
            }
        )
    }

    return {
        status: true,
        message: "Deleting session and credential",
    }
}

async function sendMediaMessage(sender, number, fileName, caption, type, url, ptt) {
    const numberFormatted = formatReceipt(number)
    const senderFormatted = formatReceipt(sender)

    if (type == "image") {
        var sendMsg = await sock[sender].sendMessage(numberFormatted, {
            image: url ? { url } : fs.readFileSync(`src/public/temp/${senderFormatted}/${fileName}`),
            caption: caption ?? null
        })
    } else if (type == "video") {
        var sendMsg = await sock[sender].sendMessage(numberFormatted, {
            video: url ? { url } : fs.readFileSync(`src/public/temp/${senderFormatted}/${fileName}`),
            caption: caption ?? null
        })
    } else if (type == "audio") {
        var sendMsg = await sock[sender].sendMessage(numberFormatted, {
            audio: url ? { url } : fs.unlinkSync(`src/public/temp/${senderFormatted}/${fileName}`),
            ptt: ptt,
        })
    } else if (type == "pdf") {
        var sendMsg = await sock[sender].sendMessage(numberFormatted,
            {
                document: { url: url },
                mimetype: "application/pdf",
                fileName: fileName + '.pdf',
            },
            { url: url }
        )
    } else if (type == "xls") {
        var sendMsg = await sock[token].sendMessage(
            number,
            {
                document: { url: url },
                mimetype: "application/excel",
                fileName: fileName + ".xls",
            },
            { url: url }
        )
    } else if (type == "xlsx") {
        var sendMsg = await sock[token].sendMessage(
            number,
            {
                document: { url: url },
                mimetype:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName: fileName + ".xlsx",
            },
            { url: url }
        )
    } else if (type == "doc") {
        var sendMsg = await sock[token].sendMessage(
            number,
            {
                document: { url: url },
                mimetype: "application/msword",
                fileName: fileName + ".doc",
            },
            { url: url }
        )
    } else if (type == "docx") {
        var sendMsg = await sock[token].sendMessage(
            number,
            {
                document: { url: url },
                mimetype:
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                fileName: fileName + ".docx",
            },
            { url: url }
        )
    } else if (type == "zip") {
        var sendMsg = await sock[token].sendMessage(
            number,
            {
                document: { url: url },
                mimetype: "application/zip",
                fileName: fileName + ".zip",
            },
            { url: url }
        )
    } else if (type == "mp3") {
        var sendMsg = await sock[token].sendMessage(
            number,
            { document: { url: url }, mimetype: "application/mp3" },
            { url: url }
        )
    } else {
        console.log("Unsupported file type")
        return null
    }

    return sendMsg
}

export {
    clearConnection,
    connectToWhatsApp,
    connectWaBeforeSend,
    deleteDevice,
    initialize,
    isExist,
    myProfile,
    sendBulkMessage,
    sendMediaMessage,
    sendMessage
}

