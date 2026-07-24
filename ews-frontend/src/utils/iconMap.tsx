import {
  Heart,
  Users,
  Briefcase,
  Shield,
  IdCard,
  Building2,
  School,
  GraduationCap,
  Flag,
  Hospital,
  Home,
  BookOpen,
  UserRound,
  Landmark,
  HelpCircle,
} from "lucide-react";

export const iconMap = {
  heart: Heart,
  users: Users,
  briefcase: Briefcase,
  shield: Shield,
  "id-card": IdCard,

  building: Building2,
  building2: Building2,

  school: School,
  graduation: GraduationCap,
  graduationcap: GraduationCap,

  flag: Flag,
  hospital: Hospital,
  home: Home,
  book: BookOpen,
  user: UserRound,
  landmark: Landmark,
};

export const getIcon = (name?: string) => {
  if (!name) return HelpCircle;

  const key = name.toLowerCase();

  return iconMap[key as keyof typeof iconMap] ?? HelpCircle;
};
