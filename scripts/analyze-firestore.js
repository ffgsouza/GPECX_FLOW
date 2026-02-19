// Script simplificado para explorar Firestore via client SDK (não Admin)
// Usa as mesmas credenciais que a aplicação Next.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, getCountFromServer, limit, query } = require('firebase/firestore');

// Configuração do Firebase (mesmas credenciais do .env.local)
const firebaseConfig = {
    apiKey: "AIzaSyAhn85m2KDDeIZE51uHem5MHM0VwoNlWaU",
    authDomain: "comexs-r1g97.firebaseapp.com",
    projectId: "comexs-r1g97",
    storageBucket: "comexs-r1g97.firebasestorage.app",
    messagingSenderId: "1083099377370",
    appId: "1:1083099377370:web:abd9647fbd14f75ea4bfe3"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Lista de coleções conhecidas do projeto (baseado no firestore.rules)
const KNOWN_COLLECTIONS = [
    'users',
    'customers',
    'quotes',
    'orders',
    'vendors',
    'products',
    'categories',
    'product_types',
    'companies',
    'rental_equipments',
    'product_kits',
    'settings'
];

async function analyzeCollection(collectionName) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📂 Coleção: ${collectionName.toUpperCase()}`);
    console.log('='.repeat(70));

    try {
        const colRef = collection(db, collectionName);

        // Tentar pegar contagem
        let totalCount = 0;
        try {
            const countSnapshot = await getCountFromServer(colRef);
            totalCount = countSnapshot.data().count;
            console.log(`📊 Total de documentos: ${totalCount}`);
        } catch (e) {
            console.log(`⚠️  Não foi possível contar (pode requerer autenticação)`);
        }

        if (totalCount === 0) {
            console.log(`❌ Coleção vazia ou sem permissão de leitura`);
            return { name: collectionName, count: 0, samples: [], accessible: false };
        }

        // Pegar alguns exemplos
        const q = query(colRef, limit(3));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log(`❌ Nenhum documento acessível`);
            return { name: collectionName, count: totalCount, samples: [], accessible: false };
        }

        console.log(`\n✅ Documentos acessíveis: ${snapshot.size}`);
        console.log(`\n📄 Exemplos (máximo 3):\n`);

        const samples = [];
        snapshot.forEach((doc, index) => {
            const data = doc.data();
            samples.push({ id: doc.id, data });

            console.log(`  ${index + 1}. ID: ${doc.id}`);
            console.log(`     Campos: ${Object.keys(data).join(', ')}`);

            // Mostrar alguns dados (limitado)
            const preview = JSON.stringify(data, null, 2);
            if (preview.length > 300) {
                console.log(`     Preview: ${preview.substring(0, 300)}...`);
            } else {
                console.log(`     Dados: ${preview}`);
            }
            console.log('');
        });

        return {
            name: collectionName,
            count: totalCount,
            samples,
            fields: samples.length > 0 ? Object.keys(samples[0].data) : [],
            accessible: true
        };

    } catch (error) {
        console.error(`❌ Erro ao acessar ${collectionName}:`, error.code || error.message);
        return { name: collectionName, error: error.code || error.message, accessible: false };
    }
}

async function main() {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 ANÁLISE COMPLETA DO FIRESTORE - GPECX FLOW');
    console.log('='.repeat(70));
    console.log(`📦 Projeto: ${firebaseConfig.projectId}`);
    console.log(`� Data: ${new Date().toLocaleString('pt-BR')}`);
    console.log('='.repeat(70));

    const report = {
        project: firebaseConfig.projectId,
        analyzedAt: new Date().toISOString(),
        collections: []
    };

    console.log(`\n🎯 Analisando ${KNOWN_COLLECTIONS.length} coleções conhecidas...\n`);

    for (const collectionName of KNOWN_COLLECTIONS) {
        const analysis = await analyzeCollection(collectionName);
        report.collections.push(analysis);

        // Pequena pausa entre requisições
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Resumo final
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMO DA ANÁLISE');
    console.log('='.repeat(70));

    const accessible = report.collections.filter(c => c.accessible);
    const withData = accessible.filter(c => c.count > 0);
    const empty = accessible.filter(c => c.count === 0);
    const errors = report.collections.filter(c => c.error);

    console.log(`\n✅ Coleções acessíveis com dados: ${withData.length}`);
    withData.forEach(col => {
        console.log(`   - ${col.name}: ${col.count} documentos`);
    });

    if (empty.length > 0) {
        console.log(`\n⚪ Coleções vazias: ${empty.length}`);
        empty.forEach(col => console.log(`   - ${col.name}`));
    }

    if (errors.length > 0) {
        console.log(`\n❌ Erros de acesso: ${errors.length}`);
        errors.forEach(col => console.log(`   - ${col.name}: ${col.error}`));
    }

    // Salvar relatório
    const fs = require('fs');
    const reportPath = './firestore-analysis-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    console.log(`\n💾 Relatório completo salvo em: ${reportPath}`);
    console.log('='.repeat(70));

    process.exit(0);
}

main().catch(console.error);
