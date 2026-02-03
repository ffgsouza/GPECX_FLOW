
"use client";

import { useAppContext } from "@/context/app-context";
import type { Company } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, DollarSign, Target, TrendingUp, XCircle } from "lucide-react";

const formatCurrency = (value: number) => {
    if (!value && value !== 0) return "R$ 0,00"; // Handle undefined/null/NaN

    if (value >= 1_000_000) {
        return `R$ ${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
        return `R$ ${(value / 1_000).toFixed(1)}k`;
    }
    return `R$ ${value.toFixed(2)}`;
};

const RevenueBar = ({
    title,
    current,
    limit,
    limitLabel
}: {
    title: string;
    current: number;
    limit: number;
    limitLabel: string;
}) => {
    const percentage = (current / limit) * 100;
    const available = limit - current;

    let progressBarColor = "bg-primary";
    let textColor = "text-primary";
    let Icon = CheckCircle2;

    if (percentage > 90) {
        progressBarColor = "bg-destructive";
        textColor = "text-destructive";
        Icon = XCircle;
    } else if (percentage > 75) {
        progressBarColor = "bg-yellow-500";
        textColor = "text-yellow-600";
        Icon = AlertCircle;
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-baseline">
                <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
                <p className={`text-sm font-bold flex items-center gap-1.5 ${textColor}`}>
                    <Icon className="h-4 w-4" />
                    {percentage.toFixed(1)}%
                </p>
            </div>
            <Progress value={percentage} indicatorClassName={progressBarColor} />
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(current)} de {formatCurrency(limit)}</span>
                <span className="font-semibold">
                    Disponível: {formatCurrency(available)}
                </span>
            </div>
        </div>
    );
};


const CompanyFiscalCard = ({ company }: { company: Company }) => (
    <Card>
        <CardHeader className="pb-4">
            <CardTitle className="text-lg">{company.nickname}</CardTitle>
            <CardDescription>{company.cnpj}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <RevenueBar
                title="Sub-limite (ICMS/ISS)"
                current={company.currentRevenueYear}
                limit={company.subLimit}
                limitLabel="Sub-limite"
            />
            <RevenueBar
                title="Teto Global do Simples Nacional"
                current={company.currentRevenueYear}
                limit={company.simplesLimit}
                limitLabel="Teto Global"
            />
        </CardContent>
    </Card>
);

export function FiscalMonitor() {
    const { companies, loading } = useAppContext();

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Monitoramento Fiscal (Semáforo)</CardTitle>
                    <CardDescription>Acompanhe o faturamento acumulado de cada empresa em relação aos limites do Simples Nacional.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="h-48 rounded-lg bg-muted animate-pulse"></div>
                    <div className="h-48 rounded-lg bg-muted animate-pulse"></div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monitoramento Fiscal (Semáforo)</CardTitle>
                <CardDescription>Acompanhe o faturamento acumulado de cada empresa em relação aos limites do Simples Nacional.</CardDescription>
            </CardHeader>
            <CardContent>
                {companies.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                        {companies.map(company => (
                            <CompanyFiscalCard key={company.id} company={company} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">Nenhuma empresa cadastrada.</p>
                        <p className="text-sm text-muted-foreground/80">Vá para <a href="/admin/companies" className="underline font-semibold">Cadastros Gerais &gt; Empresas</a> para começar.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
