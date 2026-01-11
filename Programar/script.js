// Sistema de ofuscación de claves
const _k = {
    d: (s) => atob(s.split('').reverse().join('')).split('').map((c,i) => String.fromCharCode(c.charCodeAt(0) - (i % 5 + 1))).join(''),
    g: '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
        ',
    h: '==QamdXWFlTOspUTrdjT2RFP7UUS2kjNmJDc9JHU3wkbPRVTLl2YzpGa'
};
const GEMINI_API_KEY = _k.d(_k.g);
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

window.GITHUB_TOKEN = _k.d(_k.h);
window.GITHUB_API_URL = 'https://api.github.com';

// Función para detectar tipo de dispositivo del usuario
function detectUserDevice() {
    const ua = navigator.userAgent;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    let deviceType = 'desktop';
    let deviceDetails = '';
    let optimizationAdvice = '';
    
    if (/iPhone|iPad|iPod/i.test(ua)) {
        deviceType = 'mobile';
        deviceDetails = 'dispositivo iOS';
        optimizationAdvice = 'OPTIMIZACIÓN MÓVIL iOS: Usar -webkit-touch-callout, -webkit-user-select, touch-action, scroll-behavior smooth, font iOS optimizado, colores vibrantes, botones grandes táctiles, navegación inferior, scroll horizontal, gestos swipe.';
    } else if (/Android/i.test(ua)) {
        deviceType = 'mobile';
        deviceDetails = 'dispositivo Android';
        optimizationAdvice = 'OPTIMIZACIÓN MÓVIL ANDROID: Material Design principles, ripple effects, floating action buttons, colores Material, navegación con tabs, scroll snap, touch feedback, density-independent pixels.';
    } else if (/Mobi/i.test(ua) || (width <= 768 && hasTouch)) {
        deviceType = 'mobile';
        deviceDetails = 'dispositivo móvil';
        optimizationAdvice = 'OPTIMIZACIÓN MÓVIL GENERAL: Mobile-first design, thumb-friendly navigation, large touch targets (44px min), stack layouts verticalmente, ocultar elementos no esenciales, usar sticky headers, bottom navigation, hamburger menu.';
    } else if (/Tablet|iPad/i.test(ua) || (width > 768 && width <= 1024 && hasTouch)) {
        deviceType = 'tablet';
        deviceDetails = 'tablet';
        optimizationAdvice = 'OPTIMIZACIÓN TABLET: Hybrid desktop/mobile approach, aprovechar pantalla más grande, sidebar navigation, grid layouts, touch gestures, landscape/portrait adaptation, split views.';
    } else if (width > 1024) {
        deviceType = 'desktop';
        deviceDetails = 'computadora de escritorio';
        optimizationAdvice = 'OPTIMIZACIÓN DESKTOP: Hover effects, keyboard navigation, cursor interactions, wide layouts, sidebar navigation, multi-column layouts, parallax effects, video backgrounds, complex animations.';
    }
    
    return {
        type: deviceType,
        details: deviceDetails,
        screenWidth: width,
        screenHeight: height,
        hasTouch: hasTouch,
        optimizationAdvice: optimizationAdvice,
        devicePixelRatio: devicePixelRatio
    };
}

// Función para determinar la estación
function getSeason(month) {
    if (month >= 3 && month <= 5) return 'primavera';
    if (month >= 6 && month <= 8) return 'verano';
    if (month >= 9 && month <= 11) return 'otoño';
    return 'invierno';
}

// Función para obtener información contextual del usuario
function getContextualInfo() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.toLocaleDateString('es-ES', { month: 'long' });
    const currentDay = now.getDate();
    const currentWeekDay = now.toLocaleDateString('es-ES', { weekday: 'long' });
    
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    let detectedTheme = prefersDark ? 'oscuro' : 'claro';
    
    return {
        year: currentYear,
        month: currentMonth,
        day: currentDay,
        weekDay: currentWeekDay,
        theme: detectedTheme,
        season: getSeason(now.getMonth() + 1)
    };
}

// Elements
const elements = {
    chatInput: document.getElementById('chatInput'),
    sendBtn: document.getElementById('sendBtn'),
    htmlEditor: document.getElementById('htmlEditor'),
    jsEditor: document.getElementById('jsEditor'),
    cssEditor: document.getElementById('cssEditor'),
    previewTab: document.getElementById('previewTab'),
    previewContainer: document.getElementById('previewContainer'),
    previewFrame: document.getElementById('previewFrame'),
    refreshPreview: document.getElementById('refreshPreview'),
    chatToggleBtn: document.getElementById('chatToggleBtn'),
    homeBtn: document.getElementById('homeBtn'),
    leftSidebar: document.getElementById('leftSidebar'),
    cursorPosition: document.getElementById('cursorPosition'),
    chatMessages: document.getElementById('chatMessages'),
    toggleLogs: document.getElementById('toggleLogs'),
    consoleLogs: document.getElementById('consoleLogs'),
    consoleContent: document.getElementById('consoleContent'),
    clearLogs: document.getElementById('clearLogs')
};

// Console logs storage
let consoleLogs = [];

// State
let currentTab = 'html';
let isGenerating = false;
let currentZoom = 1;
let currentPreviewSize = 'desktop';

let currentProject = null;

async function loadProject() {
    const projectData = localStorage.getItem('currentProject');
    if (projectData) {
        currentProject = JSON.parse(projectData);
        
        const projectNameEl = document.getElementById('projectName');
        if (projectNameEl) {
            const projectTitle = currentProject.title || 'Proyecto';
            
            projectNameEl.textContent = projectTitle;
            
            document.title = projectTitle;
        }
        
        if (currentProject.code && currentProject.code.html) {
            elements.htmlEditor.value = currentProject.code.html;
            elements.cssEditor.value = currentProject.code.css;
            elements.jsEditor.value = currentProject.code.js;
        }
        
        const hasBackup = await initBackupMode();
        
        if (!hasBackup) {
            await loadProjectFromSupabase();
        }
        
        updateDevCenterXButton();
        updatePublishButtons();
    }
}

// Cargar proyecto desde Supabase
async function loadProjectFromSupabase() {
    try {
        const supabase = initSupabase();
        if (!supabase || !currentProject) return;
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.log('No hay sesión activa en Supabase');
            return;
        }
        
        // Obtener nombre de usuario desde localStorage
        const nombreUsuario = localStorage.getItem('supabase_nombrepersona') || localStorage.getItem('devcenter_user');
        if (!nombreUsuario) {
            console.log('No se encontró el nombre de usuario en localStorage');
            return;
        }
        
        // Buscar el usuario en la tabla personas
        const { data: personaData, error } = await supabase
            .from('personas')
            .select('proyectos')
            .eq('nombrepersona', nombreUsuario)
            .single();
        
        if (error || !personaData) {
            console.log('Usuario no encontrado en Supabase');
            return;
        }
        
        // Buscar el proyecto en el array de proyectos
        const proyectos = personaData.proyectos || [];
        const proyecto = proyectos.find(p => p.numeroProyecto === currentProject.id);
        
        if (proyecto) {
            // Actualizar currentProject con datos de Supabase (NUNCA cargar code de Supabase)
            // El código solo debe cargarse desde localStorage o backup slots
            currentProject.title = proyecto.titulo || currentProject.title;
            currentProject.description = proyecto.descripcion || currentProject.description;
            currentProject.tags = proyecto.tags || currentProject.tags;
            currentProject.status = proyecto.status || currentProject.status;
            currentProject.link = proyecto.link || currentProject.link;
            currentProject.devcenter = proyecto.devcenter || currentProject.devcenter;
            
            // Cargar código desde localStorage si existe
            const projectId = currentProject.id || currentProject.numeroProyecto;
            const codeKey = `dc_project_code_${projectId}`;
            const savedCode = localStorage.getItem(codeKey);
            if (savedCode) {
                try {
                    const codeData = JSON.parse(savedCode);
                    if (codeData.code) {
                        currentProject.code = codeData.code;
                        elements.htmlEditor.value = codeData.code.html || '';
                        elements.cssEditor.value = codeData.code.css || '';
                        elements.jsEditor.value = codeData.code.js || '';
                        console.log(`💾 Código cargado desde localStorage (${codeKey})`);
                    }
                } catch (e) {
                    console.log('Error parseando código de localStorage');
                }
            }
            
            if (!activeBackupSlot) {
                localStorage.setItem('currentProject', JSON.stringify(currentProject));
            }
            
            console.log('✅ Proyecto cargado desde Supabase');
        } else {
            console.log('Proyecto no encontrado en Supabase, usando localStorage');
        }
    } catch (error) {
        console.error('Error al cargar desde Supabase:', error);
    }
}

async function saveProjectCode() {
    if (currentProject) {
        const html = elements.htmlEditor.value;
        const css = elements.cssEditor.value;
        const js = elements.jsEditor.value;
        
        if (html || css || js) {
            currentProject.code = { html, css, js };
        } else {
            delete currentProject.code;
        }
        
        if (activeBackupSlot) {
            await saveToBackupSlot();
            return;
        }
        
        localStorage.setItem('currentProject', JSON.stringify(currentProject));
        
        const projectId = currentProject.id || currentProject.numeroProyecto;
        if (projectId && currentProject.code) {
            const codeKey = `dc_project_code_${projectId}`;
            const codeData = {
                numeroProyecto: projectId,
                titulo: currentProject.title || currentProject.titulo,
                code: currentProject.code,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(codeKey, JSON.stringify(codeData));
            console.log(`💾 Código guardado en localStorage (${codeKey})`);
        }
        
        let userProjects = JSON.parse(localStorage.getItem('userProjects') || '[]');
        const index = userProjects.findIndex(p => p.id === currentProject.id);
        if (index !== -1) {
            userProjects[index] = currentProject;
            localStorage.setItem('userProjects', JSON.stringify(userProjects));
        }
        
        await saveProjectToSupabase();
    }
}

// Guardar proyecto en Supabase
async function saveProjectToSupabase() {
    try {
        const supabase = initSupabase();
        if (!supabase || !currentProject) return;
        
        // Obtener nombre de usuario desde localStorage (no depender de sesión auth)
        const nombreUsuario = localStorage.getItem('supabase_nombrepersona') || localStorage.getItem('devcenter_user');
        if (!nombreUsuario) {
            console.log('No se encontró el nombre de usuario en localStorage');
            return;
        }
        
        console.log('📤 Guardando proyecto en Supabase para usuario:', nombreUsuario);
        
        // Buscar el usuario en la tabla personas
        const { data: personaData, error: fetchError } = await supabase
            .from('personas')
            .select('id, proyectos')
            .eq('nombrepersona', nombreUsuario)
            .single();
        
        if (fetchError || !personaData) {
            console.error('Usuario no encontrado en Supabase:', fetchError);
            return;
        }
        
        // Obtener array de proyectos actual
        let proyectos = personaData.proyectos || [];
        
        // Buscar si el proyecto ya existe
        const projectIndex = proyectos.findIndex(p => p.numeroProyecto === currentProject.id);
        
        if (projectIndex !== -1) {
            // Actualizar proyecto existente - NUNCA guardar código en proyectos JSONB
            const existingProject = proyectos[projectIndex];
            const { code, ...existingSinCode } = existingProject;
            
            const updatedProject = {
                ...existingSinCode,
                titulo: currentProject.title,
                inicialesTitulo: currentProject.initials,
                descripcion: currentProject.description,
                tags: currentProject.tags,
                status: currentProject.status,
                devcenter: currentProject.devcenter || 'private'
            };
            
            console.log(`📦 Código NO se guarda en JSONB - solo en backup slots`);
            
            proyectos[projectIndex] = updatedProject;
        } else {
            // Agregar nuevo proyecto - NUNCA guardar código en proyectos JSONB
            const newProject = {
                numeroProyecto: currentProject.id,
                titulo: currentProject.title,
                inicialesTitulo: currentProject.initials,
                descripcion: currentProject.description,
                tags: currentProject.tags,
                status: currentProject.status,
                fecha: currentProject.createdAt || new Date().toLocaleDateString('es-ES'),
                link: '',
                devcenter: 'private'
            };
            
            proyectos.push(newProject);
        }
        
        // Asegurar que ningún proyecto tenga campo code antes de guardar
        const proyectosParaGuardar = proyectos.map(p => {
            const { code, ...proyectoSinCode } = p;
            return proyectoSinCode;
        });
        
        // Guardar array actualizado en Supabase
        const { error: updateError } = await supabase
            .from('personas')
            .update({ proyectos: proyectosParaGuardar })
            .eq('id', personaData.id);
        
        if (updateError) {
            console.error('Error al guardar en Supabase:', updateError);
        } else {
            console.log('✅ Proyecto guardado en Supabase correctamente');
        }
    } catch (error) {
        console.error('Error al guardar en Supabase:', error);
    }
}

function showProjectInfo() {
    const modal = document.getElementById('projectInfoModal');
    if (!currentProject || !modal) return;
    
    document.getElementById('modalProjectName').textContent = currentProject.title;
    document.getElementById('modalInitials').textContent = currentProject.initials;
    const tagsDisplay = Array.isArray(currentProject.tags) ? currentProject.tags.join(', ') : (currentProject.tags || 'Sin tags');
    document.getElementById('modalTags').textContent = tagsDisplay;
    document.getElementById('modalDescription').textContent = currentProject.description || 'Sin descripción';
    
    const statusBadge = document.getElementById('modalStatus');
    statusBadge.textContent = currentProject.status;
    statusBadge.className = 'status-badge ' + currentProject.status.toLowerCase();
    
    const createdDate = new Date(currentProject.createdAt);
    document.getElementById('modalCreated').textContent = createdDate.toLocaleDateString('es-ES');
    
    modal.style.display = 'block';
}

function closeProjectInfo() {
    const modal = document.getElementById('projectInfoModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Estados disponibles con sus colores (sin OFICIAL)
const availableStatuses = [
    { value: 'Activo', label: 'Activo', color: '#10b981', description: 'Proyecto activo en desarrollo' },
    { value: 'Beta', label: 'Beta', color: '#f59e0b', description: 'Versión beta en pruebas' },
    { value: 'Stable', label: 'Stable', color: '#3b82f6', description: 'Versión estable' },
    { value: 'Experimental', label: 'Experimental', color: '#a78bfa', description: 'Proyecto experimental' },
    { value: 'Community', label: 'Community', color: '#ec4899', description: 'Proyecto comunitario' },
    { value: 'Premium', label: 'Premium', color: '#fbbf24', description: 'Contenido premium' },
    { value: 'Free', label: 'Free', color: '#34d399', description: 'Gratis para todos' },
    { value: 'Demo', label: 'Demo', color: '#60a5fa', description: 'Demostración' },
    { value: 'Archived', label: 'Archived', color: '#6b7280', description: 'Archivado' },
    { value: 'Paused', label: 'Paused', color: '#9ca3af', description: 'En pausa' },
    { value: 'Planning', label: 'Planning', color: '#8b5cf6', description: 'En planificación' },
    { value: 'Completed', label: 'Completed', color: '#059669', description: 'Completado' }
];

// Show edit project modal
function showEditProjectModal() {
    if (!currentProject) return;
    
    // Si no tiene estado, asignar "Activo" por defecto
    if (!currentProject.status) {
        currentProject.status = 'Activo';
    }
    
    const statusOptions = availableStatuses.map(s => 
        `<div class="status-option" data-value="${s.value}" data-color="${s.color}">
            <div class="status-color-dot" style="background: ${s.color};"></div>
            <div class="status-info">
                <div class="status-label">${s.label}</div>
                <div class="status-description">${s.description}</div>
            </div>
        </div>`
    ).join('');
    
    const currentStatus = availableStatuses.find(s => s.value === currentProject.status) || availableStatuses[0];
    
    const modalHTML = `
        <div id="editProjectModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(14, 21, 37, 0.98); backdrop-filter: blur(12px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'IBM Plex Sans', sans-serif; overflow-y: auto;">
            <div style="background: var(--bg-primary); border: 1px solid var(--border); border-radius: 16px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 40px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); margin: 20px 0;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, var(--accent), #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(0, 112, 243, 0.4);">
                        <i class="fas fa-pencil-alt" style="font-size: 36px; color: white;"></i>
                    </div>
                    <h2 style="color: var(--text-primary); font-size: 28px; font-weight: 700; margin-bottom: 12px;">Editar Proyecto</h2>
                    <p style="color: var(--text-secondary); font-size: 15px;">Modifica la información completa de tu proyecto</p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
                    <div>
                        <label style="display: block; color: var(--text-secondary); font-size: 13px; font-weight: 600; margin-bottom: 10px;">
                            <i class="fas fa-signature" style="margin-right: 6px; color: var(--icon-purple);"></i>
                            Iniciales <span style="color: var(--text-tertiary); font-weight: 400;">(máx. 2)</span>
                        </label>
                        <input type="text" id="editProjectInitials" value="${currentProject.initials || ''}" maxlength="2" style="width: 100%; padding: 14px; background: var(--bg-secondary); border: 2px solid var(--border); border-radius: 8px; color: var(--text-primary); font-size: 16px; font-family: 'IBM Plex Sans', sans-serif; transition: all 0.2s; text-transform: uppercase; font-weight: 600;" />
                        <div style="text-align: right; margin-top: 6px;">
                            <span id="initialsCounter" style="font-size: 12px; color: var(--text-tertiary); font-weight: 500;">0/2</span>
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; color: var(--text-secondary); font-size: 13px; font-weight: 600; margin-bottom: 10px;">
                            <i class="fas fa-heading" style="margin-right: 6px; color: var(--icon-blue);"></i>
                            Título <span style="color: var(--text-tertiary); font-weight: 400;">(máx. 15)</span>
                        </label>
                        <input type="text" id="editProjectTitle" value="${currentProject.title || ''}" maxlength="15" style="width: 100%; padding: 14px; background: var(--bg-secondary); border: 2px solid var(--border); border-radius: 8px; color: var(--text-primary); font-size: 16px; font-family: 'IBM Plex Sans', sans-serif; transition: all 0.2s;" />
                        <div style="text-align: right; margin-top: 6px;">
                            <span id="titleCounter" style="font-size: 12px; color: var(--text-tertiary); font-weight: 500;">0/15</span>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <label style="display: block; color: var(--text-secondary); font-size: 13px; font-weight: 600; margin-bottom: 10px;">
                        <i class="fas fa-align-left" style="margin-right: 6px; color: var(--icon-green);"></i>
                        Descripción <span style="color: var(--text-tertiary); font-weight: 400;">(máx. 500)</span>
                    </label>
                    <textarea id="editProjectDescription" maxlength="500" style="width: 100%; padding: 14px; background: var(--bg-secondary); border: 2px solid var(--border); border-radius: 8px; color: var(--text-primary); font-size: 15px; font-family: 'IBM Plex Sans', sans-serif; transition: all 0.2s; resize: vertical; min-height: 120px; line-height: 1.6;">${currentProject.description || ''}</textarea>
                    <div style="text-align: right; margin-top: 6px;">
                        <span id="descriptionCounter" style="font-size: 12px; color: var(--text-tertiary); font-weight: 500;">0/500</span>
                    </div>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <label style="display: block; color: var(--text-secondary); font-size: 13px; font-weight: 600; margin-bottom: 10px;">
                        <i class="fas fa-tags" style="margin-right: 6px; color: var(--icon-yellow);"></i>
                        Tags <span style="color: var(--text-tertiary); font-weight: 400;">(máx. 150)</span>
                    </label>
                    <input type="text" id="editProjectTags" value="${Array.isArray(currentProject.tags) ? currentProject.tags.join(', ') : (currentProject.tags || '')}" maxlength="150" placeholder="ej: web, design, portfolio" style="width: 100%; padding: 14px; background: var(--bg-secondary); border: 2px solid var(--border); border-radius: 8px; color: var(--text-primary); font-size: 15px; font-family: 'IBM Plex Sans', sans-serif; transition: all 0.2s;" />
                    <div style="text-align: right; margin-top: 6px;">
                        <span id="tagsCounter" style="font-size: 12px; color: var(--text-tertiary); font-weight: 500;">0/150</span>
                    </div>
                </div>
                
                <div style="margin-bottom: 32px;">
                    <label style="display: block; color: var(--text-secondary); font-size: 13px; font-weight: 600; margin-bottom: 10px;">
                        <i class="fas fa-flag" style="margin-right: 6px; color: var(--icon-orange);"></i>
                        Estado del Proyecto
                    </label>
                    <div style="position: relative;">
                        <div id="statusSelector" style="width: 100%; padding: 14px; background: var(--bg-secondary); border: 2px solid var(--border); border-radius: 8px; color: var(--text-primary); font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div class="status-color-dot" style="width: 12px; height: 12px; border-radius: 50%; background: ${currentStatus.color};"></div>
                                <span id="selectedStatusText">${currentStatus.label}</span>
                            </div>
                            <i class="fas fa-chevron-down" style="color: var(--text-secondary); font-size: 12px;"></i>
                        </div>
                        <input type="text" id="statusSearch" placeholder="Buscar estado..." style="width: 100%; padding: 14px; background: var(--bg-secondary); border: 2px solid var(--border); border-radius: 8px; color: var(--text-primary); font-size: 15px; margin-top: 8px; display: none;" />
                        <div id="statusDropdown" style="display: none; position: absolute; top: 100%; left: 0; right: 0; margin-top: 8px; background: var(--bg-primary); border: 2px solid var(--border); border-radius: 8px; max-height: 400px; overflow-y: auto; z-index: 1000; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);">
                            ${statusOptions}
                        </div>
                    </div>
                    <input type="hidden" id="editProjectStatus" value="${currentProject.status || 'Activo'}" />
                </div>
                
                <div style="display: flex; gap: 16px; padding-top: 24px; border-top: 1px solid var(--border);">
                    <button onclick="closeEditProjectModal()" style="flex: 1; padding: 16px; background: var(--bg-secondary); color: var(--text-primary); border: 2px solid var(--border); border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s; font-family: 'IBM Plex Sans', sans-serif;">
                        <i class="fas fa-times" style="margin-right: 8px;"></i>
                        Cancelar
                    </button>
                    <button onclick="saveProjectDetails()" style="flex: 2; padding: 16px; background: linear-gradient(135deg, var(--accent), #0761d1); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s; font-family: 'IBM Plex Sans', sans-serif; box-shadow: 0 4px 12px rgba(0, 112, 243, 0.3);">
                        <i class="fas fa-save" style="margin-right: 8px;"></i>
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
        <style>
        #editProjectModal input:focus,
        #editProjectModal textarea:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 4px rgba(0, 112, 243, 0.15);
        }
        #editProjectModal button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }
        #editProjectModal button:active {
            transform: translateY(0);
        }
        .status-option {
            padding: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.2s;
            border-bottom: 1px solid var(--border);
        }
        .status-option:last-child {
            border-bottom: none;
        }
        .status-option:hover {
            background: var(--bg-secondary);
        }
        .status-color-dot {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        .status-info {
            flex: 1;
        }
        .status-label {
            color: var(--text-primary);
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 2px;
        }
        .status-description {
            color: var(--text-tertiary);
            font-size: 12px;
        }
        #statusSelector:hover {
            border-color: var(--accent);
        }
        #statusDropdown::-webkit-scrollbar {
            width: 8px;
        }
        #statusDropdown::-webkit-scrollbar-track {
            background: var(--bg-secondary);
            border-radius: 4px;
        }
        #statusDropdown::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 4px;
        }
        #statusDropdown::-webkit-scrollbar-thumb:hover {
            background: var(--text-tertiary);
        }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup character counters and status selector
    setTimeout(() => {
        setupCharacterCounters();
        setupStatusSelector();
        const titleInput = document.getElementById('editProjectTitle');
        if (titleInput) {
            titleInput.focus();
            titleInput.select();
        }
    }, 100);
}

// Setup status selector with search
function setupStatusSelector() {
    const selector = document.getElementById('statusSelector');
    const dropdown = document.getElementById('statusDropdown');
    const searchInput = document.getElementById('statusSearch');
    const statusInput = document.getElementById('editProjectStatus');
    const selectedText = document.getElementById('selectedStatusText');
    
    if (!selector || !dropdown || !searchInput || !statusInput) return;
    
    let isOpen = false;
    
    // Toggle dropdown
    selector.addEventListener('click', () => {
        isOpen = !isOpen;
        if (isOpen) {
            dropdown.style.display = 'block';
            searchInput.style.display = 'block';
            searchInput.focus();
            filterStatuses('');
        } else {
            dropdown.style.display = 'none';
            searchInput.style.display = 'none';
            searchInput.value = '';
        }
    });
    
    // Search functionality
    searchInput.addEventListener('input', (e) => {
        filterStatuses(e.target.value);
    });
    
    searchInput.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Filter statuses based on search
    function filterStatuses(query) {
        const options = dropdown.querySelectorAll('.status-option');
        const lowerQuery = query.toLowerCase();
        
        options.forEach(option => {
            const label = option.querySelector('.status-label').textContent.toLowerCase();
            const description = option.querySelector('.status-description').textContent.toLowerCase();
            
            if (label.includes(lowerQuery) || description.includes(lowerQuery)) {
                option.style.display = 'flex';
            } else {
                option.style.display = 'none';
            }
        });
    }
    
    // Select status
    dropdown.addEventListener('click', (e) => {
        const option = e.target.closest('.status-option');
        if (option) {
            const value = option.dataset.value;
            const color = option.dataset.color;
            const label = option.querySelector('.status-label').textContent;
            
            statusInput.value = value;
            selectedText.textContent = label;
            selector.querySelector('.status-color-dot').style.background = color;
            
            dropdown.style.display = 'none';
            searchInput.style.display = 'none';
            searchInput.value = '';
            isOpen = false;
        }
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!selector.contains(e.target) && !dropdown.contains(e.target) && !searchInput.contains(e.target)) {
            dropdown.style.display = 'none';
            searchInput.style.display = 'none';
            searchInput.value = '';
            isOpen = false;
        }
    });
}

// Setup character counters for inputs
function setupCharacterCounters() {
    const fields = [
        { id: 'editProjectInitials', counterId: 'initialsCounter', max: 2 },
        { id: 'editProjectTitle', counterId: 'titleCounter', max: 15 },
        { id: 'editProjectDescription', counterId: 'descriptionCounter', max: 500 },
        { id: 'editProjectTags', counterId: 'tagsCounter', max: 150 }
    ];
    
    fields.forEach(field => {
        const input = document.getElementById(field.id);
        const counter = document.getElementById(field.counterId);
        
        if (input && counter) {
            const updateCounter = () => {
                const length = input.value.length;
                counter.textContent = `${length}/${field.max}`;
                
                if (length >= field.max) {
                    counter.style.color = 'var(--icon-red)';
                } else if (length >= field.max * 0.9) {
                    counter.style.color = 'var(--warning-yellow)';
                } else {
                    counter.style.color = 'var(--text-tertiary)';
                }
            };
            
            updateCounter();
            input.addEventListener('input', updateCounter);
        }
    });
}

// Close edit project modal
window.closeEditProjectModal = function() {
    const modal = document.getElementById('editProjectModal');
    if (modal) {
        modal.remove();
    }
};

// Initialize Supabase client
let supabaseClient = null;

function initSupabase() {
    if (!supabaseClient && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
        const { createClient } = window.supabase;
        supabaseClient = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    }
    return supabaseClient;
}

// Save project details
window.saveProjectDetails = async function() {
    if (!currentProject) return;
    
    const initialsInput = document.getElementById('editProjectInitials');
    const titleInput = document.getElementById('editProjectTitle');
    const descriptionInput = document.getElementById('editProjectDescription');
    const tagsInput = document.getElementById('editProjectTags');
    const statusSelect = document.getElementById('editProjectStatus');
    
    if (!titleInput || !initialsInput || !descriptionInput || !tagsInput || !statusSelect) return;
    
    const newInitials = initialsInput.value.trim().toUpperCase();
    const newTitle = titleInput.value.trim();
    const newDescription = descriptionInput.value.trim();
    const newTags = tagsInput.value.trim();
    const newStatus = statusSelect.value;
    
    // Validations
    if (!newInitials || newInitials.length > 2) {
        alert('Las iniciales deben tener máximo 2 caracteres');
        return;
    }
    
    if (!newTitle) {
        alert('El título no puede estar vacío');
        return;
    }
    
    if (newTitle.length > 15) {
        alert('El título no puede tener más de 15 caracteres');
        return;
    }
    
    if (newDescription.length > 500) {
        alert('La descripción no puede tener más de 500 caracteres');
        return;
    }
    
    if (newTags.length > 150) {
        alert('Los tags no pueden tener más de 150 caracteres');
        return;
    }
    
    // Update current project
    currentProject.initials = newInitials;
    currentProject.title = newTitle;
    currentProject.description = newDescription;
    currentProject.tags = newTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    currentProject.status = newStatus;
    
    // Update localStorage
    localStorage.setItem('currentProject', JSON.stringify(currentProject));
    
    // Update in userProjects list
    let userProjects = JSON.parse(localStorage.getItem('userProjects') || '[]');
    const index = userProjects.findIndex(p => p.id === currentProject.id);
    if (index !== -1) {
        userProjects[index] = currentProject;
        localStorage.setItem('userProjects', JSON.stringify(userProjects));
    }
    
    // Update UI
    const projectNameEl = document.getElementById('projectName');
    if (projectNameEl) {
        projectNameEl.textContent = newTitle;
    }
    
    // Update document title
    document.title = newTitle;
    
    // Show loading indicator
    const saveButton = document.querySelector('#editProjectModal button[onclick="saveProjectDetails()"]');
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 6px;"></i>Guardando...';
    }
    
    // Save to Supabase usando la tabla projects
    await saveProjectToSupabase();
    
    // Close modal
    closeEditProjectModal();
};

// Initialize
function init() {
    loadDefaultCode(); // Primero inicializa vacío
    loadProject(); // Luego carga proyecto si existe
    setupEventListeners();
    updatePreview();
    initSupabase();
}

// Chat state
let chatStarted = false;

// Start chat - hide initial header and show chat view
function startChat() {
    const sidebarHeader = document.getElementById('sidebarHeader');
    const sidebarActions = document.getElementById('sidebarActions');
    const chatHeaderBar = document.getElementById('chatHeaderBar');
    
    if (!chatStarted) {
        chatStarted = true;
        if (sidebarHeader) sidebarHeader.style.display = 'none';
        if (sidebarActions) sidebarActions.classList.add('hidden');
        if (chatHeaderBar) chatHeaderBar.style.display = 'flex';
    }
}

// Reset to new chat
function resetToNewChat() {
    const sidebarHeader = document.getElementById('sidebarHeader');
    const sidebarActions = document.getElementById('sidebarActions');
    const chatHeaderBar = document.getElementById('chatHeaderBar');
    const chatMessages = document.getElementById('chatMessages');
    
    chatStarted = false;
    if (sidebarHeader) sidebarHeader.style.display = 'block';
    if (sidebarActions) sidebarActions.classList.remove('hidden');
    if (chatHeaderBar) chatHeaderBar.style.display = 'none';
    if (chatMessages) chatMessages.innerHTML = '';
    if (elements.chatInput) elements.chatInput.value = '';
}

// Send message function
function sendMessage() {
    const message = elements.chatInput.value.trim();
    if (!message || isGenerating) return;
    
    startChat();
    handleBuild();
}

// Event Listeners
function setupEventListeners() {
    // Send button
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    // Chat input - Enter to send
    elements.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // New chat button
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', resetToNewChat);
    }
    
    // Quick action buttons - send predefined messages
    const checkBugsBtn = document.getElementById('checkBugsBtn');
    const addPaymentBtn = document.getElementById('addPaymentBtn');
    const addDatabaseBtn = document.getElementById('addDatabaseBtn');
    const addAuthBtn = document.getElementById('addAuthBtn');
    
    if (checkBugsBtn) {
        checkBugsBtn.addEventListener('click', () => {
            elements.chatInput.value = 'Check my app for bugs and fix any issues';
            sendMessage();
        });
    }
    
    if (addPaymentBtn) {
        addPaymentBtn.addEventListener('click', () => {
            elements.chatInput.value = 'Add payment processing to my app';
            sendMessage();
        });
    }
    
    if (addDatabaseBtn) {
        addDatabaseBtn.addEventListener('click', () => {
            elements.chatInput.value = 'Add a database to store data';
            sendMessage();
        });
    }
    
    if (addAuthBtn) {
        addAuthBtn.addEventListener('click', () => {
            elements.chatInput.value = 'Add authenticated user login';
            sendMessage();
        });
    }
    
    // Build button (AI generation) - legacy support
    if (elements.buildBtn) {
        elements.buildBtn.addEventListener('click', handleBuild);
    }

    // Control buttons
    document.querySelectorAll('.control-icon-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (btn.title === 'Send') {
                sendMessage();
            }
        });
    });


    // Tabs
    document.querySelectorAll('.file-tab[data-file]').forEach(tab => {
        tab.addEventListener('click', () => {
            const fileType = tab.dataset.file;
            switchTab(fileType);
        });
    });

    // Close tabs
    document.querySelectorAll('.close-tab').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    // Editors with syntax highlighting
    elements.htmlEditor.addEventListener('input', () => {
        updatePreview();
        updateCursorPosition(elements.htmlEditor);
        saveProjectCode();
        highlightCode('html');
    });
    elements.htmlEditor.addEventListener('scroll', () => {
        syncScroll(elements.htmlEditor, document.getElementById('htmlHighlight'));
    });
    
    elements.jsEditor.addEventListener('input', () => {
        updatePreview();
        updateCursorPosition(elements.jsEditor);
        saveProjectCode();
        highlightCode('js');
    });
    elements.jsEditor.addEventListener('scroll', () => {
        syncScroll(elements.jsEditor, document.getElementById('jsHighlight'));
    });
    
    elements.cssEditor.addEventListener('input', () => {
        updatePreview();
        updateCursorPosition(elements.cssEditor);
        saveProjectCode();
        highlightCode('css');
    });
    elements.cssEditor.addEventListener('scroll', () => {
        syncScroll(elements.cssEditor, document.getElementById('cssHighlight'));
    });
    
    // Apply initial syntax highlighting for all editors
    setTimeout(() => {
        highlightCode('html');
        highlightCode('js');
        highlightCode('css');
    }, 100);
    
    const projectDropdown = document.getElementById('projectDropdown');
    if (projectDropdown) {
        projectDropdown.addEventListener('click', showProjectInfo);
    }
    
    const editProjectBtn = document.getElementById('editProjectBtn');
    if (editProjectBtn) {
        editProjectBtn.addEventListener('click', showEditProjectModal);
    }
    
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('projectInfoModal');
        const dropdown = document.getElementById('projectDropdown');
        if (modal && modal.style.display === 'block' && 
            !modal.contains(e.target) && !dropdown.contains(e.target)) {
            closeProjectInfo();
        }
    });

    // Cursor position tracking
    [elements.htmlEditor, elements.jsEditor, elements.cssEditor].forEach(editor => {
        editor.addEventListener('click', () => updateCursorPosition(editor));
        editor.addEventListener('keyup', () => updateCursorPosition(editor));
    });

    // Preview controls
    elements.refreshPreview.addEventListener('click', updatePreview);
    
    // Size controls (desktop, tablet, mobile)
    document.querySelectorAll('.preview-control-btn[data-size]').forEach(btn => {
        btn.addEventListener('click', () => {
            const size = btn.dataset.size;
            currentPreviewSize = size;
            
            document.querySelectorAll('.preview-control-btn[data-size]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const frame = elements.previewFrame;
            frame.classList.remove('size-desktop', 'size-tablet', 'size-mobile');
            frame.classList.add(`size-${size}`);
        });
    });
    
    // Zoom controls
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const zoomResetBtn = document.getElementById('zoomReset');
    const zoomLevel = document.getElementById('zoomLevel');
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            currentZoom = Math.min(currentZoom + 0.1, 2);
            updateZoom();
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            currentZoom = Math.max(currentZoom - 0.1, 0.5);
            updateZoom();
        });
    }
    
    if (zoomResetBtn) {
        zoomResetBtn.addEventListener('click', () => {
            currentZoom = 1;
            updateZoom();
        });
    }
    
    function updateZoom() {
        elements.previewFrame.style.transform = `scale(${currentZoom})`;
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
        }
    }

    // Chat toggle con botón morado
    if (elements.chatToggleBtn && elements.leftSidebar) {
        elements.chatToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            elements.leftSidebar.classList.toggle('hidden');
        });
    }

    // Home button
    if (elements.homeBtn) {
        elements.homeBtn.addEventListener('click', () => {
            saveProjectCode();
            window.location.href = '/';
        });
    }

    // Toggle logs button
    if (elements.toggleLogs) {
        elements.toggleLogs.addEventListener('click', () => {
            const isVisible = elements.consoleLogs.style.display !== 'none';
            elements.consoleLogs.style.display = isVisible ? 'none' : 'flex';
        });
        
        // Fullscreen functionality
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                const previewContainer = elements.previewContainer;
                const icon = fullscreenBtn.querySelector('i');
                
                if (!document.fullscreenElement) {
                    previewContainer.requestFullscreen().then(() => {
                        icon.classList.remove('fa-expand');
                        icon.classList.add('fa-compress');
                    }).catch(err => {
                        console.error('Error entering fullscreen:', err);
                    });
                } else {
                    document.exitFullscreen().then(() => {
                        icon.classList.remove('fa-compress');
                        icon.classList.add('fa-expand');
                    });
                }
            });
            
            // Update icon when exiting fullscreen with ESC key
            document.addEventListener('fullscreenchange', () => {
                const icon = fullscreenBtn.querySelector('i');
                if (!document.fullscreenElement) {
                    icon.classList.remove('fa-compress');
                    icon.classList.add('fa-expand');
                }
            });
        }
    }

    // Clear logs button
    if (elements.clearLogs) {
        elements.clearLogs.addEventListener('click', () => {
            consoleLogs = [];
            elements.consoleContent.innerHTML = '';
        });
    }

    // Format button (republicar)
    const formatBtn = document.getElementById('formatBtn');
    if (formatBtn) {
        formatBtn.addEventListener('click', handleFormatRepublish);
    }

    // Publish button
    const publishBtn = document.getElementById('publishBtn');
    if (publishBtn) {
        publishBtn.addEventListener('click', handlePublishClick);
    }
    
    // DevCenterX button
    const devCenterBtn = document.getElementById('devCenterBtn');
    if (devCenterBtn) {
        devCenterBtn.addEventListener('click', toggleDevCenterX);
    }
    
    // Initialize publish buttons state
    updatePublishButtons();
    updateDevCenterXButton();
}

// Show new indicator on tab
function showNewIndicator(fileType) {
    const tab = document.querySelector(`.file-tab[data-file="${fileType}"]`);
    if (tab) {
        const indicator = tab.querySelector('.new-indicator');
        if (indicator) {
            indicator.style.display = 'inline-block';
        }
    }
}

// Hide new indicator on tab
function hideNewIndicator(fileType) {
    const tab = document.querySelector(`.file-tab[data-file="${fileType}"]`);
    if (tab) {
        const indicator = tab.querySelector('.new-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
}

// Switch Tab
function switchTab(fileType) {
    currentTab = fileType;

    // Update tab active state
    document.querySelectorAll('.file-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.file-tab[data-file="${fileType}"]`).classList.add('active');
    
    // Hide indicator when switching to this tab
    hideNewIndicator(fileType);

    // Get editor wrappers
    const htmlWrapper = document.getElementById('htmlEditorWrapper');
    const jsWrapper = document.getElementById('jsEditorWrapper');
    const cssWrapper = document.getElementById('cssEditorWrapper');

    // Show/hide editors and preview
    if (fileType === 'preview') {
        if (htmlWrapper) htmlWrapper.classList.remove('active');
        if (jsWrapper) jsWrapper.classList.remove('active');
        if (cssWrapper) cssWrapper.classList.remove('active');
        elements.previewContainer.style.display = 'flex';
        updatePreview();
    } else {
        elements.previewContainer.style.display = 'none';
        if (htmlWrapper) htmlWrapper.classList.remove('active');
        if (jsWrapper) jsWrapper.classList.remove('active');
        if (cssWrapper) cssWrapper.classList.remove('active');
        
        const activeWrapper = document.getElementById(`${fileType}EditorWrapper`);
        const activeEditor = document.getElementById(`${fileType}Editor`);
        if (activeWrapper) {
            activeWrapper.classList.add('active');
        }
        if (activeEditor) {
            updateCursorPosition(activeEditor);
            // Trigger highlighting for current content
            highlightCode(fileType);
        }
    }
}

// Update cursor position
function updateCursorPosition(editor) {
    const text = editor.value.substring(0, editor.selectionStart);
    const lines = text.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    elements.cursorPosition.textContent = `Ln ${line}, Col ${col}`;
}

// Handle Build (AI Generation)
async function handleBuild() {
    const message = elements.chatInput.value.trim();
    if (!message || isGenerating) return;

    await generateCodeWithAI(message);
}

// Add message to chat
function addChatMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    messageDiv.textContent = message;
    elements.chatMessages.appendChild(messageDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    return messageDiv;
}

// Update progress item
function updateProgress(itemId, status, time = null, isActive = false, isCompleted = false) {
    const item = document.getElementById(itemId);
    if (!item) return;

    const icon = item.querySelector('.progress-icon i');
    const statusText = item.querySelector('.progress-status');
    const timeText = item.querySelector('.progress-time');

    item.classList.remove('active', 'completed');
    if (isActive) item.classList.add('active');
    if (isCompleted) item.classList.add('completed');

    if (isCompleted) {
        icon.className = 'fas fa-check-circle';
    } else if (isActive) {
        icon.className = 'fas fa-circle-notch fa-spin';
    } else {
        icon.className = 'fas fa-circle';
    }

    statusText.textContent = status;
    if (time !== null) {
        timeText.textContent = time;
    }
}

// Format time in seconds
function formatTime(ms) {
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
}

// Generate code with AI
async function generateCodeWithAI(prompt) {
    isGenerating = true;
    if (elements.sendBtn) elements.sendBtn.disabled = true;

    // Hide sidebar header and show progress list
    const sidebarHeader = document.getElementById('sidebarHeader');
    const progressList = document.getElementById('progressList');
    if (sidebarHeader) sidebarHeader.classList.add('hidden');
    if (progressList) progressList.style.display = 'block';

    // Add user message
    addChatMessage(prompt, 'user');

    try {
        // Obtener información contextual y del dispositivo
        const context = getContextualInfo();
        const device = detectUserDevice();
        
        let htmlInstructions = '';
        let cssInstructions = '';
        let generatedHtml = '';
        let generatedCss = '';
        let generatedJs = '';
        
        // PASO 1: Generar HTML con instrucciones para CSS y JS
        updateProgress('progressHtml', 'Generando...', null, true, false);
        const startHtml = Date.now();
        
        const htmlPrompt = `🚀 ERES UN EXPERTO EN HTML5 Y DISEÑO WEB

SOLICITUD DEL USUARIO: "${prompt}"

INFORMACIÓN DEL DISPOSITIVO:
- Dispositivo: ${device.details} (${device.type})
- Pantalla: ${device.screenWidth}x${device.screenHeight}px
- ${device.optimizationAdvice}

TU TAREA:
1. Genera el código HTML completo y semántico
2. Deja instrucciones detalladas en comentarios para el CSS sobre qué estilos necesita cada sección
3. Deja instrucciones detalladas en comentarios para el JavaScript sobre qué funcionalidades interactivas necesita

Responde SOLO con JSON:
{
  "html": "código HTML completo con comentarios de instrucciones",
  "cssInstructions": "instrucciones detalladas para el CSS",
  "jsInstructions": "instrucciones detalladas para el JavaScript"
}`;

        const htmlResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: htmlPrompt }] }],
                generationConfig: {
                    temperature: 1,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "object",
                        properties: {
                            html: { type: "string" },
                            cssInstructions: { type: "string" },
                            jsInstructions: { type: "string" }
                        },
                        required: ["html", "cssInstructions", "jsInstructions"]
                    }
                }
            })
        });

        if (!htmlResponse.ok) throw new Error('Error al generar HTML');
        const htmlData = await htmlResponse.json();
        const htmlResult = JSON.parse(htmlData.candidates[0].content.parts[0].text);
        
        generatedHtml = htmlResult.html;
        cssInstructions = htmlResult.cssInstructions;
        htmlInstructions = htmlResult.jsInstructions;
        
        const htmlTime = Date.now() - startHtml;
        updateProgress('progressHtml', 'Completado', formatTime(htmlTime), false, true);
        
        // Actualizar editor HTML inmediatamente
        elements.htmlEditor.value = generatedHtml;
        showNewIndicator('html');
        updatePreview();
        
        // PASO 2: Generar CSS basándose en las instrucciones del HTML
        updateProgress('progressCss', 'Generando...', null, true, false);
        const startCss = Date.now();
        
        const cssPrompt = `🚀 ERES UN EXPERTO EN CSS Y DISEÑO VISUAL

SOLICITUD DEL USUARIO: "${prompt}"

INSTRUCCIONES DEL HTML:
${cssInstructions}

HTML GENERADO (para referencia):
${generatedHtml.substring(0, 500)}...

TU TAREA:
1. Genera el código CSS completo siguiendo las instrucciones del HTML
2. Incluye reglas anti-overflow: * { box-sizing: border-box; }, overflow-x: hidden
3. Diseño responsive y moderno
4. Deja instrucciones adicionales para el JavaScript sobre animaciones y efectos visuales

Responde SOLO con JSON:
{
  "css": "código CSS completo",
  "jsInstructions": "instrucciones adicionales para el JavaScript sobre animaciones"
}`;

        const cssResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: cssPrompt }] }],
                generationConfig: {
                    temperature: 1,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "object",
                        properties: {
                            css: { type: "string" },
                            jsInstructions: { type: "string" }
                        },
                        required: ["css", "jsInstructions"]
                    }
                }
            })
        });

        if (!cssResponse.ok) throw new Error('Error al generar CSS');
        const cssData = await cssResponse.json();
        const cssResult = JSON.parse(cssData.candidates[0].content.parts[0].text);
        
        generatedCss = cssResult.css;
        cssInstructions = cssResult.jsInstructions;
        
        const cssTime = Date.now() - startCss;
        updateProgress('progressCss', 'Completado', formatTime(cssTime), false, true);
        
        // Actualizar editor CSS inmediatamente
        elements.cssEditor.value = generatedCss;
        showNewIndicator('css');
        updatePreview();
        
        // PASO 3: Generar JavaScript basándose en todas las instrucciones
        updateProgress('progressJs', 'Generando...', null, true, false);
        const startJs = Date.now();
        
        const jsPrompt = `🚀 ERES UN EXPERTO EN JAVASCRIPT Y DESARROLLO WEB

SOLICITUD DEL USUARIO: "${prompt}"

INSTRUCCIONES DEL HTML:
${htmlInstructions}

INSTRUCCIONES DEL CSS:
${cssInstructions}

HTML GENERADO:
${generatedHtml.substring(0, 500)}...

TU TAREA:
1. Genera el código JavaScript completo siguiendo todas las instrucciones
2. Implementa toda la interactividad necesaria
3. Código limpio y funcional

Responde SOLO con JSON:
{
  "js": "código JavaScript completo"
}`;

        const jsResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: jsPrompt }] }],
                generationConfig: {
                    temperature: 1,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "object",
                        properties: {
                            js: { type: "string" }
                        },
                        required: ["js"]
                    }
                }
            })
        });

        if (!jsResponse.ok) throw new Error('Error al generar JavaScript');
        const jsData = await jsResponse.json();
        const jsResult = JSON.parse(jsData.candidates[0].content.parts[0].text);
        
        generatedJs = jsResult.js;
        
        const jsTime = Date.now() - startJs;
        updateProgress('progressJs', 'Completado', formatTime(jsTime), false, true);
        
        // Actualizar editor JavaScript inmediatamente
        elements.jsEditor.value = generatedJs;
        showNewIndicator('js');
        updatePreview();

        // Switch to preview to see the final result
        switchTab('preview');

        // Clear input
        elements.chatInput.value = '';

        // Add success message
        addChatMessage('Proyecto generado exitosamente! Puedes seguir pidiéndome cambios o iniciar un nuevo chat.', 'assistant');
        
        // Reset progress list but keep chat visible
        if (progressList) progressList.style.display = 'none';

    } catch (error) {
        console.error('Error generando código:', error);
        
        // Add error message
        addChatMessage(`❌ Error: ${error.message}. Por favor intenta de nuevo.`, 'assistant');
        
        // Reset UI on error
        const sidebarHeader = document.getElementById('sidebarHeader');
        const progressList = document.getElementById('progressList');
        if (sidebarHeader) sidebarHeader.classList.remove('hidden');
        if (progressList) progressList.style.display = 'none';
        updateProgress('progressHtml', 'Esperando...', '-', false, false);
        updateProgress('progressCss', 'Esperando...', '-', false, false);
        updateProgress('progressJs', 'Esperando...', '-', false, false);
    } finally {
        isGenerating = false;
        if (elements.sendBtn) elements.sendBtn.disabled = false;
    }
}

// Add console log to display
function addConsoleLog(type, ...args) {
    const logDiv = document.createElement('div');
    logDiv.className = `console-${type}`;
    logDiv.textContent = args.map(arg => {
        if (typeof arg === 'object') {
            try {
                return JSON.stringify(arg, null, 2);
            } catch (e) {
                return String(arg);
            }
        }
        return String(arg);
    }).join(' ');
    
    elements.consoleContent.appendChild(logDiv);
    elements.consoleContent.scrollTop = elements.consoleContent.scrollHeight;
    
    consoleLogs.push({ type, args, timestamp: Date.now() });
}

// Update preview
function updatePreview() {
    const html = elements.htmlEditor.value;
    const css = elements.cssEditor.value;
    const js = elements.jsEditor.value;

    if (!html && !css && !js) {
        elements.previewFrame.srcdoc = '';
        return;
    }

    const isFullHTML = html.trim().toLowerCase().startsWith('<!doctype');

    // Inject console interceptor
    const consoleInterceptor = `
        <script>
            (function() {
                const originalLog = console.log;
                const originalError = console.error;
                const originalWarn = console.warn;
                
                console.log = function(...args) {
                    originalLog.apply(console, args);
                    window.parent.postMessage({ type: 'console-log', level: 'log', args: args.map(a => String(a)) }, '*');
                };
                
                console.error = function(...args) {
                    originalError.apply(console, args);
                    window.parent.postMessage({ type: 'console-log', level: 'error', args: args.map(a => String(a)) }, '*');
                };
                
                console.warn = function(...args) {
                    originalWarn.apply(console, args);
                    window.parent.postMessage({ type: 'console-log', level: 'warn', args: args.map(a => String(a)) }, '*');
                };
            })();
        <\/script>
    `;

    let content;
    if (isFullHTML) {
        content = html
            .replace(/<\/head>/i, `${consoleInterceptor}<style>${css}</style></head>`)
            .replace(/<\/body>/i, `<script>${js}<\/script></body>`);
    } else {
        content = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${consoleInterceptor}
    <style>${css}</style>
</head>
<body>
    ${html}
    <script>${js}<\/script>
</body>
</html>
        `;
    }

    elements.previewFrame.srcdoc = content;
}

// Listen for console messages from iframe
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'console-log') {
        addConsoleLog(event.data.level, ...event.data.args);
    }
});

// Syntax highlighting with Prism.js
function highlightCode(fileType) {
    let editor, highlightElement, language;
    
    if (fileType === 'html') {
        editor = elements.htmlEditor;
        highlightElement = document.querySelector('#htmlHighlight code');
        language = 'markup';
    } else if (fileType === 'js') {
        editor = elements.jsEditor;
        highlightElement = document.querySelector('#jsHighlight code');
        language = 'javascript';
    } else if (fileType === 'css') {
        editor = elements.cssEditor;
        highlightElement = document.querySelector('#cssHighlight code');
        language = 'css';
    }
    
    if (editor && highlightElement) {
        const code = editor.value;
        highlightElement.textContent = code;
        if (window.Prism) {
            Prism.highlightElement(highlightElement);
        }
    }
}

// Sync scroll between editor and highlight layer
function syncScroll(editor, highlightLayer) {
    if (editor && highlightLayer) {
        highlightLayer.scrollTop = editor.scrollTop;
        highlightLayer.scrollLeft = editor.scrollLeft;
    }
}

// Apply syntax highlighting to editors (called on input)
function applySyntaxHighlighting() {
    highlightCode(currentTab);
}

// Load default code - Editores empiezan vacíos para una experiencia limpia
function loadDefaultCode() {
    // Los editores empiezan vacíos - el placeholder del HTML muestra ejemplos
    // Solo carga código si el proyecto ya tiene código guardado
    if (!elements.htmlEditor.value && !elements.cssEditor.value && !elements.jsEditor.value) {
        elements.htmlEditor.value = '';
        elements.cssEditor.value = '';
        elements.jsEditor.value = '';
    }
}

// Generate or get persistent session ID
function getSessionId() {
    let sessionId = localStorage.getItem('current_session_id');
    if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem('current_session_id', sessionId);
    }
    return sessionId;
}

// Generate session ID (lowercase letters and numbers)
function generateSessionId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 12; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// Save publish info to localStorage and Supabase
async function savePublishInfo(username, repoName, pagesUrl) {
    if (!currentProject) return;
    
    const publishInfo = {
        username: username,
        repoName: repoName,
        pagesUrl: pagesUrl,
        publishedAt: new Date().toISOString()
    };
    
    localStorage.setItem(`publish_info_${currentProject.id}`, JSON.stringify(publishInfo));
    
    currentProject.link = pagesUrl;
    currentProject.url = pagesUrl;
    
    localStorage.setItem('currentProject', JSON.stringify(currentProject));
    
    let userProjects = JSON.parse(localStorage.getItem('userProjects') || '[]');
    const index = userProjects.findIndex(p => p.id === currentProject.id);
    if (index !== -1) {
        userProjects[index].link = pagesUrl;
        userProjects[index].url = pagesUrl;
        localStorage.setItem('userProjects', JSON.stringify(userProjects));
    }
    
    try {
        await updatePublishLinkInSupabase(pagesUrl);
        await insertIntoProyectosPublicos(currentProject.title || 'Mi Proyecto');
    } catch (error) {
        console.error('Error al actualizar link en Supabase:', error);
    }
    
    updatePublishButtons();
}

async function insertIntoProyectosPublicos(nombreProyecto) {
    try {
        const supabase = initSupabase();
        if (!supabase) return;
        
        const { data: existing, error: selectError } = await supabase
            .from('proyectos_publicos')
            .select('*')
            .eq('nombre_proyecto', nombreProyecto)
            .maybeSingle();
        
        if (selectError && selectError.code !== 'PGRST116') {
            console.error('Error verificando proyecto en proyectos_publicos:', selectError);
            return;
        }
        
        if (!existing) {
            const { data, error } = await supabase
                .from('proyectos_publicos')
                .insert({ 
                    nombre_proyecto: nombreProyecto, 
                    megustas: 0, 
                    vistas: 0, 
                    comentario: [] 
                })
                .select()
                .single();
            
            if (error) {
                console.error('Error insertando en proyectos_publicos:', error);
            } else {
                console.log('✅ Proyecto agregado a proyectos_publicos:', data);
            }
        } else {
            console.log('ℹ️ Proyecto ya existe en proyectos_publicos');
        }
    } catch (err) {
        console.error('Error en insertIntoProyectosPublicos:', err);
    }
}

async function updatePublishLinkInSupabase(pagesUrl) {
    try {
        const supabase = initSupabase();
        if (!supabase || !currentProject) return;
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.log('No hay sesión activa en Supabase, link guardado solo en localStorage');
            return;
        }
        
        // Obtener nombre de usuario desde localStorage
        const nombreUsuario = localStorage.getItem('supabase_nombrepersona') || localStorage.getItem('devcenter_user');
        if (!nombreUsuario) {
            console.log('No se encontró el nombre de usuario en localStorage');
            return;
        }
        
        const { data: personaData, error: fetchError } = await supabase
            .from('personas')
            .select('id, proyectos')
            .eq('nombrepersona', nombreUsuario)
            .single();
        
        if (fetchError || !personaData) {
            console.error('Usuario no encontrado en Supabase:', fetchError);
            return;
        }
        
        let proyectos = personaData.proyectos || [];
        const projectIndex = proyectos.findIndex(p => p.numeroProyecto === currentProject.id);
        
        if (projectIndex !== -1) {
            proyectos[projectIndex].link = pagesUrl;
            
            // Eliminar campo code de todos los proyectos antes de guardar
            const proyectosParaGuardar = proyectos.map(p => {
                const { code, ...proyectoSinCode } = p;
                return proyectoSinCode;
            });
            
            const { error: updateError } = await supabase
                .from('personas')
                .update({ proyectos: proyectosParaGuardar })
                .eq('id', personaData.id);
            
            if (updateError) {
                console.error('Error al actualizar link en Supabase:', updateError);
            } else {
                console.log('✅ Link de publicación guardado en Supabase correctamente');
            }
        }
    } catch (error) {
        console.error('Error al actualizar link en Supabase:', error);
    }
}

// Get publish info from localStorage
function getPublishInfo() {
    if (!currentProject) return null;
    
    // Primero intentar desde localStorage
    const publishInfoStr = localStorage.getItem(`publish_info_${currentProject.id}`);
    if (publishInfoStr) {
        try {
            return JSON.parse(publishInfoStr);
        } catch (e) {
            // Si hay error al parsear, continuar con currentProject.link
        }
    }
    
    // Si no está en localStorage pero currentProject tiene link, sintetizar publishInfo
    if (currentProject.link) {
        return {
            pagesUrl: currentProject.link,
            repoUrl: currentProject.repoUrl || '',
            timestamp: new Date().toISOString()
        };
    }
    
    return null;
}

// Update publish buttons based on publish state
function updatePublishButtons() {
    const publishInfo = getPublishInfo();
    const formatBtn = document.getElementById('formatBtn');
    const publishBtn = document.getElementById('publishBtn');
    const publishBtnText = document.getElementById('publishBtnText');
    
    if (publishInfo) {
        // Ya está publicado
        if (formatBtn) {
            formatBtn.style.display = 'flex';
        }
        
        if (publishBtn && publishBtnText) {
            publishBtnText.style.display = 'none';
            publishBtn.title = 'Abrir página web';
        }
    } else {
        // No está publicado
        if (formatBtn) {
            formatBtn.style.display = 'none';
        }
        
        if (publishBtn && publishBtnText) {
            publishBtnText.style.display = 'inline';
            publishBtn.title = 'Publicar proyecto';
        }
    }
}

// Insertar o actualizar proyecto en proyectos_publicos
async function insertarProyectoPublico(project) {
    try {
        const nombreProyecto = project.title || project.titulo;
        if (!nombreProyecto) {
            console.error('El proyecto no tiene título');
            return null;
        }
        
        // Buscar si ya existe
        const { data: proyectoExistente, error: selectError } = await window.supabase
            .from('proyectos_publicos')
            .select('*')
            .eq('nombre_proyecto', nombreProyecto)
            .maybeSingle();
        
        if (selectError && selectError.code !== 'PGRST116') {
            console.error('Error buscando proyecto público:', selectError);
            return null;
        }
        
        // Si ya existe, no hacer nada (mantener megustas y vistas actuales)
        if (proyectoExistente) {
            console.log('✅ Proyecto ya existe en proyectos_publicos');
            return proyectoExistente;
        }
        
        // Si no existe, insertar nuevo
        const { data: nuevoProyecto, error: insertError } = await window.supabase
            .from('proyectos_publicos')
            .insert([{
                nombre_proyecto: nombreProyecto,
                megustas: 0,
                vistas: 0,
                comentario: []
            }])
            .select()
            .single();
        
        if (insertError) {
            console.error('Error insertando proyecto público:', insertError);
            return null;
        }
        
        console.log('✅ Proyecto insertado en proyectos_publicos:', nombreProyecto);
        return nuevoProyecto;
    } catch (err) {
        console.error('Error en insertarProyectoPublico:', err);
        return null;
    }
}

// Toggle DevCenterX (private/public)
async function toggleDevCenterX() {
    if (!currentProject) {
        alert('No hay proyecto cargado');
        return;
    }
    
    const currentState = currentProject.devcenter || 'private';
    const newState = currentState === 'private' ? 'public' : 'private';
    
    currentProject.devcenter = newState;
    
    // Guardar en localStorage
    localStorage.setItem('currentProject', JSON.stringify(currentProject));
    
    let userProjects = JSON.parse(localStorage.getItem('userProjects') || '[]');
    const index = userProjects.findIndex(p => p.id === currentProject.id);
    if (index !== -1) {
        userProjects[index] = currentProject;
        localStorage.setItem('userProjects', JSON.stringify(userProjects));
    }
    
    // Guardar en Supabase
    await saveProjectToSupabase();
    
    // Si se hace público, insertar/actualizar en proyectos_publicos
    if (newState === 'public') {
        await insertarProyectoPublico(currentProject);
    }
    
    // Actualizar UI
    updateDevCenterXButton();
    
    // Mostrar mensaje
    const message = newState === 'public' 
        ? '✅ Proyecto compartido en DevCenterX' 
        : '✅ Proyecto removido de DevCenterX';
    showDevCenterXMessage(message);
}

// Update DevCenterX button based on project state
function updateDevCenterXButton() {
    const devCenterBtn = document.getElementById('devCenterBtn');
    const devCenterIcon = document.getElementById('devCenterIcon');
    const devCenterBtnText = document.getElementById('devCenterBtnText');
    
    if (!devCenterBtn || !currentProject) return;
    
    // Solo mostrar el botón si el proyecto tiene link (está publicado)
    const publishInfo = getPublishInfo();
    if (!publishInfo || !publishInfo.pagesUrl) {
        devCenterBtn.style.display = 'none';
        return;
    }
    
    devCenterBtn.style.display = 'flex';
    
    const isPublic = currentProject.devcenter === 'public';
    
    if (isPublic) {
        devCenterBtn.classList.add('public');
        devCenterBtn.title = 'Remove from DevCenterX';
        if (devCenterIcon) {
            devCenterIcon.className = 'fas fa-check-circle';
        }
        if (devCenterBtnText) {
            devCenterBtnText.textContent = 'Public';
        }
    } else {
        devCenterBtn.classList.remove('public');
        devCenterBtn.title = 'Share to DevCenterX';
        if (devCenterIcon) {
            devCenterIcon.className = 'fas fa-cloud-upload-alt';
        }
        if (devCenterBtnText) {
            devCenterBtnText.textContent = 'DevCenterX';
        }
    }
}

// Show DevCenterX message
function showDevCenterXMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 60px;
        right: 20px;
        background: linear-gradient(135deg, #a78bfa, #8b5cf6);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(167, 139, 250, 0.4);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Handle publish button click (publish or open site)
function handlePublishClick() {
    const publishInfo = getPublishInfo();
    
    if (publishInfo) {
        // Ya está publicado, abrir la página
        window.open(publishInfo.pagesUrl, '_blank');
    } else {
        // No está publicado, publicar
        handlePublish();
    }
}

// Handle format button click (republicar)
async function handleFormatRepublish() {
    const publishInfo = getPublishInfo();
    
    if (!publishInfo) {
        alert('No se ha publicado el proyecto aún');
        return;
    }
    
    // Llamar a handleRepublish directamente
    await window.handleRepublish(publishInfo.username, publishInfo.repoName);
}

// Handle Publish - Create GitHub Repository
async function handlePublish() {
    try {
        const htmlCode = elements.htmlEditor.value;
        const cssCode = elements.cssEditor.value;
        const jsCode = elements.jsEditor.value;
        
        console.log('🔍 Verificando token de GitHub...');
        console.log('window.GITHUB_TOKEN:', window.GITHUB_TOKEN ? '✅ Existe' : '❌ No encontrado');
        console.log('window.GITHUB_API_URL:', window.GITHUB_API_URL);
        
        // Check if we have the GitHub token
        if (!window.GITHUB_TOKEN) {
            alert('Error: No se encontró el token de GitHub. Por favor verifica keys.js\n\nAsegúrate de que keys.js se esté cargando correctamente.');
            return;
        }
        
        // Show loading modal
        showPublishingModal();
        
        // Get GitHub username
        updatePublishStatus('Connecting to GitHub...');
        const userResponse = await fetch(`${window.GITHUB_API_URL}/user`, {
            headers: {
                'Authorization': `token ${window.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!userResponse.ok) {
            const errorData = await userResponse.json();
            throw new Error(`Authentication failed: ${errorData.message || 'Invalid GitHub token'}`);
        }
        
        const userData = await userResponse.json();
        const githubUsername = userData.login;
        
        // Get person name from localStorage (saved by main script.js when user logs in)
        let personName = localStorage.getItem('supabase_nombrepersona') || 'usuario';
        
        console.log('✅ Person name from localStorage:', personName);
        console.log('GitHub username (for API):', githubUsername);
        
        // Get project name (only the title, not the full name)
        const projectName = currentProject?.title || 'mi-proyecto';
        console.log('Project name:', projectName);
        
        // Create repo name: personname-projectname
        const repoName = `${personName}-${projectName}`.toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        
        console.log('Repository name will be:', repoName);
        
        // Create repository
        updatePublishStatus('Creating repository...');
        const createRepoResponse = await fetch(`${window.GITHUB_API_URL}/user/repos`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${window.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: repoName,
                description: `Proyecto web: ${currentProject?.title || 'Mi Proyecto'}`,
                private: false,
                auto_init: true
            })
        });
        
        if (!createRepoResponse.ok) {
            const errorData = await createRepoResponse.json();
            if (errorData.errors && errorData.errors[0]?.message.includes('already exists')) {
                hidePublishingModal();
                showRepublishModal(githubUsername, repoName);
                return;
            }
            throw new Error(`Failed to create repository: ${errorData.message || 'Unknown error'}`);
        }
        
        const repoData = await createRepoResponse.json();
        
        // Wait a moment for repo to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Upload files to repository
        updatePublishStatus('Uploading files...');
        
        // Upload index.html
        await uploadFileToGitHub(githubUsername, repoName, 'index.html', htmlCode);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Upload style.css
        await uploadFileToGitHub(githubUsername, repoName, 'style.css', cssCode);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Upload script.js
        await uploadFileToGitHub(githubUsername, repoName, 'script.js', jsCode);
        
        // Enable GitHub Pages
        updatePublishStatus('Configuring hosting...');
        try {
            await fetch(`${window.GITHUB_API_URL}/repos/${githubUsername}/${repoName}/pages`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${window.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    source: {
                        branch: 'main',
                        path: '/'
                    }
                })
            });
        } catch (error) {
            console.log('GitHub Pages might already be enabled or requires manual activation');
        }
        
        // Show success with links
        const repoUrl = repoData.html_url;
        const pagesUrl = `https://${githubUsername}.github.io/${repoName}/`;
        
        // Save publish info
        await savePublishInfo(githubUsername, repoName, pagesUrl);
        
        showSuccessModal(repoUrl, pagesUrl);
        
    } catch (error) {
        console.error('Error:', error);
        hidePublishingModal();
        showErrorModal(error.message);
    }
}

// Upload file to GitHub
async function uploadFileToGitHub(username, repoName, filename, content) {
    const encodedContent = btoa(unescape(encodeURIComponent(content)));
    
    const response = await fetch(`${window.GITHUB_API_URL}/repos/${username}/${repoName}/contents/${filename}`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${window.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Add ${filename}`,
            content: encodedContent
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to upload files: ${errorData.message || 'Unknown error'}`);
    }
    
    return await response.json();
}

// Show publishing modal
function showPublishingModal() {
    const modalHTML = `
        <div id="publishingModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(14, 21, 37, 0.95); backdrop-filter: blur(8px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'IBM Plex Sans', sans-serif;">
            <div style="background: var(--bg-primary); border: 1px solid var(--border); border-radius: 12px; max-width: 480px; width: 100%; padding: 32px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); text-align: center;">
                <div style="width: 48px; height: 48px; margin: 0 auto 20px; border: 3px solid var(--bg-secondary); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <h2 style="color: var(--text-primary); font-size: 20px; font-weight: 600; margin-bottom: 12px;">Publishing to GitHub</h2>
                <div id="publishStatus" style="color: var(--text-secondary); font-size: 13px; margin-bottom: 24px; min-height: 36px; line-height: 1.5;">
                    Preparing deployment...
                </div>
                <div style="width: 100%; height: 3px; background: var(--bg-secondary); border-radius: 2px; overflow: hidden;">
                    <div id="publishProgress" style="width: 0%; height: 100%; background: linear-gradient(90deg, var(--accent), var(--icon-purple)); transition: width 0.4s ease; animation: shimmer 1.5s infinite;"></div>
                </div>
            </div>
        </div>
        <style>
        @keyframes shimmer {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Update publish status
function updatePublishStatus(message) {
    const statusEl = document.getElementById('publishStatus');
    const progressEl = document.getElementById('publishProgress');
    
    if (statusEl) {
        statusEl.textContent = message;
    }
    
    if (progressEl) {
        const currentWidth = parseInt(progressEl.style.width) || 0;
        progressEl.style.width = Math.min(currentWidth + 25, 90) + '%';
    }
}

// Hide publishing modal
function hidePublishingModal() {
    const modal = document.getElementById('publishingModal');
    if (modal) {
        modal.remove();
    }
}

// Show success modal with links
function showSuccessModal(repoUrl, pagesUrl) {
    hidePublishingModal();
    
    const modalHTML = `
        <div id="successModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(14, 21, 37, 0.95); backdrop-filter: blur(8px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'IBM Plex Sans', sans-serif;">
            <div style="background: var(--bg-primary); border: 1px solid var(--border); border-radius: 12px; max-width: 560px; width: 100%; padding: 32px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: linear-gradient(135deg, var(--success-green), #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-check" style="font-size: 32px; color: white;"></i>
                    </div>
                    <h2 style="color: var(--text-primary); font-size: 22px; font-weight: 600; margin-bottom: 8px;">Published Successfully</h2>
                    <p style="color: var(--text-secondary); font-size: 13px;">Your project is now live on GitHub</p>
                </div>
                
                <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <i class="fas fa-globe" style="color: var(--icon-green); font-size: 16px;"></i>
                        <h3 style="color: var(--text-primary); font-size: 14px; font-weight: 600; margin: 0;">Live Site</h3>
                    </div>
                    <p style="color: var(--text-secondary); font-size: 11px; margin-bottom: 10px; padding: 8px 12px; background: rgba(16, 185, 129, 0.05); border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.2);">
                        <i class="fas fa-info-circle" style="margin-right: 6px;"></i>May take 1-2 minutes to be available
                    </p>
                    <a href="${pagesUrl}" target="_blank" style="color: var(--icon-green); font-size: 13px; word-break: break-all; text-decoration: none; display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: rgba(16, 185, 129, 0.05); border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.2); transition: all 0.2s;">
                        <i class="fas fa-external-link-alt" style="font-size: 11px;"></i>
                        <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">${pagesUrl.replace('https://', '')}</span>
                    </a>
                </div>
                
                <button onclick="closeSuccessModal()" style="width: 100%; padding: 12px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; font-family: 'IBM Plex Sans', sans-serif;">
                    Done
                </button>
            </div>
        </div>
        <style>
        #successModal a:hover {
            background: rgba(16, 185, 129, 0.1) !important;
            border-color: var(--icon-green) !important;
        }
        #successModal button:hover {
            background: var(--accent-hover);
            transform: translateY(-1px);
        }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close success modal
window.closeSuccessModal = function() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.remove();
    }
}

// Show error modal
function showErrorModal(errorMessage) {
    const modalHTML = `
        <div id="errorModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(14, 21, 37, 0.95); backdrop-filter: blur(8px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'IBM Plex Sans', sans-serif;">
            <div style="background: var(--bg-primary); border: 1px solid var(--border); border-radius: 12px; max-width: 480px; width: 100%; padding: 32px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: linear-gradient(135deg, var(--icon-red), #dc2626); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 28px; color: white;"></i>
                    </div>
                    <h2 style="color: var(--text-primary); font-size: 20px; font-weight: 600; margin-bottom: 8px;">Publishing Failed</h2>
                    <p style="color: var(--text-secondary); font-size: 13px;">An error occurred during deployment</p>
                </div>
                
                <div style="background: rgba(248, 113, 113, 0.05); border: 1px solid rgba(248, 113, 113, 0.2); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <div style="display: flex; align-items: flex-start; gap: 10px;">
                        <i class="fas fa-info-circle" style="color: var(--icon-red); font-size: 14px; margin-top: 2px;"></i>
                        <p style="color: var(--text-primary); font-size: 13px; margin: 0; line-height: 1.5; word-break: break-word;">${errorMessage}</p>
                    </div>
                </div>
                
                <button onclick="closeErrorModal()" style="width: 100%; padding: 12px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; font-family: 'IBM Plex Sans', sans-serif;">
                    Close
                </button>
            </div>
        </div>
        <style>
        #errorModal button:hover {
            background: var(--bg-primary);
            border-color: var(--text-secondary);
        }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close error modal
window.closeErrorModal = function() {
    const modal = document.getElementById('errorModal');
    if (modal) {
        modal.remove();
    }
};

// Show republish modal when repository already exists
function showRepublishModal(username, repoName) {
    const repoUrl = `https://github.com/${username}/${repoName}`;
    const pagesUrl = `https://${username}.github.io/${repoName}/`;
    
    const modalHTML = `
        <div id="republishModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(14, 21, 37, 0.95); backdrop-filter: blur(8px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'IBM Plex Sans', sans-serif;">
            <div style="background: var(--bg-primary); border: 1px solid var(--border); border-radius: 12px; max-width: 520px; width: 100%; padding: 32px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-sync-alt" style="font-size: 28px; color: white;"></i>
                    </div>
                    <h2 style="color: var(--text-primary); font-size: 20px; font-weight: 600; margin-bottom: 8px;">El repositorio ya existe</h2>
                    <p style="color: var(--text-secondary); font-size: 13px;">Puedes republicar tu proyecto</p>
                </div>
                
                <div style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <div style="display: flex; align-items: flex-start; gap: 10px;">
                        <i class="fas fa-info-circle" style="color: #f59e0b; font-size: 14px; margin-top: 2px;"></i>
                        <div style="flex: 1;">
                            <p style="color: var(--text-primary); font-size: 13px; margin: 0 0 12px 0; line-height: 1.6;">
                                Ya existe un repositorio con el nombre <a href="${pagesUrl}" target="_blank" style="color: var(--accent); text-decoration: none; font-weight: 600; border-bottom: 1px solid var(--accent); transition: all 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">${repoName}</a>.
                            </p>
                            <p style="color: var(--text-secondary); font-size: 12px; margin: 0; line-height: 1.5;">
                                Al presionar "Republicar", el repositorio existente se eliminará y se creará uno nuevo con tu código actualizado.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <button onclick="closeRepublishModal()" style="flex: 1; padding: 12px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; font-family: 'IBM Plex Sans', sans-serif;">
                        Cancelar
                    </button>
                    <button onclick="handleRepublish('${username}', '${repoName}')" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; font-family: 'IBM Plex Sans', sans-serif; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);">
                        <i class="fas fa-sync-alt" style="margin-right: 6px;"></i>
                        Republicar
                    </button>
                </div>
            </div>
        </div>
        <style>
        #republishModal button:hover {
            transform: translateY(-1px);
        }
        #republishModal button:active {
            transform: translateY(0px);
        }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close republish modal
window.closeRepublishModal = function() {
    const modal = document.getElementById('republishModal');
    if (modal) {
        modal.remove();
    }
};

// Handle republish - delete existing repo and create new one
window.handleRepublish = async function(username, repoName) {
    try {
        closeRepublishModal();
        showPublishingModal();
        
        // Delete existing repository
        updatePublishStatus('Eliminando repositorio existente...');
        const deleteResponse = await fetch(`${window.GITHUB_API_URL}/repos/${username}/${repoName}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${window.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!deleteResponse.ok && deleteResponse.status !== 404) {
            throw new Error('No se pudo eliminar el repositorio existente');
        }
        
        // Wait a moment for GitHub to process the deletion
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get code from editors
        const htmlCode = elements.htmlEditor.value;
        const cssCode = elements.cssEditor.value;
        const jsCode = elements.jsEditor.value;
        
        // Create new repository
        updatePublishStatus('Creando nuevo repositorio...');
        const createRepoResponse = await fetch(`${window.GITHUB_API_URL}/user/repos`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${window.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: repoName,
                description: `Proyecto web: ${currentProject?.title || 'Mi Proyecto'}`,
                private: false,
                auto_init: true
            })
        });
        
        if (!createRepoResponse.ok) {
            const errorData = await createRepoResponse.json();
            throw new Error(`Error al crear repositorio: ${errorData.message || 'Error desconocido'}`);
        }
        
        const repoData = await createRepoResponse.json();
        
        // Wait for repo to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Upload files
        updatePublishStatus('Subiendo archivos...');
        
        await uploadFileToGitHub(username, repoName, 'index.html', htmlCode);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await uploadFileToGitHub(username, repoName, 'style.css', cssCode);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await uploadFileToGitHub(username, repoName, 'script.js', jsCode);
        
        // Enable GitHub Pages
        updatePublishStatus('Configurando hosting...');
        try {
            await fetch(`${window.GITHUB_API_URL}/repos/${username}/${repoName}/pages`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${window.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    source: {
                        branch: 'main',
                        path: '/'
                    }
                })
            });
        } catch (error) {
            console.log('GitHub Pages might already be enabled or requires manual activation');
        }
        
        // Show success
        const repoUrl = repoData.html_url;
        const pagesUrl = `https://${username}.github.io/${repoName}/`;
        
        // Save publish info
        await savePublishInfo(username, repoName, pagesUrl);
        
        showSuccessModal(repoUrl, pagesUrl);
        
    } catch (error) {
        console.error('Error:', error);
        hidePublishingModal();
        showErrorModal(error.message);
    }
};

// Generate unique validation code
function generateValidationCode() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `${timestamp}-${random}`.toUpperCase();
}

// Download HTML file manually
window.downloadPublishFile = function() {
    const sessionId = getSessionId();
    const validationCode = localStorage.getItem(`session_validation_code_${sessionId}`);
    
    if (!validationCode) {
        alert('No hay archivo para descargar');
        return;
    }
    
    const projectData = localStorage.getItem(`pending_project_${validationCode}`);
    if (!projectData) {
        alert('No se encontró el proyecto');
        return;
    }
    
    const project = JSON.parse(projectData);
    const downloadPageHTML = '<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'    <meta charset="UTF-8">\n' +
'    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'    <title>Descarga tu Página Web</title>\n' +
'    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"><\/script>\n' +
'    <style>\n' +
'        * {\n' +
'            margin: 0;\n' +
'            padding: 0;\n' +
'            box-sizing: border-box;\n' +
'        }\n' +
'        body {\n' +
'            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;\n' +
'            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n' +
'            min-height: 100vh;\n' +
'            display: flex;\n' +
'            align-items: center;\n' +
'            justify-content: center;\n' +
'            padding: 20px;\n' +
'        }\n' +
'        .container {\n' +
'            background: white;\n' +
'            border-radius: 20px;\n' +
'            padding: 60px 40px;\n' +
'            text-align: center;\n' +
'            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);\n' +
'            max-width: 550px;\n' +
'            width: 100%;\n' +
'        }\n' +
'        h1 {\n' +
'            color: #333;\n' +
'            font-size: 32px;\n' +
'            margin-bottom: 20px;\n' +
'        }\n' +
'        p {\n' +
'            color: #666;\n' +
'            font-size: 16px;\n' +
'            margin-bottom: 40px;\n' +
'            line-height: 1.6;\n' +
'        }\n' +
'        .buttons {\n' +
'            display: flex;\n' +
'            gap: 15px;\n' +
'            justify-content: center;\n' +
'            flex-wrap: wrap;\n' +
'        }\n' +
'        .download-btn {\n' +
'            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n' +
'            color: white;\n' +
'            border: none;\n' +
'            padding: 18px 40px;\n' +
'            font-size: 16px;\n' +
'            font-weight: 600;\n' +
'            border-radius: 50px;\n' +
'            cursor: pointer;\n' +
'            transition: all 0.3s ease;\n' +
'            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);\n' +
'            min-width: 200px;\n' +
'        }\n' +
'        .download-btn:hover {\n' +
'            transform: translateY(-3px);\n' +
'            box-shadow: 0 15px 40px rgba(102, 126, 234, 0.6);\n' +
'        }\n' +
'        .download-btn:active {\n' +
'            transform: translateY(-1px);\n' +
'        }\n' +
'        .download-btn.txt {\n' +
'            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);\n' +
'            box-shadow: 0 10px 30px rgba(245, 87, 108, 0.4);\n' +
'        }\n' +
'        .download-btn.txt:hover {\n' +
'            box-shadow: 0 15px 40px rgba(245, 87, 108, 0.6);\n' +
'        }\n' +
'        .icon {\n' +
'            font-size: 80px;\n' +
'            margin-bottom: 30px;\n' +
'        }\n' +
'    </style>\n' +
'</head>\n' +
'<body>\n' +
'    <div class="container">\n' +
'        <div class="icon">📦</div>\n' +
'        <h1>Tu Página Web está Lista</h1>\n' +
'        <p>Elige el formato de descarga que prefieras:</p>\n' +
'        <div class="buttons">\n' +
'            <button class="download-btn" onclick="downloadZipNormal()">📄 ZIP Normal</button>\n' +
'            <button class="download-btn txt" onclick="downloadZipTxt()">📝 ZIP TXT</button>\n' +
'        </div>\n' +
'    </div>\n' +
'    <script>\n' +
'        const htmlCode = ' + JSON.stringify(project.html) + ';\n' +
'        const cssCode = ' + JSON.stringify(project.css) + ';\n' +
'        const jsCode = ' + JSON.stringify(project.js) + ';\n' +
'        async function downloadZipNormal() {\n' +
'            try {\n' +
'                const zip = new JSZip();\n' +
'                zip.file("index.html", htmlCode);\n' +
'                zip.file("style.css", cssCode);\n' +
'                zip.file("script.js", jsCode);\n' +
'                const blob = await zip.generateAsync({ type: "blob" });\n' +
'                const link = document.createElement("a");\n' +
'                link.href = URL.createObjectURL(blob);\n' +
'                link.download = "pagina-web.zip";\n' +
'                link.click();\n' +
'                const btn = event.target;\n' +
'                const originalText = btn.textContent;\n' +
'                btn.textContent = "✅ Descargado!";\n' +
'                setTimeout(function() { btn.textContent = originalText; }, 2000);\n' +
'            } catch (error) {\n' +
'                alert("Error al crear ZIP: " + error.message);\n' +
'            }\n' +
'        }\n' +
'        async function downloadZipTxt() {\n' +
'            try {\n' +
'                const zip = new JSZip();\n' +
'                zip.file("index.txt", htmlCode);\n' +
'                zip.file("style.txt", cssCode);\n' +
'                zip.file("script.txt", jsCode);\n' +
'                const blob = await zip.generateAsync({ type: "blob" });\n' +
'                const link = document.createElement("a");\n' +
'                link.href = URL.createObjectURL(blob);\n' +
'                link.download = "pagina-web-txt.zip";\n' +
'                link.click();\n' +
'                const btn = event.target;\n' +
'                const originalText = btn.textContent;\n' +
'                btn.textContent = "✅ Descargado!";\n' +
'                setTimeout(function() { btn.textContent = originalText; }, 2000);\n' +
'            } catch (error) {\n' +
'                alert("Error al crear ZIP: " + error.message);\n' +
'            }\n' +
'        }\n' +
'    <\/script>\n' +
'    <!-- VERIFICATION_CODE: ' + validationCode + ' -->\n' +
'</body>\n' +
'</html>';
    
    const blob = new Blob([downloadPageHTML], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'descarga-pagina.html';
    link.click();
};

// Show validation panel
function showValidationPanel(validationCode, sessionId) {
    // Create modal overlay
    const modalHTML = `
        <div id="publishModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; max-width: 600px; width: 100%; padding: 32px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6); position: relative;">
                <h2 style="color: var(--text-primary); font-size: 24px; margin-bottom: 16px; text-align: center;">Publicar Página Web</h2>
                
                <div style="background: rgba(0, 112, 243, 0.1); border: 1px solid rgba(0, 112, 243, 0.3); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                    <h3 style="color: var(--text-primary); font-size: 16px; margin-bottom: 12px;">📝 Pasos para publicar:</h3>
                    <ol style="color: var(--text-secondary); font-size: 14px; line-height: 1.8; padding-left: 20px;">
                        <li>📱 Envía este proyecto a <strong style="color: var(--text-primary);">321 100 2280</strong> por WhatsApp</li>
                        <li>💬 Escribe: <em>"¿Puedes publicar mi página web?"</em></li>
                        <li>🔐 Te enviarán un código de validación</li>
                        <li>✅ Ingresa el código aquí abajo para agregar tu proyecto</li>
                    </ol>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <label style="display: block; color: var(--text-secondary); font-size: 13px; margin-bottom: 8px; font-weight: 600;">Código de Validación:</label>
                    <input type="text" id="validationCodeInput" placeholder="Ingresa el código aquí..." style="width: 100%; padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); font-size: 16px; font-family: 'Courier New', monospace; letter-spacing: 1px;" />
                    <div id="validationMessage" style="margin-top: 8px; font-size: 13px; display: none;"></div>
                </div>
                
                <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                    <button onclick="closePublishModal()" style="flex: 1; padding: 12px; background: var(--bg-hover); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                        Cancelar
                    </button>
                    <button onclick="downloadPublishFile()" style="flex: 1; padding: 12px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                        📥 Descargar Archivo
                    </button>
                    <button onclick="validateAndAddProject()" style="flex: 1; padding: 12px; background: var(--primary-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                        ✅ Validar Código
                    </button>
                </div>
                
                <div style="text-align: center; font-size: 9px; color: rgba(128, 128, 128, 0.3); font-family: 'Courier New', monospace; margin-top: 12px;">
                    ID: ${sessionId}
                </div>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Focus on input
    setTimeout(() => {
        document.getElementById('validationCodeInput').focus();
    }, 100);
}

// Validate and add project
window.validateAndAddProject = function() {
    const input = document.getElementById('validationCodeInput');
    const messageDiv = document.getElementById('validationMessage');
    const code = input.value.trim().toUpperCase();
    
    if (!code) {
        messageDiv.style.display = 'block';
        messageDiv.style.color = '#f87171';
        messageDiv.textContent = '❌ Por favor ingresa un código';
        return;
    }
    
    // Check if code exists in localStorage
    const projectData = localStorage.getItem(`pending_project_${code}`);
    
    if (!projectData) {
        messageDiv.style.display = 'block';
        messageDiv.style.color = '#f87171';
        messageDiv.textContent = '❌ Código inválido. Por favor verifica e intenta de nuevo.';
        return;
    }
    
    try {
        const project = JSON.parse(projectData);
        
        // Create project object
        const newProject = {
            id: Date.now(),
            title: currentProject?.title || 'Mi Proyecto Web',
            initials: currentProject?.initials || 'MP',
            tags: Array.isArray(currentProject?.tags) ? currentProject.tags : ['web'],
            description: currentProject?.description || 'Proyecto creado con IA',
            status: 'Published',
            createdAt: new Date().toISOString(),
            code: {
                html: project.html,
                css: project.css,
                js: project.js
            }
        };
        
        // Save to userProjects
        let userProjects = JSON.parse(localStorage.getItem('userProjects') || '[]');
        userProjects.push(newProject);
        localStorage.setItem('userProjects', JSON.stringify(userProjects));
        
        // Remove pending project
        localStorage.removeItem(`pending_project_${code}`);
        
        // Show success message
        messageDiv.style.display = 'block';
        messageDiv.style.color = '#10b981';
        messageDiv.textContent = '✅ ¡Proyecto agregado exitosamente!';
        
        // Close modal and redirect after 1.5 seconds
        setTimeout(() => {
            closePublishModal();
            if (confirm('¿Quieres ir a ver tus proyectos?')) {
                window.location.href = '../Creator/app/my-projects.html';
            }
        }, 1500);
        
    } catch (error) {
        console.error('Error adding project:', error);
        messageDiv.style.display = 'block';
        messageDiv.style.color = '#f87171';
        messageDiv.textContent = '❌ Error al agregar el proyecto. Intenta de nuevo.';
    }
};

// Close modal
window.closePublishModal = function() {
    const modal = document.getElementById('publishModal');
    if (modal) {
        modal.remove();
    }
};

// === SAVE BUTTON STATE MANAGEMENT ===
let saveState = 'unsaved'; // 'unsaved', 'local', 'db-pending', 'db'
let hasUnsavedChanges = false;
let lastLocalSaveTime = null;
let lastDbSaveTime = null;
let autoSaveLocalInterval = null;
let autoSaveDbInterval = null;

// Update save button visual state
function updateSaveButtonState(state) {
    const saveBtn = document.getElementById('saveBtn');
    if (!saveBtn) return;
    
    // Remove all state classes
    saveBtn.classList.remove('state-unsaved', 'state-local', 'state-db-pending', 'state-db');
    
    // Add the new state class
    saveBtn.classList.add(`state-${state}`);
    saveState = state;
    
    // Update button text
    const saveBtnText = document.getElementById('saveBtnText');
    if (saveBtnText) {
        switch(state) {
            case 'unsaved':
                saveBtnText.textContent = 'Guardar';
                break;
            case 'local':
                saveBtnText.textContent = 'Local';
                break;
            case 'db-pending':
                saveBtnText.textContent = 'Pendiente';
                break;
            case 'db':
                saveBtnText.textContent = 'Guardado';
                break;
        }
    }
}

function markUnsavedChanges() {
    hasUnsavedChanges = true;
    if (activeBackupSlot) {
        updateBackupSaveIndicator('pending');
    } else if (saveState === 'db') {
        updateSaveButtonState('db-pending');
    } else if (saveState !== 'db-pending') {
        updateSaveButtonState('unsaved');
    }
}

async function saveToLocalStorageOnly() {
    if (activeBackupSlot) {
        console.log('📦 Modo backup activo - localStorage desactivado');
        return;
    }
    
    if (currentProject) {
        const html = elements.htmlEditor.value;
        const css = elements.cssEditor.value;
        const js = elements.jsEditor.value;
        
        if (html || css || js) {
            currentProject.code = { html, css, js };
        } else {
            delete currentProject.code;
        }
        
        localStorage.setItem('currentProject', JSON.stringify(currentProject));
        
        let userProjects = JSON.parse(localStorage.getItem('userProjects') || '[]');
        const index = userProjects.findIndex(p => p.id === currentProject.id);
        if (index !== -1) {
            userProjects[index] = currentProject;
            localStorage.setItem('userProjects', JSON.stringify(userProjects));
        }
        
        lastLocalSaveTime = new Date();
        hasUnsavedChanges = false;
        
        if (saveState !== 'db') {
            updateSaveButtonState('local');
        }
        
        console.log('✅ Guardado en localStorage');
    }
}

// Save to Supabase only
async function saveToSupabaseOnly() {
    try {
        await saveProjectToSupabase();
        lastDbSaveTime = new Date();
        updateSaveButtonState('db');
        console.log('✅ Guardado en base de datos');
    } catch (error) {
        console.error('Error al guardar en base de datos:', error);
    }
}

// === SETTINGS PANEL LOGIC ===
function loadAutoSaveSettings() {
    const settings = localStorage.getItem('editorAutoSaveSettings');
    if (settings) {
        const parsed = JSON.parse(settings);
        
        const localEnabled = document.getElementById('autoSaveLocalEnabled');
        const localInterval = document.getElementById('autoSaveLocalInterval');
        const dbEnabled = document.getElementById('autoSaveDbEnabled');
        const dbInterval = document.getElementById('autoSaveDbInterval');
        
        if (localEnabled) localEnabled.checked = parsed.localEnabled !== false;
        if (localInterval) localInterval.value = parsed.localInterval || 1;
        if (dbEnabled) dbEnabled.checked = parsed.dbEnabled === true;
        if (dbInterval) dbInterval.value = parsed.dbInterval || 3;
    }
}

function saveAutoSaveSettings() {
    const settings = {
        localEnabled: document.getElementById('autoSaveLocalEnabled')?.checked ?? true,
        localInterval: parseInt(document.getElementById('autoSaveLocalInterval')?.value) || 1,
        dbEnabled: document.getElementById('autoSaveDbEnabled')?.checked ?? false,
        dbInterval: parseInt(document.getElementById('autoSaveDbInterval')?.value) || 3
    };
    
    localStorage.setItem('editorAutoSaveSettings', JSON.stringify(settings));
    initAutoSave(); // Reinitialize with new settings
    
    console.log('✅ Configuración guardada:', settings);
}

let activeBackupSlot = null;
let backupAutoSaveInterval = null;

async function checkProjectHasBackup() {
    try {
        if (!currentProject) return false;
        const projectId = currentProject.id || currentProject.numeroProyecto;
        if (!projectId) return false;
        
        const supabase = initSupabase();
        if (!supabase) return false;
        
        const currentUser = localStorage.getItem('supabase_nombrepersona') || localStorage.getItem('devcenter_user');
        if (!currentUser) return false;
        
        const { data, error } = await supabase
            .from('personas')
            .select('publish_1, publish_2, publish_3, publish_4, publish_5, publish_6, publish_7, publish_8, publish_9, publish_10, publish_11, publish_12, publish_13, publish_14, publish_15, publish_16, publish_17, publish_18, publish_19, publish_20')
            .eq('nombrepersona', currentUser)
            .single();
        
        if (error || !data) return false;
        
        for (let i = 1; i <= 20; i++) {
            const slot = data[`publish_${i}`];
            if (slot && slot.numeroProyecto === projectId) {
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Error verificando backup:', error);
        return false;
    }
}

async function getProjectBackupSlot() {
    try {
        if (!currentProject) return null;
        const projectId = currentProject.id || currentProject.numeroProyecto;
        if (!projectId) return null;
        
        const supabase = initSupabase();
        if (!supabase) return null;
        
        const currentUser = localStorage.getItem('supabase_nombrepersona') || localStorage.getItem('devcenter_user');
        if (!currentUser) return null;
        
        const { data, error } = await supabase
            .from('personas')
            .select('publish_1, publish_2, publish_3, publish_4, publish_5, publish_6, publish_7, publish_8, publish_9, publish_10, publish_11, publish_12, publish_13, publish_14, publish_15, publish_16, publish_17, publish_18, publish_19, publish_20')
            .eq('nombrepersona', currentUser)
            .single();
        
        if (error || !data) return null;
        
        for (let i = 1; i <= 20; i++) {
            const slot = data[`publish_${i}`];
            if (slot && slot.numeroProyecto === projectId) {
                return { slot: i, data: slot };
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error obteniendo slot de backup:', error);
        return null;
    }
}

async function loadFromBackupSlot() {
    try {
        const backupInfo = await getProjectBackupSlot();
        if (!backupInfo) return false;
        
        activeBackupSlot = backupInfo.slot;
        const backupData = backupInfo.data;
        
        if (backupData.code) {
            elements.htmlEditor.value = backupData.code.html || '';
            elements.cssEditor.value = backupData.code.css || '';
            elements.jsEditor.value = backupData.code.js || '';
            
            if (currentProject) {
                currentProject.code = backupData.code;
            }
            
            console.log(`📦 Código cargado desde copia de seguridad (Slot ${backupInfo.slot})`);
            updatePreview();
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error cargando desde backup:', error);
        return false;
    }
}

async function saveToBackupSlot() {
    try {
        if (!activeBackupSlot || !currentProject) {
            console.log('No hay slot de backup activo');
            return false;
        }
        
        const supabase = initSupabase();
        if (!supabase) return false;
        
        const currentUser = localStorage.getItem('supabase_nombrepersona') || localStorage.getItem('devcenter_user');
        if (!currentUser) return false;
        
        const html = elements.htmlEditor.value;
        const css = elements.cssEditor.value;
        const js = elements.jsEditor.value;
        
        const projectId = currentProject.id || currentProject.numeroProyecto;
        
        const backupData = {
            titulo: currentProject.title || currentProject.titulo || 'Sin título',
            numeroProyecto: projectId,
            code: { html, css, js },
            descripcion: currentProject.description || currentProject.descripcion || '',
            fecha: new Date().toISOString(),
            tags: currentProject.tags || []
        };
        
        const updateData = {};
        updateData[`publish_${activeBackupSlot}`] = backupData;
        
        const { error } = await supabase
            .from('personas')
            .update(updateData)
            .eq('nombrepersona', currentUser);
        
        if (error) throw error;
        
        console.log(`💾 Guardado en copia de seguridad (Slot ${activeBackupSlot})`);
        updateBackupSaveIndicator('saved');
        return true;
    } catch (error) {
        console.error('Error guardando en backup:', error);
        updateBackupSaveIndicator('error');
        return false;
    }
}

function updateBackupSaveIndicator(state) {
    const indicator = document.getElementById('backupSaveIndicator');
    const saveBtnText = document.getElementById('saveBtnText');
    const saveBtn = document.getElementById('saveBtn');
    
    if (saveBtn) {
        saveBtn.classList.remove('state-unsaved', 'state-local', 'state-db-pending', 'state-db', 'state-backup');
    }
    
    if (state === 'saving') {
        if (indicator) {
            indicator.innerHTML = '<i class="fas fa-sync fa-spin"></i> Guardando...';
            indicator.style.color = '#f59e0b';
        }
        if (saveBtnText) saveBtnText.textContent = 'Guardando...';
        if (saveBtn) saveBtn.classList.add('state-db-pending');
    } else if (state === 'saved') {
        if (indicator) {
            indicator.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Guardado en copia de seguridad';
            indicator.style.color = '#4ade80';
        }
        if (saveBtnText) saveBtnText.textContent = 'Guardado';
        if (saveBtn) saveBtn.classList.add('state-backup');
        hasUnsavedChanges = false;
    } else if (state === 'pending') {
        if (indicator) {
            indicator.innerHTML = '<i class="fas fa-clock"></i> Cambios pendientes';
            indicator.style.color = '#f59e0b';
        }
        if (saveBtnText) saveBtnText.textContent = 'Guardar';
        if (saveBtn) saveBtn.classList.add('state-unsaved');
    } else if (state === 'error') {
        if (indicator) {
            indicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error al guardar';
            indicator.style.color = '#ef4444';
        }
        if (saveBtnText) saveBtnText.textContent = 'Reintentar';
        if (saveBtn) saveBtn.classList.add('state-unsaved');
    }
}

function initBackupAutoSave() {
    if (backupAutoSaveInterval) {
        clearInterval(backupAutoSaveInterval);
        backupAutoSaveInterval = null;
    }
    
    if (!activeBackupSlot) return;
    
    backupAutoSaveInterval = setInterval(async () => {
        if (hasUnsavedChanges && activeBackupSlot) {
            updateBackupSaveIndicator('saving');
            await saveToBackupSlot();
        }
    }, 2 * 60 * 1000);
    
    console.log('⏰ Auto-guardado de copia de seguridad activado: cada 2 minutos');
}

function stopBackupAutoSave() {
    if (backupAutoSaveInterval) {
        clearInterval(backupAutoSaveInterval);
        backupAutoSaveInterval = null;
    }
    activeBackupSlot = null;
}

async function initBackupMode() {
    const backupInfo = await getProjectBackupSlot();
    
    if (backupInfo) {
        activeBackupSlot = backupInfo.slot;
        console.log(`📦 Modo copia de seguridad activado (Slot ${activeBackupSlot})`);
        
        await loadFromBackupSlot();
        
        showBackupModeIndicator();
        
        initBackupAutoSave();
        
        return true;
    }
    
    return false;
}

function showBackupModeIndicator() {
    let indicator = document.getElementById('backupSaveIndicator');
    if (!indicator) {
        const projectInfo = document.querySelector('.project-info') || document.querySelector('.editor-header');
        if (projectInfo) {
            indicator = document.createElement('div');
            indicator.id = 'backupSaveIndicator';
            indicator.style.cssText = 'display: flex; align-items: center; gap: 6px; font-size: 12px; color: #4ade80; padding: 4px 10px; background: rgba(74, 222, 128, 0.1); border-radius: 6px; margin-left: 10px;';
            indicator.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Guardado por copia de seguridad';
            projectInfo.appendChild(indicator);
        }
    }
    updateBackupSaveIndicator('saved');
}

async function openSettingsPanel() {
    const panel = document.getElementById('settingsPanel');
    if (panel) {
        loadAutoSaveSettings();
        
        const supabaseSection = document.getElementById('supabaseSettingsSection');
        if (supabaseSection) {
            const hasBackup = await checkProjectHasBackup();
            supabaseSection.style.display = hasBackup ? 'block' : 'none';
            console.log(`📦 Sección Supabase ${hasBackup ? 'visible' : 'oculta'} (backup: ${hasBackup})`);
        }
        
        panel.style.display = 'flex';
    }
}

function closeSettingsPanel() {
    const panel = document.getElementById('settingsPanel');
    if (panel) {
        panel.style.display = 'none';
    }
}

// === AUTO-SAVE LOGIC ===
function initAutoSave() {
    // Clear existing intervals
    if (autoSaveLocalInterval) {
        clearInterval(autoSaveLocalInterval);
        autoSaveLocalInterval = null;
    }
    if (autoSaveDbInterval) {
        clearInterval(autoSaveDbInterval);
        autoSaveDbInterval = null;
    }
    
    // Get settings
    const settings = localStorage.getItem('editorAutoSaveSettings');
    const config = settings ? JSON.parse(settings) : {
        localEnabled: true,
        localInterval: 1,
        dbEnabled: false,
        dbInterval: 3
    };
    
    if (activeBackupSlot) {
        console.log('📦 Modo backup activo - auto-guardado local desactivado');
        return;
    }
    
    if (config.localEnabled) {
        const intervalMs = (config.localInterval || 1) * 60 * 1000;
        autoSaveLocalInterval = setInterval(() => {
            if (hasUnsavedChanges && !activeBackupSlot) {
                saveToLocalStorageOnly();
            }
        }, intervalMs);
        console.log(`📦 Auto-guardado local configurado: cada ${config.localInterval} minuto(s)`);
    }
    
    if (config.dbEnabled) {
        const intervalMs = (config.dbInterval || 3) * 60 * 1000;
        autoSaveDbInterval = setInterval(async () => {
            if (!activeBackupSlot && (hasUnsavedChanges || saveState === 'local' || saveState === 'db-pending')) {
                await saveToLocalStorageOnly();
                await saveToSupabaseOnly();
            }
        }, intervalMs);
        console.log(`☁️ Auto-guardado BD configurado: cada ${config.dbInterval} minuto(s)`);
    }
}

function initSaveAndSettings() {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (activeBackupSlot) {
                updateBackupSaveIndicator('saving');
                await saveToBackupSlot();
            } else {
                await saveToLocalStorageOnly();
                await saveToSupabaseOnly();
            }
        });
    }
    
    // Settings button click
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettingsPanel);
    }
    
    // Close settings button click
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', closeSettingsPanel);
    }
    
    // Save settings button click
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            saveAutoSaveSettings();
            closeSettingsPanel();
        });
    }
    
    // Close panel when clicking outside
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
        settingsPanel.addEventListener('click', (e) => {
            if (e.target === settingsPanel) {
                closeSettingsPanel();
            }
        });
    }
    
    // Load settings and initialize auto-save
    loadAutoSaveSettings();
    initAutoSave();
    
    // Initial state
    updateSaveButtonState('unsaved');
}

// Override the original input listeners to mark unsaved changes
function setupEditorChangeTracking() {
    const editors = [elements.htmlEditor, elements.jsEditor, elements.cssEditor];
    editors.forEach(editor => {
        if (editor) {
            editor.addEventListener('input', markUnsavedChanges);
        }
    });
}

// === SYNTAX HIGHLIGHTING FUNCTIONS ===
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function highlightHtml(code) {
    let escaped = escapeHtml(code);
    escaped = escaped.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="token comment">$1</span>');
    escaped = escaped.replace(/(&lt;\/?)([a-zA-Z][a-zA-Z0-9]*)/g, '$1<span class="token tag">$2</span>');
    escaped = escaped.replace(/([a-zA-Z-]+)(=)(&quot;|&#39;)([^"']*?)(&quot;|&#39;)/g, 
        '<span class="token attr-name">$1</span><span class="token punctuation">$2</span><span class="token attr-value">$3$4$5</span>');
    escaped = escaped.replace(/(&lt;|&gt;|\/&gt;)/g, '<span class="token punctuation">$1</span>');
    return escaped;
}

function highlightCss(code) {
    let escaped = escapeHtml(code);
    escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token comment">$1</span>');
    escaped = escaped.replace(/([.#]?[a-zA-Z_-][a-zA-Z0-9_-]*)\s*\{/g, '<span class="token selector">$1</span> {');
    escaped = escaped.replace(/([a-zA-Z-]+)\s*:/g, '<span class="token property">$1</span>:');
    escaped = escaped.replace(/(#[0-9a-fA-F]{3,8})/g, '<span class="token number">$1</span>');
    escaped = escaped.replace(/(\d+(?:\.\d+)?)(px|em|rem|%|vh|vw|s|ms)/g, '<span class="token number">$1$2</span>');
    escaped = escaped.replace(/(rgba?\([^)]+\))/g, '<span class="token function">$1</span>');
    return escaped;
}

function highlightJs(code) {
    let escaped = escapeHtml(code);
    escaped = escaped.replace(/(\/\/.*$)/gm, '<span class="token comment">$1</span>');
    escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token comment">$1</span>');
    escaped = escaped.replace(/\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|try|catch|throw|new|class|extends|import|export|from|default|async|await|typeof|instanceof)\b/g, 
        '<span class="token keyword">$1</span>');
    escaped = escaped.replace(/\b(true|false|null|undefined|NaN|Infinity)\b/g, '<span class="token keyword">$1</span>');
    escaped = escaped.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, '<span class="token function">$1</span>(');
    escaped = escaped.replace(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g, '<span class="token string">$1</span>');
    escaped = escaped.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="token number">$1</span>');
    escaped = escaped.replace(/(===|!==|==|!=|&lt;=|&gt;=|&lt;|&gt;|\+|\-|\*|\/|%|=|\&\&|\|\|)/g, '<span class="token operator">$1</span>');
    return escaped;
}

function updateHighlight(editorId) {
    const editor = document.getElementById(editorId);
    const highlightId = editorId.replace('Editor', 'Highlight');
    const highlightEl = document.getElementById(highlightId);
    
    if (!editor || !highlightEl) return;
    
    const code = editor.value;
    const codeEl = highlightEl.querySelector('code');
    
    if (!codeEl) return;
    
    let highlighted = '';
    if (editorId === 'htmlEditor') {
        highlighted = highlightHtml(code);
    } else if (editorId === 'cssEditor') {
        highlighted = highlightCss(code);
    } else if (editorId === 'jsEditor') {
        highlighted = highlightJs(code);
    }
    
    codeEl.innerHTML = highlighted + '\n';
}

function syncScroll(editorId) {
    const editor = document.getElementById(editorId);
    const highlightId = editorId.replace('Editor', 'Highlight');
    const highlightEl = document.getElementById(highlightId);
    
    if (!editor || !highlightEl) return;
    
    highlightEl.scrollTop = editor.scrollTop;
    highlightEl.scrollLeft = editor.scrollLeft;
}

function initSyntaxHighlighting() {
    const editorConfigs = [
        { editorId: 'htmlEditor', highlightId: 'htmlHighlight' },
        { editorId: 'jsEditor', highlightId: 'jsHighlight' },
        { editorId: 'cssEditor', highlightId: 'cssHighlight' }
    ];
    
    editorConfigs.forEach(config => {
        const editor = document.getElementById(config.editorId);
        if (editor) {
            editor.addEventListener('input', () => updateHighlight(config.editorId));
            editor.addEventListener('scroll', () => syncScroll(config.editorId));
            updateHighlight(config.editorId);
        }
    });
}

// Call init functions on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initSaveAndSettings();
        setupEditorChangeTracking();
        initSyntaxHighlighting();
    }, 200);
});

// Initialize app
init();
