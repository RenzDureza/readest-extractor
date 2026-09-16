export interface ReadestMetadata {
	identifier?: string;
	title?: string;
	author?: string[];
	publisher?: string;
	published?: string;
	description?: string;
}

export interface ReadestBook {
	hash: string;
	metaHash?: string;
	format?: string;
	title: string;
	author?: string;
	groupId?: string;
	groupName?: string | null;
	tags?: string[] | null;
	progress?: [number, number];
	coverHash?: string;
	sourceTitle?: string;
	metadata?: ReadestMetadata;
	createdAt?: number;
	updatedAt?: number;
	deletedAt?: number | null;
	primaryLanguage?: string;
}

export interface ReadestAnnotation {
	bookHash: string;
	metaHash?: string;
	id: string;
	type: string;
	cfi?: string;
	page?: number;
	text: string;
	style?: string;
	color?: string;
	note?: string;
	createdAt: number;
	updatedAt: number;
	deletedAt: number | null;
}

export interface ReadestBookConfig {
	schemaVersion: number;
	updatedAt?: number;
	booknotes?: ReadestAnnotation[];
	progress?: [number, number];
	location?: string;
}

export interface ImportedAnnotation {
	id: string;
	text: string;
	note: string;
	page?: number;
	cfi?: string;
	color?: string;
	style?: string;
	createdAt?: number;
	updatedAt?: number;
}

export interface ImportedBook {
	bookHash: string;
	metaHash?: string;
	title: string;
	authors: string[];
	format?: string;
	languages?: string[];
	published?: string;
	description?: string;
	progress?: {
		current: number;
		total: number;
	};
	annotations: ImportedAnnotation[];
	coverPath?: string;
}
