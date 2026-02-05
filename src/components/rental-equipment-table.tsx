"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Pencil, Trash2, Search, PlusCircle, UploadCloud, Copy, X } from "lucide-react";

import { useAppContext } from "@/context/app-context";
import { RentalEquipment, RentalAccessory, SaleCategory } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ProductImageUpload } from "@/components/product-image-upload";

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
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
    name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
    tags: z.array(z.string()).optional(),
    categoryId: z.string().min(1, { message: "Selecione uma categoria." }),
    serialNumber: z.string().min(1, { message: "Número de série é obrigatório." }),
    manufactureDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Data inválida",
    }),
    softwareVersion: z.string().min(1, { message: "Versão de software é obrigatória." }),
    firmwareVersion: z.string().min(1, { message: "Versão de firmware é obrigatória." }),
    lastCalibrationDate: z.string().optional(),
    status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'RETIRED']),
    notes: z.string().optional(),
    rentPrice: z.coerce.number().min(0, "O valor deve ser positivo").optional(),
    // Structured accessories
    accessories: z.array(z.object({
        id: z.string(),
        name: z.string(),
        imageUrl: z.string().nullable().optional(),
    })).optional(),
    includedSoftware: z.string().optional(),
    certificates: z.array(z.string()).optional(),
    // Image fields
    imageUrl: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function RentalEquipmentForm({ equipment, defaultValues, onSuccess }: { equipment?: RentalEquipment, defaultValues?: Partial<RentalEquipment>, onSuccess: () => void }) {
    const { addRentalEquipment, updateRentalEquipment, categories, rentalEquipments } = useAppContext();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentTag, setCurrentTag] = useState("");
    const [editingAccessory, setEditingAccessory] = useState<{ index: number, accessory: RentalAccessory } | null>(null);
    const [newAccessory, setNewAccessory] = useState<{ name: string, imageUrl: string | null }>({ name: '', imageUrl: null });

    // Merge equipment values or defaultValues (for duplication)
    const initialValues = equipment || defaultValues || {};

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialValues.name || "",
            tags: initialValues.tags || [],
            categoryId: initialValues.categoryId || "",
            serialNumber: initialValues.serialNumber || "",
            manufactureDate: initialValues.manufactureDate ? format(new Date(initialValues.manufactureDate), "yyyy-MM-dd") : "",
            softwareVersion: initialValues.softwareVersion || "",
            firmwareVersion: initialValues.firmwareVersion || "",
            lastCalibrationDate: initialValues.lastCalibrationDate ? format(new Date(initialValues.lastCalibrationDate), "yyyy-MM-dd") : "",
            status: initialValues.status || "AVAILABLE",
            notes: initialValues.notes || "",
            rentPrice: initialValues.rentPrice || 0,
            accessories: initialValues.accessories || [],
            includedSoftware: initialValues.includedSoftware || "",
            certificates: initialValues.certificates || [],
            imageUrl: initialValues.imageUrl || null,
        },
    });

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = currentTag.trim();
            if (val) {
                const currentTags = form.getValues("tags") || [];
                if (!currentTags.includes(val)) {
                    form.setValue("tags", [...currentTags, val]);
                }
                setCurrentTag("");
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        const currentTags = form.getValues("tags") || [];
        form.setValue("tags", currentTags.filter(t => t !== tagToRemove));
    };

    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        try {
            const selectedCategory = categories.find(c => c.id === values.categoryId);

            const dataToSave = {
                name: values.name,
                name_lower: values.name.toLowerCase(),
                categoryId: values.categoryId,
                categoryName: selectedCategory?.name || "",
                tags: values.tags,
                rentPrice: values.rentPrice,
                serialNumber: values.serialNumber,
                manufactureDate: new Date(values.manufactureDate).getTime(),
                softwareVersion: values.softwareVersion,
                firmwareVersion: values.firmwareVersion,
                lastCalibrationDate: values.lastCalibrationDate ? new Date(values.lastCalibrationDate).getTime() : undefined,
                status: values.status,
                notes: values.notes,
                accessories: values.accessories,
                includedSoftware: values.includedSoftware,
                certificates: values.certificates,
                imageUrl: values.imageUrl,
                createdAt: equipment?.createdAt || Date.now(),
            };

            if (equipment) {
                await updateRentalEquipment({ ...dataToSave, id: equipment.id });
                toast({ title: "Equipamento atualizado", description: `${values.name} atualizado com sucesso.` });
            } else {
                await addRentalEquipment(dataToSave);
                toast({ title: "Equipamento criado", description: `${values.name} criado com sucesso.` });
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            toast({ title: "Erro", description: "Falha ao salvar equipamento.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome do Equipamento</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Mala de Testes T1000" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
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
                                            <SelectValue placeholder="Selecione a categoria" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
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
                        name="tags"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tags</FormLabel>
                                <FormControl>
                                    <div className="space-y-2">
                                        <Input
                                            placeholder="Digite e tecle Enter para adicionar"
                                            value={currentTag}
                                            onChange={(e) => setCurrentTag(e.target.value)}
                                            onKeyDown={handleAddTag}
                                        />
                                        <div className="flex flex-wrap gap-1">
                                            {field.value?.map((tag, idx) => (
                                                <Badge key={idx} variant="secondary" className="px-1 py-0.5 text-xs font-normal">
                                                    {tag}
                                                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-slate-500 hover:text-slate-800">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="serialNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Número de Série</FormLabel>
                                <FormControl>
                                    <Input placeholder="SN123456" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="AVAILABLE">Disponível</SelectItem>
                                        <SelectItem value="RENTED">Alugado</SelectItem>
                                        <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
                                        <SelectItem value="RETIRED">Aposentado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="rentPrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Diária (R$)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" placeholder="0,00" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="manufactureDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data de Fabricação</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lastCalibrationDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Última Calibração</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="softwareVersion"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Versão Software</FormLabel>
                                <FormControl>
                                    <Input placeholder="v1.0.0" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="firmwareVersion"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Versão Firmware</FormLabel>
                                <FormControl>
                                    <Input placeholder="v2.1.0" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Histórico de manutenção, detalhes adicionais..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* New Section: Accessories and Checklist */}
                <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-semibold mb-3">Acessórios e Check list</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Itens fornecidos junto com o equipamento (usado para checklist de retirada/devolução)
                    </p>

                    <FormField
                        control={form.control}
                        name="includedSoftware"
                        render={({ field }) => (
                            <FormItem className="mb-4">
                                <FormLabel>Software/Licenças Inclusos</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Software de utilização v2.3, Licença LPTI" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-4">
                        {/* Accessories Table */}
                        <div>
                            <label className="text-sm font-medium mb-3 block">Acessórios</label>

                            {/* Accessories Table */}
                            {(form.watch('accessories') || []).length > 0 && (
                                <div className="border rounded-lg mb-3 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="text-left p-2 font-semibold">Nome</th>
                                                <th className="text-left p-2 font-semibold w-32">Imagem</th>
                                                <th className="w-20 p-2">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(form.watch('accessories') || []).map((accessory, index) => (
                                                <tr key={accessory.id} className="border-t">
                                                    <td className="p-2">{accessory.name}</td>
                                                    <td className="p-2">
                                                        {accessory.imageUrl ? (
                                                            <img src={accessory.imageUrl} alt={accessory.name} className="w-12 h-12 object-cover rounded" />
                                                        ) : (
                                                            <span className="text-xs text-slate-400">Sem imagem</span>
                                                        )}
                                                    </td>
                                                    <td className="p-2">
                                                        <div className="flex gap-1 justify-center">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => setEditingAccessory({ index, accessory })}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-600"
                                                                onClick={() => {
                                                                    const current = form.getValues('accessories') || [];
                                                                    form.setValue('accessories', current.filter((_, i) => i !== index));
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Add/Edit Accessory Form */}
                            {(editingAccessory || newAccessory.name !== '' || (form.watch('accessories') || []).length === 0) && (
                                <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
                                    <p className="text-sm font-semibold">{
                                        editingAccessory ? 'Editar Acessório' : 'Adicionar Acessório'
                                    }</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium mb-1 block">Nome</label>
                                            <Input
                                                placeholder="Ex: Maleta de transporte"
                                                value={editingAccessory ? editingAccessory.accessory.name : newAccessory.name}
                                                onChange={(e) => {
                                                    if (editingAccessory) {
                                                        setEditingAccessory({ ...editingAccessory, accessory: { ...editingAccessory.accessory, name: e.target.value } });
                                                    } else {
                                                        setNewAccessory({ ...newAccessory, name: e.target.value });
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium mb-1 block">Imagem</label>
                                            <ProductImageUpload
                                                productId={equipment?.id || 'new'}
                                                currentImageUrl={editingAccessory ? editingAccessory.accessory.imageUrl : newAccessory.imageUrl}
                                                onImageUploaded={(url) => {
                                                    if (editingAccessory) {
                                                        setEditingAccessory({ ...editingAccessory, accessory: { ...editingAccessory.accessory, imageUrl: url } });
                                                    } else {
                                                        setNewAccessory({ ...newAccessory, imageUrl: url });
                                                    }
                                                }}
                                                onImageRemoved={() => {
                                                    if (editingAccessory) {
                                                        setEditingAccessory({ ...editingAccessory, accessory: { ...editingAccessory.accessory, imageUrl: null } });
                                                    } else {
                                                        setNewAccessory({ ...newAccessory, imageUrl: null });
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => {
                                                if (editingAccessory) {
                                                    const current = form.getValues('accessories') || [];
                                                    const updated = [...current];
                                                    updated[editingAccessory.index] = editingAccessory.accessory;
                                                    form.setValue('accessories', updated);
                                                    setEditingAccessory(null);
                                                } else {
                                                    if (newAccessory.name.trim()) {
                                                        const current = form.getValues('accessories') || [];
                                                        form.setValue('accessories', [...current, {
                                                            id: Date.now().toString(),
                                                            name: newAccessory.name,
                                                            imageUrl: newAccessory.imageUrl
                                                        }]);
                                                        setNewAccessory({ name: '', imageUrl: null });
                                                    }
                                                }
                                            }}
                                            disabled={editingAccessory ? !editingAccessory.accessory.name.trim() : !newAccessory.name.trim()}
                                        >
                                            {editingAccessory ? 'Salvar' : 'Adicionar'}
                                        </Button>
                                        {editingAccessory && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setEditingAccessory(null)}
                                            >
                                                Cancelar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Show Add Button when not editing */}
                            {!editingAccessory && newAccessory.name === '' && (form.watch('accessories') || []).length > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setNewAccessory({ name: ' ', imageUrl: null })}
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Adicionar Acessório
                                </Button>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium">Certificados</label>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    placeholder="Ex: Certificado de calibração, Certificado de conformidade"
                                    value={currentTag}
                                    onChange={(e) => setCurrentTag(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (currentTag.trim()) {
                                                const currentCerts = form.getValues('certificates') || [];
                                                form.setValue('certificates', [...currentCerts, currentTag.trim()]);
                                                setCurrentTag('');
                                            }
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        if (currentTag.trim()) {
                                            const currentCerts = form.getValues('certificates') || [];
                                            form.setValue('certificates', [...currentCerts, currentTag.trim()]);
                                            setCurrentTag('');
                                        }
                                    }}
                                >
                                    Adicionar
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {(form.watch('certificates') || []).map((cert, index) => (
                                    <Badge key={index} variant="secondary" className="gap-1">
                                        {cert}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newCerts = (form.getValues('certificates') || []).filter((_, i) => i !== index);
                                                form.setValue('certificates', newCerts);
                                            }}
                                            className="ml-1 hover:text-destructive"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Image Upload Section */}
                <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-semibold mb-3">Imagens</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Adicione imagens do equipamento e dos acessórios para inclusão na proposta de locação (PLE)
                    </p>

                    <div className="space-y-4">
                        {/* Main Equipment Image */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Imagem Principal do Equipamento</label>
                            <ProductImageUpload
                                productId={equipment?.id || 'new'}
                                currentImageUrl={form.watch('imageUrl')}
                                onImageUploaded={(url) => form.setValue('imageUrl', url)}
                                onImageRemoved={() => form.setValue('imageUrl', null)}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

export function RentalEquipmentTable() {
    const { rentalEquipments, deleteRentalEquipment, loading, categories, addCategory, addRentalEquipment } = useAppContext();
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<RentalEquipment | undefined>(undefined);
    const [duplicatingEquipment, setDuplicatingEquipment] = useState<Partial<RentalEquipment> | undefined>(undefined);
    const [isImporting, setIsImporting] = useState(false);
    const { toast } = useToast();

    const filteredEquipments = useMemo(() => {
        let result = rentalEquipments;

        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            result = result.filter(e =>
                e.name.toLowerCase().includes(lower) ||
                e.serialNumber.toLowerCase().includes(lower) ||
                e.tags?.some(tag => tag.toLowerCase().includes(lower))
            );
        }

        // Natural sort by name (handles UTS 400, UTS 500, UTS 600, etc.)
        return result.sort((a, b) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB, undefined, {
                numeric: true,
                sensitivity: 'base'
            });
        });
    }, [rentalEquipments, searchQuery]);

    // Calculate statistics
    const statistics = useMemo(() => {
        const total = filteredEquipments.length;
        const byCategory: Record<string, number> = {};

        filteredEquipments.forEach((equipment) => {
            const categoryName = equipment.categoryName || "Sem Categoria";
            byCategory[categoryName] = (byCategory[categoryName] || 0) + 1;
        });

        return { total, byCategory };
    }, [filteredEquipments]);

    const handleDelete = async (id: string) => {
        try {
            await deleteRentalEquipment(id);
            toast({ title: "Equipamento removido", description: "O equipamento foi excluído com sucesso." });
        } catch (error) {
            toast({ title: "Erro", description: "Falha ao excluir equipamento.", variant: "destructive" });
        }
    };

    const handleDuplicate = (item: RentalEquipment) => {
        // Prepare data for duplication (remove unique IDs)
        const { id, serialNumber, code, createdAt, ...rest } = item;
        setEditingEquipment(undefined);
        setDuplicatingEquipment({
            ...rest,
            serialNumber: "", // Clear serial
            code: "", // Clear code to auto-generate or user input
        });
        setIsDialogOpen(true);
    };

    const openEdit = (equipment: RentalEquipment) => {
        setEditingEquipment(equipment);
        setDuplicatingEquipment(undefined);
        setIsDialogOpen(true);
    };

    const openNew = () => {
        setEditingEquipment(undefined);
        setDuplicatingEquipment(undefined);
        setIsDialogOpen(true);
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, tag ou ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="flex gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Novo Equipamento
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingEquipment ? "Editar Equipamento" : duplicatingEquipment ? "Duplicar Equipamento" : "Novo Equipamento"}
                                </DialogTitle>
                                <DialogDescription>
                                    Preencha os dados do equipamento de locação.
                                </DialogDescription>
                            </DialogHeader>
                            <RentalEquipmentForm
                                equipment={editingEquipment}
                                defaultValues={duplicatingEquipment}
                                onSuccess={() => setIsDialogOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Statistics Section */}
            <div className="rounded-lg border bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-emerald-600 text-white rounded-full px-4 py-2 font-semibold text-sm">
                            Total: {statistics.total} {statistics.total === 1 ? 'item' : 'itens'}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-600">Por categoria:</span>
                        {Object.entries(statistics.byCategory).length > 0 ? (
                            Object.entries(statistics.byCategory)
                                .sort(([, a], [, b]) => b - a) // Sort by count descending
                                .map(([category, count]) => (
                                    <Badge key={category} variant="secondary" className="bg-white/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium">
                                        {category}: <span className="font-bold text-emerald-700">{count}</span>
                                    </Badge>
                                ))
                        ) : (
                            <span className="text-sm text-slate-500 italic">Nenhuma categoria</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Serial</TableHead>
                            <TableHead>Diária (R$)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tags</TableHead>
                            <TableHead>Firmware/Software</TableHead>
                            <TableHead>Última Calibração</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredEquipments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    Nenhum equipamento encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredEquipments.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{item.categoryName || "-"}</TableCell>
                                    <TableCell>{item.serialNumber}</TableCell>
                                    <TableCell>
                                        {item.rentPrice ? item.rentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-semibold",
                                            item.status === 'AVAILABLE' && "bg-emerald-100 text-emerald-800",
                                            item.status === 'RENTED' && "bg-blue-100 text-blue-800",
                                            item.status === 'MAINTENANCE' && "bg-amber-100 text-amber-800",
                                            item.status === 'RETIRED' && "bg-slate-100 text-slate-800"
                                        )}>
                                            {item.status === 'AVAILABLE' && "Disponível"}
                                            {item.status === 'RENTED' && "Alugado"}
                                            {item.status === 'MAINTENANCE' && "Manutenção"}
                                            {item.status === 'RETIRED' && "Aposentado"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {item.tags?.map((t, i) => (
                                                <Badge key={i} variant="outline" className="text-[10px] px-1 py-0 h-5">
                                                    {t}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        <div>FW: {item.firmwareVersion}</div>
                                        <div>SW: {item.softwareVersion}</div>
                                    </TableCell>
                                    <TableCell>
                                        {item.lastCalibrationDate
                                            ? new Date(item.lastCalibrationDate).toLocaleDateString('pt-BR')
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Editar">
                                                <Pencil className="h-4 w-4 text-slate-600" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDuplicate(item)} title="Duplicar">
                                                <Copy className="h-4 w-4 text-emerald-600" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" title="Excluir">
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Excluir Equipamento?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Essa ação não pode ser desfeita. O equipamento <b>{item.name}</b> será removido permanentemente.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
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
        </div>
    );
}
