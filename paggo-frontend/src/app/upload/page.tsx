"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ButtonLoading } from "@/components/ui/buttoloading";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import { getCookie } from "cookies-next";
import { deleteCookie } from "cookies-next";
import { useRouter } from "next/navigation";

interface DocumentResult {
  id: number;
  filename: string;
  extractedText: string;
  explanation: string;
  createdAt?: string;
}

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<DocumentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentResult[]>([]);
  const router = useRouter(); 

  // Seleção do arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Função para carregar documentos anteriores
  const loadDocuments = async () => {
    const token = getCookie("session");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Erro ao carregar documentos anteriores.");

      const docs = await res.json();
      setDocuments(docs);
    } catch (err: any) {
      toast.error(err.message);
      console.error(err);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      toast.error("Por favor, selecione um arquivo.");
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const token = getCookie("session");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/documents/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erro: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      setResult(data.document);
      toast.success("Upload realizado com sucesso!");
      loadDocuments();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [previousQuestions, setPreviousQuestions] = useState<{
    [id: number]: string;
  }>({});

  const [previousAnswers, setPreviousAnswers] = useState<{
    [id: number]: string;
  }>({});

  const [previousLoading, setPreviousLoading] = useState<{
    [id: number]: boolean;
  }>({});

  const handleAskPreviousDocument = async (id: number) => {
    const question = previousQuestions[id];
    if (!question?.trim()) return;

    setPreviousLoading((prev) => ({ ...prev, [id]: true }));
    setPreviousAnswers((prev) => ({ ...prev, [id]: "" }));

    const token = getCookie("session");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/documents/${id}/ask`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question }),
        }
      );

      const data = await res.json();
      setPreviousAnswers((prev) => ({ ...prev, [id]: data.answer }));
    } catch (err) {
      toast.error("Error while fetching response.");
      console.error(err);
    } finally {
      setPreviousLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [questionLoading, setQuestionLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim() || !result) return;

    setQuestionLoading(true);
    setAnswer("");

    const token = getCookie("session");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/documents/${result.id}/ask`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question }),
        }
      );

      const data = await res.json();
      setAnswer(data.answer);
    } catch (err) {
      toast.error("Erro ao obter resposta.");
      console.error(err);
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleDownloadPDF = (doc: DocumentResult) => {
    const pdf = new jsPDF();
    const marginLeft = 10;
    const marginTop = 20;
    const maxWidth = 180;
    const lineHeight = 7;
    const pageHeight = pdf.internal.pageSize.getHeight();

    let yPosition = marginTop;

    const addTextWithBreak = (
      title: string,
      content: string,
      titleFontSize = 14,
      textFontSize = 11
    ) => {
      pdf.setFontSize(titleFontSize);
      if (yPosition + lineHeight > pageHeight) {
        pdf.addPage();
        yPosition = marginTop;
      }
      pdf.text(title, marginLeft, yPosition);
      yPosition += lineHeight;

      const lines = pdf.splitTextToSize(content, maxWidth);
      pdf.setFontSize(textFontSize);
      for (let i = 0; i < lines.length; i++) {
        if (yPosition + lineHeight > pageHeight) {
          pdf.addPage();
          yPosition = marginTop;
        }
        pdf.text(lines[i], marginLeft, yPosition);
        yPosition += lineHeight;
      }

      yPosition += lineHeight;
    };

    // Título
    pdf.setFontSize(16);
    pdf.text("Documento Processado", marginLeft, yPosition);
    yPosition += lineHeight + 3;

    // Nome e Data
    pdf.setFontSize(12);
    pdf.text(`Nome: ${doc.filename}`, marginLeft, yPosition);
    yPosition += lineHeight;
    pdf.text(`Data: ${doc.createdAt || "N/A"}`, marginLeft, yPosition);
    yPosition += lineHeight + 2;

    // Texto extraído
    addTextWithBreak("Texto Extraído:", doc.extractedText);

    // Explicação do LLM
    addTextWithBreak("Explicação:", doc.explanation);

    // Download
    pdf.save(`${doc.filename}_processado.pdf`);
  };

  const handleDeleteDocument = async (id: number) => {
    const token = getCookie("session");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/documents/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Erro ao excluir o documento.");
      }

      toast.success("Documento excluído com sucesso!");
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err: any) {
      toast.error(err.message);
      console.error(err);
    }
  };

  const handleLogout = () => {
    deleteCookie("session");
    toast.success("Sessão encerrada com sucesso!");
    router.push("/"); 
  };

  return (
    <div className="p-8 container mx-auto">
      <header className="flex justify-between mb-20">
        <h1 className="text-3xl font-bold">Paggo</h1>
        <Link href="/">
          <Button
            onClick={handleLogout}
            className="bg-red-700 text-white rounded-md hover:bg-red-900 cursor-pointer"
          >
            Sair
          </Button>
        </Link>
      </header>

      <h1 className="text-2xl font-bold mb-4">Upload de Documento</h1>

      <form
        onSubmit={handleUpload}
        className="flex flex-col gap-4 container mx-auto"
      >
        <div className="relative">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <Button variant="outline" className="bg-gray-800 text-white w-full">
            {file ? file.name : "Escolher Arquivo"}
          </Button>
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-700 text-white hover:bg-blue-600 cursor-pointer"
        >
          {loading ? <ButtonLoading /> : "Fazer Upload"}
        </Button>
      </form>

      {error && <p className="mt-4 text-red-500">Erro: {error}</p>}

      {result && (
        <div className="mt-6 p-4 border rounded-xl">
          <h3 className="font-bold text-lg">Texto Extraído:</h3>
          <p>{result.extractedText}</p>
          <h3 className="font-bold text-lg mt-5">Explicação:</h3>
          <p>{result.explanation}</p>
          <div className="mt-6">
            <label className="block font-semibold mb-1">
              Fazer uma pergunta:
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-2"
              placeholder="Ex: Qual é o valor total da nota?"
            />
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
              onClick={handleAsk}
              disabled={questionLoading}
            >
              {questionLoading ? "Consultando..." : "Perguntar"}
            </Button>

            {answer && (
              <div className="mt-4 p-3 border rounded">
                <strong>Resposta:</strong>
                <p className="mt-1">{answer}</p>
              </div>
            )}
          </div>
          <Button
            onClick={() => handleDownloadPDF(result)}
            className="mt-5 bg-green-700 text-white hover:bg-green-600 cursor-pointer"
          >
            Download do Documento em PDF
          </Button>
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-xl font-bold">Seus Documentos Anteriores:</h2>
        {documents.length === 0 ? (
          <p className="text-gray-500 mt-2">Nenhum documento enviado.</p>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="border rounded p-3 my-2 space-y-3">
              <p>
                <span className="font-bold">Texto extraido: </span>{" "}
                {doc.extractedText}
              </p>
              <p>
                <span className="font-bold">Data:</span>{" "}
                {new Date(doc.createdAt!).toLocaleString()}
              </p>
              <div className="mt-4">
                <label className="block font-semibold mb-1">
                  Fazer uma pergunta:
                </label>
                <input
                  type="text"
                  value={previousQuestions[doc.id] || ""}
                  onChange={(e) =>
                    setPreviousQuestions((prev) => ({
                      ...prev,
                      [doc.id]: e.target.value,
                    }))
                  }
                  className="w-full border rounded px-3 py-2 mb-2"
                  placeholder="Ex: Qual é o valor total da nota?"
                />
                <Button
                  className="bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                  onClick={() => handleAskPreviousDocument(doc.id)}
                  disabled={previousLoading[doc.id]}
                >
                  {previousLoading[doc.id] ? "Consultando..." : "Perguntar"}
                </Button>

                {previousAnswers[doc.id] && (
                  <div className="mt-4 p-3 border rounded">
                    <strong>Resposta:</strong>
                    <p className="mt-1">{previousAnswers[doc.id]}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-4">
                <Button
                  className="bg-green-700 text-white hover:bg-green-600 cursor-pointer"
                  onClick={() => handleDownloadPDF(doc)}
                >
                  Baixar PDF
                </Button>
                <Button
                  className="bg-red-600 text-white hover:bg-red-800 cursor-pointer"
                  onClick={() => handleDeleteDocument(doc.id)}
                >
                  Excluir
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
