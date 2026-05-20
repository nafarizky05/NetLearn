"use client";
import { useState, useEffect } from "react";

export default function TourGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      target: "#step-welcome",
      title: "👋 Selamat Datang di NetLearn!",
      text: "Ini adalah gerbang utama belajar jaringan komputermu. Yuk keliling sebentar melihat fitur aplikasi ini!"
    },
    {
      target: "#step-modul",
      title: "📚 Modul Pembelajaran Materi",
      text: "Di sini kamu bisa mengakses materi interaktif lengkap dengan teks, gambar ilustrasi, hingga video pendukung."
    },
    {
      target: "#step-progress",
      title: "📊 Status & Skor Progress",
      text: "Pantau perkembangan nilai kuis Modul 1 dan Modul 2 kamu secara real-time langsung melalui indikator grafik ini."
    },
    {
      target: "#step-kuis",
      title: "📝 Evaluasi Kuis Interaktif",
      text: "Setelah membaca modul, uji pemahamanmu di sini. Ingat, kamu punya maksimal 3 kali kesempatan dengan batas lulus nilai 70!"
    }
  ];

  useEffect(() => {
    const sudahTour = localStorage.getItem("netlearn_tour_selesai");
    const siswaId = localStorage.getItem("netlearn_siswa_id");
    
    if (siswaId && !sudahTour) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        aplikasikanHighlight(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const aplikasikanHighlight = (index) => {
    steps.forEach(s => {
      const el = document.querySelector(s.target);
      if (el) el.classList.remove("tour-highlight");
    });

    const targetEl = document.querySelector(steps[index].target);
    if (targetEl) {
      targetEl.classList.add("tour-highlight");
      
      // 🛠️ PERBAIKAN SCROLL: Memberikan ruang (padding offset) atas dan bawah saat otomatis scroll 
      // agar elemen tidak terpotong atau terlalu mepet ke atas/bawah layar
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      aplikasikanHighlight(nextStep);
    } else {
      akhiriTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      aplikasikanHighlight(prevStep);
    }
  };

  const akhiriTour = () => {
    setIsOpen(false);
    steps.forEach(s => {
      const el = document.querySelector(s.target);
      if (el) el.classList.remove("tour-highlight");
    });
    localStorage.setItem("netlearn_tour_selesai", "true");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Lapisan Hitam Transparan (Backdrop Overlay) - z-40 */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity backdrop-blur-[1px]" onClick={akhiriTour} />

      {/* 🛠️ PERBAIKAN LAPISAN LAYER: Menggunakan z-[100] (Jauh di atas z-50 milik element highlight) 
          dan disesuaikan posisinya agar ramah tampilan mobile max-w-md */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[26rem] bg-white p-5 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] border border-blue-50 z-[100] animate-fadeIn">
        
        {/* Progress Bar Mini */}
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-3">
          <div 
            className="bg-blue-600 h-full transition-all duration-300" 
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Konten Teks */}
        <div className="space-y-1 text-left">
          <h4 className="text-sm font-extrabold text-slate-800 tracking-wide">
            {steps[currentStep].title}
          </h4>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            {steps[currentStep].text}
          </p>
        </div>

        {/* Baris Tombol Aksi */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
          <button 
            onClick={akhiriTour}
            className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
          >
            Skip Tur ✕
          </button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button 
                onClick={handlePrev}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all"
              >
                Kembali
              </button>
            )}

            <button 
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-4 py-1.5 rounded-lg shadow-md shadow-blue-100 transition-all"
            >
              {currentStep === steps.length - 1 ? "Mulai Belajar 🏁" : "Lanjut →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}