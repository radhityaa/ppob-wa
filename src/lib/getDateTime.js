import moment from "moment-timezone"

export default function getDateTime() {
    const tz = moment().tz('Asia/Jakarta')
    const format = "HH:mm:ss - dddd, DD MMMM YYYY"
    return tz.format(format)
}