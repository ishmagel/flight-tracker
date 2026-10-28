import { GiBeerStein } from 'react-icons/gi';

export default function BeerIcon({ size = 36 }) {
  const color = '#F5A623';
  return (
    <GiBeerStein
      size={size}
      color={color}
      aria-label="Beer check-in"
      style={{ filter: `drop-shadow(0 0 5px ${color}77)`, flexShrink: 0 }}
    />
  );
}

