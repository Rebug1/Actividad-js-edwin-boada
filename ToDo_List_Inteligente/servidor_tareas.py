from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from urllib.parse import urlparse


CARPETA_BASE = Path(__file__).resolve().parent
ARCHIVO_TAREAS = CARPETA_BASE / "tareas.json"
PUERTO = 8000


class ServidorTareas(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(CARPETA_BASE), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_GET(self):
        ruta = urlparse(self.path).path

        if ruta == "/":
            self.path = "/ToDo_List_Inteligente.html"
            return super().do_GET()

        if ruta == "/api/tareas":
            return self.enviar_json(self.leer_tareas())

        return super().do_GET()

    def do_POST(self):
        if urlparse(self.path).path != "/api/tareas":
            return self.send_error(HTTPStatus.NOT_FOUND, "Ruta no encontrada")

        datos = self.leer_cuerpo_json()
        texto = str(datos.get("texto", "")).strip()

        if not texto:
            return self.enviar_json({"error": "El texto de la tarea es obligatorio"}, HTTPStatus.BAD_REQUEST)

        tareas = self.leer_tareas()
        nueva_tarea = {
            "id": self.obtener_siguiente_id(tareas),
            "texto": texto,
            "completada": False
        }

        tareas.append(nueva_tarea)
        self.guardar_tareas(tareas)
        return self.enviar_json(nueva_tarea, HTTPStatus.CREATED)

    def do_PUT(self):
        partes_ruta = urlparse(self.path).path.strip("/").split("/")

        if len(partes_ruta) != 3 or partes_ruta[:2] != ["api", "tareas"]:
            return self.send_error(HTTPStatus.NOT_FOUND, "Ruta no encontrada")

        id_tarea = self.obtener_id(partes_ruta[2])
        if id_tarea is None:
            return self.enviar_json({"error": "ID invalido"}, HTTPStatus.BAD_REQUEST)

        tareas = self.leer_tareas()
        tarea_actualizada = None

        for tarea in tareas:
            if tarea["id"] == id_tarea:
                tarea["completada"] = not tarea["completada"]
                tarea_actualizada = tarea
                break

        if tarea_actualizada is None:
            return self.enviar_json({"error": "Tarea no encontrada"}, HTTPStatus.NOT_FOUND)

        self.guardar_tareas(tareas)
        return self.enviar_json(tarea_actualizada)

    def do_DELETE(self):
        partes_ruta = urlparse(self.path).path.strip("/").split("/")

        if len(partes_ruta) != 3 or partes_ruta[:2] != ["api", "tareas"]:
            return self.send_error(HTTPStatus.NOT_FOUND, "Ruta no encontrada")

        id_tarea = self.obtener_id(partes_ruta[2])
        if id_tarea is None:
            return self.enviar_json({"error": "ID invalido"}, HTTPStatus.BAD_REQUEST)

        tareas = self.leer_tareas()
        tareas_actualizadas = [tarea for tarea in tareas if tarea["id"] != id_tarea]

        if len(tareas_actualizadas) == len(tareas):
            return self.enviar_json({"error": "Tarea no encontrada"}, HTTPStatus.NOT_FOUND)

        self.guardar_tareas(tareas_actualizadas)
        return self.enviar_json({"mensaje": "Tarea eliminada"})

    def leer_tareas(self):
        if not ARCHIVO_TAREAS.exists():
            self.guardar_tareas([])
            return []

        with ARCHIVO_TAREAS.open("r", encoding="utf-8") as archivo:
            contenido = archivo.read().strip()

        if not contenido:
            self.guardar_tareas([])
            return []

        try:
            tareas = json.loads(contenido)
        except json.JSONDecodeError:
            self.guardar_tareas([])
            return []

        if not isinstance(tareas, list):
            self.guardar_tareas([])
            return []

        return tareas

    def guardar_tareas(self, tareas):
        with ARCHIVO_TAREAS.open("w", encoding="utf-8") as archivo:
            json.dump(tareas, archivo, ensure_ascii=False, indent=2)
            archivo.write("\n")

    def leer_cuerpo_json(self):
        longitud = int(self.headers.get("Content-Length", 0))

        if longitud == 0:
            return {}

        cuerpo = self.rfile.read(longitud).decode("utf-8")
        return json.loads(cuerpo)

    def enviar_json(self, datos, estado=HTTPStatus.OK):
        respuesta = json.dumps(datos, ensure_ascii=False).encode("utf-8")

        self.send_response(estado)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(respuesta)))
        self.end_headers()
        self.wfile.write(respuesta)

    def obtener_siguiente_id(self, tareas):
        if not tareas:
            return 1

        return max(tarea["id"] for tarea in tareas) + 1

    def obtener_id(self, valor):
        try:
            return int(valor)
        except ValueError:
            return None


if __name__ == "__main__":
    servidor = ThreadingHTTPServer(("localhost", PUERTO), ServidorTareas)
    print(f"Servidor iniciado en http://localhost:{PUERTO}")
    print("Presiona Ctrl+C para detenerlo.")
    servidor.serve_forever()
