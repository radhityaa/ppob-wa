import request from "../../utils/request.js";

export default async function checkSaldo(phone) {
    try {
        const result = await request.post('/users/saldo', { phone });
        return `Saldo anda saat ini *Rp.${result.message}*\r\n\r\n*Kembali ke menu balas "0"*`;
    } catch (error) {
        console.error('Error:', error);
        return 'Maaf, terjadi kesalahan server. Coba lagi beberapa saat';
    }
}