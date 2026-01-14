'use client';

import { useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2 } from 'lucide-react';

const DEFAULT_ACCESSORIES = [
    { id: `acc-${Date.now()}-1`, name: 'Cabo de Aterramento', imageUrl: null },
    { id: `acc-${Date.now()}-2`, name: 'Cabo Ethernet RJ45', imageUrl: null },
    { id: `acc-${Date.now()}-3`, name: 'Case de Transporte', imageUrl: null },
    { id: `acc-${Date.now()}-4`, name: 'Fonte AC', imageUrl: null },
    { id: `acc-${Date.now()}-5`, name: 'Kit de Cabos de Teste', imageUrl: null },
    { id: `acc-${Date.now()}-6`, name: 'Kit de Conectores Variados', imageUrl: null },
    { id: `acc-${Date.now()}-7`, name: 'Suporte de Apoio', imageUrl: null },
];

export default function MigrateAccessoriesPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [summary, setSummary] = useState<{ updated: number; errors: number; total: number } | null>(null);

    const addLog = (message: string) => {
        setLog(prev => [...prev, message]);
    };

    const runMigration = async () => {
        setIsRunning(true);
        setLog([]);
        setSummary(null);

        addLog('🔄 Iniciando migração de acessórios...\n');

        try {
            const equipmentsRef = collection(db, 'rentalEquipments');
            const snapshot = await getDocs(equipmentsRef);

            addLog(`📦 Total de equipamentos encontrados: ${snapshot.size}\n`);

            let updated = 0;
            let errors = 0;

            for (const docSnap of snapshot.docs) {
                try {
                    const equipmentId = docSnap.id;
                    const equipmentData = docSnap.data();
                    const equipmentName = equipmentData.name || 'Sem nome';

                    const currentAccessories = equipmentData.accessories || [];

                    const convertedAccessories = currentAccessories.map((acc: any) => {
                        if (typeof acc === 'string') {
                            return {
                                id: `converted-${Date.now()}-${Math.random()}`,
                                name: acc,
                                imageUrl: null
                            };
                        }
                        return acc;
                    });

                    const existingNames = new Set(convertedAccessories.map((acc: any) => acc.name));

                    const newAccessories = DEFAULT_ACCESSORIES.filter(acc => !existingNames.has(acc.name));

                    if (newAccessories.length > 0) {
                        const allAccessories = [...convertedAccessories, ...newAccessories];

                        await updateDoc(doc(db, 'rentalEquipments', equipmentId), {
                            accessories: allAccessories
                        });

                        addLog(`✅ ${equipmentName}: ${newAccessories.length} acessórios adicionados`);
                        updated++;
                    } else {
                        addLog(`⏭️  ${equipmentName}: Já possui todos os acessórios`);
                    }

                } catch (error) {
                    addLog(`❌ Erro ao processar: ${error}`);
                    errors++;
                }
            }

            setSummary({ total: snapshot.size, updated, errors });

            addLog('\n' + '='.repeat(50));
            addLog('✨ Migração concluída!');
            addLog(`   Equipamentos atualizados: ${updated}`);
            addLog(`   Erros: ${errors}`);
            addLog('='.repeat(50));

        } catch (error) {
            addLog(`❌ Erro fatal: ${error}`);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="container max-w-4xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Migração de Acessórios Padrão</CardTitle>
                    <CardDescription>
                        Adicionar acessórios padrão a todos os equipamentos de locação
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    <div>
                        <h3 className="font-semibold mb-2">Acessórios que serão adicionados:</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {DEFAULT_ACCESSORIES.map(acc => (
                                <li key={acc.id}>{acc.name}</li>
                            ))}
                        </ul>
                    </div>

                    <Button
                        onClick={runMigration}
                        disabled={isRunning}
                        className="w-full"
                        size="lg"
                    >
                        {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isRunning ? 'Executando migração...' : 'Executar Migração'}
                    </Button>

                    {summary && (
                        <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Concluído:</strong> {summary.updated} equipamentos atualizados de {summary.total} total
                                {summary.errors > 0 && ` (${summary.errors} erros)`}
                            </AlertDescription>
                        </Alert>
                    )}

                    {log.length > 0 && (
                        <div className="border rounded-lg p-4 bg-slate-50 max-h-96 overflow-y-auto">
                            <h3 className="font-semibold mb-2 text-sm">Log de Execução:</h3>
                            <pre className="text-xs font-mono whitespace-pre-wrap">{log.join('\n')}</pre>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
