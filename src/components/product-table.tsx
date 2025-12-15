
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppContext } from "@/context/app-context";
import type { SaleProduct } from "@/lib/types";

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
import { ScrollArea } from "./ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

const productSchema = z.object({
  name: z.string().min(1, { message: "Nome do produto é obrigatório" }),
  description: z.string().min(1, { message: "Descrição é obrigatória" }),
  categoryId: z.string().min(1, { message: "Categoria é obrigatória" }),
  itemType: z.enum(['HARDWARE', 'SOFTWARE']),
  costUSD: z.coerce.number().min(0, { message: "Deve ser um número positivo" }),
  ncm: z.string().optional(),
  netWeightKg: z.coerce.number().optional(),
  finalSellPriceBRL: z.coerce.number().min(0, { message: "Deve ser um número positivo" }),
}).refine(data => {
    if (data.itemType === 'HARDWARE') {
        return !!data.ncm && data.ncm.length > 0 && data.netWeightKg !== undefined && data.netWeightKg > 0;
    }
    return true;
}, {
    message: "NCM e Peso (maior que 0) são obrigatórios para Hardware.",
    path: ["itemType"],
});

type ProductFormValues = z.infer<typeof productSchema>;

function ProductForm({
  product,
  onSuccess,
}: {
  product?: SaleProduct;
  onSuccess: () => void;
}) {
  const { addProduct, updateProduct, categories } = useAppContext();
  const { toast } = useToast();
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product || {
      name: "",
      description: "",
      categoryId: "",
      itemType: 'HARDWARE',
      costUSD: 0,
      ncm: "",
      netWeightKg: 0,
      finalSellPriceBRL: 0,
    },
  });

  const itemType = form.watch("itemType");

  const onSubmit = (data: ProductFormValues) => {
    const productData = { 
      ...data,
      ncm: data.itemType === 'HARDWARE' ? data.ncm : undefined,
      netWeightKg: data.itemType === 'HARDWARE' ? data.netWeightKg : undefined,
    };

    if (product) {
      updateProduct({ ...product, ...productData });
      toast({ title: "Produto Atualizado", description: `${data.name} foi atualizado com sucesso.` });
    } else {
      addProduct(productData as Omit<SaleProduct, 'id'>);
      toast({ title: "Produto Adicionado", description: `${data.name} foi adicionado com sucesso.` });
    }
    onSuccess();
  };

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
                  <FormLabel>Nome do Item</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: UTS 500 - Unidade de Hardware" {...field} />
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
                    <Textarea placeholder="Descreva o item..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="itemType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Item</FormLabel>
                   <FormDescription>
                    Define como os impostos de importação serão calculados.
                  </FormDescription>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="HARDWARE" />
                        </FormControl>
                        <FormLabel className="font-normal">Hardware</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="SOFTWARE" />
                        </FormControl>
                        <FormLabel className="font-normal">Software / Serviço</FormLabel>
                      </FormItem>
                    </RadioGroup>
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
              name="costUSD"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custo FOB (USD)</FormLabel>
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
           
            {itemType === 'HARDWARE' && (
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-muted/50">
                 <FormField
                    control={form.control}
                    name="ncm"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>NCM</FormLabel>
                        <FormControl>
                            <Input placeholder="ex: 9031.80.99" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="netWeightKg"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Peso Líquido (Kg)</FormLabel>
                        <FormControl>
                             <div className="relative">
                                <Input type="number" step="0.1" placeholder="ex: 15.5" {...field} />
                                <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground text-sm">Kg</span>
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
              </div>
            )}
             <FormField
              control={form.control}
              name="finalSellPriceBRL"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço de Venda Final (R$) - Referência</FormLabel>
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
                   <FormDescription>
                    Este valor é apenas para referência na tabela e não afeta o cálculo.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4">
          <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
          <Button type="submit">{product ? "Salvar Alterações" : "Adicionar Item"}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function ProductTable() {
  const { products, deleteProduct, getCategoryNameById } = useAppContext();
  const { toast } = useToast();
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SaleProduct | undefined>(undefined);

  const handleDelete = (product: SaleProduct) => {
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
              Adicionar Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Item ao Catálogo</DialogTitle>
              <DialogDescription>
                Insira os detalhes do item (seja hardware ou software) e suas configurações.
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
              <TableHead>Nome do Item</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Custo FOB (USD)</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length > 0 ? (
              products.map((product) => {
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${product.itemType === 'HARDWARE' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'}`}>
                           {product.itemType}
                        </span>
                    </TableCell>
                    <TableCell>{getCategoryNameById(product.categoryId)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {product.costUSD.toLocaleString("en-US", { style: "currency", currency: "USD" })}
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
                          <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Editar Item</DialogTitle>
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
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente o item "{product.name}".
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
                <TableCell colSpan={5} className="h-24 text-center">
                  Nenhum item encontrado. Adicione um para começar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
