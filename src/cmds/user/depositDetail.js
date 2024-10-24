import request from "../../utils/request.js";

export default async function depositDetail(phone, invoice) {
    try {
        const result = await request.post('/users/deposit/detail', { phone, invoice });
        const data = result.data
        let pay = ''
        let message = ''

        if (result.success) {
            if (data.pay_code) {
                pay = `Kode Pembayaran: *${data.pay_code}*`
            } else if (data.pay_url) {
                pay = `URL Pembayaran: *${data.pay_url}*`
            } else {
                pay = `Checkout Pembayaran: *${data.checkout_url}*`
            }

            if (data.status === 'unpaid') {
                message = `Hi, *_${data.name}_*\r\n\r\nTerima Kasih Telah Melakukan Deposit Di *${data.app_name}*.\r\n\r\n> Data Deposit:\r\n- Invoice: *${data.invoice}*\r\n- Pembayaran: *${data.method}*\r\n- ${pay}\r\n- Nominal: *${data.nominal}*\r\n- Fee: *${data.fee}*\r\n- Total Harus Dibayarkan: *${data.total}*\r\n- Saldo Diterima: *${data.amount_received}*\r\nStatus: *${data.status.toUpperCase()}*\r\n\r\n_Harap Dibayarkan Dihari Yang Sama, Jika Tidak Makan Deposit Akan DiBatalkan Otomatis Oleh Sistem._\r\nBayar Sebelum *${data.expired_at}*\r\n\r\nAbaikan Pesan Ini Jika Sudah Melakukan Pembayaran\r\n\r\n*Terima Kasih*`
            } else if (data.status === 'paid') {
                message = `Hi, *_${data.name}_*\r\n\r\Berikut Detail Deposit Kamu.\r\n\r\n> Data Deposit:\r\n- Invoice: *${data.invoice}*\r\n- Pembayaran: *${data.method}*\r\n- ${pay}\r\n- Nominal: *${data.nominal}*\r\n- Fee: *${data.fee}*\r\n- Total Harus Dibayarkan: *${data.total}*\r\n- Saldo Diterima: *${data.amount_received}*\r\n- Status: *${data.status.toUpperCase()}*\r\nDibayarkan pada ${data.paid_at}\r\n\r\n*Terima Kasih*`
            } else {
                message = `Hi, *_${data.name}_*\r\n\r\Berikut Detail Deposit Kamu.\r\n\r\n> Data Deposit:\r\n- Invoice: *${data.invoice}*\r\n- Pembayaran: *${data.method}*\r\n- ${pay}\r\n- Nominal: *${data.nominal}*\r\n- Fee: *${data.fee}*\r\n- Total Harus Dibayarkan: *${data.total}*\r\n- Saldo Diterima: *${data.amount_received}*\r\n- Status: *${data.status.toUpperCase()}*\r\n\r\n*Terima Kasih*`
            }

            return message
        } else {
            return result.message
        }

    } catch (error) {
        console.error('Error:', error);
        return 'Maaf, terjadi kesalahan server. Coba lagi beberapa saat';
    }
}