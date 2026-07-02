// Device catalog — single source of truth for the UI (and, later, the server).
// Prices in USD. Annual ≈ ~20% off twelve months.

export type Cycle = "monthly" | "annual";

export type Device = {
  id: string;
  name: string;
  brand: string;
  os: string;
  location: string;
  specs: string;
  priceMonthly: number;
  priceAnnual: number;
  /** tailwind-ish accent hex for the device card */
  accent: string;
};

export const DEVICES: Device[] = [
  {
    id: "pixel8",
    name: "Google Pixel 8",
    brand: "Google",
    os: "Android 14",
    location: "Ashburn, VA · US-East",
    specs: "8GB RAM · 128GB · καθαρή οικιακή IP",
    priceMonthly: 49,
    priceAnnual: 470,
    accent: "#1d4ed8",
  },
  {
    id: "galaxys24",
    name: "Samsung Galaxy S24",
    brand: "Samsung",
    os: "Android 14",
    location: "Dallas, TX · US-Central",
    specs: "8GB RAM · 256GB · καθαρή οικιακή IP",
    priceMonthly: 59,
    priceAnnual: 566,
    accent: "#0a0a0a",
  },
  {
    id: "iphone15",
    name: "Apple iPhone 15",
    brand: "Apple",
    os: "iOS 17",
    location: "San Jose, CA · US-West",
    specs: "6GB RAM · 128GB · καθαρή οικιακή IP",
    priceMonthly: 69,
    priceAnnual: 662,
    accent: "#e4322b",
  },
];

export function priceFor(device: Device, cycle: Cycle): number {
  return cycle === "annual" ? device.priceAnnual : device.priceMonthly;
}

/** Per-month display price (annual shown as its monthly equivalent). */
export function monthlyEquivalent(device: Device, cycle: Cycle): number {
  return cycle === "annual"
    ? Math.round(device.priceAnnual / 12)
    : device.priceMonthly;
}

export function deviceById(id: string): Device | undefined {
  return DEVICES.find((d) => d.id === id);
}
