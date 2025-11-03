export interface Profile {
  id: string
  email: string
  full_name: string | null
  created_at: string
  updated_at: string
}

export interface Car {
  id: string
  user_id: string
  make: string
  model: string
  year: number
  registration_number: string
  created_at: string
  updated_at: string
}

export interface FuelLog {
  id: string
  car_id: string
  user_id: string
  date: string
  odometer_reading: number
  liters: number
  price_per_liter: number
  total_cost: number
  petrol_station: string | null
  receipt_url: string | null
  distance_traveled: number | null
  km_per_liter: number | null
  work_distance: number
  is_work_travel: boolean
  is_locked: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface FuelLogWithCar extends FuelLog {
  car: Car
}
