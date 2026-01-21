"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginFormData, loginSchema } from "@/lib/login-schema";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { ForgotPasswordDialog } from "@/components/auth/forgot-password-dialog";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { signIn } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);

        try {
            await signIn(data.email, data.password);
            toast({
                title: "Login realizado com sucesso!",
                description: "Redirecionando para o dashboard...",
            });
            router.push("/dashboard");
        } catch (error: any) {
            let errorMessage = "Erro ao fazer login";

            // Handle specific Firebase auth errors
            switch (error.code) {
                case "auth/invalid-email":
                    errorMessage = "Email inválido";
                    break;
                case "auth/user-not-found":
                case "auth/wrong-password":
                case "auth/invalid-credential":
                    errorMessage = "Email ou senha incorretos";
                    break;
                case "auth/too-many-requests":
                    errorMessage = "Muitas tentativas. Tente novamente mais tarde";
                    break;
                default:
                    errorMessage = "Erro ao fazer login. Tente novamente";
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
        <div className="min-h-screen flex">
            {/* Left Side - Visual/Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
                    <h1 className="text-5xl font-bold mb-4 text-center bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        GPECx FLOW
                    </h1>
                    <p className="text-xl text-gray-300 text-center max-w-md font-light">
                        Gestão Inteligente para o Grupo GPECx
                    </p>

                    {/* Feature Pills */}
                    <div className="mt-12 grid gap-3 w-full max-w-md">
                        {[
                            "Gestão",
                            "Análise",
                            "Controle",
                            "Tudo em um só lugar",

                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20"
                            >
                                <p className="text-sm font-medium text-center">{feature}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex flex-col items-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-900">GPECx FLOW</h1>
                    </div>

                    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                        {/* Logo Above Form */}
                        <div className="flex justify-center mb-6">
                            <Image
                                src="/logo-gpecx-system.png"
                                alt="GPECx Logo"
                                width={80}
                                height={80}
                                className="object-contain"
                            />
                        </div>

                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">
                                Acesse sua conta
                            </h2>
                            <p className="text-gray-600">
                                Entre com suas credenciais para continuar
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-slate-900">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu.email@gpecx.com.br"
                                    disabled={isLoading}
                                    {...register("email")}
                                    className={`h-12 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""
                                        }`}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-600">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-slate-900">
                                    Senha
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        disabled={isLoading}
                                        {...register("password")}
                                        className={`h-12 pr-10 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                        disabled={isLoading}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-600">{errors.password.message}</p>
                                )}
                            </div>

                            {/* Forgot Password */}
                            <div className="flex justify-end">
                                <ForgotPasswordDialog />
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Entrando...
                                    </>
                                ) : (
                                    "Entrar"
                                )}
                            </Button>
                        </form>

                        {/* Footer */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <p className="text-center text-sm text-gray-600">
                                © 2026 Grupo GPECx
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
