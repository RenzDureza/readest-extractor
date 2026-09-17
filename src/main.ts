import { Notice, Plugin } from 'obsidian';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { ReadestLibraryReader } from './readest/library-reader';
import { ReadestImporter } from './readest/importer';
import { renderBookNote } from './markdown/book-renderer';
import { BookNoteWriter } from './obsidian/book-note-writer';

export default class ReadestExtractorPlugin extends Plugin {
	async onload(): Promise<void> {
		this.addCommand({
			id: 'scan-readest-library',
			name: 'Scan Readest library',
			callback: async () => {
				await this.scanReadestLibrary();
			},
		});
	}

	private async scanReadestLibrary(): Promise<void> {
		const libraryPath = join(
			homedir(),
			'.local',
			'share',
			'com.bilingify.readest',
			'Readest',
			'Books',
		);

		const reader = new ReadestLibraryReader(libraryPath);
		const importer = new ReadestImporter(reader);

		try {
			const books = await importer.importBooks();

			if (books.length === 0) {
				new Notice('No Readest books found.');
				return;
			}

			for (const book of books) {
				try {
					const markdown = renderBookNote(book);
					const writer = new BookNoteWriter(this.app.vault);
					const createdFile = await writer.createBookNote(
						book,
						markdown,
					);
					new Notice(`Book Name: ${book.title}`);
					console.log(renderBookNote(book));

					if (createdFile) {
						new Notice(`Created ${createdFile.path}`);
					} else {
						new Notice(`A note for ${book.title} already exists.`);
					}
				} catch (error) {
					console.warn(
						`[Readest Extractor] Could not read ${book.title}`,
						error,
					);
				}
			}
		} catch (error) {
			console.error('[Readest Extractor] Library scan failed', error);

			const message =
				error instanceof Error ? error.message : 'Unknown error';

			new Notice(`Readest scan failed: ${message}`);
		}
	}
}
