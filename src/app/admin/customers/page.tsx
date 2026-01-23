"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Building2,
  Users,
  Mail,
  Loader2,
  Check
} from "lucide-react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  type Firestore
} from "firebase/firestore";

import { useAppContext } from "@/context/app-context";
import { normalizeCustomer } from "@/lib/customer-adapter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Customer } from "@/lib/types";

// --- SCHEMA DE VALIDAÇÃO ---
const customerSchema = z.object({
  cnpj: z.string().min(14, "CNPJ obrigatório"),
  companyName: z.string().min(2, "Razão Social obrigatória"),
  tradeName: z.string().optional(),
  stateRegistration: z.string().optional(),
  email: z.string().email("E-mail inválido").or(z.literal("")),
  phone: z.string().optional(),
  contactName: z.string().optional(),

  address: z.object({
    zipCode: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }),
});

type CustomerFormValues = z.infer<typeof customerSchema>;


export default function CustomersPage() {
  const { toast } = useToast();
  const { db } = useAppContext();

  // --- ESTADOS ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Loaders de API
  const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);

  // --- FORMULÁRIO ---
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      cnpj: "",
      companyName: "",
      tradeName: "",
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
      }
    },
  });

  // --- BUSCAR DADOS (REALTIME) ---
  useEffect(() => {
    if (!db) return;

    // Fetch without orderBy to handle both EXS and GPECX schemas
    const q = query(collection(db, "customers"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Apply normalizeCustomer to handle both EXS and GPECX formats
      const data = snapshot.docs.map((doc) =>
        normalizeCustomer({ id: doc.id, ...doc.data() })
      );
      // Sort in memory after normalization
      data.sort((a, b) => (a.tradeName || '').localeCompare(b.tradeName || ''));
      setCustomers(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar clientes:", error);
      setIsLoading(false);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível buscar a lista de clientes.",
        variant: "destructive"
      })
    });
    return () => unsubscribe();
  }, [db, toast]);

  // --- FILTRO DE BUSCA ---
  const filteredCustomers = useMemo(() => {
    return customers.filter(c =>
      (c.tradeName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (c.companyName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (c.cnpj || "").includes(searchTerm)
    );
  }, [customers, searchTerm]);

  // --- API: BUSCAR CNPJ ---
  const handleConsultarCNPJ = async () => {
    const cnpjDigitado = form.getValues("cnpj");
    const cnpjLimpo = cnpjDigitado?.replace(/\D/g, '');

    if (!cnpjLimpo || cnpjLimpo.length !== 14) {
      toast({ title: "CNPJ Inválido", description: "Por favor, digite um CNPJ válido com 14 números.", variant: "destructive" });
      return;
    }

    setIsLoadingCNPJ(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!response.ok) throw new Error("CNPJ não encontrado na base de dados pública.");

      const data = await response.json();

      form.setValue("companyName", data.razao_social);
      form.setValue("tradeName", data.nome_fantasia || data.razao_social);
      form.setValue("email", data.email || "");
      form.setValue("phone", data.ddd_telefone_1 || "");

      form.setValue("address.zipCode", data.cep);
      form.setValue("address.street", data.logradouro);
      form.setValue("address.number", data.numero);
      form.setValue("address.complement", data.complemento);
      form.setValue("address.district", data.bairro);
      form.setValue("address.city", data.municipio);
      form.setValue("address.state", data.uf);

      toast({ title: "Sucesso!", description: "Dados do CNPJ preenchidos automaticamente." });

    } catch (error: any) {
      console.error(error);
      toast({ title: "Erro na Consulta", description: error.message || "Não foi possível buscar os dados do CNPJ.", variant: "destructive" });
    } finally {
      setIsLoadingCNPJ(false);
    }
  };

  // --- API: BUSCAR CEP ---
  const handleConsultarCEP = async () => {
    const cepDigitado = form.getValues("address.zipCode");
    const cepLimpo = cepDigitado?.replace(/\D/g, '');

    if (!cepLimpo || cepLimpo.length !== 8) {
      toast({ title: "CEP Inválido", description: "Por favor, digite um CEP válido com 8 números.", variant: "destructive" });
      return;
    }

    setIsLoadingCEP(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`);
      if (!response.ok) throw new Error("CEP não encontrado.");

      const data = await response.json();

      form.setValue("address.street", data.street);
      form.setValue("address.district", data.neighborhood);
      form.setValue("address.city", data.city);
      form.setValue("address.state", data.state);
      toast({ title: "Sucesso!", description: "Endereço preenchido automaticamente." });

    } catch (error: any) {
      console.error(error);
      toast({ title: "Erro na Consulta", description: error.message || "Não foi possível buscar os dados do CEP.", variant: "destructive" });
    } finally {
      setIsLoadingCEP(false);
    }
  };

  // --- CRUD ACTIONS ---
  const handleAddNew = () => {
    setEditingId(null);
    form.reset({
      cnpj: "",
      companyName: "",
      tradeName: "",
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
      }
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    form.reset(customer);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "customers", id));
      toast({ title: "Cliente excluído", description: "O cliente foi removido com sucesso." });
    } catch (error) {
      toast({ title: "Erro ao excluir", description: "Não foi possível remover o cliente.", variant: "destructive" });
    }
  };

  const onSubmit = async (data: CustomerFormValues) => {
    if (!db) return;
    setIsSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "customers", editingId), { ...data });
        toast({ title: "Sucesso!", description: "Cliente atualizado." });
      } else {
        await addDoc(collection(db, "customers"), {
          ...data,
          createdAt: Date.now(),
        });
        toast({ title: "Sucesso!", description: "Novo cliente adicionado." });
      }
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({ title: "Erro ao salvar", description: "Não foi possível salvar os dados do cliente.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Gerenciar Clientes</h2>
          <p className="text-sm text-muted-foreground">
            Base de clientes para emissão de propostas e faturamento.
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <Separator />

      {/* FILTROS */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Buscar Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por Nome, Fantasia ou CNPJ..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* TABELA */}
      <Card className="overflow-hidden">
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[300px] text-xs uppercase font-medium">Empresa / Fantasia</TableHead>
                <TableHead className="text-xs uppercase font-medium">CNPJ / Contato</TableHead>
                <TableHead className="text-xs uppercase font-medium">Localização</TableHead>
                <TableHead className="text-right text-xs uppercase font-medium">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Carregando clientes...
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center flex flex-col items-center justify-center text-muted-foreground">
                    <Users className="h-8 w-8 mb-2 opacity-20" />
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted/50 h-16">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{customer.tradeName || customer.companyName}</span>
                        <span className="text-xs text-muted-foreground">{customer.companyName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Building2 className="w-3 h-3 text-primary" />
                          <span>{customer.cnpj}</span>
                        </div>
                        {customer.contactName && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" /> {customer.contactName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm text-gray-600">
                        {customer.address?.city || customer.address?.state ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {customer.address.city && customer.address.state
                              ? `${customer.address.city} - ${customer.address.state}`
                              : customer.address.city || customer.address.state || 'Não informado'
                            }
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            Não informado
                          </span>
                        )}
                        {customer.email && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {customer.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)}>
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente "{customer.tradeName || customer.companyName}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(customer.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* DIALOG (FORMULÁRIO) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            <DialogDescription>
              Preencha os dados fiscais e de contato. Use as buscas para preencher automaticamente.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">

              <Tabs defaultValue="geral" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="geral">Dados Gerais</TabsTrigger>
                  <TabsTrigger value="endereco">Endereço</TabsTrigger>
                </TabsList>

                {/* ABA 1: DADOS GERAIS */}
                <TabsContent value="geral" className="space-y-4 py-4">

                  <div className="flex gap-4 items-end">
                    <FormField
                      control={form.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>CNPJ</FormLabel>
                          <FormControl>
                            <Input placeholder="00.000.000/0000-00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleConsultarCNPJ}
                      disabled={isLoadingCNPJ}
                      className="mb-2 border-primary/20 text-primary hover:bg-primary/5"
                    >
                      {isLoadingCNPJ ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                      Buscar CNPJ
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Razão Social</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tradeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Fantasia</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="stateRegistration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inscrição Estadual</FormLabel>
                          <FormControl><Input placeholder="Isento ou Número" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contato</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl><Input type="email" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone / Celular</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* ABA 2: ENDEREÇO (COM BUSCA CEP) */}
                <TabsContent value="endereco" className="space-y-4 py-4">
                  <div className="flex gap-4 items-end">
                    <FormField
                      control={form.control}
                      name="address.zipCode"
                      render={({ field }) => (
                        <FormItem className="w-1/3">
                          <FormLabel>CEP</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleConsultarCEP}
                      disabled={isLoadingCEP}
                      className="mb-2 border-primary/20 text-primary hover:bg-primary/5"
                    >
                      {isLoadingCEP ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                      Buscar CEP
                    </Button>

                    <FormField
                      control={form.control}
                      name="address.state"
                      render={({ field }) => (
                        <FormItem className="w-24">
                          <FormLabel>UF</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="address.street"
                      render={({ field }) => (
                        <FormItem className="col-span-3">
                          <FormLabel>Rua / Logradouro</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address.district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.complement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complemento</FormLabel>
                          <FormControl><Input placeholder="Apto, Bloco, etc." {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="border-t pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/90">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  {editingId ? "Salvar Alterações" : "Criar Cliente"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
