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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "./ui/separator";

const settingsSchema = z.object({
  exchangeRateUSD: z.coerce.number().positive(),
  exchangeRateCNY: z.coerce.number().positive(),
  exchangeClosingFee: z.coerce.number().min(0).max(1),
  diRate: z.coerce.number().min(0).max(1),
  taxaSiscomex: z.coerce.number().min(0),
  customsClearanceFee: z.coerce.number().min(0),
  technicalConsultingFee: z.coerce.number().min(0),
  storageFee: z.coerce.number().min(0),
  freteInternacionalTerceiro: z.coerce.number().min(0),
  freteTerceirosDA: z.coerce.number().min(0),
  desconsolidacaoUSD: z.coerce.number().min(0),
  importTaxII: z.coerce.number().min(0).max(1),
  ipiTax: z.coerce.number().min(0).max(1),
  pisTax: z.coerce.number().min(0).max(1),
  cofinsTax: z.coerce.number().min(0).max(1),
  icmsTax: z.coerce.number().min(0).max(1),
  simplesNacionalTax: z.coerce.number().min(0).max(1),
  salesCommission: z.coerce.number().min(0).max(1),
  financialFee: z.coerce.number().min(0).max(1),
  bdiFee: z.coerce.number().min(0).max(1),
  marginFee: z.coerce.number().min(0).max(1),
  salesDiscount: z.coerce.number().min(0).max(1),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsForm() {
  const { settings, updateSettings } = useAppContext();
  const { toast } = useToast();
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });
  
  const watchedValues = form.watch();

  const calculateTotalCustomsExpenses = () => {
    const {
      customsClearanceFee,
      technicalConsultingFee,
      storageFee,
      freteInternacionalTerceiro,
      freteTerceirosDA,
      desconsolidacaoUSD,
      exchangeRateUSD,
    } = watchedValues;

    const desconsolidacaoBRL = (desconsolidacaoUSD || 0) * (exchangeRateUSD || 0);

    return (
      (customsClearanceFee || 0) +
      (technicalConsultingFee || 0) +
      (storageFee || 0) +
      (freteInternacionalTerceiro || 0) +
      (freteTerceirosDA || 0) +
      desconsolidacaoBRL
    );
  };

  const totalCustomsExpenses = calculateTotalCustomsExpenses();


  const onSubmit = (data: SettingsFormValues) => {
    updateSettings(data);
    toast({
      title: "Configurações Salvas",
      description: "Suas configurações de cálculo globais foram atualizadas.",
    });
  };
  
  const renderPercentageField = (name: keyof SettingsFormValues, label: string, description?: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
               <Input 
                type="text" 
                className="pr-8"
                value={String(field.value * 100).replace('.', ',')}
                placeholder="0,0"
                onChange={e => {
                  const rawValue = e.target.value.replace(',', '.');
                  // Allow empty string or a valid number format
                  if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                    const numberValue = parseFloat(rawValue);
                    field.onChange(isNaN(numberValue) ? 0 : numberValue / 100);
                  }
                }}
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">%</span>
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderCurrencyField = (name: keyof SettingsFormValues, label: string, description?: string, currency: 'BRL' | 'USD' | 'CNY' = 'BRL') => (
     <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground text-xs">
                {name === 'exchangeRateUSD' ? 'USD para BRL' : 
                 name === 'exchangeRateCNY' ? 'CNY para BRL' :
                 currency === 'USD' ? 'US$' :
                 currency === 'CNY' ? '¥' :
                 'R$'}
              </span>
              <Input 
                type="number" 
                step="0.01" 
                className={name.toString().startsWith('exchangeRate') ? 'pl-28' : 'pl-10'}
                {...field}
                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
              />
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Câmbio</CardTitle>
                <CardDescription>Taxas de câmbio para conversão de moeda.</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                {renderCurrencyField('exchangeRateUSD', 'Taxa de Câmbio (USD)', 'Taxa de câmbio de Dólar para Real.')}
                {renderCurrencyField('exchangeRateCNY', 'Taxa de Câmbio (CNY)', 'Taxa de câmbio de Yuan para Real.')}
              </CardContent>
            </Card>

             <Card>
              <CardHeader>
                <CardTitle>Outras Taxas</CardTitle>
                <CardDescription>Demais taxas fundamentais para os cálculos.</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                 {renderPercentageField('diRate', 'Taxa D.I.', 'Percentual da taxa da Declaração de Importação.')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Despesas Aduaneiras</CardTitle>
                <CardDescription>Custos fixos e percentuais associados ao processo de importação.</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                {renderPercentageField('exchangeClosingFee', 'Taxa de Fechamento do Câmbio', 'Taxa sobre o valor total da conversão.')}
                {renderCurrencyField('customsClearanceFee', 'Desembaraço (R$)', 'Taxa fixa para o desembaraço aduaneiro.')}
                {renderCurrencyField('technicalConsultingFee', 'Assessoria Técnica (R$)', 'Custo dos serviços de assessoria técnica.')}
                {renderCurrencyField('storageFee', 'Armazenagem Aeroporto (R$)', 'Taxas de armazenamento em armazém ou porto.')}
                {renderCurrencyField('freteInternacionalTerceiro', 'Frete Internacional Terceiro (R$)', 'Frete internacional de terceiros.')}
                {renderCurrencyField('freteTerceirosDA', 'Frete Terceiros - DA (R$)', 'Frete de terceiros - DA.')}
                {renderCurrencyField('desconsolidacaoUSD', 'Desconsolidação (US$)', 'Taxa para desconsolidação da carga.', 'USD')}
              </CardContent>
              <CardFooter className="flex-col items-start pt-4 mt-4 border-t">
                  <span className="text-sm text-muted-foreground">Total de Despesas Aduaneiras (Custos Fixos)</span>
                  <span className="text-2xl font-bold text-primary">
                    {totalCustomsExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Este valor não inclui a "Taxa de Fechamento do Câmbio", que é um percentual.
                  </p>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Impostos e Taxas de Importação</CardTitle>
                <CardDescription>Percentuais e valores fixos de impostos e taxas aplicados durante a importação.</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                {renderCurrencyField('taxaSiscomex', 'Taxa Siscomex (R$)', 'Taxa para utilização do sistema Siscomex.')}
                {renderPercentageField('importTaxII', 'Imposto de Importação (II)')}
                {renderPercentageField('ipiTax', 'IPI')}
                {renderPercentageField('pisTax', 'PIS')}
                {renderPercentageField('cofinsTax', 'COFINS')}
                {renderPercentageField('icmsTax', 'ICMS')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Despesas de Venda (Interno)</CardTitle>
                <CardDescription>Percentuais de impostos e comissões aplicados no ponto de venda.</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                {renderPercentageField('simplesNacionalTax', 'Imposto Simples Nacional')}
                {renderPercentageField('salesCommission', 'Comissão de Vendas')}
                {renderPercentageField('financialFee', 'Financeiro')}
                {renderPercentageField('bdiFee', 'BDI')}
                {renderPercentageField('marginFee', 'Margem')}
                {renderPercentageField('salesDiscount', 'Desconto de Venda')}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Salvar Alterações</CardTitle>
                <CardDescription>Revise suas configurações antes de salvar. Estes valores afetarão todos os cálculos futuros.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="submit" className="w-full">Salvar Configurações</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
