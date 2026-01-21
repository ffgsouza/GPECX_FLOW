import { NextResponse } from "next/server";
import { getAuth } from "firebase/auth";
import { auth, db } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { createUserSchema } from "@/lib/user-schema";

export async function POST(request: Request) {
    try {
        // Parse request body
        const body = await request.json();

        // Validate input
        const validatedData = createUserSchema.parse(body);
        const { email, password, name, role, permissions } = validatedData;

        // Check if user is authenticated (basic check)
        // Note: In production, verify admin role from token
        const currentUser = auth.currentUser;
        if (!currentUser) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
            );
        }

        // Import Firebase Auth dynamically for server-side
        const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");

        // Create user in Firebase Auth
        // Note: This creates the user on client-side. For production, use Firebase Admin SDK
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        const newUser = userCredential.user;

        // Update display name
        await updateProfile(newUser, { displayName: name });

        // Create user profile in Firestore
        await setDoc(doc(db, "users", newUser.uid), {
            uid: newUser.uid,
            email: email,
            name: name,
            role: role,
            permissions: permissions,
            active: true,
            createdAt: serverTimestamp(),
            createdBy: currentUser.uid,
        });

        return NextResponse.json({
            success: true,
            user: {
                uid: newUser.uid,
                email: email,
                name: name,
                role: role,
            },
        });
    } catch (error: any) {
        console.error("Error creating user:", error);

        // Handle Firebase errors
        if (error.code === "auth/email-already-in-use") {
            return NextResponse.json(
                { error: "Este email já está em uso" },
                { status: 400 }
            );
        }

        if (error.code === "auth/weak-password") {
            return NextResponse.json(
                { error: "Senha muito fraca" },
                { status: 400 }
            );
        }

        // Handle Zod validation errors
        if (error.name === "ZodError") {
            return NextResponse.json(
                { error: "Dados inválidos", details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Erro ao criar usuário" },
            { status: 500 }
        );
    }
}
