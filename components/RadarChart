import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '@/constants/colors';

export interface RadarDataPoint {
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: RadarDataPoint[];
  size: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

export default React.memo(function RadarChart({ data, size }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 40;
  const levels = 4;
  const angleStep = 360 / data.length;

  const gridPolygons = useMemo(() => {
    return Array.from({ length: levels }, (_, lvl) => {
      const r = ((lvl + 1) / levels) * maxR;
      const pts = data.map((_, i) => {
        const p = polarToCartesian(cx, cy, r, i * angleStep);
        return `${p.x},${p.y}`;
      });
      return pts.join(' ');
    });
  }, [data, maxR, cx, cy, angleStep]);

  const axes = useMemo(() => {
    return data.map((_, i) => {
      const p = polarToCartesian(cx, cy, maxR, i * angleStep);
      return { x2: p.x, y2: p.y };
    });
  }, [data, maxR, cx, cy, angleStep]);

  const dataPolygon = useMemo(() => {
    const pts = data.map((d, i) => {
      const r = Math.max(0.08, d.value) * maxR;
      const p = polarToCartesian(cx, cy, r, i * angleStep);
      return `${p.x},${p.y}`;
    });
    return pts.join(' ');
  }, [data, maxR, cx, cy, angleStep]);

  const dataPoints = useMemo(() => {
    return data.map((d, i) => {
      const r = Math.max(0.08, d.value) * maxR;
      return polarToCartesian(cx, cy, r, i * angleStep);
    });
  }, [data, maxR, cx, cy, angleStep]);

  const labelPositions = useMemo(() => {
    return data.map((d, i) => {
      const p = polarToCartesian(cx, cy, maxR + 26, i * angleStep);
      return { ...p, label: d.label, color: d.color, value: d.value };
    });
  }, [data, maxR, cx, cy, angleStep]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center' as const }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Colors.teal} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={Colors.teal} stopOpacity={0.08} />
          </LinearGradient>
        </Defs>

        {gridPolygons.map((pts, i) => (
          <Polygon
            key={`grid-${i}`}
            points={pts}
            fill="none"
            stroke={Colors.border}
            strokeWidth={1}
            opacity={0.6}
          />
        ))}

        {axes.map((a, i) => (
          <Line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={a.x2}
            y2={a.y2}
            stroke={Colors.border}
            strokeWidth={1}
            opacity={0.4}
          />
        ))}

        <Polygon
          points={dataPolygon}
          fill="url(#radarFill)"
          stroke={Colors.teal}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {dataPoints.map((p, i) => (
          <Circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={data[i].color}
            stroke={Colors.bg}
            strokeWidth={2}
          />
        ))}
      </Svg>

      {labelPositions.map((lp, i) => (
        <View
          key={`label-${i}`}
          style={[
            styles.labelWrap,
            {
              position: 'absolute' as const,
              left: lp.x - 30,
              top: lp.y - 10,
              width: 60,
            },
          ]}
        >
          <Text style={[styles.labelText, { color: lp.color }]}>{lp.label}</Text>
          <Text style={styles.labelValue}>{Math.round(lp.value * 100)}%</Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  labelWrap: {
    alignItems: 'center' as const,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  labelValue: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textAlign: 'center' as const,
  },
});
