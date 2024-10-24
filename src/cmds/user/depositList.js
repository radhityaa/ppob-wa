import request from "../../utils/request.js";

export default async function depositList(phone) {
    try {
        const result = await request.post('/users/deposit/list', { phone });

        if (Array.isArray(result.data)) {
            let message = 'Berikut riwayat deposit anda:\r\n'
            result.data.forEach((data, index) => {
                message += `${index + 1}. Invoice: *${data.invoice}*\r\nPembayaran: *${data.method}*\r\nTotal: *${data.total}*\r\nStatus: *${data.status.toUpperCase()}*\r\nTanggal: *${data.created_at}*\r\n\r\n`
            })

            message += 'Untuk melihat detail deposit, Balas menggunakan invoive\r\nContoh: DPS-00001-1.\r\n\r\n*Kembali ke menu balas "0"*'

            return message
        } else {
            return 'Gagal mendapatkan data'
        }
    } catch (error) {
        console.error('Error:', error);
        return 'Maaf, terjadi kesalahan server. Coba lagi beberapa saat';
    }
}