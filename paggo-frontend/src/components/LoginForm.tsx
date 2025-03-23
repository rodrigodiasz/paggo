"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

import { Input } from "@/components/ui/input";
import { ButtonWithLoading } from "@/components/ButtonWithLoading";
import { loginAction } from "../app/loginaction";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await loginAction(formData);

      if (result?.error) {
        toast.error(result.error);
        setIsLoading(false);
      } else if (result?.success) {
        window.location.href = "/upload";
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      toast.error("Erro inesperado. Tente novamente.");
      console.error("Erro no handleSubmit:", err);
      setIsLoading(false);
    }
  }

  return (
    <main className="flex flex-col gap-5 items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold">Paggo</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 w-full max-w-xl px-2"
        id="login-form"
      >
        <Input type="email" name="email" placeholder="E-mail" required />
        <Input type="password" name="password" placeholder="Senha" required />

        <ButtonWithLoading isLoading={isLoading} />
      </form>

      <p>
        Não possui uma conta?{" "}
        <Link className="text-blue-700 font-bold" href="/signup">
          Cadastre-se
        </Link>
      </p>
    </main>
  );
}
