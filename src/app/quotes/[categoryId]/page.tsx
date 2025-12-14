
"use client";

import { useAppContext } from "@/context/app-context";
import { useParams } from "next/navigation";
import { QuoteProduct } from "@/lib/types";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { notFound } from 'next/navigation';

const ProductCard = ({ product }: { product: QuoteProduct }) => (
    <Link href={`/quotes/product/${product.id}`} className="block group">
        <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 h-full flex flex-col">
            <div className="relative h-48 w-full">
                <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="transition-transform duration-300 group-hover:scale-105"
                />
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-bold mb-2">{product.name}</h3>
                <p className="text-sm text-muted-foreground flex-grow">{product.description}</p>
                 <Button variant="outline" className="mt-4 w-full justify-center">
                    Configure
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </Card>
    </Link>
);


export default function ProductCategoryPage() {
    const { categoryId } = useParams();
    const { quoteProducts, getQuoteCategoryById } = useAppContext();

    const category = getQuoteCategoryById(categoryId as string);
    
    if (!category) {
        notFound();
    }
    
    const productsInCategory = quoteProducts.filter(p => p.categoryId === categoryId);

    return (
        <div className="container mx-auto px-4 py-8">
            <Link href="/quotes" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar para Categorias
            </Link>
            <div className="text-left mb-10">
                <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
                <p className="mt-2 text-md text-muted-foreground">{category.description}</p>
            </div>

            {productsInCategory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {productsInCategory.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-muted-foreground">Nenhum produto encontrado nesta categoria.</p>
                </div>
            )}
        </div>
    );
}
