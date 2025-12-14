"use client";

import { useAppContext } from "@/context/app-context";
import { QuoteCategory } from "@/lib/types";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

const CategoryCard = ({ category }: { category: QuoteCategory }) => {
  return (
    <Link href={`/quotes/${category.id}`} className="block group">
      <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            <Image
              src={category.imageUrl}
              alt={category.name}
              fill
              style={{ objectFit: 'cover' }}
              className="transition-transform duration-300 group-hover:scale-105"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="p-6">
            <CardTitle className="text-xl font-bold mb-2">{category.name}</CardTitle>
            <CardDescription>{category.description}</CardDescription>
            <Button variant="outline" className="mt-4 w-full">
              Configure
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
};


export function QuoteBuilder() {
    const { quoteCategories } = useAppContext();

    return (
        <div>
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight">Kingsine Quote Builder</h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Selecione uma categoria de produto para começar a montar seu orçamento.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {quoteCategories.map(category => (
                    <CategoryCard key={category.id} category={category} />
                ))}
            </div>
        </div>
    )
}
