"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function KuisModul2() {
  const router = useRouter();
  const [siswaId, setSiswaId] = useState(null);
  const [loading, setLoading] = useState(true);

  // State Utama Soal & Progress
  const [soalList, setSoalList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [jawabanSiswa, setJawabanSiswa] = useState({}); // format: { [id_soal]: "Teks Jawaban" }
  const [attemptCount, setAttemptCount] = useState(0);
  const [isMaxAttempt, setIsMaxAttempt] = useState(false);

  // State Hasil Akhir (Ulasan)
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasilKuis, setHasilKuis] = useState({ skor: 0, benar: 0, salah: 0 });

  useEffect(() => {
    const savedId = localStorage.getItem("netlearn_siswa_id");
    if (!savedId) {
      router.push("/");
    } else {
      setSiswaId(savedId);
      inisialisasiKuis(savedId);
    }
  }, [router]);

  // Fungsi memuat data soal (diacak) & memvalidasi jumlah limit percobaan siswa untuk Modul 2
  const inisialisasiKuis = async (idSiswa) => {
    try {
      // 1. Cek berapa kali siswa sudah mengerjakan kuis modul 2
      const { data: attempts, error: errAttempt } = await supabase
        .from("kuis_attempts")
        .select("id")
        .eq("siswa_id", idSiswa)
        .eq("modul_id", 2);

      const totalAttempt = attempts ? attempts.length : 0;
      setAttemptCount(totalAttempt);

      if (totalAttempt >= 3) {
        setIsMaxAttempt(true);
        setLoading(false);
        return;
      }

      // 2. Tarik soal khusus Modul 2 dari Supabase
      const { data: soalData, error: errSoal } = await supabase
        .from("modul_kuis")
        .select("*")
        .eq("modul_id", 2);

      if (soalData && soalData.length > 0) {
        // Algoritma Fisher-Yates untuk mengacak urutan soal secara adil tiap attempt
        const soalAcak = [...soalData];
        for (let i = soalAcak.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [soalAcak[i], soalAcak[j]] = [soalAcak[j], soalAcak[i]];
        }
        setSoalList(soalAcak);
      }
    } catch (err) {
      console.error("Gagal memuat sistem kuis Modul 2:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePilihJawaban = (teksOpsi) => {
    if (isSubmitted) return; // Kunci jawaban jika sudah disubmit
    setJawabanSiswa({
      ...jawabanSiswa,
      [soalList[currentIndex].id]: teksOpsi,
    });
  };

  const handleNext = () => {
    if (currentIndex < soalList.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Logika kalkulasi nilai, feedback konstruktif, dan pengiriman nilai Modul 2 ke Supabase
  const handleSubmitKuis = async () => {
    let benar = 0;
    let salah = 0;

    soalList.forEach((soal) => {
      const jawaban = jawabanSiswa[soal.id];
      const jawabanBersih = jawaban ? jawaban.toString().trim() : "";
      const kunciBenar = soal.jawaban_benar ? soal.jawaban_benar.toString().trim() : "";

      if (jawabanBersih === kunciBenar) {
        benar++;
      } else {
        salah++;
      }
    });

    const totalSoal = soalList.length;
    const skorAkhir = Math.round((benar / totalSoal) * 100);

    const dataHasil = { skor: skorAkhir, benar, salah };
    setHasilKuis(dataHasil);
    setIsSubmitted(true);

    // 1. Catat ke histori pengerjaan kuis (kuis_attempts) untuk modul_id = 2
    await supabase.from('kuis_attempts').insert({
      siswa_id: siswaId,
      modul_id: 2,
      attempt_ke: attemptCount + 1,
      skor: skorAkhir,
      jumlah_benar: benar,
      jumlah_salah: salah,
      jawaban_siswa: jawabanSiswa
    });

    // 2. UPDATE KE USER_PROGRESS (Mengisi kolom skor_modul2)
    await supabase
      .from('user_progress')
      .update({ skor_modul2: skorAkhir })
      .eq('id', siswaId);

    // 3. BACKUP KE TABEL BARU (siswa_progress_modul)
    await supabase
      .from('siswa_progress_modul')
      .upsert({
        siswa_id: siswaId,
        modul_id: 2,
        skor_kuis_terakhir: skorAkhir,
        kuis_selesai: skorAkhir >= 70
      }, { onConflict: 'siswa_id,modul_id' });

    window.scrollTo(0, 0);
  };

  // Fungsi bantu untuk memberikan feedback personal khusus topik Perangkat Jaringan Komputer
  const dapatkanFeedbackDinamis = (skor) => {
    if (skor >= 80)
      return {
        warna: "text-green-700 bg-green-50 border-green-200",
        teks: "🏆 Kerja bagus luar biasa! Kamu sudah memahami fungsi Router, Switch, Server, dan infrastruktur fisik jaringan dengan sangat matang. Pertahankan performamu!",
      };
    if (skor >= 70)
      return {
        warna: "text-blue-700 bg-blue-50 border-blue-200",
        teks: "👍 Pemahamanmu cukup bagus dan kamu berhasil melewati batas minimal kelulusan. Review berkala tipis mengenai perbedaan Switch dan Hub akan membuat ilmumu sempurna!",
      };
    return {
      warna: "text-red-700 bg-red-50 border-red-200",
      teks: "📚 Masih ada beberapa miskonsepsi peran perangkat fisik jaringan yang perlu diperbaiki. Jangan patah semangat! Pelajari ulang materi modul dan manfaatkan token sisa percobaan dengan baik.",
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm font-medium">
            Menyusun lembar soal kuis Modul 2...
          </p>
        </div>
      </div>
    );
  }

  // JIKA TERCAPAI 3 KALI COBA DAN BELUM LULUS
  if (isMaxAttempt && !isSubmitted) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 max-w-md w-full text-center">
          <span className="text-4xl">🔒</span>
          <h2 className="text-xl font-bold text-gray-800 mt-3">
            Batas Percobaan Habis
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Kamu sudah mencapai batas maksimal <strong>3 kali percobaan</strong>{" "}
            untuk Kuis Modul 2. Tombol pengerjaan telah dikunci sistem secara
            otomatis. Silakan hubungi guru pembimbing untuk reset token kuis.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block w-full bg-blue-600 text-white p-3 rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition-colors"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const soalAktif = soalList[currentIndex];
  const progressPersen = soalList.length > 0 ? ((currentIndex + 1) / soalList.length) * 100 : 0;

  return (
    <main className="min-h-screen bg-slate-50 p-4 pb-28 max-w-2xl mx-auto">
      {/* 1. HEADER PROGRESS (Hanya tampil saat kuis berlangsung) */}
      {!isSubmitted && (
        <header className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wide">
              Evaluasi Modul 2
            </span>
            <span className="text-xs font-bold text-gray-500">
              Soal {currentIndex + 1} dari {soalList.length}
            </span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${progressPersen}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-[11px] text-gray-400 font-medium">
              Sisa Percobaan Kuis:{" "}
              <span className="text-gray-700 font-bold">
                {3 - attemptCount}x lagi
              </span>
            </p>
            <span className="text-[11px] bg-amber-50 border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded-md font-semibold">
              Batas Kelulusan: Skala 70
            </span>
          </div>
        </header>
      )}

      {/* 2. HALAMAN REVIEW HASIL AKHIR (SUBMITTED STATE) */}
      {isSubmitted && (
        <section className="space-y-5 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 text-center">
            <span className="text-4xl">
              {hasilKuis.skor >= 70 ? "🎉" : "💪"}
            </span>
            <h2 className="text-xl font-bold text-gray-800 mt-2">
              Hasil Evaluasi Belajarmu
            </h2>

            {/* Nilai Besar */}
            <div className="my-4">
              <span
                className={`text-5xl font-black ${hasilKuis.skor >= 70 ? "text-green-600" : "text-red-500"}`}
              >
                {hasilKuis.skor}
              </span>
              <span className="text-gray-400 text-lg font-semibold">
                {" "}/ 100
              </span>
            </div>

            {/* Statistik Ringkas */}
            <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto text-xs font-bold mb-4">
              <div className="p-2.5 bg-green-50 text-green-700 rounded-xl border border-green-100">
                ✅ Benar: {hasilKuis.benar} Soal
              </div>
              <div className="p-2.5 bg-red-50 text-red-700 rounded-xl border border-red-100">
                ❌ Salah: {hasilKuis.salah} Soal
              </div>
            </div>

            {/* Kotak Feedback Konstruktif Dinamis */}
            <div
              className={`p-4 rounded-xl border text-left text-xs leading-relaxed ${dapatkanFeedbackDinamis(hasilKuis.skor).warna}`}
            >
              {dapatkanFeedbackDinamis(hasilKuis.skor).teks}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => window.location.reload()}
                disabled={attemptCount + 1 >= 3 || hasilKuis.skor >= 100}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl text-xs font-bold hover:bg-slate-200 disabled:opacity-40 transition-all"
              >
                🔄 Coba Ulang ({3 - (attemptCount + 1)} Sisa)
              </button>
              <Link
                href="/"
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-xs font-bold text-center shadow-md hover:bg-blue-700 transition-colors"
              >
                Keluar ke Dashboard
              </Link>
            </div>
          </div>

          {/* LIST REVIEW JAWABAN SISWA */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-gray-800 px-1 uppercase tracking-wider">
              Lembar Koreksi Evaluasi Modul 2
            </h3>
            {soalList.map((soal, idx) => {
              const jawSiswa = jawabanSiswa[soal.id];
              const isBenar = jawSiswa === soal.jawaban_benar;
              return (
                <div
                  key={soal.id}
                  className={`p-5 rounded-2xl bg-white border shadow-sm ${isBenar ? "border-green-200 bg-green-50/10" : "border-red-200 bg-red-50/10"}`}
                >
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold">
                    <span
                      className={`px-2 py-0.5 rounded-md ${isBenar ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      Soal {idx + 1}
                    </span>
                    <span>{isBenar ? "✅ Tepat" : "❌ Kurang Tepat"}</span>
                  </div>
                  <p className="text-sm text-gray-800 font-semibold mb-3 leading-relaxed">
                    {soal.pertanyaan}
                  </p>

                  <div className="space-y-1.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-gray-600">
                      <strong>Jawaban Kamu:</strong>{" "}
                      {jawSiswa || (
                        <span className="italic text-red-400">
                          Tidak Menjawab
                        </span>
                      )}
                    </div>
                    {!isBenar && (
                      <div className="p-2.5 rounded-xl bg-green-50 border border-green-200 text-green-800">
                        <strong>Kunci Jawaban Benar:</strong>{" "}
                        {soal.jawaban_benar}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. CORE CARD SOAL (QUIZ RUNNING STATE) */}
      {!isSubmitted && soalAktif && (
        <section className="space-y-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-400 tracking-wide uppercase mb-1">
              Pertanyaan ke-{currentIndex + 1}
            </h2>
            <p className="text-base text-gray-800 font-bold leading-relaxed mb-4">
              {soalAktif.pertanyaan}
            </p>

            {/* MULTIMEDIA ZONE 1: RENDER GAMBAR JIKA ADA DI DB */}
            {soalAktif.link_gambar && (
              <div className="w-full rounded-xl overflow-hidden border border-gray-100 shadow-sm mb-4 bg-slate-50">
                <img
                  src={soalAktif.link_gambar}
                  alt="Ilustrasi Soal Jaringan"
                  className="w-full max-h-56 object-contain mx-auto"
                />
              </div>
            )}

            {/* MULTIMEDIA ZONE 2: RENDER VIDEO JIKA ADA DI DB */}
            {soalAktif.link_video && (
              <div className="aspect-video w-full rounded-xl overflow-hidden shadow-md border border-slate-100 mb-4">
                <iframe
                  className="w-full h-full"
                  src={soalAktif.link_video}
                  title="Video Bantuan Soal"
                  frameBorder="0"
                  allowFullScreen
                ></iframe>
              </div>
            )}

            {/* DAFTAR PILIHAN JAWABAN (Custom Radio Card) */}
            <div className="grid gap-2.5 mt-2">
              {soalAktif.pilihan_opsi && Array.isArray(soalAktif.pilihan_opsi) && soalAktif.pilihan_opsi.map((opsi, i) => {
                const isSelected = jawabanSiswa[soalAktif.id] === opsi;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handlePilihJawaban(opsi)}
                    className={`w-full p-4 rounded-xl border text-left text-xs leading-relaxed transition-all flex items-center gap-3 font-medium active:scale-[0.99] ${
                      isSelected
                        ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500"
                        : "bg-slate-50 hover:bg-slate-100 border-gray-200 text-gray-600"
                    }`}
                  >
                    {/* Lingkaran Radio Buatan */}
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"}`}
                    >
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span>{opsi}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DOCK NAVIGASI FOOTER */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 flex justify-between items-center max-w-2xl mx-auto rounded-t-2xl shadow-2xl">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={handlePrev}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Sebelumnya
            </button>

            {currentIndex === soalList.length - 1 ? (
              <button
                type="button"
                onClick={handleSubmitKuis}
                disabled={Object.keys(jawabanSiswa).length < soalList.length}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
              >
                Kirim Jawaban Kuis ✓
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all"
              >
                Selanjutnya →
              </button>
            )}
          </div>
        </section>
      )}

      {!loading && soalList.length === 0 && (
        <div className="bg-white p-8 rounded-2xl text-center border text-gray-400 text-xs shadow-sm">
          Belum ada bank soal Modul 2 yang diunggah ke tabel `modul_kuis`.
        </div>
      )}
    </main>
  );
}