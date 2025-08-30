declare global {
  interface Window {
    mapboxgl: any;
  }
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
  id?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  deliveryLocation: Location;
  description?: string;
  totalAmount?: number;
  createdAt?: string;
}

export {};
