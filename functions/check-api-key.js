// Verificar se API Key está válida
const { Resend } = require('resend');

const resend = new Resend('re_4mrzu3Ci_BRQVDegq6MQiNHXFJP9yLzJ2');

console.log('\n🔍 VERIFICANDO API KEY DO RESEND\n');
console.log('═'.repeat(60));

async function checkApiKey() {
    try {
        // Tentar listar domínios para verificar se API Key é válida
        console.log('📡 Testando API Key...');

        const result = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'delivered@resend.dev',  // Email de teste do próprio Resend
            subject: 'Test',
            html: '<p>Test</p>'
        });

        console.log('\n✅ API KEY VÁLIDA!');
        console.log('Resposta:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.log('\n❌ ERRO NA API KEY!');
        console.log('Status:', error.statusCode);
        console.log('Mensagem:', error.message);

        if (error.message.includes('Invalid API key') || error.message.includes('401')) {
            console.log('\n⚠️ A API KEY ESTÁ INVÁLIDA!');
            console.log('\n🔧 Solução:');
            console.log('1. Acesse https://resend.com/api-keys');
            console.log('2. Copie a API Key correta');
            console.log('3. Atualize em functions/.env');
        }

        console.log('\nDetalhes completos do erro:');
        console.log(error);
    }
}

checkApiKey();
