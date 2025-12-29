
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

export default function HelpRegistrationPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-800">Guia de Cadastro de Produtos</h1>
        <p className="text-gray-500">
          Entenda como classificar itens e configurar a compatibilidade para a Venda Guiada.
        </p>
      </div>

      {/* SEÇÃO 1: TIPOS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">1</Badge> Definição de Tipos (Impacto Fiscal)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-2">Unidade de Hardware</h3>
            <p className="text-sm text-blue-700">Equipamentos principais.</p>
            <ul className="mt-2 text-xs text-blue-600 list-disc list-inside">
              <li>Exige NCM e Peso</li>
              <li>Impostos de Importação Físicos</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <h3 className="font-semibold text-green-800 mb-2">Licença de Software</h3>
            <p className="text-sm text-green-700">Itens digitais/serviços.</p>
            <ul className="mt-2 text-xs text-green-600 list-disc list-inside">
              <li>Sem NCM/Peso</li>
              <li>Impostos de Serviço (ISS, IRRF)</li>
            </ul>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
            <h3 className="font-semibold text-orange-800 mb-2">Acessório</h3>
            <p className="text-sm text-orange-700">Itens físicos menores.</p>
            <ul className="mt-2 text-xs text-orange-600 list-disc list-inside">
              <li>Exige NCM e Peso</li>
              <li>Aparece como "Opcional" na venda</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 2: COMPATIBILIDADE */}
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="w-6 h-6" />
            A Regra de Ouro da Compatibilidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Para que a Calculadora sugira automaticamente os itens corretos, use a lógica 
            <strong> "O Filho aponta para o Pai"</strong>.
          </p>
          
          <div className="flex flex-col md:flex-row items-center gap-4 bg-gray-50 p-6 rounded-xl">
            <div className="text-center p-4 bg-white shadow-sm rounded-lg border w-full">
              <span className="text-xs font-bold text-gray-400 uppercase">Passo 1</span>
              <p className="font-medium mt-1">Cadastre o Hardware</p>
              <p className="text-xs text-gray-500">(ex: UTS 800)</p>
            </div>
            <ArrowRight className="text-gray-400 hidden md:block" />
            <div className="text-center p-4 bg-white shadow-sm rounded-lg border w-full">
               <span className="text-xs font-bold text-gray-400 uppercase">Passo 2</span>
               <p className="font-medium mt-1">Cadastre o Acessório</p>
               <p className="text-xs text-gray-500">(ex: Cabo Especial)</p>
            </div>
            <ArrowRight className="text-gray-400 hidden md:block" />
            <div className="text-center p-4 bg-emerald-100 shadow-sm rounded-lg border border-emerald-200 w-full">
               <span className="text-xs font-bold text-emerald-600 uppercase">Passo 3 (O Segredo)</span>
               <p className="font-medium mt-1 text-emerald-900">Na aba Compatibilidade do Acessório...</p>
               <p className="text-xs text-emerald-700">...marque o UTS 800!</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>
              <strong>Atenção:</strong> Nunca edite o Hardware Principal para adicionar acessórios nele. 
              Sempre edite o Acessório/Software para dizer em quais máquinas ele funciona.
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
