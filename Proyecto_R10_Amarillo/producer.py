import json
import uuid
import pandas as pd
from flask import Flask, render_template_string, request
from confluent_kafka import Producer
import os
import torch
from funciones import *
import time
import pandas.core.arrays.string_arrow as _string_arrow
_original_init = _string_arrow.StringDtype.__init__
def _patched_init(self, *args, **kwargs):
    if len(args) > 2:
        args = args[:1]
    return _original_init(self, *args, **kwargs)
_string_arrow.StringDtype.__init__ = _patched_init

app = Flask(__name__)

conf = {
    'bootstrap.servers': 'localhost:9092'
}
producer = Producer(conf)
TOPIC_NAME = 'outfit_topic'

MODEL_COLUMNS = [
    'lookiero_L', 'lookiero_M', 'lookiero_S', 'lookiero_UNQ', 'lookiero_X4XL', 
    'lookiero_XL', 'lookiero_XS', 'lookiero_XXL', 'lookiero_XXS', 'lookiero_XXXL', 
    'fit_', 'fit_loose', 'fit_oversize', 'fit_straight', 'fit_tight', 
    'style_boho', 'style_casual', 'style_classic', 'style_minimal', 
    'style_night', 'style_street', 
    'weather_cold', 'weather_cold_season', 'weather_warm', 'weather_warm_season', 
    'Nivel_1.1', 'Nivel_1.2', 'Nivel_2.1', 'Nivel_2.2', 'Nivel_2.3', 
    'Nivel_3.1', 'Nivel_3.2', 'Nivel_3.3', 
    'Estampado_atrevidos', 'Estampado_geometricos', 'Estampado_micros', 
    'Estampado_neutros', 'Estampado_organicos', 
    'colores_A', 'colores_AI', 'colores_AS', 'colores_NE', 'colores_NO', 'colores_NT'
]

def procesar_datos_para_modelo(datos_raw):
    data = {col: 0 for col in MODEL_COLUMNS}
    
    new_id = str(uuid.uuid4())
    
    tipo = datos_raw['tipo_producto']
    nivel = None
    if tipo in ['Jeans', 'Falda']: nivel = '1.1'
    elif tipo in ['Dress']: nivel = '1.2'
    elif tipo in ['Top', 'Tshirt']: nivel = '2.1'
    elif tipo in ['Pullover']: nivel = '2.2'
    elif tipo in ['Cardigan']: nivel = '2.3'
    elif tipo in ['Jacket', 'Coat']: nivel = '3.1'
    elif tipo in ['Foulard']: nivel = '3.2'
    elif tipo in ['Bag']: nivel = '3.3'
    
    if nivel:
        col_nivel = f"Nivel_{nivel}"
        if col_nivel in data: data[col_nivel] = 1

    pr = datos_raw['print']
    estampado_group = None
    if pr in ['bodoque']: estampado_group = 'neutros'
    elif pr in ['geometric', 'vichy']: estampado_group = 'geometricos'
    elif pr in ['floral']: estampado_group = 'organicos'
    elif pr in ['animal_print', 'retro']: estampado_group = 'atrevidos'
    elif pr in ['miniprint']: estampado_group = 'micros'
    
    if estampado_group:
        col_est = f"Estampado_{estampado_group}"
        if col_est in data: data[col_est] = 1

    clr = datos_raw['color']
    color_group = None
    if clr in ['white', 'black']: color_group = 'NE'
    elif clr in ['brown', 'beige']: color_group = 'NT'
    elif clr in ['blue_dark', 'green_dark']: color_group = 'NO'
    elif clr in ['red', 'yellow']: color_group = 'A'
    elif clr in ['baby_blue', 'pink']: color_group = 'AS'
    elif clr in ['rust', 'purple']: color_group = 'AI'
    
    if color_group:
        col_col = f"colores_{color_group}"
        if col_col in data: data[col_col] = 1

    try:
        talla_json = json.loads(datos_raw['lookiero'])
        size_val = talla_json.get('size')
        if size_val:
            col_talla = f"lookiero_{size_val}"
            if col_talla in data: data[col_talla] = 1
    except:
        pass

    fit_val = datos_raw.get('fit')
    if fit_val:
        col_fit = f"fit_{fit_val}"
        if col_fit in data: data[col_fit] = 1
        
    style_val = datos_raw.get('style') 
    if style_val:
        col_style = f"style_{style_val}"
        if col_style in data: data[col_style] = 1

    weather_val = datos_raw.get('weather')
    if weather_val:
        col_weather = f"weather_{weather_val}"
        if col_weather in data: data[col_weather] = 1
        col_weather_season = f"weather_{weather_val}_season"
        if col_weather_season in data: data[col_weather_season] = 1

    df_final = pd.DataFrame([data])
    
    df_final.index = [new_id]
    df_final.index.name = 'id_producto'
    
    df_final = df_final[MODEL_COLUMNS]
    
    return df_final


MODEL_PATH = "Modelos/modelo_gcn.pkl"

if not os.path.exists(MODEL_PATH):
    print(f"Error: No se encuentra '{MODEL_PATH}'. Asegúrate de haberlo entrenado.")
    
try:
    model = torch.load(MODEL_PATH, map_location='cpu', weights_only=False)

    print(f"Modelo '{MODEL_PATH}' cargado correctamente (con torch).")
except Exception as e:
    print(f"Error cargando el modelo: {e}")

pack = torch.load(
    'Datos/Transformados/datos_sistema.pt', 
    map_location='cpu', 
    weights_only=False 
)
data_prod = pack['graph_data'] 
df_meta_prod = pack['df_meta'] 
node_ids_prod = pack['node_ids']  

PATH_CSV_NOMBRES = "Datos/Transformados/csv_limpio.csv" 
id_to_name_map = {}

if os.path.exists(PATH_CSV_NOMBRES):
    try:
        df_nombres = pd.read_csv(PATH_CSV_NOMBRES)
        
        col_id = 'id_producto' if 'id_producto' in df_nombres.columns else df_nombres.columns[0]
        posibles_cols_nombre = ['name', 'nombre', 'product_name', 'title', 'descripcion']
        col_nombre = 'name' 
        for col in posibles_cols_nombre:
            if col in df_nombres.columns:
                col_nombre = col
                break
        
        id_to_name_map = dict(zip(df_nombres[col_id].astype(str), df_nombres[col_nombre]))
        
    except Exception as e:
        print(f"Error cargando csv_limpio.csv: {e}")
else:
    print(f"No se encontró {PATH_CSV_NOMBRES}. Se enviarán IDs en lugar de nombres.")

HTML_FORM = """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Fashion AI Producer</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background-color: #f8f9fa; display: flex; justify-content: center; padding: 20px; }
        .card { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); width: 100%; max-width: 500px; }
        h2 { text-align: center; color: #333; margin-bottom: 20px; }
        .form-group { margin-bottom: 15px; }
        label { font-weight: 600; font-size: 0.9em; color: #555; display: block; margin-bottom: 5px; }
        select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; background: #fff; font-size: 14px; }
        
        /* COLOR VISUAL */
        .color-container { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 5px; }
        .color-input { display: none; }
        .color-label { width: 35px; height: 35px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; box-shadow: 0 2px 5px rgba(0,0,0,0.1); transition: transform 0.2s; }
        .color-label:hover { transform: scale(1.1); }
        .color-input:checked + .color-label { border: 3px solid #333; transform: scale(1.1); }

        button { width: 100%; padding: 15px; background: #2d3436; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 20px; }
        button:hover { background: #000; }
        .msg { background: #d1e7dd; color: #0f5132; padding: 10px; border-radius: 5px; margin-bottom: 15px; text-align: center;}
    </style>
</head>
<body>
    <div class="card">
        {% if msg %} <div class="msg">{{ msg }}</div> {% endif %}
        <h2>Generador de Looks</h2>
        <form action="/procesar" method="post">
            <div style="display: flex; gap: 15px;">
                <div class="form-group" style="flex:1">
                    <label>Tipo de Producto</label>
                    <select name="tipo_producto" required>
                        <option value="Jeans">Jeans</option>
                        <option value="Dress">Dress</option>
                        <option value="Falda">Falda</option>
                        <option value="Tshirt">T-shirt</option>
                        <option value="Top">Top</option>
                        <option value="Cardigan">Cardigan</option>
                        <option value="Pullover">Pullover</option>
                        <option value="Jacket">Jacket</option>
                        <option value="Coat">Coat</option>
                        <option value="Foulard">Foulard</option>
                        <option value="Bag">Bag</option>
                    </select>
                </div>
                <div class="form-group" style="flex:1">
                    <label>Talla</label>
                    <select name="talla" required>
                        <option value='{"size": "XS", "format": "XS"}'>XS</option>
                        <option value='{"size": "S", "format": "S"}'>S</option>
                        <option value='{"size": "M", "format": "M"}' selected>M</option>
                        <option value='{"size": "L", "format": "L"}'>L</option>
                        <option value='{"size": "XL", "format": "XL"}'>XL</option>
                    </select>
                </div>
            </div>
            <div style="display: flex; gap: 15px;">
                <div class="form-group" style="flex:1">
                    <label>Style</label>
                    <select name="style" required>
                        <option value="casual">Casual</option>
                        <option value="classic">Classic</option>
                        <option value="minimal">Minimal</option>
                        <option value="street">Street</option>
                        <option value="boho">Boho</option>
                    </select>
                </div>
                <div class="form-group" style="flex:1">
                    <label>Fit</label>
                    <select name="fit" required>
                        <option value="tight">Tight</option>
                        <option value="straight">Straight</option>
                        <option value="loose">Loose</option>
                        <option value="oversize">Oversize</option>
                    </select>
                </div>
            </div>
            <div style="display: flex; gap: 15px;">
                <div class="form-group" style="flex:1">
                    <label>Weather</label>
                    <select name="weather" required>
                        <option value="warm">Soleado / Calor</option>
                        <option value="cold">Lluvia / Frío</option>
                    </select>
                </div>
                <div class="form-group" style="flex:1">
                    <label>Estampado</label>
                    <select name="estampado" required>
                        <option value="bodoque">Bodoque</option>
                        <option value="geometric">Geometric</option>
                        <option value="vichy">Vichy</option>
                        <option value="floral">Floral</option>
                        <option value="animal_print">Animal Print</option>
                        <option value="retro">Retro</option>
                        <option value="miniprint">Mini print</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Color Principal</label>
                <div class="color-container">
                    <input type="radio" name="color" id="c-negro" value="black" class="color-input" checked>
                    <label for="c-negro" class="color-label" style="background-color: #000;"></label>
                    <input type="radio" name="color" id="c-blanco" value="white" class="color-input">
                    <label for="c-blanco" class="color-label" style="background-color: #fff; border: 1px solid #ccc;"></label>
                    <input type="radio" name="color" id="c-beige" value="beige" class="color-input">
                    <label for="c-beige" class="color-label" style="background-color: #d1ccc0;"></label>
                    <input type="radio" name="color" id="c-brown" value="brown" class="color-input">
                    <label for="c-brown" class="color-label" style="background-color: #804000;"></label>
                    <input type="radio" name="color" id="c-blue_dark" value="blue_dark" class="color-input">
                    <label for="c-blue_dark" class="color-label" style="background-color: #1e213d;"></label>
                    <input type="radio" name="color" id="c-green_dark" value="green_dark" class="color-input">
                    <label for="c-green_dark" class="color-label" style="background-color: #1c542d;"></label>
                    <input type="radio" name="color" id="c-red" value="red" class="color-input">
                    <label for="c-red" class="color-label" style="background-color: #ff0000;"></label>
                    <input type="radio" name="color" id="c-yellow" value="yellow" class="color-input">
                    <label for="c-yellow" class="color-label" style="background-color: #ffff00;"></label>
                    <input type="radio" name="color" id="c-pink" value="pink" class="color-input">
                    <label for="c-pink" class="color-label" style="background-color: #ff0080;"></label>
                    <input type="radio" name="color" id="c-baby_blue" value="baby_blue" class="color-input">
                    <label for="c-baby_blue" class="color-label" style="background-color: #d1ebf7;"></label>
                    <input type="radio" name="color" id="c-purple" value="purple" class="color-input">
                    <label for="c-purple" class="color-label" style="background-color: #572364;"></label>
                    <input type="radio" name="color" id="c-rust" value="rust" class="color-input">
                    <label for="c-rust" class="color-label" style="background-color: #B7410E;"></label>
                </div>
            </div>
            <button type="submit">Generar Recomendación</button>
        </form>
    </div>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML_FORM)

@app.route('/procesar', methods=['POST'])
def procesar():
    datos_raw = {
        "tipo_producto": request.form['tipo_producto'],
        "lookiero": request.form['talla'],
        "fit": request.form['fit'],
        "style": request.form['style'],
        "weather": request.form['weather'],
        "print": request.form['estampado'],
        "color": request.form['color'] 
    }
    
    df_model_input = procesar_datos_para_modelo(datos_raw)

    tensor_input = torch.tensor(df_model_input.values, dtype=torch.float)
    
    tipo = datos_raw['tipo_producto']
    nivel = None
    if tipo in ['Jeans', 'Falda']: nivel = '1.1'
    elif tipo in ['Dress']: nivel = '1.2'
    elif tipo in ['Top', 'Tshirt']: nivel = '2.1'
    elif tipo in ['Pullover']: nivel = '2.2'
    elif tipo in ['Cardigan']: nivel = '2.3'
    elif tipo in ['Jacket', 'Coat']: nivel = '3.1'
    elif tipo in ['Foulard']: nivel = '3.2'
    elif tipo in ['Bag']: nivel = '3.3'
    

    best_looks_ids = generate_best_outfits(
    model=model,
    new_item_features=tensor_input,
    new_item_sublevel=nivel,
    data=data_prod,
    node_ids=node_ids_prod,
    df_meta=df_meta_prod,
    top_k=3
)
    
    best_looks_names = []
    
    if id_to_name_map:
        for look in best_looks_ids:
            look_con_nombres = [id_to_name_map.get(str(item_id), str(item_id)) for item_id in look]
            best_looks_names.append(look_con_nombres)
    else:
        best_looks_names = best_looks_ids

    kafka_payload = {
        "id_generated": str(uuid.uuid4()),
        "raw_input": datos_raw,
        "outfit_generado": best_looks_names,
        "timestamp": time.time()
    }

    msg = ""
    try:
        producer.produce(TOPIC_NAME, value=json.dumps(kafka_payload).encode('utf-8'))
        producer.flush()
        msg = f"¡Enviado! Se han generado {len(best_looks_names)} looks."
    except Exception as e:
        msg = f"Error Kafka: {str(e)}"
    
    return render_template_string(HTML_FORM, msg=msg)

if __name__ == '__main__':
    app.run(port=5000, debug=True)