# Reto_10_Grupo_Amarillo
Cosas a tener en cuenta:
- Los scripts debrán ejecutarse en orden.
- Se hará uso de los .csv proporcionados por Lookiero para poder resolver el reto.

## Datos
En estas carpetas estan o se tienen que ubicar todos los datos utilizados.

### Originales
Aquí se tienen que incluir todos los datos que se han otorgado al principido del reto  (csv proporcionados por Lookiero).

### Transformados
Datos generados después de la ejecucion de distintos scripts.

## Grafo
En esta carpeta se almacenará el grafo construido en el script de 01_Preprocesamiento_Analisis.

## Modelos
En esta carpeta se almacenarán los modelos realizados.

## funciones.py
Contiene las funciones que tienen en común distintos scripts.

## 01_Preprocesamiento_Analisis.ipynb
En este script se limpia y se procesa los datos originales de las prendas para construir un grafo de relaciones, analizando la conectividad y los grupos de estilo mediante métricas de red.

## 02_Modelado.ipynb
En este script se implementa una solucion para la prediccion de las relaciones entre una prenda nueva y las prendas anteriormente incorporadas al sistema mediante modelo GNN.

## producer.py
Este script actúa como una interfaz de usuario (Flask) que recibe los datos de una prenda, utiliza un modelo GNN para generar los mejores "outfits" posibles y envía esas recomendaciones a un servidor de Kafka. Para la ejecucion de este script es necesario descargarse el modelo subido a drive que se obtiene tras la ejecucion de los scripts 01_Preprocesamiento_Analisis y 02_Modelado. Y para que en las recomendaciones aparezcan los nombres de las prendas en vez de los ID es necesario la ejecucion del script 01_Preprocesamiento_Analisis (Si no se ejecuta este script en las recomendaciones apareceran los IDs)

## consumer.py
Este script se conecta al servidor de Kafka para recibir en tiempo real las recomendaciones generadas y las muestra de forma visual en un tablero o panel de control (dashboard) web.

## Analisis_UX.ipynb
En este script se analiza el cuestionario inicial de la web de Lookiero.

## Caracterizacion_Analisis.ipynb
En este script se lleva a cabo la caracterizacion y analisis de los datos de Look&Like.

## Integrantes
- Anne Martin Basterrechea
- Gorka Fernandez Arnaiz
- Martina Virgina Alvarez Tejerina
- Garazi Martinez de Marigorta Corral
- Daniel Iriondo Echano
- Leire Silva Cisneros
