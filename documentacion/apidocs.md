# API docs

## Descripción

Esta API proporciona los servicios necesarios para la autenticación de usuarios y el acceso a modelos de aprendizaje automático relacionados con el reconocimiento de señas mediante visión computacional. Permite a los usuarios registrarse, iniciar sesión y utilizar la herramienta de traducción de señas. 

La API está diseñada para ser utilizada en sistemas que integran interfaces de lenguaje de señas con inteligencia artificial, ofreciendo endpoints RESTful sobre HTTP para una fácil integración.

## Autentcación

En esta sección se describen los endpoints directamente relacionados con la autenticación de los usuarios. Consstan de signin y signup.

**Endpoint:**
`POST http://172.16.30.147:27017//signup`

Body:

    {
        "username": "testuser",
        "password": "123456789"
    }
Response status **200**:

    {
        "msg": "User created successfully"
    }
Response status **400**:

    {
        "detail": "Username already exists"
    }
**Endpoint:**
`POST http://172.16.30.147:27017//signin`

Body:

    {
        "username": "testuser",
        "password": "123456789"
    }
Response status **200**:

    {
        "access_token": explicación del token,
        "token_type": "bearer"
    }
Response status **401**:

    {
        "detail": "Invalid credentials"
    }


## WebSocket - Detección de Señas

Este endpoint permite la conexión en tiempo real mediante WebSocket para enviar imágenes codificadas en Base64 y recibir predicciones sobre señas detectadas con el modelo de visión computacional.

**Endpoint**
`ws://172.16.30.147:27017/ws`

Entry:

    Imagen base64
Response:

    {
        "No hand detected"
    }
Response:

    {
        "Invalid data format"
    }

## Data Base

**Endpoint**
`POST mongodb://172.16.30.147:27017//save_frame/{letter}`

Body:

    frame_doc = {
        "username": username,
        "letter": letter,
        "timestamp": datetime.utcnow(),
        "image_base64": encoded_image
    }
Response:

    {
        "message": "Frame saved to MongoDB", "letter": letter
    }