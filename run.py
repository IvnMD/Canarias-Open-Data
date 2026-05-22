import subprocess

# Arrancar app.py
app_process = subprocess.Popen(["python", "src/app.py"])

# Arrancar fecha.py


print("Aplicaciones iniciadas")

# Mantener vivo el script
app_process.wait()
