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

const TOUR_NAME = 'Mayfair Rainy Stroll';
const TOUR_ROUTE = 'Mayfair Rainy Stroll';
const TOUR_DESCRIPTION = `An unplanned, spontaneous walk through Mayfair on a rainy January day, exploring the winding streets, historic pubs, famous shops, and culminating at the glorious Burlington Arcade - one of the most magical covered spaces in London.`;
const TOUR_DURATION = 60;

const stops: TourStop[] = [
	{
		name: 'Regent Street',
		searchQuery: 'Regent Street, London W1',
		category: 'history',
		priority: 'route',
		tourStop: 1,
		tags: ['road', 'walking-tour', 'mayfair', 'shopping'],
		description: `STARTING POINT - REGENT STREET

Just after the Christmas lights have been switched off - look they're still up there but they won't be on today. Let's make you feel a little bit sad.

So the weather is rather against us today doing a proper walk I'm afraid. It's been raining all day, in fact this is the lightest the rain has been.

So I thought let's just walk down Regent Street and I'm going to show you one of the most magical little places in London and luckily it's covered. I hope it's open.

Yeah I love this place, it's very special.`
	},
	{
		name: 'Hanover Street',
		searchQuery: 'Hanover Street, Mayfair, London W1',
		category: 'history',
		priority: 'route',
		tourStop: 1,
		tags: ['road', 'walking-tour', 'mayfair'],
		description: `Hanover Street is interesting - maybe we should just have a little detour. If you have a little detour... no, stick to Regent Street.`
	},
	{
		name: "Liberty's Department Store",
		searchQuery: 'Liberty London, Great Marlborough Street',
		category: 'architecture',
		priority: 'site',
		tourStop: 1,
		tags: ['landmark', 'shopping', 'tudor', 'walking-tour'],
		description: `Liberty's department store over there - that will be in the second part of the Soho video.

Liberty is one of London's most distinctive department stores, famous for its mock-Tudor building constructed in the 1920s using timbers from two ships, HMS Impregnable and HMS Hindustan.`
	},
	{
		name: 'Maddox Street',
		searchQuery: 'Maddox Street, London W1S',
		category: 'history',
		priority: 'route',
		tourStop: 2,
		tags: ['road', 'walking-tour', 'mayfair'],
		description: `Street actually I am going to go down Maddox Street because I'm trying to find that church down there. I'm not entirely sure what it is.

The thing is you just got to embrace circumstance sometimes. This isn't what I actually planned to do today but I'm doing it anyway.`
	},
	{
		name: 'Pine Street',
		searchQuery: 'Pine Street, London W1S',
		category: 'history',
		priority: 'route',
		tourStop: 2,
		tags: ['road', 'walking-tour', 'mayfair', 'hidden-london'],
		description: `And look - Pine Street! That would not have been on my notes.

I love these little winding streets you get around here. I mean maybe we'll just do a bit of a Mayfair stroll.

This is the reality of London right - we do live on a very wet island between the North Sea and the Atlantic Ocean. You know, it rains a lot.

Lovely little bit of mosaic work here. Isn't it delightful?`
	},
	{
		name: 'Mason\'s Arms Pub',
		searchQuery: '38 Maddox Street, London W1S 2PE',
		category: 'pub',
		priority: 'site',
		tourStop: 2,
		tags: ['pub', 'walking-tour', 'mayfair', 'after-work'],
		description: `So we've got the Mason's Arms pub and the back of this building here, back at this church.

I'm not just saying this but I did wonder if it was St George's Church partly because it's the only church I associate with Mayfair.

And that is the Mason's Arms Pub over there. Look forward to hearing the comments - what you think about that. Has got to be people that work around here used to drink in there after work.

It's got that kind of vibe doesn't it - it's an after work pub.`
	},
	{
		name: 'Mill Street',
		searchQuery: 'Mill Street, London W1S',
		category: 'history',
		priority: 'route',
		tourStop: 3,
		tags: ['road', 'walking-tour', 'mayfair', 'tyburn'],
		description: `This here is Mill Street and of course the topography of Mayfair is partly defined by the fact the Tyburn runs through it.

So it's kind of, you know, it's a river valley. It's got hills, it's got a great topography. You can see it rising on the other side there, can't you?

I don't know if it'll come off my action camera but you can really see the way the road drops down there which I guess that must be the Tyburn running through there.

I'll link below to a video I made of a walk along the Tyburn but yeah, it's a pronounced dip and then it rises again.`
	},
	{
		name: 'The Windmill Pub',
		searchQuery: '4 Mill Street, London W1S 2AZ',
		category: 'pub',
		priority: 'site',
		tourStop: 3,
		tags: ['pub', 'walking-tour', 'mayfair'],
		description: `And just down the hill from St George's in Mill Street here we have the Windmill Pub which is very sort of bright and open pub isn't it.

And it also obviously tells us where the name - where the mill comes from. I thought it might be associated with the Tyburn but seems to do it - so she comes from the windmill here.

I'll mention here that I do put videos on TikTok and what works on TikTok is not cut downs of my YouTube videos but me stood outside pubs taking a single shot of the pub going "here's the Mason's Arms in Maddox Street, any of you drink in there, what's that like?"

That's what works for me on TikTok so if you like pub content, pub talk, I'm a sort of burgeoning or a wannabe pub talker.`
	},
	{
		name: 'St George\'s Church Hanover Square',
		searchQuery: '2A Mill Street, London W1S 1FX',
		category: 'history',
		priority: 'site',
		tourStop: 3,
		tags: ['church', 'walking-tour', 'mayfair', '18th-century', 'concerts'],
		description: `St George's Church, I think they're on Hanover Square, has a lot of concerts I think here.

St George's is resting on scaffolding obviously having some works on it but that's a fine - I'm going to stick my neck out and say Portland Stone church.

And it's really interesting to note the obelisks on either end of the entrance here which I guess - I don't know if they were built - I think this church is 18th century so when the obelisks were added later as in the Victorian obsession with Egypt, ancient Egypt, Egyptomania as it was known.`
	},
	{
		name: 'St George Street',
		searchQuery: 'St George Street, Mayfair, London W1',
		category: 'history',
		priority: 'route',
		tourStop: 4,
		tags: ['road', 'walking-tour', 'mayfair'],
		description: `St George Street - location of the Aquarium Maps art gallery and various interesting shops.`
	},
	{
		name: 'Aquarium Maps & Art Gallery',
		searchQuery: '17 St George Street, London W1S 1FJ',
		category: 'architecture',
		priority: 'site',
		tourStop: 4,
		tags: ['landmark', 'gallery', 'maps', 'walking-tour', 'mayfair'],
		description: `This is almost my dream shop here in St George Street - an aquarium maps art gallery. Look at these!

I mean that is really beautiful isn't it. Made in Amsterdam - that's only 6,500 pounds. Not a bargain.

Yeah this is... that doesn't look like a particularly old map of London. It doesn't also look like it's for sale isn't it. Another London map.`
	},
	{
		name: 'A Bathing Ape Store',
		searchQuery: '24-25 Conduit Street, London W1S 2XU',
		category: 'architecture',
		priority: 'route',
		tourStop: 4,
		tags: ['shopping', 'walking-tour', 'mayfair'],
		description: `This is a trendy brand isn't it - A Bathing Ape. I mean some interesting looking window displays.

I'm probably not going to go for a silver onesie where you zip everything up. Probably not. I'm not sure that's me.`
	},
	{
		name: "Sotheby's Auction House",
		searchQuery: '34-35 New Bond Street, London W1A 2AA',
		category: 'architecture',
		priority: 'site',
		tourStop: 5,
		tags: ['landmark', 'auction-house', 'walking-tour', 'mayfair'],
		description: `Over the road there we have Sotheby's, the famous Sotheby's auction house.

This is Bruton Street here - not a street I really think about a great deal I'll be honest with you.`
	},
	{
		name: 'Bruton Street',
		searchQuery: 'Bruton Street, London W1J',
		category: 'history',
		priority: 'route',
		tourStop: 5,
		tags: ['road', 'walking-tour', 'mayfair'],
		description: `This is Bruton Street here - not a street I really think about a great deal I'll be honest with you.

Savile Row goes off to the right but I think we should - I don't know if we should go down Savile Row because when I do eventually do a Mayfair video, Savile Row will be a big part of that so I don't want to blow it now with my action camera in the rain.`
	},
	{
		name: 'Savile Row',
		searchQuery: 'Savile Row, London W1S',
		category: 'history',
		priority: 'route',
		tourStop: 5,
		tags: ['road', 'walking-tour', 'mayfair', 'tailoring'],
		description: `Savile Row goes off to the right but I think we should - I don't know if we should go down Savile Row because when I do eventually do a Mayfair video, Savile Row will be a big part of that so I don't want to blow it now with my action camera in the rain.

Savile Row is famous worldwide as the home of bespoke tailoring, with tailors here since the late 18th century.`
	},
	{
		name: 'Trailfinders',
		searchQuery: '19 Duke Street, London W1U 1DJ',
		category: 'architecture',
		priority: 'site',
		tourStop: 6,
		tags: ['landmark', 'travel', 'walking-tour', 'personal'],
		description: `This is an incredibly significant place here - Trailfinders.

I went into - I don't think it was this branch, it was in a slightly different place, I believe it was around Piccadilly Circus - where I went in there in 1994 and bought my round the world plane ticket which was one of the most thrilling things I've ever done.

Great adventures start in this building. You can see people in there now booking their life-changing trip.

Mayfair was a great place for spies. It's where the OSS were based during the war. It's also where MI5 head offices were as well after the war and it's where some of the Cambridge spies lived. Donald McLean lived in Mayfair as well.`
	},
	{
		name: 'Hamleys',
		searchQuery: '188-196 Regent Street, London W1B 5BT',
		category: 'architecture',
		priority: 'site',
		tourStop: 6,
		tags: ['landmark', 'shopping', 'toys', 'walking-tour'],
		description: `Back onto Regent Street now and there's Hamleys on the other side - the famous Hamleys.

I still love going in there to buy the kids their Christmas presents.

Hamleys is one of the world's largest toy shops, founded in 1760.`
	},
	{
		name: 'Heddon Street',
		searchQuery: 'Heddon Street, London W1B',
		category: 'history',
		priority: 'route',
		tourStop: 7,
		tags: ['road', 'walking-tour', 'mayfair', 'bowie'],
		description: `They've got Heddon Street down here. I feel like we have to go down here.

This Crown House down here - of course Regent Street is part of the Crown Estate isn't it, whereas obviously Mayfair's the Grosvenor Estate owned by the Dukes of Grosvenor.

Which I was reading in the London Compendium - Grosvenor is from the old French "gros veneur" - Fat Hunter. Seems very apt.

Down the end of that street there there's an old red telephone box - not many of them in central London.

Heddon Street looks nice - little restaurants, cafes etc.

Starman - this must be a reference to David Bowie I would have thought.

(Heddon Street is famous as the location where the album cover for David Bowie's "The Rise and Fall of Ziggy Stardust and the Spiders from Mars" was photographed.)`
	},
	{
		name: 'Swallow Street',
		searchQuery: 'Swallow Street, London W1B',
		category: 'history',
		priority: 'route',
		tourStop: 8,
		tags: ['road', 'walking-tour', 'piccadilly'],
		description: `Swallow Street is too good to resist actually - a little peak. And I am very much drawn down here although the outdoor sitting at Gaucho dominates it.

See the church spire at the end which must be on Piccadilly I would have thought.

It's a shame we can't see these buildings better because of this weather - they've got really beautiful facades. It's interesting architecture in Swallow Street.`
	},
	{
		name: 'Gaucho Restaurant',
		searchQuery: '25 Swallow Street, London W1B 4QR',
		category: 'food',
		priority: 'route',
		tourStop: 8,
		tags: ['food', 'restaurant', 'walking-tour'],
		description: `The outdoor sitting at Gaucho dominates Swallow Street.`
	},
	{
		name: 'Hagen Coffee',
		searchQuery: '27-29 Swallow Street, London W1B 4DH',
		category: 'food',
		priority: 'route',
		tourStop: 8,
		tags: ['food', 'coffee', 'walking-tour'],
		description: `Now this place here - Hagen - claims to be the best coffee in town.

Unfortunately for me I just had one at the station at Leytonstone from Perky Blenders - Leytonstone's own coffee roastery who make excellent coffee - so I have to test their theory another day.`
	},
	{
		name: "St James's Piccadilly",
		searchQuery: '197 Piccadilly, London W1J 9LL',
		category: 'history',
		priority: 'site',
		tourStop: 9,
		tags: ['church', 'walking-tour', 'wren', 'piccadilly'],
		description: `If you're thinking I'm skipping Piccadilly Circus I'll link you below to a walk I think it's in 2020 actually when things just started to open up in that summer break - or no actually it was October - I went around Piccadilly and caught the sunset there. It's a beautiful place at sunset.

We're not going to get a lovely sunset but we are going to get the church. This is St James's isn't it - St James's Piccadilly which is a famous church and it's open.

Piccadilly is one of London's finest thoroughfares. Such a glorious street, Piccadilly.

St James's Piccadilly - this is a church they often have memorial services for sort of famous people and there's often talks and concerts here.

I did come to a talk here many years ago, I'm just trying to remember who it was. But let's pop our heads inside.`
	},
	{
		name: 'Piccadilly',
		searchQuery: 'Piccadilly, London W1',
		category: 'history',
		priority: 'route',
		tourStop: 9,
		tags: ['road', 'walking-tour', 'mayfair'],
		description: `Piccadilly is one of London's finest thoroughfares. Such a glorious street, Piccadilly.

And there's the Waterstones over there - the huge Waterstones where I did a book signing there Christmas 2013. It was a great night.`
	},
	{
		name: 'Waterstones Piccadilly',
		searchQuery: '203-206 Piccadilly, London W1J 9HD',
		category: 'architecture',
		priority: 'site',
		tourStop: 9,
		tags: ['landmark', 'bookshop', 'walking-tour'],
		description: `And there's the Waterstones over there - the huge Waterstones where I did a book signing there Christmas 2013. It was a great night.

Waterstones Piccadilly is Europe's largest bookshop, housed in a former department store.`
	},
	{
		name: 'Jermyn Street',
		searchQuery: 'Jermyn Street, London SW1',
		category: 'history',
		priority: 'route',
		tourStop: 10,
		tags: ['road', 'walking-tour', 'mayfair', 'tailoring', 'shirts'],
		description: `So we emerge from St James's into Jermyn Street which is I think associated with its shirt makers isn't it - Jermyn Street.

Wonderful old street here. Again I will save most of this for the Mayfair film given where our walk is heading.

Jermyn Street has been the home of bespoke shirtmakers since the 17th century.`
	},
	{
		name: "Prince's Arcade",
		searchQuery: '196 Piccadilly, London W1J 9DY',
		category: 'architecture',
		priority: 'site',
		tourStop: 10,
		tags: ['arcade', 'walking-tour', 'victorian'],
		description: `This is an interesting addition actually - Prince's Arcade. I don't know this one.

This building doesn't look that old. It's still a lovely arcade because you've got a few of these around Mayfair, Piccadilly - at least it is the area of the arcade.

And of course as I spoke about in my Paris video, urban walking arcades are intrinsically linked through - well I was codified in Walter Benjamin's arcades project - where he saw that the arcades of Paris with their gas lighting had given birth to a new type of urban character: the flâneur, the person who wanders aimlessly guided by their desires.

And that was facilitated by spaces like this - these kind of very elaborate glass and mirrored and brightly lit indoor spaces within the city where you could walk and see people and draw in the sensations.`
	},
	{
		name: "Hatchard's Bookshop",
		searchQuery: '187 Piccadilly, London W1J 9LE',
		category: 'architecture',
		priority: 'site',
		tourStop: 11,
		tags: ['landmark', 'bookshop', 'walking-tour', 'historic'],
		description: `Back onto Piccadilly. The rain's not so bad now - it still is raining but it's not torrential.

And we've emerged by Hatchard's Bookshop which has been here - well, booksellers since 1797.

You know what, I'm not entirely sure I've ever been in Hatchard's. Maybe I should pop my head inside.

Delightful bookshop. But I mean, they didn't have my book in there even though it was published nine years ago. Even so.

Then I just see a couple of books there that I'm definitely thinking of picking up at some point. I've reached the point at home now where I've got an embargo on new books until I get rid of some but they're actually piled up in my study where I work at home and they're all over the house basically.`
	},
	{
		name: 'Fortnum & Mason',
		searchQuery: '181 Piccadilly, London W1A 1ER',
		category: 'architecture',
		priority: 'site',
		tourStop: 11,
		tags: ['landmark', 'shopping', 'food', 'walking-tour', 'historic'],
		description: `And here we have the famous, the iconic Fortnum and Mason.

Good place for like chutneys and jams and I guess pâté is another - pâté from there.

Oh I have actually - I think I have a Fortnum's amazing hamper one Christmas. It was very nice.

Fortnum & Mason was established in 1707 and has been a grocer to the Royal Family for centuries.`
	},
	{
		name: 'Royal Academy of Arts',
		searchQuery: 'Burlington House, Piccadilly, London W1J 0BD',
		category: 'architecture',
		priority: 'site',
		tourStop: 12,
		tags: ['landmark', 'gallery', 'walking-tour', 'art'],
		description: `There is the famous Royal Academy. What grand imposing building.

Have I been in the Royal Academy? I think I've only ever been in there once and that was for the now famous Sensation exhibition there - what became known as Brit Art.

I think I went there 1997 just after I come back from Australia. That was quite a remarkable event actually.

That is not the place I was heading for today - it's just next door.

Now I didn't think the Christmas lights were supposed to be on this time of year. Today is the 8th of January. 12th Night was the 5th so I don't know what's going on here.`
	},
	{
		name: 'Piccadilly Arcade',
		searchQuery: 'Piccadilly Arcade, Piccadilly, London W1J',
		category: 'architecture',
		priority: 'site',
		tourStop: 12,
		tags: ['arcade', 'walking-tour', 'edwardian'],
		description: `Actually before we get to our climactic destination let's have a little look through the Piccadilly Arcade.

Isn't that beautiful? Look, look at all the Christmas lights. Isn't it delightful?

We just go for a little walk through there and come back to the sides. It is so lovely.

Piccadilly Arcade is obviously very similar to Burlington Arcade - we saw before - and there are a few other smaller ones around Piccadilly.`
	},
	{
		name: 'Burlington Arcade',
		searchQuery: '51 Piccadilly, London W1J 0QJ',
		category: 'architecture',
		priority: 'site',
		tourStop: 13,
		tags: ['arcade', 'walking-tour', 'regency', 'historic', 'landmark'],
		description: `CLIMACTIC DESTINATION - BURLINGTON ARCADE

This is the climactic destination of our walk today - the glorious Burlington Arcade.

I hope I can still use my camera in there. It is patrolled by Beadles - I imagine they're not very fond of filmmakers and vloggers.

I'm not sure what the gold elephant is about and he's supporting some bubbles.

So the Burlington Arcade was built by George Cavendish, the Earl of Burlington. I love the explanation - apparently he lived in Burlington House next door (and that's now the Royal Academy) but it said that because people used to wander around in the fields here - you had, you know, Mayfair, the famous May Fair, right - it was a place for leisure and entertainment.

So he was sick of people tossing discarded oyster shells over his wall into his garden. So we built this. Not sure if that's the case.

It was built in 1818 and opened in 1819 so it's over 200 years old.

I don't know - I don't see it written - it's the oldest in Britain but surely it must be because the previous older ones are on Continental Europe, particularly in Paris, in Brussels - some beautiful arcades that we visited when we were there back in the summer of 2022.

Ages ago. And it really is kind of sets a kind of standard really for the covered arcades that were to come.

The other explanation is he wanted somewhere safe for his wife to go and shop in the dry - which is possibly a more plausible explanation so she didn't have to go too far.

It really is beautiful.

And there are lots more actually around Britain. Leeds I think has a really good selection of old arcades. There's some couple of beauties in Birmingham and also in Norwich as well. They're all over the place.

Yeah I really love Burlington Arcade and I think that concludes this wet walk, this rainy walk, unscheduled, unplanned, off the cuff, on the hoof into my action camera.

I hope you don't mind the change in service, the change in style this week. Obviously normal service will be resumed next week. We'll be back to normal - unless it actually decides to bucket down with rain again.

Thank you so much for coming on that rainy stroll around the edges of Mayfair. Hope you enjoyed it - I've really enjoyed it actually, it was brilliant.`
	},
	{
		name: 'Burlington House',
		searchQuery: 'Burlington House, Piccadilly, London W1J 0BD',
		category: 'architecture',
		priority: 'site',
		tourStop: 13,
		tags: ['landmark', 'walking-tour', 'palladian', 'historic'],
		description: `Apparently he (the Earl of Burlington) lived in Burlington House next door - and that's now the Royal Academy.

Burlington House was built in the 1660s and remodelled in the Palladian style in the 18th century. It now houses the Royal Academy of Arts and several learned societies.`
	}
];

async function seed() {
	console.log('Starting Mayfair Rainy Stroll seed process...\n');
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
				tour_stop: stop.tourStop,
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
	console.log(`  - 1 tour created`);
	console.log(`  - ${placeIds.length} tour stops created`);

	if (failedGeocodes.length > 0) {
		console.log(`\n⚠ Failed to geocode ${failedGeocodes.length} locations:`);
		failedGeocodes.forEach(name => console.log(`  - ${name}`));
	}
	console.log('========================================');
}

seed().catch(console.error);
