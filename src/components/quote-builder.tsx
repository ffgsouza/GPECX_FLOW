"use client";

import { useState, useMemo } from "react";
import { useAppContext } from "@/context/app-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Package, PlusCircle, Trash2 } from "lucide-react";
import type { QuoteItem } from "@/lib/types";

const formatCurrency = (value: number) => {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

export function QuoteBuilder() {
  const { quoteItems } = useAppContext();
  const [mainItemId, setMainItemId] = useState<string | null>(null);
  const [selectedOptionalIds, setSelectedOptionalIds] = useState<string[]>([]);

  const mainItems = useMemo(() => quoteItems.filter(item => item.type === 'main'), [quoteItems]);
  
  const selectedMainItem = useMemo(() => {
    if (!mainItemId) return null;
    return quoteItems.find(item => item.id === mainItemId) ?? null;
  }, [mainItemId, quoteItems]);

  const availableOptionals = useMemo(() => {
    if (!selectedMainItem) return [];
    return quoteItems.filter(item => item.type === 'optional' && item.appliesTo.includes(selectedMainItem.id));
  }, [selectedMainItem, quoteItems]);

  const handleMainItemChange = (id: string) => {
    setMainItemId(id);
    setSelectedOptionalIds([]); // Reset optional items when main item changes
  };

  const handleOptionalItemToggle = (id: string) => {
    setSelectedOptionalIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };
  
  const selectedOptionalItems = useMemo(() => {
    return quoteItems.filter(item => selectedOptionalIds.includes(item.id));
  }, [selectedOptionalIds, quoteItems]);

  const totalCost = useMemo(() => {
    let total = selectedMainItem?.priceUSD ?? 0;
    selectedOptionalItems.forEach(item => {
      total += item.priceUSD;
    });
    return total;
  }, [selectedMainItem, selectedOptionalItems]);


  return (
    <div className="grid md:grid-cols-3 gap-8 items-start">
      {/* Configuration Panel */}
      <div className="md:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Equipamento Principal</Label>
              <Select onValueChange={handleMainItemChange} value={mainItemId ?? ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {mainItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMainItem && availableOptionals.length > 0 && (
                <div>
                    <Label>Acessórios e Opcionais</Label>
                    <Card className="mt-2 p-4 max-h-96 overflow-y-auto">
                        <div className="space-y-4">
                        {availableOptionals.map(item => (
                            <div key={item.id} className="flex items-center space-x-3">
                            <Checkbox
                                id={`opt-${item.id}`}
                                checked={selectedOptionalIds.includes(item.id)}
                                onCheckedChange={() => handleOptionalItemToggle(item.id)}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                htmlFor={`opt-${item.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                {item.model}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                {formatCurrency(item.priceUSD)}
                                </p>
                            </div>
                            </div>
                        ))}
                        </div>
                    </Card>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quote Summary */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Orçamento (EXW Shenzhen)</CardTitle>
            <CardDescription>
              Este é o custo total dos itens selecionados, sem frete ou impostos.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {selectedMainItem ? (
                <div className="space-y-4">
                    {/* Main Item */}
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                            <p className="font-semibold text-primary flex items-center gap-2">
                                <Package className="w-5 h-5"/>
                                {selectedMainItem.model} (Principal)
                            </p>
                            <p className="text-sm text-muted-foreground">{selectedMainItem.description}</p>
                        </div>
                        <p className="font-bold text-lg">{formatCurrency(selectedMainItem.priceUSD)}</p>
                    </div>
                    
                    <Separator/>

                    {/* Optional Items */}
                    {selectedOptionalItems.length > 0 && (
                        <div className="space-y-2">
                             <h4 className="font-semibold text-sm">Itens Opcionais</h4>
                             {selectedOptionalItems.map(item => (
                                <div key={item.id} className="flex justify-between items-center pl-4 pr-3 py-2 border-l-2 border-primary/50">
                                    <div>
                                        <p className="font-medium text-sm">{item.model}</p>
                                        <p className="text-xs text-muted-foreground">{item.description}</p>
                                    </div>
                                    <p className="font-semibold">{formatCurrency(item.priceUSD)}</p>
                                </div>
                             ))}
                        </div>
                    )}
                     {selectedOptionalItems.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-8">
                            Nenhum item opcional adicionado.
                        </div>
                     )}

                </div>
             ) : (
                <div className="text-center py-16">
                    <p className="text-muted-foreground">Selecione um equipamento para começar a montar seu orçamento.</p>
                </div>
             )}
          </CardContent>
          {selectedMainItem && (
            <CardFooter className="flex-col items-end gap-2 border-t bg-muted/50 p-6">
                <div className="flex justify-between w-full max-w-xs">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between w-full max-w-xs text-xl font-bold text-primary">
                    <span>Total (USD)</span>
                    <span>{formatCurrency(totalCost)}</span>
                </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
