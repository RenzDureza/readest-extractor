import { Notice, Plugin } from 'obsidian';
import { ReadestLibraryReader } from './readest/library-reader';
import { ReadestImporter } from './readest/importer';
import { DEFAULT_SETTINGS } from './settings';

export default class ReadestExtractorPlugin extends Plugin {
	onload(): void {
		this.addCommand({
			id: 'scan-readest-library',
			name: 'Scan Readest library',
			callback: async () => {
				await this.scanReadestLibrary();
			},
		});
	}

	private async scanReadestLibrary(): Promise<void> {
		const reader = new ReadestLibraryReader(
			DEFAULT_SETTINGS.readestLibraryPath,
		);
		const importer = new ReadestImporter(reader);

		try {
			const result = await importer.importBooks();

			const annotationCount = result.books.reduce(
				(total, book) => total + book.annotations.length,
				0,
			);

			const summary = [
				`Readest scan: ${result.activeBookCount} active books`,
				`${result.books.length} scanned successfully`,
				`${annotationCount} active annotations read`,
				`${result.missingConfigCount} missing configurations`,
				`${result.failedBookCount} failed books`,
			].join('; ');

			const errorHint =
				result.failedBookCount > 0
					? ' See the developer console for details.'
					: '';

			new Notice(`${summary}.${errorHint}`, 10000);
		} catch (error) {
			console.error('[Readest Extractor] Library scan failed.', error);

			const message =
				error instanceof Error ? error.message : 'Unknown error';

			new Notice(`Readest scan failed: ${message}`, 10000);
		}
	}
}
