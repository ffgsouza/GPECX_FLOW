
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Package, Code, ArrowRight, Plus, ChevronsRight, Equal } from "lucide-react";

export default function PricingHelpPage() {
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Entendendo o Cálculo de Custos</h1>
            <p className="text-lg text-muted-foreground mt-2">
                A calculadora diferencia os custos de Hardware e Software para refletir suas diferentes naturezas fiscais e logísticas.
            </p>
        </div>

        <Separator />

        <Card className="bg-muted/30">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 bg-sky-100 p-3 rounded-lg">
                       <Package className="h-6 w-6 text-sky-700" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl text-sky-800">Custo de Hardware (Produto Físico)</CardTitle>
                        <CardDescription className="text-base">
                            Tratado como um produto físico importado, seu custo é formado pelo Custo de Aquisição + Frete + Impostos de Importação + Despesas Aduaneiras.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pl-16">
                <div>
                    <h3 className="font-semibold text-lg">1. Custo Base (CIF em BRL)</h3>
                    <p className="text-muted-foreground">O ponto de partida é o custo do produto somado ao frete, convertido para Reais.</p>
                    <div className="flex items-center gap-2 mt-2 text-sm p-3 bg-background rounded-md border">
                        <span className="font-mono bg-slate-100 p-1 rounded-md">Custo FOB (USD)</span>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-slate-100 p-1 rounded-md">Frete Principal (USD)</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-primary/10 text-primary p-1 rounded-md font-semibold">Custo CIF (BRL)</span>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-lg">2. Impostos de Importação (Cascata)</h3>
                    <p className="text-muted-foreground">Uma série de impostos é aplicada sobre o valor do produto nacionalizado. Um imposto é calculado sobre a base do anterior.</p>
                     <div className="flex flex-wrap items-center gap-2 mt-2 text-sm p-3 bg-background rounded-md border">
                        <span className="font-mono bg-primary/10 p-1 rounded-md">CIF</span>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-red-100 text-red-700 p-1 rounded-md">II</span>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-red-100 text-red-700 p-1 rounded-md">IPI</span>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-red-100 text-red-700 p-1 rounded-md">PIS/COFINS</span>
                         <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-red-100 text-red-700 p-1 rounded-md">ICMS</span>
                    </div>
                </div>
                
                 <div>
                    <h3 className="font-semibold text-lg">3. Despesas Aduaneiras e Consolidação</h3>
                    <p className="text-muted-foreground">Custos fixos e variáveis do processo de desembaraço são somados.</p>
                    <div className="flex items-center gap-2 mt-2 text-sm p-3 bg-background rounded-md border">
                        <span className="font-mono bg-yellow-100 text-yellow-800 p-1 rounded-md">Taxa Siscomex</span>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-yellow-100 text-yellow-800 p-1 rounded-md">Desembaraço</span>
                         <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-yellow-100 text-yellow-800 p-1 rounded-md">Armazenagem</span>
                    </div>
                </div>

                 <Separator className="my-4"/>

                 <div className="flex items-center gap-2 text-base p-3 bg-green-50 rounded-md border border-green-200">
                    <ChevronsRight className="h-5 w-5 text-green-700"/>
                    <span className="font-semibold text-green-800">Custo Nacionalizado Total do Hardware (Landed Cost)</span>
                </div>
            </CardContent>
        </Card>

         <Card className="bg-muted/30">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 bg-emerald-100 p-3 rounded-lg">
                       <Code className="h-6 w-6 text-emerald-700" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl text-emerald-800">Custo do Software (Serviço/Intangível)</CardTitle>
                        <CardDescription className="text-base">
                            Tratado como importação de serviço, não há frete físico. Os impostos incidem sobre a transação financeira internacional.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pl-16">
                <div>
                    <h3 className="font-semibold text-lg">1. Custo Base (BRL)</h3>
                    <p className="text-muted-foreground">O custo em dólar da licença é convertido diretamente para Reais.</p>
                     <div className="flex items-center gap-2 mt-2 text-sm p-3 bg-background rounded-md border">
                        <span className="font-mono bg-slate-100 p-1 rounded-md">Custo FOB (USD)</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-primary/10 text-primary p-1 rounded-md font-semibold">Custo Base (BRL)</span>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-lg">2. Impostos de Serviço e Remessa</h3>
                    <p className="text-muted-foreground">Impostos sobre a remessa de pagamento ao exterior e sobre o serviço.</p>
                     <div className="flex flex-wrap items-center gap-2 mt-2 text-sm p-3 bg-background rounded-md border">
                        <span className="font-mono bg-purple-100 text-purple-700 p-1 rounded-md">IRPJ/CSLL</span>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-purple-100 text-purple-700 p-1 rounded-md">IOF Câmbio</span>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-purple-100 text-purple-700 p-1 rounded-md">ISS</span>
                         <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-purple-100 text-purple-700 p-1 rounded-md">Taxa Swift</span>
                    </div>
                </div>
                
                 <Separator className="my-4"/>

                 <div className="flex items-center gap-2 text-base p-3 bg-green-50 rounded-md border border-green-200">
                    <ChevronsRight className="h-5 w-5 text-green-700"/>
                    <span className="font-semibold text-green-800">Custo Total da Licença de Software</span>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                 <CardTitle className="text-2xl">Formação do Preço de Venda Final</CardTitle>
                <CardDescription className="text-base">
                    Após calcular os custos individuais, eles são somados e as despesas de venda e margens são aplicadas para formar o preço final.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-base p-4 bg-background rounded-md border-2 border-dashed">
                    <span className="font-mono bg-green-100 text-green-800 p-1 rounded-md">Custo Hardware</span>
                    <Plus className="h-5 w-5 text-muted-foreground" />
                    <span className="font-mono bg-green-100 text-green-800 p-1 rounded-md">Custo Software</span>
                    <Equal className="h-5 w-5 text-muted-foreground" />
                    <span className="font-bold text-lg text-primary">Custo Total dos Bens</span>
                </div>
                <div className="flex items-center justify-center">
                    <Plus className="h-6 w-6 text-muted-foreground my-2" />
                </div>
                <div className="text-base p-4 bg-background rounded-md border">
                    <p className="font-semibold text-center text-muted-foreground">Despesas sobre a Venda</p>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-2 text-sm">
                        <span className="font-mono bg-orange-100 text-orange-800 p-1 rounded-md">Imposto Simples</span>
                        <span className="font-mono bg-orange-100 text-orange-800 p-1 rounded-md">Comissão</span>
                        <span className="font-mono bg-orange-100 text-orange-800 p-1 rounded-md">Custo Fixo (Fin/BDI)</span>
                        <span className="font-mono bg-orange-100 text-orange-800 p-1 rounded-md">Margem de Lucro</span>
                        <span className="font-mono bg-slate-200 text-slate-600 p-1 rounded-md line-through">Desconto</span>
                    </div>
                </div>
                 <div className="flex items-center justify-center">
                    <Equal className="h-6 w-6 text-muted-foreground my-2" />
                </div>
                <div className="text-xl p-4 bg-primary text-primary-foreground rounded-md border text-center font-bold tracking-wider">
                    PREÇO FINAL DE VENDA
                </div>


            </CardContent>
        </Card>
    </div>
  );
}
