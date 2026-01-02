"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Save, 
  Loader2, 
  DollarSign, 
  Truck, 
  Percent, 
  Globe,
  Info,
  Building,
  TrendingUp
} from "lucide-react";
import { doc, getDoc, setDoc, type Firestore } from "firebase/firestore";

import { initializeFirebase } from "@/firebase";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


// --- SCHEMA DE VALIDAÇÃO ---
const settingsSchema = z.object({
  // Câmbio e Logística
  exchangeRateUSD: z.coerce.number().min(0.01, "Valor inválido"),
  freightCostUSD: z.coerce.number().min(0),
  
  // Impostos Hardware
  hardware_importTaxII: z.coerce.number().min(0),
  hardware_ipiTax: z.coerce.number().min(0),
  hardware_pisTax: z.coerce.number().min(0),
  hardware_cofinsTax: z.coerce.number().min(0),
  hardware_icmsTax: z.coerce.number().min(0),
  taxaSiscomex: z.coerce.number().min(0),

  // Impostos Software
  software_irpjTax: z.coerce.number().min(0),
  software_pisTax: z.coerce.number().min(0),
  software_cofinsTax: z.coerce.number().min(0),
  software_iofTax: z.coerce.number().min(0),
  software_issTax: z.coerce.number().min(0),
  swiftFee: z.coerce.number().min(0),

  // Despesas Aduaneiras Padrão (R$)
  customsClearanceFee: z.coerce.number().min(0),
  storageFee: z.coerce.number().min(0),
  technicalConsultingFee: z.coerce.number().min(0),
  freteInternacionalTerceiro: z.coerce.number().min(0),
  freteTerceirosDA: z.coerce.number().min(0),
  desconsolidacaoUSD: z.coerce.number().min(0),

  // Despesas de Venda
  simplesNacionalTax: z.coerce.number().min(0),
  salesCommission: z.coerce.number().min(0),
  financialFee: z.coerce.number().min(0),
  bdiFee: z.coerce.number().min(0),
  marginFee: z.coerce.number().min(0),
  salesDiscount: z.coerce.number().min(0),
});

type SettingsValues = z.infer<typeof settingsSchema>;

// Valores Padrão Iniciais
const defaultSettings: SettingsValues = {
  exchangeRateUSD: 5.4,
  freightCostUSD: 575.00,
  
  hardware_importTaxII: 9.60,
  hardware_ipiTax: 3.25,
  hardware_pisTax: 2.10,
  hardware_cofinsTax: 9.65,
  hardware_icmsTax: 18.00,
  taxaSiscomex: 154.23,

  software_irpjTax: 15.00,
  software_pisTax: 1.65,
  software_cofinsTax: 7.60,
  software_iofTax: 0.38,
  software_issTax: 5.00,
  swiftFee: 100.00,

  customsClearanceFee: 1050.00,
  storageFee: 989.54,
  technicalConsultingFee: 350.00,
  freteInternacionalTerceiro: 300.00,
  freteTerceirosDA: 300,
  desconsolidacaoUSD: 65,

  simplesNacionalTax: 15.5,
  salesCommission: 3.0,
  financialFee: 1500,
  bdiFee: 2500,
  marginFee: 15.0,
  salesDiscount: 5.0,
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
    const { db } = initializeFirebase();
    if (!db) {
      toast({ title: "Erro de Conexão", description: "O Firestore não foi inicializado corretamente.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
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
    const { db } = initializeFirebase();
     if (!db) {
          console.error("Firestore not initialized for saving settings.");
          setIsSaving(false);
          return;
      }
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

  const renderPercentField = (name: keyof SettingsValues, label: string, tooltip: string) => (
     <FormField control={form.control} name={name} render={({ field }) => (
        <FormItem>
            <FormLabelWithTooltip label={label} tooltip={tooltip}/>
            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
            <FormMessage />
        </FormItem>
    )} />
  );

  const renderCurrencyField = (name: keyof SettingsValues, label: string, tooltip: string, isUSD = false) => (
     <FormField control={form.control} name={name} render={({ field }) => (
        <FormItem>
            <FormLabelWithTooltip label={label} tooltip={tooltip}/>
            <FormControl>
                <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">{isUSD ? 'US$' : 'R$'}</span>
                    <Input type="number" step="0.01" className="pl-12" {...field} />
                </div>
            </FormControl>
            <FormMessage />
        </FormItem>
    )} />
  );


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
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="geral">Geral & Câmbio</TabsTrigger>
                <TabsTrigger value="venda">Despesas de Venda</TabsTrigger>
                <TabsTrigger value="hardware">Impostos Hardware</TabsTrigger>
                <TabsTrigger value="software">Impostos Software</TabsTrigger>
            </TabsList>

            {/* ABA GERAL */}
            <TabsContent value="geral" className="space-y-4 py-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-blue-600"/> Câmbio e Logística</CardTitle>
                        <CardDescription>Valores base para conversão e frete internacional.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                       {renderCurrencyField("exchangeRateUSD", "Dólar PTAX (R$)", "Taxa de câmbio usada para converter todos os custos de USD para BRL.")}
                       {renderCurrencyField("freightCostUSD", "Frete Int. Padrão (USD)", "Custo estimado padrão para o frete aéreo internacional principal.", true)}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5 text-orange-600"/> Despesas Aduaneiras (Estimativa R$)</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-4 gap-4">
                        {renderCurrencyField("customsClearanceFee", "Desembaraço", "Custo fixo cobrado pelo despachante aduaneiro.")}
                        {renderCurrencyField("storageFee", "Armazenagem", "Custo estimado de armazenagem no aeroporto.")}
                        {renderCurrencyField("technicalConsultingFee", "Assessoria", "Custo da assessoria técnica para o processo.")}
                        {renderCurrencyField("freteInternacionalTerceiro", "Frete Interno", "Custo do frete do aeroporto até a empresa.")}
                        {renderCurrencyField("freteTerceirosDA", "Frete 3º (DA)", "Custo de fretes de terceiros no processo de desembaraço.")}
                        {renderCurrencyField("desconsolidacaoUSD", "Desconsolidação Aérea (USD)", "Taxa cobrada pela companhia aérea para liberar a carga.", true)}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ABA VENDA */}
            <TabsContent value="venda" className="space-y-4 py-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-600"/> Mark-up de Venda</CardTitle>
                        <CardDescription>Taxas percentuais e valores fixos que formam o preço de venda final.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-6">
                        {renderPercentField("simplesNacionalTax", "Imposto Simples (%)", "Alíquota do imposto sobre a receita bruta (faturamento).")}
                        {renderPercentField("salesCommission", "Comissão (%)", "Percentual de comissão padrão para a equipe de vendas.")}
                        {renderPercentField("marginFee", "Margem de Lucro (%)", "Margem de lucro bruta desejada sobre o custo do produto.")}
                        {renderPercentField("salesDiscount", "Desconto Padrão (%)", "Desconto pré-aprovado que o vendedor pode aplicar.")}
                        {renderCurrencyField("financialFee", "Custo Financeiro (R$)", "Custo fixo por proposta para cobrir despesas financeiras (ex: taxas de adiantamento).")}
                        {renderCurrencyField("bdiFee", "BDI Fixo (R$)", "Benefícios e Despesas Indiretas. Valor fixo para cobrir custos administrativos e de estrutura.")}
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
                        {renderPercentField("hardware_importTaxII", "II (%)", "Imposto de Importação. Incide sobre o valor aduaneiro.")}
                        {renderPercentField("hardware_ipiTax", "IPI (%)", "Imposto sobre Produtos Industrializados. Incide sobre (Valor Aduaneiro + II).")}
                        {renderPercentField("hardware_pisTax", "PIS (%)", "Contribuição para o PIS/PASEP. Incide sobre o valor aduaneiro.")}
                        {renderPercentField("hardware_cofinsTax", "COFINS (%)", "Contribuição para o Financiamento da Seguridade Social. Incide sobre o valor aduaneiro.")}
                        {renderPercentField("hardware_icmsTax", "ICMS (%)", "Imposto sobre Circulação de Mercadorias e Serviços. Calculado 'por dentro'.")}
                        {renderCurrencyField("taxaSiscomex", "Taxa Siscomex (R$)", "Taxa de Utilização do Sistema Integrado de Comércio Exterior. Valor fixo em Reais.")}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ABA SOFTWARE */}
            <TabsContent value="software" className="space-y-4 py-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Percent className="w-5 h-5 text-blue-600"/> Impostos de Serviço (Software)</CardTitle>
                         <CardDescription>Defina as alíquotas (%) e taxas (R$) aplicadas na importação de serviços/intangíveis.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-6">
                        {renderPercentField("software_irpjTax", "IRRF (%)", "Imposto de Renda Retido na Fonte. A alíquota é aplicada sobre uma base com 'gross-up'.")}
                        {renderPercentField("software_pisTax", "PIS (%)", "PIS sobre importação de serviço.")}
                        {renderPercentField("software_cofinsTax", "COFINS (%)", "COFINS sobre importação de serviço.")}
                        {renderPercentField("software_iofTax", "IOF Câmbio (%)", "Imposto sobre Operações Financeiras. Incide sobre o fechamento de câmbio.")}
                        {renderPercentField("software_issTax", "ISS (%)", "Imposto Sobre Serviços. Alíquota definida pelo município.")}
                        {renderCurrencyField("swiftFee", "Taxa Swift (R$)", "Custo fixo para a transferência bancária internacional (remessa).")}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}
