/**
 * Script para adicionar acessórios padrão a todos os equipamentos de locação
 * 
 * Execute este script com: npx ts-node scripts/add-default-accessories.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Configuração do Firebase (ajuste conforme necessário)
const firebaseConfig = {
    // Cole aqui a configuração do seu Firebase
    // Você pode pegar isso do seu arquivo de configuração existente
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Acessórios padrão que serão adicionados
const defaultAccessories = [
    { id: Date.now().toString() + '-1', name: 'Cabo de Aterramento', imageUrl: null },
    { id: Date.now().toString() + '-2', name: 'Cabo Ethernet RJ45', imageUrl: null },
    { id: Date.now().toString() + '-3', name: 'Case de Transporte', imageUrl: null },
    { id: Date.now().toString() + '-4', name: 'Fonte AC', imageUrl: null },
    { id: Date.now().toString() + '-5', name: 'Kit de Cabos de Teste', imageUrl: null },
    { id: Date.now().toString() + '-6', name: 'Kit de Conectores Variados', imageUrl: null },
    { id: Date.now().toString() + '-7', name: 'Suporte de Apoio', imageUrl: null },
];

async function addDefaultAccessoriesToAllEquipments() {
    try {
        console.log('🔄 Iniciando migração de acessórios...\n');

        // Buscar todos os equipamentos de locação
        const equipmentsRef = collection(db, 'rentalEquipments');
        const snapshot = await getDocs(equipmentsRef);

        console.log(`📦 Total de equipamentos encontrados: ${snapshot.size}\n`);

        let updated = 0;
        let errors = 0;

        // Atualizar cada equipamento
        for (const docSnap of snapshot.docs) {
            try {
                const equipmentId = docSnap.id;
                const equipmentData = docSnap.data();
                const equipmentName = equipmentData.name || 'Sem nome';

                // Verificar se já tem acessórios
                const currentAccessories = equipmentData.accessories || [];

                // Mesclar acessórios existentes com os novos (evitar duplicatas por nome)
                const existingNames = new Set(
                    currentAccessories.map((acc: any) =>
                        typeof acc === 'string' ? acc : acc.name
                    )
                );

                const newAccessories = defaultAccessories.filter(
                    acc => !existingNames.has(acc.name)
                );

                if (newAccessories.length > 0) {
                    // Converter acessórios antigos (string) para novo formato se necessário
                    const convertedAccessories = currentAccessories.map((acc: any) => {
                        if (typeof acc === 'string') {
                            return {
                                id: Date.now().toString() + '-old-' + Math.random(),
                                name: acc,
                                imageUrl: null
                            };
                        }
                        return acc;
                    });

                    const allAccessories = [...convertedAccessories, ...newAccessories];

                    // Atualizar o documento
                    await updateDoc(doc(db, 'rentalEquipments', equipmentId), {
                        accessories: allAccessories
                    });

                    console.log(`✅ ${equipmentName}: ${newAccessories.length} acessórios adicionados`);
                    updated++;
                } else {
                    console.log(`⏭️  ${equipmentName}: Já possui todos os acessórios`);
                }

            } catch (error) {
                console.error(`❌ Erro ao atualizar equipamento:`, error);
                errors++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`✨ Migração concluída!`);
        console.log(`   Equipamentos atualizados: ${updated}`);
        console.log(`   Erros: ${errors}`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Erro fatal na migração:', error);
        process.exit(1);
    }
}

// Executar o script
addDefaultAccessoriesToAllEquipments()
    .then(() => {
        console.log('\n✅ Script finalizado com sucesso!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erro ao executar script:', error);
        process.exit(1);
    });
