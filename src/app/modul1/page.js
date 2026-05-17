'use client' // Wajib untuk fitur interaktif (pindah sesi)
import { useState } from 'react';
import Link from 'next/link';

export default function Modul1() {
  const [step, setStep] = useState(1); // Mengatur sesi mana yang tampil

  return (
    <main className="min-h-screen bg-slate-50 p-5 pb-24">
      {/* Progress Bar Sederhana */}
      <div className="w-full bg-gray-200 h-2 rounded-full mb-6">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
          style={{ width: `${(step / 3) * 100}%` }}
        ></div>
      </div>

      <Link href="/" className="text-blue-600 text-sm mb-4 inline-block">← Keluar ke Dashboard</Link>

      {/* --- SESI 1: ANALOGI --- */}
      {step === 1 && (
        <section className="animate-in fade-in duration-500">
          <h1 className="text-2xl font-bold mb-4">Sesi 1: Analogi Paket Data</h1>
          <div className="bg-white p-4 rounded-xl shadow-sm mb-4 leading-relaxed">
            <p className="mb-4">
              Pernahkah kamu mengirim surat? Di jaringan komputer, data yang kamu kirim (seperti foto/chat) dipecah menjadi bagian kecil yang disebut <strong>Paket</strong>.
            </p>
            <div className="bg-yellow-50 p-4 border-l-4 border-yellow-400 text-sm italic text-gray-700">
              "Bayangkan sebuah foto dipecah menjadi 10 potongan puzzle, dikirim lewat jalur berbeda, lalu disusun kembali di HP temanmu."
            </div>
          </div>
          {/* Video Embed */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
             <iframe className="w-full h-full" src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>
          </div>
        </section>
      )}

      {/* --- SESI 2: TOPOLOGI (Materi Abstrak) --- */}
      {step === 2 && (
        <section className="animate-in fade-in duration-500">
          <h1 className="text-2xl font-bold mb-4">Sesi 2: Topologi (Bentuk Jaringan)</h1>
          <p className="text-gray-600 mb-4 text-sm">Bagaimana perangkat disusun secara fisik dan logis.</p>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white p-3 rounded-lg border-2 border-blue-100">
              <h3 className="font-bold text-blue-600 text-sm">Topologi Star</h3>
              <p className="text-xs text-gray-500">Semua kabel lari ke satu pusat (Hub/Switch).</p>
            </div>
            <div className="bg-white p-3 rounded-lg border-2 border-green-100">
              <h3 className="font-bold text-green-600 text-sm">Topologi Mesh</h3>
              <p className="text-xs text-gray-500">Setiap perangkat terhubung ke semua perangkat.</p>
            </div>
          </div>
          
          <div className="p-4 bg-blue-900 text-white rounded-xl text-sm">
             <strong>Konsep Abstrak:</strong> Topologi bukan cuma soal kabel, tapi soal "Siapa bicara ke siapa".
          </div>
        </section>
      )}

      {/* --- SESI 3: IP ADDRESS --- */}
      {step === 3 && (
        <section className="animate-in fade-in duration-500">
          <h1 className="text-2xl font-bold mb-4">Sesi 3: Alamat IP</h1>
          <p className="mb-4">Agar data tidak nyasar, setiap HP/Laptop punya "Alamat Rumah" unik.</p>
          
          <div className="bg-gray-800 p-6 rounded-2xl text-center text-white mb-6">
            <span className="text-3xl font-mono tracking-widest text-green-400">192.168.1.1</span>
            <p className="text-xs mt-2 text-gray-400">Contoh format IP Address v4</p>
          </div>
        </section>
      )}

      {/* Navigasi Materi */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md flex gap-3">
        {step > 1 && (
          <button 
            onClick={() => setStep(step - 1)}
            className="flex-1 py-3 bg-gray-200 rounded-xl font-bold"
          >
            Kembali
          </button>
        )}
        
        {step < 3 ? (
          <button 
            onClick={() => setStep(step + 1)}
            className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg"
          >
            Lanjut Materi
          </button>
        ) : (
          <button 
            className="flex-[2] py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg"
          >
            Mulai Kuis (10 Soal)
          </button>
        )}
      </div>
    </main>
  );
}