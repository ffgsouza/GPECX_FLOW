'use client';

import { useState } from 'react';
import { writeBatch, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { initializeFirebase } from '@/firebase';

const productTypesData = {
  hardware: { name: 'Hardware', requiresWeight: true, requiresNcm: true, taxRules: 'standard_import' },
  software: { name: 'Licença de Software', requiresWeight: false, requiresNcm: false, taxRules: 'service_import' },
  accessory: { name: 'Acessório', requiresWeight: true, requiresNcm: true, taxRules: 'standard_import' },
};

const categoriesData = {
  universal_test: { name: 'Universal Test Set', icon: 'zap' },
  relay_test: { name: 'Protection Relay Tester', icon: 'shield' },
  analyzer: { name: 'CT/PT Analyzer', icon: 'activity' },
  amplifier: { name: 'Amplifier', icon: 'bar-chart' },
  meter: { name: 'Power Meters', icon: 'cpu' },
  accessories: { name: 'Acessórios Gerais', icon: 'tool' },
};

const productsData = {
  kfa320_adv: {
    name: 'KFA320 (6x20A) Advanced',
    categoryId: 'universal_test',
    productTypeId: 'hardware',
    costUSD: 18000.0,
    netWeightKg: 18.0,
    ncm: '90303319',
  },
  kfa320_soft_adv: {
    name: 'Software Advanced Package KFA320',
    categoryId: 'universal_test',
    productTypeId: 'software',
    costUSD: 5000.0,
  },
  acc_bag: {
    name: 'All-in-one Bag',
    categoryId: 'accessories',
    productTypeId: 'accessory',
    costUSD: 50.0,
    netWeightKg: 1.5,
  },
  kf85p: {
    name: 'KF85P Universal Test Set',
    categoryId: 'universal_test',
    productTypeId: 'hardware',
    costUSD: 20000.0,
    netWeightKg: 22.0,
    ncm: '90303319'
  },
};

export default function SeedPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { toast } = useToast();

  const handleSeed = async () => {
    setIsLoading(true);
    setLogs([]);
    
    const addLog = (message: string) => {
      setLogs(prev => [...prev, message]);
    };

    const { db } = initializeFirebase();

    if (!db) {
        addLog('❌ Erro: Conexão com o Firestore não estabelecida. Tente recarregar a página.');
        setIsLoading(false);
        toast({
          title: 'Erro de Conexão',
          description: 'Não foi possível conectar ao Firestore. Verifique as configurações e sua conexão.',
          variant: 'destructive',
        });
        return;
    }

    const batch = writeBatch(db);

    try {
      addLog('Iniciando processo de seeding...');

      // Seed Product Types
      addLog('--- Populando product_types ---');
      for (const [id, data] of Object.entries(productTypesData)) {
        const ref = doc(db, 'product_types', id);
        batch.set(ref, data);
        addLog(`[OK] product_types/${id}`);
      }

      // Seed Categories
      addLog('\n--- Populando categories ---');
      for (const [id, data] of Object.entries(categoriesData)) {
        const ref = doc(db, 'categories', id);
        batch.set(ref, data);
        addLog(`[OK] categories/${id}`);
      }

      // Seed Products
      addLog('\n--- Populando products ---');
      for (const [id, data] of Object.entries(productsData)) {
        const ref = doc(db, 'products', id);
        batch.set(ref, data);
        addLog(`[OK] products/${id}`);
      }

      await batch.commit();

      addLog('\n🎉 Processo concluído com sucesso!');
      toast({
        title: 'Sucesso!',
        description: 'O banco de dados foi populado com os dados iniciais.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao popular o banco de dados:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`\n❌ Erro: ${errorMessage}`);
      toast({
        title: 'Erro ao popular o banco',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Popular Banco de Dados (Seed)</CardTitle>
          <CardDescription>
            Use este script para popular o banco de dados Firestore com os dados iniciais de teste.
            Isso irá sobrescrever quaisquer dados existentes nas coleções `product_types`, `categories` e `products` com os IDs correspondentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={handleSeed} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Populando...
              </>
            ) : (
              'Popular Banco de Dados'
            )}
          </Button>

          {logs.length > 0 && (
            <div className="space-y-2">
                <h3 className="font-semibold">Logs da Operação:</h3>
                <ScrollArea className="h-72 w-full rounded-md border p-4 bg-muted/50">
                    <pre className="text-sm whitespace-pre-wrap">
                        {logs.join('\n')}
                    </pre>
                </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
