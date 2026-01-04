"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppContext } from "@/context/app-context";
import type { Vendor } from "@/lib/types";

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
import { Textarea } from "./ui/textarea";

const vendorSchema = z.object({
  name: z.string().min(1, "O nome do vendedor é obrigatório."),
  email: z.string().email("O e-mail é inválido.").min(1, "O e-mail é obrigatório."),
  phone: z.string().optional(),
  initials: z.string().min(2, "As iniciais são obrigatórias (2 caracteres).").max(2, "As iniciais são obrigatórias (2 caracteres)."),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

function VendorForm({
  vendor,
  onSuccess,
}: {
  vendor?: Vendor;
  onSuccess: () => void;
}) {
  const { addVendor, updateVendor } = useAppContext();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: vendor || {
      name: "",
      email: "",
      phone: "",
      initials: "",
    },
  });

  const onSubmit = async (data: VendorFormValues) => {
    setIsSubmitting(true);
    try {
      if (vendor) {
        await updateVendor({ ...vendor, ...data });
        toast({ title: "Vendedor Atualizado", description: `${data.name} foi atualizado com sucesso.` });
      } else {
        await addVendor(data as Omit<Vendor, "id">);
        toast({ title: "Vendedor Adicionado", description: `${data.name} foi adicionado com sucesso.` });
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Ocorreu um erro ao salvar os dados do vendedor.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="joao.silva@empresa.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="initials"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Iniciais (para Revisão)</FormLabel>
                    <FormControl>
                        <Input placeholder="JS" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone / Ramal</FormLabel>
                  <FormControl>
                    <Input placeholder="(19) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        <DialogFooter className="pt-4">
          <DialogClose asChild><Button variant="ghost" disabled={isSubmitting}>Cancelar</Button></DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {vendor ? "Salvar Alterações" : "Adicionar Vendedor"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function VendorTable() {
  const { vendors, deleteVendor, loading } = useAppContext();
  const { toast } = useToast();
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | undefined>(undefined);

  const handleDelete = async (vendor: Vendor) => {
    try {
      await deleteVendor(vendor.id);
      toast({
        title: "Vendedor Excluído",
        description: `"${vendor.name}" foi removido.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível remover o vendedor.",
        variant: "destructive",
      });
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Vendedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Vendedor</DialogTitle>
              <DialogDescription>
                Cadastre um novo membro da equipe comercial.
              </DialogDescription>
            </DialogHeader>
            <VendorForm onSuccess={() => setAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Iniciais</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.length > 0 ? (
              vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>{vendor.email}</TableCell>
                   <TableCell className="font-mono font-bold">{vendor.initials}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Dialog open={editingVendor?.id === vendor.id} onOpenChange={(isOpen) => !isOpen && setEditingVendor(undefined)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditingVendor(vendor)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Editar Vendedor</DialogTitle>
                            <DialogDescription>
                              Atualize os dados de "{vendor.name}".
                            </DialogDescription>
                          </DialogHeader>
                          <VendorForm vendor={vendor} onSuccess={() => setEditingVendor(undefined)} />
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
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente o vendedor "{vendor.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(vendor)}>Excluir</AlertDialogAction>
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
                  Nenhum vendedor encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
