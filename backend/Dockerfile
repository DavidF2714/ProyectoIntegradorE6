FROM python:3.12-slim

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Instala dependencias del sistema mínimas
RUN apt-get update && apt-get install -y libgl1 && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instala dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia el código
COPY . .

# Expone el puerto REST (por ejemplo 8000)
EXPOSE 8000

CMD ["uvicorn", "server_rest:app", "--host", "0.0.0.0", "--port", "8000"]
