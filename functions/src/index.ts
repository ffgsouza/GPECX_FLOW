import * as functions from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import PDFDocument from 'pdfkit';
import { Resend } from 'resend';

initializeApp();
const db = getFirestore();

// Initialize Resend (API key will be set inside the function)
// const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Cloud Function que dispara automaticamente quando um pedido é criado
 * no EXS Locações. Gera proposta de locação no GPECX e envia por email.
 */
export const onOrderCreated = functions.region('southamerica-east1')
  .runWith({
    memory: '1GB',
    timeoutSeconds: 300
  })
  .firestore.document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    // Initialize Resend with env var
    const resend = new Resend(process.env.RESEND_API_KEY);

    const order = snap.data();
    const orderId = context.params.orderId;

    if (!order) {
      console.log('[SKIP] Order data is null');
      return;
    }

    try {
      console.log(`[TRIGGER] Novo pedido criado: ${orderId}`);
      console.log(`[INFO] Customer: ${order.customer?.name}`);

      // 1. Verificar se é pedido de locação
      const rentalItems = (order.items || []).filter((item: any) => item.type === 'rent');
      if (rentalItems.length === 0) {
        console.log('[SKIP] Pedido não contém itens de locação');
        return;
      }
      console.log(`[STEP 1] Pedido contém ${rentalItems.length} itens de locação`);

      // 2. Buscar equipamentos no GPECX
      const equipmentsSnapshot = await db.collection('rental_equipments').get();
      const allEquipments = equipmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`[STEP 2] Carregados ${allEquipments.length} equipamentos do GPECX`);

      // 3. Mapear equipamentos do pedido para GPECX
      const selectedEquipments = rentalItems.map((item: any) => {
        const equipment = allEquipments.find((eq: any) => {
          const eqName = (eq.name || '').toLowerCase();
          const itemName = (item.productName || '').toLowerCase();
          return eqName.includes(itemName) || itemName.includes(eqName);
        });

        if (equipment) {
          console.log(`[MATCH] "${item.productName}" → "${(equipment as any).name}"`);
        }

        return equipment;
      }).filter((eq: any) => eq !== undefined);

      console.log(`[STEP 3] ${selectedEquipments.length} equipamentos mapeados`);

      if (selectedEquipments.length === 0) {
        console.log('[SKIP] Nenhum equipamento encontrado no GPECX');
        return;
      }

      // 4. Criar ou buscar cliente no GPECX
      const customersSnapshot = await db.collection('customers').get();
      let customer: any = customersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .find((c: any) => c.cpfCnpj === order.customer?.cpfCnpj);

      if (!customer) {
        console.log('[STEP 4] Criando novo cliente no GPECX...');
        const customerRef = await db.collection('customers').add({
          name: order.customer?.name,
          email: order.customer?.email,
          cpfCnpj: order.customer?.cpfCnpj,
          phone: order.customer?.phone,
          source: 'exs_locacoes',
          createdAt: new Date().getTime()
        });
        customer = {
          id: customerRef.id,
          name: order.customer?.name,
          email: order.customer?.email,
          cpfCnpj: order.customer?.cpfCnpj
        };
      } else {
        console.log(`[STEP 4] Cliente existente encontrado: ${customer.name}`);
      }

      // 5. Gerar número de proposta
      const year = new Date().getFullYear();
      const quotesSnapshot = await db.collection('quotes')
        .where('quoteNumber', '>=', `PLE-001-${year}`)
        .where('quoteNumber', '<=', `PLE-999-${year}`)
        .get();
      const nextNumber = (quotesSnapshot.size + 1).toString().padStart(3, '0');
      const quoteNumber = `PLE-${nextNumber}-${year}`;
      console.log(`[STEP 5] Número de proposta gerado: ${quoteNumber}`);

      // 6. Calcular período de locação
      const firstRentalItem = rentalItems[0];
      const startDate = firstRentalItem.rentalPeriod?.start?.toDate() || new Date();
      const endDate = firstRentalItem.rentalPeriod?.end?.toDate() || new Date();
      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`[STEP 6] Período: ${durationDays} dias (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`);

      // 7. Criar Quote no GPECX
      const quoteData = {
        quoteNumber,
        customerId: customer.id,
        customerName: customer.name,
        equipmentIds: selectedEquipments.map((eq: any) => eq.id),
        quoteType: 'RENTAL',
        rentalStartDate: startDate.getTime(),
        rentalEndDate: endDate.getTime(),
        rentalDuration: durationDays,
        totalValue: order.finalTotal || 0,
        discountPercent: 0,
        discountValue: 0,
        finalValue: order.finalTotal || 0,
        paymentTerms: order.paymentMethod || 'PIX',
        validityDays: '10',
        additionalNotes: `Pedido EXS: ${orderId}\nAddons: ${(order.addons || []).map((a: any) => a.name).join(', ')}`,
        status: 'SENT',
        source: 'exs_locacoes',
        metadata: {
          exsOrderId: orderId,
          paymentId: order.payment?.asaasId
        },
        createdAt: new Date().getTime()
      };

      const quoteRef = await db.collection('quotes').add(quoteData);
      console.log(`[STEP 7] Quote criado no GPECX: ${quoteRef.id}`);

      // 8. Gerar PDF da proposta
      console.log('[STEP 8] Gerando PDF da proposta...');
      const pdfBuffer = await generateProposalPDF({
        quote: quoteData,
        customer,
        equipment: selectedEquipments
      });
      console.log(`[STEP 8] PDF gerado com sucesso (${pdfBuffer.length} bytes)`);

      // 9. Enviar email (se o cliente tiver email)
      if (customer.email) {
        console.log(`[STEP 9] Enviando email para ${customer.email}...`);
        await resend.emails.send({
          from: 'Integração GPECX <onboarding@resend.dev>',
          to: customer.email,
          subject: `Proposta de Locação ${quoteNumber} - GPECX`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">Proposta de Locação</h2>
              <p>Olá <strong>${customer.name}</strong>,</p>
              <p>Segue em anexo a proposta de locação número <strong>${quoteNumber}</strong>.</p>
              <p>Detalhes do pedido:</p>
              <ul>
                <li>Período: ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}</li>
                <li>Duração: ${durationDays} dias</li>
                <li>Valor Total: R$ ${(order.finalTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>
              </ul>
              <p>Atenciosamente,<br/><strong>Equipe GPECX</strong></p>
            </div>
          `,
          attachments: [
            {
              filename: `proposta-${quoteNumber}.pdf`,
              content: pdfBuffer
            }
          ]
        });
        console.log('[SUCCESS] Email enviado com sucesso!');
      }

      // 10. Atualizar pedido com informações da proposta
      if (snap.exists) {
        await snap.ref.update({
          proposalSent: true,
          proposalSentAt: new Date(),
          quoteId: quoteRef.id,
          quoteNumber
        });
      }

      console.log(`[DONE] ✅ Proposta ${quoteNumber} gerada e enviada com sucesso!`);

    } catch (error) {
      console.error('[ERROR] Falha ao processar pedido:', error);
      // Não falhar o trigger, apenas logar erro
      // Firebase tentará novamente automaticamente se necessário
    }
  }
  );

/**
 * Função auxiliar para gerar PDF da proposta usando PDFKit (nativo Node.js)
 */
async function generateProposalPDF({ quote, customer, equipment }: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header com fundo verde
      doc.rect(0, 0, 612, 150).fill('#10b981');

      // Título
      doc.fillColor('#ffffff')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('PROPOSTA DE LOCAÇÃO', 50, 50, { align: 'center' });

      doc.fontSize(16)
        .text(quote.quoteNumber, 50, 90, { align: 'center' });

      // Reset para conteúdo
      let yPos = 180;
      doc.fillColor('#000000');

      // Seção: Dados do Cliente
      doc.fontSize(16)
        .fillColor('#10b981')
        .font('Helvetica-Bold')
        .text('Dados do Cliente', 50, yPos);

      yPos += 25;
      doc.fontSize(10)
        .fillColor('#000000')
        .font('Helvetica');

      doc.text(`Nome: ${customer.name || '-'}`, 50, yPos);
      doc.text(`CPF/CNPJ: ${customer.cpfCnpj || '-'}`, 320, yPos);
      yPos += 20;
      doc.text(`Email: ${customer.email || '-'}`, 50, yPos);
      doc.text(`Telefone: ${customer.phone || '-'}`, 320, yPos);
      yPos += 35;

      // Seção: Período de Locação
      doc.fontSize(16)
        .fillColor('#10b981')
        .font('Helvetica-Bold')
        .text('Período de Locação', 50, yPos);

      yPos += 25;
      doc.fontSize(10)
        .fillColor('#000000')
        .font('Helvetica');

      const startDate = new Date(quote.rentalStartDate).toLocaleDateString('pt-BR');
      const endDate = new Date(quote.rentalEndDate).toLocaleDateString('pt-BR');

      doc.text(`Início: ${startDate}`, 50, yPos);
      doc.text(`Término: ${endDate}`, 320, yPos);
      yPos += 20;
      doc.text(`Duração: ${quote.rentalDuration} dias`, 50, yPos);
      doc.text(`Pagamento: ${quote.paymentTerms}`, 320, yPos);
      yPos += 35;

      // Seção: Equipamentos
      doc.fontSize(16)
        .fillColor('#10b981')
        .font('Helvetica-Bold')
        .text('Equipamentos a Locar', 50, yPos);

      yPos += 25;

      // Tabela de equipamentos
      doc.fontSize(10)
        .fillColor('#ffffff')
        .font('Helvetica-Bold');

      doc.rect(50, yPos, 512, 25).fill('#10b981');
      doc.text('Equipamento', 60, yPos + 8);
      doc.text('Número de Série', 260, yPos + 8);
      doc.text('Diária', 450, yPos + 8);

      yPos += 25;
      doc.fillColor('#000000').font('Helvetica');

      equipment.forEach((eq: any, index: number) => {
        if (index % 2 === 0) {
          doc.rect(50, yPos, 512, 25).fill('#f9fafb');
        }

        doc.fillColor('#000000');
        doc.text(eq.name || 'N/A', 60, yPos + 8, { width: 190 });
        doc.text(eq.serialNumber || '-', 260, yPos + 8);
        doc.text(`R$ ${(eq.rentPrice || 0).toFixed(2)}`, 450, yPos + 8);

        yPos += 25;
      });

      yPos += 20;

      // Valor Total
      doc.rect(50, yPos, 512, 70).fillAndStroke('#f0fdf4', '#10b981');

      doc.fontSize(12)
        .fillColor('#059669')
        .font('Helvetica-Bold')
        .text('VALOR TOTAL DO PERÍODO', 50, yPos + 15, { align: 'center', width: 512 });

      doc.fontSize(24)
        .fillColor('#10b981')
        .text(`R$ ${quote.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          50, yPos + 35, { align: 'center', width: 512 });

      yPos += 90;

      // Observações (se houver)
      if (quote.additionalNotes) {
        doc.fontSize(10)
          .fillColor('#000000')
          .font('Helvetica')
          .text(`Observações: ${quote.additionalNotes}`, 50, yPos, { width: 512 });
        yPos += 40;
      }

      // Footer
      doc.fontSize(8)
        .fillColor('#6b7280')
        .text('GPECX - Soluções em Locação de Equipamentos', 50, 750, { align: 'center', width: 512 });
      doc.text(`Proposta válida por ${quote.validityDays} dias • Gerada em ${new Date().toLocaleDateString('pt-BR')}`,
        50, 765, { align: 'center', width: 512 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
