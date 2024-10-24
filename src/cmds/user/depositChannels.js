import request from "../../utils/request.js";

export default async function depositChannels(phone) {
    try {
        const result = await request.post('/users/deposit/channels', { phone });

        if (result.success) {
            if (Array.isArray(result.data)) {
                let message = 'Pilih Pembayaran:\r\nNote: Balas menggunakan code'
                result.data.forEach((channel, index) => {
                    message += `${index + 1}. *Code: ${channel.code}*.\r\n ${channel.name} (${channel.group}), Admin *Rp.${channel.fee}*\r\n\r\n`
                })

                return message
            } else {
                return 'Gagal mendapatkan data pembayaran'
            }
        } else {
            return result.message
        }
    } catch (error) {
        console.error('Error:', error);
        return 'Maaf, terjadi kesalahan server. Coba lagi beberapa saat';
    }
}