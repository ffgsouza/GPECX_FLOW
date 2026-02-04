// Script com mais detalhes de debug
const { Resend } = require('resend');

const resend = new Resend('re_4mrzu3Ci_BRQVDegq6MQiNHXFJP9yLzJ2');

console.log('\n🔍 TESTE DE ENVIO COM DEBUG\n');
console.log('═'.repeat(60));

async function sendTestEmail() {
    try {
        console.log('📋 Configurações:');
        console.log('   FROM: fredericocaires56@gmail.com');
        console.log('   TO: gpecxdev@gmail.com');
        console.log('   API Key: re_4mrzu3Ci... (configurada)');
        console.log('');
        console.log('📧 Enviando email...');

        const result = await resend.emails.send({
            from: 'fredericocaires56@gmail.com',
            to: 'gpecxdev@gmail.com',
            subject: '🧪 TESTE DEBUG - Integração EXS → GPECX',
            html: `
        <div style="font-family: Arial, sans-serif; padding: 40px; background: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px;">🎉 TESTE DE EMAIL</h1>
              <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Integração EXS → GPECX</p>
            </div>
            
            <div style="padding: 40px;">
              <h2 style="color: #10b981; margin: 0 0 20px;">✅ Se você recebeu este email...</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                A integração está <strong>100% funcional!</strong>
              </p>
              
              <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0;">
                <p style="margin: 0; color: #059669;"><strong>✓</strong> Resend configurado</p>
                <p style="margin: 10px 0 0; color: #059669;"><strong>✓</strong> Email verificado</p>
                <p style="margin: 10px 0 0; color: #059669;"><strong>✓</strong> API Key válida</p>
                <p style="margin: 10px 0 0; color: #059669;"><strong>✓</strong> Sistema funcionando!</p>
              </div>
              
              <p style="margin: 30px 0 0; padding-top: 30px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px;">
                Teste enviado em: ${new Date().toLocaleString('pt-BR')}<br/>
                ID único: ${Math.random().toString(36).substring(7)}
              </p>
            </div>
          </div>
        </div>
      `,
            text: 'Se você recebeu este email, a integração EXS → GPECX está funcionando! ✅'
        });

        console.log('\n' + '═'.repeat(60));
        console.log('✅ RESPOSTA DO RESEND:');
        console.log('═'.repeat(60));
        console.log(JSON.stringify(result, null, 2));
        console.log('═'.repeat(60));

        if (result.data) {
            console.log('\n✅ EMAIL ENVIADO COM SUCESSO!');
            console.log('📬 ID do Email:', result.data.id);
            console.log('\n📋 Próximos Passos:');
            console.log('   1. Verifique gpecxdev@gmail.com');
            console.log('   2. Cheque SPAM/Lixo Eletrônico');
            console.log('   3. Aguarde 1-2 minutos (pode demorar)');
            console.log('   4. Verifique logs no Resend:');
            console.log('      https://resend.com/emails\n');
        } else {
            console.log('\n⚠️ Resposta inesperada do Resend');
            console.log('Verifique os logs acima');
        }

    } catch (error) {
        console.log('\n' + '═'.repeat(60));
        console.log('❌ ERRO AO ENVIAR EMAIL');
        console.log('═'.repeat(60));
        console.log('Mensagem:', error.message);
        console.log('');

        if (error.response) {
            console.log('Resposta HTTP:', error.response.status);
            console.log('Dados:', JSON.stringify(error.response.data, null, 2));
        }

        if (error.statusCode) {
            console.log('Status Code:', error.statusCode);
        }

        console.log('\nDetalhes completos:');
        console.log(error);
        console.log('═'.repeat(60));

        console.log('\n🔧 Possíveis Soluções:');
        console.log('   1. Gmail pode estar bloqueando Gmail→Gmail');
        console.log('   2. Verifique logs no Resend: https://resend.com/emails');
        console.log('   3. Tente enviar para outro email (não Gmail)');
        console.log('   4. Verifique se fredericocaires56@gmail.com está verificado\n');
    }
}

sendTestEmail();
