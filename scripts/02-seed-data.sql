-- Insert sample categories
INSERT INTO categories (name, description, color) VALUES
  ('Marketing', 'QR codes for marketing campaigns', '#10B981'),
  ('Events', 'QR codes for event management', '#8B5CF6'),
  ('Products', 'QR codes for product information', '#F59E0B'),
  ('Contact', 'QR codes for contact information', '#EF4444'),
  ('Social Media', 'QR codes for social media links', '#3B82F6')
ON CONFLICT DO NOTHING;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON qr_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
