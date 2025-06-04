# Imagen oficial de PyTorch con CUDA (usa solo si tienes GPU y nvidia-container-runtime)
FROM pytorch/pytorch:2.2.2-cuda11.8-cudnn8-runtime

# Evitar prompts de tzdata
ENV DEBIAN_FRONTEND=noninteractive

# Instala dependencias del sistema
RUN apt-get update && apt-get install -y \
    ffmpeg libsm6 libxext6 libgl1 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar e instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY . .

# Exponer el puerto de la API
EXPOSE 8000

# Comando de ejecución
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
