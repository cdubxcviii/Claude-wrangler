import React, { useMemo } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { OTHER_COLORS, SPECIES_BY_ID, type FishShape } from '../lib/species';
import { seededRandom } from '../lib/util';

const DIMS: Record<FishShape, { L: number; h: number; tail: number; dorsal: number }> = {
  bass: { L: 270, h: 108, tail: 46, dorsal: 0.95 },
  trout: { L: 290, h: 82, tail: 44, dorsal: 0.8 },
  pike: { L: 320, h: 62, tail: 40, dorsal: 0.7 },
  catfish: { L: 290, h: 80, tail: 42, dorsal: 0.9 },
  panfish: { L: 210, h: 132, tail: 40, dorsal: 0.85 },
  carp: { L: 270, h: 112, tail: 50, dorsal: 0.75 },
  gar: { L: 340, h: 42, tail: 36, dorsal: 0.6 },
  tuna: { L: 280, h: 100, tail: 60, dorsal: 1.1 },
  flat: { L: 250, h: 150, tail: 34, dorsal: 0.2 },
  drum: { L: 270, h: 104, tail: 42, dorsal: 0.85 },
};

interface Props {
  speciesId: string;
  seed?: string;
  width?: number | string;
  height?: number | string;
  background?: boolean;
}

export function FishArt({ speciesId, seed = '', width = '100%', height = '100%', background = true }: Props) {
  const species = SPECIES_BY_ID[speciesId];
  const shape: FishShape = species?.shape ?? 'bass';
  const pattern = species?.pattern ?? 'none';
  const c = species?.colors ?? OTHER_COLORS;
  const { L, h, tail, dorsal } = DIMS[shape];
  const id = useMemo(() => `f${Math.abs(hash(speciesId + seed))}`, [speciesId, seed]);

  const cy = 140;
  const x0 = 200 - L / 2;
  const x1 = 200 + L / 2 - tail;
  const bodyLen = x1 - x0;
  const hump = shape === 'drum' ? 0.72 : 0.6;

  const body =
    shape === 'flat'
      ? `M ${x0} ${cy} C ${x0 + 20} ${cy - h * 0.55}, ${x1 - 40} ${cy - h * 0.55}, ${x1} ${cy - 8} L ${x1} ${cy + 8} C ${x1 - 40} ${cy + h * 0.55}, ${x0 + 20} ${cy + h * 0.55}, ${x0} ${cy} Z`
      : `M ${x0} ${cy} C ${x0 + bodyLen * 0.1} ${cy - h * 0.55}, ${x0 + bodyLen * 0.45} ${cy - h * hump}, ${x1} ${cy - h * 0.15} L ${x1} ${cy + h * 0.15} C ${x0 + bodyLen * 0.5} ${cy + h * 0.6}, ${x0 + bodyLen * 0.12} ${cy + h * 0.48}, ${x0} ${cy} Z`;

  const tailSpread = shape === 'tuna' ? 0.85 : shape === 'flat' ? 0.4 : 0.6;
  const tailPath = `M ${x1 - 6} ${cy - h * 0.13} L ${x1 + tail} ${cy - h * tailSpread} Q ${x1 + tail * (shape === 'tuna' ? 0.35 : 0.65)} ${cy} ${x1 + tail} ${cy + h * tailSpread} L ${x1 - 6} ${cy + h * 0.13} Z`;

  const dorsalPath =
    shape === 'flat'
      ? `M ${x0 + 30} ${cy - h * 0.42} Q ${200} ${cy - h * 0.7} ${x1 - 10} ${cy - h * 0.12}`
      : `M ${x0 + bodyLen * 0.3} ${cy - h * 0.5} Q ${x0 + bodyLen * 0.45} ${cy - h * (0.5 + dorsal * 0.45)} ${x0 + bodyLen * 0.72} ${cy - h * 0.36} Z`;
  const analPath = `M ${x0 + bodyLen * 0.58} ${cy + h * 0.38} Q ${x0 + bodyLen * 0.68} ${cy + h * 0.72} ${x0 + bodyLen * 0.8} ${cy + h * 0.26} Z`;

  const eyeX = x0 + bodyLen * (shape === 'pike' || shape === 'gar' ? 0.13 : 0.11);
  const eyeY = cy - h * (shape === 'flat' ? 0.18 : 0.12);
  const eyeR = Math.max(5, h * 0.075);

  const marks = useMemo(() => {
    const rand = seededRandom(hash(speciesId + seed));
    const out: React.ReactNode[] = [];
    if (pattern === 'spots') {
      for (let i = 0; i < 34; i++) {
        const x = x0 + bodyLen * (0.18 + rand() * 0.82);
        const y = cy - h * 0.45 + rand() * h * 0.75;
        out.push(<Circle key={i} cx={x} cy={y} r={2 + rand() * 3.2} fill={c.mark} opacity={0.75} />);
      }
    } else if (pattern === 'bars') {
      for (let i = 0; i < 7; i++) {
        const x = x0 + bodyLen * (0.25 + i * 0.1);
        out.push(<Rect key={i} x={x} y={cy - h} width={bodyLen * 0.045} height={h * 2} fill={c.mark} opacity={0.35} />);
      }
    } else if (pattern === 'stripes') {
      for (let i = 0; i < 5; i++) {
        const y = cy - h * 0.32 + i * h * 0.13;
        out.push(<Line key={i} x1={x0 + 20} y1={y} x2={x1} y2={y + (i - 2) * 3} stroke={c.mark} strokeWidth={2.4} opacity={0.6} />);
      }
    } else if (pattern === 'blotch') {
      for (let i = 0; i < 9; i++) {
        const x = x0 + bodyLen * (0.22 + i * 0.085);
        out.push(<Ellipse key={i} cx={x} cy={cy + (rand() - 0.5) * 8} rx={bodyLen * 0.05} ry={h * 0.11} fill={c.mark} opacity={0.5} />);
      }
    }
    return out;
  }, [pattern, speciesId, seed, x0, x1, bodyLen, cy, h, c.mark]);

  return (
    <Svg width={width} height={height} viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#BFE6F5" />
          <Stop offset="0.55" stopColor="#5FA8CF" />
          <Stop offset="1" stopColor="#1F5F86" />
        </LinearGradient>
        <LinearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c.back} />
          <Stop offset="0.5" stopColor={c.body} />
          <Stop offset="1" stopColor={c.belly} />
        </LinearGradient>
        <ClipPath id={`${id}c`}>
          <Path d={body} />
        </ClipPath>
      </Defs>
      {background && (
        <G>
          <Rect x={0} y={0} width={400} height={280} fill={`url(#${id}w)`} />
          <Path d="M 40 0 L 90 0 L 30 280 L -20 280 Z" fill="#FFFFFF" opacity={0.08} />
          <Path d="M 170 0 L 200 0 L 150 280 L 120 280 Z" fill="#FFFFFF" opacity={0.06} />
          <Path d="M 300 0 L 360 0 L 300 280 L 250 280 Z" fill="#FFFFFF" opacity={0.07} />
          <Circle cx={340} cy={70} r={5} fill="none" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.6} />
          <Circle cx={352} cy={46} r={3.5} fill="none" stroke="#FFFFFF" strokeWidth={1.2} opacity={0.5} />
          <Circle cx={60} cy={210} r={4} fill="none" stroke="#FFFFFF" strokeWidth={1.2} opacity={0.4} />
          <Path d="M 0 262 Q 60 250 120 262 T 240 262 T 360 262 T 480 262 L 480 280 L 0 280 Z" fill="#164A69" opacity={0.6} />
        </G>
      )}
      <G>
        <Path d={tailPath} fill={c.fin} />
        {shape !== 'flat' && <Path d={dorsalPath} fill={c.fin} opacity={0.95} />}
        {shape !== 'flat' && shape !== 'gar' && <Path d={analPath} fill={c.fin} opacity={0.95} />}
        <Path d={body} fill={`url(#${id}b)`} />
        <G clipPath={`url(#${id}c)`}>
          {marks}
          {shape === 'flat' ? (
            <Path d={dorsalPath} stroke={c.fin} strokeWidth={10} fill="none" opacity={0.6} />
          ) : (
            <Path
              d={`M ${x0 + bodyLen * 0.2} ${cy - h * 0.38} Q ${x0 + bodyLen * 0.24} ${cy} ${x0 + bodyLen * 0.2} ${cy + h * 0.36}`}
              stroke={c.mark}
              strokeWidth={2}
              fill="none"
              opacity={0.45}
            />
          )}
          <Path
            d={`M ${x0 + bodyLen * 0.22} ${cy - h * 0.02} Q ${200} ${cy - h * 0.12} ${x1} ${cy - 2}`}
            stroke="#FFFFFF"
            strokeWidth={1.4}
            fill="none"
            opacity={0.35}
          />
        </G>
        {shape !== 'flat' && (
          <Ellipse
            cx={x0 + bodyLen * 0.3}
            cy={cy + h * 0.12}
            rx={bodyLen * 0.09}
            ry={h * 0.07}
            fill={c.fin}
            opacity={0.85}
            transform={`rotate(18 ${x0 + bodyLen * 0.3} ${cy + h * 0.12})`}
          />
        )}
        {shape === 'catfish' && (
          <G stroke={c.back} strokeWidth={2} fill="none">
            <Path d={`M ${x0 + 6} ${cy + 4} Q ${x0 - 20} ${cy + 20} ${x0 - 30} ${cy + 46}`} />
            <Path d={`M ${x0 + 8} ${cy + 2} Q ${x0 - 14} ${cy + 8} ${x0 - 34} ${cy + 18}`} />
            <Path d={`M ${x0 + 10} ${cy - 4} Q ${x0 - 10} ${cy - 18} ${x0 - 26} ${cy - 30}`} />
          </G>
        )}
        <Circle cx={eyeX} cy={eyeY} r={eyeR} fill="#F7F3E6" />
        <Circle cx={eyeX + 1} cy={eyeY} r={eyeR * 0.55} fill="#14110C" />
        <Circle cx={eyeX + 2.5} cy={eyeY - 2} r={eyeR * 0.18} fill="#FFFFFF" />
        {shape === 'flat' && (
          <>
            <Circle cx={eyeX + 14} cy={eyeY - 10} r={eyeR} fill="#F7F3E6" />
            <Circle cx={eyeX + 15} cy={eyeY - 10} r={eyeR * 0.55} fill="#14110C" />
          </>
        )}
        <Path
          d={`M ${x0 + 2} ${cy + 2} L ${x0 + bodyLen * (shape === 'bass' ? 0.12 : 0.07)} ${cy + h * 0.06}`}
          stroke={c.mark}
          strokeWidth={2}
          opacity={0.6}
        />
      </G>
    </Svg>
  );
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
