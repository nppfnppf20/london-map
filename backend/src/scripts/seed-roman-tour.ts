import { getSupabaseClient } from '../services/supabase.js';
import { geocodeOne } from '../services/geocoder.js';

interface TourStop {
	name: string;
	searchQuery: string;
	category: 'history' | 'architecture' | 'food' | 'pub';
	priority: 'site' | 'route';
	tourStop: number;
	description: string;
	tags: string[];
}

const TOUR_NAME = 'Ancient City Tour';
const TOUR_ROUTE = 'Ancient City Tour';
const TOUR_DESCRIPTION = `London is actually two cities — one built on top of the other. Before there was London, there was Londinium, an outpost of the Roman Empire founded right here in the heart of modern London. This walking tour explores London's 2,000-year-old Roman origins, from the ancient Forum to the Barbican.`;
const TOUR_DURATION = 90;

const stops: TourStop[] = [
	{
		name: 'The Roman Forum Intersection',
		searchQuery: 'Gracechurch Street and Lombard Street, London EC3',
		category: 'history',
		priority: 'site',
		tourStop: 1,
		tags: ['roman', 'historic', 'walking-tour', 'londinium', 'forum'],
		description: `STOP 1 — THE FORUM INTERSECTION (Cardo + Decumanus)

Gracechurch Street / Lombard Street / Fenchurch Street (transition point)

Right now, we're standing at the most important intersection of Roman Londinium, because underneath our feet is the starting point of every Roman city: the Roman Forum.

As Rome expanded, every new city they built was designed as a grid. At the center of each grid was what's called the forum.

In a Roman city, the forum was both:
• a marketplace for commerce, and
• a marketplace of ideas — politics, legal proceedings, and civic gatherings of all kinds.

In every Roman city, the forum was located near the intersection of two major roads:
• the Cardo
• the Decumanus

The Cardo was the primary market street.
The Decumanus was the primary military street connecting towns throughout the empire.

And the phrase "all roads lead to Rome" has something to do with that. As the empire expanded, symbolically, they wanted streets that connected these provincial outposts and peripheral towns back to the heart of the empire — Rome.

This is the intersection of:
• Gracechurch Street
• Lombard Street
• where it transitions to Fenchurch Street

In Londinium, this is where the Roman Forum was.

In a Roman outpost:
• the Decumanus was primarily east–west
• the Cardo was north–south

If you look at the map of London today, you can still see this intersection: the Cardo essentially aligns with Gracechurch Street, leading down to London Bridge, which was in the same location as today's London Bridge — more or less.

In the case of Londinium, the settlement was located directly north of the River Thames, and the important port is the reason why the Romans decided to put this place here.

The Cardo was a crucial link between:
• the river and the trade that happened on it, and
• the main marketplace (the forum).

So commerce in Roman Londinium ran north–south along the Cardo and various streets parallel to it.

London, as a medieval settlement, has a fairly ad hoc, informal grid — but in this area in particular, you can see the ghost of the Roman grid.

It's fairly unique in the older parts of London to see this kind of grid structure, and that's a direct ancestor of the Roman settlement that existed here before.

You can also see a ghost of it today in the names of the streets that exist between the forum location and the River Thames:
• Pudding (connected to trade / market uses)
• Fish Hill (connected to the movement of fish up and down)

Even though these uses came back in the medieval city after Londinium was abandoned, the site was resettled — it almost came back from the dead.

In fact, the Romans were the first to build a bridge across the Thames. The location of that bridge can be seen in the street grid.

That original bridge would have been located parallel to where today's London Bridge is, directly aligned with the Cardo, and connected to the forum.

But we don't even need the map to know where the Roman Forum would have been — because in 2025, archaeologists drilled a massive hole into the floor of an office building and uncovered the foundations of one of the most important buildings in Roman Londinium.`
	},
	{
		name: 'Gracechurch Street',
		searchQuery: 'Gracechurch Street, London EC3',
		category: 'history',
		priority: 'route',
		tourStop: 1,
		tags: ['roman', 'historic', 'walking-tour', 'cardo', 'street'],
		description: `Gracechurch Street marks the route of the ancient Roman Cardo — the primary north-south market street of Londinium.

The Cardo essentially aligns with Gracechurch Street, leading down to London Bridge, which was in the same location as today's London Bridge — more or less.

The Cardo was a crucial link between:
• the river and the trade that happened on it, and
• the main marketplace (the forum).

So commerce in Roman Londinium ran north–south along the Cardo and various streets parallel to it.`
	},
	{
		name: 'Lombard Street',
		searchQuery: 'Lombard Street, London EC3',
		category: 'history',
		priority: 'route',
		tourStop: 1,
		tags: ['roman', 'historic', 'walking-tour', 'decumanus', 'street'],
		description: `Lombard Street, where it meets Gracechurch Street, marks part of the ancient Roman Decumanus — the primary east-west military street of Londinium.

The Decumanus was the primary military street connecting towns throughout the empire. The phrase "all roads lead to Rome" has something to do with that — as the empire expanded, symbolically, they wanted streets that connected these provincial outposts and peripheral towns back to the heart of the empire.`
	},
	{
		name: 'Fenchurch Street',
		searchQuery: 'Fenchurch Street, London EC3',
		category: 'history',
		priority: 'route',
		tourStop: 1,
		tags: ['roman', 'historic', 'walking-tour', 'decumanus', 'street'],
		description: `Fenchurch Street continues the line of the Roman Decumanus eastward from Lombard Street. This was the primary east-west military street of Roman Londinium, connecting the settlement to other towns throughout the empire.`
	},
	{
		name: 'London Bridge',
		searchQuery: 'London Bridge, London',
		category: 'history',
		priority: 'route',
		tourStop: 1,
		tags: ['roman', 'historic', 'bridge', 'thames'],
		description: `The Romans were the first to build a bridge across the Thames. The location of that bridge can be seen in the street grid.

That original bridge would have been located parallel to where today's London Bridge is, directly aligned with the Cardo, and connected to the forum.

The Cardo essentially aligns with Gracechurch Street, leading down to London Bridge, which was in the same location as today's London Bridge — more or less.`
	},
	{
		name: 'Pudding Lane',
		searchQuery: 'Pudding Lane, London EC3',
		category: 'history',
		priority: 'route',
		tourStop: 1,
		tags: ['roman', 'historic', 'walking-tour', 'great-fire', 'street'],
		description: `Pudding Lane preserves a ghost of Roman London in its name — connected to trade and market uses that ran along the streets between the forum location and the River Thames.

Even though these uses came back in the medieval city after Londinium was abandoned, the site was resettled — it almost came back from the dead.

(Pudding Lane is also famously where the Great Fire of London started in 1666.)`
	},
	{
		name: 'Fish Street Hill',
		searchQuery: 'Fish Street Hill, London EC3',
		category: 'history',
		priority: 'route',
		tourStop: 1,
		tags: ['roman', 'historic', 'walking-tour', 'street'],
		description: `Fish Street Hill preserves a ghost of Roman London in its name — connected to the movement of fish up from the Thames to the markets.

You can see a ghost of the Roman grid today in the names of the streets that exist between the forum location and the River Thames.`
	},
	{
		name: 'Leadenhall Market',
		searchQuery: 'Leadenhall Market, London EC3',
		category: 'history',
		priority: 'site',
		tourStop: 2,
		tags: ['roman', 'historic', 'walking-tour', 'basilica', 'market', 'victorian'],
		description: `STOP 2 — LEADENHALL MARKET / THE ROMAN BASILICA

Leadenhall Market + nearby forum zone

Behind me is Leadenhall Market, one of London's most historic markets, and also the site of some of London's most newly rediscovered ruins.

What was recently found underneath this building reconfirmed the location of Roman London's most important building: the Basilica.

We're just down the street from the center of the forum, on nearly the exact site of the original Roman basilica.

In a Roman city, the basilica was always located on one end of the forum and was used for political, economic, and administrative purposes — such as court proceedings.

Leadenhall Market has existed on this location since roughly the 1300s. But the current structure was built in the late 1800s, designed by Horace Jones.

The building he designed in the 19th century is strikingly similar to the Roman building that existed here nearly 2,000 years ago.

The word "basilica" brings to mind a religious building — a Christian church — and that's no accident.

A lot of early Christian churches took over the sites of Roman basilicas, and their plan — a large central nave with side aisles — and the former secular, multi-purpose use of the Roman basilica was co-opted into a Christian typology.

However, the mall or the market took on a similar sort of name — and it's an interesting irony that Leadenhall Market essentially co-opted the basilica plan: the large vaulted central nave and side aisles for markets and shops.

It's almost a reappropriation of this Roman spatial plan.

And it's an amazing coincidence that this building type — this market that adopts the form of a Roman basilica — was reconstructed in the 19th century directly over, and aligned with, the original Roman basilica.

This was done without the architect likely knowing about the location — or, frankly, the shape — of the original Roman basilica.

And while the basilica is the most recent rediscovery in Roman London, it's far from the only one.

This site was carefully uncovered by archaeologists during the construction of a building next door.

But many Roman ruins in London would never have been discovered if it hadn't been for the bombings during the Blitz of World War II.`
	},
	{
		name: 'Lime Street',
		searchQuery: 'Lime Street, London EC3',
		category: 'history',
		priority: 'route',
		tourStop: 2,
		tags: ['roman', 'historic', 'walking-tour', 'fresco'],
		description: `Parts of a Roman fresco were discovered underneath Lime Street during post-Blitz excavations.

Throughout the historic core of London, little bits and pieces were discovered — almost like treasures that emerged despite the trauma of the bombing.`
	},
	{
		name: 'Cannon Street Station',
		searchQuery: 'Cannon Street Station, London EC4',
		category: 'history',
		priority: 'route',
		tourStop: 2,
		tags: ['roman', 'historic', 'walking-tour', 'station'],
		description: `Foundations of a massive Roman building were discovered under Cannon Street Station.

Throughout the historic core of London, little bits and pieces of Roman Londinium were discovered during post-Blitz excavations — almost like treasures that emerged despite the trauma of the bombing.`
	},
	{
		name: 'London Mithraeum (Bloomberg SPACE)',
		searchQuery: 'London Mithraeum, Bloomberg, London EC4',
		category: 'history',
		priority: 'site',
		tourStop: 2,
		tags: ['roman', 'historic', 'walking-tour', 'temple', 'mithras', 'museum'],
		description: `The Temple of Mithras, currently on exhibition under the new Bloomberg headquarters.

The Mithraeum was showcased as part of a new building — the Barbican takes that idea to an extreme and creates an entire landscape built around fragments of its Roman past.

The temple was originally discovered in 1954 during post-war construction work. It has been reconstructed in its original location as part of the Bloomberg European headquarters, where visitors can experience the ancient temple seven metres below modern street level.`
	},
	{
		name: 'The Barbican Centre',
		searchQuery: 'Barbican Centre, London EC2',
		category: 'history',
		priority: 'site',
		tourStop: 3,
		tags: ['roman', 'historic', 'walking-tour', 'fort', 'brutalist', 'modernist'],
		description: `STOP 3 — THE BARBICAN / ROMAN FORT CORNER + ROMAN WALL LAYERS

Barbican Centre + round tower

We're standing in the Barbican Centre, and the round tower behind me was quite possibly the oldest piece of Roman construction within Londinium.

The Barbican is a brutalist building complex that helped inject modern architecture into the fabric of historic London.

During the Blitz of World War II, this area was heavily bombed — and while the city built up over several thousand years was largely destroyed, what was revealed were Roman foundations and the basis for the original city.

Before Roman Londinium, there was just a fort on this location.

The location marked by that tower — even though the tower has been built up and modified over the years — is the location of the northernmost corner of that fort.

This was far from the only place bombed during the Blitz. Throughout the historic core of London, little bits and pieces were discovered — almost like treasures that emerged despite the trauma of the bombing.

And similar to what was done with the Mithraeum — where it was showcased as part of a new building — the Barbican takes that idea to an extreme and creates an entire landscape built around fragments of its Roman past.

This is really the story of London.

You can see it all along the former Roman wall: different layers —
• the Roman layer of wall,
• medieval constructions built on top of it and incorporating it,
• and new buildings popping up around it (usually around it rather than on top of it), showcasing it.

So if you look around us in these openly modernist buildings, there are bits of the language of Roman architecture:
• brick
• arches

They're reinterpreted in a contemporary, almost inverted way.

You see fragments that feel like Roman concrete — and the buildings riff on the language of Roman architecture without explicitly copying it.

This is what modernism of that period was trying to do: monumentalise the past and create a new language fitting for modern times, rather than the previous neoclassical revivals that explicitly copied and mimicked the Romans.

The Barbican is a modern mixed-use complex with:
• schools
• housing
• an art centre
• public space
• an old church

It represents a modernist urban planning vision for rebuilding the city, which its architects Chamberlin, Powell and Bon pursued to the fullest.

This is a unique space in London primarily because of the Blitz.

The city had an opportunity to build something at the scale of large modernist urban planning, and the trauma of the war created — in its horrific aftermath — an opportunity for London to experiment with 20th-century urban planning ideals.

The Barbican represents this in its program, its style, and its form.`
	},
	{
		name: 'Roman Fort Corner Tower',
		searchQuery: 'Roman Wall, Barbican, London EC2',
		category: 'history',
		priority: 'site',
		tourStop: 3,
		tags: ['roman', 'historic', 'walking-tour', 'fort', 'tower', 'wall'],
		description: `The round tower at the Barbican was quite possibly the oldest piece of Roman construction within Londinium.

Before Roman Londinium, there was just a fort on this location.

The location marked by that tower — even though the tower has been built up and modified over the years — is the location of the northernmost corner of that fort.

You can see it all along the former Roman wall: different layers —
• the Roman layer of wall,
• medieval constructions built on top of it and incorporating it,
• and new buildings popping up around it (usually around it rather than on top of it), showcasing it.`
	}
];

async function seed() {
	console.log('Starting Ancient City Tour seed process...\n');
	console.log(`Total locations to process: ${stops.length}\n`);

	const supabase = getSupabaseClient();
	const placeIds: string[] = [];
	const failedGeocodes: string[] = [];

	// Step 1: Geocode and create places
	console.log('Geocoding and creating places...\n');

	for (let i = 0; i < stops.length; i++) {
		const stop = stops[i];
		console.log(`[${i + 1}/${stops.length}] Geocoding: ${stop.name}`);

		const geo = await geocodeOne(stop.searchQuery);

		if (!geo) {
			console.error(`  ✗ Failed to geocode: ${stop.name}`);
			failedGeocodes.push(stop.name);
			continue;
		}

		console.log(`  ✓ Found: ${geo.latitude}, ${geo.longitude}`);

		// Insert place
		const { data: place, error } = await supabase
			.from('places')
			.insert({
				name: stop.name,
				description: stop.description,
				latitude: geo.latitude,
				longitude: geo.longitude,
				category: stop.category,
				priority: stop.priority,
				route: TOUR_ROUTE,
				route_stop: stop.tourStop,
				tags: stop.tags
			})
			.select()
			.single();

		if (error) {
			console.error(`  ✗ Failed to insert place: ${error.message}`);
			continue;
		}

		console.log(`  ✓ Created place: ${place.id}\n`);
		placeIds.push(place.id);
	}

	// Step 2: Create the tour
	console.log('Creating tour...');

	const { data: tour, error: tourError } = await supabase
		.from('routes')
		.insert({
			name: TOUR_NAME,
			description: TOUR_DESCRIPTION,
			duration_minutes: TOUR_DURATION
		})
		.select()
		.single();

	if (tourError) {
		console.error(`✗ Failed to create route: ${tourError.message}`);
		return;
	}

	console.log(`✓ Created route: ${tour.id}\n`);

	// Step 3: Create route stops
	console.log('Creating route stops...');

	for (let i = 0; i < placeIds.length; i++) {
		const { error: stopError } = await supabase
			.from('route_stops')
			.insert({
				route_id: tour.id,
				place_id: placeIds[i],
				stop_order: i + 1,
				notes: `Stop ${stops[i].tourStop}`
			});

		if (stopError) {
			console.error(`  ✗ Failed to create stop ${i + 1}: ${stopError.message}`);
		} else {
			console.log(`  ✓ Created stop ${i + 1}: ${stops[i].name}`);
		}
	}

	console.log('\n========================================');
	console.log('✓ Seed complete!');
	console.log(`  - ${placeIds.length} places created`);
	console.log(`  - 1 route created`);
	console.log(`  - ${placeIds.length} route stops created`);

	if (failedGeocodes.length > 0) {
		console.log(`\n⚠ Failed to geocode ${failedGeocodes.length} locations:`);
		failedGeocodes.forEach(name => console.log(`  - ${name}`));
	}
	console.log('========================================');
}

seed().catch(console.error);
