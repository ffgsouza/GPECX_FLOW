
"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Pencil, PlusCircle, Trash2, Loader2, Filter, Search, ImageIcon, Copy } from "lucide-react";
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
import { Switch } from "./ui/switch";
import { Checkbox } from "./ui/checkbox";

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
  imageUrl: z.string().url({ message: "Por favor, insira uma URL válida." }).optional().or(z.literal('')),
  isSoftwarePisCofinsFree: z.boolean().optional(),
  compatibleWith: z.array(z.string()).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

function ImagePreview({ url }: { url: string | null | undefined }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false); // Reset error state when URL changes
  }, [url]);


  if (!url || hasError) {
    return (
      <div className="w-36 h-36 bg-muted rounded-md flex items-center justify-center">
        <ImageIcon className="w-10 h-10 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt="Preview do produto"
      style={{ width: '144px', height: '144px', objectFit: 'cover', borderRadius: '8px' }}
      className="border"
      onError={() => setHasError(true)}
    />
  );
}

function ProductForm({
  product,
  onSuccess,
}: {
  product?: Partial<SaleProduct>;
  onSuccess: () => void;
}) {
  const { addProduct, updateProduct, categories, productTypes, products } = useAppContext();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? { ...product, compatibleWith: product.compatibleWith || [] } : {
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
      imageUrl: "",
      isSoftwarePisCofinsFree: false,
      compatibleWith: [],
    },
  });

  useEffect(() => {
    form.reset(product ? { ...product, compatibleWith: product.compatibleWith || [] } : {
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
      imageUrl: "",
      isSoftwarePisCofinsFree: false,
      compatibleWith: [],
    });
  }, [product, form]);


  const productTypeId = form.watch("productTypeId");
  const imageUrl = form.watch("imageUrl");
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
            // Check for duplicates, but ignore the document itself if we are editing
            if (product?.id) { 
                const foundDoc = querySnapshot.docs[0];
                if (foundDoc.id !== product.id) {
                    isDuplicate = true;
                }
            } else {
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

        const finalData: Omit<SaleProduct, 'id'> & { [key: string]: any } = {
            name: data.name,
            name_lower: lowerCaseName,
            description: data.description || '',
            fiscalDescription: data.fiscalDescription || '',
            internalNotes: data.internalNotes || '',
            categoryId: data.categoryId,
            productTypeId: data.productTypeId,
            costUSD: Number(data.costUSD),
            finalSellPriceBRL: data.finalSellPriceBRL ? Number(data.finalSellPriceBRL) : 0,
            imageUrl: data.imageUrl || '',
            compatibleWith: data.compatibleWith || [],
        };
        
        if (selectedProductType?.name === 'Licença de Software') {
            finalData.isSoftwarePisCofinsFree = data.isSoftwarePisCofinsFree || false;
        }
        
        if (selectedProductType?.requiresNcm && data.ncm) {
            finalData.ncm = data.ncm;
        }
        
        if (selectedProductType?.requiresWeight && (data.netWeightKg || data.netWeightKg === 0)) {
            finalData.netWeightKg = Number(data.netWeightKg);
        }
        
        if (product?.id) {
            await updateProduct({ ...finalData, id: product.id } as SaleProduct);
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
  
    const otherProducts = useMemo(() => {
        return products.filter(p => p.id !== product?.id)
            .reduce((acc, p) => {
                const categoryName = categories.find(c => c.id === p.categoryId)?.name || 'Outros';
                if (!acc[categoryName]) {
                    acc[categoryName] = [];
                }
                acc[categoryName].push(p);
                return acc;
            }, {} as Record<string, SaleProduct[]>);
    }, [products, product, categories]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">Informações Comerciais</TabsTrigger>
                <TabsTrigger value="fiscal">Dados Fiscais &amp; Logísticos</TabsTrigger>
                <TabsTrigger value="compatibilities">Compatibilidades</TabsTrigger>
                <TabsTrigger value="internal">Notas Internas</TabsTrigger>
            </TabsList>
            <ScrollArea className="h-[60vh] pr-6 mt-4">
                <TabsContent value="general" className="space-y-4">
                    <div className="flex gap-6 items-start">
                      <div className="flex-grow space-y-4">
                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL da Imagem (Imgur/Link Direto)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Cole o link da imagem aqui (https://...)"
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                      </div>
                      <div className="flex-shrink-0">
                         <FormLabel>Preview</FormLabel>
                         <ImagePreview url={imageUrl} />
                      </div>
                    </div>
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
                                            <Input type="number" step="0.1" placeholder="ex: 15.5" {...field} value={field.value ?? 0} />
                                            <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground text-sm">Kg</span>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />}
                        </div>
                     )}
                     {selectedProductType?.name === 'Licença de Software' && (
                        <FormField
                            control={form.control}
                            name="isSoftwarePisCofinsFree"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel>Isento de PIS/COFINS (Serviço)?</FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                        Marque se houver regime especial ou tese jurídica que isente este item.
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
                 <TabsContent value="compatibilities" className="space-y-4">
                    <div className="space-y-2">
                        <h3 className="font-medium">Produtos Compatíveis</h3>
                        <p className="text-sm text-muted-foreground">Selecione com quais produtos este item é compatível. Útil para softwares e acessórios.</p>
                    </div>
                     <Controller
                        control={form.control}
                        name="compatibleWith"
                        render={({ field }) => (
                            <div className="space-y-4">
                                {Object.entries(otherProducts).map(([categoryName, productsInCategory]) => (
                                    <div key={categoryName}>
                                        <h4 className="font-semibold mb-2">{categoryName}</h4>
                                        <div className="space-y-2 rounded-md border p-4">
                                            {productsInCategory.map((p) => (
                                                <div key={p.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`compat-${p.id}`}
                                                        checked={field.value?.includes(p.id)}
                                                        onCheckedChange={(checked) => {
                                                            const newValue = checked
                                                                ? [...(field.value || []), p.id]
                                                                : (field.value || []).filter((id) => id !== p.id);
                                                            field.onChange(newValue);
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={`compat-${p.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {p.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                    value={field.value ?? 0}
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
            {product?.id ? "Salvar Alterações" : "Adicionar Item"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}


function ProductList({ 
    products, 
    onEdit,
    onCopy,
    onDelete, 
    getCategoryName, 
    getProductTypeName 
}: { 
    products: SaleProduct[],
    onEdit: (product: SaleProduct) => void,
    onCopy: (product: SaleProduct) => void,
    onDelete: (product: SaleProduct) => void,
    getCategoryName: (id: string) => string,
    getProductTypeName: (id: string) => string,
}) {
    if (products.length === 0) {
        return (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Nenhum item encontrado com os filtros atuais.</p>
                <p className="text-sm text-muted-foreground/80">Tente limpar os filtros ou use a página de Seed para popular o banco.</p>
            </div>
        )
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Imagem</TableHead>
              <TableHead>Nome do Item</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Custo FOB (USD)</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center justify-center h-16 w-16 bg-muted rounded-md overflow-hidden">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="h-16 w-16 object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-16 w-16 bg-muted rounded-md">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      getProductTypeName(product.productTypeId) === 'Hardware'
                        ? 'bg-sky-100 text-sky-800'
                        : getProductTypeName(product.productTypeId) === 'Licença de Software'
                        ? 'bg-emerald-100 text-emerald-800'
                        : getProductTypeName(product.productTypeId) === 'Acessório'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {getProductTypeName(product.productTypeId)}
                  </span>
                </TableCell>
                <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                <TableCell className="text-right font-semibold">
                  {product.costUSD.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onCopy(product)}
                      title="Copiar Item"
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copiar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(product)}
                      title="Editar Item"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          title="Excluir Item"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá
                            permanentemente o produto "{product.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(product)}
                          >
                            Excluir
                          </AlertDialogAction>
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
    );
}

type SearchField = 'name' | 'type' | 'category' | 'cost';

export function ProductTable() {
  const { products, deleteProduct, getCategoryNameById, getProductTypeNameById, productTypes, categories, loading } = useAppContext();
  const { toast } = useToast();
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Partial<SaleProduct> | undefined>(undefined);
  const [dialogMode, setDialogMode] = useState<'add' | 'copy' | 'edit'>('add');


  const [filterTypeIds, setFilterTypeIds] = useState<string[]>([]);
  const [filterCategoryIds, setFilterCategoryIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'category' | 'type'>('category');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('name');

  const openDialog = (mode: 'add' | 'copy' | 'edit', product?: SaleProduct) => {
    setDialogMode(mode);
    if (mode === 'edit' && product) {
        setActiveProduct(product);
    } else if (mode === 'copy' && product) {
        const { id, ...productCopy } = product;
        setActiveProduct({ ...productCopy, name: `Cópia de ${product.name}` });
    } else {
        setActiveProduct(undefined);
    }
    setAddDialogOpen(true);
  };

  const closeDialogs = () => {
    setAddDialogOpen(false);
    setActiveProduct(undefined);
  };

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

  const sortedAndFilteredProducts = useMemo(() => {
    let filtered = [...products];

    if (filterTypeIds.length > 0) {
        filtered = filtered.filter(p => filterTypeIds.includes(p.productTypeId));
    }
    if (filterCategoryIds.length > 0) {
        filtered = filtered.filter(p => filterCategoryIds.includes(p.categoryId));
    }

    if (searchQuery) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(product => {
            switch (searchField) {
                case 'name':
                    return product.name_lower?.includes(lowerCaseQuery) || product.name.toLowerCase().includes(lowerCaseQuery);
                case 'type':
                    return getProductTypeNameById(product.productTypeId).toLowerCase().includes(lowerCaseQuery);
                case 'category':
                    return getCategoryNameById(product.categoryId).toLowerCase().includes(lowerCaseQuery);
                case 'cost':
                    return product.costUSD.toString().includes(lowerCaseQuery);
                default:
                    return true;
            }
        });
    }

    return filtered.sort((a, b) => {
        if (sortBy === 'category') {
            const categoryNameA = getCategoryNameById(a.categoryId);
            const categoryNameB = getCategoryNameById(b.categoryId);
            const order: { [key: string]: number } = {
                'Universal Test Set': 1,
                'Acessórios Gerais': 3,
            };

            const orderA = order[categoryNameA] || 2;
            const orderB = order[categoryNameB] || 2;

            if (orderA !== orderB) {
                return orderA - orderB;
            }

            return categoryNameA.localeCompare(categoryNameB) || a.name.localeCompare(b.name);
        }
        
        const typeNameA = getProductTypeNameById(a.productTypeId);
        const typeNameB = getProductTypeNameById(b.productTypeId);
        return typeNameA.localeCompare(typeNameB) || a.name.localeCompare(b.name);
    });
  }, [products, filterTypeIds, filterCategoryIds, sortBy, getCategoryNameById, getProductTypeNameById, searchQuery, searchField]);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const dialogTitle = {
    add: 'Adicionar Novo Item ao Catálogo',
    edit: `Editar Item: ${activeProduct?.name || ''}`,
    copy: 'Copiar Item do Catálogo'
  };

  const dialogDescription = {
    add: 'Insira os detalhes do item (seja hardware ou software) e suas configurações.',
    edit: 'Atualize os detalhes do item abaixo.',
    copy: 'Ajuste os detalhes para criar um novo item a partir de uma cópia.'
  };


  return (
    <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full md:w-80">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input 
                        placeholder={`Buscar por ${searchField === 'name' ? 'nome...' : searchField}...`}
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={searchField} onValueChange={(value) => setSearchField(value as SearchField)}>
                    <SelectTrigger className="w-full md:w-[140px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="name">Nome</SelectItem>
                        <SelectItem value="type">Tipo</SelectItem>
                        <SelectItem value="category">Categoria</SelectItem>
                        <SelectItem value="cost">Custo</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center justify-end gap-2">
                <Button onClick={() => openDialog('add')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Item
                </Button>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Filtrar por Tipo
                        {filterTypeIds.length > 0 && <span className="ml-2 rounded-full bg-primary px-2 text-xs text-primary-foreground">{filterTypeIds.length}</span>}
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
                    <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Filtrar por Categoria
                        {filterCategoryIds.length > 0 && <span className="ml-2 rounded-full bg-primary px-2 text-xs text-primary-foreground">{filterCategoryIds.length}</span>}
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
            
            <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ordenar por:</span>
                 <Button variant={sortBy === 'category' ? 'secondary' : 'ghost'} size="sm" onClick={() => setSortBy('category')}>Categoria</Button>
                 <Button variant={sortBy === 'type' ? 'secondary' : 'ghost'} size="sm" onClick={() => setSortBy('type')}>Tipo</Button>
            </div>

            {(filterTypeIds.length > 0 || filterCategoryIds.length > 0) && (
                <Button variant="ghost" size="sm" onClick={() => { setFilterTypeIds([]); setFilterCategoryIds([]); }}>Limpar Filtros</Button>
            )}
        </div>


       <ProductList 
          products={sortedAndFilteredProducts}
          onEdit={(product) => openDialog('edit', product)}
          onCopy={(product) => openDialog('copy', product)}
          onDelete={handleDelete}
          getCategoryName={getCategoryNameById}
          getProductTypeName={getProductTypeNameById}
        />

        <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{dialogTitle[dialogMode]}</DialogTitle>
                    <DialogDescription>
                        {dialogDescription[dialogMode]}
                    </DialogDescription>
                </DialogHeader>
                <ProductForm product={activeProduct} onSuccess={closeDialogs} />
            </DialogContent>
        </Dialog>
    </div>
  );
}
