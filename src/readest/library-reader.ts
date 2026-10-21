import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { ReadestBook, ReadestBookConfig } from './types';

export class ReadestLibraryReader {
	constructor(private readonly libraryPath: string) {}

	async getBooks(): Promise<ReadestBook[]> {
		const libraryFile = path.join(this.libraryPath, 'library.json');

		const content = await readFile(libraryFile, 'utf8');
		const data: unknown = JSON.parse(content);

		if (!Array.isArray(data)) {
			throw new Error('Readest library.json is not an array.');
		}

		return (data as ReadestBook[]).filter((book) => book.deletedAt == null);
	}

	async getBookConfig(book: ReadestBook): Promise<ReadestBookConfig> {
		const configFile = path.join(
			this.libraryPath,
			book.hash,
			'config.json',
		);

		const content = await readFile(configFile, 'utf8');
		return JSON.parse(content) as ReadestBookConfig;
	}

	async getBookCover(book: ReadestBook): Promise<string> {
		const coverPath = path.join(this.libraryPath, book.hash, 'cover.png');
		return coverPath;
	}
}
