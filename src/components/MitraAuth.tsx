import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import smartcareLogo from '@/assets/smartcare-logo.png';

interface MitraAuthProps {
  onLogin: (mitra: any) => void;
}

export const MitraAuth = ({ onLogin }: MitraAuthProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    wa: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('mitra')
        .select('*')
        .eq('email', formData.email)
        .eq('password', formData.password)
        .single();

      if (error) {
        toast.error('Email atau password salah');
        return;
      }

      if (data.status_verifikasi === 'nonaktif') {
        // Get total tagihan
        const { data: tagihanData } = await supabase
          .from('tagihan')
          .select('jumlah')
          .eq('mitra_id', data.id)
          .eq('status', 'belum_bayar');
        
        const totalTagihan = tagihanData?.reduce((sum, t) => sum + t.jumlah, 0) || 0;
        
        toast.error(
          `Mohon Maaf Akun Anda Telah Kami Non Aktifkan Dikarenakan Anda Memiliki Tagihan Rp. ${totalTagihan.toLocaleString()}. Karena Sistem kami Otomatis Akan Menon Aktifkan Akun Mitra Ketika Memiliki Tagihan Minimal Rp.50.000,- Ke Atas. Silahkan Ajukan Pengaktifan Akun Kepada Admin Dengan Cara Hubungi VIA WhatsApp Di Nomor 081299660660...`,
          { duration: 10000 }
        );
        return;
      }

      toast.success('Login berhasil!');
      onLogin(data);
    } catch (error) {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error('Password tidak sama');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('mitra')
        .insert([{
          nama: formData.nama,
          email: formData.email,
          wa: formData.wa,
          password: formData.password,
          status_verifikasi: 'belum'
        }]);

      if (error) {
        if (error.code === '23505') {
          toast.error('Email sudah terdaftar');
        } else {
          toast.error('Gagal mendaftar');
        }
        return;
      }

      toast.success('Pendaftaran berhasil! Akun Anda sedang dalam proses verifikasi.');
      setIsLogin(true);
      setFormData({
        nama: '',
        email: '',
        wa: '',
        password: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-medium">
        <CardHeader className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto">
            <img 
              src={smartcareLogo} 
              alt="SmartCare Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <CardTitle className="text-2xl">
            {isLogin ? 'Login Mitra' : 'Daftar Mitra'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Lengkap</Label>
                  <Input
                    id="nama"
                    name="nama"
                    type="text"
                    required
                    value={formData.nama}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wa">WhatsApp</Label>
                  <Input
                    id="wa"
                    name="wa"
                    type="tel"
                    required
                    value={formData.wa}
                    onChange={handleInputChange}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="masukkan@email.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Masukkan password"
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Konfirmasi password"
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Memproses...' : (isLogin ? 'Login' : 'Daftar')}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm"
            >
              {isLogin 
                ? 'Belum punya akun? Daftar di sini' 
                : 'Sudah punya akun? Login di sini'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};