import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // PWA hanya aktif saat sudah jadi (production)
  register: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Isi konfigurasi next.js lainnya di sini jika ada
};

export default withPWA(nextConfig);