"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function ForgotPasswordDialog() {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { resetPassword } = useAuth();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes("@")) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Por favor, insira um email válido",
            });
            return;
        }

        setIsLoading(true);

        try {
            await resetPassword(email);
            toast({
                title: "Email enviado!",
                description: "Verifique sua caixa de entrada para redefinir sua senha.",
            });
            setEmail("");
            setOpen(false);
        } catch (error: any) {
            let errorMessage = "Erro ao enviar email de recuperação";

            switch (error.code) {
                case "auth/user-not-found":
                    errorMessage = "Usuário não encontrado com este email";
                    break;
                case "auth/invalid-email":
                    errorMessage = "Email inválido";
                    break;
                case "auth/too-many-requests":
                    errorMessage = "Muitas tentativas. Tente novamente mais tarde";
                    break;
            }

            toast({
                variant: "destructive",
                title: "Erro",
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="link"
                    className="text-primary hover:text-primary/80 p-0 h-auto font-medium"
                >
                    Esqueceu a senha?
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        Recuperar senha
                    </DialogTitle>
                    <DialogDescription>
                        Digite seu email para receber as instruções de recuperação de senha.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                            id="reset-email"
                            type="email"
                            placeholder="seu.email@gpecx.com.br"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            className="h-11"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                "Enviar"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
