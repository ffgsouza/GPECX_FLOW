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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  exchangeRate: z.coerce.number().positive(),
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
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsForm() {
  const { settings, updateSettings } = useAppContext();
  const { toast } = useToast();
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  const onSubmit = (data: SettingsFormValues) => {
    updateSettings(data);
    toast({
      title: "Configurações Salvas",
      description: "Suas configurações de cálculo globais foram atualizadas.",
    });
  };
  
  const renderPercentageField = (name: keyof SettingsFormValues, label: string, description: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input 
                type="number" 
                step="0.0001" 
                placeholder="ex: 0.18 para 18%"
                {...field} 
                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">%</span>
            </div>
          </FormControl>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderCurrencyField = (name: keyof SettingsFormValues, label: string, description: string, currency: 'BRL' | 'USD' = 'BRL') => (
     <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                {name === 'exchangeRate' ? 'USD para BRL' : currency === 'USD' ? 'US$' : 'R$'}
              </span>
              <Input 
                type="number" 
                step="0.01" 
                className="pl-28"
                {...field}
                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
              />
            </div>
          </FormControl>
          <FormDescription>{description}</FormDescription>
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
                <CardTitle>Taxas Principais</CardTitle>
                <CardDescription>Taxas fundamentais para todos os cálculos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderCurrencyField('exchangeRate', 'Taxa de Câmbio', 'Taxa de câmbio atual de USD para BRL.')}
                {renderPercentageField('diRate', 'Taxa D.I.', 'Percentual da taxa da Declaração de Importação.')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taxas Alfandegárias e Fixas</CardTitle>
                <CardDescription>Custos fixos associados ao processo de importação.</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-6">
                {renderCurrencyField('customsClearanceFee', 'Desembaraço (R$)', 'Taxa fixa para o desembaraço aduaneiro.')}
                {renderCurrencyField('technicalConsultingFee', 'Assessoria Técnica (R$)', 'Custo dos serviços de assessoria técnica.')}
                {renderCurrencyField('storageFee', 'Armazenagem Aeroporto (R$)', 'Taxas de armazenamento em armazém ou porto.')}
                {renderCurrencyField('freteInternacionalTerceiro', 'Frete Internacional Terceiro (R$)', 'Frete internacional de terceiros.')}
                {renderCurrencyField('freteTerceirosDA', 'Frete Terceiros - DA (R$)', 'Frete de terceiros - DA.')}
                {renderCurrencyField('desconsolidacaoUSD', 'Desconsolidação (US$)', 'Taxa para desconsolidação da carga.', 'USD')}
                {renderCurrencyField('taxaSiscomex', 'Taxa Siscomex (R$)', 'Taxa para utilização do sistema Siscomex.')}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Impostos de Importação</CardTitle>
                <CardDescription>Percentuais de impostos aplicados durante a importação. (Não utilizado na nova fórmula)</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderPercentageField('importTaxII', 'Imposto de Importação (II)', 'Imposto de Importação.')}
                {renderPercentageField('ipiTax', 'IPI', 'Imposto sobre Produtos Industrializados.')}
                {renderPercentageField('pisTax', 'PIS', 'Programa de Integração Social.')}
                {renderPercentageField('cofinsTax', 'COFINS', 'Contribuição para o Financiamento da Seguridade Social.')}
                {renderPercentageField('icmsTax', 'ICMS', 'Imposto sobre Circulação de Mercadorias e Serviços.')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Despesas de Venda (Interno)</CardTitle>
                <CardDescription>Percentuais de impostos e comissões aplicados no ponto de venda.</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-6">
                {renderPercentageField('simplesNacionalTax', 'Imposto Simples Nacional', 'Regime tributário federal para pequenas empresas.')}
                {renderPercentageField('salesCommission', 'Comissão de Vendas', 'Comissão paga à equipe de vendas.')}
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
