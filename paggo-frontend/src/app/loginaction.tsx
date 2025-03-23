"use server";

import { cookies } from "next/headers";
import { api } from "@/services/api";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Por favor, preencha todos os campos." };
  }

  try {
    const response = await api.post("/users/login", { email, password });
    const cookieStore = await cookies();
    const thirtyDaysInSeconds = 60 * 60 * 24 * 30;

    cookieStore.set("session", response.data.token, {
      maxAge: thirtyDaysInSeconds,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,  
      sameSite: "lax",  
    });

    return { success: true };
  } catch (error: any) {
    console.error("Login error details:", error);
    return { error: error.response?.data?.message || "Erro ao fazer login." };
  }
}
