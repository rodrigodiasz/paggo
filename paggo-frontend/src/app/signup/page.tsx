"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
      toast.error("Por favor, preencha todos os campos.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro ao cadastrar");
      }

      toast.success(
        "Cadastro realizado com sucesso!"
      );

      router.push("/");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col gap-5 items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold">Paggo</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 w-full max-w-xl px-2"
      >
        <Input
          type="text"
          name="name"
          placeholder="Nome"
        />
        <Input
          type="email"
          name="email"
          placeholder="E-mail"
        />
        <Input
          type="password"
          name="password"
          placeholder="Senha"
        />
<Button type="submit" disabled={loading} className="bg-blue-800 text-white font-bold cursor-pointer hover:bg-blue-700" >
          {loading ? "Carregando..." : "Cadastrar-se"}
          </Button>
      </form>
      <p>
        Já tem uma conta?{" "}
        <Link className="text-blue-700 font-bold" href="/">
          Faça login
        </Link>
      </p>
    </main>
  );
}
