-- Function to calculate km/L and distance traveled
CREATE OR REPLACE FUNCTION public.calculate_fuel_efficiency()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  previous_log RECORD;
BEGIN
  -- Calculate total cost
  NEW.total_cost := NEW.liters * NEW.price_per_liter;
  
  -- Get the previous fuel log for this car
  SELECT * INTO previous_log
  FROM public.fuel_logs
  WHERE car_id = NEW.car_id
    AND user_id = NEW.user_id
    AND date < NEW.date
  ORDER BY date DESC
  LIMIT 1;
  
  -- Calculate distance traveled and km/L if previous log exists
  IF previous_log IS NOT NULL THEN
    NEW.distance_traveled := NEW.odometer_reading - previous_log.odometer_reading;
    
    IF NEW.distance_traveled > 0 AND NEW.liters > 0 THEN
      NEW.km_per_liter := NEW.distance_traveled / NEW.liters;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to calculate efficiency before insert or update
DROP TRIGGER IF EXISTS calculate_efficiency_trigger ON public.fuel_logs;

CREATE TRIGGER calculate_efficiency_trigger
  BEFORE INSERT OR UPDATE ON public.fuel_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_fuel_efficiency();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_cars_updated_at ON public.cars;
CREATE TRIGGER update_cars_updated_at
  BEFORE UPDATE ON public.cars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_fuel_logs_updated_at ON public.fuel_logs;
CREATE TRIGGER update_fuel_logs_updated_at
  BEFORE UPDATE ON public.fuel_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
