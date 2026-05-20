"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function Modul2() {
  const router = useRouter();
  const CURRENT_MODUL_ID = 2; // Mengacu pada Modul 2

  const [siswaId, setSiswaId] = useState(null);
  const [currentSesi, setCurrentSesi] = useState(1);
  const [loading, setLoading] = useState(true);

  // State menampung seluruh data materi dari Supabase
  const [allMateri, setAllMateri] = useState([]);

  // ========================================================
  // STATE MINI GAME INTERAKTIF: ARSITEK JARINGAN (SESI 3)
  // ========================================================
  const [deviceTerpilih, setDeviceTerpilih] = useState(null);
  const [koneksiTercatat, setKoneksiTercatat] = useState({}); // Format: { namaDevice: namaFungsi }
  const [gameSelesai, setGameSelesai] = useState(false);
  const [feedbackGame, setFeedbackGame] = useState("");

  const perangkatList = [
    { id: "dev_router", nama: "🌐 Router" },
    { id: "dev_switch", nama: "🎛️ Switch" },
    { id: "dev_server", nama: "🖥️ Server" },
  ];

  const fungsiList = [
    { id: "f_internet", teks: "Gerbang Hubung ke Internet Luar" },
    { id: "f_lan", teks: "Distribusi Data Pintar ke Banyak PC" },
    { id: "f_dhcp", teks: "Pusat Data & Pembagi IP Address" },
  ];

  // Kunci Jawaban Benar
  const kunciJawabanGame = {
    dev_router: "f_internet",
    dev_switch: "f_lan",
    dev_server: "f_dhcp",
  };

  // 1. Cek Login & Tarik Seluruh Materi Modul 2 dari Supabase
  useEffect(() => {
    const savedId = localStorage.getItem("netlearn_siswa_id");
    if (!savedId) {
      router.push("/");
    } else {
      setSiswaId(savedId);
      ambilSemuaMateri();
    }
  }, [router]);

  const ambilSemuaMateri = async () => {
    const { data, error } = await supabase
      .from("modul_materi")
      .select("*")
      .eq("modul_id", CURRENT_MODUL_ID)
      .order("urutan", { ascending: true });

    if (data) {
      setAllMateri(data);
    } else {
      console.error("Gagal mengambil materi Modul 2:", error);
    }
    setLoading(false);
  };

  // Filter materi berdasarkan sesi yang sedang aktif di layar
  const materiSesiAktif = allMateri.filter((m) => m.sesi_id === currentSesi);

  // 2. Fungsi Simpan Progress Siswa (Sinkron ke tabel relasi & user_progress)
  const simpanProgressKeSupabase = async (sesiSelesai) => {
    if (!siswaId) return;

    try {
      // Ambil data lama di user_progress
      const { data: siswa } = await supabase
        .from("user_progress")
        .select("materi_modul2_selesai")
        .eq("id", siswaId)
        .single();

      if (siswa && sesiSelesai > siswa.materi_modul2_selesai) {
        // Update di tabel utama
        await supabase
          .from("user_progress")
          .update({ materi_modul2_selesai: sesiSelesai })
          .eq("id", siswaId);
      }

      // Jalankan upsert backup ke tabel relasi siswa_progress_modul
      await supabase.from("siswa_progress_modul").upsert(
        {
          siswa_id: siswaId,
          modul_id: CURRENT_MODUL_ID,
          materi_sesi_selesai: sesiSelesai,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "siswa_id,modul_id" },
      );
    } catch (err) {
      console.error("Gagal menyimpan progress:", err);
    }
  };

  const handleNextSesi = async () => {
    await simpanProgressKeSupabase(currentSesi);
    if (currentSesi < 3) {
      setCurrentSesi(currentSesi + 1);
      window.scrollTo(0, 0);
    } else {
      router.push("/");
    }
  };

  // ========================================================
  // LOGIKA UTAMA MINI GAME KLIK & SAMBUNG KABEL
  // ========================================================
  const handleKlikDevice = (deviceId) => {
    if (gameSelesai) return;
    setDeviceTerpilih(deviceId);
  };

  const handleKlikFungsi = (fungsiId) => {
    if (!deviceTerpilih || gameSelesai) return;

    // Catat sambungan kabel baru (menimpa jika device tersebut dipasangkan ke fungsi lain)
    const updateKoneksi = { ...koneksiTercatat, [deviceTerpilih]: fungsiId };
    setKoneksiTercatat(updateKoneksi);
    setDeviceTerpilih(null); // Reset pilihan device

    // Cek apakah seluruh 3 alat sudah ditarik kabelnya
    if (Object.keys(updateKoneksi).length === 3) {
      periksaSeluruhKabel(updateKoneksi);
    }
  };

  const periksaSeluruhKabel = (susunanKabel) => {
    let semuaBenar = true;

    for (const devId in kunciJawabanGame) {
      if (susunanKabel[devId] !== kunciJawabanGame[devId]) {
        semuaBenar = false;
        break;
      }
    }

    if (semuaBenar) {
      setGameSelesai(true);
      setFeedbackGame(
        "🎉 LUAR BIASA! Semua kabel terhubung dengan sempurna. Aliran data lancar, alamat IP terbagi rata, dan jaringan simulasi sekarang AKTIF dan bisa terhubung ke Internet! 🚀",
      );
    } else {
      setFeedbackGame(
        "❌ Jaringan masih lumpuh / tabrakan data! Beberapa alat dipasang ke jalur kabel fungsi yang salah. Yuk, reset kabel dan susun kembali jalurnya!",
      );
    }
  };

  const resetGame = () => {
    setKoneksiTercatat({});
    setDeviceTerpilih(null);
    setGameSelesai(false);
    setFeedbackGame("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">
            Menghubungkan ke database materiModul 2...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 pb-24 max-w-md mx-auto">
      {/* Tombol Kembali */}
      <div className="mb-4">
        <Link
          href="/"
          className="text-sm font-semibold text-blue-600 flex items-center gap-1"
        >
          ← Kembali ke Dashboard
        </Link>
      </div>

      {/* Header Modul */}
      <header className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">
          Modul 2
        </span>
        <h1 className="text-xl font-bold text-gray-800 mt-2">
          Perangkat Jaringan Komputer
        </h1>

        <div className="flex gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${s <= currentSesi ? "bg-blue-600" : "bg-gray-200"}`}
            ></div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2 font-medium">
          Sesi {currentSesi} dari 3 Sesi Materi
        </p>
      </header>

      {/* ISI KONTEN DINAMIS BERDASARKAN SESI */}
      <div className="space-y-6">
        {materiSesiAktif.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl text-center border text-gray-400 text-xs py-10">
            Bahan ajar Modul 2 belum diisi di database `modul_materi`.
          </div>
        ) : (
          materiSesiAktif.map((materi) => (
            <article
              key={materi.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-gray-700 space-y-4 leading-relaxed animate-fadeIn"
            >
              <h2 className="text-lg font-bold text-gray-800">
                {materi.judul}
              </h2>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {materi.konten_teks}
              </p>

              {/* MEDIA GAMBAR / PDF CONTAINER */}
              {/* MEDIA GAMBAR / PDF CONTAINER */}
              {materi.link_gambar && (
                <div className="w-full rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-slate-50">
                  {materi.link_gambar.toLowerCase().includes(".pdf") ? (
                    <div className="w-full flex flex-col">
                      {/* Container Embed PDF Langsung Menggunakan Tag Native HTML */}
                      <div className="w-full h-[450px] bg-white relative">
                        <object
                          data={materi.link_gambar}
                          type="application/pdf"
                          className="w-full h-full"
                        >
                          {/* Alternatif Fallback jika browser sangat jadul tidak mendukung embed PDF */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-50">
                            <span className="text-3xl mb-2">📄</span>
                            <p className="text-xs text-gray-500 font-medium mb-3">
                              Browser Anda tidak mendukung pratinjau PDF
                              langsung.
                            </p>
                          </div>
                        </object>
                      </div>

                      {/* Tombol Akses Cepat */}
                      <div className="p-3 bg-slate-100 border-t border-gray-200 flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-bold truncate max-w-[180px]">
                          📄 {materi.judul || "Materi_Belajar"}.pdf
                        </span>
                        <a
                          href={materi.link_gambar}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm active:scale-95"
                        >
                          📂 Buka Tab Baru / Download
                        </a>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={materi.link_gambar}
                      alt={materi.judul}
                      className="w-full max-h-60 object-contain mx-auto p-2"
                    />
                  )}
                </div>
              )}

              {/* MEDIA VIDEO YOUTUBE CONTAINER */}
              {materi.link_video && (
                <div className="aspect-video w-full rounded-xl overflow-hidden shadow-md border border-slate-100 my-2">
                  <iframe
                    className="w-full h-full"
                    src={materi.link_video}
                    title="Video Pembelajaran"
                    frameBorder="0"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
            </article>
          ))
        )}

        {/* ========================================================
            TAMBAHAN KHUSUS: MISI KONSEP ABSTRAK (SESI 3)
           ======================================================== */}
        {currentSesi === 3 && (
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800 mt-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🛠️</span>
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                Misi: Arsitek Kabel Jaringan
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              🚨 Tantangan: Hubungkan setiap komponen fisik infrastruktur
              berikut ke fungsi logisnya agar komputer client dapat menerima IP
              Address terpusat dan berlayar di internet!
              <br />
              <br />
              <span className="text-amber-300 font-semibold">
                Cara Bermain:
              </span>{" "}
              Klik nama alat di kolom kiri, lalu klik kotak fungsi pasangannya
              di kolom kanan untuk menyambung kabel.
            </p>

            <div className="grid grid-cols-2 gap-4 items-start">
              {/* KOLOM KIRI: PERANGKAT */}
              <div className="space-y-2.5">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 text-center">
                  Pilih Komponen
                </p>
                {perangkatList.map((dev) => {
                  const terhubungKe = koneksiTercatat[dev.id];
                  const isSelesai =
                    Object.keys(koneksiTercatat).length === 3 && gameSelesai;

                  return (
                    <button
                      key={dev.id}
                      onClick={() => handleKlikDevice(dev.id)}
                      disabled={gameSelesai}
                      className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all relative ${
                        deviceTerpilih === dev.id
                          ? "bg-amber-600 border-amber-400 text-white shadow-md scale-105"
                          : terGridColor(terhubungKe, isSelesai)
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{dev.nama}</span>
                        {terhubungKe && (
                          <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                            🔌 Tersambung
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* KOLOM KANAN: FUNGSI */}
              <div className="space-y-2.5">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 text-center">
                  Tujuan Jalur Kabel
                </p>
                {fungsiList.map((fungs) => {
                  // Cari tahu perangkat mana saja yang dicolokkan ke fungsi ini
                  const devPenyambung = Object.keys(koneksiTercatat).find(
                    (key) => koneksiTercatat[key] === fungs.id,
                  );
                  const namaDevPenyambung = perangkatList.find(
                    (d) => d.id === devPenyambung,
                  )?.nama;

                  return (
                    <button
                      key={fungs.id}
                      onClick={() => handleKlikFungsi(fungs.id)}
                      disabled={!deviceTerpilih || gameSelesai}
                      className={`w-full p-2.5 h-[52px] rounded-xl border text-center text-[11px] font-medium leading-tight transition-all flex flex-col justify-center items-center ${
                        devPenyambung
                          ? "bg-blue-950/80 border-blue-700 text-blue-200"
                          : "bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800"
                      } ${deviceTerpilih ? "border-dashed border-amber-500/60 animate-pulse" : ""}`}
                    >
                      {devPenyambung ? (
                        <div className="text-center">
                          <span className="block text-[9px] text-slate-400 line-clamp-1">
                            Kabel dari:
                          </span>
                          <span className="font-bold text-amber-400 text-xs">
                            {namaDevPenyambung}
                          </span>
                        </div>
                      ) : (
                        <span>{fungs.teks}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FEEDBACK BOX */}
            {feedbackGame && (
              <div
                className={`mt-5 p-3 rounded-xl text-xs leading-relaxed border transition-all ${gameSelesai ? "bg-green-950/50 border-green-700 text-green-300" : "bg-red-950/50 border-red-800 text-red-300"}`}
              >
                <p>{feedbackGame}</p>
                {!gameSelesai && (
                  <button
                    onClick={resetGame}
                    className="mt-2.5 bg-red-800/80 hover:bg-red-700 text-white font-bold px-3 py-1 rounded-md text-[10px] uppercase"
                  >
                    🔄 Gunting & Atur Ulang Kabel
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER NAVIGASI */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 flex justify-between items-center max-w-md mx-auto rounded-t-2xl shadow-xl">
        <button
          disabled={currentSesi === 1}
          onClick={() => setCurrentSesi(currentSesi - 1)}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold ${currentSesi === 1 ? "text-gray-300 bg-gray-50" : "text-gray-600 bg-slate-100 active:scale-95 transition-transform"}`}
        >
          Kembali
        </button>

        <button
          onClick={handleNextSesi}
          disabled={currentSesi === 3 && !gameSelesai}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all ${currentSesi === 3 && !gameSelesai ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-600 text-white active:scale-95 transition-transform"}`}
        >
          {currentSesi === 3 ? "Selesai & Keluar" : "Lanjut Sesi"}
        </button>
      </div>
    </main>
  );
}

// Helper styling dinamis kartu komponen kiri
function terGridColor(terhubung, gameSelesai) {
  if (terhubung) {
    return gameSelesai
      ? "bg-green-900/60 border-green-600 text-green-200"
      : "bg-slate-800 border-slate-700 text-slate-400";
  }
  return "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200";
}
