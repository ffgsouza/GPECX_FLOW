
"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppContext } from "@/context/app-context";
import type { SaleProduct, ProductType, SaleCategory } from "@/lib/types";
import { collection, query, where, getDocs } from "firebase/firestore";

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
import { Pencil, PlusCircle, Trash2, Loader2, Filter } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { initializeFirebase } from "@/firebase";


const productSchema = z.object({
  name: z.string().min(1, { message: "Nome do produto é obrigatório" }),
  description: z.string().optional(),
  fiscalDescription: z.string().optional(),
  internalNotes: z.string().optional(),
  categoryId: z.string().min(1, { message: "Categoria é obrigatória" }),
  productTypeId: z.string().min(1, { message: "Tipo de item é obrigatório" }),
  costUSD: z.coerce.number().min(0, { message: "Deve ser um número positivo" }),
  ncm: z.string().optional(),
  netWeightKg: z.coerce.number().optional(),
  finalSellPriceBRL: z.coerce.number().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

function ProductForm({
  product,
  onSuccess,
}: {
  product?: SaleProduct;
  onSuccess: () => void;
}) {
  const { addProduct, updateProduct, categories, productTypes } = useAppContext();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product || {
      name: "",
      description: "",
      fiscalDescription: "",
      internalNotes: "",
      categoryId: "",
      productTypeId: "",
      costUSD: 0,
      ncm: "",
      netWeightKg: 0,
      finalSellPriceBRL: 0,
    },
  });

  const productTypeId = form.watch("productTypeId");
  const selectedProductType = productTypes.find(pt => pt.id === productTypeId);

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    const { db } = initializeFirebase();
    if (!db) {
        toast({ title: "Erro de Conexão", description: "Não foi possível conectar ao Firestore.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    try {
        const lowerCaseName = data.name.toLowerCase();
        const q = query(collection(db, "products"), where("name_lower", "==", lowerCaseName));
        const querySnapshot = await getDocs(q);

        let isDuplicate = false;
        if (!querySnapshot.empty) {
            if (product) { // Edit mode
                // Check if the found product is a different one
                const foundDoc = querySnapshot.docs[0];
                if (foundDoc.id !== product.id) {
                    isDuplicate = true;
                }
            } else { // Create mode
                isDuplicate = true;
            }
        }

        if (isDuplicate) {
            toast({
                title: "Erro de Duplicidade",
                description: "Já existe um produto cadastrado com este nome.",
                variant: "destructive",
            });
            setIsSubmitting(false);
            return;
        }

        const finalData = {
          ...data,
          name_lower: lowerCaseName,
          ncm: (selectedProductType?.requiresNcm && data.ncm) ? data.ncm : null,
          netWeightKg: (selectedProductType?.requiresWeight && data.netWeightKg) ? Number(data.netWeightKg) : null,
          costUSD: Number(data.costUSD),
          finalSellPriceBRL: data.finalSellPriceBRL ? Number(data.finalSellPriceBRL) : 0,
        };

        if (product) {
            await updateProduct({ ...product, ...finalData });
            toast({ title: "Produto Atualizado", description: `${data.name} foi atualizado com sucesso.` });
        } else {
            await addProduct(finalData as Omit<SaleProduct, 'id'>);
            toast({ title: "Produto Adicionado", description: `${data.name} foi adicionado com sucesso.` });
        }
        onSuccess();
    } catch (error) {
        console.error("Erro ao salvar o produto:", error);
        toast({ title: "Erro", description: "Ocorreu um erro ao salvar o produto. Verifique o console.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">Informações Comerciais</TabsTrigger>
                <TabsTrigger value="fiscal">Dados Fiscais & Logísticos</TabsTrigger>
                <TabsTrigger value="internal">Notas Internas</TabsTrigger>
            </TabsList>
            <ScrollArea className="h-[60vh] pr-6 mt-4">
                <TabsContent value="general" className="space-y-4">
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
                    <div className="grid grid-cols-2 gap-4">
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
                        name="productTypeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Item</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {productTypes.map(pt => (
                                    <SelectItem key={pt.id} value={pt.id}>
                                      {pt.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                     <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Descrição Comercial</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Texto para o cliente final, usado em propostas e catálogos..." {...field} rows={5}/>
                            </FormControl>
                             <FormDescription>Esta é a descrição que aparecerá nos documentos para o cliente.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </TabsContent>
                <TabsContent value="fiscal" className="space-y-4">
                     {selectedProductType && (selectedProductType.requiresNcm || selectedProductType.requiresWeight) && (
                        <div className="grid grid-cols-2 gap-4">
                            {selectedProductType.requiresNcm && <FormField
                                control={form.control}
                                name="ncm"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>NCM</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ex: 9031.80.99" {...field} value={field.value || ''}/>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />}
                            {selectedProductType.requiresWeight && <FormField
                                control={form.control}
                                name="netWeightKg"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Peso Líquido (Kg)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type="number" step="0.1" placeholder="ex: 15.5" {...field} value={field.value || 0} />
                                            <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground text-sm">Kg</span>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />}
                        </div>
                     )}
                     <FormField
                        control={form.control}
                        name="fiscalDescription"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Descrição Técnica / Fiscal</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Texto técnico para NCM, Declaração de Importação, etc." {...field} value={field.value ?? ''} rows={5} />
                            </FormControl>
                            <FormDescription>Usado para fins fiscais e de importação. Se vazio, a descrição comercial será usada.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </TabsContent>
                <TabsContent value="internal" className="space-y-4">
                    <FormField
                        control={form.control}
                        name="internalNotes"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Notas Internas</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Alertas de compatibilidade, dicas de NCM, detalhes de fornecedor..." {...field} value={field.value ?? ''} rows={5}/>
                            </FormControl>
                            <FormDescription>Visível apenas para a equipe interna.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
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
                                    value={field.value || 0}
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
                </TabsContent>
            </ScrollArea>
        </Tabs>
        
        <DialogFooter className="pt-4 border-t">
          <DialogClose asChild><Button variant="ghost" disabled={isSubmitting}>Cancelar</Button></DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {product ? "Salvar Alterações" : "Adicionar Item"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}


function ProductList({ 
    products, 
    onEdit, 
    onDelete, 
    getCategoryName, 
    getProductTypeName 
}: { 
    products: SaleProduct[],
    onEdit: (product: SaleProduct) => void,
    onDelete: (product: SaleProduct) => void,
    getCategoryName: (id: string) => string,
    getProductTypeName: (id: string) => string,
}) {
    const groupedProducts = useMemo(() => {
        return products.reduce((acc, product) => {
            const productTypeName = getProductTypeName(product.productTypeId);
            if (!acc[productTypeName]) {
                acc[productTypeName] = [];
            }
            acc[productTypeName].push(product);
            return acc;
        }, {} as Record<string, SaleProduct[]>);
    }, [products, getProductTypeName]);

    if (products.length === 0) {
        return (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Nenhum item encontrado com os filtros atuais.</p>
                <p className="text-sm text-muted-foreground/80">Tente limpar os filtros ou use a página de Seed para popular o banco.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {Object.entries(groupedProducts).map(([typeName, productList]) => (
                <div key={typeName}>
                    <h3 className="text-lg font-semibold mb-2 px-2 text-primary/80">{typeName}</h3>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome do Item</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead className="text-right">Custo FOB (USD)</TableHead>
                                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productList.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {product.costUSD.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="sr-only">Editar</span>
                                                </Button>
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
                                                        <AlertDialogAction onClick={() => onDelete(product)}>Excluir</AlertDialogAction>
                                                      </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ProductTable() {
  const { products, deleteProduct, getCategoryNameById, getProductTypeNameById, productTypes, categories, loading } = useAppContext();
  const { toast } = useToast();
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SaleProduct | undefined>(undefined);
  const [filterTypeIds, setFilterTypeIds] = useState<string[]>([]);
  const [filterCategoryIds, setFilterCategoryIds] = useState<string[]>([]);


  const handleEdit = (product: SaleProduct) => {
    setEditingProduct(product);
  };
  
  const closeEditDialog = () => {
    setEditingProduct(undefined);
  }

  const handleDelete = async (product: SaleProduct) => {
    try {
        await deleteProduct(product.id);
        toast({
        title: "Produto Excluído",
        description: `"${product.name}" foi removido.`,
        variant: "default",
        });
    } catch(error){
        toast({
        title: "Erro ao excluir",
        description: "Não foi possível remover o produto.",
        variant: "destructive",
        });
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
        const typeMatch = filterTypeIds.length === 0 || filterTypeIds.includes(product.productTypeId);
        const categoryMatch = filterCategoryIds.length === 0 || filterCategoryIds.includes(product.categoryId);
        return typeMatch && categoryMatch;
    })
  }, [products, filterTypeIds, filterCategoryIds]);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        Filtrar por Tipo
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Tipos de Item</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {productTypes.map((type: ProductType) => (
                         <DropdownMenuCheckboxItem
                            key={type.id}
                            checked={filterTypeIds.includes(type.id)}
                            onCheckedChange={(checked) => {
                                setFilterTypeIds(prev => checked ? [...prev, type.id] : prev.filter(id => id !== type.id));
                            }}
                         >
                            {type.name}
                         </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        Filtrar por Categoria
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Categorias</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {categories.map((cat: SaleCategory) => (
                         <DropdownMenuCheckboxItem
                            key={cat.id}
                            checked={filterCategoryIds.includes(cat.id)}
                            onCheckedChange={(checked) => {
                                setFilterCategoryIds(prev => checked ? [...prev, cat.id] : prev.filter(id => id !== cat.id));
                            }}
                         >
                            {cat.name}
                         </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {(filterTypeIds.length > 0 || filterCategoryIds.length > 0) && (
                <Button variant="ghost" onClick={() => { setFilterTypeIds([]); setFilterCategoryIds([]); }}>Limpar Filtros</Button>
            )}
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
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

       <ProductList 
          products={filteredProducts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          getCategoryName={getCategoryNameById}
          getProductTypeName={getProductTypeNameById}
        />

        {/* Edit Dialog */}
        <Dialog open={!!editingProduct} onOpenChange={(isOpen) => !isOpen && closeEditDialog()}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Editar Item</DialogTitle>
                    <DialogDescription>
                    Atualize os detalhes de "{editingProduct?.name}".
                    </DialogDescription>
                </DialogHeader>
                {editingProduct && <ProductForm product={editingProduct} onSuccess={closeEditDialog} />}
            </DialogContent>
        </Dialog>
    </div>
  );
}
