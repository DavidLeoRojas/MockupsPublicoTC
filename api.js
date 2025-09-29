// Updated JavaScript for connecting to Spring Boot backend
// Configuration for backend connection
const API_BASE_URL = 'http://localhost:8080/api';

// Function to verify connection
async function verificarConexion() {
    const statusElement = document.getElementById('connection-status');
    statusElement.innerHTML = '🔄 Verificando conexión...';
    statusElement.className = 'connection-status verifying';
    
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend conectado:', data);
            statusElement.innerHTML = `🟢 ${data.service} Conectado`;
            statusElement.className = 'connection-status connected';
            
            // Test additional endpoint
            testPublicInfo();
            return true;
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        statusElement.innerHTML = '🔴 Backend Sin Conexión';
        statusElement.className = 'connection-status disconnected';
        return false;
    }
}

// Test public info endpoint
async function testPublicInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/public/info`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('📊 Información pública cargada:', data);
            
            // Optional: Update any elements with this data
            // Example: document.getElementById('company-name').textContent = data.nombre;
        }
    } catch (error) {
        console.error('⚠️ Error cargando información pública:', error);
    }
}

// Function to perform consultations with Gemini
async function consultarGemini(consulta, contexto = '') {
    try {
        const response = await fetch(`${API_BASE_URL}/consulta`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            body: JSON.stringify({
                consulta: consulta,
                contexto: contexto
            })
        });

        if (response.ok) {
            return await response.json();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Error en la consulta');
        }
    } catch (error) {
        console.error('Error en consulta:', error);
        throw error;
    }
}

// Function to analyze documents
async function analizarDocumento(archivo, tipoAnalisis = 'general', instrucciones = '') {
    try {
        const formData = new FormData();
        formData.append('documento', archivo);
        formData.append('tipoAnalisis', tipoAnalisis);
        if (instrucciones) {
            formData.append('instrucciones', instrucciones);
        }

        const response = await fetch(`${API_BASE_URL}/analizar-documento`, {
            method: 'POST',
            mode: 'cors',
            body: formData
        });

        if (response.ok) {
            return await response.json();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Error analizando documento');
        }
    } catch (error) {
        console.error('Error en análisis:', error);
        throw error;
    }
}

// Function to generate quotes
async function generarCotizacion(datos) {
    try {
        const response = await fetch(`${API_BASE_URL}/cotizacion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            body: JSON.stringify(datos)
        });

        if (response.ok) {
            return await response.json();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Error generando cotización');
        }
    } catch (error) {
        console.error('Error en cotización:', error);
        throw error;
    }
}

// UI Helper Functions
function mostrarLoading(elemento) {
    elemento.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>🤖 Procesando con Gemini AI...</p>
        </div>
    `;
    elemento.style.display = 'block';
}

function mostrarError(mensaje, elemento) {
    elemento.innerHTML = `
        <div class="error-message">
            <button onclick="this.parentElement.parentElement.style.display='none'" class="close-btn">&times;</button>
            <strong>❌ Error:</strong> ${mensaje}
        </div>
    `;
    elemento.style.display = 'block';
}

function mostrarResultado(contenido, elemento) {
    elemento.innerHTML = `
        <div class="resultado-exitoso">
            ${contenido}
        </div>
    `;
    elemento.style.display = 'block';
}

// Form Handlers
async function realizarConsulta() {
    const consulta = document.getElementById('consulta-input').value.trim();
    const contexto = document.getElementById('contexto-input').value.trim();
    const resultadoDiv = document.getElementById('resultado-consulta');
    
    if (!consulta) {
        mostrarError('Por favor ingrese una consulta', resultadoDiv);
        return;
    }
    
    try {
        mostrarLoading(resultadoDiv);
        const respuesta = await consultarGemini(consulta, contexto);
        mostrarResultado(`
            <h4>🤖 Respuesta de Gemini AI:</h4>
            <div class="respuesta-content">${respuesta.respuesta.replace(/\n/g, '<br>')}</div>
            <small class="timestamp">⏰ ${new Date(respuesta.timestamp).toLocaleString('es-CO')}</small>
        `, resultadoDiv);
        
        // Clear form
        document.getElementById('consulta-input').value = '';
        document.getElementById('contexto-input').value = '';
    } catch (error) {
        mostrarError(error.message, resultadoDiv);
    }
}

async function realizarAnalisis() {
    const archivo = document.getElementById('archivo-input').files[0];
    const tipoAnalisis = document.getElementById('tipo-analisis').value;
    const instrucciones = document.getElementById('instrucciones-analisis').value;
    const resultadoDiv = document.getElementById('resultado-analisis');
    
    if (!archivo) {
        mostrarError('Por favor seleccione un archivo', resultadoDiv);
        return;
    }
    
    if (archivo.size > 10 * 1024 * 1024) {
        mostrarError('El archivo es demasiado grande. Máximo 10MB', resultadoDiv);
        return;
    }
    
    try {
        mostrarLoading(resultadoDiv);
        const respuesta = await analizarDocumento(archivo, tipoAnalisis, instrucciones);
        mostrarResultado(`
            <h4>📄 Análisis del documento: ${respuesta.archivo}</h4>
            <div class="analisis-content">${respuesta.analisis.replace(/\n/g, '<br>')}</div>
            <small class="timestamp">⏰ ${new Date(respuesta.timestamp).toLocaleString('es-CO')}</small>
        `, resultadoDiv);
        
        // Clear form
        document.getElementById('archivo-input').value = '';
        document.getElementById('instrucciones-analisis').value = '';
    } catch (error) {
        mostrarError(error.message, resultadoDiv);
    }
}

async function realizarCotizacion() {
    const form = document.getElementById('form-cotizacion');
    const formData = new FormData(form);
    const resultadoDiv = document.getElementById('resultado-cotizacion');
    
    const datos = {
        tipoServicio: formData.get('tipoServicio'),
        ubicacion: formData.get('ubicacion'),
        tamaño: formData.get('tamaño'),
        frecuencia: formData.get('frecuencia'),
        descripcion: formData.get('descripcion'),
        contacto: {
            nombre: formData.get('nombre'),
            email: formData.get('email'),
            telefono: formData.get('telefono'),
            empresa: formData.get('empresa')
        }
    };
    
    if (!datos.tipoServicio || !datos.ubicacion) {
        mostrarError('Por favor complete al menos el tipo de servicio y la ubicación', resultadoDiv);
        return;
    }
    
    try {
        mostrarLoading(resultadoDiv);
        const respuesta = await generarCotizacion(datos);
        mostrarResultado(`
            <h4>💰 Cotización Generada</h4>
            <div class="cotizacion-content">${respuesta.cotizacion.replace(/\n/g, '<br>')}</div>
            <div class="cotizacion-actions">
                <button onclick="descargarCotizacion()" class="btn-descargar">📥 Descargar TXT</button>
                <button onclick="imprimirCotizacion()" class="btn-imprimir">🖨️ Imprimir</button>
            </div>
            <small class="timestamp">⏰ ${new Date(respuesta.timestamp).toLocaleString('es-CO')}</small>
        `, resultadoDiv);
        
        // Clear form
        form.reset();
    } catch (error) {
        mostrarError(error.message, resultadoDiv);
    }
}

// Download and Print Functions
function descargarCotizacion() {
    const contenido = document.querySelector('.cotizacion-content');
    if (contenido) {
        const texto = contenido.innerText;
        const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `cotizacion_gemini_ambiental_${new Date().getTime()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

function imprimirCotizacion() {
    const contenido = document.querySelector('.cotizacion-content');
    if (contenido) {
        const ventanaImpresion = window.open('', '_blank');
        ventanaImpresion.document.write(`
            <html>
                <head>
                    <title>Cotización - Gemini Ambiental S.A.S</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                        h1 { color: #2c5f41; }
                        .header { border-bottom: 2px solid #4a8b64; padding-bottom: 10px; margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Gemini Ambiental S.A.S</h1>
                        <p>Control de Plagas y Saneamiento Ambiental</p>
                    </div>
                    ${contenido.innerHTML}
                </body>
            </html>
        `);
        ventanaImpresion.document.close();
        ventanaImpresion.print();
    }
}

// Debug function for testing connection
window.testConnection = async function() {
    console.log('🧪 Testing connection manually...');
    try {
        const result = await verificarConexion();
        if (result) {
            alert('✅ Conexión exitosa con el backend Spring Boot!');
        }
    } catch (error) {
        alert('❌ Error de conexión: ' + error.message);
        console.error('Connection test failed:', error);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌿 Gemini Ambiental S.A.S - Sistema iniciado');
    
    // Wait a moment before checking connection to ensure server is ready
    setTimeout(verificarConexion, 1000);
    
    // Add Enter key support for consultation input
    const consultaInput = document.getElementById('consulta-input');
    if (consultaInput) {
        consultaInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                realizarConsulta();
            }
        });
    }
    
    // Add file type validation
    const archivoInput = document.getElementById('archivo-input');
    if (archivoInput) {
        archivoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const allowedTypes = ['pdf', 'txt', 'csv', 'xlsx', 'docx'];
                const fileExtension = file.name.split('.').pop().toLowerCase();
                
                if (!allowedTypes.includes(fileExtension)) {
                    alert('Tipo de archivo no permitido. Solo se aceptan: PDF, TXT, CSV, XLSX, DOCX');
                    e.target.value = '';
                    return;
                }
                
                if (file.size > 10 * 1024 * 1024) {
                    alert('El archivo es demasiado grande. Máximo 10MB');
                    e.target.value = '';
                    return;
                }
            }
        });
    }
});