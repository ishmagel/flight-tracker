import SplitFlapChar from './SplitFlapChar';
import { useAnimSettings } from '../context/AnimSettings';

export default function SplitFlapText({ text = '', onFlip }) {
  const { stagger } = useAnimSettings();
  const chars = text.split('');

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      {chars.map((c, i) => (
        <SplitFlapChar
          key={i}
          char={c}
          delay={i * stagger}
          onFlip={i === 0 ? onFlip : undefined}
        />
      ))}
    </span>
  );
}
