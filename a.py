import os
import re

DIRECTORIO = r"C:\Users\Rafael\Desktop\replit\new\backup\sube-seccion"

for archivo in os.listdir(DIRECTORIO):
    if not archivo.endswith(".js"):
        continue

    match = re.match(r'^Sec(\d+)(?:_(\d+))?\.js$', archivo)
    if not match:
        continue

    base = int(match.group(1))
    sufijo = match.group(2)

    nuevo_nombre = f"Sec{base:02d}"  # ceros a la izquierda, ej: 03
    if sufijo:
        nuevo_nombre += f"_{sufijo}"
    nuevo_nombre += ".js"

    origen = os.path.join(DIRECTORIO, archivo)
    destino = os.path.join(DIRECTORIO, nuevo_nombre)

    # Renombrar solo si el nombre cambia
    if archivo != nuevo_nombre:
        print(f"Renombrando: {archivo} → {nuevo_nombre}")
        os.rename(origen, destino)

print("✅ Renombrado completo con ceros a la izquierda.")
