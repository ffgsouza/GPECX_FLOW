
import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFileUpload } from '@/hooks/use-file-upload';
import { Loader2, UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ProductImageUploadProps {
    productId: string; // Used for storage path: products/{productId}/images/
    currentImageUrl?: string | null;
    onImageUploaded: (url: string) => void;
    onImageRemoved: () => void;
    className?: string;
}

export function ProductImageUpload({
    productId,
    currentImageUrl,
    onImageUploaded,
    onImageRemoved,
    className
}: ProductImageUploadProps) {
    const { uploadFile, uploadProgress, isUploading, error } = useFileUpload();
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);

    // Sync preview if currentImageUrl changes externally
    useEffect(() => {
        setPreview(currentImageUrl || null);
    }, [currentImageUrl]);

    // Handle File Drop
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        // Verify ID presence
        if (!productId || productId === 'new') {
            toast({
                title: "Salvar primeiro",
                description: "Salve o produto antes de fazer upload da imagem.",
                variant: "destructive"
            });
            return;
        }

        // Show local preview immediately
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        // Define Path
        const fileExtension = file.name.split('.').pop();
        const fileName = `main.${fileExtension}`; // Always name it 'main' to override old ones or simple organization
        const path = `products/${productId}/images/${fileName}`;

        // Upload
        const url = await uploadFile(file, path);

        if (url) {
            onImageUploaded(url);
            toast({ title: "Sucesso", description: "Imagem enviada com sucesso!" });
        } else {
            setPreview(null); // Revert preview on failure
            toast({ title: "Erro", description: "Falha no upload da imagem.", variant: "destructive" });
        }

    }, [productId, uploadFile, onImageUploaded]);

    // Cleanup object URL
    useEffect(() => {
        return () => {
            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);


    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        onImageRemoved();
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        maxFiles: 1,
        disabled: isUploading
    });

    return (
        <div className={cn("w-full", className)}>
            {!preview ? (
                // DROP AREA
                <div
                    {...getRootProps()}
                    className={cn(
                        "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors h-40",
                        isDragActive ? "border-emerald-500 bg-emerald-50" : "border-slate-300 hover:bg-slate-50",
                        isUploading && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <input {...getInputProps()} />
                    {isUploading ? (
                        <div className="flex flex-col items-center text-slate-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-2 text-emerald-600" />
                            <p className="text-xs">Enviando... {Math.round(uploadProgress)}%</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-slate-400">
                            <UploadCloud className="w-10 h-10 mb-2" />
                            <p className="text-sm font-medium text-slate-600">Arraste ou clique</p>
                            <p className="text-xs text-slate-400 mt-1">Max 1MB (JPG, PNG)</p>
                        </div>
                    )}
                </div>
            ) : (
                // PREVIEW AREA
                <div className="relative border rounded-lg overflow-hidden group h-40 bg-slate-100 flex items-center justify-center">
                    <img
                        src={preview}
                        alt="Product"
                        className="max-h-full max-w-full object-contain"
                    />

                    {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <span className="text-xs font-bold">{Math.round(uploadProgress)}%</span>
                        </div>
                    )}

                    {!isUploading && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 rounded-full shadow-md"
                                onClick={handleRemove}
                                type="button"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {isUploading && (
                <Progress value={uploadProgress} className="h-1 mt-2 w-full" indicatorClassName="bg-emerald-500" />
            )}

            <div className="mt-2">
                <p className="text-[10px] text-slate-400 mb-1 uppercase font-bold">Ou cole a URL direta (Firebase):</p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="https://firebasestorage.googleapis.com/..."
                        className="flex h-7 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue={currentImageUrl || ''}
                        onBlur={(e) => {
                            if (e.target.value) {
                                setPreview(e.target.value);
                                onImageUploaded(e.target.value);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = (e.target as HTMLInputElement).value;
                                if (val) {
                                    setPreview(val);
                                    onImageUploaded(val);
                                }
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
