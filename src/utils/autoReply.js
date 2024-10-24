import showMenu from "../cmds/showMenu.js";
import checkSaldo from "../cmds/user/checkSaldo.js";
import deposit from "../cmds/user/deposit.js";
import depositDetail from "../cmds/user/depositDetail.js";
import depositList from "../cmds/user/depositList.js";

let previousNominal

export default async function autoReply(msg, phone) {
    const lowerCaseMsg = msg.toLowerCase(); // Buat lowercase agar perbandingan lebih mudah
    let reply
    // 1. Jika Huruf Depan (Prefix Match)
    // Ex.: lowerCaseMsg.startsWith('halo')

    // 2. Jika Huruf Belakang (Suffix Match)
    // Ex.: lowerCaseMsg.endsWith('terima kasih')

    // 3. Jika Terdapat Kalimat (Substring Match)
    // Ex.: lowerCaseMsg.includes('harga')

    // 4. Harus Sama dengan (Exact Match)
    // Ex.: lowerCaseMsg === 'cek saldo'

    if (lowerCaseMsg === '0') {
        reply = showMenu()
    } else if (lowerCaseMsg === '1') {
        reply = await checkSaldo(phone)
    } else if (lowerCaseMsg === '2') {
        reply = 'Masukkan Nominal Deposit.\r\nContoh: 10.000\r\nMinimal 10.000 - 10.000.000\r\n\r\n*Kembali ke menu balas "0"*'
    } else if (/^\d{1,3}(?:\.\d{3})*$/.test(lowerCaseMsg) && Number(lowerCaseMsg.replace(/\./g, '')) >= 10000 && Number(lowerCaseMsg.replace(/\./g, '')) <= 10000000) {
        previousNominal = lowerCaseMsg
        const result = await deposit(phone, previousNominal)
        reply = result
    } else if (msg.includes('DPS')) {
        const result = await depositDetail(phone, lowerCaseMsg)
        reply = result
    } else if (lowerCaseMsg === '3') {
        const result = await depositList(phone)
        return result
    } else {
        reply = 'Maaf, perintah yang kamu masukan salah, *balas menggunakan angka*.\r\n\r\n*Silahkan kembali ke menu balas "0"*.';
    }

    return reply;
};