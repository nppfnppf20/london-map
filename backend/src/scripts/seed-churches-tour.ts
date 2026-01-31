import { getSupabaseClient } from '../services/supabase.js';
import { geocodeOne } from '../services/geocoder.js';

interface TourStop {
	name: string;
	searchQuery: string;
	description: string;
}

const TOUR_NAME = 'Historic Churches Beyond the City of London';
const TOUR_DESCRIPTION = `A walking tour through some of the treasures of London beyond the city walls, featuring five special historic churches from Trafalgar Square to Clerkenwell.`;
const TOUR_DURATION = 120; // ~2 hours

const stops: TourStop[] = [
	{
		name: 'Trafalgar Square',
		searchQuery: 'Trafalgar Square, London',
		description: `STARTING LOCATION

It's a glorious day to be in central London, embarking on a very special trail through some of the treasures of London beyond the city walls.

Trafalgar Square is an ancient place of congregation. Long before it became the space we know today, it was once an area of bubbling springs set among wide meadows and fields. Elizabeth Gordon, author of Prehistoric London: Its Mounds and Circles, suggests that there almost certainly would have been a gorsedd here in ancient times.

Interestingly, Trafalgar Square still retains an ancient right of free speech, which may explain why it continues to be a focal point for gatherings and protests. It has been the site of two major riots — one in 1887 and another in 1990.

When John Nash designed Trafalgar Square in the early 19th century, he consciously intended — in his own words — to create "a barrier between the streets and squares occupied by the nobility and gentry, and the narrow streets and mean houses occupied by the mechanics and the trading part of the community."

To the south is Whitehall, the heart of government, Westminster, and St James's, with their grand houses. To the north, behind today's National Gallery, were the narrow streets of Soho, St Giles, and Covent Garden.`
	},
	{
		name: 'St Martin-in-the-Fields',
		searchQuery: 'St Martin-in-the-Fields, Trafalgar Square, London',
		description: `CHURCH 1 - North side of Trafalgar Square

Directly across the square is St Martin-in-the-Fields, occupying an extraordinarily commanding position. This is the church that truly inspired this series.

The church claims to sit at the very heart of the nation — certainly the heart of the capital. It was the site of the world's first lending library and the world's first religious broadcast.

We don't know the precise date of its foundation, but there is a reference from 1222 to a dispute over ownership between the Abbot of Westminster and the Bishop of London. The Archbishop of Canterbury eventually ruled in Westminster's favour.

Henry VIII built a new church here in 1542 and extended the parish boundaries, apparently so that plague victims would not be carried through his grounds.

The present church was designed by James Gibbs and completed in 1726.

Architecturally, this church marks an important shift. Until this point, church towers typically extended down to ground level — as with all of Christopher Wren's churches. Here, Gibbs placed the tower behind the portico, creating the illusion that it floats above the nave.

In Lost Treasures of London (1947), William Kent recalls taking shelter in the crypt here during the Second World War. The crypt served as a popular air-raid shelter, accommodating over 100 people. During the war, the church became known as "St Martin-in-the-Tombstones."

In more recent times, St Martin-in-the-Fields has become especially associated with work supporting the homeless. The café in the crypt has long been a favourite stop for people working in the West End.`
	},
	{
		name: 'The Savoy Chapel',
		searchQuery: 'Savoy Chapel, Savoy Hill, London',
		description: `CHURCH 2 - King's Chapel of the Savoy

Access via Strand → Exchange Court → Heathcock Court → Carting Lane → Savoy Hill

Tucked away in a quiet backstreet off Savoy Hill, close to the Savoy Steps, is one of London's great hidden gems: The Savoy Chapel, officially known as the King's Chapel of the Savoy.

This chapel is the last surviving remnant of a medieval charitable hospital founded by Henry VII in 1512. The hospital provided lodging for up to 100 men per night.

The hospital was built on the site of John of Gaunt's Savoy Palace. John of Gaunt, son of Edward III, had his palace here until it was sacked and burned during the Peasants' Revolt of 1381.

The hospital was dissolved in 1702.

The chapel was repaired and improved at the expense of King George IV between 1826 and 1830.

Today, it serves as the chapel of the Royal Victorian Order, established in 1896, an honour conferred personally by the sovereign. It's said that Queen Elizabeth II used to attend services here in secret.

It's one of those extraordinary fragments of medieval London that's incredibly easy to miss.`
	},
	{
		name: "St George's Bloomsbury",
		searchQuery: "St George's Bloomsbury, Bloomsbury Way, London",
		description: `CHURCH 3 - Bloomsbury (near High Holborn, Museum Street, Little Russell Street)

Route: From The Strand → Around Aldwych → Up Kingsway → Left into High Holborn → Past the Princess Louise Pub → Up the side of Swedenborg House

Here we arrive at St George's Bloomsbury, designed by the enigmatic Nicholas Hawksmoor.

James Gibbs submitted designs for this church but was unsuccessful. Hawksmoor's design was chosen, making this the sixth and final of his London churches.

Unlike St Martin-in-the-Fields, the tower here is placed to one side, not behind the portico.

The church was funded by the 1711 Act of Parliament commissioning 50 new churches. A curious feature is its north–south alignment, despite the act requiring east–west orientation. The site was hemmed in by surrounding buildings, yet permission was somehow granted.

Atop the steeple, Hawksmoor placed a statue featuring King George I, combined with classical symbolism. This attracted ridicule at the time.

The style is described by the church as English Baroque, while Peter Ackroyd characterises Hawksmoor's work as English Gothic, a style uniquely his own.

The church now houses the Museum of Comedy.

Hawksmoor designed this as an auditory church, ensuring that the liturgy of the Book of Common Prayer could be clearly heard throughout.

The church fell into disrepair but was later restored in a £9 million restoration.

Behind the church are unexplained stone fragments embedded in the churchyard.`
	},
	{
		name: 'St Alban the Martyr',
		searchQuery: "St Alban the Martyr, Baldwin's Gardens, London",
		description: `CHURCH 4 - Baldwin's Gardens, Clerkenwell

Route: Past London Review Bookshop → Bertrand Russell blue plaque → Along Theobalds Road → Into Clerkenwell → Past The Enterprise Pub (Red Lion Street) → Past Fryers Delight → Down Goswell Road → Into Baldwin's Gardens

This is a relatively modern but deeply special church.

Designed by William Butterfield and built in 1863, it was badly damaged by firebombing in 1941, then rebuilt by Adrian Gilbert Scott.

It features a stunning Holy Trinity mural by Hans Feibusch, a German Jewish artist who fled Nazi Germany in 1933. He worshipped at this church and produced work for 28 churches in total, as well as sculptures at Ely Cathedral.

The church has a strong Anglo-Catholic tradition. In 1862, its first curate, Alexander Mackonochie, introduced daily Eucharist, Gregorian chant, and extensive social outreach — soup kitchens, workers' clubs, and mothers' meetings. He became known as "the martyr of St Alban's."

The churchyard is a small oasis of calm.`
	},
	{
		name: "St Etheldreda's Chapel",
		searchQuery: "St Etheldreda's Church, Ely Place, London",
		description: `CHURCH 5 - Ely Place, off Hatton Garden

Route: Down Leather Lane → Left into Greville Street → Right into Hatton Garden → Through Mitre Court → Past Ye Olde Mitre Pub (est. 1546)

Built between 1250 and 1290, St Etheldreda's Chapel is one of the most ancient and storied churches in London.

Dedicated to St Etheldreda, an Anglo-Saxon princess born in 630, who founded Ely Cathedral and freed the bondsmen on her lands.

The chapel was built by the Bishops of Ely as part of their London palace, situated in a liberty — outside both royal and City jurisdiction.

This is one of only two surviving buildings in London from the reign of Edward I, and one of the oldest Catholic churches in England.`
	}
];

async function seed() {
	console.log('Starting seed process...\n');

	const supabase = getSupabaseClient();
	const placeIds: string[] = [];

	// Step 1: Geocode and create places
	console.log('Geocoding and creating places...\n');

	for (const stop of stops) {
		console.log(`Geocoding: ${stop.name}`);

		const geo = await geocodeOne(stop.searchQuery);

		if (!geo) {
			console.error(`  ✗ Failed to geocode: ${stop.name}`);
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
				category: 'history',
				tags: ['church', 'historic', 'walking-tour']
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

	// Step 2: Create the route
	console.log('Creating route...');

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
				notes: i === 0 ? 'Starting point' : `Stop ${i}`
			});

		if (stopError) {
			console.error(`  ✗ Failed to create stop ${i + 1}: ${stopError.message}`);
		} else {
			console.log(`  ✓ Created stop ${i + 1}: ${stops[i].name}`);
		}
	}

	console.log('\n✓ Seed complete!');
	console.log(`  - ${placeIds.length} places created`);
	console.log(`  - 1 route created`);
	console.log(`  - ${placeIds.length} route stops created`);
}

seed().catch(console.error);
