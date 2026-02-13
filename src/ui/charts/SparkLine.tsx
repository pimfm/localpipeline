import React from "react";
import { Text } from "ink";

const TICKS = "▁▂▃▄▅▆▇█";

interface Props {
  values: number[];
  color?: string;
}

export function SparkLine({ values, color = "cyan" }: Props) {
  if (values.length === 0) return <Text dimColor>-</Text>;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const spark = values
    .map((v) => {
      const idx = Math.round(((v - min) / range) * (TICKS.length - 1));
      return TICKS[idx];
    })
    .join("");

  return <Text color={color}>{spark}</Text>;
}
