// Motor de la Academia Visionarios Knowledge - Pantalla Completa e Interactiva con Velas Reales
const VisionariosKnowledge = {
    modal: null,
    
    init() {
        // 1. Crear el contenedor de Pantalla Completa (100vw, 100vh) oculto por defecto
        const modalHtml = `
            <div id="academy-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #0d0f12; z-index: 99999; font-family: sans-serif; color: #fff;">
                <div style="height: 60px; background: #161920; display: flex; justify-content: space-between; align-items: center; padding: 0 30px; border-bottom: 1px solid #262a35;">
                    <h2 style="color: #d4af37; margin: 0; font-size: 1.2rem; letter-spacing: 1px; font-weight: 800;">🐉 VISIONARIOS ACADEMY - MINICURSO DE PRICE ACTION</h2>
                    <button id="close-academy-btn" style="background: #1a1d24; color: #ff5252; border: 1px solid #ff5252; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; box-shadow: 2px 2px 5px rgba(0,0,0,0.3); transition: all 0.2s;">[X Cerrar Academia]</button>
                </div>
                
                <div style="display: flex; height: calc(100vh - 60px);">
                    <div id="academy-menu" style="width: 25%; background: #161920; border-right: 1px solid #262a35; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;">
                        <h3 style="color: #8f9cae; font-size: 0.9rem; margin-bottom: 10px; font-weight: 700; letter-spacing: 0.5px;">🎓 PROGRAMA ACADÉMICO:</h3>
                        <button class="session-btn" data-session="1" style="background: #1a1d24; text-align: left; padding: 15px; border-radius: 8px; border: 1px solid #343a46; color: #fff; cursor: pointer; font-weight: bold; transition: all 0.2s;">🏛️ SESIÓN 1: Estructura y Ciclos</button>
                        <button class="session-btn" data-session="2" style="background: #1a1d24; text-align: left; padding: 15px; border-radius: 8px; border: 1px solid #343a46; color: #fff; cursor: pointer; font-weight: bold; transition: all 0.2s;">🎯 SESIÓN 2: Zonas de Reacción</button>
                        <button class="session-btn" data-session="3" style="background: #1a1d24; text-align: left; padding: 15px; border-radius: 8px; border: 1px solid #343a46; color: #fff; cursor: pointer; font-weight: bold; transition: all 0.2s;">🕯️ SESIÓN 3: Velas Gatillo Indiv.</button>
                        <button class="session-btn" data-session="4" style="background: #1a1d24; text-align: left; padding: 15px; border-radius: 8px; border: 1px solid #343a46; color: #fff; cursor: pointer; font-weight: bold; transition: all 0.2s;">🔄 SESIÓN 4: Patrones Compuestos</button>
                        <button class="session-btn" data-session="5" style="background: #1a1d24; text-align: left; padding: 15px; border-radius: 8px; border: 1px solid #343a46; color: #fff; cursor: pointer; font-weight: bold; transition: all 0.2s;">📐 SESIÓN 5: Geometría Chartista</button>
                    </div>
                    
                    <div id="academy-content" style="width: 75%; padding: 40px; overflow-y: auto; display: flex; flex-direction: column; gap: 30px; background: #0d0f12; scroll-behavior: smooth;">
                        <div id="content-placeholder" style="text-align: center; color: #566175; margin-top: 100px;">
                            <p style="font-size: 1.5rem;">← Selecciona una Sesión del menú izquierdo para desplegar sus gráficas de alta fidelidad y el contenido teórico completo.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Inyectar el modal en el body de index.html sin romper nada
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modal = document.getElementById('academy-modal');
        
        // Configurar los Event Listeners
        this.bindEvents();
    },

    toggle() {
        if (this.modal) {
            if (this.modal.style.display === 'none' || this.modal.style.display === '') {
                this.modal.style.display = 'block';
                this.loadSessionContent("1");
            } else {
                this.modal.style.display = 'none';
            }
        }
    },
    
    bindEvents() {
        // Botón de Abrir - Selector seguro que busca por ID o texto en lugar de contains inválido
        const openBtn = document.getElementById('btn-trigger-library') || document.getElementById('open-library-btn');
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                this.toggle();
            });
        }
        
        // Botón de Cerrar Pantalla Completa
        const closeBtn = document.getElementById('close-academy-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.modal.style.display = 'none';
            });
        }
        
        // Detectar clicks en los botones de las Sesiones
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.session-btn');
            if (btn) {
                document.querySelectorAll('.session-btn').forEach(b => {
                    b.style.borderColor = '#343a46';
                    b.style.background = '#1a1d24';
                });
                btn.style.borderColor = '#d4af37';
                btn.style.background = 'rgba(212, 175, 55, 0.05)';
                
                const sessionId = btn.getAttribute('data-session');
                this.loadSessionContent(sessionId);
            }
        });
    },
    
    loadSessionContent(session) {
        const contentContainer = document.getElementById('academy-content');
        contentContainer.innerHTML = ''; // Limpiar panel derecho
        
        const defs = `
            <defs>
                <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="bull-grad" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stop-color="#144d47" />
                    <stop offset="100%" stop-color="#26a69a" />
                </linearGradient>
                <linearGradient id="bear-grad" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stop-color="#7a2222" />
                    <stop offset="100%" stop-color="#ff5252" />
                </linearGradient>
            </defs>
        `;

        if (session === "1") {
            contentContainer.innerHTML = `
                <h1 style="color: #26a69a; margin: 0; font-weight: 800;">🏛️ SESIÓN 1: ESTRUCTURA Y CICLOS DEL MERCADO (Price Action)</h1>
                <p style="color: #94a3b8; margin: 0; font-size: 1rem; line-height: 1.6;">Aprende a leer el mapa del mercado. La estructura de mercado te dice exactamente quién tiene el control del precio en cualquier momento dado.</p>
                
                <div style="background: #161920; border: 1px solid #262a35; border-radius: 12px; padding: 25px; display: flex; flex-direction: column; gap: 20px;">
                    <h3 style="color: #d4af37; margin: 0; font-size: 1.15rem; font-weight: 700;">1. Tendencia Alcista (Higher Highs / Higher Lows)</h3>
                    <p style="color: #cbd5e1; margin: 0; font-size: 0.95rem; line-height: 1.6;">
                        <strong>Psicología y Fundamento:</strong> Flujo constante de órdenes compradoras donde la demanda supera con creces la oferta disponible. Cada retroceso es absorbido por compradores institucionales (toros) en busca de liquidez en niveles de descuento.
                        <br><strong>Gatillo Operativo:</strong> Comprar en retrocesos que formen un HL (Mínimo más alto) apoyado en un soporte previo o nivel de Fibonacci.
                    </p>
                    <div style="background: #060709; height: 260px; border-radius: 8px; display: flex; justify-content: center; align-items: center; overflow: hidden; padding: 10px; border: 1px solid rgba(255,255,255,0.02);">
                        <svg width="100%" height="100%" viewBox="0 0 600 220" style="background:#060709;">
                            ${defs}
                            <!-- Eje Estructural Dorado Viejo Discontinuo -->
                            <path d="M 50 170 L 170 120 L 290 60" fill="none" stroke="#d4af37" stroke-width="1.5" stroke-dasharray="5 5" opacity="0.65"/>
                            
                            <!-- Velas Alcistas Verdes (Impulsos) -->
                            <!-- Vela 1 (Verde) -->
                            <line x1="50" y1="130" x2="50" y2="190" stroke="#26a69a" stroke-width="1.5" filter="url(#glow-green)"/>
                            <rect x="42" y="145" width="16" height="35" fill="url(#bull-grad)" stroke="#26a69a" stroke-width="1" filter="url(#glow-green)"/>
                            <!-- Vela 2 (Verde) -->
                            <line x1="90" y1="90" x2="90" y2="160" stroke="#26a69a" stroke-width="1.5" filter="url(#glow-green)"/>
                            <rect x="82" y="105" width="16" height="45" fill="url(#bull-grad)" stroke="#26a69a" stroke-width="1" filter="url(#glow-green)"/>
                            <!-- Vela 3 (Verde) -->
                            <line x1="130" y1="70" x2="130" y2="130" stroke="#26a69a" stroke-width="1.5" filter="url(#glow-green)"/>
                            <rect x="122" y="80" width="16" height="35" fill="url(#bull-grad)" stroke="#26a69a" stroke-width="1" filter="url(#glow-green)"/>
                            
                            <!-- Velas Bajistas Rojas (Retroceso / Pullback) -->
                            <!-- Vela 4 (Roja) -->
                            <line x1="170" y1="100" x2="170" y2="140" stroke="#ff5252" stroke-width="1.5" filter="url(#glow-red)"/>
                            <rect x="162" y="108" width="16" height="20" fill="url(#bear-grad)" stroke="#ff5252" stroke-width="1" filter="url(#glow-red)"/>
                            <!-- Vela 5 (Roja) -->
                            <line x1="210" y1="115" x2="210" y2="155" stroke="#ff5252" stroke-width="1.5" filter="url(#glow-red)"/>
                            <rect x="202" y="125" width="16" height="20" fill="url(#bear-grad)" stroke="#ff5252" stroke-width="1" filter="url(#glow-red)"/>
                            
                            <!-- Velas Alcistas Verdes (Nuevo Impulso Alcista HH) -->
                            <!-- Vela 6 (Verde) -->
                            <line x1="250" y1="70" x2="250" y2="140" stroke="#26a69a" stroke-width="1.5" filter="url(#glow-green)"/>
                            <rect x="242" y="85" width="16" height="45" fill="url(#bull-grad)" stroke="#26a69a" stroke-width="1" filter="url(#glow-green)"/>
                            <!-- Vela 7 (Verde) -->
                            <line x1="290" y1="30" x2="290" y2="100" stroke="#26a69a" stroke-width="1.5" filter="url(#glow-green)"/>
                            <rect x="282" y="45" width="16" height="45" fill="url(#bull-grad)" stroke="#26a69a" stroke-width="1" filter="url(#glow-green)"/>

                            <!-- Pivote Mínimo Más Alto (HL) Marcado -->
                            <circle cx="210" cy="145" r="7" fill="none" stroke="#d4af37" stroke-width="2"/>
                            <circle cx="210" cy="145" r="3" fill="#d4af37"/>
                            
                            <text x="65" y="195" fill="#8f9cae" font-size="10" font-family="monospace">Impulso Alcista</text>
                            <text x="145" y="60" fill="#ff5252" font-size="10" font-family="monospace">Retroceso</text>
                            <text x="225" y="165" fill="#d4af37" font-size="10" font-family="monospace">HL (Higher Low)</text>
                        </svg>
                    </div>
                </div>

                <div style="background: #161920; border: 1px solid #262a35; border-radius: 12px; padding: 25px; display: flex; flex-direction: column; gap: 20px;">
                    <h3 style="color: #d4af37; margin: 0; font-size: 1.15rem; font-weight: 700;">2. Tendencia Bajista (Lower Highs / Lower Lows)</h3>
                    <p style="color: #cbd5e1; margin: 0; font-size: 0.95rem; line-height: 1.6;">
                        <strong>Psicología y Fundamento:</strong> La oferta domina al mercado y ahoga las cotizaciones. Los institucionales (osos) inyectan volumen para romper mínimos previos (LL). Cada retroceso alcista es breve debido a la escasez de compradores en el flujo general.
                        <br><strong>Gatillo Operativo:</strong> Operar en cortos (ventas) al testear un LH (Máximo más bajo) o en la ruptura del LL previo.
                    </p>
                    <div style="background: #060709; height: 260px; border-radius: 8px; display: flex; justify-content: center; align-items: center; overflow: hidden; padding: 10px; border: 1px solid rgba(255,255,255,0.02);">
                        <svg width="100%" height="100%" viewBox="0 0 600 220" style="background:#060709;">
                            ${defs}
                            <!-- Eje Estructural Dorado Viejo Discontinuo -->
                            <path d="M 50 40 L 170 90 L 290 140" fill="none" stroke="#d4af37" stroke-width="1.5" stroke-dasharray="5 5" opacity="0.65"/>
                            
                            <!-- Velas Bajistas Rojas (Impulso Bajista) -->
                            <!-- Vela 1 (Roja) -->
                            <line x1="50" y1="20" x2="50" y2="80" stroke="#ff5252" stroke-width="1.5" filter="url(#glow-red)"/>
                            <rect x="42" y="30" width="16" height="35" fill="url(#bear-grad)" stroke="#ff5252" stroke-width="1" filter="url(#glow-red)"/>
                            <!-- Vela 2 (Roja) -->
                            <line x1="90" y1="45" x2="90" y2="115" stroke="#ff5252" stroke-width="1.5" filter="url(#glow-red)"/>
                            <rect x="82" y="55" width="16" height="45" fill="url(#bear-grad)" stroke="#ff5252" stroke-width="1" filter="url(#glow-red)"/>
                            <!-- Vela 3 (Roja) -->
                            <line x1="130" y1="80" x2="130" y2="140" stroke="#ff5252" stroke-width="1.5" filter="url(#glow-red)"/>
                            <rect x="122" y="90" width="16" height="35" fill="url(#bear-grad)" stroke="#ff5252" stroke-width="1" filter="url(#glow-red)"/>
                            
                            <!-- Velas Alcistas Verdes (Retroceso / Pullback) -->
                            <!-- Vela 4 (Verde) -->
                            <line x1="170" y1="75" x2="170" y2="125" stroke="#26a69a" stroke-width="1.5" filter="url(#glow-green)"/>
                            <rect x="162" y="85" width="16" height="25" fill="url(#bull-grad)" stroke="#26a69a" stroke-width="1" filter="url(#glow-green)"/>
                            <!-- Vela 5 (Verde) -->
                            <line x1="210" y1="55" x2="210" y2="105" stroke="#26a69a" stroke-width="1.5" filter="url(#glow-green)"/>
                            <rect x="202" y="65" width="16" height="25" fill="url(#bull-grad)" stroke="#26a69a" stroke-width="1" filter="url(#glow-green)"/>
                            
                            <!-- Velas Bajistas Rojas (Nuevo Impulso Bajista LL) -->
                            <!-- Vela 6 (Roja) -->
                            <line x1="250" y1="80" x2="250" y2="150" stroke="#ff5252" stroke-width="1.5" filter="url(#glow-red)"/>
                            <rect x="242" y="95" width="16" height="40" fill="url(#bear-grad)" stroke="#ff5252" stroke-width="1" filter="url(#glow-red)"/>
                            <!-- Vela 7 (Roja) -->
                            <line x1="290" y1="120" x2="290" y2="190" stroke="#ff5252" stroke-width="1.5" filter="url(#glow-red)"/>
                            <rect x="282" y="130" width="16" height="45" fill="url(#bear-grad)" stroke="#ff5252" stroke-width="1" filter="url(#glow-red)"/>

                            <!-- Pivote Máximo Más Bajo (LH) Marcado -->
                            <circle cx="210" cy="65" r="7" fill="none" stroke="#d4af37" stroke-width="2"/>
                            <circle cx="210" cy="65" r="3" fill="#d4af37"/>
                            
                            <text x="65" y="145" fill="#8f9cae" font-size="10" font-family="monospace">Impulso Bajista</text>
                            <text x="145" y="145" fill="#26a69a" font-size="10" font-family="monospace">Retroceso</text>
                            <text x="225" y="50" fill="#d4af37" font-size="10" font-family="monospace">LH (Lower High)</text>
                        </svg>
                    </div>
                </div>
            `;
        } else if (session === "2") {
            contentContainer.innerHTML = `
                <h1 style="color: #26a69a; margin: 0; font-weight: 800;">🎯 SESIÓN 2: ZONAS DE REACCIÓN (Soportes y Resistencias)</h1>
                <p style="color: #94a3b8; margin: 0; font-size: 1rem; line-height: 1.6;">El precio tiene memoria. Las zonas de reacción marcan los niveles clave de oferta y demanda institucional del pasado.</p>
                
                <div style="background: #161920; border: 1px solid #262a35; border-radius: 12px; padding: 25px; display: flex; flex-direction: column; gap: 20px;">
                    <h3 style="color: #d4af37; margin: 0; font-size: 1.15rem; font-weight: 700;">1. Zonas de Soporte (Pisos de Demanda)</h3>
                    <p style="color: #cbd5e1; margin: 0; font-size: 0.95rem; line-height: 1.6;">
                        <strong>Psicología y Fundamento:</strong> Nivel de precios en donde el interés de compra (demanda) es lo suficientemente fuerte como para superar la presión de venta (oferta). Representa el valor considerado 'barato' por las instituciones de inversión.
                        <br><strong>Confluencia:</strong> Se busca gatillar compras (Win [+]) en soportes horizontales cuando la racha diaria viene limpia.
                    </p>
                    <div style="background: #060709; height: 260px; border-radius: 8px; display: flex; justify-content: center; align-items: center; overflow: hidden; padding: 10px; border: 1px solid rgba(255,255,255,0.02);">
                        <svg width="100%" height="100%" viewBox="0 0 600 220" style="background:#060709;">
                            ${defs}
                            <!-- Soporte Horizontal Verde -->
                            <line x1="50" y1="170" x2="550" y2="170" stroke="#26a69a" stroke-width="3" filter="url(#glow-green)"/>
                            
                            <!-- Trayectoria del Precio rebotando -->
                            <path d="M 70 40 L 150 170 L 250 80 L 350 170 L 450 70 L 510 170" fill="none" stroke="#d4af37" stroke-width="2.5" stroke-linejoin="round"/>
                            
                            <!-- Círculos de Rebote -->
                            <circle cx="150" cy="170" r="8" fill="#26a69a" filter="url(#glow-green)"/>
                            <circle cx="350" cy="170" r="8" fill="#26a69a" filter="url(#glow-green)"/>
                            <circle cx="510" cy="170" r="8" fill="#26a69a" filter="url(#glow-green)"/>
                            
                            <text x="300" y="200" fill="#26a69a" font-size="12" font-family="monospace" text-anchor="middle" font-weight="bold">ZONA DE SOPORTE (COMPRADORES ACTIVOS)</text>
                        </svg>
                    </div>
                </div>

                <div style="background: #161920; border: 1px solid #262a35; border-radius: 12px; padding: 25px; display: flex; flex-direction: column; gap: 20px;">
                    <h3 style="color: #d4af37; margin: 0; font-size: 1.15rem; font-weight: 700;">2. Zonas de Resistencia (Techos de Oferta)</h3>
                    <p style="color: #cbd5e1; margin: 0; font-size: 0.95rem; line-height: 1.6;">
                        <strong>Psicología y Fundamento:</strong> Nivel donde el flujo de ventas (oferta) es tan masivo que bloquea cualquier ascenso del precio. Los operadores institucionales consideran el activo 'caro' y liquidan compras o abren cortos (ventas).
                        <br><strong>Estrategia:</strong> Confirmar rechazos con velas tipo martillo invertido o doji antes de gatillar la venta.
                    </p>
                    <div style="background: #060709; height: 260px; border-radius: 8px; display: flex; justify-content: center; align-items: center; overflow: hidden; padding: 10px; border: 1px solid rgba(255,255,255,0.02);">
                        <svg width="100%" height="100%" viewBox="0 0 600 220" style="background:#060709;">
                            ${defs}
                            <!-- Resistencia Horizontal Roja -->
                            <line x1="50" y1="50" x2="550" y2="50" stroke="#ff5252" stroke-width="3" filter="url(#glow-red)"/>
                            
                            <!-- Trayectoria del precio rebotando -->
                            <path d="M 70 180 L 150 50 L 250 140 L 350 50 L 450 150 L 510 50" fill="none" stroke="#d4af37" stroke-width="2.5" stroke-linejoin="round"/>
                            
                            <!-- Círculos de Rebote -->
                            <circle cx="150" cy="50" r="8" fill="#ff5252" filter="url(#glow-red)"/>
                            <circle cx="350" cy="50" r="8" fill="#ff5252" filter="url(#glow-red)"/>
                            <circle cx="510" cy="50" r="8" fill="#ff5252" filter="url(#glow-red)"/>
                            
                            <text x="300" y="25" fill="#ff5252" font-size="12" font-family="monospace" text-anchor="middle" font-weight="bold">ZONA DE RESISTENCIA (VENDEDORES ACTIVOS)</text>
                        </svg>
                    </div>
                </div>
            `;
        } else if (session === "3") {
            contentContainer.innerHTML = `
                <h1 style="color: #26a69a; margin: 0; font-weight: 800;">🕯️ SESIÓN 3: VELAS GATILLO INDIVIDUALES (Anatomía y Rechazo)</h1>
                <p style="color: #94a3b8; margin: 0; font-size: 1rem; line-height: 1.6;">Las velas cuentan la historia de los toros y los osos en tiempo real. Aprende a identificar las velas individuales de giro de tendencia.</p>
                
                <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 300px; background: #161920; border: 1px solid #262a35; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 15px;">
                        <h3 style="color: #d4af37; margin: 0;">1. El Martillo (Hammer)</h3>
                        <p style="color: #cbd5e1; margin: 0; font-size: 0.9rem; line-height: 1.5;">
                            <strong>Descripción:</strong> Cuerpo pequeño arriba y mecha inferior que mide al menos el doble del cuerpo real. 
                            <br><strong>Significado:</strong> Fuerte rechazo alcista en una zona de soporte.
                        </p>
                        <div style="background: #060709; height: 180px; border-radius: 8px; display: flex; justify-content: center; align-items: center;">
                            <svg width="120" height="160" viewBox="0 0 100 120">
                                <line x1="50" y1="20" x2="50" y2="105" stroke="#26a69a" stroke-width="2.5"/>
                                <rect x="35" y="20" width="30" height="25" fill="#26a69a" stroke="#fff" stroke-width="0.5"/>
                                <circle cx="50" cy="105" r="4" fill="#ffd700"/>
                            </svg>
                        </div>
                    </div>

                    <div style="flex: 1; min-width: 300px; background: #161920; border: 1px solid #262a35; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 15px;">
                        <h3 style="color: #d4af37; margin: 0;">2. Estrella Fugaz (Shooting Star)</h3>
                        <p style="color: #cbd5e1; margin: 0; font-size: 0.9rem; line-height: 1.5;">
                            <strong>Descripción:</strong> Cuerpo pequeño abajo y mecha superior larga que duplica o triplica el tamaño del cuerpo.
                            <br><strong>Significado:</strong> Fuerte rechazo bajista en zona de resistencia.
                        </p>
                        <div style="background: #060709; height: 180px; border-radius: 8px; display: flex; justify-content: center; align-items: center;">
                            <svg width="120" height="160" viewBox="0 0 100 120">
                                <line x1="50" y1="15" x2="50" y2="100" stroke="#ff5252" stroke-width="2.5"/>
                                <rect x="35" y="75" width="30" height="25" fill="#ff5252" stroke="#fff" stroke-width="0.5"/>
                                <circle cx="50" cy="15" r="4" fill="#ffd700"/>
                            </svg>
                        </div>
                    </div>
                </div>
            `;
        } else if (session === "4") {
            contentContainer.innerHTML = `
                <h1 style="color: #26a69a; margin: 0; font-weight: 800;">🔄 SESIÓN 4: PATRONES COMPUESTOS (Combinaciones de Fuerza)</h1>
                <p style="color: #94a3b8; margin: 0; font-size: 1rem; line-height: 1.6;">La interacción entre dos o más velas consecutivas ofrece señales con una fiabilidad muy superior en la acción del precio.</p>
                
                <div style="background: #161920; border: 1px solid #262a35; border-radius: 12px; padding: 25px; display: flex; flex-direction: column; gap: 20px;">
                    <h3 style="color: #d4af37; margin: 0; font-size: 1.15rem; font-weight: 700;">1. Envolvente Alcista (Bullish Engulfing)</h3>
                    <p style="color: #cbd5e1; margin: 0; font-size: 0.95rem; line-height: 1.6;">
                        <strong>Psicología y Fundamento:</strong> Una pequeña vela bajista es 'devorada' por el cuerpo masivo de la siguiente vela verde. Indica que la fuerza del mercado ha cambiado drásticamente en favor de los compradores.
                        <br><strong>Confirmación:</strong> Esperar el cierre de la vela envolvente para gatillar la compra inmediatamente en operaciones de 1-2 minutos.
                    </p>
                    <div style="background: #060709; height: 200px; border-radius: 8px; display: flex; justify-content: center; align-items: center;">
                        <svg width="200" height="150" viewBox="0 0 160 120">
                            <!-- Vela Roja -->
                            <line x1="50" y1="40" x2="50" y2="80" stroke="#ff5252" stroke-width="2"/>
                            <rect x="40" y="48" width="20" height="24" fill="#ff5252"/>
                            
                            <!-- Vela Verde Envolvente -->
                            <line x1="110" y1="20" x2="110" y2="100" stroke="#26a69a" stroke-width="2.5"/>
                            <rect x="98" y="28" width="24" height="64" fill="#26a69a"/>
                            
                            <path d="M 65 30 L 90 30" stroke="#ffd700" stroke-width="1.5" stroke-dasharray="3 3"/>
                            <path d="M 65 90 L 90 90" stroke="#ffd700" stroke-width="1.5" stroke-dasharray="3 3"/>
                        </svg>
                    </div>
                </div>
            `;
        } else if (session === "5") {
            contentContainer.innerHTML = `
                <h1 style="color: #d4af37; margin: 0; font-weight: 800;">📐 SESIÓN 5: GEOMETRÍA CHARTISTA (Patrones de Figuras Avanzados)</h1>
                <p style="color: #94a3b8; margin: 0; font-size: 1rem; line-height: 1.6;">Las figuras geométricas representan la consolidación del mercado y facilitan predecir la dirección y el tamaño del próximo impulso explosivo.</p>
                
                <div style="background: #161920; border: 1px solid #262a35; border-radius: 12px; padding: 25px; display: flex; flex-direction: column; gap: 20px;">
                    <h3 style="color: #d4af37; margin: 0; font-size: 1.15rem; font-weight: 700;">1. Doble Techo (En Forma de 'M')</h3>
                    <p style="color: #cbd5e1; margin: 0; font-size: 0.95rem; line-height: 1.6;">
                        <strong>Psicología y Fundamento:</strong> El precio sube y choca contra una fuerte resistencia, retrocede a un mínimo (neckline), intenta subir nuevamente pero el volumen es insuficiente y es rechazado exactamente en la misma zona de resistencia previa. Denota que la tendencia alcista se ha agotado y cambiará a bajista.
                        <br><strong>Plan de Operación:</strong> Esperar la ruptura de la línea de cuello (Neckline) para operar en ventas.
                    </p>
                    <div style="background: #060709; height: 240px; border-radius: 8px; display: flex; justify-content: center; align-items: center; border: 1px solid rgba(255,255,255,0.02);">
                        <svg width="100%" height="100%" viewBox="0 0 600 220" style="background:#060709;">
                            ${defs}
                            <!-- Línea de Resistencia -->
                            <line x1="50" y1="40" x2="550" y2="40" stroke="#ff5252" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.6"/>
                            <!-- Línea de Cuello (Neckline) -->
                            <line x1="50" y1="130" x2="550" y2="130" stroke="#d4af37" stroke-width="2" stroke-dasharray="3 3"/>
                            
                            <!-- Trayectoria M -->
                            <path d="M 80 180 L 180 40 L 280 130 L 380 40 L 460 130 L 520 200" fill="none" stroke="#ff5252" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow-red)"/>
                            
                            <!-- Círculos de los Techos -->
                            <circle cx="180" cy="40" r="6" fill="#ff5252"/>
                            <circle cx="380" cy="40" r="6" fill="#ff5252"/>
                            
                            <text x="180" y="25" fill="#cbd5e1" font-size="10" font-family="monospace" text-anchor="middle">Techo 1</text>
                            <text x="380" y="25" fill="#cbd5e1" font-size="10" font-family="monospace" text-anchor="middle">Techo 2</text>
                            <text x="320" y="145" fill="#d4af37" font-size="10" font-family="monospace">Línea de Cuello (Neckline)</text>
                        </svg>
                    </div>
                </div>

                <div style="background: #161920; border: 1px solid #262a35; border-radius: 12px; padding: 25px; display: flex; flex-direction: column; gap: 20px;">
                    <h3 style="color: #d4af37; margin: 0; font-size: 1.15rem; font-weight: 700;">2. Doble Suelo (En Forma de 'W')</h3>
                    <p style="color: #cbd5e1; margin: 0; font-size: 0.95rem; line-height: 1.6;">
                        <strong>Psicología y Fundamento:</strong> El precio cae a una zona de soporte, rebota temporalmente, vuelve a caer para testear los mínimos anteriores y la demanda absorbe todas las ventas, provocando una violenta subida. Denota acumulación y giro alcista de largo plazo.
                        <br><strong>Plan de Operación:</strong> Entrar en compras inmediatamente tras el quiebre de la línea de cuello horizontal.
                    </p>
                    <div style="background: #060709; height: 240px; border-radius: 8px; display: flex; justify-content: center; align-items: center; border: 1px solid rgba(255,255,255,0.02);">
                        <svg width="100%" height="100%" viewBox="0 0 600 220" style="background:#060709;">
                            ${defs}
                            <!-- Línea de Soporte -->
                            <line x1="50" y1="180" x2="550" y2="180" stroke="#26a69a" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.6"/>
                            <!-- Línea de Cuello -->
                            <line x1="50" y1="90" x2="550" y2="90" stroke="#d4af37" stroke-width="2" stroke-dasharray="3 3"/>
                            
                            <!-- Trayectoria W -->
                            <path d="M 80 40 L 180 180 L 280 90 L 380 180 L 460 90 L 520 20" fill="none" stroke="#26a69a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow-green)"/>
                            
                            <!-- Círculos de los Suelos -->
                            <circle cx="180" cy="180" r="6" fill="#26a69a"/>
                            <circle cx="380" cy="180" r="6" fill="#26a69a"/>
                            
                            <text x="180" y="200" fill="#cbd5e1" font-size="10" font-family="monospace" text-anchor="middle">Suelo 1</text>
                            <text x="380" y="200" fill="#cbd5e1" font-size="10" font-family="monospace" text-anchor="middle">Suelo 2</text>
                            <text x="320" y="80" fill="#d4af37" font-size="10" font-family="monospace">Línea de Cuello (Neckline)</text>
                        </svg>
                    </div>
                </div>

                <div style="background: #161920; border: 1px solid #262a35; border-radius: 12px; padding: 25px; display: flex; flex-direction: column; gap: 20px;">
                    <h3 style="color: #d4af37; margin: 0; font-size: 1.15rem; font-weight: 700;">3. Bandera Alcista (Bullish Flag)</h3>
                    <p style="color: #cbd5e1; margin: 0; font-size: 0.95rem; line-height: 1.6;">
                        <strong>Psicología y Fundamento:</strong> Patrón clásico de continuación de tendencia. Se compone de un mástil vertical (impulso impulsado por volumen comprador masivo) y una pequeña consolidación inclinada hacia abajo (canal de toma de ganancias). El quiebre hacia arriba reanuda el movimiento alcista con fuerza equivalente al tamaño del mástil.
                        <br><strong>Plan de Operación:</strong> Entrar en compras inmediatamente tras la vela que rompa el canal superior de la bandera.
                    </p>
                    <div style="background: #060709; height: 240px; border-radius: 8px; display: flex; justify-content: center; align-items: center; border: 1px solid rgba(255,255,255,0.02);">
                        <svg width="100%" height="100%" viewBox="0 0 600 220" style="background:#060709;">
                            ${defs}
                            <!-- Mástil -->
                            <line x1="120" y1="180" x2="250" y2="60" stroke="#26a69a" stroke-width="4" filter="url(#glow-green)"/>
                            
                            <!-- Canal de la Bandera -->
                            <line x1="230" y1="50" x2="380" y2="100" stroke="#d4af37" stroke-width="2"/>
                            <line x1="250" y1="75" x2="400" y2="125" stroke="#d4af37" stroke-width="2"/>
                            
                            <!-- Trayectoria en el Canal -->
                            <path d="M 250 60 L 290 90 L 320 65 L 360 100 L 390 75" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linejoin="round"/>
                            
                            <!-- Ruptura Alcista -->
                            <path d="M 390 75 L 490 20" fill="none" stroke="#26a69a" stroke-width="3" filter="url(#glow-green)" stroke-dasharray="2 2"/>
                            <circle cx="390" cy="75" r="5" fill="#26a69a"/>
                            
                            <text x="140" y="130" fill="#26a69a" font-size="10" font-family="monospace" transform="rotate(-40 140 130)">Mástil de Impulso</text>
                            <text x="320" y="130" fill="#d4af37" font-size="10" font-family="monospace">Consolidación (Bandera)</text>
                            <text x="440" y="45" fill="#26a69a" font-size="10" font-family="monospace" font-weight="bold">Ruptura (Gatillo)</text>
                        </svg>
                    </div>
                </div>
            `;
        }
    }
};

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    VisionariosKnowledge.init();
});

// Guardar en scope global para index.html
window.VisionariosKnowledge = VisionariosKnowledge;
