
"use client";

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { initializeFirebase } from '@/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { Button } from './ui/button';

interface ImageUploadProps {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { toast } = useToast();

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({
            title: 'Arquivo Inválido',
            description: 'Por favor, selecione um arquivo de imagem (jpg, png, webp).',
            variant: 'destructive',
        });
        return;
    }

    const { storage } = initializeFirebase();
    if (!storage) {
        toast({ title: 'Erro de conexão', description: 'Firebase Storage não inicializado.', variant: 'destructive' });
        return;
    }

    const filePath = `product-images/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload error:", error);
        setUploadProgress(null);
        toast({
          title: 'Erro no Upload',
          description: 'Não foi possível enviar a imagem. Tente novamente.',
          variant: 'destructive',
        });
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          onChange(downloadURL);
          setUploadProgress(null);
          toast({
            title: 'Upload Concluído',
            description: 'Sua imagem foi enviada com sucesso.',
          });
        });
      }
    );
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
  });

  const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(null);
  }

  if (value) {
    return (
      <div className="relative w-48 h-48 rounded-md overflow-hidden border border-border group">
        <Image src={value} alt="Preview do produto" fill className="object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
                variant="destructive"
                size="icon"
                onClick={handleRemoveImage}
                className="rounded-full"
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Remover Imagem</span>
            </Button>
        </div>
      </div>
    );
  }

  if (uploadProgress !== null) {
     return (
        <div className="w-full h-32 rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Enviando...</p>
            <Progress value={uploadProgress} className="w-full mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{Math.round(uploadProgress)}%</p>
        </div>
     )
  }

  return (
    <div
      {...getRootProps()}
      className={`w-full h-32 rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors
      ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
    >
      <input {...getInputProps()} />
      <UploadCloud className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground mt-2">
        {isDragActive ? 'Solte a imagem aqui' : 'Arraste uma imagem ou clique para selecionar'}
      </p>
      <p className="text-xs text-muted-foreground">PNG, JPG, WEBP</p>
    </div>
  );
}
