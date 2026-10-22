import { homedir } from 'node:os';
import { join } from 'node:path';

export interface ReadestExtractorSettings {
	readestLibraryPath: string;
}

export const DEFAULT_SETTINGS: ReadestExtractorSettings = {
	readestLibraryPath: join(
		homedir(),
		'.local',
		'share',
		'com.bilingify.readest',
		'Readest',
		'Books',
	),
};
