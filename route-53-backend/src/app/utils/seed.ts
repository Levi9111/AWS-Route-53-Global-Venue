import bcrypt from 'bcrypt';
import config from '../config';
import logger from './logger';
import { UserModel } from '../modules/Auth/auth.model';
import { VenueModel } from '../modules/Venue/venue.model';
import { BookingModel } from '../modules/Booking/booking.model';
import { ReviewModel } from '../modules/Review/review.model';

export async function seedDatabaseIfNeeded(): Promise<void> {
  try {
    const existingVenues = await VenueModel.countDocuments();
    if (existingVenues > 0) {
      return;
    }

    logger.info(
      'Database is empty — seeding initial Global VenueFinder catalog...',
    );

    const passwordHash = await bcrypt.hash(
      'Password123!',
      config.bcrypt_salt_rounds || 12,
    );

    let host = await UserModel.findOne({ email: 'host@venuefinder.global' });
    if (!host) {
      host = await UserModel.create({
        name: 'Elena Vance (Global Host)',
        email: 'host@venuefinder.global',
        passwordHash,
        role: 'host',
      });
    }

    let renter = await UserModel.findOne({
      email: 'renter@venuefinder.global',
    });
    if (!renter) {
      renter = await UserModel.create({
        name: 'Marcus Sterling',
        email: 'renter@venuefinder.global',
        passwordHash,
        role: 'renter',
      });
    }

    const venues = await VenueModel.insertMany([
      {
        hostId: host._id,
        title: 'The Glasshouse Loft — SoHo Skyline Terrace',
        description:
          'Architectural penthouse loft in SoHo featuring 18-foot floor-to-ceiling windows, wrap-around heated terrace, studio lighting rig, and modular conference/gala seating. Ideal for product launches, executive offsites, and private receptions.',
        address: '452 Broadway, Penthouse B',
        city: 'New York',
        country: 'United States',
        lat: 40.7209,
        lng: -74.0007,
        capacity: 150,
        pricePerHour: 45000, // $450.00 / hr
        amenities: [
          'WiFi',
          'Projector',
          'Sound System',
          'Rooftop Access',
          'Catering Kitchen',
          'Lighting Rig',
        ],
        photos: [
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
        ],
        instantBook: true,
      },
      {
        hostId: host._id,
        title: 'Shoreditch Foundry Vault & Atrium',
        description:
          'Restored Victorian brick warehouse in East London with acoustic timber baffling, 4K laser projection wall, espresso bar, and breakout pods. Built for tech summits, workshops, and creative showcases.',
        address: '88 Redchurch Street, Shoreditch',
        city: 'London',
        country: 'United Kingdom',
        lat: 51.5245,
        lng: -0.0745,
        capacity: 220,
        pricePerHour: 38000, // $380.00 / hr
        amenities: [
          'WiFi',
          'Projector',
          'Sound System',
          'Stage',
          'Catering Kitchen',
          'Whiteboards',
        ],
        photos: [
          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
        ],
        instantBook: true,
      },
      {
        hostId: host._id,
        title: 'Grand Canal Dock Innovation Pavilion',
        description:
          'Waterfront glass pavilion in Dublin Docklands with panoramic views, Dolby conference audio, Simultaneous Interpretation booths, and private boardwalk access.',
        address: '14 Hanover Quay, Grand Canal Dock',
        city: 'Dublin',
        country: 'Ireland',
        lat: 53.3441,
        lng: -6.2375,
        capacity: 120,
        pricePerHour: 29000, // $290.00 / hr
        amenities: [
          'WiFi',
          'Projector',
          'Sound System',
          'Video Conferencing',
          'Catering Kitchen',
        ],
        photos: [
          'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=1200&q=80',
        ],
        instantBook: true,
      },
      {
        hostId: host._id,
        title: 'Mission District Botanical Conservatory & Studio',
        description:
          'Sun-drenched industrial conservatory filled with mature olive trees, skylights, and custom redwood tables. A favorite for design sprints, intimate dinners, and Fireside chats.',
        address: '2140 Harrison Street',
        city: 'San Francisco',
        country: 'United States',
        lat: 37.7631,
        lng: -122.4128,
        capacity: 80,
        pricePerHour: 32000, // $320.00 / hr
        amenities: [
          'WiFi',
          'Sound System',
          'Catering Kitchen',
          'Natural Light',
          'Whiteboards',
        ],
        photos: [
          'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
        ],
        instantBook: true,
      },
      {
        hostId: host._id,
        title: 'Kreuzberg Spree Riverfront Gallery',
        description:
          'Minimalist brutalist gallery overlooking the Spree river with gallery-grade track lighting, DJ/PA booth, and outdoor courtyard.',
        address: 'Köpenicker Str. 126',
        city: 'Berlin',
        country: 'Germany',
        lat: 52.5065,
        lng: 13.4285,
        capacity: 180,
        pricePerHour: 26000, // $260.00 / hr
        amenities: [
          'WiFi',
          'Sound System',
          'Stage',
          'Lighting Rig',
          'Bar Area',
        ],
        photos: [
          'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80',
        ],
        instantBook: false,
      },
      {
        hostId: host._id,
        title: 'Shibuya Sky Horizon Executive Amphitheater',
        description:
          'High-altitude auditorium and lounge in central Shibuya with 270-degree Tokyo views, dual LED walls, and private VIP green room.',
        address: '2-24-12 Shibuya, Shibuya-ku',
        city: 'Tokyo',
        country: 'Japan',
        lat: 35.658,
        lng: 139.7016,
        capacity: 300,
        pricePerHour: 55000, // $550.00 / hr
        amenities: [
          'WiFi',
          'Projector',
          'Sound System',
          'Stage',
          'Video Conferencing',
          'VIP Lounge',
        ],
        photos: [
          'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=80',
        ],
        instantBook: true,
      },
    ]);

    // Create a completed historical booking & review on the first venue
    const pastStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const pastEnd = new Date(pastStart.getTime() + 4 * 60 * 60 * 1000);

    const completedBooking = await BookingModel.create({
      venueId: venues[0]._id,
      renterId: renter._id,
      startTime: pastStart,
      endTime: pastEnd,
      status: 'completed',
      totalPrice: venues[0].pricePerHour * 4,
    });

    await ReviewModel.create({
      bookingId: completedBooking._id,
      authorId: renter._id,
      venueId: venues[0]._id,
      rating: 5,
      comment:
        'Flawless experience hosting our global engineering summit here. The AV setup, acoustics, and skyline terrace exceeded every expectation.',
    });

    logger.info('Seeded initial Global VenueFinder catalog successfully.');
  } catch (err) {
    logger.warn('Seed check encountered a non-fatal issue', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
