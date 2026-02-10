export interface BeaconTemplate {
	path: string;
	groupSize: number;
	name: string;
}

const templates: BeaconTemplate[] = [
	{ path: '/templates/knight-1.svg', groupSize: 1, name: 'Knight' },
	{ path: '/templates/elf-1.svg', groupSize: 1, name: 'Elf' },
	{ path: '/templates/knight-2.svg', groupSize: 2, name: 'Knight' },
	{ path: '/templates/elf-2.svg', groupSize: 2, name: 'Elf' },
	{ path: '/templates/knight-3.svg', groupSize: 3, name: 'Knight' },
	{ path: '/templates/elf-3.svg', groupSize: 3, name: 'Elf' },
	{ path: '/templates/knight-4.svg', groupSize: 4, name: 'Knight' },
	{ path: '/templates/elf-4.svg', groupSize: 4, name: 'Elf' }
];

export function getRandomTemplate(groupSize: number): BeaconTemplate {
	const matching = templates.filter(t => t.groupSize === groupSize);
	return matching[Math.floor(Math.random() * matching.length)];
}

export function getTemplatesForSize(groupSize: number): BeaconTemplate[] {
	return templates.filter(t => t.groupSize === groupSize);
}
