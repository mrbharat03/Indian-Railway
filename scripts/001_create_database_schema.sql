-- Smart QR-Based Railway Track Fittings System Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'supervisor', 'technician', 'viewer')),
  department VARCHAR(100),
  zone VARCHAR(100),
  division VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track fitting categories
CREATE TABLE IF NOT EXISTS public.fitting_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  specifications JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track fittings master data
CREATE TABLE IF NOT EXISTS public.track_fittings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES fitting_categories(id),
  name VARCHAR(255) NOT NULL,
  part_number VARCHAR(100) UNIQUE NOT NULL,
  specifications JSONB,
  manufacturer VARCHAR(255),
  material VARCHAR(100),
  weight_kg DECIMAL(10,3),
  dimensions JSONB,
  safety_standards TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR codes for track fittings
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  fitting_id UUID REFERENCES track_fittings(id),
  batch_number VARCHAR(100),
  manufacturing_date DATE,
  installation_date DATE,
  location_details JSONB,
  zone VARCHAR(100),
  division VARCHAR(100),
  section VARCHAR(100),
  km_post VARCHAR(50),
  track_number VARCHAR(20),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'replaced')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inspection records
CREATE TABLE IF NOT EXISTS public.inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code_id UUID REFERENCES qr_codes(id),
  inspector_id UUID REFERENCES profiles(id),
  inspection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  inspection_type VARCHAR(50) CHECK (inspection_type IN ('routine', 'special', 'emergency', 'maintenance')),
  condition_rating INTEGER CHECK (condition_rating BETWEEN 1 AND 5),
  observations TEXT,
  defects_found TEXT[],
  photos JSONB,
  recommendations TEXT,
  next_inspection_due DATE,
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance records
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code_id UUID REFERENCES qr_codes(id),
  technician_id UUID REFERENCES profiles(id),
  maintenance_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  maintenance_type VARCHAR(50) CHECK (maintenance_type IN ('preventive', 'corrective', 'emergency', 'replacement')),
  work_description TEXT NOT NULL,
  parts_used JSONB,
  labor_hours DECIMAL(5,2),
  cost DECIMAL(10,2),
  before_photos JSONB,
  after_photos JSONB,
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit trail for all QR code activities
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code_id UUID REFERENCES qr_codes(id),
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics and reporting views
CREATE TABLE IF NOT EXISTS public.system_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,4),
  metric_data JSONB,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitting_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_fittings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for fitting_categories (read-only for most users)
CREATE POLICY "All authenticated users can view fitting categories" ON public.fitting_categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify fitting categories" ON public.fitting_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for track_fittings
CREATE POLICY "All authenticated users can view track fittings" ON public.track_fittings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and supervisors can modify track fittings" ON public.track_fittings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- RLS Policies for qr_codes
CREATE POLICY "All authenticated users can view QR codes" ON public.qr_codes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and supervisors can modify QR codes" ON public.qr_codes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Users can update QR codes they created or admins/supervisors" ON public.qr_codes
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- RLS Policies for inspections
CREATE POLICY "Users can view inspections" ON public.inspections
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create inspections" ON public.inspections
  FOR INSERT WITH CHECK (inspector_id = auth.uid());

CREATE POLICY "Users can update their own inspections or admins/supervisors" ON public.inspections
  FOR UPDATE USING (
    inspector_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- RLS Policies for maintenance_records
CREATE POLICY "Users can view maintenance records" ON public.maintenance_records
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create maintenance records" ON public.maintenance_records
  FOR INSERT WITH CHECK (technician_id = auth.uid());

CREATE POLICY "Users can update their own maintenance records or admins/supervisors" ON public.maintenance_records
  FOR UPDATE USING (
    technician_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- RLS Policies for audit_logs (read-only for most, admins can view all)
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for system_analytics (admins and supervisors only)
CREATE POLICY "Admins and supervisors can view analytics" ON public.system_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_qr_codes_qr_code ON public.qr_codes(qr_code);
CREATE INDEX idx_qr_codes_status ON public.qr_codes(status);
CREATE INDEX idx_qr_codes_location ON public.qr_codes(zone, division, section);
CREATE INDEX idx_inspections_qr_code_id ON public.inspections(qr_code_id);
CREATE INDEX idx_inspections_date ON public.inspections(inspection_date);
CREATE INDEX idx_maintenance_qr_code_id ON public.maintenance_records(qr_code_id);
CREATE INDEX idx_maintenance_date ON public.maintenance_records(maintenance_date);
CREATE INDEX idx_audit_logs_qr_code_id ON public.audit_logs(qr_code_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
