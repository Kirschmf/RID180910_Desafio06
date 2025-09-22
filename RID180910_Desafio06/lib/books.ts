export interface Book {
  id: number
  titulo: string
  numeroPaginas: number
  isbn: string
  editora: string
}

export const books: Book[] = [
  {
    id: 1,
    titulo: "1984",
    numeroPaginas: 328,
    isbn: "978-0-452-28423-4",
    editora: "Signet Classic",
  },
  {
    id: 2,
    titulo: "O Sol é para Todos",
    numeroPaginas: 376,
    isbn: "978-0-06-112008-4",
    editora: "Editora José Olympio",
  },
  {
    id: 3,
    titulo: "O Apanhador no Campo de Centeio",
    numeroPaginas: 277,
    isbn: "978-0-316-76948-0",
    editora: "Signet Classic",
  },
]

export let nextId = 4

export function getBooks(): Book[] {
  return books
}

export function getBookById(id: number): Book | undefined {
  return books.find((book) => book.id === id)
}

export function createBook(bookData: Omit<Book, "id">): Book {
  const newBook: Book = {
    id: nextId++,
    ...bookData,
  }
  books.push(newBook)
  return newBook
}

export function updateBook(id: number, bookData: Omit<Book, "id">): Book | null {
  const index = books.findIndex((book) => book.id === id)
  if (index === -1) return null

  books[index] = { id, ...bookData }
  return books[index]
}

export function deleteBook(id: number): boolean {
  const index = books.findIndex((book) => book.id === id)
  if (index === -1) return false

  books.splice(index, 1)
  return true
}
