/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mengaktifkan Turbopack kosong agar tidak bentrok dengan sisa-sisa config lama
  turbopack: {},

  // Jika kamu memakai gambar dari Supabase, pastikan domainnya diizinkan di sini
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sbrbrdgpdsneorgjanfr.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
