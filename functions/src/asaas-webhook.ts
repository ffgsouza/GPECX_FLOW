import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';


export const handleAsaasWebhook = functions.region('southamerica-east1').https.onRequest(async (req, res) => {
    const db = getFirestore();
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    const eventData = req.body;
    const { event, payment } = eventData;

    console.log(`[ASAAS-WEBHOOK] Event Received: ${event}`, JSON.stringify(payment));

    if (event !== 'PAYMENT_CONFIRMED') {
        console.log(`[ASAAS-WEBHOOK] Ignoring event: ${event}`);
        res.json({ received: true, ignored: true });
        return;
    }

    try {
        // 1. Map Asaas Payment to Firestore Order
        // We need to find the customer in our DB or create one from Asaas data if possible
        // For now, we will try to find by 'asaasId' field if we store it, or email.

        // Mocking Customer mapping for now - in production we should fetch from Asaas API if not in body
        const orderData = {
            source: 'asaas_webhook',
            asaasId: payment.id,
            externalReference: payment.externalReference,
            status: 'paid', // confirmed payment
            amount: payment.value,
            createdAt: new Date(),
            customer: {
                // In a real scenario, we might need to fetch customer details from Asaas if not fully provided
                asaasId: payment.customer,
                // We'll fill other fields if they come in the webhook or by fetching Asaas API
            },
            items: [
                {
                    type: 'rent', // Assuming it's a rental for now, logic might need adjustment based on Description
                    productName: payment.description || 'Locação de Equipamento',
                    price: payment.value,
                    quantity: 1
                }
            ]
        };

        // 2. Save to Firestore 'orders' collection
        // This will TRIGGER 'onOrderCreated' automatically!
        const docRef = await db.collection('orders').add(orderData);
        console.log(`[ASAAS-WEBHOOK] Order created with ID: ${docRef.id}`);

        res.json({ received: true, orderId: docRef.id });

    } catch (error) {
        console.error('[ASAAS-WEBHOOK] Error processing payment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
