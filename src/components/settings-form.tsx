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
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


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

const FormLabelWithTooltip = ({ label, tooltip }: { label: string, tooltip: string }) => (
    <div className="flex items-center gap-2">
        <FormLabel>{label}</FormLabel>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                    <p className="max-w-xs">{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    </div>
);


export default function SettingsForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

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
         toast({
          title: "Erro ao carregar",
          description: "Não foi possível buscar as configurações do banco de dados.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [form, toast]);

  // --- SALVAR ---
  const onSubmit = async (data: SettingsValues) => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "settings", "global"), data);
      toast({
        title: "Sucesso!",
        description: "As configurações globais foram salvas.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações no banco de dados.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="flex justify-end">
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Alterações
            </Button>
        </div>

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
                                    <FormLabelWithTooltip label="Dólar PTAX (R$)" tooltip="Taxa de câmbio usada para converter todos os custos de USD para BRL."/>
                                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="fretePadraoUSD"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabelWithTooltip label="Frete Int. Padrão (USD)" tooltip="Custo estimado padrão para o frete aéreo internacional principal." />
                                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
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
                            <FormItem><FormLabelWithTooltip label="Desembaraço" tooltip="Custo fixo cobrado pelo despachante aduaneiro." /><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="desp_armazenagem" render={({ field }) => (
                            <FormItem><FormLabelWithTooltip label="Armazenagem" tooltip="Custo estimado de armazenagem no aeroporto." /><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="desp_assessoria" render={({ field }) => (
                            <FormItem><FormLabelWithTooltip label="Assessoria" tooltip="Custo da assessoria técnica para o processo." /><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="desp_frete_interno" render={({ field }) => (
                            <FormItem><FormLabelWithTooltip label="Frete Interno" tooltip="Custo do frete do aeroporto até a empresa." /><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
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
                            <FormItem><FormLabelWithTooltip label="II (%)" tooltip="Imposto de Importação. Incide sobre o valor aduaneiro." /><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="tax_ipi" render={({ field }) => (
                            <FormItem><FormLabelWithTooltip label="IPI (%)" tooltip="Imposto sobre Produtos Industrializados. Incide sobre (Valor Aduaneiro + II)." /><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="tax_icms" render={({ field }) => (
                            <FormItem><FormLabelWithTooltip label="ICMS (%)" tooltip="Imposto sobre Circulação de Mercadorias e Serviços. Calculado 'por dentro'." /><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="tax_pis" render={({ field }) => (
                            <FormItem><FormLabelWithTooltip label="PIS (%)" tooltip="Contribuição para o PIS/PASEP. Incide sobre o valor aduaneiro." /><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="tax_cofins" render={({ field }) => (
                            <FormItem><FormLabelWithTooltip label="COFINS (%)" tooltip="Contribuição para o Financiamento da Seguridade Social. Incide sobre o valor aduaneiro." /><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="tax_siscomex" render={({ field }) => (
                            <FormItem><FormLabelWithTooltip label="Taxa Siscomex (R$)" tooltip="Taxa de Utilização do Sistema Integrado de Comércio Exterior. Valor fixo em Reais." /><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
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
                            <FormItem><FormLabelWithTooltip label="IRRF Estimado (%)" tooltip="Imposto de Renda Retido na Fonte. A alíquota informada já deve considerar o efeito 'Gross-up'." /><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="tax_iof" render={({ field }) => (
                            <FormItem><FormLabelWithTooltip label="IOF (%)" tooltip="Imposto sobre Operações Financeiras. Incide sobre o fechamento de câmbio." /><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="tax_iss" render={({ field }) => (
                            <FormItem><FormLabelWithTooltip label="ISS (%)" tooltip="Imposto Sobre Serviços. Alíquota definida pelo município." /><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="tax_swift" render={({ field }) => (
                            <FormItem><FormLabelWithTooltip label="Taxa Swift (R$)" tooltip="Custo fixo para a transferência bancária internacional (remessa)." /><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}
