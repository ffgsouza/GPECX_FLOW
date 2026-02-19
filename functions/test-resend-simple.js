require('dotenv').config({ path: './functions/.env' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testSimpleEmail() {
    console.log('📧 Testando envio simples com Resend...');
    try {
        const data = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'gpecxdev@gmail.com',
            subject: 'Teste Simples Resend',
            html: '<p>Se você recebeu esse email, a API Key está funcionando!</p>'
        });
        console.log('✅ Sucesso:', data);
    } catch (error) {
        console.error('❌ Erro:', JSON.stringify(error, null, 2));
    }
}

testSimpleEmail();
