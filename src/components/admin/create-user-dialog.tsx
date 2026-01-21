"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateUserFormData, createUserSchema, availablePermissions, roleLabels } from "@/lib/user-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";

interface CreateUserDialogProps {
    onUserCreated?: () => void;
}

export function CreateUserDialog({ onUserCreated }: CreateUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const { toast } = useToast();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm<CreateUserFormData>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            role: "user",
            permissions: [],
        },
    });

    const handlePermissionChange = (permissionId: string, checked: boolean) => {
        const updated = checked
            ? [...selectedPermissions, permissionId]
            : selectedPermissions.filter((p) => p !== permissionId);

        setSelectedPermissions(updated);
        setValue("permissions", updated);
    };

    const onSubmit = async (data: CreateUserFormData) => {
        setIsLoading(true);

        try {
            const response = await fetch("/api/users/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Erro ao criar usuário");
            }

            toast({
                title: "Usuário criado com sucesso!",
                description: `${data.name} (${data.email}) foi adicionado ao sistema.`,
            });

            reset();
            setSelectedPermissions([]);
            setOpen(false);
            onUserCreated?.();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message || "Não foi possível criar o usuário.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Novo Usuário
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Criar Novo Usuário</DialogTitle>
                    <DialogDescription>
                        Preencha os dados do novo usuário e defina suas permissões.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo *</Label>
                        <Input
                            id="name"
                            placeholder="Ex: João Silva"
                            disabled={isLoading}
                            {...register("name")}
                            className={errors.name ? "border-red-500" : ""}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-600">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="usuario@gpecx.com.br"
                            disabled={isLoading}
                            {...register("email")}
                            className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-600">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password">Senha Temporária *</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            disabled={isLoading}
                            {...register("password")}
                            className={errors.password ? "border-red-500" : ""}
                        />
                        {errors.password && (
                            <p className="text-sm text-red-600">{errors.password.message}</p>
                        )}
                        <p className="text-xs text-gray-500">
                            O usuário poderá alterar a senha após o primeiro login.
                        </p>
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                        <Label htmlFor="role">Função *</Label>
                        <Select
                            onValueChange={(value) => setValue("role", value as any)}
                            defaultValue="user"
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a função" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">{roleLabels.user}</SelectItem>
                                <SelectItem value="manager">{roleLabels.manager}</SelectItem>
                                <SelectItem value="admin">{roleLabels.admin}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Permissions */}
                    <div className="space-y-3">
                        <Label>Permissões de Acesso</Label>
                        <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                            {availablePermissions.map((permission) => (
                                <div key={permission.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={permission.id}
                                        checked={selectedPermissions.includes(permission.id)}
                                        onCheckedChange={(checked) =>
                                            handlePermissionChange(permission.id, checked as boolean)
                                        }
                                        disabled={isLoading}
                                    />
                                    <label
                                        htmlFor={permission.id}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        {permission.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500">
                            Selecione os módulos que o usuário poderá acessar.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading} className="flex-1">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                "Criar Usuário"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
