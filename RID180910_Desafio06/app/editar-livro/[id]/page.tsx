"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Book {
  id: number
  titulo: string
  numeroPaginas: number
  isbn: string
  editora: string
}

export default function EditarLivro({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState({
    titulo: "",
    numeroPaginas: "",
    isbn: "",
    editora: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingBook, setIsLoadingBook] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const bookId = params.id

  const fetchBook = async () => {
    try {
      const response = await fetch(`/api/books/${bookId}`)
      if (response.ok) {
        const book: Book = await response.json()
        setFormData({
          titulo: book.titulo,
          numeroPaginas: book.numeroPaginas.toString(),
          isbn: book.isbn,
          editora: book.editora,
        })
      } else {
        toast({
          title: "Erro",
          description: "Livro não encontrado.",
          variant: "destructive",
        })
        router.push("/")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingBook(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: "Livro atualizado com sucesso.",
        })
        router.push("/")
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.error || "Erro ao atualizar livro.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBook()
  }, [bookId])

  if (isLoadingBook) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando livro...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-800 text-white p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">dnc</div>
          </div>
          <nav className="flex gap-6">
            <Link href="/" className="hover:text-blue-300 transition-colors">
              Listar livros
            </Link>
            <Link href="/cadastrar-livros" className="hover:text-blue-300 transition-colors">
              Cadastrar livros
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Edição de Livros</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="id">Id</Label>
                <Input id="id" type="text" value={bookId} disabled className="w-full bg-gray-100" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  name="titulo"
                  type="text"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroPaginas">Número de Páginas</Label>
                <Input
                  id="numeroPaginas"
                  name="numeroPaginas"
                  type="number"
                  value={formData.numeroPaginas}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  name="isbn"
                  type="text"
                  value={formData.isbn}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editora">Editora</Label>
                <Input
                  id="editora"
                  name="editora"
                  type="text"
                  value={formData.editora}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? "ATUALIZANDO..." : "ATUALIZAR LIVRO"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
