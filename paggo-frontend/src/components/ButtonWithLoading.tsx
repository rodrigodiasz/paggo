"use client";

import { Button } from "@/components/ui/button";
import { ButtonLoadingHome } from "./ui/buttonloadinghome";

interface ButtonWithLoadingProps {
  isLoading?: boolean;
}

export function ButtonWithLoading({ isLoading }: ButtonWithLoadingProps) {
  return (
    <Button
      type="submit"
      disabled={isLoading}
      className="bg-blue-800 text-white font-bold cursor-pointer hover:bg-blue-700"
    >
      {isLoading ? <ButtonLoadingHome /> : "Entrar"}
    </Button>
  );
}
