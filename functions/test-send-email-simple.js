// Script simplificado para testar envio de proposta
const { Resend } = require('resend');

// Configurar Resend
const resend = new Resend('re_4mrzu3Ci_BRQVDegq6MQiNHXFJP9yLzJ2');

console.log('\n🚀 TESTE DE ENVIO DE EMAIL\n');
console.log('═'.repeat(50));

// Enviar email de teste simples
async function sendTestEmail() {
  try {
    console.log('📧 Enviando email para gpecxdev@gmail.com...');

    const result = await resend.emails.send({
      from: 'fredericocaires56@gmail.com',
      to: 'gpecxdev@gmail.com',
      subject: '✨ TESTE - Integração EXS → GPECX Funcionando!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Integração Funcionando!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">EXS Locações → GPECX Flow</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
            <h2 style="color: #10b981; margin-top: 0;">✅ Teste Bem-Sucedido!</h2>
            
            <p>Olá! Este é um email de <strong>teste da integração automática</strong>.</p>
            
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
              <strong>🚀 O que foi testado:</strong>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>✓ Configuração do Resend</li>
                <li>✓ API Key funcionando</li>
                <li>✓ Envio de emails automatizado</li>
                <li>✓ Template HTML formatado</li>
              </ul>
            </div>
            
            <h3 style="color: #059669;">📋 Próximos Passos</h3>
            <p>Com este teste confirmado, a integração completa funcionará da seguinte forma:</p>
            
            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <strong>Fluxo Automático:</strong>
              <ol style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Cliente finaliza pedido no <strong>EXS Locações</strong></li>
                <li>Pedido criado em <code>/orders</code></li>
                <li><strong>Trigger dispara</strong> automaticamente</li>
                <li>Cloud Function gera <strong>proposta comercial</strong></li>
                <li>PDF profissional criado</li>
                <li><strong>Email enviado</strong> ao cliente (~10 seg)</li>
              </ol>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <strong>📊 Dados de Exemplo (quando em produção):</strong>
              <table style="width: 100%; margin-top: 10px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Cliente:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">João Silva</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Equipamento:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">CMC356</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Período:</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">30 dias</td>
                </tr>
                <tr>
                  <td style="padding: 8px;"><strong>Proposta:</strong></td>
                  <td style="padding: 8px;">PLE-003-2026</td>
                </tr>
              </table>
            </div>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
              <strong>Atenciosamente,</strong><br/>
              <span style="color: #10b981; font-weight: bold;">Equipe GPECX</span>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 15px; color: #6b7280; font-size: 12px;">
            <p>✅ Sistema de Integração Automática<br/>
            Gerado em ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      `
    });

    console.log('\n✅ EMAIL ENVIADO COM SUCESSO!');
    console.log('📬 Email ID:', result.data?.id);
    console.log('📧 Destinatário: gpecxdev@gmail.com');
    console.log('\n═'.repeat(50));
    console.log('🎉 TESTE CONCLUÍDO!');
    console.log('═'.repeat(50));
    console.log('\n📬 Verifique sua caixa de entrada em: gpecxdev@gmail.com');
    console.log('   (Verifique também a pasta de spam)\n');

    return result;

  } catch (error) {
    console.error('\n❌ ERRO ao enviar email:');
    console.error(error.message);
    if (error.response) {
      console.error('Resposta:', error.response);
    }
    process.exit(1);
  }
}

// Executar
sendTestEmail();
