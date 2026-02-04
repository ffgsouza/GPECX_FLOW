// Enviar para o email que sabemos que funciona!
const { Resend } = require('resend');

const resend = new Resend('re_4mrzu3Ci_BRQVDegq6MQiNHXFJP9yLzJ2');

console.log('\n🚀 ENVIANDO PROPOSTA DE TESTE\n');
console.log('═'.repeat(60));
console.log('📧 Para: fredericocaires56@gmail.com');
console.log('   (Email que já funcionou antes!)');
console.log('');

async function sendProposal() {
    try {
        const result = await resend.emails.send({
            from: 'Integração GPECX <onboarding@resend.dev>',
            to: 'fredericocaires56@gmail.com',
            subject: '✨ Proposta Comercial de Teste - EXS → GPECX',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #f9fafb; padding: 40px 20px;">
          
          <!-- Card Principal -->
          <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
            
            <!-- Header com Gradiente -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 50px 40px; text-align: center; color: white;">
              <div style="font-size: 48px; margin-bottom: 10px;">📄</div>
              <h1 style="margin: 0; font-size: 32px; font-weight: bold;">PROPOSTA DE LOCAÇÃO</h1>
              <p style="margin: 15px 0 0; font-size: 20px; opacity: 0.95; font-weight: 600;">PLE-TEST-2026</p>
            </div>
            
            <!-- Conteúdo -->
            <div style="padding: 40px;">
              
              <h2 style="color: #10b981; margin: 0 0 25px; font-size: 24px;">🎉 Teste da Integração Automática</h2>
              
              <p style="font-size: 16px; line-height: 1.8; color: #374151; margin: 0 0 30px;">
                Olá! Este é um <strong>email de demonstração</strong> mostrando como ficará a proposta comercial que será enviada automaticamente quando um cliente faz um pedido no <strong>EXS Locações</strong>.
              </p>
              
              <!-- Dados do Cliente -->
              <div style="background: #f0fdf4; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h3 style="margin: 0 0 20px; color: #059669; font-size: 18px;">👤 Dados do Cliente</h3>
                <table style="width: 100%;">
                  <tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Nome:</td><td style="padding: 8px 0; color: #111827;">João Silva (TESTE)</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600;">CPF/CNPJ:</td><td style="padding: 8px 0; color: #111827;">123.456.789-00</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Email:</td><td style="padding: 8px 0; color: #111827;">joao@empresa.com</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Telefone:</td><td style="padding: 8px 0; color: #111827;">(11) 98765-4321</td></tr>
                </table>
              </div>
              
              <!-- Período de Locação -->
              <div style="background: #fffbeb; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h3 style="margin: 0 0 20px; color: #d97706; font-size: 18px;">📅 Período de Locação</h3>
                <table style="width: 100%;">
                  <tr><td style="padding: 8px 0; color: #92400e; font-weight: 600;">Data Início:</td><td style="padding: 8px 0; color: #78350f;">10/02/2026</td></tr>
                  <tr><td style="padding: 8px 0; color: #92400e; font-weight: 600;">Data Término:</td><td style="padding: 8px 0; color: #78350f;">10/03/2026</td></tr>
                  <tr><td style="padding: 8px 0; color: #92400e; font-weight: 600;">Duração:</td><td style="padding: 8px 0; color: #78350f; font-weight: bold;">30 dias</td></tr>
                </table>
              </div>
              
              <!-- Equipamentos -->
              <div style="background: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h3 style="margin: 0 0 20px; color: #374151; font-size: 18px;">🔧 Equipamentos a Locar</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #10b981; color: white;">
                      <th style="padding: 12px; text-align: left; border-radius: 4px 0 0 0;">Equipamento</th>
                      <th style="padding: 12px; text-align: left;">Série</th>
                      <th style="padding: 12px; text-align: right; border-radius: 0 4px 0 0;">Diária</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="padding: 15px 12px; font-weight: 600;">CMC356 - Omicron Test Set</td>
                      <td style="padding: 15px 12px; color: #6b7280;">SN-12345</td>
                      <td style="padding: 15px 12px; text-align: right; font-weight: 600;">R$ 50,00</td>
                    </tr>
                    <tr>
                      <td style="padding: 15px 12px; font-weight: 600;">Sverker 900 - Analyzer</td>
                      <td style="padding: 15px 12px; color: #6b7280;">SN-67890</td>
                      <td style="padding: 15px 12px; text-align: right; font-weight: 600;">R$ 35,00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Valor Total -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 3px solid #10b981; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="margin: 0 0 10px; color: #059669; font-size: 18px; font-weight: 600;">VALOR TOTAL DO PERÍODO</p>
                <p style="margin: 0; color: #10b981; font-size: 48px; font-weight: bold;">R$ 1.500,50</p>
                <p style="margin: 15px 0 0; color: #059669; font-size: 14px;">Pagamento via PIX</p>
              </div>
              
              <!-- Observações -->
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ IMPORTANTE:</strong> Este é um email de <strong>TESTE</strong> com dados fictícios para demonstração da integração automática EXS → GPECX.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
                <p style="margin: 0 0 10px; font-size: 16px; color: #374151;">
                  <strong>Atenciosamente,</strong>
                </p>
                <p style="margin: 0; font-size: 22px; color: #10b981; font-weight: bold;">
                  Equipe GPECX
                </p>
              </div>
              
            </div>
            
            <!-- Footer Card -->
            <div style="background: #f9fafb; padding: 25px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                ✅ <strong>Sistema de Integração Automática</strong>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                EXS Locações → GPECX Flow<br/>
                Gerado em: ${new Date().toLocaleString('pt-BR')}<br/>
                ID: TEST-${Date.now()}
              </p>
            </div>
            
          </div>
          
          <!-- Info Extra -->
          <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 13px; line-height: 1.6;">
            <p style="margin: 0;">
              📌 Em produção, este email será enviado automaticamente com <strong>PDF anexado</strong><br/>
              ⚡ Tempo total: ~10 segundos do pedido até o email!
            </p>
          </div>
          
        </div>
      `
        });

        console.log('═'.repeat(60));
        console.log('✅ EMAIL ENVIADO COM SUCESSO!');
        console.log('═'.repeat(60));
        console.log('');
        console.log('📬 Email ID:', result.data?.id);
        console.log('📧 Para: fredericocaires56@gmail.com');
        console.log('📨 Assunto: Proposta Comercial de Teste');
        console.log('');
        console.log('🎉 VERIFIQUE SEU EMAIL AGORA!');
        console.log('');
        console.log('═'.repeat(60));

    } catch (error) {
        console.log('❌ ERRO:', error.message);
        console.error(error);
    }
}

sendProposal();
