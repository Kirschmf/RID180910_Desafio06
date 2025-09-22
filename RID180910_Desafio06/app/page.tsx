"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Book {
  id: number
  titulo: string
  numeroPaginas: number
  isbn: string
  editora: string
}

export default function Home() {
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchBooks = async () => {
    try {
      const response = await fetch("/api/books")
      if (response.ok) {
        const data = await response.json()
        setBooks(data)
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar livros.",
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

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este livro?")) return

    try {
      const response = await fetch(`/api/books/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: "Livro deletado com sucesso.",
        })
        fetchBooks() // Refresh the list
      } else {
        toast({
          title: "Erro",
          description: "Erro ao deletar livro.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando livros...</p>
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
            <Link href="/" className="text-blue-300">
              Listar livros
            </Link>
            <Link href="/cadastrar-livros" className="hover:text-blue-300 transition-colors">
              Cadastrar livros
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">Biblioteca Central Online - Livros</h1>

          {books.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Nenhum livro encontrado.</p>
              <Link href="/cadastrar-livros">
                <Button className="bg-blue-600 hover:bg-blue-700">Cadastrar Primeiro Livro</Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-8 text-center">Escolha o seu livro</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map((book) => (
                  <Card key={book.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-2">{book.titulo}</h3>
                      <p className="text-gray-600 text-sm mb-4">{book.editora}</p>

                      <div className="flex justify-end gap-2">
                        <Link href={`/editar-livro/${book.id}`}>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            ✏️
                          </Button>
                        </Link>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(book.id)}>
                          🗑️
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
