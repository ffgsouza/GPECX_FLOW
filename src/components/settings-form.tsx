"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Save, 
  Loader2, 
  Settings, 
  DollarSign, 
  Truck, 
  Percent, 
  Globe 
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage, // <--- O ERRO ESTAVA AQUI (Faltava importar)
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast"; // Se não tiver toast, pode remover ou usar alert

// --- SCHEMA DE VALIDAÇÃO ---
const settingsSchema = z.object({
  // Câmbio e Logística
  dolarRate: z.coerce.number().min(0.01, "Valor inválido"),
  fretePadraoUSD: z.coerce.number().min(0),
  
  // Impostos Hardware
  tax_ii: z.coerce.number().min(0),
  tax_ipi: z.coerce.number().min(0),
  tax_pis: z.coerce.number().min(0),
  tax_cofins: z.coerce.number().min(0),
  tax_icms: z.coerce.number().min(0),
  tax_siscomex: z.coerce.number().min(0),

  // Impostos Software
  tax_irrf: z.coerce.number().min(0),
  tax_iof: z.coerce.number().min(0),
  tax_iss: z.coerce.number().min(0),
  tax_swift: z.coerce.number().min(0),

  // Despesas Aduaneiras Padrão (R$)
  desp_desembaraco: z.coerce.number().min(0),
  desp_armazenagem: z.coerce.number().min(0),
  desp_assessoria: z.coerce.number().min(0),
  desp_frete_interno: z.coerce.number().min(0),
});

type SettingsValues = z.infer<typeof settingsSchema>;

// Valores Padrão Iniciais
const defaultSettings: SettingsValues = {
  dolarRate: 6.05,
  fretePadraoUSD: 575.00,
  tax_ii: 9.60,
  tax_ipi: 3.25,
  tax_pis: 2.10,
  tax_cofins: 9.65,
  tax_icms: 18.00,
  tax_siscomex: 154.23,
  tax_irrf: 18.00, // Lembrando do Gross-up
  tax_iof: 3.50,
  tax_iss: 5.00,
  tax_swift: 100.00,
  desp_desembaraco: 1050.00,
  desp_armazenagem: 989.54,
  desp_assessoria: 350.00,
  desp_frete_interno: 600.00,
};

export default function SettingsForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaultSettings,
  });

  // --- CARREGAR CONFIGURAÇÕES ---
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          form.reset(docSnap.data() as SettingsValues);
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [form]);

  // --- SALVAR ---
  const onSubmit = async (data: SettingsValues) => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "settings", "global"), data);
      alert("Configurações salvas com sucesso!"); // Pode substituir por toast
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Carregando configurações...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* CABEÇALHO DA PÁGINA */}
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Configurações Globais</h2>
                <p className="text-sm text-gray-500">Defina as taxas e valores padrão usados nos cálculos do sistema.</p>
            </div>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Alterações
            </Button>
        </div>

        <Separator />

        <Tabs defaultValue="geral" className="w-full">
            <TabsList className="grid w-full md:w-[600px] grid-cols-3">
                <TabsTrigger value="geral">Geral & Câmbio</TabsTrigger>
                <TabsTrigger value="hardware">Taxas Hardware</TabsTrigger>
                <TabsTrigger value="software">Taxas Software</TabsTrigger>
            </TabsList>

            {/* ABA GERAL */}
            <TabsContent value="geral" className="space-y-4 py-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-blue-600"/> Câmbio e Logística</CardTitle>
                        <CardDescription>Valores base para conversão e frete internacional.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="dolarRate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dólar PTAX (R$)</FormLabel>
                                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                    <FormDescription>Usado em todas as conversões.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="fretePadraoUSD"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Frete Int. Padrão (USD)</FormLabel>
                                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                    <FormDescription>Estimativa de frete aéreo.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5 text-orange-600"/> Despesas Aduaneiras (Estimativa R$)</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-4 gap-4">
                        <FormField control={form.control} name="desp_desembaraco" render={({ field }) => (
                            <FormItem><FormLabel>Desembaraço</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="desp_armazenagem" render={({ field }) => (
                            <FormItem><FormLabel>Armazenagem</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="desp_assessoria" render={({ field }) => (
                            <FormItem><FormLabel>Assessoria</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="desp_frete_interno" render={({ field }) => (
                            <FormItem><FormLabel>Frete Interno</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ABA HARDWARE */}
            <TabsContent value="hardware" className="space-y-4 py-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Percent className="w-5 h-5 text-emerald-600"/> Impostos de Importação (Hardware)</CardTitle>
                        <CardDescription>Defina as alíquotas (%) aplicadas na cascata de importação.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-6">
                        <FormField control={form.control} name="tax_ii" render={({ field }) => (
                            <FormItem><FormLabel>II (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="tax_ipi" render={({ field }) => (
                            <FormItem><FormLabel>IPI (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="tax_icms" render={({ field }) => (
                            <FormItem><FormLabel>ICMS (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormDescription>Cálculo "Por Dentro"</FormDescription><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="tax_pis" render={({ field }) => (
                            <FormItem><FormLabel>PIS (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="tax_cofins" render={({ field }) => (
                            <FormItem><FormLabel>COFINS (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="tax_siscomex" render={({ field }) => (
                            <FormItem><FormLabel>Taxa Siscomex (R$ Fixo)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ABA SOFTWARE */}
            <TabsContent value="software" className="space-y-4 py-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Percent className="w-5 h-5 text-blue-600"/> Impostos de Serviço (Software)</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-6">
                        <FormField control={form.control} name="tax_irrf" render={({ field }) => (
                            <FormItem><FormLabel>IRRF Estimado (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormDescription>Considerando Gross-up</FormDescription><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="tax_iof" render={({ field }) => (
                            <FormItem><FormLabel>IOF (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="tax_iss" render={({ field }) => (
                            <FormItem><FormLabel>ISS (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="tax_swift" render={({ field }) => (
                            <FormItem><FormLabel>Taxa Swift (R$ Fixo)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}