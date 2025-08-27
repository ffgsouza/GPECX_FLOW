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
  customsClearanceFee: z.coerce.number().min(0),
  technicalConsultingFee: z.coerce.number().min(0),
  storageFee: z.coerce.number().min(0),
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
      title: "Settings Saved",
      description: "Your global calculation settings have been updated.",
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
                placeholder="e.g. 0.18 for 18%"
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

  const renderCurrencyField = (name: keyof SettingsFormValues, label: string, description: string) => (
     <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                {name === 'exchangeRate' ? 'USD to BRL' : 'R$'}
              </span>
              <Input 
                type="number" 
                step="0.01" 
                className="pl-24"
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
                <CardTitle>Core Rates</CardTitle>
                <CardDescription>Fundamental rates for all calculations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderCurrencyField('exchangeRate', 'Exchange Rate', 'Current USD to BRL exchange rate.')}
                {renderPercentageField('diRate', 'D.I. Rate', 'Import Declaration (Declaração de Importação) fee percentage.')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customs & Fixed Fees</CardTitle>
                <CardDescription>Fixed costs associated with the import process.</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-6">
                {renderCurrencyField('customsClearanceFee', 'Customs Clearance (R$)', 'Fixed fee for customs clearance.')}
                {renderCurrencyField('technicalConsultingFee', 'Technical Consulting (R$)', 'Cost of technical advisory services.')}
                {renderCurrencyField('storageFee', 'Storage Fee (R$)', 'Warehouse or port storage fees.')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Import Taxes</CardTitle>
                <CardDescription>Tax percentages applied during importation.</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderPercentageField('importTaxII', 'Import Tax (II)', 'Imposto de Importação.')}
                {renderPercentageField('ipiTax', 'IPI', 'Imposto sobre Produtos Industrializados.')}
                {renderPercentageField('pisTax', 'PIS', 'Programa de Integração Social.')}
                {renderPercentageField('cofinsTax', 'COFINS', 'Contribuição para o Financiamento da Seguridade Social.')}
                {renderPercentageField('icmsTax', 'ICMS', 'Imposto sobre Circulação de Mercadorias e Serviços.')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales Expenses</CardTitle>
                <CardDescription>Tax and commission percentages applied at the point of sale.</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-6">
                {renderPercentageField('simplesNacionalTax', 'Simples Nacional', 'Federal tax regime for small businesses.')}
                {renderPercentageField('salesCommission', 'Sales Commission', 'Commission paid to the sales team.')}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Save Changes</CardTitle>
                <CardDescription>Review your settings before saving. These values will affect all future calculations.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="submit" className="w-full">Save Settings</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
