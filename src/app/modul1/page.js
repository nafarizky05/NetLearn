"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function Modul1() {
  const router = useRouter();
  const [siswaId, setSiswaId] = useState(null);
  const [currentSesi, setCurrentSesi] = useState(1);
  const [loading, setLoading] = useState(true);

  // State menampung seluruh data materi dari Supabase
  const [allMateri, setAllMateri] = useState([]);

  // State untuk Mini Game Interaktif Konsep Abstrak (Sesi 3)
  const [jawabanTerpilih, setJawabanTerpilih] = useState(null);
  const [gameSelesai, setGameSelesai] = useState(false);

  // 1. Cek Login & Tarik Seluruh Materi Modul 1 dari Supabase
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
    // Menarik seluruh data materi untuk Modul 1 sekaligus
    const { data, error } = await supabase
      .from("modul_materi")
      .select("*")
      .eq("modul_id", 1)
      .order("urutan", { ascending: true });

    if (data) {
      setAllMateri(data);
    } else {
      console.error("Gagal mengambil materi:", error);
    }
    setLoading(false);
  };

  // Filter materi berdasarkan sesi yang sedang aktif di layar
  const materiSesiAktif = allMateri.filter((m) => m.sesi_id === currentSesi);

  // 2. Fungsi Simpan Progress Siswa
  const simpanProgressKeSupabase = async (sesiSelesai) => {
    if (!siswaId) return;

    const { data: siswa } = await supabase
      .from("user_progress")
      .select("materi_modul1_selesai")
      .eq("id", siswaId)
      .single();

    if (siswa && sesiSelesai > siswa.materi_modul1_selesai) {
      await supabase
        .from("user_progress")
        .update({ materi_modul1_selesai: sesiSelesai })
        .eq("id", siswaId);
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

  // Skenario Game Interaktif Konsep Abstrak
  const skenarioGame = {
    pertanyaan:
      "🚨 Studi Kasus: Laboratorium Komputer SMK 1 tiba-tiba lumpuh total dan tidak ada satu pun komputer yang bisa terhubung ke internet setelah kabel utama di pojok ruangan tersenggol hingga putus. Berdasarkan karakteristiknya, topologi apa yang digunakan di laboratorium tersebut?",
    opsi: [
      { key: "star", teks: "Topologi Star" },
      { key: "bus", teks: "Topologi Bus" },
      { key: "ring", teks: "Topologi Ring" },
    ],
    benar: "bus",
    penjelasanBenar:
      "🎉 Benar Sekali! Topologi Bus menggunakan satu kabel utama (backbone). Jika kabel utama tersebut putus atau rusak, maka seluruh jaringan komunikasi antar perangkat akan mati total (lumpuh).",
    penjelasanSalah:
      "❌ Kurang Tepat! Ingat, ciri utama topologi ini adalah jika kabel utamanya rusak, seluruh jaringan langsung lumpuh total. Yuk coba analisis opsi lainnya!",
  };

  const handleCekJawaban = (kunci) => {
    setJawabanTerpilih(kunci);
    if (kunci === skenarioGame.benar) {
      setGameSelesai(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">
            Menghubungkan ke database materi...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 pb-24">
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
          Modul 1
        </span>
        <h1 className="text-xl font-bold text-gray-800 mt-2">
          Dasar Jaringan Komputer
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
        {/* Render otomatis kartu materi dari database */}
        {materiSesiAktif.map((materi) => (
          <article
            key={materi.id}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-gray-700 space-y-4 leading-relaxed"
          >
            <h2 className="text-lg font-bold text-gray-800">{materi.judul}</h2>
            <p className="text-sm text-gray-600">{materi.konten_teks}</p>

            {/* KOMPONEN 1: JIKA ADA GAMBAR (Misal Kartu Topologi Sesi 3 atau PDF Dummy Sesi 2) */}
            {materi.link_gambar && (
              <div className="w-full rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                {/* Deteksi jika link_gambar diakhiri teks PDF, kita bisa gunakan iframe viewer */}
                {materi.link_gambar.includes(".pdf") ||
                materi.sub_materi_key === "jangkauan" ? (
                  <div className="w-full h-[350px]">
                    <iframe
                      src={`https://docs.google.com/viewer?url=${materi.link_gambar}&embedded=true`}
                      className="w-full h-full border-0"
                      title="File PDF Materi"
                    ></iframe>
                  </div>
                ) : (
                  <img
                    src={materi.link_gambar}
                    alt={materi.judul}
                    className="w-full max-h-60 object-cover"
                  />
                )}
              </div>
            )}

            {/* KOMPONEN 2: JIKA ADA EMBED VIDEO YOUTUBE (Misal di Sesi 1) */}
            {materi.link_video && (
              <div className="aspect-video w-full rounded-xl overflow-hidden shadow-md border border-slate-100 my-2">
                <iframe
                  className="w-full h-full"
                  src={materi.link_video}
                  title="Video Pembelajaran"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </article>
        ))}

        {/* Tambahan Khusus Misi Konsep Abstrak jika berada di Sesi 3 */}
        {currentSesi === 3 && (
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800 mt-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🕵️‍♂️</span>
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                Misi: Detektif Jaringan
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              {skenarioGame.pertanyaan}
            </p>

            <div className="grid gap-2">
              {skenarioGame.opsi.map((opsi) => {
                let buttonStyle =
                  "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200";
                if (jawabanTerpilih === opsi.key) {
                  buttonStyle =
                    opsi.key === skenarioGame.benar
                      ? "bg-green-600 border-green-500 text-white font-bold animate-pulse"
                      : "bg-red-600 border-red-500 text-white font-bold";
                }
                return (
                  <button
                    key={opsi.key}
                    onClick={() => handleCekJawaban(opsi.key)}
                    disabled={gameSelesai}
                    className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex justify-between items-center ${buttonStyle}`}
                  >
                    <span>{opsi.teks}</span>
                    {jawabanTerpilih === opsi.key &&
                      (opsi.key === skenarioGame.benar ? "✅" : "❌")}
                  </button>
                );
              })}
            </div>

            {jawabanTerpilih && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs leading-relaxed border ${jawabanTerpilih === skenarioGame.benar ? "bg-green-950/40 border-green-800/60 text-green-300" : "bg-red-950/40 border-red-800/60 text-red-300"}`}
              >
                {jawabanTerpilih === skenarioGame.benar
                  ? skenarioGame.penjelasanBenar
                  : skenarioGame.penjelasanSalah}
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
