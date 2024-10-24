import request from "../../utils/request.js";

export default async function deposit(phone, nominal) {
    try {
        const result = await request.post('/users/deposit', { phone, nominal });
        const data = result.data
        let pay = ''

        if (result.sucess) {
            if (data.pay_code) {
                pay = `Kode Pembayaran: *${data.pay_code}*`
            } else if (data.pay_url) {
                pay = `URL Pembayaran: *${data.pay_url}*`
            } else {
                pay = `Checkout Pembayaran: *${data.checkout_url}*`
            }
            let message = `Hi, *_${data.name}_*\r\n\r\nTerima Kasih Telah Melakukan Deposit Di *${data.app_name}*.\r\n\r\n> Data Deposit:\r\n- Invoice: *${data.invoice}*\r\n- Pembayaran: *${data.method}*\r\n- ${pay}\r\n- Nominal: *${data.nominal}*\r\n- Fee: *${data.fee}*\r\n- Total Harus Dibayarkan: *${data.total}*\r\n- Saldo Diterima: *${data.amount_received}*\r\n\r\n_Harap Dibayarkan Dihari Yang Sama, Jika Tidak Makan Deposit Akan DiBatalkan Otomatis Oleh Sistem._\r\nBayar Sebelum *${data.expired_at}*\r\n\r\nAbaikan Pesan Ini Jika Sudah Melakukan Pembayaran\r\n\r\n*Terima Kasih*`

            return message
        } else {
            let message = `Terdapat deposit yang belum dibayarkan.\r\nInvoice: *${result.data}*\r\nSilahkan melakukan pembayaran terlebih dahulu.\r\n\r\nUntuk detail pembayaran silahkan bales dengan invoice.\r\nContoh: DPS-000001-1\r\n\r\n*Kembali ke menu balas "0"*`
            return message
        }
    } catch (error) {
        console.error('Error:', error);
        return 'Maaf, terjadi kesalahan server. Coba lagi beberapa saat';
    }
}