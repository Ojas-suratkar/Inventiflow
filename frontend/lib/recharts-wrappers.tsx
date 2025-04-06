// lib/recharts-wrappers.tsx
import {
  BarChart,
  LineChart,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Bar,
  Line,
  Pie,
  Cell,
} from "recharts";

// Direct re-exports to avoid TypeScript issues
export {
  BarChart as ReBarChart,
  LineChart as ReLineChart,
  PieChart as RePieChart,
  ResponsiveContainer as ReResponsiveContainer,
  XAxis as ReXAxis,
  YAxis as ReYAxis,
  Tooltip as ReTooltip,
  Legend as ReLegend,
  CartesianGrid as ReCartesianGrid,
  Bar as ReBar,
  Line as ReLine,
  Pie as RePie,
  Cell
};
