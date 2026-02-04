const admin = require('firebase-admin');

// Simular criação de pedido no Firebase
async function testOrderCreation() {
    // Dados de teste simulando um pedido do EXS
    const testOrder = {
        userId: 'test-user-123',
        status: 'pending_payment',
        paymentMethod: 'pix',
        finalTotal: 1500.50,
        customer: {
            name: 'João Silva Teste',
            cpfCnpj: '123.456.789-00',
            email: 'teste@exemplo.com',
            phone: '(11) 98765-4321'
        },
        items: [
            {
                type: 'rent',
                productName: 'CMC 356',
                quantity: 1,
                rentalPeriod: {
                    start: admin.firestore.Timestamp.fromDate(new Date('2026-02-10')),
                    end: admin.firestore.Timestamp.fromDate(new Date('2026-03-10'))
                }
            }
        ],
        addons: [
            { name: 'Seguro Completo' },
            { name: 'Entrega' }
        ],
        payment: {
            asaasId: 'pay_test_123456'
        },
        createdAt: admin.firestore.Timestamp.now()
    };

    console.log('📝 Criando pedido de teste...');
    console.log(JSON.stringify(testOrder, null, 2));

    return testOrder;
}

// Exportar para uso
module.exports = { testOrder: testOrderCreation() };

console.log('✅ Teste preparado!');
console.log('\n📌 INSTRUÇÕES:');
console.log('1. Inicie os emuladores: firebase emulators:start');
console.log('2. Acesse o Firestore UI: http://localhost:4000/firestore');
console.log('3. Crie um documento na coleção "orders" com os dados acima');
console.log('4. A função onOrderCreated será disparada automaticamente!');
console.log('5. Veja os logs no console do emulador\n');
