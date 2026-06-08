from pathlib import Path
import re

path = Path("src/static/data/entidades.json")
text = path.read_text(encoding="utf-8")

text = re.sub(r'\n\s*"machine_readable"\s*:\s*(true|false|null)\s*,?', '', text)

path.write_text(text, encoding="utf-8")
print("machine_readable eliminado")