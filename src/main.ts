import { Notice, Plugin } from 'obsidian';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { ReadestLibraryReader } from './readest/library-reader';
import { ReadestImporter } from './readest/importer';

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

			for (const book of books) {
				try {
					new Notice(`Book Name: ${book.title}`);
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
