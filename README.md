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
## Página web
En esta carpeta se encuentran todos los archivos necesarios para ejecutar y poder visualizar la página web que se ha desarrollado.
Aquí se describe la función de los archivos principales incluidos en la carpeta:
### HTML (`.html`) - La Estructura
* **`inicio.html`**: Es el archivo principal y el punto de entrada. Se define la barra de navegación, el menú lateral y los contenedores vacíos (divs) donde posteriormente se visualizarán los gráficos y las fotos mediante JavaScript.
### CSS (`.css`) - El Diseño Visual
* **`styles.css`**: Es la hoja de estilos encargada de la apariencia visual. Aquí se definen:
    * La paleta de colores corporativa de Lookiero (tonos teja, beige y neutros).
    * La tipografía (*Playfair Display* e *Inter*).
    * La maquetación de las tarjetas, sombras, botones y la adaptación a diferentes tamaños de pantalla (diseño responsivo).
### JavaScript (`.js`) - La Lógica y los Datos
Son los archivos encargados de dar interactividad y cargar los datos dinámicamente
funcionalidades específicas de la interfaz.

A continuación, se van a especificar las acciones que a simple vista no son tan visibles de la página web.
### 1. Ficha del Cliente (Barra Superior)
Ubicada en la **esquina superior derecha** de la cabecera (*Topbar*), junto al logotipo.
* **Cómo acceder:** Haz clic sobre la imagen circular (avatar) o el enlace.
* **Qué muestra:** Despliega la información demográfica y los datos clave de la empresa
### 2. Créditos del Equipo (Footer)
Ubicado en el **pie de página** de la web, al final del scroll.
* **Cómo acceder:** Haz clic en el botón/enlace situado en el footer.
* **Qué muestra:** Abre una sección dedicada donde se presentan los **6 participantes** del equipo de desarrollo ("Grupo Amarillo") que han realizado este proyecto.
## Integrantes
- Anne Martin Basterrechea
- Gorka Fernandez Arnaiz
- Martina Virgina Alvarez Tejerina
- Garazi Martinez de Marigorta Corral
- Daniel Iriondo Echano
- Leire Silva Cisneros
