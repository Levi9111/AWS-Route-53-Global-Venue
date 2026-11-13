import VenueDetailPage from './VenueDetailClient';

export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function Page() {
  return <VenueDetailPage />;
}
