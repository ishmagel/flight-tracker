import { MdFlightTakeoff, MdFlightLand } from 'react-icons/md';

export default function PlaneIcon({ type, size = 36 }) {
  const isArr = type === 'ARR';
  const color = isArr ? '#42A5F5' : '#66BB6A';
  const Icon  = isArr ? MdFlightLand : MdFlightTakeoff;

  return (
    <Icon
      size={size}
      color={color}
      aria-label={isArr ? 'Arriving' : 'Departing'}
      style={{ filter: `drop-shadow(0 0 5px ${color}77)`, flexShrink: 0 }}
    />
  );
}
