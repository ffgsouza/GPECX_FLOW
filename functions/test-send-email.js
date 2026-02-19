// Script para testar envio de proposta comercial com dados fictícios
// Execute: node functions/test-send-email.js

require('dotenv').config({ path: './functions/.env' });
const { Resend } = require('resend');
const puppeteer = require('puppeteer');

const resend = new Resend(process.env.RESEND_API_KEY);

// Dados fictícios para teste
const testData = {
  quote: {
    quoteNumber: 'PLE-TEST-2026',
    rentalStartDate: new Date('2026-02-10').getTime(),
    rentalEndDate: new Date('2026-03-10').getTime(),
    rentalDuration: 30,
    finalValue: 1500.50,
    paymentTerms: 'PIX',
    validityDays: '10',
    additionalNotes: 'PROPOSTA DE TESTE - Dados fictícios para demonstração'
  },
  customer: {
    name: 'João Silva (TESTE)',
    cpfCnpj: '123.456.789-00',
    email: process.env.TEST_EMAIL || 'frederico@gpecx.com.br', // Email de teste padrão
    phone: '(11) 98765-4321'
  },
  equipment: [
    {
      name: 'CMC356 - Omicron Test Set',
      serialNumber: 'SN-TEST-12345',
      rentPrice: 50.00
    },
    {
      name: 'Sverker 900 - Power Analyzer',
      serialNumber: 'SN-TEST-67890',
      rentPrice: 35.00
    }
  ]
};

// Função para gerar HTML da proposta (igual à Cloud Function)
function generateProposalHTML({ quote, customer, equipment }) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Proposta ${quote.quoteNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Arial', sans-serif; 
            color: #1f2937;
            line-height: 1.6;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: bold;
          }
          .header p {
            font-size: 16px;
            opacity: 0.9;
          }
          .content {
            padding: 30px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 15px;
            border-bottom: 2px solid #10b981;
            padding-bottom: 5px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          .info-item {
            background: #f9fafb;
            padding: 12px;
            border-radius: 4px;
          }
          .info-label {
            font-size: 12px;
            color: #6b7280;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 14px;
            color: #1f2937;
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          thead {
            background: #10b981;
            color: white;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            font-weight: bold;
            font-size: 14px;
          }
          td {
            font-size: 13px;
          }
          tbody tr:hover {
            background: #f9fafb;
          }
          .total-section {
            background: #f0fdf4;
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 20px;
            text-align: right;
            margin-top: 30px;
          }
          .total-label {
            font-size: 18px;
            color: #059669;
            margin-bottom: 5px;
          }
          .total-value {
            font-size: 36px;
            font-weight: bold;
            color: #10b981;
          }
          .notes {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin-top: 20px;
            font-size: 13px;
            line-height: 1.8;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PROPOSTA DE LOCAÇÃO</h1>
          <p>${quote.quoteNumber}</p>
        </div>

        <div class="content">
          <!-- Informações do Cliente -->
          <div class="section">
            <div class="section-title">Dados do Cliente</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Nome / Razão Social</div>
                <div class="info-value">${customer.name || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">CPF / CNPJ</div>
                <div class="info-value">${customer.cpfCnpj || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${customer.email || '-'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Telefone</div>
                <div class="info-value">${customer.phone || '-'}</div>
              </div>
            </div>
          </div>

          <!-- Período de Locação -->
          <div class="section">
            <div class="section-title">Período de Locação</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Data de Início</div>
                <div class="info-value">${new Date(quote.rentalStartDate).toLocaleDateString('pt-BR')}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Data de Término</div>
                <div class="info-value">${new Date(quote.rentalEndDate).toLocaleDateString('pt-BR')}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Duração</div>
                <div class="info-value">${quote.rentalDuration} dias</div>
              </div>
              <div class="info-item">
                <div class="info-label">Forma de Pagamento</div>
                <div class="info-value">${quote.paymentTerms}</div>
              </div>
            </div>
          </div>

          <!-- Equipamentos -->
          <div class="section">
            <div class="section-title">Equipamentos a Locar</div>
            <table>
              <thead>
                <tr>
                  <th>Equipamento</th>
                  <th>Número de Série</th>
                  <th style="text-align: right;">Diária</th>
                </tr>
              </thead>
              <tbody>
                ${equipment.map((eq) => `
                  <tr>
                    <td><strong>${eq.name || 'N/A'}</strong></td>
                    <td>${eq.serialNumber || '-'}</td>
                    <td style="text-align: right;">R$ ${(eq.rentPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Valor Total -->
          <div class="total-section">
            <div class="total-label">VALOR TOTAL DO PERÍODO</div>
            <div class="total-value">R$ ${quote.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>

          <!-- Observações -->
          ${quote.additionalNotes ? `
            <div class="notes">
              <strong>Observações:</strong><br/>
              ${quote.additionalNotes.replace(/\n/g, '<br/>')}
            </div>
          ` : ''}

          <!-- Footer -->
          <div class="footer">
            <p><strong>GPECX - Soluções em Locação de Equipamentos</strong></p>
            <p>Proposta válida por ${quote.validityDays} dias • Gerada automaticamente em ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Função para gerar PDF
async function generatePDF() {
  console.log('🎨 Gerando PDF da proposta...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const html = generateProposalHTML(testData);

    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    console.log(`✅ PDF gerado! (${pdfBuffer.length} bytes)`);
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

// Função para enviar email
async function sendEmail(pdfBuffer) {
  console.log(`📧 Enviando email para ${testData.customer.email}...`);

  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'propostas@gpecx.com.br',
    to: testData.customer.email,
    subject: `✨ TESTE - Proposta de Locação ${testData.quote.quoteNumber} - GPECX`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🎯 Proposta de Locação (TESTE)</h2>
        <p>Olá <strong>${testData.customer.name}</strong>,</p>
        <p>Este é um <strong>EMAIL DE TESTE</strong> da integração automática EXS → GPECX!</p>
        <p>Segue em anexo a proposta de locação número <strong>${testData.quote.quoteNumber}</strong>.</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p><strong>Detalhes da Proposta:</strong></p>
        <ul>
          <li>Período: ${new Date(testData.quote.rentalStartDate).toLocaleDateString('pt-BR')} a ${new Date(testData.quote.rentalEndDate).toLocaleDateString('pt-BR')}</li>
          <li>Duração: ${testData.quote.rentalDuration} dias</li>
          <li>Valor Total: R$ ${testData.quote.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>
        </ul>
        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <strong>⚠️ ATENÇÃO:</strong> Este é um email de teste com dados fictícios!
        </div>
        <p style="margin-top: 30px;">Atenciosamente,<br/><strong>Equipe GPECX</strong></p>
        <hr style="margin-top: 40px; border: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">
          ✅ Integração automática EXS → GPECX funcionando!<br/>
          Gerado automaticamente em ${new Date().toLocaleString('pt-BR')}
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `proposta-${testData.quote.quoteNumber}.pdf`,
        content: pdfBuffer
      }
    ]
  });

  console.log('✅ Email enviado com sucesso!');
  console.log('📬 ID:', result.data?.id);
  return result;
}

// Executar teste
async function runTest() {
  console.log('\n🚀 TESTE DE ENVIO DE PROPOSTA COMERCIAL\n');
  console.log('═'.repeat(50));

  // Validar configurações
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ ERRO: RESEND_API_KEY não configurada!');
    console.log('Configure em functions/.env');
    process.exit(1);
  }

  if (!testData.customer.email || testData.customer.email === 'seu-email@aqui.com') {
    console.error('❌ ERRO: Email de destino não configurado!');
    console.log('Edite este arquivo e altere a linha: email: "SEU-EMAIL@AQUI.COM"');
    process.exit(1);
  }

  console.log('📋 Dados do teste:');
  console.log('   Cliente:', testData.customer.name);
  console.log('   Email:', testData.customer.email);
  console.log('   Proposta:', testData.quote.quoteNumber);
  console.log('   Valor:', `R$ ${testData.quote.finalValue.toLocaleString('pt-BR')}`);
  console.log('');

  try {
    // Gerar PDF
    const pdfBuffer = await generatePDF();

    // Enviar email
    await sendEmail(pdfBuffer);

    console.log('\n═'.repeat(50));
    console.log('🎉 SUCESSO! Verifique seu email!');
    console.log('═'.repeat(50));
    console.log('\n✅ Checklist:');
    console.log('  ✓ PDF gerado com sucesso');
    console.log('  ✓ Email enviado via Resend');
    console.log('  ✓ Proposta anexada ao email');
    console.log('\n📧 Verifique sua caixa de entrada (e spam) em:', testData.customer.email);
    console.log('');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Executar
runTest();
