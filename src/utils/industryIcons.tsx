import { 
  Zap, 
  Flame, 
  Waves, 
  Radio, 
  Train, 
  Building, 
  LucideIcon 
} from "lucide-react";

export type IndustryType = "electric" | "gas" | "water" | "telecom" | "railroad" | "miscellaneous" | string;

export const getIndustryIcon = (industry: string): LucideIcon => {
  const normalizedIndustry = industry?.toLowerCase();
  
  switch (normalizedIndustry) {
    case "electric":
    case "electricity":
      return Zap;
    case "gas":
    case "natural gas":
      return Flame;
    case "water":
    case "water/sewer":
      return Waves;
    case "telecom":
    case "telecommunications":
    case "telephone":
      return Radio;
    case "railroad":
    case "rail":
    case "transportation":
      return Train;
    case "miscellaneous":
    case "other":
    default:
      return Building;
  }
};

export const getIndustryColor = (industry: string): string => {
  const normalizedIndustry = industry?.toLowerCase();
  
  switch (normalizedIndustry) {
    case "electric":
    case "electricity":
      return "text-yellow-600 dark:text-yellow-400";
    case "gas":
    case "natural gas":
      return "text-orange-600 dark:text-orange-400";
    case "water":
    case "water/sewer":
      return "text-blue-600 dark:text-blue-400";
    case "telecom":
    case "telecommunications":
    case "telephone":
      return "text-purple-600 dark:text-purple-400";
    case "railroad":
    case "rail":
    case "transportation":
      return "text-green-600 dark:text-green-400";
    case "miscellaneous":
    case "other":
    default:
      return "text-gray-600 dark:text-gray-400";
  }
};