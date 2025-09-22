-- Seed initial data for the Railway QR System

-- Insert fitting categories
INSERT INTO public.fitting_categories (id, name, description, specifications) VALUES
  (uuid_generate_v4(), 'Rail Joints', 'Components for joining rail sections', '{"standard": "IRS-T-12", "material": "Steel", "grade": "880"}'),
  (uuid_generate_v4(), 'Fastening Systems', 'Rail fastening components', '{"standard": "IRS-T-18", "type": "Elastic", "gauge": "1676mm"}'),
  (uuid_generate_v4(), 'Sleepers', 'Track sleeper components', '{"standard": "IRS-T-09", "material": "Concrete", "type": "PSC"}'),
  (uuid_generate_v4(), 'Ballast', 'Track ballast materials', '{"standard": "IRS-T-03", "size": "25-50mm", "material": "Stone"}'),
  (uuid_generate_v4(), 'Switches & Crossings', 'Turnout components', '{"standard": "IRS-T-24", "type": "Thick Web", "angle": "1:12"}');

-- Insert sample track fittings
INSERT INTO public.track_fittings (category_id, name, part_number, specifications, manufacturer, material, weight_kg, dimensions, safety_standards) 
SELECT 
  fc.id,
  'Fish Plate 60kg',
  'FP-60-001',
  '{"length": "600mm", "thickness": "25mm", "holes": 6}',
  'Rail India Technical & Economic Service',
  'Carbon Steel',
  12.5,
  '{"length": 600, "width": 150, "thickness": 25}',
  ARRAY['IRS-T-12', 'IS-2062']
FROM public.fitting_categories fc WHERE fc.name = 'Rail Joints'
LIMIT 1;

INSERT INTO public.track_fittings (category_id, name, part_number, specifications, manufacturer, material, weight_kg, dimensions, safety_standards) 
SELECT 
  fc.id,
  'Pandrol Clip',
  'PC-E-2056',
  '{"type": "E-Clip", "gauge": "1676mm", "rail_section": "60kg"}',
  'Pandrol India Pvt Ltd',
  'Spring Steel',
  0.85,
  '{"length": 180, "width": 25, "thickness": 12}',
  ARRAY['IRS-T-18', 'BS-EN-13481']
FROM public.fitting_categories fc WHERE fc.name = 'Fastening Systems'
LIMIT 1;

INSERT INTO public.track_fittings (category_id, name, part_number, specifications, manufacturer, material, weight_kg, dimensions, safety_standards) 
SELECT 
  fc.id,
  'PSC Sleeper',
  'PSC-ST-2540',
  '{"length": "2740mm", "width": "254mm", "height": "200mm", "grade": "M50"}',
  'Kernex Microsystems India Ltd',
  'Pre-stressed Concrete',
  285.0,
  '{"length": 2740, "width": 254, "height": 200}',
  ARRAY['IRS-T-09', 'IS-1343']
FROM public.fitting_categories fc WHERE fc.name = 'Sleepers'
LIMIT 1;

-- Create function to generate QR codes
CREATE OR REPLACE FUNCTION generate_qr_code(prefix TEXT DEFAULT 'IR')
RETURNS TEXT AS $$
DECLARE
  timestamp_part TEXT;
  random_part TEXT;
  qr_code TEXT;
BEGIN
  -- Get current timestamp in format YYYYMMDDHHMISS
  timestamp_part := to_char(NOW(), 'YYYYMMDDHH24MISS');
  
  -- Generate 4-digit random number
  random_part := LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');
  
  -- Combine parts
  qr_code := prefix || timestamp_part || random_part;
  
  RETURN qr_code;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, employee_id, name, email, role, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'employee_id', 'EMP' || EXTRACT(EPOCH FROM NOW())::INTEGER::TEXT),
    COALESCE(NEW.raw_user_meta_data ->> 'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'viewer'),
    COALESCE(NEW.raw_user_meta_data ->> 'department', 'General')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to log QR code activities
CREATE OR REPLACE FUNCTION log_qr_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (qr_code_id, user_id, action, details)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    TG_OP,
    CASE 
      WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit logging
CREATE TRIGGER qr_codes_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.qr_codes
  FOR EACH ROW EXECUTE FUNCTION log_qr_activity();

CREATE TRIGGER inspections_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.inspections
  FOR EACH ROW EXECUTE FUNCTION log_qr_activity();

CREATE TRIGGER maintenance_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_records
  FOR EACH ROW EXECUTE FUNCTION log_qr_activity();
