import { getSupabaseClient } from '../services/supabase.js';

interface TourStop {
	name: string;
	latitude: number;
	longitude: number;
	category: 'history' | 'architecture' | 'food' | 'pub';
	priority: 'site' | 'route';
	tourStop: number;
	description: string;
	tags: string[];
}

const TOUR_NAME = 'Vienna Walk';
const TOUR_ROUTE = 'Vienna Walk';
const TOUR_DESCRIPTION = `A walking tour through Vienna tracing the story of Jewish life, persecution and memory — from the Shoah Wall of Names and Ringstrasse palaces to Kristallnacht synagogue sites, deportation assembly points, and family addresses. A deeply personal journey through history.`;
const TOUR_DURATION = 300; // ~5 hours including metro and breaks

// Coordinates from GeoJSON exports (lat/lng extracted from [lng, lat] format)
const stops: TourStop[] = [
	{
		name: 'Shoah Wall of Names',
		latitude: 48.2153253,
		longitude: 16.3544322,
		category: 'history',
		priority: 'site',
		tourStop: 1,
		tags: ['holocaust', 'memorial', 'jewish-history', 'walking-tour', 'vienna'],
		description: `STARTING LOCATION

The Shoah Wall of Names pays tribute to 65,000 murdered Jewish men, women and children from Austria and was opened in 2021. The project was conceived in 1997 and took over twenty years to realise.

You will find the names of Elisabeth and Emanuel and probably many other family members including David and Ella Sandor, Alfred & Wilhelm Schwifcz, Fritz and Paul Willheim.`
	},
	{
		name: 'Palais Ephrussi',
		latitude: 48.2135633,
		longitude: 16.362455,
		category: 'history',
		priority: 'site',
		tourStop: 2,
		tags: ['ringstrasse', 'jewish-history', 'palace', 'walking-tour', 'vienna'],
		description: `The rapid burgeoning of the Jewish middle class in Vienna began with the Fundamental Laws of December 1867 when Jews were granted full equal civil and legal rights including being allowed to buy land in the city for the first time. The Ringstrasse replaced the city's medieval walls and was developed between 1860–1890.

Wealthy Jewish families known as the Ringstrasse Elite were key developers of this area building opulent palaces and acting as patrons of the arts and culture. This was in stark contrast to many Jewish immigrants who lived in overcrowded, cramped conditions in the Leopoldstadt.

An example of the 'Ringstrasse elite' were the Ephrussi family, originally Odessa-based grain merchants who established a prominent banking dynasty in 19th-century Vienna, becoming major art patrons and social figures. The 1938 Nazi annexation led to the seizure of their house and assets and their forced exile.

The family story is recorded in the book called The Hare with Amber Eyes by Edmund de Waal. The house was taken over by the Nazi administration until 1945.`
	},
	{
		name: 'Academy of Fine Arts Vienna',
		latitude: 48.20162,
		longitude: 16.3652434,
		category: 'history',
		priority: 'site',
		tourStop: 3,
		tags: ['art', 'hitler', 'history', 'walking-tour', 'vienna'],
		description: `The Academy of Fine Arts rejected Adolf Hitler twice, in 1907 and 1908. Professors deemed his portfolio unsatisfactory, noting a lack of talent.`
	},
	{
		name: 'Judenplatz Holocaust Memorial',
		latitude: 48.2115771,
		longitude: 16.3693962,
		category: 'history',
		priority: 'site',
		tourStop: 4,
		tags: ['holocaust', 'memorial', 'jewish-history', 'walking-tour', 'vienna'],
		description: `The Judenplatz Holocaust Memorial is a memorial to the 65,000 Austrian Jews who were murdered in the Shoah, also known as the Nameless Library, and was designed by British artist Rachel Whiteread.

Whiteread's memorial is a closed, windowless single storey building. It sits on a low plinth at one end of Judenplatz. The walls are covered from top to bottom in row upon row of books. But it is as though they have been turned to face the wall. A pair of doors at one end of the building are sealed shut.

Engraved on the plinth on the two sides and back of the memorial are the names of those places where Austrian Jews were murdered. Missing are Sajmiste and Zasavica where Liesl and Emmo were murdered.

Below the Jewish Museum building and square are the remains of a synagogue destroyed in 1421. There was a thriving Jewish community in this area in medieval times which came to an end in the violent Vienna Gesera 1420–1421, where the community was destroyed, and many were burned or expelled.`
	},
	{
		name: 'Memorial against War and Fascism',
		latitude: 48.2042294,
		longitude: 16.3689051,
		category: 'history',
		priority: 'site',
		tourStop: 5,
		tags: ['holocaust', 'memorial', 'jewish-history', 'walking-tour', 'vienna'],
		description: `Memorial to War and Fascism by Alfred Hrdlicka, 1988.

The bronze figure of the "Street-Washing Jew" symbolises the antisemitic violence in Vienna. In March 1938 Jews were forced by National Socialists to scrub slogans off the streets with brushes.

Alfred Hrdlicka's memorial faced significant criticism for failing to adequately address Austrian complicity in the Holocaust, with critics arguing it perpetuated myths of victimhood. The memorial was seen as reducing Jewish suffering to a footnote within the broader context of war, rather than acknowledging the specific role of Austrians in the Holocaust.

The humiliated Jew produced a highly uncomfortable image. While the work's other elements are seen from below, most put on plinths giving them an aura of respect, the low bronze of the Jew by contrast is only about 50 cm in height, anchored directly to the ground.`
	},
	{
		name: 'Prag-Rudniker (1st site)',
		latitude: 48.2020208,
		longitude: 16.3611465,
		category: 'history',
		priority: 'site',
		tourStop: 6,
		tags: ['family-history', 'jewish-history', 'business', 'walking-tour', 'vienna'],
		description: `Prag-Rudniker shop — 1st site on Mariahilfer Straße.

Ludwig Kraus (Lili Willheim's father) and his brothers had a business making wicker goods. Prag-Rudniker was a thriving business producing and distributing wicker goods and later developing wooden furniture which incorporated woven elements. Further information in 'A Family Story'.`
	},
	{
		name: 'Prag-Rudniker (2nd site)',
		latitude: 48.2011153,
		longitude: 16.358238,
		category: 'history',
		priority: 'site',
		tourStop: 7,
		tags: ['family-history', 'jewish-history', 'business', 'walking-tour', 'vienna'],
		description: `Prag-Rudniker shop — 2nd site on Mariahilfer Straße.

Soon after Ludwig became a partner, the retail business moved to a three-story building in the heart of Vienna at Mariahilfer Straße. The ground floor was high ceilinged and a former ballroom and ideal for displaying the goods.`
	},
	{
		name: 'Westbahnhof',
		latitude: 48.1967991,
		longitude: 16.337702,
		category: 'history',
		priority: 'site',
		tourStop: 8,
		tags: ['kindertransport', 'jewish-history', 'railway', 'walking-tour', 'vienna'],
		description: `Both Ruth and Stef left from here. Stef left in December 1938 and Ruth in March 1939.

Dedicated to the British people with deepest gratitude. They saved the lives of 10,000 Jewish and non-Jewish children who were able to escape Nazi persecution to Great Britain between 1938 and 1939 — the so-called "Kindertransport". For most children, their journey began here at Vienna's Westbahnhof.

"Whoever saves a single human life is as if he would have saved the whole of humanity."

Travel from Westbahnhof to Taborstraße (about 20 mins): Catch the metro U3 towards Simmering, change at Volkstheater onto the U2 towards Seestadt, get off at Taborstraße.`
	},
	{
		name: 'BEANDEPENDENT Coffee',
		latitude: 48.2187165,
		longitude: 16.3773276,
		category: 'food',
		priority: 'route',
		tourStop: 9,
		tags: ['coffee', 'food', 'break', 'walking-tour', 'vienna'],
		description: `Walk 10 mins from Taborstraße to BEANDEPENDENT, Lessinggasse 19, for a well-earned Kaffee und Kuchen.`
	},
	{
		name: 'Pazmanitentempel',
		latitude: 48.2222106,
		longitude: 16.3852739,
		category: 'history',
		priority: 'site',
		tourStop: 10,
		tags: ['synagogue', 'jewish-history', 'kristallnacht', 'family-history', 'walking-tour', 'vienna'],
		description: `Pazmanitentempel, also known as Jubiläumstempel, is where Liesl and Emmo got married and also Jacob who was Liesl's father and her stepmother, Mina.

The synagogue was destroyed on Kristallnacht and a light installation marks the place. Light installations were installed at the 25 locations where synagogues and houses of prayer once stood in Vienna.

The November pogroms of 1938 marked the terrible start of the systematic persecution and annihilation of the Jewish people. On November 9 and 10, 1938, businesses in Vienna were plundered and laid to waste, 27 Jews were murdered, many seriously injured and more than 6,500 Jewish citizens arrested. With only one exception, all of Vienna's synagogues and prayer houses were completely destroyed.`
	},
	{
		name: 'Deportation Assembly Point',
		latitude: 48.2153294,
		longitude: 16.3777857,
		category: 'history',
		priority: 'site',
		tourStop: 11,
		tags: ['holocaust', 'deportation', 'jewish-history', 'walking-tour', 'vienna'],
		description: `Assembly point for deportation — Kleine Sperlgasse 2A.

This was one of three assembly points where groups of approximately 1,000 persons each were transported from here on trucks to the Aspang Railroad Station. From February 1941 to October 1942, a total of 45 deportation trains departed for the ghettos and death camps.

Jacob and Mina were transported from one of these sites to Treblinka.`
	},
	{
		name: 'Morzinplatz Memorial',
		latitude: 48.2129223,
		longitude: 16.374738,
		category: 'history',
		priority: 'site',
		tourStop: 12,
		tags: ['holocaust', 'gestapo', 'memorial', 'walking-tour', 'vienna'],
		description: `Morzinplatz — memorial to victims of National Socialism.

The installation bears the inscription "Niemals Vergessen" — never forget.

Why this location? The Leopold-Figl-Hof building occupies the site of the former Hotel Metropol which was destroyed towards the end of the war.

The Gestapo confiscated the Jewish-owned hotel in 1938 and set up their headquarters inside. A place to administer a regime of terror and oppression. Vast numbers of Jews were interrogated and tortured on site and then sent off to die in concentration camps.`
	},
	{
		name: 'Eisenstädter Flats',
		latitude: 48.2136891,
		longitude: 16.3729885,
		category: 'history',
		priority: 'site',
		tourStop: 13,
		tags: ['family-history', 'jewish-history', 'walking-tour', 'vienna'],
		description: `Gonzagagasse 8 — Eisenstädter Flats.

Adolf Eisenstädter, our great great great grandfather, lived at this address. Shares in this property passed to our dad and his sister and were sold in 1990.`
	},
	{
		name: "Liesl, Emmo and Ruth's Deportation Address",
		latitude: 48.2160618,
		longitude: 16.3701464,
		category: 'history',
		priority: 'site',
		tourStop: 14,
		tags: ['family-history', 'deportation', 'jewish-history', 'walking-tour', 'vienna'],
		description: `Eßlinggasse 13, 1010 — Liesl, Emmo and Ruth's deportation address.`
	},
	{
		name: "Jacob & Mina's Home",
		latitude: 48.2176947,
		longitude: 16.3742693,
		category: 'history',
		priority: 'site',
		tourStop: 15,
		tags: ['family-history', 'deportation', 'jewish-history', 'walking-tour', 'vienna'],
		description: `Jacob & Mina's home and deportation address — Franz-Hochedlinger-Gasse 26.

In memory of the 57 Jewish men and women and 6 children who lived in this house and were deported by the Nazis and murdered.`
	},
	{
		name: 'NENI am Wasser',
		latitude: 48.2169317,
		longitude: 16.3736468,
		category: 'food',
		priority: 'site',
		tourStop: 16,
		tags: ['food', 'restaurant', 'walking-tour', 'vienna'],
		description: `The End! Food at NENI am Wasser restaurant.

A well-deserved meal to end the walk.`
	}
];

async function seed() {
	console.log('Starting Vienna Walk seed process...\n');
	console.log(`Total locations to process: ${stops.length}\n`);

	const supabase = getSupabaseClient();
	const placeIds: string[] = [];

	// Step 1: Create places with hardcoded coordinates from GeoJSON
	console.log('Creating places...\n');

	for (let i = 0; i < stops.length; i++) {
		const stop = stops[i];
		console.log(`[${i + 1}/${stops.length}] ${stop.name} (${stop.latitude}, ${stop.longitude})`);

		const { data: place, error } = await supabase
			.from('places')
			.insert({
				name: stop.name,
				description: stop.description,
				latitude: stop.latitude,
				longitude: stop.longitude,
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
	console.log('========================================');
}

seed().catch(console.error);
