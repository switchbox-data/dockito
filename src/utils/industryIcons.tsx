import { 
  Zap, 
  Flame, 
  Wifi, 
  Phone, 
  Factory, 
  Building, 
  Cable,
  Thermometer,
  LucideIcon 
} from "lucide-react";

export type IndustryType = "electric" | "gas" | "cable" | "communication" | "facilite gen" | "steam" | "transmission" | "miscellaneous" | string;

export const getIndustryIcon = (industry: string): LucideIcon => {
  const normalizedIndustry = industry?.toLowerCase();
  
  switch (normalizedIndustry) {
    case "electric":
    case "electricity":
      return Zap;
    case "gas":
    case "natural gas":
      return Flame;
    case "cable":
      return Wifi; // Internet/cable services
    case "communication":
      return Phone; // Phone services
    case "facilite gen":
    case "facilite generation":
    case "facility gen":
    case "facility gen.":
    case "facility generation":
      return Factory; // Electrical generation facilities
    case "steam":
      return Thermometer; // District steam heating
    case "transmission":
      return Cable; // Electrical transmission lines
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
    case "cable":
      return "text-blue-600 dark:text-blue-400"; // Internet/cable
    case "communication":
      return "text-green-600 dark:text-green-400"; // Phone services
    case "facilite gen":
    case "facilite generation":
    case "facility gen":
    case "facility gen.":
    case "facility generation":
      return "text-purple-600 dark:text-purple-400"; // Power generation
    case "steam":
      return "text-red-600 dark:text-red-400"; // Steam heating
    case "transmission":
      return "text-indigo-600 dark:text-indigo-400"; // Electrical transmission
    case "miscellaneous":
    case "other":
    default:
      return "text-gray-600 dark:text-gray-400";
  }
};