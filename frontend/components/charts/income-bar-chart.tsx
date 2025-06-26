// frontend/components/charts/income-bar-chart.tsx
'use client';

import { TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface ChartData {
  name: string;
  total: number;
}

interface IncomeBarChartProps {
  data: ChartData[];
}

const chartConfig = {
  total: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const formatCurrency = (amount: number, short: boolean = false) => {
  if (isNaN(amount)) return '$0';
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  };
  if (short) {
    options.notation = 'compact';
    options.compactDisplay = 'short';
    options.maximumFractionDigits = 1;
  }
  return new Intl.NumberFormat('en-US', options).format(amount);
};

export function IncomeBarChart({ data }: IncomeBarChartProps) {
  let trend = 0;
  if (data && data.length >= 2) {
    const lastMonth = data[data.length - 1]?.total ?? 0;
    const secondLastMonth = data[data.length - 2]?.total ?? 0;
    if (secondLastMonth > 0) {
      trend = ((lastMonth - secondLastMonth) / secondLastMonth) * 100;
    } else if (lastMonth > 0) {
      trend = 100;
    }
  }

  return (
    <Card>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              top: 20,
              left: -10,
              right: 10,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(value as number, true)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value) => formatCurrency(value as number)}
                />
              }
            />

            <Bar dataKey="total" fill="var(--color-total)" radius={8}>
              <LabelList
                position="top"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: number) => formatCurrency(value, true)}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {trend !== 0 && (
          <div className="flex gap-2 font-medium leading-none">
            <TrendingUp
              className={`h-4 w-4 ${
                trend < 0 ? 'rotate-180 text-destructive' : ''
              }`}
            />
            Trending {trend > 0 ? 'up' : 'down'} by {Math.abs(trend).toFixed(1)}
            % this month
          </div>
        )}
        <div className="text-muted-foreground leading-none">
          Showing total paid revenue for the last 12 months
        </div>
      </CardFooter>
    </Card>
  );
}
