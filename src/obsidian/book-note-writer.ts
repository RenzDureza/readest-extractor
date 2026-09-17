import { normalizePath, Vault, TFile, MetadataCache } from 'obsidian';
import { ImportedBook } from '../readest/types';

export class BookNoteWriter {
	constructor(
		private readonly vault: Vault,
		private readonly metadataCache: MetadataCache,
		private readonly outputFolder = 'Books',
	) {}

	async createBookNote(
		book: ImportedBook,
		content: string,
	): Promise<TFile | undefined> {
		await this.ensureOutputFolder();

		const filename = this.sanitizeFilename(book.title);
		const filePath = normalizePath(`${this.outputFolder}/${filename}.md`);
		const existingBookNote = this.findBookNote(book.bookHash);

		if (existingBookNote) {
			console.info(
				`[Readest Extractor] Book note already exists: ${existingBookNote.path}`,
			);

			return undefined;
		}

		const existingFile = this.vault.getAbstractFileByPath(filePath);
		if (existingFile) {
			console.info(
				`[Readest Extractor] Note already exists: ${filePath}`,
			);
			return undefined;
		}
		return await this.vault.create(filePath, content);
	}

	private async ensureOutputFolder(): Promise<void> {
		const folder = this.vault.getAbstractFileByPath(this.outputFolder);

		if (!folder) {
			await this.vault.createFolder(this.outputFolder);
		}
	}

	private sanitizeFilename(title: string): string {
		return title.replace(/[\\/:*?"<>|]/g, '-').trim();
	}

	private findBookNote(bookHash: string): TFile | undefined {
		const markdownFiles = this.vault.getMarkdownFiles();

		return markdownFiles.find((file) => {
			const cache = this.metadataCache.getFileCache(file);

			return cache?.frontmatter?.readest_book_hash === bookHash;
		});
	}
}
