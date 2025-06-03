# Reconocimiento de Lengua de Señas Mexicana (LSM) mediante Visión Artificial

Este proyecto implementa un sistema de visión artificial para el reconocimiento de la Lengua de Señas Mexicana (LSM) utilizando técnicas avanzadas de aprendizaje profundo. El sistema es capaz de interpretar gestos manuales en tiempo real a través de una aplicación web con comunicación mediante sockets.

## Descripción del Proyecto
La solución desarrollada es un sistema de reconocimiento de Lengua de Señas Mexicana (LSM) que combina visión por computadora y aprendizaje profundo. El núcleo del proyecto consiste en un modelo de deep learning que procesa landmarks de manos (63 puntos espaciales) para clasificar gestos en 26 categorías de LSM. La aplicación incluye funcionalidades de aumento de datos para mejorar el modelo (rotaciones, escalados, ruido), procesamiento de imágenes para extracción de landmarks, y un pipeline completo de entrenamiento y validación del modelo. El componente web ofrece predicciones en tiempo real mediante WebSockets, gestión de sesiones de usuario y almacenamiento de registros de predicciones con sus videos asociados.

Este proyecto fue desarrollado como trabajo de titulación para la carrera de Ingeniería en Tecnologías Computacionales (ITC) en el Tecnológico de Monterrey. El sistema utiliza redes neuronales profundas para reconocer y clasificar gestos de la Lengua de Señas Mexicana, permitiendo:

- **Reconocimiento en tiempo real** mediante una aplicación web con comunicación por sockets
- **Gestión de sesiones** de usuarios
- **Almacenamiento de videos** con las predicciones realizadas
- **Visualización de resultados** con superposición de puntos de referencia

## Características Técnicas
- **Extracción de landmarks**: Detección de 21 puntos clave en la mano usando MediaPipe
- **Aumento de datos**: Técnicas avanzadas para mejorar la generalización del modelo:
  - Volteo horizontal
  - Rotación aleatoria (±15°)
  - Escalado (80-120%)
  - Traslación (±5%)
  - Adición de ruido gaussiano
- **Modelo de aprendizaje profundo**:
  - Arquitectura de 4 capas densas (512-256-128-26 neuronas)
  - Batch normalization y dropout para regularización
- **Entrenamiento optimizado**:
  - Usando PyTorch Lightning
  - Early stopping con paciencia de 5 épocas
  - Registro de métricas (pérdida y precisión)
- **Aplicación Web**:
  - Comunicación en tiempo real mediante WebSockets
  - Almacenamiento de sesiones y videos
  - Visualización de predicciones

### Funcionalidades de la aplicación web
1. **Conexión en tiempo real** mediante WebSockets
2. **Captura de video** desde la cámara del usuario
3. **Visualización de predicciones** superpuestas en el video
4. **Gestión de sesiones**:
   - Inicio/cierre de sesión
   - Almacenamiento de videos predictivos
   - Historial de predicciones
5. **Panel de resultados**:
   - Gráficos de precisión del modelo
   - Visualización de landmarks
   - Reproducción de videos almacenados

## Licencia
Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

## Créditos
Este proyecto fue desarrollado como trabajo de titulación para la carrera de Ingeniería en Tecnologías Computacionales en el Tecnológico de Monterrey.

**Tecnologías utilizadas**:
- PyTorch & PyTorch Lightning
- MediaPipe
- OpenCV
- Flask & SocketIO
- Pandas & Scikit-learn

**Desarrolladores**: Sergio Zuckermann, David Flores Becerril, Santtiago Benítez Pérez, Santiago Tena Zozaya
**Institución**: Tecnológico de Monterrey, Campus Santa Fe
**Año**: 2025
