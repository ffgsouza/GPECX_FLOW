
"use client";

import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppContext } from "@/context/app-context";
import type { Customer } from "@/lib/types";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Pencil, PlusCircle, Trash2, Loader2, Search, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const addressSchema = z.object({
  zipCode: z.string().min(1, "CEP é obrigatório."),
  street: z.string().min(1, "Rua é obrigatória."),
  number: z.string().min(1, "Número é obrigatório."),
  complement: z.string().optional(),
  district: z.string().min(1, "Bairro é obrigatório."),
  city: z.string().min(1, "Cidade é obrigatória."),
  state: z.string().min(2, "UF deve ter 2 letras.").max(2, "UF deve ter 2 letras."),
});

const customerSchema = z.object({
  companyName: z.string().min(1, "Razão Social é obrigatória."),
  tradeName: z.string().min(1, "Nome Fantasia é obrigatório."),
  cnpj: z.string().min(14, "CNPJ deve ter 14 ou 18 caracteres.").max(18, "CNPJ deve ter 14 ou 18 caracteres."),
  stateRegistration: z.string().optional(),
  email: z.string().email("Email inválido."),
  phone: z.string().min(1, "Telefone é obrigatório."),
  contactName: z.string().min(1, "Nome do contato é obrigatório."),
  address: addressSchema,
});

type CustomerFormValues = z.infer<typeof customerSchema>;

function CustomerForm({
  customer,
  onSuccess,
}: {
  customer?: Customer;
  onSuccess: () => void;
}) {
  const { addCustomer, updateCustomer } = useAppContext();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer || {
      companyName: "",
      tradeName: "",
      cnpj: "",
      stateRegistration: "",
      email: "",
      phone: "",
      contactName: "",
      address: {
        zipCode: "",
        street: "",
        number: "",
        complement: "",
        district: "",
        city: "",
        state: "",
      },
    },
  });

  const onSubmit = async (data: CustomerFormValues) => {
    setIsSubmitting(true);
    try {
      if (customer) {
        await updateCustomer({ ...customer, ...data });
        toast({ title: "Cliente Atualizado", description: `${data.tradeName} foi atualizado com sucesso.` });
      } else {
        await addCustomer(data as Omit<Customer, 'id' | 'createdAt'>);
        toast({ title: "Cliente Adicionado", description: `${data.tradeName} foi adicionado com sucesso.` });
      }
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar o cliente:", error);
      toast({ title: "Erro", description: "Ocorreu um erro ao salvar o cliente.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatCnpj = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };
  
  const formatZipCode = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 9);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Dados Gerais</TabsTrigger>
            <TabsTrigger value="address">Endereço</TabsTrigger>
          </TabsList>
          <ScrollArea className="h-[60vh] pr-6 mt-4">
            <TabsContent value="general" className="space-y-4">
              <FormField
                control={form.control}
                name="tradeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Fantasia</FormLabel>
                    <FormControl><Input placeholder="Nome comercial do cliente" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social</FormLabel>
                    <FormControl><Input placeholder="Nome legal da empresa" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                            <Input 
                                placeholder="00.000.000/0001-00" 
                                {...field}
                                onChange={e => field.onChange(formatCnpj(e.target.value))}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="stateRegistration"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Inscrição Estadual</FormLabel>
                        <FormControl><Input placeholder="Número da IE" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Contato Principal</FormLabel>
                    <FormControl><Input placeholder="Comprador, Engenheiro, etc." {...field} /></FormControl>
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
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" placeholder="contato@cliente.com" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl><Input placeholder="(11) 99999-9999" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
            </TabsContent>
            <TabsContent value="address" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="address.zipCode"
                        render={({ field }) => (
                        <FormItem className="col-span-1">
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="00000-000" 
                                    {...field}
                                    onChange={e => field.onChange(formatZipCode(e.target.value))}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="address.street"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Rua / Logradouro</FormLabel>
                        <FormControl><Input placeholder="Av. Principal" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <div className="grid grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="address.number"
                        render={({ field }) => (
                        <FormItem className="col-span-1">
                            <FormLabel>Número</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="address.complement"
                        render={({ field }) => (
                        <FormItem className="col-span-2">
                            <FormLabel>Complemento</FormLabel>
                            <FormControl><Input placeholder="Sala 101, Bloco B" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="address.district"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <div className="grid grid-cols-5 gap-4">
                    <FormField
                        control={form.control}
                        name="address.city"
                        render={({ field }) => (
                        <FormItem className="col-span-4">
                            <FormLabel>Cidade</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="address.state"
                        render={({ field }) => (
                        <FormItem className="col-span-1">
                            <FormLabel>UF</FormLabel>
                            <FormControl><Input placeholder="SP" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        <DialogFooter className="pt-4 border-t">
          <DialogClose asChild><Button variant="ghost" disabled={isSubmitting}>Cancelar</Button></DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {customer?.id ? "Salvar Alterações" : "Adicionar Cliente"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function CustomerTable() {
  const { customers, deleteCustomer, loading } = useAppContext();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<Customer | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  const openDialog = (customer?: Customer) => {
    setActiveCustomer(customer);
    setIsDialogOpen(true);
  };

  const closeDialogs = () => {
    setIsDialogOpen(false);
    setActiveCustomer(undefined);
  };

  const handleDelete = async (customer: Customer) => {
    try {
      await deleteCustomer(customer.id);
      toast({
        title: "Cliente Excluído",
        description: `"${customer.tradeName}" foi removido.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível remover o cliente.",
        variant: "destructive",
      });
    }
  };

  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];
    if (searchQuery) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(c => 
            c.tradeName.toLowerCase().includes(lowerCaseQuery) ||
            c.companyName.toLowerCase().includes(lowerCaseQuery) ||
            c.cnpj.includes(lowerCaseQuery) ||
            c.contactName.toLowerCase().includes(lowerCaseQuery) ||
            c.email.toLowerCase().includes(lowerCaseQuery)
        );
    }
    return filtered.sort((a, b) => a.tradeName.localeCompare(b.tradeName));
  }, [customers, searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const dialogTitle = activeCustomer ? "Editar Cliente" : "Adicionar Novo Cliente";
  const dialogDescription = activeCustomer ? `Atualize os dados de ${activeCustomer.tradeName}.` : "Insira os detalhes do cliente para salvar no CRM.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome, CNPJ, contato..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => openDialog()} className="w-full md:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome Fantasia</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Contato Principal</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.tradeName}</TableCell>
                  <TableCell>{customer.cnpj}</TableCell>
                  <TableCell>{customer.contactName}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-0.5">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(customer)} title="Editar Cliente">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Excluir Cliente">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente "{customer.tradeName}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(customer)}>Excluir</AlertDialogAction>
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
                  {searchQuery ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                  <DialogTitle>{dialogTitle}</DialogTitle>
                  <DialogDescription>{dialogDescription}</DialogDescription>
              </DialogHeader>
              <CustomerForm customer={activeCustomer} onSuccess={closeDialogs} />
          </DialogContent>
      </Dialog>
    </div>
  );
}
