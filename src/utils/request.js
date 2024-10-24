import 'dotenv/config.js'
import axios from "axios"

async function post(url, request) {
    const { data } = await axios.post(url, request, {
        headers: {
            'Content-Type': 'application/json',
            'api-key-server': `${process.env.API_KEY_SERVER}`,
        }
    })
    return data
}

async function get(url) {
    const { data } = await axios.get(url, {
        headers: {
            'Content-Type': 'application/json',
            'api-key-server': `${process.env.API_KEY_SERVER}`,
        }
    })
    return data
}

export default {
    post,
    get
}