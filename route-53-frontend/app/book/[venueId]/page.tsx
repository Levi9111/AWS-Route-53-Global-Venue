import BookVenuePage from './BookVenueClient';

export function generateStaticParams() {
  return [{ venueId: '1' }];
}

export default function Page() {
  return <BookVenuePage />;
}

