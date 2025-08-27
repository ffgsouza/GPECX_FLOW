"use client";

import { useState, useEffect } from "react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const productSchema = z.object({
  name: z.string().min(1, { message: "Nome do produto é obrigatório" }),
  totalCostUSD: z.coerce.number().min(0, { message: "Deve ser um número positivo" }),
  hardwarePercentage: z.coerce.number().min(0).max(100),
});

type ProductFormValues = z.infer<typeof productSchema>;

function ProductForm({
  product,
  onSuccess,
}: {
  product?: Product;
  onSuccess: () => void;
}) {
  const { addProduct, updateProduct } = useAppContext();
  const { toast } = useToast();
  
  const getInitialValues = () => {
    if (product) {
      const totalCost = product.hardwareCostUSD + product.softwareCostUSD;
      const hardwarePercentage = totalCost > 0 ? (product.hardwareCostUSD / totalCost) * 100 : 100;
      return {
        name: product.name,
        totalCostUSD: totalCost,
        hardwarePercentage: hardwarePercentage,
      };
    }
    return {
      name: "",
      totalCostUSD: 0,
      hardwarePercentage: 100,
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

    const productData = { name: data.name, hardwareCostUSD, softwareCostUSD };

    if (product) {
      updateProduct({ ...product, ...productData });
      toast({ title: "Produto Atualizado", description: `${data.name} foi atualizado com sucesso.` });
    } else {
      addProduct(productData);
      toast({ title: "Produto Adicionado", description: `${data.name} foi adicionado com sucesso.` });
    }
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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

        <DialogFooter className="pt-4">
          <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
          <Button type="submit">{product ? "Salvar Alterações" : "Adicionar Produto"}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function ProductTable() {
  const { products, deleteProduct } = useAppContext();
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Produto</DialogTitle>
              <DialogDescription>
                Insira o valor total e defina a divisão entre hardware e software.
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
              <TableHead className="text-right">Custo de Hardware (USD)</TableHead>
              <TableHead className="text-right">Custo de Software (USD)</TableHead>
              <TableHead className="text-right">Custo Total (USD)</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-right">
                    {product.hardwareCostUSD.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.softwareCostUSD.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </TableCell>
                   <TableCell className="text-right font-semibold">
                    {(product.hardwareCostUSD + product.softwareCostUSD).toLocaleString("en-US", { style: "currency", currency: "USD" })}
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
                        <DialogContent>
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
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
