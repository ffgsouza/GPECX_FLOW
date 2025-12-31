
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Package, Code, ArrowRight, Plus, ChevronsRight, Equal, AlertTriangle, Calculator, CheckCircle2, XCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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
                    <p className="text-muted-foreground">Uma série de impostos é aplicada sobre o valor do produto nacionalizado. Um imposto é calculado sobre a base do anterior, e o ICMS é calculado "por dentro".</p>
                     <div className="flex flex-wrap items-center gap-2 mt-2 text-sm p-3 bg-background rounded-md border">
                        <span className="font-mono bg-primary/10 p-1 rounded-md">CIF</span>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-red-100 text-red-700 p-1 rounded-md">II</span>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-red-100 text-red-700 p-1-md">IPI</span>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-red-100 text-red-700 p-1 rounded-md">PIS/COFINS</span>
                         <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-red-100 text-red-700 p-1 rounded-md">ICMS (por dentro)</span>
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
                            Tratado como importação de serviço, não há frete físico. Os impostos incidem sobre a transação financeira internacional e o IRRF é calculado "por dentro" (Gross-up).
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
                    <p className="text-muted-foreground">Impostos sobre la remessa de pagamento ao exterior e sobre o serviço.</p>
                     <div className="flex flex-wrap items-center gap-2 mt-2 text-sm p-3 bg-background rounded-md border">
                        <span className="font-mono bg-purple-100 text-purple-700 p-1 rounded-md">IRRF (Gross-up)</span>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-purple-100 text-purple-700 p-1 rounded-md">PIS/COFINS Serviço</span>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-purple-100 text-purple-700 p-1 rounded-md">IOF Câmbio</span>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-purple-100 text-purple-700 p-1 rounded-md">ISS</span>
                         <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono bg-purple-100 text-purple-700 p-1 rounded-md">Taxa Swift</span>
                    </div>
                    <div className="mt-3 p-3 border-l-4 border-yellow-400 bg-yellow-50 text-yellow-800 text-sm">
                        <div className="flex items-start gap-2">
                             <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold">Cálculo "Gross-Up" do IRRF</h4>
                                <p>Para que o fornecedor no exterior receba o valor líquido acordado, o imposto de 15% é calculado sobre uma base reajustada. A calculadora faz a conta `Base = Custo / (1 - 0.15)` para encontrar o valor bruto sobre o qual o imposto incidirá, garantindo que o custo do imposto não diminua sua margem.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                 <Separator className="my-4"/>

                 <div className="flex items-center gap-2 text-base p-3 bg-green-50 rounded-md border border-green-200">
                    <ChevronsRight className="h-5 w-5 text-green-700"/>
                    <span className="font-semibold text-green-800">Custo Total da Licença de Software</span>
                </div>
            </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500 mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                <Info className="w-5 h-5" />
                Dúvida Frequente: É IRPJ ou IRRF?
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
                <p>
                Uma dúvida comum ao migrar de planilhas para o Sistema GPECx é a nomenclatura do imposto sobre Softwares.
                Na planilha antiga, este custo aparece como <strong>IRPJ</strong> (aprox. 18%). No sistema, ele é identificado como <strong>IRRF</strong>.
                </p>

                <div className="grid md:grid-cols-2 gap-4 my-4">
                <div className="bg-gray-50 p-4 rounded border">
                    <h4 className="font-bold text-gray-900 mb-2">O que é IRPJ?</h4>
                    <p className="text-xs text-gray-600">
                    (Imposto de Renda Pessoa Jurídica). É o imposto pago sobre o <strong>LUCRO</strong> da sua empresa ao final do ano. 
                    Ele não incide diretamente sobre uma nota de importação específica.
                    </p>
                </div>
                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-2">O que é IRRF? (O Correto)</h4>
                    <p className="text-xs text-blue-800">
                    (Imposto de Renda Retido na Fonte). É o imposto cobrado sobre a <strong>REMESSA DE PAGAMENTO</strong> ao exterior. 
                    Sempre que pagamos um fornecedor estrangeiro por um serviço/software, devemos reter este imposto na fonte.
                    </p>
                </div>
                </div>

                <div className="space-y-2">
                <h4 className="font-bold text-gray-900">Por que a planilha usa 18% e o sistema usa Gross-up?</h4>
                <p>
                    A alíquota base do IRRF é <strong>15%</strong>. Porém, para garantir que o fornecedor receba o valor líquido combinado (ex: USD 100,00), 
                    nós pagamos o imposto "por fora" (Gross-up).
                </p>
                <div className="p-3 bg-slate-100 rounded font-mono text-xs border border-slate-300">
                    Cálculo Real: Valor ÷ (1 - 0,15) = Valor ÷ 0,85 <br/>
                    <span className="text-emerald-600 font-bold">Impacto Final: ~17,65% (Arredondado para 18% em planilhas)</span>
                </div>
                <p>
                    O sistema utiliza o termo correto <strong>IRRF</strong> para alinhar com a contabilidade e com o código da DARF (0422) que será gerada.
                </p>
                </div>
            </CardContent>
        </Card>

        {/* DETALHAMENTO DO ICMS */}
        <Card className="border-primary/20">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 bg-red-100 p-3 rounded-lg">
                        <Calculator className="h-6 w-6 text-red-700" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl text-red-800">Foco Fiscal: O Cálculo do ICMS "por Dentro"</CardTitle>
                        <CardDescription className="text-base">
                            Entenda por que o sistema calcula um ICMS maior que planilhas simplificadas e como isso protege sua margem.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <AlertTitle className="text-lg font-bold mb-1">O Perigo do Cálculo Simplificado</AlertTitle>
                    <AlertDescription className="text-base">
                      Muitas planilhas calculam o ICMS apenas sobre a Mercadoria + II. Isso é incorreto perante a legislação 
                      e gera um <strong>"Prejuízo Oculto"</strong>. O sistema GPECx SGC utiliza a base de cálculo cheia 
                      exigida pela Receita Estadual.
                    </AlertDescription>
                </Alert>
                
                <div className="p-6 bg-slate-50 rounded-lg border text-center">
                    <p className="text-sm text-slate-500 mb-4 font-semibold uppercase tracking-wide">Fórmula Oficial da Base de Cálculo do ICMS (Lei Kandir)</p>
                    <div className="text-xl md:text-2xl font-mono text-slate-800 leading-relaxed">
                    Base ICMS = <span className="inline-block border-b-2 border-slate-400 pb-1 mb-1">(Valor Aduaneiro + II + IPI + PIS + COFINS + Siscomex + Despesas)</span>
                    <br />
                    <span className="inline-block pt-1">(1 - Alíquota ICMS)</span>
                    </div>
                </div>

                <div className="p-4 border rounded-lg bg-emerald-50 border-emerald-200">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0"/>
                        <div>
                            <h4 className="font-bold text-emerald-800">Como o Sistema Calcula (Correto)</h4>
                            <p className="text-sm text-emerald-700">1. Soma-se TUDO: Mercadoria, Frete, Impostos Federais (II, IPI, PIS, COFINS), Siscomex e Despesas Aduaneiras.</p>
                            <p className="text-sm text-emerald-700">2. Divide-se o resultado por (1 - Alíquota ICMS). Ex: para 18%, divide-se por 0.82.</p>
                            <p className="text-sm text-emerald-700">3. O valor do ICMS é a Alíquota multiplicada por essa base de cálculo "inflada".</p>
                        </div>
                    </div>
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
