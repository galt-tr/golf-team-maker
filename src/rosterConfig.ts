import { Rating } from './types';

export interface RosterConfig {
  name: string;
  rating: Rating;
}

// Default roster configuration
// Modify this file to set your default roster with their rankings
// Ratings can be: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-
export const defaultRoster: RosterConfig[] = [
  { name: 'Pops', rating: 'B-' },
  { name: 'Kevin', rating: 'A-' },
  { name: 'Dylan', rating: 'B+' },
  { name: 'Connor', rating: 'B' },
  { name: 'Allen', rating: 'C+' },
  { name: 'Eric W.', rating: 'C' },
  { name: 'Uncle Tim', rating: 'C' },
  { name: 'Tim', rating: 'B-' },
  { name: 'Jimmy', rating: 'C+' },
  { name: 'Kyle', rating: 'B' },
  { name: 'Eric R.', rating: 'C' },
  { name: 'Scott', rating: 'C-' },
  { name: 'Cory', rating: 'B+' },
  { name: 'Mom', rating: 'D+' },
  { name: 'Jared', rating: 'C' },
  { name: 'Joe R.', rating: 'C' },
  { name: 'Sean G.', rating: 'C+' },
  { name: 'Don', rating: 'A' },
  { name: 'Stephen', rating: 'B' },
  { name: 'Christian', rating: 'C' },
  { name: 'Samantha', rating: 'D' },
  { name: 'Eric', rating: 'C' },
  { name: 'Rob E.', rating: 'C' },
  { name: 'Mark G.', rating: 'B' },
  { name: 'Mark N.', rating: 'C+' },
  { name: 'Mark G Sr.', rating: 'C-' },
  { name: 'Tim H.', rating: 'C' },
  { name: 'Tony', rating: 'B-' },
  { name: 'Austin H.', rating: 'C' },
  { name: 'Sean M.', rating: 'C' },
  { name: 'TBD', rating: 'C' },
  { name: 'TBD', rating: 'C' }
];