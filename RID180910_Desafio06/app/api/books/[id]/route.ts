import { type NextRequest, NextResponse } from "next/server"
import { books } from "@/lib/books-data"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)
  const book = books.find((b) => b.id === id)

  if (!book) {
    return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 })
  }

  return NextResponse.json(book)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const bookIndex = books.findIndex((b) => b.id === id)

    if (bookIndex === -1) {
      return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const { titulo, numeroPaginas, isbn, editora } = body

    if (!titulo || !numeroPaginas || !isbn || !editora) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    books[bookIndex] = {
      ...books[bookIndex],
      titulo,
      numeroPaginas: Number.parseInt(numeroPaginas),
      isbn,
      editora,
    }

    return NextResponse.json(books[bookIndex])
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar livro" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)
  const bookIndex = books.findIndex((b) => b.id === id)

  if (bookIndex === -1) {
    return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 })
  }

  books.splice(bookIndex, 1)

  return NextResponse.json({ message: "Livro deletado com sucesso" })
}
