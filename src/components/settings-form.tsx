"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppContext } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { GlobalSettings } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { useState, useMemo } from "react";
import { Separator } from "./ui/separator";

const settingsSchema = z.object({
    exchangeRateUSD: z.coerce.number().positive(),
    
    // Hardware Taxes
    hardware_importTaxII: z.coerce.number().min(0).max(1),
    hardware_ipiTax: z.coerce.number().min(0).max(1),
    hardware_pisTax: z.coerce.number().min(0).max(1),
    hardware_cofinsTax: z.coerce.number().min(0).max(1),
    hardware_icmsTax: z.coerce.number().min(0).max(1),
    taxaSiscomex: z.coerce.number().nonnegative(),

    // Software Taxes
    software_irpjTax: z.coerce.number().min(0).max(1),
    software_pisTax: z.coerce.number().min(0).max(1),
    software_cofinsTax: z.coerce.number().min(0).max(1),
    software_iofTax: z.coerce.number().min(0).max(1),
    software_issTax: z.coerce.number().min(0).max(1),

    // Fees
    customsClearanceFee: z.coerce.number().nonnegative(),
    technicalConsultingFee: z.coerce.number().nonnegative(),
    storageFee: z.coerce.number().nonnegative(),
    freteInternacionalTerceiro: z.coerce.number().nonnegative(),
    freteTerceirosDA: z.coerce.number().nonnegative(),
    swiftFee: z.coerce.number().nonnegative(),
    desconsolidacaoUSD: z.coerce.number().nonnegative(),
    freightCostUSD: z.coerce.number().nonnegative(),

    // Markup
    simplesNacionalTax: z.coerce.number().min(0).max(1),
    salesCommission: z.coerce.number().min(0).max(1),
    financialFee: z.coerce.number().nonnegative(),
    bdiFee: z.coerce.number().nonnegative(),
    marginFee: z.coerce.number().min(0).max(1),
    salesDiscount: z.coerce.number().min(0).max(1),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsForm() {
  const { globalSettings, setGlobalSettings } = useAppContext();
  const { toast } = useToast();
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: globalSettings,
  });

  const handleUpdateDollar = async () => {
    setIsLoadingRate(true);
    try {
      const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
      if (!response.ok) throw new Error('API response not OK');
      const data = await response.json();
      const dolarAtual = parseFloat(data.USDBRL.ask);
      
      form.setValue('exchangeRateUSD', dolarAtual, { shouldValidate: true });
      
      toast({
        title: "Cotação Atualizada",
        description: `O valor do dólar foi atualizado para R$ ${dolarAtual.toFixed(4)}.`,
      });

    } catch (error) {
      console.error("Erro ao buscar dólar:", error);
      toast({
        title: "Erro ao buscar cotação",
        description: "Não foi possível obter o valor atual. Verifique sua conexão ou tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingRate(false);
    }
  };


  const onSubmit = (data: SettingsFormValues) => {
    setGlobalSettings(data as GlobalSettings);
    toast({
      title: "Configurações Salvas",
      description: "As variáveis globais foram atualizadas com sucesso.",
    });
  };

  const renderFormField = (name: keyof SettingsFormValues, label: string, description: string, isPercentage = false, isUSD = false) => {
    const prefix = isUSD ? "US$" : "R$";
    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <div className="relative">
                        {!isPercentage && <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">{prefix}</span>}
                        <Input 
                            type="number" 
                            step={isPercentage ? "0.0001" : "0.01"} 
                            className={!isPercentage ? "pl-11" : "pr-12"}
                            placeholder="0.00" 
                            {...field} 
                            value={field.value || 0}
                            onChange={e => {
                                const value = e.target.valueAsNumber;
                                field.onChange(isNaN(value) ? 0 : value);
                            }}
                        />
                        {isPercentage && <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground text-sm">{((field.value || 0) * 100).toFixed(2)}%</span>}
                    </div>
                    {description && <FormDescription>{description}</FormDescription>}
                    <FormMessage />
                </FormItem>
            )}
        />
    )
  };
  
  const watchedValues = form.watch();

  const totals = useMemo(() => {
    const expenses =
      (watchedValues.customsClearanceFee || 0) +
      (watchedValues.technicalConsultingFee || 0) +
      (watchedValues.storageFee || 0) +
      (watchedValues.freteInternacionalTerceiro || 0) +
      (watchedValues.freteTerceirosDA || 0) +
      (watchedValues.swiftFee || 0);

    const hardwareTaxes =
      (watchedValues.hardware_importTaxII || 0) +
      (watchedValues.hardware_ipiTax || 0) +
      (watchedValues.hardware_pisTax || 0) +
      (watchedValues.hardware_cofinsTax || 0) +
      (watchedValues.hardware_icmsTax || 0);

    const softwareTaxes =
      (watchedValues.software_irpjTax || 0) +
      (watchedValues.software_pisTax || 0) +
      (watchedValues.software_cofinsTax || 0) +
      (watchedValues.software_iofTax || 0) +
      (watchedValues.software_issTax || 0);

    const saleVariables =
      (watchedValues.simplesNacionalTax || 0) +
      (watchedValues.salesCommission || 0) +
      (watchedValues.marginFee || 0) -
      (watchedValues.salesDiscount || 0);
    
    const saleFixedCosts = (watchedValues.financialFee || 0) + (watchedValues.bdiFee || 0);

    return {
      expenses,
      hardwareTaxes,
      softwareTaxes,
      saleVariables,
      saleFixedCosts,
      taxaSiscomex: (watchedValues.taxaSiscomex || 0)
    };
  }, [watchedValues]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">

            <Card>
                <CardHeader>
                    <CardTitle>1. Parâmetros de Mercado</CardTitle>
                    <CardDescription>Cotações e custos que formam a base de todos os cálculos.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="exchangeRateUSD"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cotação do Dólar (USD)</FormLabel>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-grow">
                                        <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">R$</span>
                                        <Input 
                                            type="number" 
                                            step="0.0001"
                                            className="pl-10"
                                            placeholder="0.00" 
                                            {...field} 
                                            value={field.value || 0}
                                            onChange={e => {
                                                const value = e.target.valueAsNumber;
                                                field.onChange(isNaN(value) ? 0 : value);
                                            }}
                                        />
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={handleUpdateDollar}
                                      disabled={isLoadingRate}
                                      title="Buscar cotação atual na internet"
                                    >
                                      {isLoadingRate ? (
                                        <Loader2 className="animate-spin" />
                                      ) : (
                                        <RefreshCw />
                                      )}
                                      <span className="ml-2 hidden sm:inline">Atualizar</span>
                                    </Button>
                                </div>
                                <FormDescription>Valor do dólar para conversão de custos.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {renderFormField("freightCostUSD", "Frete Principal (Hardware)", "Custo do frete internacional principal para o lote de produtos.", false, true)}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>2. Despesas Aduaneiras</CardTitle>
                    <CardDescription>Custos fixos e variáveis incorridos durante o processo de desembaraço.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderFormField("customsClearanceFee", "Desembaraço Aduaneiro (R$)", "")}
                    {renderFormField("technicalConsultingFee", "Assessoria Técnica (R$)", "")}
                    {renderFormField("storageFee", "Armazenagem Aeroporto (R$)", "")}
                    {renderFormField("freteInternacionalTerceiro", "Frete Internacional Terceiro (R$)", "")}
                    {renderFormField("freteTerceirosDA", "Frete Terceiros - DA (R$)", "")}
                    {renderFormField("swiftFee", "Taxa Fechamento Câmbio (R$)", "")}
                    {renderFormField("desconsolidacaoUSD", "Desconsolidação (USD)", "", false, true)}
                </CardContent>
                <CardFooter className="bg-muted/50 p-4 mt-6">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-sm font-semibold text-muted-foreground">TOTAL DE DESPESAS FIXAS (BRL)</span>
                    <span className="text-base font-bold">{totals.expenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>3. Impostos de Importação (Hardware)</CardTitle>
                    <CardDescription>Alíquotas aplicadas sobre produtos físicos importados.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderFormField("hardware_importTaxII", "II", "", true)}
                    {renderFormField("hardware_ipiTax", "IPI", "", true)}
                    {renderFormField("hardware_pisTax", "PIS", "", true)}
                    {renderFormField("hardware_cofinsTax", "COFINS", "", true)}
                    {renderFormField("hardware_icmsTax", "ICMS", "", true)}
                    {renderFormField("taxaSiscomex", "Taxa Siscomex (R$)", "Taxa de utilização do Sistema Integrado de Comércio Exterior.")}
                </CardContent>
                <CardFooter className="bg-muted/50 p-4 mt-6">
                   <div className="flex justify-between items-center w-full">
                    <span className="text-sm font-semibold text-muted-foreground">CARGA TRIBUTÁRIA TOTAL (HARDWARE)</span>
                    <span className="text-base font-bold">{(totals.hardwareTaxes * 100).toFixed(2)}% + {totals.taxaSiscomex.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                </CardFooter>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>4. Impostos sobre Serviços (Software)</CardTitle>
                    <CardDescription>Alíquotas aplicadas sobre importação de serviços e licenças.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderFormField("software_irpjTax", "IRRF", "Imposto de Renda Retido na Fonte (Gross Up).", true)}
                    {renderFormField("software_pisTax", "PIS", "", true)}
                    {renderFormField("software_cofinsTax", "COFINS", "", true)}
                    {renderFormField("software_iofTax", "IOF", "IOF sobre operação de câmbio.", true)}
                    {renderFormField("software_issTax", "ISS", "", true)}
                </CardContent>
                <CardFooter className="bg-muted/50 p-4 mt-6">
                   <div className="flex justify-between items-center w-full">
                    <span className="text-sm font-semibold text-muted-foreground">CARGA TRIBUTÁRIA TOTAL (SOFTWARE)</span>
                    <span className="text-base font-bold">{(totals.softwareTaxes * 100).toFixed(2)}%</span>
                  </div>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>5. Variáveis de Venda e Markup</CardTitle>
                    <CardDescription>Impostos, comissões e margens que compõem o preço de venda final.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderFormField("simplesNacionalTax", "Imposto Simples Nacional", "Alíquota do imposto sobre a receita bruta.", true)}
                    {renderFormField("salesCommission", "Comissão de Vendas", "Percentual de comissão para a equipe de vendas.", true)}
                    {renderFormField("marginFee", "Margem de Lucro", "Margem de lucro bruta desejada sobre a venda.", true)}
                    {renderFormField("salesDiscount", "Desconto de Venda", "Percentual de desconto padrão aplicado ao preço final.", true)}
                    {renderFormField("financialFee", "Custo Financeiro", "Custo financeiro fixo por operação (em R$).")}
                    {renderFormField("bdiFee", "BDI/Custo Administrativo", "Benefícios e Despesas Indiretas (custo fixo em R$).")}
                </CardContent>
                 <CardFooter className="bg-muted/50 p-4 mt-6">
                   <div className="flex justify-between items-center w-full">
                    <span className="text-sm font-semibold text-muted-foreground">MARKUP TOTAL</span>
                    <span className="text-base font-bold">{(totals.saleVariables * 100).toFixed(2)}% + {totals.saleFixedCosts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                </CardFooter>
            </Card>
        </div>

        <div className="flex justify-end sticky bottom-0 bg-background/80 backdrop-blur-sm py-4">
            <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
            </Button>
        </div>
      </form>
    </Form>
  );
}
