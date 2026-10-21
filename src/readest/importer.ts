import { ReadestLibraryReader } from './library-reader';
import { ImportedBook, ReadestBookConfig } from './types';

export class ReadestImporter {
	constructor(private readonly reader: ReadestLibraryReader) {}

	async importBooks(): Promise<ImportedBook[]> {
		const books = await this.reader.getBooks();
		const importedBooks: ImportedBook[] = [];
		for (const book of books) {
			let config: ReadestBookConfig | undefined;

			try {
				config = await this.reader.getBookConfig(book);
			} catch (error) {
				if (
					error instanceof Error &&
					'code' in error &&
					error.code === 'ENOENT'
				) {
					console.info(
						`[Readest Extractor] "${book.title}" has no configuration yet.`,
					);
				} else {
					throw error;
				}
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
		}
		return importedBooks;
	}
}
