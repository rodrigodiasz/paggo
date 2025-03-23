import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ButtonLoadingHome() {
  return (
    <Button className="bg-blue-800 text-white" disabled>
      <Loader2 className="animate-spin" />
      Carregando...
    </Button>
  )
}
