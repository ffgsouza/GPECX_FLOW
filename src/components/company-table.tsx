
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppContext } from "@/context/app-context";
import type { Company } from "@/lib/types";

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
import { Pencil, PlusCircle, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";

const companySchema = z.object({
  nickname: z.string().min(1, "O apelido da empresa é obrigatório."),
  cnpj: z.string().min(14, "CNPJ deve ter 14 ou 18 caracteres.").max(18, "CNPJ deve ter 14 ou 18 caracteres."),
  activityType: z.enum(["COMMERCE_FOCUS", "SERVICE_FOCUS"], {
    required_error: "O tipo de atividade é obrigatório.",
  }),
  currentRevenueYear: z.coerce.number().nonnegative("O faturamento deve ser um número não negativo."),
  simplesLimit: z.coerce.number().positive("O teto do Simples deve ser um número positivo."),
  subLimit: z.coerce.number().positive("O sub-limite deve ser um número positivo."),
  logoUrl: z.string().url("URL do logo inválida.").optional().or(z.literal('')),
});

type CompanyFormValues = z.infer<typeof companySchema>;

function CompanyForm({
  company,
  onSuccess,
}: {
  company?: Company;
  onSuccess: () => void;
}) {
  const { addCompany, updateCompany } = useAppContext();
  const { toast } = useToast();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: company || {
      nickname: "",
      cnpj: "",
      activityType: "COMMERCE_FOCUS",
      currentRevenueYear: 0,
      simplesLimit: 4800000,
      subLimit: 3600000,
      logoUrl: "",
    },
  });

  const onSubmit = async (data: CompanyFormValues) => {
    try {
      if (company) {
        await updateCompany({ ...company, ...data });
        toast({ title: "Empresa Atualizada", description: `${data.nickname} foi atualizada com sucesso.` });
      } else {
        await addCompany(data as Omit<Company, "id">);
        toast({ title: "Empresa Adicionada", description: `${data.nickname} foi adicionada com sucesso.` });
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Ocorreu um erro ao salvar a empresa.", variant: "destructive" });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <ScrollArea className="h-[70vh] pr-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apelido da Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: EXS Comércio" {...field} />
                  </FormControl>
                  <FormDescription>Nome amigável para identificar a empresa no sistema.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl>
                    <Input placeholder="00.000.000/0001-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="activityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foco de Atividade</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o foco principal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="COMMERCE_FOCUS">Comércio</SelectItem>
                      <SelectItem value="SERVICE_FOCUS">Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Define a sugestão padrão para novas propostas.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentRevenueYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Faturamento Acumulado no Ano (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="subLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub-limite Simples (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>Teto para ICMS/ISS.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="simplesLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teto Global Simples (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>Teto máximo de faturamento.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Logo</FormLabel>
                  <FormControl>
                    <Input placeholder="https://.../logo.png" {...field} />
                  </FormControl>
                  <FormDescription>Logomarca para ser usada nos PDFs das propostas.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>
        <DialogFooter className="pt-4">
          <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
          <Button type="submit">{company ? "Salvar Alterações" : "Adicionar Empresa"}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function CompanyTable() {
  const { companies, deleteCompany, loading } = useAppContext();
  const { toast } = useToast();
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>(undefined);

  const handleDelete = async (company: Company) => {
    try {
      await deleteCompany(company.id);
      toast({
        title: "Empresa Excluída",
        description: `"${company.nickname}" foi removida.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível remover a empresa.",
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

  const formatCurrency = (value: number | undefined | null) => {
    const safeValue = value ?? 0;
    return safeValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };


  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Empresa</DialogTitle>
              <DialogDescription>
                Cadastre uma nova entidade legal para emissão de propostas e controle de faturamento.
              </DialogDescription>
            </DialogHeader>
            <CompanyForm onSuccess={() => setAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Apelido</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Foco</TableHead>
              <TableHead>Faturamento Atual</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(companies || []).filter(c => c && c.id).length > 0 ? (
              (companies || []).filter(c => c && c.id).map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.nickname || 'Sem Nome'}</TableCell>
                  <TableCell>{company.cnpj || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${company.activityType === 'COMMERCE_FOCUS' ? 'bg-sky-100 text-sky-800'
                      : 'bg-emerald-100 text-emerald-800'
                      }`}>
                      {company.activityType === 'COMMERCE_FOCUS' ? 'Comércio' : 'Serviço'}
                    </span>
                  </TableCell>
                  <TableCell>{formatCurrency(company.currentRevenueYear || 0)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog open={editingCompany?.id === company.id} onOpenChange={(isOpen) => !isOpen && setEditingCompany(undefined)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditingCompany(company)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Editar Empresa</DialogTitle>
                            <DialogDescription>
                              Atualize os dados de "{company.nickname}".
                            </DialogDescription>
                          </DialogHeader>
                          <CompanyForm company={company} onSuccess={() => setEditingCompany(undefined)} />
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
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente a empresa "{company.nickname}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(company)}>Excluir</AlertDialogAction>
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
                  Nenhuma empresa encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
