import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import type { ScoreEntry } from '@/lib/scoreHistory';

interface Props {
  history: ScoreEntry[];
  width: number;
  height: number;
}

export default React.memo(function ScoreTrendChart({ history, width, height }: Props) {
  const PADDING_LEFT = 40;
  const PADDING_RIGHT = 20;
  const PADDING_TOP = 20;
  const PADDING_BOTTOM = 30;
  const chartW = width - PADDING_LEFT - PADDING_RIGHT;
  const chartH = height - PADDING_TOP - PADDING_BOTTOM;

  const points = useMemo(() => {
    if (history.length === 0) return [];
    const maxScore = 1000;
    return history.map((entry, i) => {
      const x = PADDING_LEFT + (history.length === 1 ? chartW / 2 : (i / (history.length - 1)) * chartW);
      const y = PADDING_TOP + chartH - (entry.score / maxScore) * chartH;
      return { x, y, score: entry.score };
    });
  }, [history, chartW, chartH]);

  const linePath = useMemo(() => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
      const cpx2 = prev.x + (curr.x - prev.x) * 0.6;
      d += ` C ${cpx1} ${prev.y} ${cpx2} ${curr.y} ${curr.x} ${curr.y}`;
    }
    return d;
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    const bottom = PADDING_TOP + chartH;
    let d = `M ${points[0].x} ${bottom} L ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
      const cpx2 = prev.x + (curr.x - prev.x) * 0.6;
      d += ` C ${cpx1} ${prev.y} ${cpx2} ${curr.y} ${curr.x} ${curr.y}`;
    }
    d += ` L ${points[points.length - 1].x} ${bottom} Z`;
    return d;
  }, [points, chartH]);

  const yLabels = [0, 250, 500, 750, 1000];

  if (history.length === 0) {
    return (
      <View style={[styles.emptyContainer, { width, height }]}>
        <Text style={styles.emptyText}>Play more to see your progress</Text>
        <Text style={styles.emptySubtext}>Your score trend will appear here</Text>
      </View>
    );
  }

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Colors.teal} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={Colors.teal} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>

        {yLabels.map((val) => {
          const y = PADDING_TOP + chartH - (val / 1000) * chartH;
          return (
            <React.Fragment key={val}>
              <Line
                x1={PADDING_LEFT}
                y1={y}
                x2={PADDING_LEFT + chartW}
                y2={y}
                stroke={Colors.border}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <Rect x={0} y={y - 8} width={36} height={16} fill="transparent" />
            </React.Fragment>
          );
        })}

        {areaPath ? <Path d={areaPath} fill="url(#areaGrad)" /> : null}
        {linePath ? <Path d={linePath} stroke={Colors.teal} strokeWidth={2.5} fill="none" strokeLinecap="round" /> : null}

        {points.map((p, i) => (
          <React.Fragment key={i}>
            {i === points.length - 1 && (
              <Circle cx={p.x} cy={p.y} r={8} fill={Colors.teal} opacity={0.2} />
            )}
            <Circle
              cx={p.x}
              cy={p.y}
              r={i === points.length - 1 ? 5 : 3.5}
              fill={i === points.length - 1 ? Colors.teal : Colors.bgCardLight}
              stroke={Colors.teal}
              strokeWidth={2}
            />
          </React.Fragment>
        ))}
      </Svg>

      {yLabels.map((val) => {
        const y = PADDING_TOP + chartH - (val / 1000) * chartH;
        return (
          <Text key={`label-${val}`} style={[styles.yLabel, { top: y - 7, left: 2 }]}>
            {val}
          </Text>
        );
      })}

      {points.map((p, i) => (
        <Text key={`x-${i}`} style={[styles.xLabel, { left: p.x - 8, top: height - 18 }]}>
          #{i + 1}
        </Text>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  yLabel: {
    position: 'absolute' as const,
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  xLabel: {
    position: 'absolute' as const,
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
});
