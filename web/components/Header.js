// web/components/Header.js
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-gray-900 text-white p-4 flex gap-4 shadow-lg">
      <Link href="/" className="hover:text-blue-400">Inicio</Link>
      <Link href="/menu" className="hover:text-blue-400">Menú</Link>
      <Link href="/events" className="hover:text-blue-400">Eventos</Link>
      <Link href="/gallery" className="hover:text-blue-400">Galería</Link>
      <Link href="/reservations" className="hover:text-blue-400">Reservar</Link>
      <Link href="/login" className="hover:text-blue-400">LoginPage</Link>
    </header>
  );
}