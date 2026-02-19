import * as functions from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
// import PDFDocument from 'pdfkit'; // O código de PDF está agora em ./proposal-layout.ts
import { Resend } from 'resend';
import { handleAsaasWebhook } from './asaas-webhook';
import { generateProposalPDF } from './proposal-layout';

export { handleAsaasWebhook };

initializeApp();


// Initialize Resend (API key will be set inside the function)
// const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Cloud Function que dispara automaticamente quando uma proposta (Quote) de LOCAÇÃO
 * é criada no GPECX via calculator-form. Gera o PDF e envia por email ao cliente.
 */
export const onQuoteCreated = functions.region('southamerica-east1')
  .runWith({
    memory: '1GB',
    timeoutSeconds: 300
  })
  .firestore.document('quotes/{quoteId}')
  .onCreate(async (snap, context) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const quote = snap.data();
    const quoteId = context.params.quoteId;

    if (!quote) {
      console.log('[SKIP] Quote data is null');
      return;
    }

    // Só processar propostas de LOCAÇÃO
    if (quote.type !== 'RENTAL') {
      console.log(`[SKIP] Quote ${quoteId} não é RENTAL (type=${quote.type})`);
      return;
    }

    // Evitar reenvio se já enviado
    if (quote.proposalSent === true) {
      console.log(`[SKIP] Proposta ${quoteId} já foi enviada anteriormente`);
      return;
    }

    try {
      console.log(`[TRIGGER] Nova proposta de locação criada: ${quoteId} - ${quote.number}`);

      // 1. Extrair dados do cliente (a Quote já tem tudo embutido)
      const customerData = quote.customerData || {};
      const vendorData = quote.vendorData || {};
      const proposalData = quote.proposalData || {};

      const customerEmail = customerData.email || '';
      const customerName = customerData.tradeName || customerData.companyName || customerData.name || 'Cliente';

      console.log(`[INFO] Cliente: ${customerName} <${customerEmail}>`);

      if (!customerEmail) {
        console.log('[SKIP] Cliente sem email cadastrado');
        return;
      }

      // 2. Extrair equipamentos da quote (items)
      const items = quote.items || [];
      if (items.length === 0) {
        console.log('[SKIP] Proposta sem itens');
        return;
      }

      const equipment = items.map((item: any) => ({
        name: item.name || item.productName || 'Equipamento',
        serialNumber: item.serialNumber || item.code || undefined,
        rentPrice: item.rentPrice || item.price || 0,
      }));

      // 3. Calcular datas e duração
      const rentalStartDate = proposalData.rentalStartDate || Date.now();
      const rentalEndDate = proposalData.rentalEndDate || Date.now();
      const rentalDuration = proposalData.rentalDuration || 1;

      // 4. Valor final
      const finalValue = quote.totals?.suggestedPrice || quote.totals?.tablePrice || 0;

      // 5. Gerar número de proposta formatado
      const quoteNumber = quote.number || `PLE-${quoteId.substring(0, 6).toUpperCase()}`;

      console.log(`[STEP] Gerando PDF para proposta ${quoteNumber}`);
      console.log(`[STEP] Equipamentos: ${equipment.map((e: any) => e.name).join(', ')}`);
      console.log(`[STEP] Valor: R$ ${finalValue}`);

      // 6. Gerar PDF da proposta
      const pdfBuffer = await generateProposalPDF({
        quote: {
          quoteNumber,
          rentalStartDate,
          rentalEndDate,
          rentalDuration,
          finalValue,
          paymentTerms: proposalData.paymentTerms || 'PIX',
          validityDays: proposalData.validityDays || '10',
          additionalNotes: proposalData.additionalNotes,
          description: quote.revisions?.[0]?.description || 'Emissão Inicial',
        },
        customer: {
          name: customerData.companyName || customerName,
          cpfCnpj: customerData.cnpj || customerData.cpfCnpj || '',
          email: customerEmail,
          phone: customerData.phone || '',
          contactName: customerData.contactName || '',
          tradeName: customerData.tradeName || '',
        },
        equipment,
        vendor: vendorData.name ? {
          name: vendorData.name,
          email: vendorData.email || '',
          phone: vendorData.phone || '',
          initials: vendorData.initials || '',
        } : undefined,
      });

      console.log(`[STEP] PDF gerado com sucesso (${pdfBuffer.length} bytes)`);

      // 7. Enviar email com o PDF em anexo
      const startDateStr = new Date(rentalStartDate).toLocaleDateString('pt-BR');
      const endDateStr = new Date(rentalEndDate).toLocaleDateString('pt-BR');
      const finalValueStr = finalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const vendorName = vendorData.name || 'Equipe EXS Solutions';
      const vendorEmail = vendorData.email || 'comercial@gpecx.com';
      const vendorPhone = vendorData.phone || '(19) 3468-0000';

      await resend.emails.send({
        from: `EXS Solutions <onboarding@resend.dev>`,
        to: customerEmail,
        subject: `Proposta de Locação ${quoteNumber} - EXS Solutions`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
            <div style="background: #061629; padding: 24px 32px; border-radius: 8px 8px 0 0;">
              <h1 style="color: #10B981; margin: 0; font-size: 20px;">EXS SOLUTIONS</h1>
              <p style="color: #94a3b8; margin: 4px 0 0; font-size: 12px;">INOVAÇÃO QUE DEFINE SOLUÇÕES</p>
            </div>
            <div style="background: #f8fafc; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px; margin: 0 0 16px;">Olá, <strong>${customerName}</strong>!</p>
              <p style="margin: 0 0 24px; color: #64748b;">
                Segue em anexo a proposta comercial de locação número 
                <strong style="color: #10B981;">${quoteNumber}</strong>, 
                conforme solicitado.
              </p>
              
              <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="color: #065f46; margin: 0 0 12px; font-size: 14px;">📋 RESUMO DA PROPOSTA</h3>
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Período:</td>
                    <td style="padding: 4px 0; font-weight: bold;">${startDateStr} a ${endDateStr}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Duração:</td>
                    <td style="padding: 4px 0; font-weight: bold;">${rentalDuration} dia(s)</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Equipamentos:</td>
                    <td style="padding: 4px 0; font-weight: bold;">${equipment.map((e: any) => e.name).join(', ')}</td>
                  </tr>
                  <tr style="border-top: 1px solid #a7f3d0;">
                    <td style="padding: 8px 0 4px; color: #065f46; font-weight: bold;">Valor Total:</td>
                    <td style="padding: 8px 0 4px; font-weight: bold; color: #10B981; font-size: 16px;">${finalValueStr}</td>
                  </tr>
                </table>
              </div>

              <p style="color: #64748b; font-size: 13px;">
                A proposta completa está disponível em PDF em anexo. 
                Em caso de dúvidas, entre em contato conosco.
              </p>

              <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 20px;">
                <p style="margin: 0; font-weight: bold; color: #1e293b;">${vendorName}</p>
                <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">EXS Solutions – Departamento Comercial</p>
                <p style="margin: 4px 0 0; color: #10B981; font-size: 13px;">${vendorPhone} | ${vendorEmail}</p>
              </div>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `proposta-${quoteNumber}.pdf`,
            content: pdfBuffer,
          }
        ]
      });

      console.log(`[SUCCESS] ✅ Email enviado para ${customerEmail}`);

      // 8. Marcar a quote como proposta enviada
      await snap.ref.update({
        proposalSent: true,
        proposalSentAt: Date.now(),
        proposalSentTo: customerEmail,
      });

      console.log(`[DONE] ✅ Proposta ${quoteNumber} gerada e enviada com sucesso!`);

    } catch (error) {
      console.error('[ERROR] Falha ao processar proposta:', error);
    }
  });

/**
 * Cloud Function legado - mantido para compatibilidade com o webhook do Asaas.
 * Dispara quando um pedido é criado na collection 'orders'.
 */
export const onOrderCreated = functions.region('southamerica-east1')
  .runWith({
    memory: '1GB',
    timeoutSeconds: 300
  })
  .firestore.document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const orderId = context.params.orderId;

    if (!order) {
      console.log('[SKIP] Order data is null');
      return;
    }

    console.log(`[onOrderCreated] Pedido criado via webhook Asaas: ${orderId}`, JSON.stringify(order));
    // A proposta agora é enviada via onQuoteCreated quando o operador salva a proposta no sistema.
    // Este trigger registra a confirmação de pagamento apenas para log/auditoria.
  });
