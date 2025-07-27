-- Create tables for Mitra SmartCare application

-- Create mitra table
CREATE TABLE public.mitra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  wa TEXT NOT NULL,
  password TEXT NOT NULL,
  saldo INTEGER NOT NULL DEFAULT 0,
  status_verifikasi TEXT NOT NULL DEFAULT 'belum',
  role TEXT NOT NULL DEFAULT 'mitra',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pesanan table
CREATE TABLE public.pesanan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  mitra_id UUID REFERENCES public.mitra(id),
  status TEXT NOT NULL DEFAULT 'menunggu',
  waktu_pesan TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  waktu_mulai TIMESTAMP WITH TIME ZONE,
  waktu_selesai TIMESTAMP WITH TIME ZONE,
  tarif INTEGER NOT NULL,
  deskripsi TEXT NOT NULL,
  alamat TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tagihan table  
CREATE TABLE public.tagihan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mitra_id UUID NOT NULL REFERENCES public.mitra(id),
  tanggal TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  jenis_tagihan TEXT NOT NULL,
  jumlah INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'belum_bayar',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice table
CREATE TABLE public.invoice (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mitra_id UUID NOT NULL REFERENCES public.mitra(id),
  pesanan_id UUID NOT NULL REFERENCES public.pesanan(id),
  waktu_mulai TIMESTAMP WITH TIME ZONE NOT NULL,
  waktu_selesai TIMESTAMP WITH TIME ZONE,
  total INTEGER NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create topup table for saldo requests
CREATE TABLE public.topup (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mitra_id UUID NOT NULL REFERENCES public.mitra(id),
  nominal INTEGER NOT NULL,
  wa TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'menunggu',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat table for support
CREATE TABLE public.chat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_credentials table
CREATE TABLE public.admin_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mitra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tagihan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access (since this is for mitra app, admin can view all)
CREATE POLICY "Admin can view all mitra" ON public.mitra FOR ALL USING (true);
CREATE POLICY "Admin can view all pesanan" ON public.pesanan FOR ALL USING (true);  
CREATE POLICY "Admin can view all tagihan" ON public.tagihan FOR ALL USING (true);
CREATE POLICY "Admin can view all invoice" ON public.invoice FOR ALL USING (true);
CREATE POLICY "Admin can view all topup" ON public.topup FOR ALL USING (true);
CREATE POLICY "Admin can view all chat" ON public.chat FOR ALL USING (true);
CREATE POLICY "Admin can view all admin_credentials" ON public.admin_credentials FOR SELECT USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_mitra_updated_at 
  BEFORE UPDATE ON public.mitra 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pesanan_updated_at 
  BEFORE UPDATE ON public.pesanan 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tagihan_updated_at 
  BEFORE UPDATE ON public.tagihan 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoice_updated_at 
  BEFORE UPDATE ON public.invoice 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_topup_updated_at 
  BEFORE UPDATE ON public.topup 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();