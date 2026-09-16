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
			} catch (err) {
				console.warn(
					`[Readest Extractor] No configuration found for "${book.title}".`,
					err,
				);
			}

			const annotations = (config?.booknotes ?? [])
				.filter((annotation) => annotation.deletedAt == null)
				.map((annotation) => ({
					id: annotation.id,
					text: annotation.text,
					note: annotation.note ?? '',
					page: annotation.page,
					color: annotation.color,
				}));

			const rawProgress = config?.progress ?? book.progress;

			const importedBook: ImportedBook = {
				bookHash: book.hash,
				metaHash: book.metaHash,
				title: book.title,
				authors:
					book.metadata?.author ?? (book.author ? [book.author] : []),
				format: book.format,
				published: book.metadata?.published,
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
