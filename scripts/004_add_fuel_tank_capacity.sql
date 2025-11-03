-- Add fuel tank capacity to cars table
ALTER TABLE public.cars
    ADD COLUMN IF NOT EXISTS fuel_tank_capacity DECIMAL(5, 2);

-- Add comment for clarity
COMMENT ON COLUMN public.cars.fuel_tank_capacity IS 'Fuel tank capacity in liters (optional)';
