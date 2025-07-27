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

-- Enable RLS
ALTER TABLE public.pesanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tagihan ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin can view all pesanan" ON public.pesanan FOR ALL USING (true);
CREATE POLICY "Admin can view all tagihan" ON public.tagihan FOR ALL USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_pesanan_updated_at
  BEFORE UPDATE ON public.pesanan
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tagihan_updated_at
  BEFORE UPDATE ON public.tagihan
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();