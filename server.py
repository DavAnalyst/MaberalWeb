#!/usr/bin/env python3
"""
server.py – Servidor de desarrollo local para Maberal Landing Page
Compatible con Python 3.6+

Uso:
    python server.py
    python server.py --port 9000   # puerto personalizado

Características:
  - Sirve archivos estáticos desde la carpeta actual
  - Añade headers CORS para desarrollo
  - Log de peticiones con timestamp y código de estado
  - Detención limpia con Ctrl+C
"""

import http.server
import socketserver
import argparse
import os
import sys
from datetime import datetime


# ── Configuración ─────────────────────────────────────────────────────────────
DEFAULT_PORT = 8000
DIRECTORY    = os.path.dirname(os.path.abspath(__file__))  # carpeta del script


# ── Handler personalizado ──────────────────────────────────────────────────────
class MaberalHandler(http.server.SimpleHTTPRequestHandler):
    """
    Extiende SimpleHTTPRequestHandler para:
      1. Añadir headers CORS y caché en desarrollo
      2. Formatear los logs de consola
    """

    # Carpeta raíz del servidor
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    # ── Headers adicionales ────────────────────────────────────────────────────
    def end_headers(self):
        # CORS – permite peticiones desde cualquier origen (solo para desarrollo)
        self.send_header("Access-Control-Allow-Origin",  "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

        # Deshabilitar caché para que los cambios se reflejen de inmediato
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma",        "no-cache")
        self.send_header("Expires",       "0")

        super().end_headers()

    # ── Soporte OPTIONS (preflight CORS) ──────────────────────────────────────
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    # ── Log de peticiones formateado ──────────────────────────────────────────
    def log_message(self, fmt, *args):
        timestamp = datetime.now().strftime("%H:%M:%S")
        status_code = args[1] if len(args) > 1 else "-"

        # Color según código de estado (solo terminales que soportan ANSI)
        try:
            code = int(status_code)
            if   200 <= code < 300: color = "\033[32m"   # verde
            elif 300 <= code < 400: color = "\033[33m"   # amarillo
            elif 400 <= code < 500: color = "\033[31m"   # rojo
            else:                   color = "\033[35m"   # magenta
            reset = "\033[0m"
        except (ValueError, TypeError):
            color = reset = ""

        msg = fmt % args
        print(f"  [{timestamp}] {color}{msg}{reset}")


# ── Servidor ───────────────────────────────────────────────────────────────────
class ReusableTCPServer(socketserver.TCPServer):
    """TCPServer con SO_REUSEADDR para evitar "Address already in use" al reiniciar."""
    allow_reuse_address = True


def run(port: int):
    """Arranca el servidor en el puerto indicado."""

    # Verificar que index.html exista
    index_path = os.path.join(DIRECTORY, "index.html")
    if not os.path.exists(index_path):
        print(f"\n  ⚠  Advertencia: no se encontró index.html en {DIRECTORY}\n")

    with ReusableTCPServer(("", port), MaberalHandler) as httpd:
        # Banner de inicio
        print("\n" + "═" * 54)
        print("  🌐  Maberal – Servidor de desarrollo")
        print("═" * 54)
        print(f"  URL:      http://localhost:{port}")
        print(f"  Carpeta:  {DIRECTORY}")
        print(f"  Python:   {sys.version.split()[0]}")
        print("─" * 54)
        print("  Presiona  Ctrl+C  para detener el servidor")
        print("═" * 54 + "\n")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n  Servidor detenido. ¡Hasta luego!\n")
            sys.exit(0)


# ── Punto de entrada ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Servidor de desarrollo local para Maberal Landing Page"
    )
    parser.add_argument(
        "--port", "-p",
        type=int,
        default=DEFAULT_PORT,
        help=f"Puerto del servidor (default: {DEFAULT_PORT})"
    )
    args = parser.parse_args()

    run(args.port)
