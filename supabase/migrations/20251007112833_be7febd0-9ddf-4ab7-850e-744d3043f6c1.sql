-- Create services table to store all settlement services
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  about_service TEXT NOT NULL,
  price TEXT NOT NULL,
  duration TEXT NOT NULL,
  rating DECIMAL(2,1) DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  consultant TEXT NOT NULL,
  consultant_title TEXT NOT NULL,
  features TEXT[] NOT NULL DEFAULT '{}',
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create policies for services table
-- Everyone can view services (public facing)
CREATE POLICY "Anyone can view services"
  ON public.services
  FOR SELECT
  USING (true);

-- Only authenticated users can insert services
CREATE POLICY "Authenticated users can insert services"
  ON public.services
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated users can update services
CREATE POLICY "Authenticated users can update services"
  ON public.services
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Only authenticated users can delete services
CREATE POLICY "Authenticated users can delete services"
  ON public.services
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample service data
INSERT INTO public.services (
  service_id, title, category, description, about_service, price, duration, 
  rating, reviews, consultant, consultant_title, features, icon
) VALUES (
  1,
  'Complete Settlement Package',
  'Settlement & Integration',
  'Step-by-step guidance for new immigrants with paperwork help, housing, healthcare, schools, and banking',
  'Navigate your arrival in Canada with confidence through our comprehensive settlement package. We provide end-to-end support from the moment you arrive, helping you complete all essential paperwork and local registrations efficiently. Our experts guide you through finding suitable housing, understanding Canada''s healthcare system, enrolling children in schools, and setting up your banking. This package is designed to eliminate the stress of settling in a new country, ensuring you have all the foundational elements in place for a successful Canadian journey.',
  '$299',
  'Full package',
  4.9,
  187,
  'EXPERT 1',
  'Settlement Specialist',
  ARRAY[
    'Paperwork and local registrations',
    'Housing orientation',
    'Healthcare system navigation',
    'School enrollment guidance',
    'Banking setup assistance',
    'Follow-up support for 30 days'
  ],
  'Home'
);