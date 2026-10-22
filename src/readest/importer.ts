import { ReadestLibraryReader } from './library-reader';
import { ImportedBook, ReadestBookConfig } from './types';

export interface ReadestImportResult {
	books: ImportedBook[];
	activeBookCount: number;
	missingConfigCount: number;
	failedBookCount: number;
}

export class ReadestImporter {
	constructor(private readonly reader: ReadestLibraryReader) {}

	async importBooks(): Promise<ReadestImportResult> {
		const books = await this.reader.getBooks();
		const importedBooks: ImportedBook[] = [];

		let missingConfigCount = 0;
		let failedBookCount = 0;

		for (const book of books) {
			try {
				let config: ReadestBookConfig | undefined;

				try {
					config = await this.reader.getBookConfig(book);
				} catch (error) {
					const isMissingConfig =
						error instanceof Error &&
						'code' in error &&
						error.code === 'ENOENT';

					if (!isMissingConfig) {
						throw error;
					}

					missingConfigCount += 1;
				}

				const annotations = (config?.booknotes ?? [])
					.filter((annotation) => annotation.deletedAt == null)
					.map((annotation) => ({
						id: annotation.id,
						text: annotation.text,
						note: annotation.note ?? '',
						page: annotation.page,
						cfi: annotation.cfi,
						color: annotation.color,
						style: annotation.style,
						createdAt: annotation.createdAt,
						updatedAt: annotation.updatedAt,
					}));

				const rawProgress = config?.progress ?? book.progress;
				const rawAuthors = book.metadata?.author ?? book.author;

				const authors = Array.isArray(rawAuthors)
					? rawAuthors
					: rawAuthors
						? [rawAuthors]
						: [];

				const importedBook: ImportedBook = {
					bookHash: book.hash,
					metaHash: book.metaHash,
					title: book.title,
					authors,
					format: book.format,
					published: book.metadata?.published,
					publisher: book.metadata?.publisher,
					description: book.metadata?.description,
					progress: rawProgress
						? {
								current: rawProgress[0],
								total: rawProgress[1],
							}
						: undefined,
					annotations,
				};
				importedBooks.push(importedBook);
			} catch (error) {
				failedBookCount += 1;
				console.warn(
					`[Readest Extractor] Could not scan "${book.title}" (${book.hash}).`,
					error,
				);
			}
		}
		return {
			books: importedBooks,
			activeBookCount: books.length,
			missingConfigCount,
			failedBookCount,
		};
	}
}
