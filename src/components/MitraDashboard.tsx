import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  ClipboardList, 
  Briefcase, 
  History, 
  Wallet, 
  Receipt, 
  User,
  LogOut,
  Play,
  Square,
  Check
} from 'lucide-react';
import smartcareLogo from '@/assets/smartcare-logo.png';

interface MitraDashboardProps {
  mitra: any;
  onLogout: () => void;
}

type MenuType = 'pesanan' | 'pekerjaan' | 'riwayat' | 'saldo' | 'tagihan' | 'akun';

export const MitraDashboard = ({ mitra, onLogout }: MitraDashboardProps) => {
  const [activeMenu, setActiveMenu] = useState<MenuType>('pesanan');
  const [pesananMasuk, setPesananMasuk] = useState<any[]>([]);
  const [pekerjaanSaya, setPekerjaanSaya] = useState<any[]>([]);
  const [riwayatPesanan, setRiwayatPesanan] = useState<any[]>([]);
  const [tagihan, setTagihan] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentPesanan, setCurrentPesanan] = useState<any>(null);

  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString()}`;
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      // Load pesanan masuk
      const { data: pesanan } = await (supabase as any)
        .from('pesanan')
        .select('*')
        .eq('status', 'menunggu')
        .is('mitra_id', null);
      
      setPesananMasuk(pesanan || []);

      // Load pekerjaan saya
      const { data: pekerjaan } = await (supabase as any)
        .from('pesanan')
        .select('*')
        .eq('mitra_id', mitra.id)
        .in('status', ['diterima', 'sedang_dikerjakan']);
      
      setPekerjaanSaya(pekerjaan || []);

      // Load riwayat
      const { data: riwayat } = await (supabase as any)
        .from('pesanan')
        .select('*')
        .eq('mitra_id', mitra.id)
        .eq('status', 'selesai')
        .order('updated_at', { ascending: false });
      
      setRiwayatPesanan(riwayat || []);

      // Load tagihan
      const { data: tagihanData } = await (supabase as any)
        .from('tagihan')
        .select('*')
        .eq('mitra_id', mitra.id)
        .eq('status', 'belum_bayar');
      
      setTagihan(tagihanData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [mitra.id]);

  const handleTerimaPesanan = async (pesananId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('pesanan')
        .update({ 
          status: 'diterima', 
          mitra_id: mitra.id 
        })
        .eq('id', pesananId);

      if (error) throw error;

      toast.success('Pesanan berhasil diterima!');
      loadData();
      setActiveMenu('pekerjaan');
    } catch (error) {
      toast.error('Gagal menerima pesanan');
    }
  };

  const handleTolakPesanan = async (pesananId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('pesanan')
        .update({ status: 'ditolak' })
        .eq('id', pesananId);

      if (error) throw error;

      toast.success('Pesanan ditolak');
      loadData();
    } catch (error) {
      toast.error('Gagal menolak pesanan');
    }
  };

  const handleMulaiBekerja = async (pesanan: any) => {
    try {
      const { error } = await (supabase as any)
        .from('pesanan')
        .update({ 
          status: 'sedang_dikerjakan',
          waktu_mulai: new Date().toISOString()
        })
        .eq('id', pesanan.id);

      if (error) throw error;

      setCurrentPesanan(pesanan);
      setTimer(0);
      setIsTimerRunning(true);
      toast.success('Pekerjaan dimulai!');
      loadData();
    } catch (error) {
      toast.error('Gagal memulai pekerjaan');
    }
  };

  const handleSelesaiBekerja = async () => {
    if (!currentPesanan) return;

    try {
      const waktuSelesai = new Date().toISOString();
      const durasiDetik = timer;
      const potongan = Math.floor(currentPesanan.tarif * 0.2);
      const sisaSetelahPotongan = currentPesanan.tarif - potongan;

      // Update pesanan
      const { error: pesananError } = await (supabase as any)
        .from('pesanan')
        .update({ 
          status: 'selesai',
          waktu_selesai: waktuSelesai
        })
        .eq('id', currentPesanan.id);

      if (pesananError) throw pesananError;

      // Create invoice
      const { error: invoiceError } = await supabase
        .from('invoice')
        .insert([{
          mitra_id: mitra.id,
          pesanan_id: currentPesanan.id,
          waktu_mulai: currentPesanan.waktu_mulai,
          waktu_selesai: waktuSelesai,
          total: sisaSetelahPotongan
        }]);

      if (invoiceError) throw invoiceError;

      // Update atau create tagihan if saldo tidak cukup
      const saldoSaatIni = mitra.saldo || 0;
      if (saldoSaatIni < potongan) {
        const kekurangan = potongan - saldoSaatIni;
        
        // Create tagihan
        await (supabase as any)
          .from('tagihan')
          .insert([{
            mitra_id: mitra.id,
            jenis_tagihan: 'Biaya Operasional',
            jumlah: kekurangan
          }]);

        // Update saldo to 0
        await supabase
          .from('mitra')
          .update({ saldo: 0 })
          .eq('id', mitra.id);

        // Check total tagihan
        const { data: totalTagihan } = await (supabase as any)
          .from('tagihan')
          .select('jumlah')
          .eq('mitra_id', mitra.id)
          .eq('status', 'belum_bayar');

        const total = totalTagihan?.reduce((sum, t) => sum + t.jumlah, 0) || 0;
        
        if (total >= 50000) {
          await supabase
            .from('mitra')
            .update({ status_verifikasi: 'nonaktif' })
            .eq('id', mitra.id);
          
          toast.error('Akun Anda telah dinonaktifkan karena tagihan >= Rp 50.000');
          onLogout();
          return;
        }
      } else {
        // Potong saldo
        await supabase
          .from('mitra')
          .update({ saldo: saldoSaatIni - potongan })
          .eq('id', mitra.id);
      }

      setIsTimerRunning(false);
      setCurrentPesanan(null);
      setTimer(0);
      
      // Show invoice popup
      toast.success(`Pekerjaan selesai! Invoice: ${formatCurrency(sisaSetelahPotongan)}`);
      
      loadData();
      setActiveMenu('riwayat');
    } catch (error) {
      toast.error('Gagal menyelesaikan pekerjaan');
    }
  };

  const handleTopupRequest = async (nominal: number) => {
    try {
      const { error } = await supabase
        .from('topup')
        .insert([{
          mitra_id: mitra.id,
          nominal: nominal,
          wa: mitra.wa
        }]);

      if (error) throw error;

      toast.success('Permintaan top-up berhasil dikirim ke admin');
    } catch (error) {
      toast.error('Gagal mengirim permintaan top-up');
    }
  };

  const menuItems = [
    { key: 'pesanan', label: 'Pesanan Masuk', icon: ClipboardList },
    { key: 'pekerjaan', label: 'Pekerjaan Saya', icon: Briefcase },
    { key: 'riwayat', label: 'Riwayat', icon: History },
    { key: 'saldo', label: 'Saldo', icon: Wallet },
    { key: 'tagihan', label: 'Tagihan', icon: Receipt },
    { key: 'akun', label: 'Akun', icon: User },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'pesanan':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Pesanan Masuk</h2>
            {pesananMasuk.length === 0 ? (
              <p className="text-muted-foreground">Tidak ada pesanan masuk</p>
            ) : (
              pesananMasuk.map(pesanan => (
                <Card key={pesanan.id} className="shadow-soft">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">{pesanan.deskripsi}</h3>
                        <Badge variant="secondary">{formatCurrency(pesanan.tarif)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{pesanan.alamat}</p>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleTerimaPesanan(pesanan.id)}
                          className="flex-1"
                        >
                          Terima
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => handleTolakPesanan(pesanan.id)}
                          className="flex-1"
                        >
                          Tolak
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        );

      case 'pekerjaan':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Pekerjaan Saya</h2>
            {isTimerRunning && (
              <Card className="bg-gradient-primary text-white shadow-medium">
                <CardContent className="p-4 text-center">
                  <h3 className="text-2xl font-bold">{formatTime(timer)}</h3>
                  <p className="text-sm opacity-90">Sedang bekerja</p>
                  <Button 
                    variant="secondary"
                    onClick={handleSelesaiBekerja}
                    className="mt-3"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Selesai
                  </Button>
                </CardContent>
              </Card>
            )}
            {pekerjaanSaya.length === 0 ? (
              <p className="text-muted-foreground">Tidak ada pekerjaan aktif</p>
            ) : (
              pekerjaanSaya.map(pesanan => (
                <Card key={pesanan.id} className="shadow-soft">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">{pesanan.deskripsi}</h3>
                        <Badge>{pesanan.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{pesanan.alamat}</p>
                      <p className="font-semibold">{formatCurrency(pesanan.tarif)}</p>
                      {pesanan.status === 'diterima' && (
                        <Button 
                          onClick={() => handleMulaiBekerja(pesanan)}
                          className="w-full"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Mulai Bekerja
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        );

      case 'riwayat':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Riwayat Pesanan</h2>
            {riwayatPesanan.length === 0 ? (
              <p className="text-muted-foreground">Belum ada riwayat pesanan</p>
            ) : (
              riwayatPesanan.map(pesanan => (
                <Card key={pesanan.id} className="shadow-soft">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">{pesanan.deskripsi}</h3>
                        <Badge variant="outline">Selesai</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{pesanan.alamat}</p>
                      <p className="font-semibold">{formatCurrency(pesanan.tarif)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(pesanan.waktu_selesai).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        );

      case 'saldo':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Saldo Saya</h2>
            <Card className="shadow-soft">
              <CardContent className="p-6 text-center">
                <h3 className="text-3xl font-bold text-primary">
                  {formatCurrency(mitra.saldo || 0)}
                </h3>
                <p className="text-muted-foreground mt-2">Saldo tersedia</p>
              </CardContent>
            </Card>
            <div className="space-y-2">
              <h3 className="font-semibold">Request Top-up</h3>
              <div className="grid grid-cols-2 gap-2">
                {[50000, 100000, 200000, 500000].map(amount => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => handleTopupRequest(amount)}
                    className="h-auto py-3"
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'tagihan':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Tagihan</h2>
            {tagihan.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="p-6 text-center">
                  <p className="text-success font-semibold">Tidak Ada Tagihan Saat Ini</p>
                </CardContent>
              </Card>
            ) : (
              tagihan.map(item => (
                <Card key={item.id} className="shadow-soft">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold">{item.jenis_tagihan}</h3>
                        <Badge variant="destructive">{formatCurrency(item.jumlah)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.tanggal).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        );

      case 'akun':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Akun Saya</h2>
            <Card className="shadow-soft">
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nama</label>
                  <p className="font-semibold">{mitra.nama}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="font-semibold">{mitra.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">WhatsApp</label>
                  <p className="font-semibold">{mitra.wa}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge 
                    variant={mitra.status_verifikasi === 'aktif' ? 'default' : 'secondary'}
                  >
                    {mitra.status_verifikasi}
                  </Badge>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={onLogout}
                  className="w-full"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={smartcareLogo} alt="Logo" className="w-8 h-8" />
            <div>
              <h1 className="font-bold">Mitra SmartCare</h1>
              <p className="text-sm opacity-90">{mitra.nama}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-medium">
        <div className="grid grid-cols-3 gap-1 p-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <Button
                key={item.key}
                variant={activeMenu === item.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveMenu(item.key as MenuType)}
                className="flex flex-col h-auto py-2 px-1"
              >
                <Icon className="w-4 h-4 mb-1" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Bottom spacing for navigation */}
      <div className="h-20"></div>
    </div>
  );
};