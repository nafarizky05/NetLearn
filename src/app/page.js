"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import TourGuide from "@/components/TourGuide";

export default function Home() {
  const [authMode, setAuthMode] = useState("login"); // Pilihan: "login" atau "register"
  
  // State Input Form
  const [namaInput, setNamaInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const [siswa, setSiswa] = useState(null);
  const [daftarModul, setDaftarModul] = useState([]);
  const [progressSiswa, setProgressSiswa] = useState({});
  const [attemptCounts, setAttemptCounts] = useState({});

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const savedId = localStorage.getItem("netlearn_siswa_id");
    if (savedId) {
      ambilDataLengkapSiswa(savedId);
    } else {
      setLoading(false);
    }
  }, []);

  const ambilDataLengkapSiswa = async (idSiswa) => {
    setLoading(true);
    try {
      const { data: dataSiswa } = await supabase
        .from("user_progress")
        .select("*")
        .eq("id", idSiswa)
        .single();

      if (!dataSiswa) {
        localStorage.removeItem("netlearn_siswa_id");
        setLoading(false);
        return;
      }
      setSiswa(dataSiswa);

      const { data: modulData } = await supabase
        .from("master_modul")
        .select("*")
        .order("urutan", { ascending: true });
      setDaftarModul(modulData || []);

      const { data: progressData } = await supabase
        .from("siswa_progress_modul")
        .select("*")
        .eq("siswa_id", idSiswa);
      const mapProgress = {};
      progressData?.forEach((prog) => {
        mapProgress[prog.modul_id] = prog;
      });
      setProgressSiswa(mapProgress);

      const { data: attemptData } = await supabase
        .from("kuis_attempts")
        .select("modul_id")
        .eq("siswa_id", idSiswa);
      const mapAttempts = {};
      attemptData?.forEach((att) => {
        mapAttempts[att.modul_id] = (mapAttempts[att.modul_id] || 0) + 1;
      });
      setAttemptCounts(mapAttempts);

    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!namaInput.trim() || !passwordInput.trim()) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const { data: user } = await supabase
      .from("user_progress")
      .select("*")
      .eq("nama_siswa", namaInput.trim())
      .eq("password", passwordInput.trim())
      .maybeSingle();

    if (user) {
      localStorage.setItem("netlearn_siswa_id", user.id);
      await ambilDataLengkapSiswa(user.id);
    } else {
      setErrorMsg("Nama atau Password salah. Periksa kembali data Anda.");
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!namaInput.trim() || !passwordInput.trim()) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { data: userLama } = await supabase
        .from("user_progress")
        .select("id")
        .eq("nama_siswa", namaInput.trim())
        .maybeSingle();

      if (userLama) {
        setErrorMsg("Nama siswa sudah terdaftar. Gunakan nama lain.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("user_progress").insert([
        {
          nama_siswa: namaInput.trim(),
          password: passwordInput.trim(),
          materi_modul1_selesai: 0,
          materi_modul2_selesai: 0,
          skor_modul1: null,
          skor_modul2: null,
        },
      ]);

      if (error) throw error;

      setSuccessMsg("Akun berhasil dibuat! Silakan masuk menggunakan akun baru Anda.");
      setAuthMode("login");
      setPasswordInput("");
    } catch (err) {
      console.error("Gagal registrasi:", err);
      setErrorMsg("Terjadi kesalahan sistem saat mendaftar.");
    } finally {
      setLoading(false);
    }
  };

  const gantiModeAuth = (mode) => {
    setErrorMsg("");
    setSuccessMsg("");
    setNamaInput("");
    setPasswordInput("");
    setAuthMode(mode);
  };

  if (!hasMounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-slate-400 font-medium text-xs tracking-wider uppercase">Memuat halaman...</p>
        </div>
      </div>
    );
  }

  // ====================================================================
  // GERBANG 1: AUTHENTICATION SCREEN (SINGLE FLOATING CARD)
  // ====================================================================
  if (!siswa) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Dekorasi Ornamen Background Bulat Halus (Sesuai gambar referensi) */}
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header Aplikasi Mini */}
        <div className="mb-8 text-center relative z-10">
          <h1 className="text-2xl font-black tracking-widest text-white uppercase">NetLearn</h1>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wider mt-1 uppercase">Platform Edukasi Jaringan Komputer</p>
        </div>

        {/* Card Utama (Akan berganti isi sesuai state authMode) */}
        <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-md p-8 rounded-3xl shadow-2xl relative z-10 transition-all duration-300 hover:border-white/25">
          
          {/* Notifikasi Internal Card */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium text-center">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-medium text-center">
              {successMsg}
            </div>
          )}

          {authMode === "login" ? (
            /* =========================================================
               TAMPILAN CARD: LOG IN
               ========================================================= */
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Portal Masuk</span>
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              </div>
              
              <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Log in</h2>
              <p className="text-xs text-slate-400 mb-6 font-medium">Gunakan akun Anda untuk mengakses dashboard belajar.</p>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Siswa</label>
                  <input
                    type="text"
                    placeholder="Masukkan nama lengkap..."
                    value={namaInput}
                    onChange={(e) => setNamaInput(e.target.value)}
                    className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Kata Sandi</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
                    required
                  />
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl text-xs font-bold tracking-wide mt-6 transition-all shadow-lg active:scale-[0.99]">
                  Masuk Sekarang
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <p className="text-xs text-slate-400">
                  Belum memiliki akun?{" "}
                  <button onClick={() => gantiModeAuth("register")} className="text-blue-400 hover:underline font-bold transition-all">
                    Register di sini
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* =========================================================
               TAMPILAN CARD: CREATE ACCOUNT (REGISTER)
               ========================================================= */
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Pendaftaran</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              
              <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Create Account</h2>
              <p className="text-xs text-slate-400 mb-6 font-medium">Daftarkan nama Anda untuk merekam riwayat kuis.</p>
              
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Lengkap Siswa</label>
                  <input
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={namaInput}
                    onChange={(e) => setNamaInput(e.target.value)}
                    className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-white/10 transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Buat Kata Sandi</label>
                  <input
                    type="password"
                    placeholder="Minimal 4 karakter..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-white/10 transition-all"
                    required
                  />
                </div>

                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-xl text-xs font-bold tracking-wide mt-6 transition-all shadow-lg active:scale-[0.99]">
                  Daftarkan Akun
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <p className="text-xs text-slate-400">
                  Sudah memiliki akun?{" "}
                  <button onClick={() => gantiModeAuth("login")} className="text-emerald-400 hover:underline font-bold transition-all">
                    Log in di sini
                  </button>
                </p>
              </div>
            </div>
          )}

        </div>
      </main>
    );
  }

  // ====================================================================
  // GERBANG 2: MAIN DASHBOARD SCREEN (JIKA SUDAH LOG IN)
  // ====================================================================
  return (
    <main className="min-h-screen bg-slate-50 p-4 pb-10 max-w-md mx-auto relative">
      <TourGuide />

    <header 
      id="step-welcome" 
      className="rounded-2xl p-6 mb-6 text-white shadow-lg relative overflow-hidden bg-slate-800 bg-cover bg-center"
      style={{ 
        backgroundImage: `linear-gradient(to bottom, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.75)), url('https://sbrbrdgpdsneorgjanfr.supabase.co/storage/v1/object/public/materi-pdf/header1.png')` 
      }}
    >
      {/* Efek gradasi pendaran cahaya tambahan */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-amber-500/10 pointer-events-none"></div>

      {/* Konten teks diletakkan di dalam container tersendiri agar tidak menabrak tombol */}
      <div className="relative z-10 pr-16"> 
        <h1 className="text-2xl font-bold tracking-tight">Belajar Sekarang, Hebat Kemudian</h1>
        <p className="text-slate-200 text-sm mt-1 font-medium">
          Halo, <span className="font-bold underline decoration-amber-400 decoration-2">{siswa.nama_siswa}</span>
        </p>
      </div>

      {/* Tombol Logout diposisikan absolut di pojok kanan atas */}
      <button
        onClick={() => {
          localStorage.removeItem("netlearn_siswa_id");
          localStorage.removeItem("netlearn_tour_selesai");
          setSiswa(null);
          setNamaInput("");
          setPasswordInput("");
          setAuthMode("login");
        }}
        className="absolute top-4 right-4 text-xs bg-black/30 hover:bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg font-bold transition-all z-20 border border-white/10 active:scale-95"
      >
        Logout
      </button>
    </header>

      {/* LOOPING CARD MODUL BERDASARKAN DATABASE */}
      <div className="grid gap-6">
        {daftarModul.map((modul, index) => {
          const progressDinamis = progressSiswa[modul.id] || {};
          const attempts = attemptCounts[modul.id] || 0;

          let prog = {
            materi_sesi_selesai: progressDinamis.materi_sesi_selesai || 0,
            skor_kuis_terakhir: progressDinamis.skor_kuis_terakhir !== undefined ? progressDinamis.skor_kuis_terakhir : null,
          };

          if (modul.urutan === 1) {
            prog.materi_sesi_selesai = siswa.materi_modul1_selesai || 0;
            prog.skor_kuis_terakhir = siswa.skor_modul1 !== undefined && siswa.skor_modul1 !== null ? siswa.skor_modul1 : progressDinamis.skor_kuis_terakhir !== undefined ? progressDinamis.skor_kuis_terakhir : null;
          } else if (modul.urutan === 2) {
            prog.materi_sesi_selesai = siswa.materi_modul2_selesai || 0;
            prog.skor_kuis_terakhir = siswa.skor_modul2 !== undefined && siswa.skor_modul2 !== null ? siswa.skor_modul2 : progressDinamis.skor_kuis_terakhir !== undefined ? progressDinamis.skor_kuis_terakhir : null;
          }

          let isLocked = false;
          if (index > 0) {
            const modulSebelumnya = daftarModul[index - 1];
            let skorSebelumnya = 0;

            if (modulSebelumnya.urutan === 1) {
              skorSebelumnya = siswa.skor_modul1 !== null ? siswa.skor_modul1 : progressSiswa[modulSebelumnya.id]?.skor_kuis_terakhir || 0;
            } else if (modulSebelumnya.urutan === 2) {
              skorSebelumnya = siswa.skor_modul2 !== null ? siswa.skor_modul2 : progressSiswa[modulSebelumnya.id]?.skor_kuis_terakhir || 0;
            } else {
              skorSebelumnya = progressSiswa[modulSebelumnya.id]?.skor_kuis_terakhir || 0;
            }

            if (skorSebelumnya < 70) isLocked = true;
          }

          return (
            <div
              key={modul.id}
              id={modul.urutan === 1 ? "step-modul" : undefined}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${isLocked ? "bg-gray-100/70 border-dashed border-gray-200 opacity-60" : "bg-white border-gray-100 shadow-sm"}`}
            >
              <div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${isLocked ? "bg-gray-200 text-gray-500" : "bg-blue-50 text-blue-600"}`}>Modul {modul.urutan}</span>
                  {isLocked && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">🔒 Terkunci</span>}
                </div>
                <h2 className="font-bold text-gray-800 text-base mt-2">{modul.judul_modul}</h2>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{modul.deskripsi}</p>
              </div>

              {!isLocked && (
                <div className="mt-4 space-y-4">
                  <hr className="border-gray-100" />
                  <div id={modul.urutan === 1 ? "step-progress" : undefined} className="text-xs text-gray-500 p-1 rounded">
                    <div className="flex justify-between mb-1 font-medium">
                      <span>Progress Belajar:</span>
                      <span className="font-bold text-gray-700">{prog.materi_sesi_selesai} / 3 Sesi</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full transition-all" style={{ width: `${(prog.materi_sesi_selesai / 3) * 100}%` }}></div>
                    </div>
                  </div>

                  <div id={modul.urutan === 1 ? "step-kuis" : undefined} className="bg-slate-50 p-3 rounded-xl text-xs space-y-1.5 border border-slate-100">
                    <div className="flex justify-between text-gray-600 font-medium">
                      <span>Skor Terakhir:</span>
                      <span className={`font-bold ${prog.skor_kuis_terakhir >= 70 ? "text-green-600" : "text-gray-700"}`}>{prog.skor_kuis_terakhir !== null ? `${prog.skor_kuis_terakhir}%` : "Belum Ujian"}</span>
                    </div>
                    <div className="flex justify-between text-gray-400 text-[11px]">
                      <span>Batas Percobaan:</span>
                      <span className={`font-bold ${attempts >= 3 ? "text-red-500" : "text-gray-600"}`}>{attempts} / 3</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <Link href={`/modul${modul.urutan}`} className="w-full">
                      <button className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform">Lanjut Belajar</button>
                    </Link>

                    {attempts >= 3 && (prog.skor_kuis_terakhir || 0) < 70 ? (
                      <button disabled className="w-full bg-gray-100 text-gray-400 py-2.5 rounded-xl text-xs font-bold border cursor-not-allowed">
                        Percobaan Habis (Terkunci)
                      </button>
                    ) : (
                      <Link href={`/kuis${modul.urutan}`} className="w-full">
                        <button className="w-full bg-slate-100 border text-slate-700 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform text-center">Ambil Evaluasi Kuis</button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}