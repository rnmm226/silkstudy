import type { Metadata } from 'next';
import SearchClient from './search-client';

export const metadata: Metadata = { title: 'Search Opportunities' };

export default function SearchPage() {
  return <SearchClient />;
}
