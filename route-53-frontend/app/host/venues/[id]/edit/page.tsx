import EditVenuePage from './EditVenueClient';

export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function Page() {
  return <EditVenuePage />;
}
