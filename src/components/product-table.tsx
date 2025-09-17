
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppContext } from "@/context/app-context";
import type { Product } from "@/lib/types";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Slider } from "@/components/ui/slider";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { ScrollArea } from "./ui/scroll-area";

const productSchema = z.object({
  name: z.string().min(1, { message: "Nome do produto é obrigatório" }),
  description: z.string().min(1, { message: "Descrição é obrigatória" }),
  categoryId: z.string().min(1, { message: "Categoria é obrigatória" }),
  totalCostUSD: z.coerce.number().min(0, { message: "Deve ser um número positivo" }),
  hardwarePercentage: z.coerce.number().min(0).max(100),
  freightCostUSD: z.coerce.number().min(0, { message: "Deve ser um número positivo" }),
  finalSellPriceBRL: z.coerce.number().min(0, { message: "Deve ser um número positivo" }),
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
  irpjTax: z.coerce.number().min(0).max(1),
  iofTax: z.coerce.number().min(0).max(1),
  issTax: z.coerce.number().min(0).max(1),
  swiftFee: z.coerce.number().min(0),
  simplesNacionalTax: z.coerce.number().min(0).max(1),
  salesCommission: z.coerce.number().min(0).max(1),
  financialFee: z.coerce.number().min(0),
  bdiFee: z.coerce.number().min(0),
  marginFee: z.coerce.number().min(0).max(1),
  salesDiscount: z.coerce.number().min(0).max(1),
});

type ProductFormValues = z.infer<typeof productSchema>;

function ProductForm({
  product,
  onSuccess,
}: {
  product?: Product;
  onSuccess: () => void;
}) {
  const { addProduct, updateProduct, categories } = useAppContext();
  const { toast } = useToast();
  
  const getInitialValues = () => {
    if (product) {
      const totalCost = product.hardwareCostUSD + product.softwareCostUSD;
      const hardwarePercentage = totalCost > 0 ? (product.hardwareCostUSD / totalCost) * 100 : 100;
      return {
        ...product,
        totalCostUSD: totalCost,
        hardwarePercentage: hardwarePercentage,
      };
    }
    // Return a default structure for a new product, including all settings fields
    return {
      name: "",
      description: "",
      categoryId: "",
      totalCostUSD: 0,
      hardwarePercentage: 30,
      freightCostUSD: 0,
      finalSellPriceBRL: 0,
      exchangeRateUSD: 5.5,
      exchangeRateCNY: 0.75,
      exchangeClosingFee: 0,
      diRate: 0,
      taxaSiscomex: 0,
      customsClearanceFee: 0,
      technicalConsultingFee: 0,
      storageFee: 0,
      freteInternacionalTerceiro: 0,
      freteTerceirosDA: 0,
      desconsolidacaoUSD: 0,
      importTaxII: 0,
      ipiTax: 0,
      pisTax: 0,
      cofinsTax: 0,
      icmsTax: 0,
      irpjTax: 0,
      iofTax: 0,
      issTax: 0,
      swiftFee: 0,
      simplesNacionalTax: 0,
      salesCommission: 0,
      financialFee: 0,
      bdiFee: 0,
      marginFee: 0,
      salesDiscount: 0,
    };
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: getInitialValues(),
  });
  
  const hardwarePercentage = form.watch("hardwarePercentage");
  const softwarePercentage = 100 - hardwarePercentage;
  const totalCostUSD = form.watch("totalCostUSD");

  const hardwareValue = (totalCostUSD * hardwarePercentage) / 100;
  const softwareValue = (totalCostUSD * softwarePercentage) / 100;


  const onSubmit = (data: ProductFormValues) => {
    const hardwareCostUSD = (data.totalCostUSD * data.hardwarePercentage) / 100;
    const softwareCostUSD = (data.totalCostUSD * (100 - data.hardwarePercentage)) / 100;

    const { totalCostUSD, hardwarePercentage, ...restOfData } = data;

    const productData = { 
      ...restOfData,
      hardwareCostUSD, 
      softwareCostUSD,
    };

    if (product) {
      updateProduct({ ...product, ...productData });
      toast({ title: "Produto Atualizado", description: `${data.name} foi atualizado com sucesso.` });
    } else {
      addProduct(productData as Omit<Product, 'id'>);
      toast({ title: "Produto Adicionado", description: `${data.name} foi adicionado com sucesso.` });
    }
    onSuccess();
  };

  const renderPercentageField = (name: keyof ProductFormValues, label: string) => (
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
                value={String(Number(field.value) * 100).replace('.', ',')}
                placeholder="0,0"
                onChange={e => {
                  const rawValue = e.target.value.replace(',', '.');
                  if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                    const numberValue = parseFloat(rawValue);
                    field.onChange(isNaN(numberValue) ? 0 : numberValue / 100);
                  }
                }}
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">%</span>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderCurrencyField = (name: keyof ProductFormValues, label: string, currency: 'BRL' | 'USD' | 'CNY' = 'BRL') => (
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
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <ScrollArea className="h-[70vh] pr-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: UTS 500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva o produto..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="totalCostUSD"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total do Produto (USD)</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">US$</span>
                        <Input type="number" step="0.01" className="pl-11" placeholder="ex: 2000.00" {...field} />
                      </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Controller
              control={form.control}
              name="hardwarePercentage"
              render={({ field: { onChange, value } }) => (
                <FormItem>
                  <FormLabel>Divisão de Custos (Hardware/Software)</FormLabel>
                  <FormControl>
                    <div>
                      <Slider
                        value={[value]}
                        onValueChange={(vals) => onChange(vals[0])}
                        max={100}
                        step={1}
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span className="font-medium text-sky-600">
                          Hardware: {hardwarePercentage.toFixed(0)}% 
                          ({hardwareValue.toLocaleString("en-US", { style: "currency", currency: "USD" })})
                        </span>
                        <span className="font-medium text-emerald-600">
                          Software: {softwarePercentage.toFixed(0)}%
                          ({softwareValue.toLocaleString("en-US", { style: "currency", currency: "USD" })})
                        </span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="freightCostUSD"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Frete (USD)</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">US$</span>
                        <Input type="number" step="0.01" className="pl-11" placeholder="ex: 200.00" {...field} />
                      </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="finalSellPriceBRL"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço de Venda Final (R$)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">R$</span>
                      <Input 
                        type="number" 
                        step="0.01" 
                        className="pl-10 font-bold"
                        placeholder="ex: 50000.00"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Accordion type="multiple" className="w-full space-y-4">
                <AccordionItem value="settings-exchange">
                    <AccordionTrigger className="text-base font-semibold">Taxas de Câmbio</AccordionTrigger>
                    <AccordionContent className="grid sm:grid-cols-2 gap-x-6 gap-y-4 pt-4">
                        {renderCurrencyField('exchangeRateUSD', 'Taxa de Câmbio (USD)')}
                        {renderCurrencyField('exchangeRateCNY', 'Taxa de Câmbio (CNY)')}
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="settings-customs">
                    <AccordionTrigger className="text-base font-semibold">Despesas Aduaneiras</AccordionTrigger>
                    <AccordionContent className="grid sm:grid-cols-2 gap-x-6 gap-y-4 pt-4">
                        {renderPercentageField('exchangeClosingFee', 'Taxa de Fechamento do Câmbio')}
                        {renderCurrencyField('customsClearanceFee', 'Desembaraço (R$)')}
                        {renderCurrencyField('technicalConsultingFee', 'Assessoria Técnica (R$)')}
                        {renderCurrencyField('storageFee', 'Armazenagem Aeroporto (R$)')}
                        {renderCurrencyField('freteInternacionalTerceiro', 'Frete Internacional Terceiro (R$)')}
                        {renderCurrencyField('freteTerceirosDA', 'Frete Terceiros - DA (R$)')}
                        {renderCurrencyField('desconsolidacaoUSD', 'Desconsolidação (US$)', 'USD')}
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="settings-hardware-tax">
                    <AccordionTrigger className="text-base font-semibold">Impostos sobre Hardware + Frete</AccordionTrigger>
                    <AccordionContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 pt-4">
                        {renderCurrencyField('taxaSiscomex', 'Taxa Siscomex (R$)')}
                        {renderPercentageField('importTaxII', 'Imposto de Importação (II)')}
                        {renderPercentageField('ipiTax', 'IPI')}
                        {renderPercentageField('pisTax', 'PIS')}
                        {renderPercentageField('cofinsTax', 'COFINS')}
                        {renderPercentageField('icmsTax', 'ICMS')}
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="settings-software-tax">
                    <AccordionTrigger className="text-base font-semibold">Impostos sobre Software</AccordionTrigger>
                    <AccordionContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 pt-4">
                        {renderPercentageField('irpjTax', 'IRPJ')}
                        {renderPercentageField('iofTax', 'IOF')}
                        {renderPercentageField('issTax', 'ISS (Americana)')}
                        {renderCurrencyField('swiftFee', 'Taxa Swift (R$)')}
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="settings-sales-tax">
                    <AccordionTrigger className="text-base font-semibold">Despesas de Venda (Interno)</AccordionTrigger>
                    <AccordionContent className="grid sm:grid-cols-2 gap-x-6 gap-y-4 pt-4">
                        {renderPercentageField('simplesNacionalTax', 'Imposto Simples Nacional')}
                        {renderPercentageField('salesCommission', 'Comissão de Vendas')}
                        {renderCurrencyField('financialFee', 'Custo Financeiro (R$)')}
                        {renderCurrencyField('bdiFee', 'BDI (R$)')}
                        {renderPercentageField('marginFee', 'Margem')}
                        {renderPercentageField('salesDiscount', 'Desconto de Venda')}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4">
          <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
          <Button type="submit">{product ? "Salvar Alterações" : "Adicionar Produto"}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function ProductTable() {
  const { products, deleteProduct, getCategoryNameById } = useAppContext();
  const { toast } = useToast();
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  const handleDelete = (product: Product) => {
    deleteProduct(product.id);
    toast({
      title: "Produto Excluído",
      description: `"${product.name}" foi removido.`,
      variant: "destructive",
    });
  }

  if (!products) {
    return null; 
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Produto</DialogTitle>
              <DialogDescription>
                Insira os detalhes do produto e suas configurações de custo individuais.
              </DialogDescription>
            </DialogHeader>
            <ProductForm onSuccess={() => setAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Preço de Venda (R$)</TableHead>
              <TableHead className="text-right">Hardware (USD)</TableHead>
              <TableHead className="text-right">Software (USD)</TableHead>
              <TableHead className="text-right">Frete (USD)</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length > 0 ? (
              products.map((product) => {
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{getCategoryNameById(product.categoryId)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {product.finalSellPriceBRL.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.hardwareCostUSD.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.softwareCostUSD.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.freightCostUSD.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog open={editingProduct?.id === product.id} onOpenChange={(isOpen) => !isOpen && setEditingProduct(undefined)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setEditingProduct(product)}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Editar Produto</DialogTitle>
                              <DialogDescription>
                                Atualize os detalhes de "{product.name}".
                              </DialogDescription>
                            </DialogHeader>
                            <ProductForm product={product} onSuccess={() => setEditingProduct(undefined)} />
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto "{product.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(product)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Nenhum produto encontrado. Adicione um para começar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

    