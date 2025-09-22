import { type NextRequest, NextResponse } from "next/server"
import { books, getNextId } from "@/lib/books-data"

export async function GET() {
  return NextResponse.json(books)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { titulo, numeroPaginas, isbn, editora } = body

    if (!titulo || !numeroPaginas || !isbn || !editora) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    const newBook = {
      id: getNextId(),
      titulo,
      numeroPaginas: Number.parseInt(numeroPaginas),
      isbn,
      editora,
    }

    books.push(newBook)
    return NextResponse.json(newBook, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar livro" }, { status: 500 })
  }
}
