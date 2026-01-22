from flask import Flask, Response, render_template_string
from confluent_kafka import Consumer

app = Flask(__name__)

conf = {
    'bootstrap.servers': 'localhost:9092',
    'group.id': 'dashboard-group',
    'auto.offset.reset': 'latest'
}

TOPIC_NAME = 'outfit_topic'

HTML_DASHBOARD = """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Monitor de Looks</title>
    <style>
        body { font-family: monospace; background: #111; color: #eee; padding: 20px; }
        .card { 
            background: #222; border-left: 5px solid #00d2ff; 
            margin-bottom: 15px; padding: 15px; border-radius: 4px;
            animation: fadein 0.5s;
        }
        .meta { color: #888; font-size: 0.9em; margin-bottom: 5px; }
        .look { font-size: 1.1em; color: #00d2ff; font-weight: bold; margin-left: 10px; }
        h1 { border-bottom: 1px solid #333; padding-bottom: 10px; }
        @keyframes fadein { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <h1>Consumer Dashboard (Tiempo Real)</h1>
    <div id="resultados"></div>

    <script>
        const evtSource = new EventSource("/stream-data");
        evtSource.onmessage = function(e) {
            const data = JSON.parse(e.data);
            const box = document.getElementById("resultados");
            
            // Formatear los looks (vienen como lista de listas)
            let looksHtml = "";
            if (data.outfit_generado && data.outfit_generado.length > 0) {
                looksHtml = data.outfit_generado.map((look, i) => 
                    `<div>Option ${i+1}: ${look.join(' + ')}</div>`
                ).join('');
            } else {
                looksHtml = "<div>No se encontraron combinaciones.</div>";
            }

            const html = `
                <div class="card">
                    <div class="meta">
                        ID: ${data.id_generated.substring(0,8)}... | 
                        Input: ${data.raw_input.tipo_producto} (${data.raw_input.color})
                    </div>
                    <div class="look">
                        ${looksHtml}
                    </div>
                </div>
            `;
            box.insertAdjacentHTML('afterbegin', html);
        }
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML_DASHBOARD) 

@app.route('/stream-data')
def stream_data():
    def generate():
        consumer = Consumer(conf)
        consumer.subscribe([TOPIC_NAME])
        
        try:
            while True:
                msg = consumer.poll(1.0)
                if msg is None: continue
                if msg.error():
                    print(f"Consumer error: {msg.error()}")
                    continue
                
                data_str = msg.value().decode('utf-8')
                yield f"data: {data_str}\n\n"
        except GeneratorExit:
            consumer.close()

    return Response(generate(), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(port=5001, debug=True, threaded=True)