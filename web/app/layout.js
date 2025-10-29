// web/app/layout.js
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer'; // <-- AÑADE ESTA LÍNEA

export const metadata = { title: 'Doppler Bar' };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-gray-800 text-white flex flex-col min-h-screen">
        <Header />
        <main className="p-8 flex-grow">{children}</main>
        <Footer /> {/* <-- AÑADE ESTA LÍNEA */}
      </body>
    </html>
  );
}