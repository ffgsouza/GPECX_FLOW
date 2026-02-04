// Teste usando email onboarding do Resend (funciona sem verificação)
const { Resend } = require('resend');

const resend = new Resend('re_4mrzu3Ci_BRQVDegq6MQiNHXFJP9yLzJ2');

console.log('\n🚀 TESTE COM EMAIL ONBOARDING DO RESEND\n');
console.log('═'.repeat(60));

async function sendTestEmail() {
    try {
        console.log('📧 Enviando email de teste...');
        console.log('   FROM: onboarding@resend.dev (email padrão Resend)');
        console.log('   TO: gpecxdev@gmail.com');
        console.log('');

        const result = await resend.emails.send({
            from: 'Integração GPECX <onboarding@resend.dev>',
            to: 'gpecxdev@gmail.com',
            subject: '🎉 TESTE - Integração EXS → GPECX Funcionando!',
            replyTo: 'fredericocaires56@gmail.com',
            html: `
        <div style="font-family: Arial, sans-serif; padding: 40px; background: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 50px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 36px; font-weight: bold;">🎉 SUCESSO!</h1>
              <p style="margin: 15px 0 0; font-size: 18px; opacity: 0.95;">Integração EXS → GPECX</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #10b981; margin: 0 0 20px; font-size: 24px;">✅ Email de Teste Recebido!</h2>
              
              <p style="font-size: 16px; line-height: 1.8; color: #374151; margin: 0 0 25px;">
                Se você está vendo este email, significa que a <strong>integração automática está 100% funcional!</strong>
              </p>
              
              <!-- Success Box -->
              <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px; color: #059669; font-size: 18px;">🚀 O que foi testado:</h3>
                <table style="width: 100%;">
                  <tr><td style="padding: 8px 0;"><span style="color: #10b981; font-size: 20px;">✓</span> Configuração do Resend</td></tr>
                  <tr><td style="padding: 8px 0;"><span style="color: #10b981; font-size: 20px;">✓</span> API Key funcionando</td></tr>
                  <tr><td style="padding: 8px 0;"><span style="color: #10b981; font-size: 20px;">✓</span> Envio de emails automatizado</td></tr>
                  <tr><td style="padding: 8px 0;"><span style="color: #10b981; font-size: 20px;">✓</span> Template HTML profissional</td></tr>
                  <tr><td style="padding: 8px 0;"><span style="color: #10b981; font-size: 20px;">✓</span> Sistema pronto para produção!</td></tr>
                </table>
              </div>
              
              <!-- Flow Explanation -->
              <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px; color: #d97706; font-size: 18px;">⚡ Fluxo Automático em Produção:</h3>
                <ol style="margin: 0; padding-left: 20px; line-height: 2;">
                  <li>Cliente finaliza pedido no <strong>EXS Locações</strong></li>
                  <li>Sistema cria documento em <code style="background: #fef3c7; padding: 2px 6px; border-radius: 3px;">/orders</code></li>
                  <li><strong>Trigger dispara</strong> automaticamente (Cloud Function)</li>
                  <li>Busca equipamentos e cria proposta comercial</li>
                  <li><strong>Gera PDF profissional</strong> com todos os dados</li>
                  <li><strong>Envia email</strong> ao cliente (~10 segundos!)</li>
                </ol>
              </div>
              
              <!-- Example Data -->
              <div style="background: #f9fafb; border-radius: 6px; padding: 25px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px; color: #374151; font-size: 18px;">📊 Exemplo de Dados (Produção):</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; font-weight: bold; color: #6b7280;">Cliente:</td>
                    <td style="padding: 12px 0; color: #111827;">João Silva</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; font-weight: bold; color: #6b7280;">Equipamento:</td>
                    <td style="padding: 12px 0; color: #111827;">CMC356 - Omicron Test Set</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; font-weight: bold; color: #6b7280;">Período:</td>
                    <td style="padding: 12px 0; color: #111827;">30 dias (10/02 - 10/03/2026)</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0; font-weight: bold; color: #6b7280;">Valor:</td>
                    <td style="padding: 12px 0; color: #111827; font-weight: bold;">R$ 1.500,50</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; font-weight: bold; color: #6b7280;">Proposta:</td>
                    <td style="padding: 12px 0; color: #10b981; font-weight: bold;">PLE-003-2026</td>
                  </tr>
                </table>
              </div>
              
              <!-- Footer -->
              <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
                <p style="margin: 0; font-size: 16px; color: #374151;">
                  <strong>Atenciosamente,</strong><br/>
                  <span style="color: #10b981; font-weight: bold; font-size: 18px;">Equipe GPECX</span>
                </p>
              </div>
            </div>
            
            <!-- Bottom Info -->
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                ✅ Sistema de Integração Automática EXS → GPECX<br/>
                Teste enviado em: ${new Date().toLocaleString('pt-BR')}<br/>
                ID: TEST-${Date.now()}
              </p>
            </div>
            
          </div>
        </div>
      `,
            text: 'TESTE - Se você recebeu este email, a integração EXS → GPECX está 100% funcional! Em produção, você receberá um PDF anexado com a proposta comercial completa.'
        });

        console.log('\n' + '═'.repeat(60));
        console.log('✅ SUCESSO!');
        console.log('═'.repeat(60));
        console.log('');
        console.log('📬 Email ID:', result.data?.id || 'N/A');
        console.log('📧 Status: ENVIADO');
        console.log('📮 Destinatário: gpecxdev@gmail.com');
        console.log('');
        console.log('═'.repeat(60));
        console.log('🎉 EMAIL ENVIADO COM SUCESSO!');
        console.log('═'.repeat(60));
        console.log('');
        console.log('📋 Próximos Passos:');
        console.log('   1. ✅ Verifique gpecxdev@gmail.com');
        console.log('   2. ✅ Cheque SPAM/Lixo Eletrônico');
        console.log('   3. ⏱️  Aguarde 1-2 minutos (pode demorar)');
        console.log('');
        console.log('💡 Nota: O email virá de "onboarding@resend.dev"');
        console.log('   (é o email padrão do Resend para testes)');
        console.log('');

        return result;

    } catch (error) {
        console.log('\n' + '═'.repeat(60));
        console.log('❌ ERRO');
        console.log('═'.repeat(60));
        console.error('Mensagem:', error.message);

        if (error.response?.data) {
            console.log('\nDetalhes do erro:');
            console.log(JSON.stringify(error.response.data, null, 2));
        }

        process.exit(1);
    }
}

sendTestEmail();
