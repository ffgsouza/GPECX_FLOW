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
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { GlobalSettings } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";

const settingsSchema = z.object({
    exchangeRateUSD: z.coerce.number().positive(),
    taxaSiscomex: z.coerce.number().nonnegative(),
    customsClearanceFee: z.coerce.number().nonnegative(),
    technicalConsultingFee: z.coerce.number().nonnegative(),
    storageFee: z.coerce.number().nonnegative(),
    freteInternacionalTerceiro: z.coerce.number().nonnegative(),
    freteTerceirosDA: z.coerce.number().nonnegative(),
    swiftFee: z.coerce.number().nonnegative(),
    desconsolidacaoUSD: z.coerce.number().nonnegative(),
    freightCostUSD: z.coerce.number().nonnegative(),
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

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: globalSettings,
  });

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
                            step={isPercentage ? "0.001" : "0.01"} 
                            className={!isPercentage ? "pl-11" : "pr-11"}
                            placeholder="0.00" 
                            {...field} 
                            value={field.value}
                            onChange={e => field.onChange(e.target.valueAsNumber)}
                        />
                        {isPercentage && <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground text-sm">%</span>}
                    </div>
                    <FormDescription>{description}</FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />
    )
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Taxas e Câmbio</CardTitle>
                    <CardDescription>Parâmetros financeiros e de câmbio.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderFormField("exchangeRateUSD", "Cotação do Dólar (USD)", "Valor do dólar americano para conversão.")}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Despesas Fixas de Importação (BRL)</CardTitle>
                    <CardDescription>Custos fixos em Reais (R$) incorridos durante o processo de desembaraço.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderFormField("taxaSiscomex", "Taxa Siscomex", "Taxa de utilização do Sistema Integrado de Comércio Exterior.")}
                    {renderFormField("customsClearanceFee", "Desembaraço Aduaneiro", "Taxa do despachante aduaneiro.")}
                    {renderFormField("technicalConsultingFee", "Assessoria Técnica", "Custo da assessoria para classificação fiscal.")}
                    {renderFormField("storageFee", "Armazenagem", "Custo de armazenagem no terminal.")}
                    {renderFormField("freteInternacionalTerceiro", "Frete Internacional Terceiro", "Custo do frete pago a terceiros no exterior.")}
                    {renderFormField("freteTerceirosDA", "Frete Terceiros - DA", "Custo do frete de terceiros após o desembaraço.")}
                    {renderFormField("swiftFee", "Taxa Swift (Software)", "Taxa bancária para remessas de pagamento de software.")}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Despesas Variáveis de Importação (USD)</CardTitle>
                    <CardDescription>Custos em Dólar (US$) que variam com a importação.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderFormField("desconsolidacaoUSD", "Desconsolidação", "Taxa para separação de cargas consolidadas.", false, true)}
                    {renderFormField("freightCostUSD", "Frete Principal", "Custo do frete principal para o lote de produtos.", false, true)}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Variáveis de Venda e Markup</CardTitle>
                    <CardDescription>Impostos, comissões e margens que compõem o preço de venda final.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderFormField("simplesNacionalTax", "Imposto Simples Nacional", "Alíquota do imposto sobre a receita bruta.", true)}
                    {renderFormField("salesCommission", "Comissão de Vendas", "Percentual de comissão para a equipe de vendas.", true)}
                    {renderFormField("salesDiscount", "Desconto de Venda", "Percentual de desconto padrão aplicado ao preço final.", true)}
                    {renderFormField("marginFee", "Margem de Lucro", "Margem de lucro bruta desejada sobre a venda.", true)}
                    {renderFormField("financialFee", "Custo Financeiro", "Custo financeiro fixo por operação (em R$).")}
                    {renderFormField("bdiFee", "BDI/Custo Administrativo", "Benefícios e Despesas Indiretas (custo fixo em R$).")}
                </CardContent>
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
