
"use client";
import Link from "next/link";

export default function Dashboard() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Panel de Administración</h1>
      <nav style={{ marginTop: "1rem" }}>
        <ul>
          <li><Link href="/admin/dashboard/events">Gestionar Eventos</Link></li>
            <li><Link href="/admin/dashboard/gallery">Gestionar Galería</Link></li>
          <li><Link href="/admin/dashboard/pages">Gestionar Páginas</Link></li>
          <li><Link href="/admin/dashboard/reservations">Gestionar Reservaciones</Link></li>
        </ul>
      </nav>
    </div>
  );
}
