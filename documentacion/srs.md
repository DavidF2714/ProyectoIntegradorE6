---

#  Especificación de Requerimientos de Software (SRS)

## 1. Introducción

### 1.1 Propósito del documento

Este documento tiene como objetivo definir los requerimientos funcionales y no funcionales del sistema de reconocimiento de Lengua de Señas Mexicana (LSM) mediante visión artificial, desarrollado como una aplicación web interactiva.

### 1.2 Alcance del sistema

El sistema permitirá a los usuarios:

* Iniciar sesión y gestionar su perfil.
* Deletrear su nombre usando LSM y capturar la secuencia mediante la cámara.
* Visualizar predicciones en tiempo real superpuestas sobre el video.
* Almacenar las predicciones realizadas como parte de una colección personal.
* Acceder a su historial de colecciones desde cualquier dispositivo con acceso a la web.

### 1.3 Definiciones, acrónimos y abreviaciones

* **LSM**: Lengua de Señas Mexicana
* **WebSocket**: Protocolo para comunicación bidireccional entre cliente y servidor
* **Landmark**: Punto clave en la mano extraído mediante visión por computadora
* **Colección**: Agrupación de imágenes y predicciones asociadas a un nombre deletreado

---

## 2. Descripción general

### 2.1 Perspectiva del sistema

El sistema es una aplicación web conectada a un backend en FastAPI + SocketIO, con un modelo de deep learning entrenado para reconocer gestos de LSM a partir de los landmarks de MediaPipe.

### 2.2 Funciones del sistema

* Autenticación de usuario
* Captura de video en tiempo real
* Reconocimiento de señas en tiempo real
* Almacenamiento de colecciones personalizadas
* Visualización del historial de predicciones

### 2.3 Características del usuario

* Cualquier persona con conocimientos básicos de LSM
* Acceso desde navegador con cámara habilitada
* No se requiere experiencia técnica

### 2.4 Restricciones

* El sistema requiere una cámara activa y conexión a internet.
* Actualmente soporta solo el alfabeto manual de LSM (26 letras).

---

## 3. Requerimientos funcionales

### RF1. Registro y sesión

* El sistema debe permitir a un usuario ingresar su nombre y registrarlo.
* El usuario debe poder iniciar y cerrar sesión.

### RF2. Captura de gestos

* El sistema debe capturar en tiempo real los gestos realizados frente a la cámara.
* El sistema debe mostrar la predicción superpuesta en el video.

### RF3. Almacenamiento de predicciones

* El sistema debe guardar las imágenes de cada letra deletreada como una colección asociada al usuario.
* El sistema debe permitir al usuario acceder y visualizar sus colecciones anteriores.

### RF4. Comunicación en tiempo real

* El sistema debe usar WebSockets para enviar los datos de los landmarks al backend y recibir predicciones en tiempo real.

### RF5. Visualización de resultados

* El sistema debe mostrar los puntos de referencia de la mano y la letra detectada en pantalla.

### RF6. Historial del usuario

* El sistema debe mantener un historial de las sesiones y colecciones del usuario.

---

## 4. Requerimientos no funcionales

| ID   | Tipo                | Descripción                                                                                                                            |
| ---- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |                                                                                |
| RNF1 | Disponibilidad      | El sistema debe estar disponible al menos el **99% del tiempo**.                                                                       |
| RNF2 | Seguridad           | El sistema debe proteger los datos del usuario mediante **JWT**.                                                                       |
| RNF3 | Mantenibilidad      | El sistema debe tener una arquitectura modular que permita modificar o actualizar el modelo de reconocimiento sin afectar el frontend. |
| RNF4 | Portabilidad        | El sistema debe funcionar correctamente en **navegadores**.                                                                            |
| RNF5 | Usabilidad          | La interfaz debe ser intuitiva y permitir al usuario promedio completar una colección en menos de **2 minutos**.                       |
| RNF6 | Tolerancia a fallos | El sistema debe ser capaz de recuperarse automáticamente de interrupciones de red de hasta **20 segundos**.                            |

---

## 5. Restricciones

* El proyecto se realiza en un equipo de 4 personas
* El proyecto debe de estar hosteado dentro de la red de nube propuesta por los profesores
* Se tiene una semana para llevar a cabo el desarrollo del proyecto
* La infraestructura es propiedad del Tec de Monterrey

---
