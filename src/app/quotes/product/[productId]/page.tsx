"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import Link from 'next/link';
import Image from "next/image";
import { useAppContext } from "@/context/app-context";
import { HardwareOption, SoftwareOption, QuoteAccessory } from "@/lib/types";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ShoppingCart } from "lucide-react";

const formatCurrency = (value: number) => {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

export default function ProductConfiguratorPage() {
    const { productId } = useParams();
    const { 
        getQuoteProductById, 
        getQuoteAccessoriesByIds,
        getGlobalQuoteAccessories
    } = useAppContext();

    const product = getQuoteProductById(productId as string);

    const [selectedHardware, setSelectedHardware] = useState<HardwareOption | null>(null);
    const [selectedSoftware, setSelectedSoftware] = useState<SoftwareOption | null>(null);
    const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
    
    useEffect(() => {
        if (product) {
            // Pre-select first hardware option
            if (product.hardwareOptions.length > 0) {
                setSelectedHardware(product.hardwareOptions[0]);
            }
            // Pre-select first software option if it's free
            if (product.softwareOptions.length > 0 && product.softwareOptions[0].price === 0) {
                setSelectedSoftware(product.softwareOptions[0]);
            }
        }
    }, [product]);
    
    const compatibleAccessories = useMemo(() => {
        if (!product) return [];
        const specific = getQuoteAccessoriesByIds(product.compatibleAccessoryIds);
        const global = getGlobalQuoteAccessories();
        return [...specific, ...global];
    }, [product, getQuoteAccessoriesByIds, getGlobalQuoteAccessories]);

    const handleAccessoryToggle = (accessoryId: string) => {
        setSelectedAccessories(prev =>
            prev.includes(accessoryId)
                ? prev.filter(id => id !== accessoryId)
                : [...prev, accessoryId]
        );
    };

    const totalCost = useMemo(() => {
        let total = 0;
        if (selectedHardware) {
            total += selectedHardware.price;
        }
        if (selectedSoftware) {
            total += selectedSoftware.price;
        }
        compatibleAccessories.forEach(acc => {
            if (selectedAccessories.includes(acc.id)) {
                total += acc.price;
            }
        });
        return total;
    }, [selectedHardware, selectedSoftware, selectedAccessories, compatibleAccessories]);

    if (!product) {
        return notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8">
             <Link href={`/quotes/${product.categoryId}`} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar para {getQuoteCategoryById(product.categoryId)?.name || 'lista de produtos'}
            </Link>

            <div className="grid lg:grid-cols-5 gap-12">
                <div className="lg:col-span-3">
                    <Card className="overflow-hidden">
                        <div className="relative h-96 w-full">
                            <Image src={product.imageUrl} alt={product.name} fill style={{objectFit: 'cover'}} />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-2xl">{product.name}</CardTitle>
                            <CardDescription>{product.description}</CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    {/* Hardware Options */}
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Selecione o Hardware</CardTitle>
                            <CardDescription>Escolha a variação de hardware principal. O preço base será definido por esta opção.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup value={selectedHardware?.id} onValueChange={(id) => setSelectedHardware(product.hardwareOptions.find(h => h.id === id) || null)}>
                                {product.hardwareOptions.map(hw => (
                                    <div key={hw.id} className="flex items-center space-x-3 p-3 rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary border">
                                        <RadioGroupItem value={hw.id} id={hw.id} />
                                        <Label htmlFor={hw.id} className="flex justify-between w-full cursor-pointer">
                                            <span>{hw.name}</span>
                                            <span className="font-bold text-primary">{formatCurrency(hw.price)}</span>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </CardContent>
                    </Card>

                     {/* Software Options */}
                    {product.softwareOptions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>2. Licença de Software</CardTitle>
                            </CardHeader>
                            <CardContent>
                               <RadioGroup value={selectedSoftware?.id} onValueChange={(id) => setSelectedSoftware(product.softwareOptions.find(s => s.id === id) || null)}>
                                    {product.softwareOptions.map(sw => (
                                        <div key={sw.id} className="flex items-center space-x-3 p-3 rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary border">
                                            <RadioGroupItem value={sw.id} id={sw.id} />
                                            <Label htmlFor={sw.id} className="flex justify-between w-full cursor-pointer">
                                                <span>{sw.name}</span>
                                                <span className="font-semibold text-primary/80">+{formatCurrency(sw.price)}</span>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </CardContent>
                        </Card>
                    )}

                    {/* Accessories */}
                    {compatibleAccessories.length > 0 && (
                         <Card>
                            <CardHeader>
                                <CardTitle>3. Acessórios</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                                {compatibleAccessories.map(acc => (
                                     <div key={acc.id} className="flex items-center space-x-3 p-3 rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary border">
                                        <Checkbox 
                                            id={acc.id} 
                                            checked={selectedAccessories.includes(acc.id)}
                                            onCheckedChange={() => handleAccessoryToggle(acc.id)}
                                        />
                                        <Label htmlFor={acc.id} className="flex justify-between w-full cursor-pointer">
                                            <span>{acc.name}</span>
                                            <span className="font-semibold text-primary/80">+{formatCurrency(acc.price)}</span>
                                        </Label>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
            
            <div className="sticky bottom-0 mt-12 py-4 bg-background/80 backdrop-blur-sm">
                <Card className="max-w-4xl mx-auto shadow-2xl">
                    <CardFooter className="flex flex-col md:flex-row items-center justify-between p-6">
                        <div className="text-center md:text-left mb-4 md:mb-0">
                           <p className="text-sm text-muted-foreground">Preço Total (USD, EXW)</p>
                            <p className="text-4xl font-bold text-primary">{formatCurrency(totalCost)}</p>
                        </div>
                        <Button size="lg">
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            Adicionar ao Orçamento
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
