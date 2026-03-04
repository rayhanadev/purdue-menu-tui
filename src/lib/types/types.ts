import type { MealStatus, MealType } from "./enums.ts";

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  countryCode: string;
}

export interface DiningCourt {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  address: Address | null;
  logoUrl: string | null;
  formalName: string | null;
  dailyMenu: DailyMenu | null;
  normalHours: NormalHoursPeriod[];
  upcomingMeals: UpcomingMeal[];
}

export interface DiningCourtCategory {
  name: string;
  diningCourts: DiningCourt[];
}

export interface DailyMenu {
  meals: MealMenu[];
  notes: string;
}

export interface MealMenu {
  id: string;
  name: string;
  status: MealStatus;
  type: MealType;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  stations: Station[];
}

export interface Station {
  id: string;
  name: string | null;
  items: ItemAppearance[];
  notes: string | null;
  iconUrl: string | null;
  foregroundColor: string | null;
  backgroundColor: string | null;
}

export interface ItemAppearance {
  id: string;
  itemMenuId: string;
  item: Item;
  displayName: string;
  specialName: string | null;
  hasComponents: boolean;
  components: ItemAppearance[] | null;
}

export interface Item {
  id: string;
  itemId: string;
  name: string;
  nutritionFacts: NutritionFact[] | null;
  traits: Trait[] | null;
  ingredients: string | null;
  isVegetarian?: boolean;
  appearances: ItemOccurrence[];
}

export interface NutritionFact {
  name: string | null;
  value: number | null;
  label: string | null;
  dailyValueLabel: string | null;
}

export interface Trait {
  id: string;
  name: string;
  type: string;
}

export interface ItemOccurrence {
  locationName: string;
  date: string;
  mealName: string;
  stationName: string;
}

export interface NormalHoursPeriod {
  id: string;
  name: string | null;
  effectiveDate: string;
  days: NormalHoursDay[];
}

export interface NormalHoursDay {
  dayOfWeek: string;
  meals: NormalHoursMeal[];
}

export interface NormalHoursMeal {
  name: string | null;
  startTime: string;
  endTime: string;
}

export interface UpcomingFavoriteEntry {
  date: string;
  locationName: string;
  mealName: string;
  itemName: string;
  itemId: string;
}

export interface UpcomingMeal {
  id: string;
  name: string | null;
  type: string;
  startTime: string;
  endTime: string;
}

export interface SearchResultEntry {
  item: Item;
  upcoming: ItemOccurrence[];
}

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}
