import { getSupabaseClient } from '../services/supabase.js';
import { geocodeOne } from '../services/geocoder.js';

interface TourStop {
	name: string;
	searchQuery: string;
	category: 'history' | 'architecture' | 'food' | 'pub';
	priority: 'site' | 'route';
	route: string;
	description: string;
	tags: string[];
}

const TOUR_NAME = 'Historic Churches Beyond the City of London';
const TOUR_DESCRIPTION = `A walking tour through some of the treasures of London beyond the city walls, featuring five special historic churches from Trafalgar Square to Clerkenwell. This tour covers ancient landmarks, hidden gems, historic pubs, and the narrow lanes connecting them.`;
const TOUR_DURATION = 150;

const stops: TourStop[] = [
	{
		name: 'Trafalgar Square',
		searchQuery: 'Trafalgar Square, London',
		category: 'history',
		tags: ['starting-point', 'landmark', 'historic', 'walking-tour'],
		description: `STARTING LOCATION - TRAFALGAR SQUARE

It's a glorious day to be in central London, embarking on a very special trail through some of the treasures of London beyond the city walls.

When we rather regrettably finished our series of walks around the City of London churches — which was an amazing series and one I loved making — it was a sad day. But at the end of that series I said that there are a number of churches just slightly beyond the City of London that absolutely deserve to be included. That's what we're doing today.

You can probably already tell that I'm not exactly on the City fringe. I've taken some firm liberties with that definition, but I think you'll agree once we get going that this walking tour — featuring five special churches — earns its place in a new series: Historic Churches of London Beyond the City of London.

We begin here at Trafalgar Square.

Trafalgar Square is an ancient place of congregation. Long before it became the space we know today, it was once an area of bubbling springs set among wide meadows and fields. Elizabeth Gordon, author of Prehistoric London: Its Mounds and Circles, suggests that there almost certainly would have been a gorsedd here in ancient times.

Interestingly, Trafalgar Square still retains an ancient right of free speech, which may explain why it continues to be a focal point for gatherings and protests. It has been the site of two major riots — one in 1887 and another in 1990. It's also a place of buskers, who I hope aren't interfering too much with the audio.

When John Nash designed Trafalgar Square in the early 19th century, he consciously intended — in his own words — to create "a barrier between the streets and squares occupied by the nobility and gentry, and the narrow streets and mean houses occupied by the mechanics and the trading part of the community."

You can really see that division here. To the south is Whitehall, the heart of government, Westminster, and St James's, with their grand houses. To the north, behind today's National Gallery, were the narrow streets of Soho, St Giles, and Covent Garden.

Standing on this side of the square also gives us a magnificent view of our first church.`
	},
	{
		name: 'National Gallery',
		searchQuery: 'National Gallery, Trafalgar Square, London',
		category: 'architecture',
		tags: ['landmark', 'museum', 'architecture'],
		description: `The National Gallery stands on the north side of Trafalgar Square. Behind it were the narrow streets of Soho, St Giles, and Covent Garden — a stark contrast to the grand houses of Whitehall and St James's to the south.

When John Nash designed Trafalgar Square in the early 19th century, he consciously intended to create "a barrier between the streets and squares occupied by the nobility and gentry, and the narrow streets and mean houses occupied by the mechanics and the trading part of the community."

The National Gallery's position marks this historic social divide.`
	},
	{
		name: 'St Martin-in-the-Fields',
		searchQuery: 'St Martin-in-the-Fields, Trafalgar Square, London',
		category: 'history',
		tags: ['church', 'historic', 'walking-tour', 'james-gibbs'],
		description: `CHURCH 1 - ST MARTIN-IN-THE-FIELDS
Location: North side of Trafalgar Square

Directly across the square is St Martin-in-the-Fields, occupying an extraordinarily commanding position. This is the church that truly inspired this series, even though it lies some distance from the City of London proper.

The church claims to sit at the very heart of the nation — certainly the heart of the capital. It was the site of the world's first lending library and the world's first religious broadcast.

We don't know the precise date of its foundation, but there is a reference from 1222 to a dispute over ownership between the Abbot of Westminster and the Bishop of London. The Archbishop of Canterbury eventually ruled in Westminster's favour, and the church was subsequently used by the monks of Westminster Abbey.

Henry VIII built a new church here in 1542 and extended the parish boundaries, apparently so that plague victims would not be carried through his grounds — remembering how close this is to Westminster, where Henry had one of his many palaces.

The parish was extended again in 1607.

The present church was designed by James Gibbs and completed in 1726.

Architecturally, this church marks an important shift. Until this point, church towers typically extended down to ground level — as with all of Christopher Wren's churches. By the early 18th century, fashion favoured grand classical porticos. Here, Gibbs placed the tower behind the portico, creating the illusion that it floats above the nave.

In Lost Treasures of London (1947), William Kent recalls taking shelter in the crypt here during the Second World War. The crypt served as a popular air-raid shelter, accommodating over 100 people. People would save their spots by leaving luggage during the day. It was relatively draft-free and had enough light to read by — all important considerations.

The downside, of course, was that you were sheltering among tombstones. During the war, the church became known as "St Martin-in-the-Tombstones."

There's a sad story of a woman standing at the bus stop outside during an air raid. She was urged to come inside for shelter but declined, anxious to get home. Shortly afterwards, a bomb landed outside the church and she was killed.

In more recent times, St Martin-in-the-Fields has become especially associated with work supporting the homeless — feeding, sheltering, and advocacy. The café in the crypt has long been a favourite stop for people working in the West End.

It remains one of London's most majestic and important churches, and the perfect place to begin today's walk.`
	},
	{
		name: 'Charing Cross',
		searchQuery: 'Charing Cross, London',
		category: 'history',
		tags: ['landmark', 'historic', 'walking-tour'],
		description: `WALK TO CHURCH 2

From Trafalgar Square, we head east.

We pass Charing Cross, marked by the Eleanor Cross, which for many years served as the official centre point of London, from which distances were measured.

We continue a short distance along The Strand.`
	},
	{
		name: 'Eleanor Cross',
		searchQuery: 'Eleanor Cross, Charing Cross, London',
		category: 'history',
		tags: ['monument', 'historic', 'medieval'],
		description: `The Eleanor Cross at Charing Cross marks what for many years served as the official centre point of London, from which distances were measured.

The original Eleanor Crosses were a series of twelve monuments erected by King Edward I between 1291 and 1294 in memory of his wife Eleanor of Castile. They marked the resting places of her funeral cortege on its journey from Lincoln to Westminster Abbey.

The cross at Charing Cross is actually a Victorian replica, erected in 1865, as the original medieval cross was destroyed by Parliamentarians in 1647.`
	},
	{
		name: 'The Strand',
		searchQuery: 'The Strand, London WC2',
		category: 'history',
		tags: ['road', 'historic', 'walking-tour'],
		description: `The Strand connects Trafalgar Square to the City of London, running along the former shoreline of the Thames (hence the name "strand" meaning beach or shore).

We continue a short distance along The Strand towards the Savoy Chapel.`
	},
	{
		name: 'Exchange Court',
		searchQuery: 'Exchange Court, Strand, London WC2',
		category: 'history',
		tags: ['alley', 'walking-tour', 'hidden-london'],
		description: `Access route to the Savoy Chapel:

Strand → Exchange Court (WC2) → Heathcock Court → Carting Lane → Savoy Hill

Exchange Court is one of the narrow passages leading from The Strand towards the hidden Savoy Chapel.`
	},
	{
		name: 'Savoy Hill',
		searchQuery: 'Savoy Hill, London WC2',
		category: 'history',
		tags: ['road', 'historic', 'walking-tour'],
		description: `Savoy Hill leads down towards the Thames and the Savoy Chapel. Near here is the Savoy Theatre stage door and the Savoy Steps.

The area takes its name from the medieval Savoy Palace, which stood here until it was sacked and burned during the Peasants' Revolt of 1381.`
	},
	{
		name: 'Savoy Theatre',
		searchQuery: 'Savoy Theatre, London',
		category: 'architecture',
		tags: ['theatre', 'landmark', 'victorian'],
		description: `The Savoy Theatre, near the stage door of which we pass on the way to the Savoy Chapel. The theatre opened in 1881 and was the first public building in the world to be lit entirely by electricity.

It was built by Richard D'Oyly Carte specifically to present the comic operas of Gilbert and Sullivan.`
	},
	{
		name: 'Savoy Steps',
		searchQuery: 'Savoy Steps, London WC2',
		category: 'history',
		tags: ['landmark', 'walking-tour', 'thames'],
		description: `The Savoy Steps lead down from Savoy Hill towards the Thames Embankment. The Savoy Chapel is tucked away nearby.

After visiting the Savoy Chapel, we descend the Savoy Steps and return to The Strand.`
	},
	{
		name: 'The Savoy Chapel',
		searchQuery: 'Savoy Chapel, Savoy Hill, London',
		category: 'history',
		tags: ['church', 'historic', 'walking-tour', 'medieval', 'royal'],
		description: `CHURCH 2 - THE SAVOY CHAPEL (KING'S CHAPEL OF THE SAVOY)

Access Route: Strand → Exchange Court (WC2) → Heathcock Court → Carting Lane → Savoy Hill → Near Savoy Theatre stage door → Near Savoy Steps

Tucked away in a quiet backstreet off Savoy Hill, close to the Savoy Steps, is one of London's great hidden gems: The Savoy Chapel, officially known as the King's Chapel of the Savoy.

This chapel is the last surviving remnant of a medieval charitable hospital founded by Henry VII in 1512. The hospital provided lodging for up to 100 men per night. Historical engravings show it once had extensive grounds, though only the chapel remains today.

The hospital was built on the site of John of Gaunt's Savoy Palace. John of Gaunt, son of Edward III, had his palace here until it was sacked and burned during the Peasants' Revolt of 1381.

The hospital was dissolved in 1702.

The chapel was repaired and improved at the expense of King George IV between 1826 and 1830.

Today, it serves as the chapel of the Royal Victorian Order, established in 1896, an honour conferred personally by the sovereign. It's said that Queen Elizabeth II used to attend services here in secret.

It's one of those extraordinary fragments of medieval London that's incredibly easy to miss.`
	},
	{
		name: 'St Clement Danes',
		searchQuery: 'St Clement Danes, Strand, London',
		category: 'history',
		tags: ['church', 'historic', 'wren'],
		description: `WALK TO CHURCH 3

We descend the Savoy Steps and return to The Strand.

Ahead are two churches — St Clement Danes and St Mary-le-Strand — both covered in other walks, but well worth including if you're doing this route yourself.

St Clement Danes is the central church of the Royal Air Force. The original church was built by Danes in the 9th century, and the current building was designed by Christopher Wren in 1682.`
	},
	{
		name: 'St Mary-le-Strand',
		searchQuery: 'St Mary le Strand, London',
		category: 'history',
		tags: ['church', 'historic', 'baroque'],
		description: `St Mary-le-Strand stands on an island in the middle of The Strand. It was the first public building designed by James Gibbs (who would later design St Martin-in-the-Fields) and was completed in 1717.

Both St Clement Danes and St Mary-le-Strand are covered in other walks, but well worth including if you're doing this route yourself.`
	},
	{
		name: 'Aldwych',
		searchQuery: 'Aldwych, London WC2',
		category: 'history',
		tags: ['road', 'walking-tour'],
		description: `We continue around Aldwych on our route to St George's Bloomsbury.

The name Aldwych comes from the Old English "ealdwic" meaning "old settlement" — this area was once a Danish trading settlement outside the walls of the City of London.`
	},
	{
		name: 'Kingsway',
		searchQuery: 'Kingsway, London WC2',
		category: 'history',
		tags: ['road', 'walking-tour', 'edwardian'],
		description: `We continue up Kingsway on our route to St George's Bloomsbury.

Kingsway was created in the early 20th century as part of a major slum clearance scheme, cutting through the notorious rookeries of Clare Market and the surrounding area. It was named after King Edward VII and opened in 1905.`
	},
	{
		name: 'High Holborn',
		searchQuery: 'High Holborn, London WC1',
		category: 'history',
		tags: ['road', 'walking-tour', 'historic'],
		description: `We turn left into High Holborn on our route to St George's Bloomsbury.

High Holborn is one of London's ancient thoroughfares, part of the Roman road from London to the west. The name "Holborn" derives from the Holbourne, a tributary of the River Fleet that once flowed through this area.`
	},
	{
		name: 'Princess Louise Pub',
		searchQuery: 'Princess Louise Pub, High Holborn, London',
		category: 'pub',
		tags: ['pub', 'victorian', 'historic', 'walking-tour'],
		description: `We pass the Princess Louise Pub on High Holborn.

The Princess Louise is a magnificent Victorian gin palace, largely unchanged since its creation in 1891. It features stunning etched glass, ornate tilework, and original wooden snob screens that divided the bar into private drinking areas. It's named after Princess Louise, Duchess of Argyll, the sixth child of Queen Victoria.

The pub is Grade II listed and is considered one of the finest examples of a Victorian pub interior in London.`
	},
	{
		name: 'Swedenborg House',
		searchQuery: 'Swedenborg House, Bloomsbury Way, London',
		category: 'architecture',
		tags: ['landmark', 'historic', 'walking-tour'],
		description: `We pass up the side of Swedenborg House on our way to St George's Bloomsbury.

Swedenborg House is the headquarters of the Swedenborg Society, dedicated to the works of Emanuel Swedenborg (1688-1772), the Swedish scientist, philosopher and theologian. The building dates from 1926 and houses a library, bookshop and small museum.`
	},
	{
		name: "St George's Bloomsbury",
		searchQuery: "St George's Bloomsbury, Bloomsbury Way, London",
		category: 'history',
		tags: ['church', 'historic', 'walking-tour', 'hawksmoor', 'baroque'],
		description: `CHURCH 3 - ST GEORGE'S BLOOMSBURY
Location: Bloomsbury
Nearby Streets: High Holborn, Museum Street, Little Russell Street

Here we arrive at St George's Bloomsbury, designed by the enigmatic Nicholas Hawksmoor.

James Gibbs submitted designs for this church but was unsuccessful. Hawksmoor's design was chosen, making this the sixth and final of his London churches.

Unlike St Martin-in-the-Fields, the tower here is placed to one side, not behind the portico.

The church was funded by the 1711 Act of Parliament commissioning 50 new churches. A curious feature is its north–south alignment, despite the act requiring east–west orientation. The site was hemmed in by surrounding buildings, yet permission was somehow granted.

Atop the steeple, Hawksmoor placed a statue featuring King George I, combined with classical symbolism. This attracted ridicule at the time.

The style is described by the church as English Baroque, while Peter Ackroyd characterises Hawksmoor's work as English Gothic, a style uniquely his own.

The church now houses the Museum of Comedy.

Hawksmoor designed this as an auditory church, ensuring that the liturgy of the Book of Common Prayer could be clearly heard throughout.

The church fell into disrepair but was later restored in a £9 million restoration.

Behind the church are unexplained stone fragments embedded in the churchyard.

Opposite stands a building constructed in 1879 for the children of the schools of the united parishes of St Giles-in-the-Fields and St George Bloomsbury — reflecting the social and class tensions between wealthy Bloomsbury and the notorious St Giles rookery.`
	},
	{
		name: 'Museum Street',
		searchQuery: 'Museum Street, Bloomsbury, London',
		category: 'history',
		tags: ['road', 'walking-tour', 'bloomsbury'],
		description: `Museum Street runs near St George's Bloomsbury, connecting Bloomsbury Way to the British Museum. The street is lined with antiquarian bookshops and print dealers.`
	},
	{
		name: 'Little Russell Street',
		searchQuery: 'Little Russell Street, London WC1',
		category: 'history',
		tags: ['road', 'walking-tour', 'bloomsbury'],
		description: `Little Russell Street runs near St George's Bloomsbury in the Bloomsbury area.`
	},
	{
		name: 'London Review Bookshop',
		searchQuery: 'London Review Bookshop, Bury Place, London',
		category: 'architecture',
		tags: ['landmark', 'bookshop', 'walking-tour'],
		description: `WALK TO CHURCHES 4 & 5

We continue east, past the London Review Bookshop.

The London Review Bookshop is the bookshop of the London Review of Books, located on Bury Place near the British Museum. It's known for its carefully curated selection and regular author events.`
	},
	{
		name: 'Bertrand Russell blue plaque',
		searchQuery: 'Bury Place, Bloomsbury, London WC1',
		category: 'history',
		tags: ['blue-plaque', 'walking-tour', 'historic'],
		description: `We pass the Bertrand Russell blue plaque on our route.

Bertrand Russell (1872-1970) was a British philosopher, logician, and social critic. He lived at various addresses in Bloomsbury and was associated with the Bloomsbury Group.`
	},
	{
		name: 'Theobalds Road',
		searchQuery: 'Theobalds Road, London WC1',
		category: 'history',
		tags: ['road', 'walking-tour'],
		description: `We continue along Theobalds Road into Clerkenwell.

Theobalds Road takes its name from the route to Theobalds House in Hertfordshire, a royal palace favoured by James I. The road was the main route from London to this palace.`
	},
	{
		name: 'The Enterprise Pub',
		searchQuery: 'The Enterprise, Red Lion Street, Holborn, London',
		category: 'pub',
		tags: ['pub', 'walking-tour'],
		description: `We pass The Enterprise Pub on Red Lion Street during our walk to St Alban the Martyr.`
	},
	{
		name: 'Fryers Delight',
		searchQuery: 'Fryers Delight, Theobalds Road, London',
		category: 'food',
		tags: ['food', 'fish-and-chips', 'walking-tour', 'traditional'],
		description: `We pass Fryers Delight on Theobalds Road.

Fryers Delight is a traditional fish and chip shop that has been serving customers since 1962. It's known for its authentic British fish and chips, cooked in beef dripping in the traditional manner.`
	},
	{
		name: 'Goswell Road',
		searchQuery: 'Goswell Road, Clerkenwell, London',
		category: 'history',
		tags: ['road', 'walking-tour', 'clerkenwell'],
		description: `We continue down Goswell Road on our route to St Alban the Martyr.

Goswell Road runs through Clerkenwell and Islington. The name may derive from "God's Well," referring to a well that once existed in the area.`
	},
	{
		name: "Baldwin's Gardens",
		searchQuery: "Baldwin's Gardens, Clerkenwell, London EC1",
		category: 'history',
		tags: ['road', 'walking-tour', 'clerkenwell'],
		description: `We arrive at Baldwin's Gardens, the location of St Alban the Martyr.

Baldwin's Gardens is a small street in Clerkenwell, named after Richard Baldwin, a 17th-century builder who developed the area.`
	},
	{
		name: 'St Alban the Martyr',
		searchQuery: "St Alban the Martyr, Baldwin's Gardens, London",
		category: 'history',
		tags: ['church', 'historic', 'walking-tour', 'victorian', 'anglo-catholic'],
		description: `CHURCH 4 - ST ALBAN THE MARTYR, CLERKENWELL
Location: Baldwin's Gardens

This is a relatively modern but deeply special church.

Designed by William Butterfield and built in 1863, it was badly damaged by firebombing in 1941, then rebuilt by Adrian Gilbert Scott.

It features a stunning Holy Trinity mural by Hans Feibusch, a German Jewish artist who fled Nazi Germany in 1933. He worshipped at this church and produced work for 28 churches in total, as well as sculptures at Ely Cathedral.

The church has a strong Anglo-Catholic tradition. In 1862, its first curate, Alexander Mackonochie, introduced daily Eucharist, Gregorian chant, and extensive social outreach — soup kitchens, workers' clubs, and mothers' meetings. He became known as "the martyr of St Alban's."

The churchyard is a small oasis of calm.`
	},
	{
		name: 'Leather Lane',
		searchQuery: 'Leather Lane, London EC1',
		category: 'history',
		tags: ['road', 'walking-tour', 'market'],
		description: `WALK TO FINAL CHURCH

We continue down Leather Lane.

Leather Lane is famous for its street market, which has operated here since the 17th century. Despite the name, the market has never specialized in leather goods — the name may derive from "le vrunelane" (the lane of the wrestlers) or from a corruption of "Leveron Lane."

The market sells a variety of goods including street food, clothing, and household items, and is particularly busy at lunchtime on weekdays.`
	},
	{
		name: 'Greville Street',
		searchQuery: 'Greville Street, Hatton Garden, London',
		category: 'history',
		tags: ['road', 'walking-tour', 'hatton-garden'],
		description: `We turn left into Greville Street on our route to St Etheldreda's Chapel.

Greville Street connects Leather Lane to Hatton Garden and is named after Sir Fulke Greville, 1st Baron Brooke, a poet and courtier in the courts of Elizabeth I and James I.`
	},
	{
		name: 'Hatton Garden',
		searchQuery: 'Hatton Garden, London EC1',
		category: 'history',
		tags: ['road', 'walking-tour', 'jewellery-quarter', 'historic'],
		description: `We turn right into Hatton Garden on our route to St Etheldreda's Chapel.

Hatton Garden has been the centre of London's jewellery trade since medieval times. The street is named after Sir Christopher Hatton, a favourite of Elizabeth I, who acquired the land from the Bishops of Ely.

The area contains hundreds of jewellery shops and workshops, as well as the London Diamond Bourse.`
	},
	{
		name: 'Mitre Court',
		searchQuery: 'Mitre Court, Hatton Garden, London EC1',
		category: 'history',
		tags: ['alley', 'walking-tour', 'hidden-london'],
		description: `We pass through Mitre Court on our way to St Etheldreda's Chapel.

Mitre Court leads to Ye Olde Mitre pub and takes its name from the bishop's mitre — a reference to the Bishops of Ely who once held this land.`
	},
	{
		name: 'Ye Olde Mitre Pub',
		searchQuery: 'Ye Olde Mitre, Ely Court, London EC1',
		category: 'pub',
		tags: ['pub', 'historic', 'walking-tour', 'tudor'],
		description: `We pass Ye Olde Mitre Pub, established in 1546.

Ye Olde Mitre is one of London's most historic and hidden pubs. The original pub was built in 1546 for the servants of the Bishops of Ely, whose London palace stood nearby. The current building dates from 1772.

The pub is famously difficult to find, tucked away in a narrow alley between Hatton Garden and Ely Place. A preserved cherry tree trunk in the corner is said to mark the boundary of the Bishop of Ely's land, around which Elizabeth I is reputed to have danced.

Because the pub stood on the Bishop of Ely's land, it technically lay within the boundaries of Cambridgeshire rather than London until 1965, which helped it avoid some of London's licensing laws.`
	},
	{
		name: 'Ely Place',
		searchQuery: 'Ely Place, London EC1',
		category: 'history',
		tags: ['road', 'walking-tour', 'historic', 'liberty'],
		description: `We arrive at Ely Place, the location of St Etheldreda's Chapel.

Ely Place is a private road that was once the site of the London palace of the Bishops of Ely. It remained a "liberty" — outside both royal and City jurisdiction — until the 19th century.

The gatehouse at the entrance still bears the mitre of the Bishops of Ely, and until recently the road was guarded by beadles and closed by gates at night.

Shakespeare mentions the area in Richard III, when the Duke of Gloucester asks the Bishop of Ely for strawberries from his garden — the gardens of Ely Place were famous for their produce.`
	},
	{
		name: "St Etheldreda's Chapel",
		searchQuery: "St Etheldreda's Church, Ely Place, London",
		category: 'history',
		tags: ['church', 'historic', 'walking-tour', 'medieval', 'catholic', 'gothic'],
		description: `CHURCH 5 - ST ETHELDREDA'S CHAPEL
Location: Ely Place, off Hatton Garden

Built between 1250 and 1290, St Etheldreda's Chapel is one of the most ancient and storied churches in London.

Dedicated to St Etheldreda, an Anglo-Saxon princess born in 630, who founded Ely Cathedral and freed the bondsmen on her lands.

The chapel was built by the Bishops of Ely as part of their London palace, situated in a liberty — outside both royal and City jurisdiction.

This is one of only two surviving buildings in London from the reign of Edward I (the other being the Chapel of St John in the Tower of London), and one of the oldest Catholic churches in England.

The chapel survived the Great Fire of London in 1666 and the Blitz in World War II, though it has been damaged and restored several times over the centuries.

The building represents one of the finest examples of Decorated Gothic architecture in London. The east and west windows contain some of the largest areas of medieval-style stained glass in London, though much was destroyed in World War II and later restored.

The crypt beneath the chapel dates from around 1251 and is one of the oldest surviving Catholic places of worship in England.

St Etheldreda's returned to Catholic worship in 1874, having been used by various Protestant denominations following the Reformation. It was the first pre-Reformation church to return to Catholic hands since the 16th century.`
	}
];

async function seed() {
	console.log('Starting full tour seed process...\n');
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

		// Determine priority: churches are 'site', everything else is 'route'
		const isChurch = stop.name.includes('Church') ||
			stop.name.includes('Chapel') ||
			stop.name.startsWith('St ') ||
			stop.name.startsWith("St ");
		const priority = isChurch ? 'site' : 'route';

		// Insert place
		const { data: place, error } = await supabase
			.from('places')
			.insert({
				name: stop.name,
				description: stop.description,
				latitude: geo.latitude,
				longitude: geo.longitude,
				category: stop.category,
				priority: priority,
				route: 'Holborn Churches Route',
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
		.from('tours')
		.insert({
			name: TOUR_NAME,
			description: TOUR_DESCRIPTION,
			duration_minutes: TOUR_DURATION
		})
		.select()
		.single();

	if (tourError) {
		console.error(`✗ Failed to create tour: ${tourError.message}`);
		return;
	}

	console.log(`✓ Created tour: ${tour.id}\n`);

	// Step 3: Create tour stops
	console.log('Creating tour stops...');

	for (let i = 0; i < placeIds.length; i++) {
		const { error: stopError } = await supabase
			.from('tour_stops')
			.insert({
				tour_id: tour.id,
				place_id: placeIds[i],
				stop_order: i + 1,
				notes: `Stop ${i + 1}`
			});

		if (stopError) {
			console.error(`  ✗ Failed to create stop ${i + 1}: ${stopError.message}`);
		} else {
			console.log(`  ✓ Created stop ${i + 1}`);
		}
	}

	console.log('\n========================================');
	console.log('✓ Seed complete!');
	console.log(`  - ${placeIds.length} places created`);
	console.log(`  - 1 tour created`);
	console.log(`  - ${placeIds.length} tour stops created`);

	if (failedGeocodes.length > 0) {
		console.log(`\n⚠ Failed to geocode ${failedGeocodes.length} locations:`);
		failedGeocodes.forEach(name => console.log(`  - ${name}`));
	}
	console.log('========================================');
}

seed().catch(console.error);
