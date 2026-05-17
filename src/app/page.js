"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  // State untuk navigasi menu ( 'login' atau 'register' )
  const [mode, setMode] = useState("login");

  // State untuk form input
  const [namaInput, setNamaInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const [siswa, setSiswa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // 1. Auto-Login jika token ID masih tersimpan di browser
  useEffect(() => {
    const savedId = localStorage.getItem("netlearn_siswa_id");
    if (savedId) {
      ambilDataSiswa(savedId);
    } else {
      setLoading(false);
    }
  }, []);

  const ambilDataSiswa = async (id) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_progress")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      setSiswa(data);
    } else {
      localStorage.removeItem("netlearn_siswa_id");
    }
    setLoading(false);
  };

  // 2. Fungsi Logika REGISTRASI (Daftar Akun)
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!namaInput.trim() || !passwordInput.trim()) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Cek apakah username/nama sudah dipakai orang lain
    const { data: userExist } = await supabase
      .from("user_progress")
      .select("nama_siswa")
      .eq("nama_siswa", namaInput.trim())
      .maybeSingle();

    if (userExist) {
      setErrorMsg(
        "Nama ini sudah terdaftar! Silakan gunakan nama lain atau langsung login.",
      );
      setLoading(false);
      return;
    }

    // Jika aman, masukkan data akun baru beserta password-nya
    const { data: userBaru, error: insertError } = await supabase
      .from("user_progress")
      .insert([
        {
          nama_siswa: namaInput.trim(),
          password: passwordInput.trim(),
        },
      ])
      .select()
      .single();

    if (userBaru) {
      setSuccessMsg("Pendaftaran berhasil! Silakan masuk ke menu Login.");
      setMode("login");
      setPasswordInput(""); // Reset password input demi keamanan
    } else {
      setErrorMsg("Gagal mendaftar akun. Coba lagi.");
      console.error(insertError);
    }
    setLoading(false);
  };

  // 3. Fungsi Logika LOGIN (Masuk Akun)
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!namaInput.trim() || !passwordInput.trim()) return;

    setLoading(true);
    setErrorMsg("");

    // Cari siswa berdasarkan nama DAN password yang cocok
    const { data: user, error } = await supabase
      .from("user_progress")
      .select("*")
      .eq("nama_siswa", namaInput.trim())
      .eq("password", passwordInput.trim())
      .maybeSingle();

    if (user) {
      localStorage.setItem("netlearn_siswa_id", user.id);
      setSiswa(user);
    } else {
      setErrorMsg("Nama atau Password salah! Periksa kembali.");
    }
    setLoading(false);
  };

  const getFeedbackKuis = (skor) => {
    if (skor === null || skor === undefined)
      return "Kamu belum menguji kemampuanmu. Yuk, mulai kuis!";
    if (skor < 70)
      return `Skor terakhir: ${skor}%. Kamu belum tuntas, yuk coba lagi! 💪`;
    return `Selamat! Skor kamu ${skor}%. Kamu telah menuntaskan modul ini! 🎓`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Memproses enkripsi data...</p>
        </div>
      </div>
    );
  }

  // --- TAMPILAN AUTH: LOGIN & REGISTER ---
  if (!siswa) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">
            NetLearn: Fase E
          </h1>
          <p className="text-gray-400 text-xs text-center mb-6 uppercase tracking-wider font-semibold">
            {mode === "login"
              ? "🔑 Menu Masuk Siswa"
              : "📝 Pendaftaran Akun Baru"}
          </p>

          {successMsg && (
            <p className="p-3 bg-green-50 text-green-600 rounded-xl text-xs font-semibold text-center mb-4">
              {successMsg}
            </p>
          )}
          {errorMsg && (
            <p className="p-3 bg-red-50 text-red-500 rounded-xl text-xs font-semibold text-center mb-4">
              {errorMsg}
            </p>
          )}

          <form
            onSubmit={mode === "login" ? handleLogin : handleRegister}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                placeholder="Masukkan namamu..."
                value={namaInput}
                onChange={(e) => setNamaInput(e.target.value)}
                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50 text-gray-800 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 uppercase">
                Kata Sandi (Password)
              </label>
              <input
                type="password"
                required
                placeholder="Masukkan password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50 text-gray-800 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg active:scale-98 transition-transform text-sm"
            >
              {mode === "login" ? "Masuk ke Aplikasi" : "Daftar Sekarang"}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-gray-100 pt-4">
            {mode === "login" ? (
              <p className="text-xs text-gray-500">
                Belum punya akun?{" "}
                <button
                  onClick={() => {
                    setMode("register");
                    setErrorMsg("");
                  }}
                  className="text-blue-600 font-bold underline"
                >
                  Daftar di sini
                </button>
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Sudah punya akun?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setErrorMsg("");
                  }}
                  className="text-blue-600 font-bold underline"
                >
                  Login di sini
                </button>
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  // --- TAMPILAN DASHBOARD (JIKA LOGIN BERHASIL) ---
  return (
    <main className="min-h-screen bg-slate-50 p-4 pb-10">
      {/* Header Dashboard */}
      <header className="bg-blue-600 rounded-2xl p-6 mb-6 text-white shadow-lg relative overflow-hidden">
        <h1 className="text-2xl font-bold">NetLearn: Fase E</h1>
        <p className="text-blue-100 text-sm mt-1">
          Halo, <span className="font-bold underline">{siswa.nama_siswa}</span>{" "}
          🎓
        </p>
        <button
          onClick={() => {
            localStorage.removeItem("netlearn_siswa_id");
            setSiswa(null);
            setNamaInput("");
            setPasswordInput("");
          }}
          className="absolute top-4 right-4 text-xs bg-blue-700/50 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-blue-100 transition-colors font-bold"
        >
          Keluar (Logout)
        </button>
      </header>

      {/* Daftar Modul */}
      <div className="grid gap-6">
        {/* KARTU MODUL 1 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">
                Modul 1
              </span>
              <h2 className="font-bold text-gray-800 text-lg mt-1">
                Dasar Jaringan Komputer
              </h2>
            </div>
            <Link href="/modul1">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-transform shadow-md">
                {siswa.materi_modul1_selesai > 0 ? "Lanjut Belajar" : "Mulai"}
              </button>
            </Link>
          </div>

          <hr className="my-3 border-gray-100" />

          {/* INDIKATOR PROGRESS */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress Materi (Sesi selesai)</span>
                <span className="font-bold text-gray-700">
                  {siswa.materi_modul1_selesai} / 3 Sesi
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(siswa.materi_modul1_selesai / 3) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Status Evaluasi Kuis
              </p>
              <p className="text-sm text-gray-700 font-medium mt-1">
                {getFeedbackKuis(siswa.skor_modul1)}
              </p>
              {siswa.skor_modul1 !== null && (
                <div className="mt-2 w-full bg-gray-200 h-1.5 rounded-full">
                  <div
                    className={`h-1.5 rounded-full ${siswa.skor_modul1 >= 70 ? "bg-green-500" : "bg-red-500"}`}
                    style={{ width: `${siswa.skor_modul1}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KARTU MODUL 2 (TERKUNCI) */}
        <div
          className={`p-5 rounded-2xl border ${siswa.skor_modul1 >= 70 ? "bg-white border-gray-100" : "bg-gray-100/70 border-dashed border-gray-200 opacity-60"}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded-md uppercase">
                Modul 2
              </span>
              <h2 className="font-bold text-gray-700 text-lg mt-1">
                Perangkat Jaringan Komputer
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Selesaikan Kuis Modul 1 dengan skor ≥ 70 untuk membuka.
              </p>
            </div>
            {siswa.skor_modul1 >= 70 ? (
              <Link href="/modul2">
                <button className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-transform shadow-md">
                  Mulai
                </button>
              </Link>
            ) : (
              <span className="text-xl">🔒</span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
