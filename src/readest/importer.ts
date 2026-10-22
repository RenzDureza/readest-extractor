import { ReadestLibraryReader } from './library-reader';
import { normalizeReadestBook, parseReadestBook } from './normalizer';
import type { ImportedBook } from './types';

export interface ReadestImportResult {
	books: ImportedBook[];
	activeBookCount: number;
	missingConfigCount: number;
	failedBookCount: number;
}

export class ReadestImporter {
	constructor(private readonly reader: ReadestLibraryReader) {}

	async importBooks(): Promise<ReadestImportResult> {
		const entries = await this.reader.getBooks();
		const importedBooks: ImportedBook[] = [];

		let activeBookCount = 0;
		let missingConfigCount = 0;
		let failedBookCount = 0;

		for (const [index, entry] of entries.entries()) {
			if (
				typeof entry === 'object' &&
				entry !== null &&
				'deletedAt' in entry &&
				entry.deletedAt != null
			) {
				continue;
			}

			activeBookCount += 1;

			let title =
				typeof entry === 'object' &&
				entry !== null &&
				'title' in entry &&
				typeof entry.title === 'string'
					? entry.title
					: `Library entry ${index + 1}`;

			try {
				const book = parseReadestBook(entry);
				title = book.title;

				let config: unknown = undefined;

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

				importedBooks.push(normalizeReadestBook(book, config));
			} catch (error) {
				failedBookCount += 1;

				console.warn(
					`[Readest Extractor] Could not scan "${title}" (library entry ${index + 1}).`,
					error,
				);
			}
		}

		return {
			books: importedBooks,
			activeBookCount,
			missingConfigCount,
			failedBookCount,
		};
	}
}
