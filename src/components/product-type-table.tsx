"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppContext } from "@/context/app-context";
import type { ProductType } from "@/lib/types";

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
import { Pencil, PlusCircle, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "./ui/switch";

const productTypeSchema = z.object({
  name: z.string().min(1, { message: "Nome do tipo é obrigatório" }),
  requiresNcm: z.boolean().default(false),
  requiresWeight: z.boolean().default(false),
});

type ProductTypeFormValues = z.infer<typeof productTypeSchema>;

function ProductTypeForm({
  productType,
  onSuccess,
}: {
  productType?: ProductType;
  onSuccess: () => void;
}) {
  const { addProductType, updateProductType } = useAppContext();
  const { toast } = useToast();

  const form = useForm<ProductTypeFormValues>({
    resolver: zodResolver(productTypeSchema),
    defaultValues: productType || { 
        name: "",
        requiresNcm: true,
        requiresWeight: true,
     },
  });

  const onSubmit = async (data: ProductTypeFormValues) => {
    try {
        if (productType) {
          await updateProductType({ ...productType, ...data });
          toast({ title: "Tipo de Item Atualizado", description: `${data.name} foi atualizado com sucesso.` });
        } else {
          await addProductType(data as Omit<ProductType, 'id'>);
          toast({ title: "Tipo de Item Adicionado", description: `${data.name} foi adicionado com sucesso.` });
        }
        onSuccess();
    } catch(error) {
        toast({ title: "Erro", description: "Ocorreu um erro ao salvar o tipo de item.", variant: "destructive" });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Tipo</FormLabel>
              <FormControl>
                <Input placeholder="ex: Hardware" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
            <FormField
            control={form.control}
            name="requiresNcm"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <FormLabel>Exige NCM?</FormLabel>
                    <p className="text-sm text-muted-foreground">
                        Marca se itens deste tipo precisam de um código NCM no cadastro.
                    </p>
                </div>
                <FormControl>
                    <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    />
                </FormControl>
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="requiresWeight"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <FormLabel>Exige Peso?</FormLabel>
                     <p className="text-sm text-muted-foreground">
                        Marca se itens deste tipo precisam ter peso para cálculo de frete.
                    </p>
                </div>
                <FormControl>
                    <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    />
                </FormControl>
                </FormItem>
            )}
            />
        </div>


        <DialogFooter className="pt-4">
          <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
          <Button type="submit">{productType ? "Salvar Alterações" : "Adicionar Tipo"}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function ProductTypeTable() {
  const { productTypes, deleteProductType, loading } = useAppContext();
  const { toast } = useToast();
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingProductType, setEditingProductType] = useState<ProductType | undefined>(undefined);

  const handleDelete = async (productType: ProductType) => {
    try {
        await deleteProductType(productType.id);
        toast({
        title: "Tipo de Item Excluído",
        description: `"${productType.name}" foi removido.`,
        variant: "default",
        });
    } catch(error) {
        toast({
        title: "Erro ao excluir",
        description: "Não foi possível remover o tipo de item.",
        variant: "destructive",
        });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderCheckmark = (value: boolean) => (value ? '✔️' : '❌');

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Tipo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Tipo de Item</DialogTitle>
              <DialogDescription>
                Crie uma nova regra para classificar seus produtos.
              </DialogDescription>
            </DialogHeader>
            <ProductTypeForm onSuccess={() => setAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Tipo</TableHead>
              <TableHead className="text-center">Exige NCM?</TableHead>
              <TableHead className="text-center">Exige Peso?</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productTypes.length > 0 ? (
              productTypes.map((pt) => (
                <TableRow key={pt.id}>
                  <TableCell className="font-medium">{pt.name}</TableCell>
                  <TableCell className="text-center">{renderCheckmark(pt.requiresNcm)}</TableCell>
                  <TableCell className="text-center">{renderCheckmark(pt.requiresWeight)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog open={editingProductType?.id === pt.id} onOpenChange={(isOpen) => !isOpen && setEditingProductType(undefined)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditingProductType(pt)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Editar Tipo de Item</DialogTitle>
                            <DialogDescription>
                              Atualize as regras de "{pt.name}".
                            </DialogDescription>
                          </DialogHeader>
                          <ProductTypeForm productType={pt} onSuccess={() => setEditingProductType(undefined)} />
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
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente o tipo "{pt.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(pt)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Nenhum tipo de item encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
