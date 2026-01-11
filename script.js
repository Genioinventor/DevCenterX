// script.js - carga desde Supabase y JSONBin

// ==================== CONFIGURACIÓN ====================
// Constantes de configuración para sección promocional
const ENABLE_PROMOTED_SECTION = false; // Desactivado por defecto
const PROMOTED_PROJECT_NAMES = []; // Lista de proyectos promocionados

// ==================== SISTEMA DE PLANES ====================
const PLANS_CONFIG = {
  0: {
    name: 'Normal',
    color: '#3b82f6',
    icon: 'user',
    maxApps: 10,
    maxAgentUsage: 50,
    agent: 'Flash',
    imageGeneration: 0,
    instructions: 'Largo',
    programming: 'Uno por uno',
    teams: 0,
    support: 'Limitado IA',
    backups: 2,
    publications: 3,
    price: '$0 MXN',
    benefits: [
      { icon: 'check', text: '10 aplicaciones', active: true },
      { icon: 'check', text: 'Agent Flash', active: true },
      { icon: 'x', text: 'Sin generación de imágenes', active: false },
      { icon: 'check', text: 'Instrucciones Largo', active: true },
      { icon: 'check', text: 'Programación Uno por uno', active: true },
      { icon: 'x', text: 'Sin equipos', active: false },
      { icon: 'check', text: 'Soporte Limitado IA', active: true },
      { icon: 'check', text: '2 Copias de seguridad', active: true },
      { icon: 'check', text: '3 Publicaciones', active: true }
    ]
  },
  1: {
    name: 'Plus',
    color: '#8b5cf6',
    icon: 'star',
    maxApps: 15,
    maxAgentUsage: 75,
    agent: 'Pro',
    imageGeneration: 5,
    instructions: 'Largo Específico',
    programming: 'All (Todo)',
    teams: 2,
    support: '24/7',
    backups: 10,
    publications: 7,
    price: '$126 MXN',
    benefits: [
      { icon: 'check', text: '15 aplicaciones', active: true },
      { icon: 'check', text: 'Agent Pro', active: true },
      { icon: 'check', text: '5 Generación de imágenes', active: true },
      { icon: 'check', text: 'Instrucciones Largo Específico', active: true },
      { icon: 'check', text: 'Programación All (Todo)', active: true },
      { icon: 'check', text: 'Equipos 2 Personas', active: true },
      { icon: 'check', text: 'Soporte 24/7', active: true },
      { icon: 'check', text: '10 Copias de seguridad', active: true },
      { icon: 'check', text: '7 Publicaciones', active: true }
    ]
  },
  2: {
    name: 'Ultimate',
    color: '#f59e0b',
    icon: 'crown',
    maxApps: 30,
    maxAgentUsage: 100,
    agent: 'Pro',
    imageGeneration: 15,
    instructions: 'Ultra Largo De todo específico',
    programming: 'All (Todo)',
    teams: 10,
    support: '24/7 Code Assistance',
    backups: 20,
    publications: 25,
    price: '$450 MXN',
    benefits: [
      { icon: 'check', text: '30 aplicaciones', active: true },
      { icon: 'check', text: 'Agent Pro', active: true },
      { icon: 'check', text: '15 Generación de imágenes', active: true },
      { icon: 'check', text: 'Instrucciones Ultra Largo De todo específico', active: true },
      { icon: 'check', text: 'Programación All (Todo)', active: true },
      { icon: 'check', text: 'Equipos 10 Personas', active: true },
      { icon: 'check', text: 'Soporte 24/7 Code Assistance', active: true },
      { icon: 'check', text: '20 Copias de seguridad', active: true },
      { icon: 'check', text: '25 Publicaciones', active: true }
    ]
  }
};

function getUserPlan(statusCode) {
  const planIndex = Math.min(statusCode || 0, 2);
  return PLANS_CONFIG[planIndex] || PLANS_CONFIG[0];
}

window.PLANS_CONFIG = PLANS_CONFIG;
window.getUserPlan = getUserPlan;

// ==================== LOADING SPINNER HELPER ====================
function createLoadingSpinner(message = 'Cargando...', size = 'normal') {
  const sizeClass = size === 'small' ? 'small' : size === 'large' ? 'large' : '';
  return `
    <div class="loading-spinner-container ${sizeClass}">
      <div class="loading-spinner">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <p class="loading-spinner-text">${message}</p>
    </div>
  `;
}

// Hacer disponible globalmente
window.createLoadingSpinner = createLoadingSpinner;

// ==================== SUPABASE CLIENT ====================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = window.SUPABASE_URL || "https://sgqnjgfkycfzsrtwzdfq.supabase.co";
const supabaseKey = window.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNncW5qZ2ZreWNmenNydHd6ZGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTkwMzMsImV4cCI6MjA3Nzg3NTAzM30.xEVn6iuos-l241hlrwHWpoz3q4seQHzDeXpzdhDoPNs";
const supabase = createClient(supabaseUrl, supabaseKey);

// Hacer disponible globalmente para logout
window.supabaseClient = supabase;

// Disparar evento cuando Supabase esté listo
window.dispatchEvent(new CustomEvent('supabaseReady', { detail: { client: supabase } }));

console.log('✅ Cliente Supabase inicializado');

// Usuario actual de Supabase
let currentSupabaseUser = null;

// Funciones de Supabase - Verificar y crear usuario si NO existe
async function initSupabaseUser(userName, userId = null) {
  if (!userName) {
    console.warn('⚠️ No se puede inicializar usuario de Supabase sin nombre de usuario');
    return null;
  }
  try {
    let user = null;
    let error = null;

    // Buscar usuario por nombrepersona
    const result = await supabase
      .from("personas")
      .select("*")
      .eq("nombrepersona", userName)
      .maybeSingle();
    
    user = result.data;
    error = result.error;

    if (error && error.code !== 'PGRST116') {
      console.error('Error buscando usuario:', error);
      return null;
    }

    // Si el usuario existe, devolverlo
    if (user) {
      console.log(`✅ Usuario encontrado: ${userName}`);
      
      currentSupabaseUser = user;
      
      // Guardar nombrepersona en localStorage para que Programar/ pueda accederlo
      localStorage.setItem('supabase_nombrepersona', user.nombrepersona);
      console.log('✅ Usuario Supabase cargado:', user.nombrepersona);
      console.log('💾 Nombre guardado en localStorage:', user.nombrepersona);
      
      return user;
    }

    // Si NO existe, crear nuevo usuario automáticamente
    console.log(`📝 Usuario ${userName} no existe, creando automáticamente...`);
    
    const { data: newUser, error: insertError } = await supabase
      .from("personas")
      .insert([{
        nombrepersona: userName,
        limite: 0,
        status: 0,
        proyectos: []
      }])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creando usuario:', insertError);
      return null;
    }

    currentSupabaseUser = newUser;
    
    // Guardar nombrepersona en localStorage para que Programar/ pueda accederlo
    localStorage.setItem('supabase_nombrepersona', newUser.nombrepersona);
    console.log('✅ Usuario creado y cargado exitosamente:', newUser.nombrepersona);
    console.log('💾 Nombre guardado en localStorage:', newUser.nombrepersona);
    
    return newUser;
  } catch (err) {
    console.error('Error en initSupabaseUser:', err);
    return null;
  }
}

async function getSupabaseUserProjects() {
  console.log('🔍 getSupabaseUserProjects llamada');
  console.log('  - currentSupabaseUser:', currentSupabaseUser);
  console.log('  - proyectos:', currentSupabaseUser?.proyectos);
  
  if (!currentSupabaseUser || !currentSupabaseUser.proyectos) {
    console.log('⚠️ No hay usuario o proyectos');
    return [];
  }
  
  // Retornar TODOS los proyectos del usuario (tanto private como public)
  console.log('✅ Proyectos del usuario obtenidos:', currentSupabaseUser.proyectos);
  return currentSupabaseUser.proyectos;
}

async function getSupabasePublicProjects() {
  if (!currentSupabaseUser || !currentSupabaseUser.proyectos) return [];
  return currentSupabaseUser.proyectos.filter(p => p.devcenter === "public");
}

async function getAllSupabasePublicProjects() {
  try {
    let { data: allUsers, error } = await supabase
      .from("personas")
      .select("proyectos, nombrepersona");

    if (error) {
      console.error('Error obteniendo proyectos públicos:', error);
      return [];
    }

    const publicProjects = [];
    allUsers.forEach(user => {
      if (user.proyectos && Array.isArray(user.proyectos)) {
        user.proyectos
          .filter(p => p.devcenter === "public" && p.link && p.link !== '' && p.link !== '#')
          .forEach(p => {
            // Agregar el nombre del creador al proyecto
            publicProjects.push({
              ...p,
              owner: user.nombrepersona || 'Comunidad'
            });
          });
      }
    });

    console.log(`✅ ${publicProjects.length} proyectos públicos con link válido desde Supabase`);
    return publicProjects;
  } catch (err) {
    console.error('Error en getAllSupabasePublicProjects:', err);
    return [];
  }
}

async function updateSupabaseProject(numeroProyecto, updates) {
  if (!currentSupabaseUser) {
    console.error('No hay usuario cargado');
    return false;
  }

  try {
    const projectIndex = currentSupabaseUser.proyectos.findIndex(
      p => p.numeroProyecto == numeroProyecto
    );

    if (projectIndex === -1) {
      console.error('Proyecto no encontrado');
      return false;
    }

    currentSupabaseUser.proyectos[projectIndex] = {
      ...currentSupabaseUser.proyectos[projectIndex],
      ...updates
    };

    // SIEMPRE eliminar código antes de guardar - código solo va en backup slots
    const proyectosParaGuardar = currentSupabaseUser.proyectos.map(p => {
      const { code, ...proyectoSinCode } = p;
      return proyectoSinCode;
    });

    const { error } = await supabase
      .from("personas")
      .update({ proyectos: proyectosParaGuardar })
      .eq("nombrepersona", currentSupabaseUser.nombrepersona);

    if (error) {
      console.error('Error actualizando proyecto:', error);
      return false;
    }

    console.log('✅ Proyecto actualizado en Supabase');
    return true;
  } catch (err) {
    console.error('Error en updateSupabaseProject:', err);
    return false;
  }
}

async function incrementarMegustasEnSupabase(nombreProyecto) {
  try {
    // Primero verificar si el proyecto existe
    const { data: existing, error: selectError } = await supabase
      .from('proyectos_publicos')
      .select('*')
      .eq('nombre_proyecto', nombreProyecto)
      .maybeSingle();
    
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ Error verificando proyecto:', selectError);
      return null;
    }
    
    if (existing) {
      // Proyecto existe, incrementar megustas
      const { data, error } = await supabase
        .from('proyectos_publicos')
        .update({ megustas: (existing.megustas || 0) + 1 })
        .eq('nombre_proyecto', nombreProyecto)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error incrementando me gustas:', error);
        return null;
      }
      
      console.log('✅ Me gustas incrementados:', data?.megustas);
      return data;
    } else {
      // Proyecto no existe, crearlo con 1 me gusta
      const { data, error } = await supabase
        .from('proyectos_publicos')
        .insert({ 
          nombre_proyecto: nombreProyecto, 
          megustas: 1, 
          vistas: 0, 
          comentario: [] 
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creando proyecto:', error);
        return null;
      }
      
      console.log('✅ Proyecto creado con 1 me gusta');
      return data;
    }
  } catch (err) {
    console.error('❌ Error en incrementarMegustasEnSupabase:', err);
    return null;
  }
}

async function decrementarMegustasEnSupabase(nombreProyecto) {
  try {
    // Primero verificar si el proyecto existe
    const { data: existing, error: selectError } = await supabase
      .from('proyectos_publicos')
      .select('*')
      .eq('nombre_proyecto', nombreProyecto)
      .maybeSingle();
    
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ Error verificando proyecto:', selectError);
      return null;
    }
    
    if (existing) {
      // Proyecto existe, decrementar megustas (no bajar de 0)
      const nuevoValor = Math.max(0, (existing.megustas || 0) - 1);
      const { data, error } = await supabase
        .from('proyectos_publicos')
        .update({ megustas: nuevoValor })
        .eq('nombre_proyecto', nombreProyecto)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error decrementando me gustas:', error);
        return null;
      }
      
      console.log('✅ Me gustas decrementados:', data?.megustas);
      return data;
    } else {
      // Proyecto no existe, crearlo con 0 me gustas
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
        console.error('❌ Error creando proyecto:', error);
        return null;
      }
      
      console.log('✅ Proyecto creado con 0 me gustas');
      return data;
    }
  } catch (err) {
    console.error('❌ Error en decrementarMegustasEnSupabase:', err);
    return null;
  }
}

async function incrementarVistasEnSupabase(nombreProyecto) {
  try {
    // Primero verificar si el proyecto existe
    const { data: existing, error: selectError } = await supabase
      .from('proyectos_publicos')
      .select('*')
      .eq('nombre_proyecto', nombreProyecto)
      .maybeSingle();
    
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ Error verificando proyecto:', selectError);
      return null;
    }
    
    if (existing) {
      // Proyecto existe, incrementar vistas
      const { data, error } = await supabase
        .from('proyectos_publicos')
        .update({ vistas: (existing.vistas || 0) + 1 })
        .eq('nombre_proyecto', nombreProyecto)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error incrementando vistas:', error);
        return null;
      }
      
      console.log('✅ Vistas incrementadas:', data?.vistas);
      return data;
    } else {
      // Proyecto no existe, crearlo con 1 vista
      const { data, error } = await supabase
        .from('proyectos_publicos')
        .insert({ 
          nombre_proyecto: nombreProyecto, 
          megustas: 0, 
          vistas: 1, 
          comentario: [] 
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creando proyecto:', error);
        return null;
      }
      
      console.log('✅ Proyecto creado con 1 vista');
      return data;
    }
  } catch (err) {
    console.error('❌ Error en incrementarVistasEnSupabase:', err);
    return null;
  }
}

async function agregarComentarioEnSupabase(nombreProyecto, comentarioData) {
  try {
    // Primero verificar si el proyecto existe
    const { data: existing, error: selectError } = await supabase
      .from('proyectos_publicos')
      .select('*')
      .eq('nombre_proyecto', nombreProyecto)
      .maybeSingle();
    
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ Error verificando proyecto:', selectError);
      return null;
    }
    
    // Obtener comentarios existentes
    const comentariosExistentes = existing?.comentario || [];
    const numeroComentario = comentariosExistentes.length + 1;
    
    // Crear nuevo comentario
    const nuevoComentario = {
      numero: numeroComentario,
      calificacion: comentarioData.calificacion || 0,
      comentario: comentarioData.comentario || '',
      fecha: new Date().toISOString(),
      nombre: comentarioData.nombre || 'Anónimo',
      respondidoA: comentarioData.respondidoA || null
    };
    
    // Agregar el nuevo comentario al array
    const comentariosActualizados = [...comentariosExistentes, nuevoComentario];
    
    if (existing) {
      // Proyecto existe, actualizar comentarios
      const { data, error } = await supabase
        .from('proyectos_publicos')
        .update({ comentario: comentariosActualizados })
        .eq('nombre_proyecto', nombreProyecto)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error agregando comentario:', error);
        return null;
      }
      
      console.log('✅ Comentario agregado correctamente');
      return data;
    } else {
      // Proyecto no existe, crearlo con el comentario
      const { data, error } = await supabase
        .from('proyectos_publicos')
        .insert({ 
          nombre_proyecto: nombreProyecto, 
          megustas: 0, 
          vistas: 0, 
          comentario: comentariosActualizados 
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creando proyecto con comentario:', error);
        return null;
      }
      
      console.log('✅ Proyecto creado con comentario');
      return data;
    }
  } catch (err) {
    console.error('❌ Error en agregarComentarioEnSupabase:', err);
    return null;
  }
}

// ==================== CONFIGURACIÓN ====================
const PROJECTS_PER_SECTION = 10;
const PROJECT_LINK_TEXT = "Explorar";
const PROJECT_LINK_ICON = '<i class="fas fa-compass"></i>';

// ==================== ORDENAMIENTO POR POPULARIDAD ====================
const POPULARITY_SORT_ENABLED = true;
const POP_MIN_VOTES = 5;
const POP_REVIEW_BONUS_K = 0.15;
const POP_FALLBACK_MEAN = 3.0;
const POP_QUALITY_BONUS = 0.08;
const POP_CONSISTENCY_PENALTY = 0.1;



(async function () {
  const projectsGrid = document.getElementById('projectsGrid');
  const searchBox = document.getElementById('searchBox');
  const emptyState = document.getElementById('emptyState');

  // PAGINACIÓN
  const paginationControls = document.getElementById('paginationControls');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const pageIndicator = document.getElementById('pageIndicator');

  let allProjects = [];
  
  // Función para normalizar proyectos de Supabase (español) a formato estándar (inglés)
  function normalizeProject(project) {
    // Si ya tiene el formato inglés, devolverlo tal cual
    if (project.title && !project.titulo) {
      return project;
    }
    
    // Convertir formato español a inglés
    return {
      title: project.titulo || project.title || '',
      initials: project.inicialesTitulo || project.initials || '??',
      tags: project.tags || [],
      description: project.descripcion || project.description || '',
      url: project.link || project.url || '',
      status: project.status || 'Activo',
      date: project.fecha || project.date || '',
      owner: project.owner || '',
      numeroProyecto: project.numeroProyecto || 0,
      devcenter: project.devcenter || 'private'
    };
  }
  let filteredProjects = [];
  let currentPage = 1;
  let pageSize = PROJECTS_PER_SECTION;
  let allReviews = []; // Almacena todos los comentarios y reseñas
  
  // Cache de popularidad y configuración
  let popularityCache = new Map(); // Almacena {title: {avg, count, score}}
  let globalMean = POP_FALLBACK_MEAN; // Promedio global calculado
  let isPopularitySortEnabled = POPULARITY_SORT_ENABLED;

  // Mapeo de estados a clases CSS
  // Solo los 11 estados que tienes en CSS
  // Mapeo de estados a clases CSS (sin OFICIAL)
  const statusMap = {
    'activo': 'status-activo',
    'beta': 'status-beta',
    'stable': 'status-stable',
    'experimental': 'status-experimental',
    'community': 'status-community',
    'premium': 'status-premium',
    'free': 'status-free',
    'demo': 'status-demo',
    'archived': 'status-archived',
    'paused': 'status-paused',
    'planning': 'status-planning',
    'completed': 'status-completed'
  };
  
  // Colores de estados (coinciden con Programar/script.js)
  const statusColors = {
    'activo': '#10b981',
    'beta': '#f59e0b',
    'stable': '#3b82f6',
    'experimental': '#a78bfa',
    'community': '#ec4899',
    'premium': '#fbbf24',
    'free': '#34d399',
    'demo': '#60a5fa',
    'archived': '#6b7280',
    'paused': '#9ca3af',
    'planning': '#8b5cf6',
    'completed': '#059669'
  };

  // SISTEMA DE CACHÉ
  function getCacheDuration(type) {
    return 5 * 60 * 1000; // 5 minutos en milisegundos
  }
  
  function getCachedData(key, type) {
    try {
      const cacheDuration = getCacheDuration(type);
      
      if (cacheDuration === 0) {
        return null;
      }
      
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      if (now - timestamp > cacheDuration) {
        localStorage.removeItem(key);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error leyendo caché:', error);
      return null;
    }
  }
  
  function setCachedData(key, data, type) {
    try {
      const cacheDuration = getCacheDuration(type);
      
      if (cacheDuration === 0) {
        return;
      }
      
      const cacheEntry = {
        data: data,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Error guardando en caché:', error);
    }
  }

  // FUNCIONES PARA RESEÑAS Y COMENTARIOS - Cargar desde Supabase
  async function loadReviews() {
    try {
      // Obtener todos los proyectos públicos con sus comentarios
      const { data: proyectosPublicos, error } = await supabase
        .from('proyectos_publicos')
        .select('nombre_proyecto, comentario');
      
      if (error) {
        console.error('Error cargando reseñas desde Supabase:', error);
        return [];
      }
      
      // Convertir el formato de Supabase al formato esperado por el sistema de reseñas
      const todasLasReviews = [];
      
      if (proyectosPublicos && Array.isArray(proyectosPublicos)) {
        proyectosPublicos.forEach(proyecto => {
          if (proyecto.comentario && Array.isArray(proyecto.comentario)) {
            proyecto.comentario.forEach(comentario => {
              todasLasReviews.push({
                proyecto: proyecto.nombre_proyecto,
                usuario: comentario.nombre || 'Anónimo',
                comentario: comentario.comentario || '',
                estrellas: comentario.calificacion || 0,
                fecha: comentario.fecha || new Date().toISOString(),
                numero: comentario.numero || 0,
                respondidoA: comentario.respondidoA || null
              });
            });
          }
        });
      }
      
      console.log(`✅ ${todasLasReviews.length} reseñas cargadas desde Supabase`);
      return todasLasReviews;
    } catch (err) {
      console.error('Error en loadReviews:', err);
      return [];
    }
  }

  function getProjectReviews(projectTitle) {
    if (!projectTitle) return [];
    return allReviews.filter(review => 
      review.proyecto && typeof review.proyecto === 'string' && 
      projectTitle && typeof projectTitle === 'string' &&
      review.proyecto.toLowerCase() === projectTitle.toLowerCase()
    );
  }

  function calculateAverageRating(projectTitle) {
    const reviews = getProjectReviews(projectTitle);
    if (reviews.length === 0) return 0;
    
    const sum = reviews.reduce((total, review) => total + (review.estrellas || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10; // Redondear a 1 decimal
  }

  function generateStarsHTML(rating) {
    let starsHTML = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const filledStarSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    const halfStarSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><defs><linearGradient id="half"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#half)"/></svg>';
    const emptyStarSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    
    for (let i = 0; i < fullStars; i++) {
      starsHTML += `<span class="star-filled">${filledStarSVG}</span>`;
    }
    
    if (hasHalfStar) {
      starsHTML += `<span class="star-half">${halfStarSVG}</span>`;
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      starsHTML += `<span class="star-empty">${emptyStarSVG}</span>`;
    }
    
    return starsHTML;
  }

  // ==================== FUNCIONES DE POPULARIDAD ====================
  
  // Calcula la puntuación de popularidad usando promedio bayesiano mejorado
  function computePopularityScore(avg, count, qualityReviews = 0, variance = 0) {
    const C = globalMean || POP_FALLBACK_MEAN;
    const m = POP_MIN_VOTES;
    const k = POP_REVIEW_BONUS_K;
    
    // Promedio bayesiano base
    const bayesianAvg = (count / (count + m)) * avg + (m / (count + m)) * C;
    
    // Bonificación logarítmica por número de reseñas (curva suavizada)
    const reviewBonus = k * Math.log(1 + count);
    
    // Bonificación por reseñas de calidad (con comentarios)
    const qualityBonus = qualityReviews > 0 ? POP_QUALITY_BONUS * Math.log(1 + qualityReviews) : 0;
    
    // Penalización por inconsistencia (variación extrema en ratings)
    const consistencyPenalty = variance > 1.5 ? POP_CONSISTENCY_PENALTY * (variance - 1.5) : 0;
    
    // Score final
    return bayesianAvg + reviewBonus + qualityBonus - consistencyPenalty;
  }
  
  // Obtiene información de popularidad para un proyecto
  function getPopularityInfo(title) {
    return popularityCache.get(title) || { avg: 0, count: 0, score: 0, qualityReviews: 0, variance: 0 };
  }
  
  // Calcula la varianza de ratings para un proyecto
  function calculateRatingVariance(projectTitle) {
    const reviews = getProjectReviews(projectTitle);
    if (reviews.length <= 1) return 0;
    
    const ratings = reviews.map(r => r.estrellas || 0).filter(r => r > 0);
    if (ratings.length <= 1) return 0;
    
    const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    const variance = ratings.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / ratings.length;
    
    return Math.sqrt(variance); // Desviación estándar
  }
  
  // Construye el cache de popularidad para todos los proyectos
  function buildPopularityCache() {
    popularityCache.clear();
    
    // Calcular promedio global de todas las reseñas
    let totalRating = 0;
    let totalCount = 0;
    
    allReviews.forEach(review => {
      if (review.estrellas && review.estrellas > 0) {
        totalRating += review.estrellas;
        totalCount++;
      }
    });
    
    globalMean = totalCount > 0 ? totalRating / totalCount : POP_FALLBACK_MEAN;
    
    // Construir cache para cada proyecto
    allProjects.forEach(project => {
      const title = project.title;
      const reviews = getProjectReviews(title);
      const avg = calculateAverageRating(title);
      const count = reviews.length;
      
      // Contar reseñas de calidad (con comentarios significativos)
      const qualityReviews = reviews.filter(r => r.comentario && r.comentario.trim().length > 10).length;
      
      // Calcular varianza de ratings
      const variance = calculateRatingVariance(title);
      
      // Calcular score con todos los factores
      const score = computePopularityScore(avg, count, qualityReviews, variance);
      
      popularityCache.set(title, { avg, count, score, qualityReviews, variance });
    });
    
    console.log('[Popularidad] Cache construido: ' + popularityCache.size + ' proyectos, promedio global: ' + globalMean.toFixed(2));
  }
  
  // Verifica si el ordenamiento por popularidad está habilitado
  function isPopularitySortEnabledCheck() {
    // Verificar localStorage, si no existe usar el valor por defecto
    const stored = localStorage.getItem('dc_sort_popularity');
    if (stored !== null) {
      isPopularitySortEnabled = stored === 'true';
    }
    return isPopularitySortEnabled;
  }
  
  // Ordena proyectos por popularidad si está habilitado
  function sortProjectsByPopularity(projects) {
    if (!isPopularitySortEnabledCheck()) {
      return projects; // Sin ordenar si está deshabilitado
    }
    
    return projects.sort((a, b) => {
      const infoA = getPopularityInfo(a.title);
      const infoB = getPopularityInfo(b.title);
      
      // Ordenar por puntuación de popularidad (descendente)
      if (infoA.score !== infoB.score) {
        return infoB.score - infoA.score;
      }
      
      // Desempate por rating promedio (descendente)
      if (infoA.avg !== infoB.avg) {
        return infoB.avg - infoA.avg;
      }
      
      // Desempate por número de reseñas (descendente)
      if (infoA.count !== infoB.count) {
        return infoB.count - infoA.count;
      }
      
      // Desempate final por título (ascendente) para orden determinístico
      return a.title.localeCompare(b.title);
    });
  }

  // Función eliminada para evitar XSS - usar reviews-handler.js para el panel


  // FAVORITOS: helpers
  // Cache de favoritos para evitar múltiples accesos a localStorage en una misma renderización
  let favoritesCache = null;
  function getFavorites() {
    if (favoritesCache) return favoritesCache;
    try {
      favoritesCache = JSON.parse(localStorage.getItem('dc_favorites') || '[]');
      return favoritesCache;
    } catch { favoritesCache = []; return favoritesCache; }
  }
  function setFavorites(favs) {
    favoritesCache = favs;
    localStorage.setItem('dc_favorites', JSON.stringify(favs));
  }
  function isFavorite(project) {
    const favs = getFavorites();
    return favs.some(f => f.url === project.url);
  }
  function toggleFavorite(project, options = {}) {
    let favs = getFavorites();
    if (isFavorite(project)) {
      favs = favs.filter(f => f.url !== project.url);
    } else {
      favs.push({ url: project.url, title: project.title, initials: project.initials, status: project.status, tags: project.tags });
    }
    setFavorites(favs);
    
    // Si se marca favorito desde Apps, re-renderizar la sección Apps
    if (options.rerenderApps) {
      renderAllProjectsInAppsSection();
    }
  }

  // Render favoritos en la sección principal (DESHABILITADO - favoritos solo se muestran en Apps)
  function renderFavoritesSection() {
    // Ya no mostramos favoritos en Home, solo en Apps ordenados arriba
    const favSection = document.getElementById('favoritesSection');
    if (favSection) {
      favSection.style.display = 'none';
    }
  }

  // Delegación de eventos para favoritos en el grid principal
  projectsGrid.addEventListener('click', function (e) {
    const favBtn = e.target.closest('.fav-btn');
    if (favBtn) {
      e.stopPropagation();
      e.preventDefault();
      const card = favBtn.closest('.project-card');
      if (!card) return;
      const title = card.querySelector('h3')?.childNodes[0]?.nodeValue || '';
      const url = card.querySelector('a.project-link')?.href || '';
      const initials = card.querySelector('.project-icon')?.textContent || '';
      const status = card.querySelector('.status-badge')?.textContent || '';
      const tags = (card.getAttribute('data-tags') || '').split(' ').filter(Boolean);
      toggleFavorite({ url, title, initials, status, tags });
      renderProjects(filteredProjects);
      return;
    }
    // Delegación para abrir panel
    const card = e.target.closest('.project-card');
    if (card && !e.target.closest('.fav-btn')) {
      const url = card.querySelector('a.project-link')?.href || '';
      const project = allProjects.find(p => p.url === url);
      if (project) showProjectPanel(project);
    }
  });

  function createCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    const tags = Array.isArray(project.tags) ? project.tags : (typeof project.tags === 'string' ? project.tags.split(',').map(t => t.trim()) : []);
    card.setAttribute('data-tags', tags.join(' '));

    const header = document.createElement('div');
    header.className = 'project-header';

    const icon = document.createElement('div');
    icon.className = 'project-icon';
    icon.textContent = project.initials || (project.title || '').slice(0, 2).toUpperCase();

    const titleWrap = document.createElement('div');
    titleWrap.className = 'project-title';

    const h3 = document.createElement('h3');
    h3.style.display = 'flex';
    h3.style.alignItems = 'center';
    h3.style.gap = '8px';
    h3.textContent = project.title || '';

    // Botón Favoritos en la tarjeta (corazón)
    const favBtn = document.createElement('button');
    favBtn.className = 'fav-btn';
    favBtn.title = 'Me gusta';
    favBtn.style.background = 'none';
    favBtn.style.border = 'none';
    favBtn.style.cursor = 'pointer';
    favBtn.style.padding = '0';
    favBtn.style.marginLeft = '6px';
    
    // Verificar si ya es favorito y mostrar el ícono correcto
    const esFavorito = isFavorite(project);
    const heartIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
    const heartOutlineIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
    favBtn.innerHTML = esFavorito 
      ? `<span style="color:#ef4444;">${heartIcon}</span>`
      : `<span style="color:#facc15;">${heartOutlineIcon}</span>`;
    
    favBtn.onclick = async (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      // Verificar estado ANTES de hacer el toggle
      const eraFavorito = isFavorite(project);
      
      // Toggle favorito en localStorage
      toggleFavorite(project, { rerenderApps: true });
      
      // Incrementar o decrementar en Supabase según corresponda
      if (!eraFavorito) {
        await incrementarMegustasEnSupabase(project.title);
      } else {
        await decrementarMegustasEnSupabase(project.title);
      }
      
      // Actualizar el ícono basado en el nuevo estado
      const nuevoEstado = isFavorite(project);
      favBtn.innerHTML = nuevoEstado
        ? `<span style="color:#ef4444;">${heartIcon}</span>`
        : `<span style="color:#facc15;">${heartOutlineIcon}</span>`;
    };

    h3.appendChild(favBtn);

    const badge = document.createElement('span');
    badge.className = 'status-badge';

    const status = (project.status || '').toLowerCase();
    const statusClass = statusMap[status] || 'status-new';
    badge.classList.add(statusClass);
    badge.textContent = (status || 'unknown').toUpperCase();

    titleWrap.appendChild(h3);
    titleWrap.appendChild(badge);

    // Agregar calificación con estrellas
    const rating = calculateAverageRating(project.title);
    const reviewCount = getProjectReviews(project.title).length;
    
    if (rating > 0 || reviewCount > 0) {
      const ratingDiv = document.createElement('div');
      ratingDiv.className = 'project-rating';
      
      const starsContainer = document.createElement('div');
      starsContainer.className = 'stars-container';
      starsContainer.innerHTML = generateStarsHTML(rating);
      
      const ratingText = document.createElement('span');
      ratingText.className = 'rating-text';
      ratingText.textContent = rating > 0 ? rating + ' (' + reviewCount + ' reseña' + (reviewCount !== 1 ? 's' : '') + ')' : reviewCount + ' reseña' + (reviewCount !== 1 ? 's' : '');
      
      ratingDiv.appendChild(starsContainer);
      ratingDiv.appendChild(ratingText);
      titleWrap.appendChild(ratingDiv);
    }

    // Mostrar información del owner (oculto por defecto, se muestra al hacer click en status)
    if (project.owner) {
      const ownerDiv = document.createElement('div');
      ownerDiv.className = 'project-creator';
      ownerDiv.style.marginTop = '8px';
      ownerDiv.style.fontSize = '0.9rem';
      ownerDiv.style.display = 'none';
      ownerDiv.innerHTML = '<strong>Creador:</strong> ' + project.owner;
      titleWrap.appendChild(ownerDiv);
      
      // Hacer el badge clickeable para mostrar/ocultar el creador
      badge.style.cursor = 'pointer';
      badge.title = 'Click para ver creador';
      badge.addEventListener('click', function(e) {
        e.stopPropagation();
        ownerDiv.style.display = ownerDiv.style.display === 'none' ? 'block' : 'none';
      });
    }

    header.appendChild(icon);
    header.appendChild(titleWrap);

    // Solo agregar el link pequeño si no es para Apps section
    if (!project.isAppsSection) {
      const link = document.createElement('a');
      link.className = 'project-link';
      link.href = '#';
      link.innerHTML = PROJECT_LINK_TEXT + ' <span>' + PROJECT_LINK_ICON + '</span>';

      // Al hacer click en el link, abre el panel de información
      link.addEventListener('click', function (e) {
        e.preventDefault();
        showProjectPanel(project);
      });

      card.appendChild(link);
    }

    // Hacer las iniciales clickeables para abrir la app directamente
    if (project.url && project.url !== '#' && project.url !== '') {
      icon.style.cursor = 'pointer';
      icon.title = 'Abrir app en nueva pestaña';
      icon.addEventListener('click', async function(e) {
        e.stopPropagation();
        await incrementarVistasEnSupabase(project.title);
        window.open(project.url, '_blank');
      });
    }

    card.appendChild(header);

    return card;
  }

  function renderProjects(projects) {
    filteredProjects = projects || [];
    const favs = getFavorites();
    const favUrls = favs.map(f => f.url);
    
    // Filtrar proyectos promocionales (solo si la sección promocional está activa)
    const visibleProjects = filteredProjects.filter(p => 
      (!ENABLE_PROMOTED_SECTION || !PROMOTED_PROJECT_NAMES.includes(p.title))
    );
    
    // Ordenar proyectos: favoritos primero, luego el resto
    const sortedProjects = visibleProjects.sort((a, b) => {
      const aIsFav = favUrls.includes(a.url);
      const bIsFav = favUrls.includes(b.url);
      if (aIsFav && !bIsFav) return -1;
      if (!aIsFav && bIsFav) return 1;
      return 0;
    });

    const total = sortedProjects.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageProjects = sortedProjects.slice(start, end);

    projectsGrid.innerHTML = '';
    if (!pageProjects || pageProjects.length === 0) {
      emptyState.style.display = 'block';
      paginationControls.style.display = 'none';
      const promotedSection = document.getElementById('promotedSection');
      if (promotedSection) {
        promotedSection.style.display = 'none';
      }
      return;
    } else {
      emptyState.style.display = 'none';
    }
    
    // Usar DocumentFragment para renderizado más fluido (evita múltiples reflows)
    const fragment = document.createDocumentFragment();
    pageProjects.forEach((p, i) => {
      const card = createCard(p);
      card.style.animationDelay = (i * 0.05) + 's';
      fragment.appendChild(card);
    });
    projectsGrid.appendChild(fragment);
    updatePaginationIndicator();
  }

  function updatePaginationIndicator() {
    const visibleProjects = filteredProjects.filter(p => 
      (!ENABLE_PROMOTED_SECTION || !PROMOTED_PROJECT_NAMES.includes(p.title))
    );
    const total = visibleProjects.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    pageIndicator.textContent = 'Página ' + currentPage + ' de ' + totalPages;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
  }

  function goToPage(page) {
    const visibleProjects = filteredProjects.filter(p => 
      (!ENABLE_PROMOTED_SECTION || !PROMOTED_PROJECT_NAMES.includes(p.title))
    );
    const total = visibleProjects.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    currentPage = Math.max(1, Math.min(page, totalPages));
    renderProjects(filteredProjects);
  }

  prevPageBtn?.addEventListener('click', () => goToPage(currentPage - 1));
  nextPageBtn?.addEventListener('click', () => goToPage(currentPage + 1));
  // Elimina el eventListener de pageSizeInput

  function applySearchFilter(term) {
    const searchTerm = (term || '').toLowerCase().trim();
    let visibleCount = 0;

    // Filtra los proyectos en memoria, no los DOM
    let filtered = allProjects.filter(project => {
      const title = (project.title || '').toLowerCase();
      const tags = (project.tags || []).map(t => t.toLowerCase());
      const status = (project.status || '').toLowerCase();
      const initials = (project.initials || (project.title || '').slice(0, 2)).toLowerCase();

      return (
        title.startsWith(searchTerm) ||
        title.includes(searchTerm) ||
        tags.some(tag => tag.startsWith(searchTerm)) ||
        tags.some(tag => tag.includes(searchTerm)) ||
        status.includes(searchTerm) ||
        initials.startsWith(searchTerm) ||
        initials.includes(searchTerm)
      );
    });

    // Aplicar ordenamiento por popularidad si está habilitado
    filtered = sortProjectsByPopularity(filtered);
    
    visibleCount = filtered.length;
    currentPage = 1;
    renderProjects(filtered);
    
    // Mostrar/ocultar sección promocional según haya resultados
    const promotedSection = document.getElementById('promotedSection');
    if (visibleCount === 0) {
      emptyState.style.display = 'block';
      if (promotedSection) {
        promotedSection.style.display = 'none';
      }
    } else {
      emptyState.style.display = 'none';
      if (promotedSection && ENABLE_PROMOTED_SECTION) {
        renderPromotedSection();
      }
    }
  }

  // Función para agregar estilos promocionales
  function addPromotionalStyles() {
    // Verificar si ya existen los estilos
    if (document.getElementById('promotional-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'promotional-styles';
    style.textContent = `
      #promotedSection {
        margin-bottom: 40px;
      }
      
      #promotedSection .section-header {
        margin-bottom: 20px;
      }
      
      #promotedSection .project-card {
        border: 2px solid var(--primary, #0070f3);
        box-shadow: 0 4px 12px rgba(0, 112, 243, 0.1);
      }
    `;
    document.head.appendChild(style);
  }

  // Función para renderizar la sección promocional
  function renderPromotedSection() {
    const promotedSection = document.getElementById('promotedSection');
    if (!promotedSection || !ENABLE_PROMOTED_SECTION) {
      if (promotedSection) {
        promotedSection.style.display = 'none';
      }
      return;
    }
    
    // Obtener proyectos promocionados
    const promotedProjects = allProjects.filter(p => PROMOTED_PROJECT_NAMES.includes(p.title));
    
    if (promotedProjects.length === 0) {
      promotedSection.style.display = 'none';
      return;
    }
    
    promotedSection.style.display = 'block';
    promotedSection.innerHTML = '';
    
    // Crear título de la sección
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = '<h2>Proyectos Destacados</h2>';
    promotedSection.appendChild(header);
    
    // Crear grid de proyectos promocionados
    const grid = document.createElement('div');
    grid.className = 'projects-grid';
    
    promotedProjects.forEach((p, i) => {
      const card = createCard(p);
      card.style.animationDelay = (i * 0.08) + 's';
      grid.appendChild(card);
    });
    
    promotedSection.appendChild(grid);
  }

  // SearchBox - DESACTIVADO (ahora se usa para chat con IA)
  if (searchBox) {
    // Desactivar búsqueda de proyectos ya que ahora es para chat con IA
    // El evento de input ya no filtra proyectos
  }

  // 🚀 Inicializar usuario - Verificar tabla 'cuentas' (localStorage) o Supabase Auth
  let isUserLoggedIn = false;
  let loggedUserName = null;
  
  // PRIMERO: Verificar sesión desde localStorage (tabla 'cuentas')
  const localUser = localStorage.getItem('devcenter_user');
  
  if (localUser) {
    console.log(`✅ Sesión detectada desde tabla 'cuentas': ${localUser}`);
    loggedUserName = localUser;
    isUserLoggedIn = true;
    
    // Inicializar usuario en tabla "personas"
    await initSupabaseUser(loggedUserName, null);
    console.log(`✅ Usuario inicializado desde tabla 'cuentas'`);
  } else {
    // SEGUNDO: Verificar sesión de Supabase Auth (para OAuth)
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔍 Verificando sesión de Supabase Auth:', session ? 'Sesión activa' : 'Sin sesión');
    
    if (session?.user) {
      try {
        const userEmail = session.user.email;
        console.log(`✅ Sesión activa detectada, email: ${userEmail}`);
        
        // Obtener username desde la tabla "cuentas" usando email
        const { data: cuentaData } = await supabase
          .from('cuentas')
          .select('usuario')
          .eq('email', userEmail)
          .maybeSingle();
        
        if (cuentaData?.usuario) {
          loggedUserName = cuentaData.usuario;
          console.log(`✅ Username encontrado en cuentas: ${loggedUserName}`);
          
          // Inicializar o crear usuario en tabla "personas"
          await initSupabaseUser(loggedUserName);
          isUserLoggedIn = true;
          console.log(`✅ Usuario Supabase inicializado correctamente`);
          
          // Verificar si hay redirección pendiente después del login
          const redirectAfterLogin = localStorage.getItem('redirect_after_login');
          if (redirectAfterLogin) {
            console.log(`🔄 Redirección pendiente a: ${redirectAfterLogin}`);
            // Eliminar el valor de redirección
            localStorage.removeItem('redirect_after_login');
            
            // Cambiar a la sección correspondiente
            setTimeout(() => {
              const targetNavItem = document.querySelector(`.nav-item[data-section="${redirectAfterLogin}"]`);
              if (targetNavItem) {
                targetNavItem.click();
                console.log(`✅ Redirigido a sección: ${redirectAfterLogin}`);
              }
            }, 500); // Esperar medio segundo para que todo se cargue
          }
        } else {
          console.log('⚠️ No se encontró usuario en cuentas para este email');
        }
      } catch (e) {
        console.error('❌ Error al verificar sesión:', e);
      }
    } else {
      console.log('ℹ️ No hay sesión activa de Supabase');
    }
  }
  
  // Actualizar información del plan del usuario SOLO si está logeado
  if (isUserLoggedIn && currentSupabaseUser) {
    const userPlanTitle = document.getElementById('userPlanTitle');
    const userAgentUsage = document.getElementById('userAgentUsage');
    const userAppsCount = document.getElementById('userAppsCount');
    const upgradeAgentBtn = document.getElementById('upgradeAgentBtn');
    
    // Obtener el plan del usuario desde PLANS_CONFIG (con fallback seguro)
    const statusCode = Math.min(currentSupabaseUser.status || 0, 2);
    const userPlan = PLANS_CONFIG[statusCode] || PLANS_CONFIG[0];
    
    if (userPlanTitle && userPlan) {
      userPlanTitle.textContent = `Plan ${userPlan.name}`;
    }
    
    if (userAgentUsage) {
      userAgentUsage.textContent = `${currentSupabaseUser.limite || 0}% used`;
    }
    
    if (userAppsCount && userPlan) {
      const projectCount = currentSupabaseUser.proyectos ? currentSupabaseUser.proyectos.length : 0;
      userAppsCount.textContent = `${projectCount}/${userPlan.maxApps} created`;
    }
    
    // Ocultar botón de Upgrade para usuarios Ultimate (status >= 2)
    if (upgradeAgentBtn) {
      if (statusCode >= 2) {
        upgradeAgentBtn.style.display = 'none';
      } else {
        upgradeAgentBtn.style.display = '';
      }
    }
    
    console.log(`📊 Sidebar actualizado - Plan: ${userPlan?.name}, Apps: ${currentSupabaseUser.proyectos?.length || 0}/${userPlan?.maxApps}`);
  }
  
  // 🚀 Cargar datos - Solo desde Supabase (JSONBIN eliminado)
  
  // EN LA SECCIÓN HOME: Verificar estado de login primero
  const userProjectsGrid = document.getElementById('userProjectsGrid');
  const userProjectsEmpty = document.getElementById('userProjectsEmpty');
  
  console.log('🔍 Estado de carga de proyectos:');
  console.log('  - userProjectsGrid existe:', !!userProjectsGrid);
  console.log('  - isUserLoggedIn:', isUserLoggedIn);
  console.log('  - currentSupabaseUser:', currentSupabaseUser);
  console.log('  - currentSupabaseUser.proyectos:', currentSupabaseUser?.proyectos);
  
  // Si NO está logueado, mostrar mensaje de login inmediatamente
  if (userProjectsGrid && userProjectsEmpty && !isUserLoggedIn) {
    // Usuario NO logeado: mostrar mensaje indicando que debe iniciar sesión
    userProjectsGrid.innerHTML = '';
    userProjectsGrid.style.display = 'none';
    userProjectsEmpty.style.display = 'flex';
    // Agregar clase para ocultar botón del header
    document.querySelector('.projects-section-premium')?.classList.add('has-empty-state');
    
    // Actualizar el mensaje para usuarios no logueados
    const emptyStateTitle = document.getElementById('emptyStateTitle');
    const emptyStateDescription = document.getElementById('emptyStateDescription');
    const createFirstAppBtn = document.getElementById('createFirstAppBtn');
    const createFirstAppBtnText = document.getElementById('createFirstAppBtnText');
    
    if (emptyStateTitle) {
      emptyStateTitle.textContent = 'Inicia sesión para ver tus proyectos';
    }
    
    if (emptyStateDescription) {
      emptyStateDescription.textContent = 'Necesitas iniciar sesión para cargar y gestionar tus apps';
    }
    
    if (createFirstAppBtn && createFirstAppBtnText) {
      createFirstAppBtnText.textContent = 'Iniciar sesión';
      // Redirigir al login cuando se hace clic
      createFirstAppBtn.onclick = () => {
        window.location.href = '/Creator/index.html';
      };
    }
    
    // Configurar botón Create App del header para usuarios no logueados
    const createAppHeaderBtn = document.getElementById('createAppHeaderBtn');
    if (createAppHeaderBtn) {
      createAppHeaderBtn.onclick = () => {
        window.location.href = '/Creator/index.html';
      };
    }
    
    console.log('ℹ️ Usuario no logueado: mostrando mensaje de inicio de sesión');
  }
  
  try {
    // Cargar reseñas
    allReviews = await loadReviews();
    console.log('[Reviews] Reseñas cargadas:', allReviews.length);
    
    // Los proyectos ahora solo vienen de Supabase, no de JSONBIN
    allProjects = [];
    console.log('=========================================================');
    console.log(`[✅] Total de proyectos cargados: ${allProjects.length}`);
    console.log('=========================================================');
    
    // Construir cache de popularidad después de cargar proyectos y reseñas
    buildPopularityCache();
    
    // Inicializar sección promocional
    addPromotionalStyles();
    renderPromotedSection();
    
    // Solo cargar proyectos si el usuario está logueado
    if (userProjectsGrid && userProjectsEmpty && isUserLoggedIn && currentSupabaseUser) {
      // Mostrar spinner mientras se cargan los proyectos
      userProjectsGrid.innerHTML = createLoadingSpinner('Cargando tus proyectos...');
      userProjectsGrid.style.display = 'block';
      userProjectsEmpty.style.display = 'none';
      // Remover clase cuando hay proyectos
      document.querySelector('.projects-section-premium')?.classList.remove('has-empty-state');
      
      const userProjects = await getSupabaseUserProjects();
      console.log('🔍 Proyectos del usuario obtenidos:', userProjects);
      console.log('🔍 Tipo de userProjects:', typeof userProjects, 'Es array:', Array.isArray(userProjects));
      
      // Restaurar mensajes originales del empty state por si fueron modificados
      const emptyStateTitle = document.getElementById('emptyStateTitle');
      const emptyStateDescription = document.getElementById('emptyStateDescription');
      const createFirstAppBtn = document.getElementById('createFirstAppBtn');
      const createFirstAppBtnText = document.getElementById('createFirstAppBtnText');
      
      if (emptyStateTitle) {
        emptyStateTitle.textContent = 'No tienes apps todavía';
      }
      
      if (emptyStateDescription) {
        emptyStateDescription.textContent = 'Crea tu primera app para empezar';
      }
      
      if (createFirstAppBtn && createFirstAppBtnText) {
        createFirstAppBtnText.textContent = 'Crear App';
        // Ir directamente a la página de crear app
        createFirstAppBtn.onclick = () => {
          window.location.href = '/Programar/crear-app/index.html';
        };
      }
      
      // Configurar botón Create App del header
      const createAppHeaderBtn = document.getElementById('createAppHeaderBtn');
      if (createAppHeaderBtn) {
        createAppHeaderBtn.onclick = () => {
          window.location.href = '/Programar/crear-app/index.html';
        };
      }
      
      if (userProjects && Array.isArray(userProjects) && userProjects.length > 0) {
        userProjectsGrid.innerHTML = '';
        userProjectsGrid.style.display = 'grid';
        userProjectsEmpty.style.display = 'none';
        // Remover clase cuando hay proyectos
        document.querySelector('.projects-section-premium')?.classList.remove('has-empty-state');
        
        // Normalizar proyectos de Supabase antes de renderizar
        const normalizedUserProjects = userProjects.map(p => normalizeProject(p));
        console.log('🔍 Proyectos normalizados:', normalizedUserProjects);
        
        // Cargar estadísticas para proyectos públicos
        const publicProjectTitles = normalizedUserProjects
          .filter(p => p.devcenter === 'public')
          .map(p => p.titulo || p.title)
          .filter(Boolean);
        
        const statsMap = await loadUserProjectStats(publicProjectTitles);
        
        // Agregar stats a cada proyecto
        normalizedUserProjects.forEach(p => {
          const title = p.titulo || p.title;
          if (statsMap[title]) {
            p.stats = statsMap[title];
          }
        });
        
        console.log('📊 Estadísticas cargadas para proyectos del usuario');
        
        normalizedUserProjects.forEach((p, index) => {
          const card = document.createElement('div');
          card.className = 'project-card supabase-project';
          card.style.animationDelay = (index * 0.08) + 's';
          
          const header = document.createElement('div');
          header.className = 'project-header';
          
          const icon = document.createElement('div');
          icon.className = 'project-icon';
          
          let initials = p.initials;
          if (!initials && p.title) {
            const words = p.title.trim().split(' ');
            if (words.length === 1) {
              initials = p.title.substring(0, 2).toUpperCase();
            } else {
              initials = (words[0][0] + words[1][0]).toUpperCase();
            }
          }
          icon.textContent = initials || 'PR';
          
          const titleWrapper = document.createElement('div');
          titleWrapper.className = 'project-title-wrapper';
          
          const title = document.createElement('h3');
          title.textContent = p.title || '';
          
          const meta = document.createElement('div');
          meta.className = 'project-meta';
          const statusText = p.status || 'Activo';
          const statusClass = statusText.toLowerCase().replace(/\s+/g, '-');
          meta.innerHTML = `<span>${p.date || 'Reciente'}</span><span class="meta-separator">|</span><span class="status-badge status-${statusClass}">${statusText}</span>`;
          
          titleWrapper.appendChild(title);
          titleWrapper.appendChild(meta);
          header.appendChild(icon);
          header.appendChild(titleWrapper);
          
          // Determinar estado de publicación
          const projectLink = p.url || p.link;
          const hasLink = projectLink && projectLink !== '#' && projectLink !== '';
          const isPublic = p.devcenter === 'public';
          
          // Indicador de estado de publicación
          const statusIndicator = document.createElement('div');
          statusIndicator.className = 'publication-status';
          
          const projectStats = p.stats || { views: 0, likes: 0, comments: 0 };
          statusIndicator.setAttribute('data-stats', JSON.stringify(projectStats));
          
          let statusHTML = '';
          
          // Si está en modo public -> DevCenterX (reemplaza a Publicado)
          if (isPublic) {
            statusHTML = `
              <div class="devcenter-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span>DevCenterX</span>
              </div>
              <a href="${projectLink || '#'}" target="_blank" class="go-to-app-btn" title="Ir a la app" ${!hasLink ? 'style="display:none"' : ''}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
              <button class="stats-toggle-btn" title="Ver estadísticas">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </button>
            `;
          } else if (hasLink) {
            // Solo tiene link pero no está en modo public -> Publicado
            statusHTML = `
              <div class="published-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="16 8 10 14 8 12"/>
                </svg>
                <span>Publicado</span>
              </div>
              <a href="${projectLink}" target="_blank" class="go-to-app-btn" title="Ir a la app">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            `;
          }
          
          // Si no tiene link ni es público, mostrar "Sin publicar"
          if (!hasLink && !isPublic) {
            statusHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>Sin publicar</span>
            `;
            statusIndicator.style.cssText = `
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 12px;
              color: #f59e0b;
              font-weight: 600;
              margin: 12px 0;
              padding: 6px 12px;
              background: rgba(245, 158, 11, 0.1);
              border-radius: 20px;
              width: fit-content;
            `;
          } else {
            statusIndicator.style.cssText = `
              display: flex;
              align-items: center;
              gap: 8px;
              margin: 12px 0;
              flex-wrap: wrap;
            `;
          }
          
          statusIndicator.innerHTML = statusHTML;
          
          const actions = document.createElement('div');
          actions.className = 'project-actions';
          
          // Botón Edit siempre disponible (para editar código)
          const editBtn = document.createElement('button');
          editBtn.className = 'action-btn primary-btn edit-project-btn';
          editBtn.setAttribute('data-num', p.numeroProyecto);
          editBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          `;
          actions.appendChild(editBtn);
          
          if (!hasLink) {
            // PROYECTO NO PUBLICADO: Mostrar Publish
            const publishBtn = document.createElement('button');
            publishBtn.className = 'action-btn publish-btn publish-project-btn';
            publishBtn.setAttribute('data-num', p.numeroProyecto);
            publishBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              Publish
            `;
            actions.appendChild(publishBtn);
          }
          
          // Botón de Copia de Seguridad (siempre visible)
          const backupBtn = document.createElement('button');
          backupBtn.className = 'action-btn backup-btn backup-project-btn';
          backupBtn.setAttribute('data-num', p.numeroProyecto);
          backupBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Backup
          `;
          actions.appendChild(backupBtn);
          
          card.appendChild(header);
          card.appendChild(statusIndicator);
          card.appendChild(actions);
          
          userProjectsGrid.appendChild(card);
          
          // Guardar código en localStorage si el proyecto tiene código
          if (p.code && (p.code.html || p.code.css || p.code.js)) {
            const key = `dc_project_code_${p.numeroProyecto}`;
            const codeData = {
              numeroProyecto: p.numeroProyecto,
              titulo: p.titulo,
              code: p.code,
              savedAt: new Date().toISOString()
            };
            localStorage.setItem(key, JSON.stringify(codeData));
            console.log(`💾 Código guardado en localStorage para proyecto ${p.numeroProyecto}`);
          }
        });
        
        // Agregar eventos a botones de estadísticas
        document.querySelectorAll('.stats-toggle-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.project-card');
            const actionsDiv = card.querySelector('.project-actions');
            const statusIndicator = card.querySelector('.publication-status');
            
            // Verificar si ya existe el contenedor de stats
            let statsContainer = card.querySelector('.stats-container-inline');
            
            if (statsContainer) {
              // Si existe, toggle visibilidad
              statsContainer.classList.toggle('active');
              btn.classList.toggle('active');
            } else {
              // Crear el contenedor de estadísticas
              const statsData = JSON.parse(statusIndicator.getAttribute('data-stats') || '{}');
              
              statsContainer = document.createElement('div');
              statsContainer.className = 'stats-container-inline active';
              statsContainer.innerHTML = `
                <div class="stats-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <span>${(statsData.views || 0).toLocaleString()}</span>
                </div>
                <div class="stats-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span>${(statsData.likes || 0).toLocaleString()}</span>
                </div>
                <div class="stats-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>${(statsData.comments || 0).toLocaleString()}</span>
                </div>
              `;
              
              // Insertar después del actions
              actionsDiv.insertAdjacentElement('afterend', statsContainer);
              btn.classList.add('active');
            }
          });
        });
        
        // Agregar eventos a botones de editar - llevar al editor de código
        document.querySelectorAll('.edit-project-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const num = parseInt(btn.getAttribute('data-num'));
            const project = currentSupabaseUser.proyectos.find(p => p.numeroProyecto === num);
            
            if (!project) return;
            
            // Obtener nombre del usuario actual
            let userName = 'Usuario';
            
            if (currentSupabaseUser && currentSupabaseUser.nombrepersona) {
              userName = currentSupabaseUser.nombrepersona;
            } else {
              const userStr = localStorage.getItem('currentUser');
              if (userStr) {
                try {
                  const userData = JSON.parse(userStr);
                  userName = userData.username || userData.usuario || userData.nombrepersona || userStr;
                } catch {
                  userName = userStr;
                }
              }
            }
            
            // Guardar información del proyecto en localStorage para acceder desde el editor
            const projectData = {
              id: project.numeroProyecto,
              numeroProyecto: project.numeroProyecto,
              title: project.titulo,
              titulo: project.titulo,
              descripcion: project.descripcion,
              description: project.descripcion,
              link: project.link,
              url: project.link,
              devcenter: project.devcenter,
              tags: project.tags,
              initials: project.inicialesTitulo,
              status: project.status,
              dateAdded: project.fecha,
              createdAt: project.fecha,
              owner: userName
            };
            
            // Solo agregar code si existe y tiene contenido
            if (project.code && (project.code.html || project.code.css || project.code.js)) {
              projectData.code = project.code;
            } else {
              // Si no hay código en el proyecto, intentar cargar desde localStorage
              const localCodeKey = `dc_project_code_${project.numeroProyecto}`;
              const localCodeData = localStorage.getItem(localCodeKey);
              if (localCodeData) {
                try {
                  const parsedData = JSON.parse(localCodeData);
                  if (parsedData.code && (parsedData.code.html || parsedData.code.css || parsedData.code.js)) {
                    projectData.code = parsedData.code;
                    console.log(`📦 Código cargado desde localStorage para edición del proyecto ${project.numeroProyecto}`);
                  }
                } catch (e) {
                  console.error('Error parseando código de localStorage:', e);
                }
              }
            }
            
            localStorage.setItem('currentProject', JSON.stringify(projectData));
            
            // Redirigir al editor de código
            window.location.href = '/Programar/';
          });
        });
        
        // Agregar eventos a botones de Publish - iniciar publicación directamente
        document.querySelectorAll('.publish-project-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const num = parseInt(btn.getAttribute('data-num'));
            const project = currentSupabaseUser.proyectos.find(p => p.numeroProyecto === num);
            
            if (!project) return;
            
            // Obtener nombre del usuario actual
            let userName = 'Usuario';
            if (currentSupabaseUser && currentSupabaseUser.nombrepersona) {
              userName = currentSupabaseUser.nombrepersona;
            }
            
            // Iniciar proceso de publicación directamente
            await handleDirectPublish(project, userName, btn);
          });
        });
        
        // Agregar eventos a botones de Edit .Dev - llevar a estadísticas
        document.querySelectorAll('.dev-stats-project-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const num = parseInt(btn.getAttribute('data-num'));
            const project = currentSupabaseUser.proyectos.find(p => p.numeroProyecto === num);
            
            if (!project) return;
            
            // Guardar información del proyecto en localStorage
            const projectData = {
              id: project.numeroProyecto,
              numeroProyecto: project.numeroProyecto,
              title: project.titulo,
              titulo: project.titulo,
              descripcion: project.descripcion,
              link: project.link,
              devcenter: project.devcenter,
              tags: project.tags,
              initials: project.inicialesTitulo,
              status: project.status
            };
            
            localStorage.setItem('currentProject', JSON.stringify(projectData));
            
            // Redirigir a la página de estadísticas del proyecto
            window.location.href = '/Creator/ia-code/DevCenterX/DevCenterX.html';
          });
        });
        
        // Agregar eventos a botones de Backup - abrir modal de copia de seguridad
        document.querySelectorAll('.backup-project-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const num = btn.getAttribute('data-num');
            const project = currentSupabaseUser.proyectos.find(p => p.numeroProyecto == num);
            
            if (!project) return;
            
            // Abrir modal de copia de seguridad
            await showBackupModal(project, parseInt(num));
          });
        });
        
        console.log(`✅ ${userProjects.length} proyectos del usuario mostrados en Home`);
      } else {
        userProjectsGrid.innerHTML = '';
        userProjectsGrid.style.display = 'none';
        userProjectsEmpty.style.display = 'flex';
        // Agregar clase para ocultar botón del header
        document.querySelector('.projects-section-premium')?.classList.add('has-empty-state');
      }
    }
    
    // Ocultar el grid de proyectos de JSONBin en Home
    projectsGrid.innerHTML = '';
    emptyState.style.display = 'none';
    paginationControls.style.display = 'none';
    
    if (projectsGrid) {
      projectsGrid.style.display = 'none';
    }
    
    filteredProjects = [];
  } catch (err) {
    console.error('Error cargando datos:', err);
    console.error('Stack trace:', err.stack);
    emptyState.style.display = 'none';
    filteredProjects = [];
  }

  // PANEL FAVORITOS - Obtener elementos cuando estén disponibles
  function getPanelElements() {
    return {
      panel: document.getElementById('projectPanel'),
      panelFavBtn: document.getElementById('panelFavBtn'),
      panelFavIcon: document.getElementById('panelFavIcon'),
      panelTitleText: document.getElementById('panelTitleText'),
      panelDescription: document.getElementById('panelDescription'),
      panelVisit: document.getElementById('panelVisit'),
      panelInitials: document.getElementById('panelInitials'),
      panelDate: document.getElementById('panelDate'),
      panelTags: document.getElementById('panelTags')
    };
  }
  let lastPanelProject = null;

  // Actualiza el botón de favoritos del panel
  function updatePanelFavBtn(project) {
    const elements = getPanelElements();
    if (!elements.panelFavBtn || !elements.panelFavIcon) return;
    const heartIcon = '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>';
    if (isFavorite(project)) {
      elements.panelFavIcon.setAttribute('fill', '#ef4444');
      elements.panelFavIcon.setAttribute('stroke', 'none');
      elements.panelFavIcon.innerHTML = heartIcon;
      elements.panelFavBtn.title = 'Quitar de Favoritos';
    } else {
      elements.panelFavIcon.setAttribute('fill', 'none');
      elements.panelFavIcon.setAttribute('stroke', '#facc15');
      elements.panelFavIcon.setAttribute('stroke-width', '2');
      elements.panelFavIcon.innerHTML = heartIcon;
      elements.panelFavBtn.title = 'Añadir a Favoritos';
    }
  }

  // Modifica showProjectPanel para manejar favoritos y reseñas
  function showProjectPanel(project) {
    lastPanelProject = project;
    
    // Acceder a los elementos directamente cada vez con pequeño delay
    setTimeout(() => {
      const panel = document.getElementById('projectPanel');
      const panelTitleText = document.getElementById('panelTitleText');
      const panelDescription = document.getElementById('panelDescription');
      const panelVisit = document.getElementById('panelVisit');
      const panelInitials = document.getElementById('panelInitials');
      const panelDate = document.getElementById('panelDate');
      const panelTags = document.getElementById('panelTags');
      
      if (panelTitleText) {
        panelTitleText.textContent = project.title || 'Proyecto';
      }
      
      if (panelDescription) {
        panelDescription.textContent = project.description || '';
      }
      
      if (panelVisit) {
        panelVisit.href = project.url || '#';
        panelVisit.setAttribute('target', '_blank');
        panelVisit.onclick = async function() {
          await incrementarVistasEnSupabase(project.title);
        };
      }
      
      if (panelInitials) {
        panelInitials.textContent = (project.initials || (project.title || '').slice(0, 2)).toUpperCase();
      }
      
      if (panelDate) {
        // Intentar usar created_at, luego dateAdded, luego date
        const dateToShow = project.created_at || project.dateAdded || project.date;
        if (dateToShow) {
          const fecha = new Date(dateToShow);
          const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
          panelDate.textContent = 'Creado el ' + fecha.toLocaleDateString('es-ES', opciones);
        } else {
          panelDate.textContent = '—';
        }
      }

      // tags
      if (panelTags) {
        panelTags.innerHTML = '';
        const tags = Array.isArray(project.tags) ? project.tags : (project.tags ? String(project.tags).split(',').map(t => t.trim()).filter(Boolean) : []);
        if (tags.length) {
          tags.forEach(t => {
            const el = document.createElement('span');
            el.className = 'tag-chip';
            el.textContent = t;
            panelTags.appendChild(el);
          });
        } else {
          const el = document.createElement('span');
          el.className = 'tag-chip';
          el.textContent = 'Sin tags';
          panelTags.appendChild(el);
        }
      }

      const panelEditBtn = document.getElementById('panelEditBtn');
      if (panelEditBtn) {
        const currentUserStr = localStorage.getItem('currentUser');
        
        if (currentUserStr && project.owner) {
          let currentUsername = currentUserStr;
          
          try {
            const userObj = JSON.parse(currentUserStr);
            currentUsername = userObj.username || userObj.usuario || currentUserStr;
          } catch (e) {
            currentUsername = currentUserStr;
          }
          
          const isOwner = currentUsername.toLowerCase() === project.owner.toLowerCase();
          
          console.log('[Panel Edit] Usuario actual:', currentUsername);
          console.log('[Panel Edit] Owner del proyecto:', project.owner);
          console.log('[Panel Edit] ¿Es owner?:', isOwner);
          
          if (isOwner) {
            panelEditBtn.style.display = 'block';
            panelEditBtn.onclick = function() {
              window.location.href = 'Creator/app/my-projects.html';
            };
          } else {
            panelEditBtn.style.display = 'none';
          }
        } else {
          panelEditBtn.style.display = 'none';
        }
      }

      if (panel) {
        panel.style.display = 'flex';
        panel.classList.remove('hide');
        panel.classList.add('show');
        panel.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }

      updatePanelFavBtn(project);

      // Agregar reseñas al panel
      if (typeof window.addReviewsToPanel === 'function') {
        setTimeout(() => {
          window.addReviewsToPanel(project.title);
        }, 100);
      }

      setTimeout(() => {
        if (panelVisit) {
          panelVisit.focus();
        }
      }, 160);
    }, 50);
  }

  // Función para cerrar el panel
  function hideProjectPanel() {
    const elements = getPanelElements();
    if (!elements.panel) return;
    elements.panel.classList.remove('show');
    elements.panel.classList.add('hide');
    elements.panel.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    
    // Después de la animación, ocultar completamente
    setTimeout(() => {
      if (elements.panel) {
        elements.panel.style.display = 'none';
        elements.panel.classList.remove('hide');
      }
    }, 200);
  }

  // Configurar eventos del panel
  const elements = getPanelElements();
  
  // Botón favoritos del panel
  if (elements.panelFavBtn) {
    elements.panelFavBtn.onclick = async function () {
      if (!lastPanelProject) return;
      
      // Verificar estado ANTES de hacer el toggle
      const eraFavorito = isFavorite(lastPanelProject);
      
      toggleFavorite(lastPanelProject);
      updatePanelFavBtn(lastPanelProject);
      renderProjects(filteredProjects);
      
      // Incrementar o decrementar en Supabase según corresponda
      if (!eraFavorito) {
        await incrementarMegustasEnSupabase(lastPanelProject.title);
      } else {
        await decrementarMegustasEnSupabase(lastPanelProject.title);
      }
    };
  }

  // Botón cerrar panel
  const panelClose = document.getElementById('panelClose');
  if (panelClose) {
    panelClose.onclick = hideProjectPanel;
  }

  // Cerrar panel con tecla Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && elements.panel && elements.panel.classList.contains('show')) {
      hideProjectPanel();
    }
  });

  // Cerrar panel al hacer clic fuera del contenido
  if (elements.panel) {
    elements.panel.addEventListener('click', function(e) {
      if (e.target === elements.panel) {
        hideProjectPanel();
      }
    });
  }

  // Inicializa favoritos al cargar
  renderFavoritesSection();

  // Limpia cache de favoritos al cambiar de pestaña
  window.addEventListener('storage', (e) => {
    if (e.key === 'dc_favorites') favoritesCache = null;
  });

  // Exponer funciones globalmente para reviews-handler.js (DENTRO del IIFE pero accesibles)
  window.loadReviews = loadReviews;
  window.getProjectReviews = getProjectReviews;
  window.calculateAverageRating = calculateAverageRating;
  window.generateStarsHTML = generateStarsHTML;
  window.getAllReviews = function() {
    return allReviews;
  };

  // ==================== SISTEMA DE COPIAS DE SEGURIDAD ====================
  
  // Obtener plan del usuario (0 = gratis, 1+ = premium/plus)
  function getUserPlan() {
    if (!currentSupabaseUser) return 0;
    return currentSupabaseUser.status || 0;
  }
  
  // Obtener límite de copias según plan
  function getBackupLimit() {
    const plan = getUserPlan();
    if (plan >= 2) return 20; // Ultimate = 20 copias
    if (plan >= 1) return 10; // Plus = 10 copias
    return 2; // Normal/Gratis = 2 copias
  }
  
  // Guardar código del proyecto en localStorage
  function saveProjectCodeToLocalStorage(project) {
    try {
      const key = `dc_project_code_${project.numeroProyecto}`;
      const codeData = {
        numeroProyecto: project.numeroProyecto,
        titulo: project.titulo,
        code: project.code || { html: '', css: '', js: '' },
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(codeData));
      console.log(`✅ Código guardado en localStorage para proyecto ${project.numeroProyecto}`);
      return true;
    } catch (error) {
      console.error('Error guardando código en localStorage:', error);
      return false;
    }
  }
  
  // Obtener código del proyecto desde localStorage
  function getProjectCodeFromLocalStorage(numeroProyecto) {
    try {
      const key = `dc_project_code_${numeroProyecto}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error obteniendo código de localStorage:', error);
      return null;
    }
  }
  
  // Obtener copias de seguridad existentes del usuario
  async function getExistingBackups() {
    if (!currentSupabaseUser || !currentSupabaseUser.nombrepersona) return [];
    
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('publish_1, publish_2, publish_3, publish_4, publish_5, publish_6, publish_7, publish_8, publish_9, publish_10, publish_11, publish_12, publish_13, publish_14, publish_15, publish_16, publish_17, publish_18, publish_19, publish_20')
        .eq('nombrepersona', currentSupabaseUser.nombrepersona)
        .single();
      
      if (error) throw error;
      
      const backups = [];
      for (let i = 1; i <= 20; i++) {
        const backupData = data[`publish_${i}`];
        if (backupData && backupData.titulo) {
          backups.push({
            slot: i,
            ...backupData
          });
        }
      }
      
      return backups;
    } catch (error) {
      console.error('Error obteniendo copias de seguridad:', error);
      return [];
    }
  }
  
  // Verificar si un slot está disponible
  async function isSlotAvailable(slot) {
    if (!currentSupabaseUser || !currentSupabaseUser.nombrepersona) return false;
    
    try {
      const { data, error } = await supabase
        .from('personas')
        .select(`publish_${slot}`)
        .eq('nombrepersona', currentSupabaseUser.nombrepersona)
        .single();
      
      if (error) throw error;
      
      const backupData = data[`publish_${slot}`];
      return !backupData || !backupData.titulo;
    } catch (error) {
      console.error('Error verificando slot:', error);
      return false;
    }
  }
  
  // Guardar copia de seguridad en un slot
  async function saveBackupToSlot(project, slot) {
    if (!currentSupabaseUser || !currentSupabaseUser.nombrepersona) {
      showBackupError('Debes iniciar sesión para crear copias de seguridad');
      return false;
    }
    
    const limit = getBackupLimit();
    if (slot > limit) {
      const upgradeMessage = limit === 2 ? 'Actualiza a Plus para tener hasta 10.' : 'Actualiza a Ultimate para tener hasta 20.';
      showBackupError(`Tu plan solo permite ${limit} copias de seguridad. ${upgradeMessage}`);
      return false;
    }
    
    // Verificar si el proyecto ya tiene una copia de seguridad (solo 1 por app)
    const existingBackups = await getExistingBackups();
    const projectBackups = existingBackups.filter(b => b.numeroProyecto === project.numeroProyecto);
    if (projectBackups.length > 0) {
      showBackupError(`Este proyecto ya tiene una copia de seguridad en el Slot ${projectBackups[0].slot}. Solo puedes tener 1 backup por aplicación.`);
      return false;
    }
    
    try {
      // Primero guardar en localStorage
      saveProjectCodeToLocalStorage(project);
      
      // Preparar datos de la copia
      const backupData = {
        titulo: project.titulo,
        numeroProyecto: project.numeroProyecto,
        code: project.code || { html: '', css: '', js: '' },
        descripcion: project.descripcion || '',
        fecha: new Date().toISOString(),
        tags: project.tags || []
      };
      
      // Actualizar en Supabase
      const updateData = {};
      updateData[`publish_${slot}`] = backupData;
      
      const { error } = await supabase
        .from('personas')
        .update(updateData)
        .eq('nombrepersona', currentSupabaseUser.nombrepersona);
      
      if (error) throw error;
      
      // Actualizar el proyecto en JSONB: limpiar code y agregar campo Backup
      const { data: personaData, error: fetchError } = await supabase
        .from('personas')
        .select('proyectos')
        .eq('nombrepersona', currentSupabaseUser.nombrepersona)
        .single();
      
      if (!fetchError && personaData && personaData.proyectos) {
        const proyectos = personaData.proyectos;
        const proyectoIndex = proyectos.findIndex(p => p.numeroProyecto === project.numeroProyecto);
        
        if (proyectoIndex !== -1) {
          // Eliminar código y agregar campo Backup
          delete proyectos[proyectoIndex].code;
          proyectos[proyectoIndex].Backup = `publish_${slot}`;
          
          // Eliminar campo code de TODOS los proyectos antes de guardar
          const proyectosParaGuardar = proyectos.map(p => {
            const { code, ...proyectoSinCode } = p;
            return proyectoSinCode;
          });
          
          await supabase
            .from('personas')
            .update({ proyectos: proyectosParaGuardar })
            .eq('nombrepersona', currentSupabaseUser.nombrepersona);
          
          console.log(`✅ Proyecto actualizado: código eliminado y Backup = publish_${slot}`);
        }
      }
      
      console.log(`✅ Copia de seguridad guardada en slot ${slot}`);
      return true;
    } catch (error) {
      console.error('Error guardando copia de seguridad:', error);
      showBackupError('Error al guardar la copia de seguridad: ' + error.message);
      return false;
    }
  }
  
  // Eliminar copia de seguridad de un slot
  async function deleteBackupFromSlot(slot) {
    if (!currentSupabaseUser || !currentSupabaseUser.nombrepersona) return false;
    
    try {
      // Primero obtener el backup para saber qué proyecto afecta
      const { data: personaData, error: fetchError } = await supabase
        .from('personas')
        .select(`publish_${slot}, proyectos`)
        .eq('nombrepersona', currentSupabaseUser.nombrepersona)
        .single();
      
      if (fetchError) throw fetchError;
      
      const backupData = personaData[`publish_${slot}`];
      const numeroProyecto = backupData ? backupData.numeroProyecto : null;
      
      // Eliminar el backup del slot
      const updateData = {};
      updateData[`publish_${slot}`] = null;
      
      const { error } = await supabase
        .from('personas')
        .update(updateData)
        .eq('nombrepersona', currentSupabaseUser.nombrepersona);
      
      if (error) throw error;
      
      // Limpiar el campo Backup del proyecto JSONB y restaurar el código
      if (numeroProyecto && personaData.proyectos) {
        const proyectos = personaData.proyectos;
        const proyectoIndex = proyectos.findIndex(p => p.numeroProyecto === numeroProyecto);
        
        if (proyectoIndex !== -1 && proyectos[proyectoIndex].Backup === `publish_${slot}`) {
          delete proyectos[proyectoIndex].Backup;
          
          // NO restaurar código al proyecto JSONB - código solo va en localStorage
          // El código del backup se guarda en localStorage para que Programar lo cargue
          if (backupData && backupData.code) {
            const codeKey = `dc_project_code_${numeroProyecto}`;
            localStorage.setItem(codeKey, JSON.stringify({
              numeroProyecto: numeroProyecto,
              titulo: backupData.titulo,
              code: backupData.code,
              savedAt: new Date().toISOString()
            }));
            console.log(`✅ Código restaurado del backup a localStorage (${codeKey})`);
          }
          
          // Eliminar campo code de TODOS los proyectos antes de guardar
          const proyectosParaGuardar = proyectos.map(p => {
            const { code, ...proyectoSinCode } = p;
            return proyectoSinCode;
          });
          
          await supabase
            .from('personas')
            .update({ proyectos: proyectosParaGuardar })
            .eq('nombrepersona', currentSupabaseUser.nombrepersona);
          
          console.log(`✅ Campo Backup eliminado del proyecto ${numeroProyecto}`);
        }
      }
      
      console.log(`✅ Copia de seguridad eliminada del slot ${slot}`);
      return true;
    } catch (error) {
      console.error('Error eliminando copia de seguridad:', error);
      return false;
    }
  }
  
  // Mostrar modal de copia de seguridad
  async function showBackupModal(project, numeroProyecto) {
    const existingBackups = await getExistingBackups();
    const limit = getBackupLimit();
    const plan = getUserPlan();
    const planName = plan >= 2 ? 'Ultimate' : (plan >= 1 ? 'Plus' : 'Normal');
    
    // Verificar si el proyecto tiene código (primero en el objeto, luego en localStorage)
    let hasCode = project.code && (project.code.html || project.code.css || project.code.js);
    
    // Si no tiene código en el objeto, intentar cargar desde localStorage
    if (!hasCode) {
      const localCodeData = getProjectCodeFromLocalStorage(numeroProyecto);
      if (localCodeData && localCodeData.code && (localCodeData.code.html || localCodeData.code.css || localCodeData.code.js)) {
        project.code = localCodeData.code;
        hasCode = true;
        console.log(`📦 Código cargado desde localStorage para proyecto ${numeroProyecto}`);
      }
    }
    
    // Encontrar slots usados y disponibles
    const usedSlots = existingBackups.map(b => b.slot);
    const projectBackups = existingBackups.filter(b => b.numeroProyecto === numeroProyecto);
    
    // Verificar si este proyecto ya tiene una copia de seguridad (solo 1 por app)
    const projectAlreadyHasBackup = projectBackups.length > 0;
    const existingBackupSlot = projectAlreadyHasBackup ? projectBackups[0].slot : null;
    
    let slotsHTML = '';
    for (let i = 1; i <= limit; i++) {
      const backup = existingBackups.find(b => b.slot === i);
      const isUsed = !!backup;
      const isThisProject = backup && backup.numeroProyecto === numeroProyecto;
      
      let slotClass = isUsed ? (isThisProject ? 'slot-this-project' : 'slot-occupied') : 'slot-available';
      let slotInfo = isUsed ? `${backup.titulo} (${new Date(backup.fecha).toLocaleDateString('es-ES')})` : 'Disponible';
      
      // Si el proyecto ya tiene backup, no mostrar botón de guardar en otros slots
      const canSaveHere = !isUsed && hasCode && !projectAlreadyHasBackup;
      
      slotsHTML += `
        <div class="backup-slot ${slotClass}" data-slot="${i}" data-used="${isUsed}" data-this-project="${isThisProject}">
          <div class="slot-number">Slot ${i}</div>
          <div class="slot-info">${slotInfo}</div>
          <div class="slot-actions">
            ${canSaveHere ? `<button class="slot-save-btn" data-slot="${i}">Guardar aquí</button>` : ''}
            ${isUsed ? `<button class="slot-delete-btn" data-slot="${i}">Eliminar</button>` : ''}
            ${isThisProject ? `<span class="this-project-badge">Este proyecto</span>` : ''}
          </div>
        </div>
      `;
    }
    
    // Mostrar slots bloqueados según el plan
    if (plan === 0) {
      // Plan Normal: mostrar slots 3-10 como Plus y 11-20 como Ultimate
      for (let i = 3; i <= 10; i++) {
        slotsHTML += `
          <div class="backup-slot slot-locked" data-slot="${i}">
            <div class="slot-number">Slot ${i}</div>
            <div class="slot-info">🔒 Requiere Plan Plus</div>
          </div>
        `;
      }
      for (let i = 11; i <= 20; i++) {
        slotsHTML += `
          <div class="backup-slot slot-locked" data-slot="${i}">
            <div class="slot-number">Slot ${i}</div>
            <div class="slot-info">🔒 Requiere Plan Ultimate</div>
          </div>
        `;
      }
    } else if (plan === 1) {
      // Plan Plus: mostrar slots 11-20 como Ultimate
      for (let i = 11; i <= 20; i++) {
        slotsHTML += `
          <div class="backup-slot slot-locked" data-slot="${i}">
            <div class="slot-number">Slot ${i}</div>
            <div class="slot-info">🔒 Requiere Plan Ultimate</div>
          </div>
        `;
      }
    }
    
    const modalHTML = `
      <div id="backupModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(14, 21, 37, 0.95); backdrop-filter: blur(8px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'IBM Plex Sans', sans-serif;">
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto; padding: 24px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #f1f5f9; font-size: 20px; font-weight: 600; margin: 0;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Copias de Seguridad
            </h2>
            <button id="closeBackupModal" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 24px; line-height: 1;">&times;</button>
          </div>
          
          <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="color: #a5b4fc; font-size: 13px;">Proyecto:</span>
                <span style="color: #f1f5f9; font-weight: 600; margin-left: 8px;">${project.titulo}</span>
              </div>
              <div style="background: ${plan >= 1 ? 'linear-gradient(135deg, #6366f1, #a855f7)' : '#475569'}; padding: 4px 12px; border-radius: 20px; font-size: 11px; color: white; font-weight: 600;">
                Plan ${planName} - ${limit} slots
              </div>
            </div>
          </div>
          
          ${!hasCode ? `
            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" style="margin-bottom: 8px;">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p style="color: #fbbf24; font-size: 13px; margin: 0;">Este proyecto no tiene código todavía. Edítalo primero para crear copias de seguridad.</p>
            </div>
          ` : ''}
          
          ${projectAlreadyHasBackup && hasCode ? `
            <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="margin-bottom: 8px;">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <p style="color: #4ade80; font-size: 13px; margin: 0;">Este proyecto ya tiene una copia de seguridad en el Slot ${existingBackupSlot}. Solo puedes tener 1 backup por aplicación.</p>
            </div>
          ` : ''}
          
          <div id="backupSlots" style="display: flex; flex-direction: column; gap: 10px;">
            ${slotsHTML}
          </div>
          
          <style>
            .backup-slot {
              display: flex;
              align-items: center;
              padding: 12px 16px;
              border-radius: 8px;
              gap: 12px;
            }
            .slot-available {
              background: rgba(34, 197, 94, 0.1);
              border: 1px solid rgba(34, 197, 94, 0.3);
            }
            .slot-occupied {
              background: rgba(99, 102, 241, 0.1);
              border: 1px solid rgba(99, 102, 241, 0.3);
            }
            .slot-this-project {
              background: rgba(34, 197, 94, 0.2);
              border: 1px solid rgba(34, 197, 94, 0.5);
            }
            .slot-locked {
              background: rgba(71, 85, 105, 0.3);
              border: 1px dashed #475569;
              opacity: 0.7;
            }
            .slot-number {
              color: #f1f5f9;
              font-weight: 600;
              font-size: 14px;
              min-width: 60px;
            }
            .slot-info {
              flex: 1;
              color: #94a3b8;
              font-size: 12px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .slot-actions {
              display: flex;
              gap: 8px;
              align-items: center;
            }
            .slot-save-btn {
              background: linear-gradient(135deg, #22c55e, #16a34a);
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              cursor: pointer;
            }
            .slot-delete-btn {
              background: rgba(239, 68, 68, 0.2);
              color: #ef4444;
              border: 1px solid rgba(239, 68, 68, 0.3);
              padding: 6px 12px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              cursor: pointer;
            }
            .this-project-badge {
              background: rgba(34, 197, 94, 0.3);
              color: #4ade80;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 600;
            }
          </style>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Eventos
    document.getElementById('closeBackupModal').onclick = () => {
      document.getElementById('backupModal').remove();
    };
    
    // Guardar en slot
    document.querySelectorAll('.slot-save-btn').forEach(btn => {
      btn.onclick = async () => {
        const slot = parseInt(btn.getAttribute('data-slot'));
        btn.disabled = true;
        btn.textContent = 'Guardando...';
        
        const success = await saveBackupToSlot(project, slot);
        
        if (success) {
          document.getElementById('backupModal').remove();
          showBackupSuccess(`Copia de seguridad guardada en Slot ${slot}`);
        } else {
          btn.disabled = false;
          btn.textContent = 'Guardar aquí';
        }
      };
    });
    
    // Eliminar de slot
    document.querySelectorAll('.slot-delete-btn').forEach(btn => {
      btn.onclick = async () => {
        const slot = parseInt(btn.getAttribute('data-slot'));
        
        if (!confirm(`¿Seguro que quieres eliminar la copia de seguridad del Slot ${slot}?`)) return;
        
        btn.disabled = true;
        btn.textContent = 'Eliminando...';
        
        const success = await deleteBackupFromSlot(slot);
        
        if (success) {
          document.getElementById('backupModal').remove();
          showBackupSuccess(`Copia de seguridad eliminada del Slot ${slot}`);
          // Recargar modal
          await showBackupModal(project, numeroProyecto);
        } else {
          btn.disabled = false;
          btn.textContent = 'Eliminar';
          showBackupError('Error al eliminar la copia de seguridad');
        }
      };
    });
  }
  
  // Mostrar éxito de backup
  function showBackupSuccess(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      z-index: 10001;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
    `;
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 8px;">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      ${message}
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  // Mostrar error de backup
  function showBackupError(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      z-index: 10001;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
    `;
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 8px;">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
      ${message}
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ==================== PUBLICACIÓN DIRECTA DESDE HOME ====================
  
  // Configuración de GitHub
  const GITHUB_TOKEN = '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';
  const GITHUB_API_URL = 'https://api.github.com';
  
  // Función para publicar directamente desde Home
  async function handleDirectPublish(project, userName, buttonElement) {
    try {
      // Verificar que el proyecto tenga código
      if (!project.code || (!project.code.html && !project.code.css && !project.code.js)) {
        showHomePublishError('Este proyecto no tiene código para publicar. Edita el proyecto primero.');
        return;
      }
      
      const htmlCode = project.code.html || '';
      const cssCode = project.code.css || '';
      const jsCode = project.code.js || '';
      
      // Mostrar modal de publicación
      showHomePublishingModal();
      
      // Verificar token de GitHub
      if (!GITHUB_TOKEN) {
        hideHomePublishingModal();
        showHomePublishError('Error de configuración. Por favor contacta al soporte.');
        return;
      }
      
      // Obtener usuario de GitHub
      updateHomePublishStatus('Conectando con GitHub...');
      const userResponse = await fetch(`${GITHUB_API_URL}/user`, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!userResponse.ok) {
        throw new Error('Error de autenticación con GitHub');
      }
      
      const userData = await userResponse.json();
      const githubUsername = userData.login;
      
      // Crear nombre del repositorio
      const projectName = project.titulo || project.title || 'mi-proyecto';
      const repoName = `${userName}-${projectName}`.toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Crear repositorio
      updateHomePublishStatus('Creando repositorio...');
      const createRepoResponse = await fetch(`${GITHUB_API_URL}/user/repos`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: repoName,
          description: `Proyecto web: ${projectName}`,
          private: false,
          auto_init: true
        })
      });
      
      if (!createRepoResponse.ok) {
        const errorData = await createRepoResponse.json();
        if (errorData.errors && errorData.errors[0]?.message.includes('already exists')) {
          hideHomePublishingModal();
          showHomeRepublishModal(githubUsername, repoName, project, userName);
          return;
        }
        throw new Error(`Error creando repositorio: ${errorData.message || 'Error desconocido'}`);
      }
      
      // Esperar que el repo esté listo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Subir archivos
      updateHomePublishStatus('Subiendo archivos...');
      await uploadFileToGitHubHome(githubUsername, repoName, 'index.html', htmlCode);
      await new Promise(resolve => setTimeout(resolve, 500));
      await uploadFileToGitHubHome(githubUsername, repoName, 'style.css', cssCode);
      await new Promise(resolve => setTimeout(resolve, 500));
      await uploadFileToGitHubHome(githubUsername, repoName, 'script.js', jsCode);
      
      // Habilitar GitHub Pages
      updateHomePublishStatus('Configurando hosting...');
      try {
        await fetch(`${GITHUB_API_URL}/repos/${githubUsername}/${repoName}/pages`, {
          method: 'POST',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            source: { branch: 'main', path: '/' }
          })
        });
      } catch (e) {
        console.log('GitHub Pages puede requerir activación manual');
      }
      
      const pagesUrl = `https://${githubUsername}.github.io/${repoName}/`;
      
      // Actualizar el proyecto en Supabase con el nuevo link
      await updateProjectLinkInSupabase(project.numeroProyecto, pagesUrl);
      
      // Mostrar éxito y actualizar UI
      hideHomePublishingModal();
      showHomePublishSuccess(pagesUrl);
      
      // Actualizar la tarjeta del proyecto
      await refreshUserProjects();
      
    } catch (error) {
      console.error('Error publicando:', error);
      hideHomePublishingModal();
      showHomePublishError(error.message);
    }
  }
  
  // Subir archivo a GitHub
  async function uploadFileToGitHubHome(username, repoName, filename, content) {
    const encodedContent = btoa(unescape(encodeURIComponent(content)));
    
    const response = await fetch(`${GITHUB_API_URL}/repos/${username}/${repoName}/contents/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
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
      throw new Error(`Error subiendo archivos: ${errorData.message || 'Error desconocido'}`);
    }
    
    return await response.json();
  }
  
  // Actualizar link del proyecto en Supabase
  async function updateProjectLinkInSupabase(numeroProyecto, newLink) {
    if (!currentSupabaseUser || !currentSupabaseUser.nombrepersona) return;
    
    try {
      // Obtener proyectos actuales
      const { data: persona, error: fetchError } = await supabase
        .from('personas')
        .select('proyectos')
        .eq('nombrepersona', currentSupabaseUser.nombrepersona)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Actualizar el proyecto específico
      const proyectos = persona.proyectos || [];
      const proyectoIndex = proyectos.findIndex(p => p.numeroProyecto === numeroProyecto);
      
      if (proyectoIndex !== -1) {
        proyectos[proyectoIndex].link = newLink;
        
        // SIEMPRE eliminar código antes de guardar - código solo va en backup slots
        const proyectosParaGuardar = proyectos.map(p => {
          const { code, ...proyectoSinCode } = p;
          return proyectoSinCode;
        });
        
        // Guardar cambios
        const { error: updateError } = await supabase
          .from('personas')
          .update({ proyectos: proyectosParaGuardar })
          .eq('nombrepersona', currentSupabaseUser.nombrepersona);
        
        if (updateError) throw updateError;
        
        // Actualizar usuario local
        currentSupabaseUser.proyectos = proyectos;
        console.log('✅ Link del proyecto actualizado en Supabase');
      }
    } catch (error) {
      console.error('Error actualizando link en Supabase:', error);
    }
  }
  
  // Refrescar proyectos del usuario
  async function refreshUserProjects() {
    if (!currentSupabaseUser || !currentSupabaseUser.nombrepersona) return;
    
    try {
      const { data: persona } = await supabase
        .from('personas')
        .select('*')
        .eq('nombrepersona', currentSupabaseUser.nombrepersona)
        .single();
      
      if (persona) {
        currentSupabaseUser = persona;
        // Re-renderizar sección de proyectos del usuario
        const userProjectsGrid = document.getElementById('userProjectsGrid');
        if (userProjectsGrid && persona.proyectos) {
          // Recargar la página para actualizar
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error refrescando proyectos:', error);
    }
  }
  
  // Mostrar modal de publicación
  function showHomePublishingModal() {
    const modalHTML = `
      <div id="homePublishingModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(14, 21, 37, 0.95); backdrop-filter: blur(8px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'IBM Plex Sans', sans-serif;">
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; max-width: 480px; width: 100%; padding: 32px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); text-align: center;">
          <div style="width: 48px; height: 48px; margin: 0 auto 20px; border: 3px solid #334155; border-top-color: #6366f1; border-radius: 50%; animation: homeSpin 1s linear infinite;"></div>
          <h2 style="color: #f1f5f9; font-size: 20px; font-weight: 600; margin-bottom: 12px;">Publicando en GitHub</h2>
          <div id="homePublishStatus" style="color: #94a3b8; font-size: 13px; margin-bottom: 24px; min-height: 36px; line-height: 1.5;">Preparando publicación...</div>
          <div style="width: 100%; height: 3px; background: #334155; border-radius: 2px; overflow: hidden;">
            <div id="homePublishProgress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #6366f1, #a855f7); transition: width 0.4s ease; animation: homeShimmer 1.5s infinite;"></div>
          </div>
        </div>
      </div>
      <style>
        @keyframes homeShimmer { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
        @keyframes homeSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
  
  // Actualizar estado de publicación
  function updateHomePublishStatus(message) {
    const statusEl = document.getElementById('homePublishStatus');
    const progressEl = document.getElementById('homePublishProgress');
    if (statusEl) statusEl.textContent = message;
    if (progressEl) {
      const currentWidth = parseInt(progressEl.style.width) || 0;
      progressEl.style.width = Math.min(currentWidth + 25, 90) + '%';
    }
  }
  
  // Ocultar modal de publicación
  function hideHomePublishingModal() {
    const modal = document.getElementById('homePublishingModal');
    if (modal) modal.remove();
  }
  
  // Mostrar éxito
  function showHomePublishSuccess(pagesUrl) {
    const modalHTML = `
      <div id="homeSuccessModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(14, 21, 37, 0.95); backdrop-filter: blur(8px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'IBM Plex Sans', sans-serif;">
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; max-width: 480px; width: 100%; padding: 32px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); text-align: center;">
          <div style="width: 56px; height: 56px; margin: 0 auto 20px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style="color: #f1f5f9; font-size: 20px; font-weight: 600; margin-bottom: 8px;">¡Publicado con éxito!</h2>
          <p style="color: #94a3b8; font-size: 13px; margin-bottom: 24px;">Tu proyecto está ahora en línea</p>
          <a href="${pagesUrl}" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-bottom: 16px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Ver mi app
          </a>
          <br>
          <button onclick="document.getElementById('homeSuccessModal').remove();" style="padding: 10px 20px; background: transparent; border: 1px solid #475569; color: #94a3b8; border-radius: 6px; font-size: 13px; cursor: pointer;">Cerrar</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
  
  // Mostrar error
  function showHomePublishError(message) {
    const modalHTML = `
      <div id="homeErrorModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(14, 21, 37, 0.95); backdrop-filter: blur(8px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'IBM Plex Sans', sans-serif;">
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; max-width: 480px; width: 100%; padding: 32px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); text-align: center;">
          <div style="width: 56px; height: 56px; margin: 0 auto 20px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
          <h2 style="color: #f1f5f9; font-size: 20px; font-weight: 600; margin-bottom: 8px;">Error al publicar</h2>
          <p style="color: #94a3b8; font-size: 13px; margin-bottom: 24px;">${message}</p>
          <button onclick="document.getElementById('homeErrorModal').remove();" style="padding: 10px 20px; background: #475569; border: none; color: white; border-radius: 6px; font-size: 13px; cursor: pointer;">Cerrar</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
  
  // Modal de republicar (cuando ya existe el repo)
  function showHomeRepublishModal(githubUsername, repoName, project, userName) {
    const pagesUrl = `https://${githubUsername}.github.io/${repoName}/`;
    const modalHTML = `
      <div id="homeRepublishModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(14, 21, 37, 0.95); backdrop-filter: blur(8px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'IBM Plex Sans', sans-serif;">
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; max-width: 480px; width: 100%; padding: 32px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); text-align: center;">
          <div style="width: 56px; height: 56px; margin: 0 auto 20px; background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h2 style="color: #f1f5f9; font-size: 20px; font-weight: 600; margin-bottom: 8px;">Proyecto ya publicado</h2>
          <p style="color: #94a3b8; font-size: 13px; margin-bottom: 16px;">Este proyecto ya tiene un repositorio. ¿Deseas republicarlo?</p>
          <p style="color: #64748b; font-size: 11px; margin-bottom: 24px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 6px;">Al republicar, el repositorio existente se eliminará y se creará uno nuevo con tu código actualizado.</p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="cancelRepublish" style="padding: 10px 20px; background: transparent; border: 1px solid #475569; color: #94a3b8; border-radius: 6px; font-size: 13px; cursor: pointer;">Cancelar</button>
            <button id="confirmRepublish" style="padding: 10px 20px; background: linear-gradient(135deg, #6366f1, #a855f7); border: none; color: white; border-radius: 6px; font-size: 13px; cursor: pointer; font-weight: 600;">Republicar</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('cancelRepublish').onclick = () => {
      document.getElementById('homeRepublishModal').remove();
    };
    
    document.getElementById('confirmRepublish').onclick = async () => {
      document.getElementById('homeRepublishModal').remove();
      await handleHomeRepublish(githubUsername, repoName, project, userName);
    };
  }
  
  // Manejar republicación
  async function handleHomeRepublish(githubUsername, repoName, project, userName) {
    try {
      showHomePublishingModal();
      
      const htmlCode = project.code.html || '';
      const cssCode = project.code.css || '';
      const jsCode = project.code.js || '';
      
      // Eliminar repositorio existente
      updateHomePublishStatus('Eliminando versión anterior...');
      await fetch(`${GITHUB_API_URL}/repos/${githubUsername}/${repoName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Crear nuevo repositorio
      updateHomePublishStatus('Creando nuevo repositorio...');
      await fetch(`${GITHUB_API_URL}/user/repos`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: repoName,
          description: `Proyecto web: ${project.titulo || project.title}`,
          private: false,
          auto_init: true
        })
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Subir archivos
      updateHomePublishStatus('Subiendo archivos...');
      await uploadFileToGitHubHome(githubUsername, repoName, 'index.html', htmlCode);
      await new Promise(resolve => setTimeout(resolve, 500));
      await uploadFileToGitHubHome(githubUsername, repoName, 'style.css', cssCode);
      await new Promise(resolve => setTimeout(resolve, 500));
      await uploadFileToGitHubHome(githubUsername, repoName, 'script.js', jsCode);
      
      // Habilitar GitHub Pages
      updateHomePublishStatus('Configurando hosting...');
      try {
        await fetch(`${GITHUB_API_URL}/repos/${githubUsername}/${repoName}/pages`, {
          method: 'POST',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            source: { branch: 'main', path: '/' }
          })
        });
      } catch (e) {
        console.log('GitHub Pages puede requerir activación manual');
      }
      
      const pagesUrl = `https://${githubUsername}.github.io/${repoName}/`;
      
      // Actualizar en Supabase
      await updateProjectLinkInSupabase(project.numeroProyecto, pagesUrl);
      
      hideHomePublishingModal();
      showHomePublishSuccess(pagesUrl);
      
      // Refrescar proyectos
      await refreshUserProjects();
      
    } catch (error) {
      console.error('Error republicando:', error);
      hideHomePublishingModal();
      showHomePublishError(error.message);
    }
  }

  // ==================== SECCIÓN APPS - MOSTRAR TODOS LOS PROYECTOS ====================
  
  // Función para verificar y crear registros en proyectos_publicos
  async function verificarYCrearRegistrosProyectos(proyectos) {
    if (!proyectos || proyectos.length === 0) return;
    
    console.log(`[Supabase] Verificando ${proyectos.length} proyectos en paralelo...`);
    
    // Obtener todos los nombres de proyectos válidos y DEDUPLICAR
    const nombresProyectos = [...new Set(
      proyectos
        .map(p => p.titulo || p.title)
        .filter(nombre => nombre)
    )];
    
    if (nombresProyectos.length === 0) return;
    
    try {
      // Obtener todos los proyectos existentes en una sola consulta
      const { data: existentes, error: selectError } = await supabase
        .from('proyectos_publicos')
        .select('nombre_proyecto')
        .in('nombre_proyecto', nombresProyectos);
      
      if (selectError) {
        console.error('Error verificando proyectos:', selectError);
        return;
      }
      
      // Crear un Set de proyectos que ya existen
      const existentesSet = new Set((existentes || []).map(p => p.nombre_proyecto));
      
      // Filtrar solo los que NO existen
      const nuevosProyectos = nombresProyectos.filter(nombre => !existentesSet.has(nombre));
      
      if (nuevosProyectos.length === 0) {
        console.log('[Supabase] Todos los proyectos ya tienen registro');
        return;
      }
      
      // Crear todos los registros faltantes en una sola operación batch
      const registrosNuevos = nuevosProyectos.map(nombre => ({
        nombre_proyecto: nombre,
        megustas: 0,
        vistas: 0,
        comentario: []
      }));
      
      const { error: insertError } = await supabase
        .from('proyectos_publicos')
        .insert(registrosNuevos);
      
      if (insertError) {
        console.error('Error creando registros:', insertError);
      } else {
        console.log(`✅ ${nuevosProyectos.length} registros creados`);
      }
    } catch (err) {
      console.error('Error en verificación:', err);
    }
    
    console.log('[Supabase] Verificación completada');
  }
  
  // Función auxiliar para renderizar proyectos en el grid
  function renderProjectsToGrid(appsGrid, sortedProjects) {
    appsGrid.innerHTML = '';
    
    // Crear contenedor para todos los proyectos
    const communityGrid = document.createElement('div');
    communityGrid.className = 'projects-grid';
    communityGrid.id = 'communityProjectsGrid';
    appsGrid.appendChild(communityGrid);
    
    // Usar DocumentFragment para renderizado más fluido (evita múltiples reflows)
    const fragment = document.createDocumentFragment();
    
    // Renderizar todos los proyectos
    sortedProjects.forEach((project, i) => {
      project.isAppsSection = true;
      const card = createCard(project);
      card.style.animationDelay = (i * 0.04) + 's';
      
      const exploreBtn = document.createElement('button');
      exploreBtn.className = 'explore-project-btn';
      exploreBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 16 16 12 12 8"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        Explorar
      `;
      exploreBtn.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 12px 20px;
        margin-top: 14px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        cursor: pointer;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 600;
        transition: all 0.2s;
        width: 100%;
      `;
      exploreBtn.onclick = (e) => {
        e.stopPropagation();
        showProjectPanel(project);
      };
      exploreBtn.onmouseenter = () => {
        exploreBtn.style.transform = 'translateY(-2px)';
        exploreBtn.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
      };
      exploreBtn.onmouseleave = () => {
        exploreBtn.style.transform = 'translateY(0)';
        exploreBtn.style.boxShadow = 'none';
      };
      card.appendChild(exploreBtn);
      
      fragment.appendChild(card);
    });
    
    // Insertar todos los cards de una vez (evita múltiples reflows)
    communityGrid.appendChild(fragment);
    
    // Guardar referencia global para el buscador
    window.allCommunityProjects = sortedProjects;
    
    console.log(`[Apps Section] Mostrando ${sortedProjects.length} proyectos`);
  }
  
  // Función para actualizar el caché en segundo plano
  async function refreshAppProjectsInBackground() {
    try {
      console.log('[Apps Cache] Iniciando actualización en segundo plano');
      
      const supabasePublicProjects = await getAllSupabasePublicProjects();
      const publicProjects = supabasePublicProjects ? supabasePublicProjects.filter(p => 
        p.devcenter === 'public' || p.devcenter === 'Public'
      ) : [];
      
      let allCommunityProjects = [];
      if (publicProjects && publicProjects.length > 0) {
        publicProjects.forEach(p => {
          allCommunityProjects.push({
            title: p.titulo || p.title,
            description: p.descripcion || p.description,
            link: p.link || '#',
            url: p.link || '#',
            status: p.status || 'Disponible',
            date: p.fecha || p.date,
            created_at: p.created_at,
            dateAdded: p.created_at || p.fecha || p.date,
            tags: p.tags || [],
            initials: p.inicialesTitulo || (p.titulo || p.title || '').slice(0, 2).toUpperCase(),
            owner: p.owner || 'Comunidad',
            source: 'supabase'
          });
        });
      }
      
      if (allCommunityProjects.length > 0) {
        const allSorted = sortProjectsByPopularity([...allCommunityProjects]);
        const favorites = allSorted.filter(p => isFavorite(p));
        const nonFavorites = allSorted.filter(p => !isFavorite(p));
        const sortedProjects = [...favorites, ...nonFavorites];
        
        // Actualizar caché
        setCachedData('appsProjects:v1', sortedProjects, 'apps');
        console.log('[Apps Cache] Caché actualizado en segundo plano, proyectos:', sortedProjects.length);
      }
    } catch (error) {
      console.error('[Apps Cache] Error actualizando caché en segundo plano:', error);
    }
  }
  
  async function renderAllProjectsInAppsSection() {
    const appsGrid = document.getElementById('appsGrid');
    if (!appsGrid) return;
    
    // Verificar si hay datos en caché válidos
    const cachedProjects = getCachedData('appsProjects:v1', 'apps');
    
    // Si hay caché válido, renderizar inmediatamente
    if (cachedProjects && cachedProjects.length > 0) {
      console.log('[Apps Cache] Usando datos en caché, proyectos:', cachedProjects.length);
      renderProjectsToGrid(appsGrid, cachedProjects);
      
      // Hacer refresh en segundo plano para actualizar el caché
      refreshAppProjectsInBackground();
      return;
    }
    
    // Si no hay caché, mostrar indicador de carga con el nuevo spinner
    appsGrid.innerHTML = createLoadingSpinner('Cargando proyectos de la comunidad...');
    
    // Obtener SOLO proyectos públicos de Supabase (devcenter === 'public')
    const supabasePublicProjects = await getAllSupabasePublicProjects();
    
    // Verificar y crear registros en Supabase EN SEGUNDO PLANO (no bloquea la UI)
    verificarYCrearRegistrosProyectos(supabasePublicProjects).catch(err => {
      console.error('[Background] Error verificando registros:', err);
    });
    
    // Limpiar el indicador de carga
    appsGrid.innerHTML = '';
    
    // Filtrar solo proyectos que sean realmente públicos
    const publicProjects = supabasePublicProjects ? supabasePublicProjects.filter(p => 
      p.devcenter === 'public' || p.devcenter === 'Public'
    ) : [];
    
    // Crear lista de proyectos de la comunidad (solo Supabase públicos)
    let allCommunityProjects = [];
    
    if (publicProjects && publicProjects.length > 0) {
      publicProjects.forEach(p => {
        allCommunityProjects.push({
          title: p.titulo || p.title,
          description: p.descripcion || p.description,
          link: p.link || '#',
          url: p.link || '#',
          status: p.status || 'Disponible',
          date: p.fecha || p.date,
          created_at: p.created_at,
          dateAdded: p.created_at || p.fecha || p.date,
          tags: p.tags || [],
          initials: p.inicialesTitulo || (p.titulo || p.title || '').slice(0, 2).toUpperCase(),
          owner: p.owner || 'Comunidad',
          source: 'supabase'
        });
      });
    }
    
    // Si no hay proyectos públicos, mostrar mensaje
    if (allCommunityProjects.length === 0) {
      appsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.4; margin-bottom: 16px;">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <h3 style="color: var(--text-secondary); font-size: 16px; margin-bottom: 8px;">No hay proyectos públicos disponibles</h3>
          <p style="color: var(--text-secondary); opacity: 0.7; font-size: 14px;">Sé el primero en publicar tu app</p>
        </div>
      `;
      return;
    }
    
    // Ordenar todos los proyectos: favoritos primero, luego el resto (ambos por popularidad)
    const allSorted = sortProjectsByPopularity([...allCommunityProjects]);
    const favorites = allSorted.filter(p => isFavorite(p));
    const nonFavorites = allSorted.filter(p => !isFavorite(p));
    const sortedProjects = [...favorites, ...nonFavorites];
    
    // Guardar en caché
    setCachedData('appsProjects:v1', sortedProjects, 'apps');
    console.log('[Apps Cache] Datos guardados en caché, proyectos:', sortedProjects.length);
    
    // Renderizar proyectos usando la función auxiliar
    renderProjectsToGrid(appsGrid, sortedProjects);
    
    // Implementar buscador funcional
    const appsSearchInput = document.getElementById('appsSearchInput');
    if (appsSearchInput) {
      // La referencia global ya se guarda en renderProjectsToGrid
      const communityGrid = document.getElementById('communityProjectsGrid');
      
      appsSearchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (!searchTerm) {
          // Si no hay término de búsqueda, mostrar todos
          communityGrid.innerHTML = '';
          sortedProjects.forEach((project, i) => {
            project.isAppsSection = true;
            const card = createCard(project);
            card.style.animationDelay = (i * 0.08) + 's';
            
            const exploreBtn = document.createElement('button');
            exploreBtn.className = 'explore-project-btn';
            exploreBtn.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 16 16 12 12 8"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              Explorar
            `;
            exploreBtn.style.cssText = `
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              padding: 12px 20px;
              margin-top: 14px;
              background: linear-gradient(135deg, #667eea, #764ba2);
              color: white;
              border: none;
              cursor: pointer;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 600;
              transition: all 0.2s;
              width: 100%;
            `;
            exploreBtn.onclick = (e) => {
              e.stopPropagation();
              showProjectPanel(project);
            };
            exploreBtn.onmouseenter = () => {
              exploreBtn.style.transform = 'translateY(-2px)';
              exploreBtn.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
            };
            exploreBtn.onmouseleave = () => {
              exploreBtn.style.transform = 'translateY(0)';
              exploreBtn.style.boxShadow = 'none';
            };
            card.appendChild(exploreBtn);
            
            communityGrid.appendChild(card);
          });
          return;
        }
        
        // Filtrar proyectos por término de búsqueda
        const filteredProjects = sortedProjects.filter(project => {
          const titleMatch = project.title && project.title.toLowerCase().includes(searchTerm);
          const descMatch = project.description && project.description.toLowerCase().includes(searchTerm);
          const tagsMatch = project.tags && Array.isArray(project.tags) && 
                           project.tags.some(tag => tag.toLowerCase().includes(searchTerm));
          const ownerMatch = project.owner && project.owner.toLowerCase().includes(searchTerm);
          
          return titleMatch || descMatch || tagsMatch || ownerMatch;
        });
        
        // Renderizar proyectos filtrados
        communityGrid.innerHTML = '';
        
        if (filteredProjects.length === 0) {
          communityGrid.innerHTML = '<div class="empty-state"><p>No se encontraron proyectos que coincidan con tu búsqueda</p></div>';
          return;
        }
        
        filteredProjects.forEach((project, i) => {
          project.isAppsSection = true;
          const card = createCard(project);
          card.style.animationDelay = (i * 0.08) + 's';
          
          const exploreBtn = document.createElement('button');
          exploreBtn.className = 'explore-project-btn';
          exploreBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 16 16 12 12 8"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Explorar
          `;
          exploreBtn.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 12px 20px;
            margin-top: 14px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            transition: all 0.2s;
            width: 100%;
          `;
          exploreBtn.onclick = (e) => {
            e.stopPropagation();
            showProjectPanel(project);
          };
          exploreBtn.onmouseenter = () => {
            exploreBtn.style.transform = 'translateY(-2px)';
            exploreBtn.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
          };
          exploreBtn.onmouseleave = () => {
            exploreBtn.style.transform = 'translateY(0)';
            exploreBtn.style.boxShadow = 'none';
          };
          card.appendChild(exploreBtn);
          
          communityGrid.appendChild(card);
        });
      });
    }
  }
  
  // Exponer funciones para uso externo
  window.renderAllProjectsInAppsSection = renderAllProjectsInAppsSection;

})();

// ==========================================
// MONITOR DE API GLOBAL
// ==========================================
// Detectar "DevCenterX=api" en cualquier input
(function() {
  let isApiMonitorActive = false;
  let apiCallCount = 0;
  let isMonitorEnabled = false;
  let notificationQueue = [];
  let isProcessingQueue = false;
  
  // Configuración de duraciones por defecto
  const defaultDurations = {
    loading: 1000,    // Cargando/Loading
    success: 3000,    // Resultado/Éxito
    error: 4000,      // Errores
    api: 5000         // Solicitudes a API
  };
  
  // Obtener configuración de duraciones
  function getDurations() {
    const saved = localStorage.getItem('api_notification_durations');
    return saved ? JSON.parse(saved) : defaultDurations;
  }
  
  // Guardar configuración de duraciones
  function saveDurations(durations) {
    localStorage.setItem('api_notification_durations', JSON.stringify(durations));
  }
  
  // Convertir milisegundos a formato legible (s o m)
  function msToReadable(ms) {
    if (ms >= 60000) {
      const minutes = ms / 60000;
      return minutes % 1 === 0 ? `${minutes}m` : `${(ms / 1000)}s`;
    }
    return `${ms / 1000}s`;
  }
  
  // Convertir formato legible (s o m) a milisegundos
  function readableToMs(value) {
    const str = String(value).trim().toLowerCase();
    
    if (str.endsWith('m')) {
      const minutes = parseFloat(str);
      return minutes * 60000;
    } else if (str.endsWith('s')) {
      const seconds = parseFloat(str);
      return seconds * 1000;
    } else {
      // Si no tiene unidad, asumir segundos
      const num = parseFloat(str);
      return num * 1000;
    }
  }
  
  // Detectar tipo de notificación por tipo o valor heredado
  function getNotificationType(type) {
    const loadingTypes = ['loading', 'process'];
    const successTypes = ['success', 'check'];
    const errorTypes = ['error'];
    const warningTypes = ['warning'];
    const apiTypes = ['api'];
    const infoTypes = ['info', 'notice'];
    
    if (loadingTypes.includes(type)) return 'loading';
    if (successTypes.includes(type)) return 'success';
    if (errorTypes.includes(type)) return 'error';
    if (warningTypes.includes(type)) return 'warning';
    if (apiTypes.includes(type)) return 'api';
    if (infoTypes.includes(type)) return 'info';
    
    return 'info'; // Por defecto
  }
  
  // Función global de notificaciones (disponible para todos los archivos)
  window.showDevCenterXNotification = function(message, type = 'info', duration = null) {
    if (localStorage.getItem('api_monitor_enabled') !== 'true') return;
    
    // Si no se especifica duración, usar la configurada según el tipo
    if (duration === null) {
      const notificationType = getNotificationType(type);
      const durations = getDurations();
      duration = durations[notificationType] || 3000;
    }
    
    // Agregar a la cola
    notificationQueue.push({ message, type, duration });
    
    // Procesar la cola si no se está procesando
    if (!isProcessingQueue) {
      processNotificationQueue();
    }
  };
  
  // Obtener icono SVG elegante según el tipo
  function getElegantIcon(type) {
    const icons = {
      loading: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>`,
      success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
      api: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
    };
    return icons[type] || icons.info;
  }
  
  function processNotificationQueue() {
    if (notificationQueue.length === 0) {
      isProcessingQueue = false;
      return;
    }
    
    isProcessingQueue = true;
    const { message, type, duration } = notificationQueue.shift();
    
    // Asegurar que los estilos estén cargados
    if (!document.getElementById('api-monitor-styles')) {
      loadNotificationStyles();
    }
    
    // Determinar tipo de notificación
    const notificationType = getNotificationType(type);
    
    const notification = document.createElement('div');
    notification.className = `api-notification notification-${notificationType}`;
    notification.innerHTML = `
      <span class="api-notification-icon">${getElegantIcon(notificationType)}</span>
      <span class="api-notification-text">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('hide');
      setTimeout(() => {
        notification.remove();
        // Procesar la siguiente notificación
        processNotificationQueue();
      }, 300);
    }, duration || 3000);
  }
  
  function loadNotificationStyles() {
    const styles = document.createElement('style');
    styles.id = 'api-monitor-styles';
    styles.textContent = `
      .api-notification {
        position: fixed;
        top: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(-120px);
        background: rgba(20, 20, 35, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        color: #f8fafc;
        padding: 14px 24px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
        z-index: 10001;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        font-weight: 500;
        font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        letter-spacing: 0.2px;
        animation: notificationSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        max-width: 420px;
      }
      
      .api-notification.hide {
        animation: notificationSlideUp 0.35s cubic-bezier(0.4, 0, 1, 1) forwards;
      }
      
      @keyframes notificationSlideDown {
        0% {
          transform: translateX(-50%) translateY(-120px);
          opacity: 0;
        }
        100% {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes notificationSlideUp {
        0% {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
        100% {
          transform: translateX(-50%) translateY(-120px);
          opacity: 0;
        }
      }
      
      .api-notification-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        transition: all 0.2s ease;
      }
      
      .api-notification-icon svg {
        width: 18px;
        height: 18px;
      }
      
      .api-notification-text {
        flex: 1;
        line-height: 1.4;
      }
      
      /* Tipos de notificación con colores elegantes */
      .notification-success {
        border-color: rgba(34, 197, 94, 0.3);
      }
      .notification-success .api-notification-icon {
        background: rgba(34, 197, 94, 0.15);
        color: #22c55e;
      }
      
      .notification-error {
        border-color: rgba(239, 68, 68, 0.3);
      }
      .notification-error .api-notification-icon {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }
      
      .notification-warning {
        border-color: rgba(245, 158, 11, 0.3);
      }
      .notification-warning .api-notification-icon {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
      }
      
      .notification-loading {
        border-color: rgba(59, 130, 246, 0.3);
      }
      .notification-loading .api-notification-icon {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
        animation: iconPulse 1.5s ease-in-out infinite;
      }
      
      .notification-info {
        border-color: rgba(99, 102, 241, 0.3);
      }
      .notification-info .api-notification-icon {
        background: rgba(99, 102, 241, 0.15);
        color: #6366f1;
      }
      
      .notification-api {
        border-color: rgba(139, 92, 246, 0.3);
      }
      .notification-api .api-notification-icon {
        background: rgba(139, 92, 246, 0.15);
        color: #8b5cf6;
      }
      
      @keyframes iconPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(styles);
  }
  
  // Detectar cuando se escribe "DevCenterX=api" en cualquier input
  document.addEventListener('input', function(e) {
    if (e.target.tagName === 'INPUT' && e.target.value.trim() === 'DevCenterX=api') {
      e.target.value = '';
      initApiMonitor();
    }
  });
  
  function initApiMonitor() {
    if (isApiMonitorActive) return;
    
    isApiMonitorActive = true;
    isMonitorEnabled = localStorage.getItem('api_monitor_enabled') === 'true';
    
    // Cargar estilos de notificación
    loadNotificationStyles();
    
    // Crear estilos del panel de monitor
    const panelStyles = document.createElement('style');
    panelStyles.id = 'api-monitor-panel-styles';
    panelStyles.textContent = `
      .api-monitor-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(20, 20, 30, 0.95);
        border: 2px solid #667eea;
        border-radius: 12px;
        padding: 20px;
        z-index: 10000;
        min-width: 280px;
        box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
        backdrop-filter: blur(10px);
      }
      
      .api-monitor-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 15px;
      }
      
      .api-monitor-title {
        font-size: 16px;
        font-weight: 600;
        color: #667eea;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .api-monitor-close {
        background: transparent;
        border: none;
        color: #888;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s;
      }
      
      .api-monitor-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }
      
      .api-monitor-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
      }
      
      .api-monitor-label {
        font-size: 14px;
        color: #ccc;
      }
      
      .api-toggle-switch {
        position: relative;
        width: 50px;
        height: 26px;
        background: #444;
        border-radius: 13px;
        cursor: pointer;
        transition: background 0.3s;
      }
      
      .api-toggle-switch.active {
        background: #667eea;
      }
      
      .api-toggle-slider {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        transition: transform 0.3s;
      }
      
      .api-toggle-switch.active .api-toggle-slider {
        transform: translateX(24px);
      }
      
      .api-monitor-stats {
        font-size: 12px;
        color: #888;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .api-config-btn {
        background: rgba(102, 126, 234, 0.2);
        border: 1px solid #667eea;
        color: #667eea;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        margin-top: 10px;
        width: 100%;
        transition: all 0.2s;
      }
      
      .api-config-btn:hover {
        background: rgba(102, 126, 234, 0.3);
      }
      
      .api-config-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(20, 20, 30, 0.98);
        border: 2px solid #667eea;
        border-radius: 12px;
        padding: 25px;
        z-index: 10002;
        min-width: 350px;
        box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4);
        display: none;
      }
      
      .api-config-panel.show {
        display: block;
      }
      
      .api-config-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      
      .api-config-title {
        font-size: 18px;
        font-weight: 600;
        color: #667eea;
      }
      
      .api-config-close {
        background: transparent;
        border: none;
        color: #888;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s;
      }
      
      .api-config-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }
      
      .api-config-item {
        margin-bottom: 15px;
      }
      
      .api-config-label {
        display: block;
        font-size: 13px;
        color: #ccc;
        margin-bottom: 6px;
      }
      
      .api-config-input {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 8px 12px;
        color: #fff;
        font-size: 14px;
      }
      
      .api-config-input:focus {
        outline: none;
        border-color: #667eea;
      }
      
      .api-config-save {
        background: #667eea;
        border: none;
        color: white;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        width: 100%;
        margin-top: 10px;
        transition: all 0.2s;
      }
      
      .api-config-save:hover {
        background: #5568d3;
      }
      
      .api-config-reset {
        background: transparent;
        border: 1px solid #888;
        color: #888;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        width: 100%;
        margin-top: 8px;
        transition: all 0.2s;
      }
      
      .api-config-reset:hover {
        border-color: #667eea;
        color: #667eea;
      }
    `;
    document.head.appendChild(panelStyles);
    
    // Crear panel
    const panel = document.createElement('div');
    panel.className = 'api-monitor-panel';
    panel.id = 'apiMonitorPanel';
    panel.innerHTML = `
      <div class="api-monitor-header">
        <div class="api-monitor-title">
          <span>📡</span>
          <span>Monitor de API</span>
        </div>
        <button class="api-monitor-close">×</button>
      </div>
      <div class="api-monitor-toggle">
        <span class="api-monitor-label">Notificaciones</span>
        <div class="api-toggle-switch ${isMonitorEnabled ? 'active' : ''}" id="apiToggle">
          <div class="api-toggle-slider"></div>
        </div>
      </div>
      <button class="api-config-btn" id="showConfigBtn">⚙️ Mostrar configuraciones</button>
      <div class="api-monitor-stats">
        <div id="apiStats">Esperando solicitudes...</div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Crear panel de configuración
    const durations = getDurations();
    const configPanel = document.createElement('div');
    configPanel.className = 'api-config-panel';
    configPanel.id = 'apiConfigPanel';
    configPanel.innerHTML = `
      <div class="api-config-header">
        <div class="api-config-title">⚙️ Configuración de Notificaciones</div>
        <button class="api-config-close">×</button>
      </div>
      
      <div class="api-config-item">
        <label class="api-config-label">📥 Cargando/Loading (ej: 1s, 0.5s)</label>
        <input type="text" class="api-config-input" id="loadingDuration" value="${msToReadable(durations.loading)}" placeholder="1s">
      </div>
      
      <div class="api-config-item">
        <label class="api-config-label">✅ Resultado/Éxito (ej: 3s, 1m)</label>
        <input type="text" class="api-config-input" id="successDuration" value="${msToReadable(durations.success)}" placeholder="3s">
      </div>
      
      <div class="api-config-item">
        <label class="api-config-label">❌ Errores (ej: 4s, 0.5m)</label>
        <input type="text" class="api-config-input" id="errorDuration" value="${msToReadable(durations.error)}" placeholder="4s">
      </div>
      
      <div class="api-config-item">
        <label class="api-config-label">🌐 Solicitudes a API (ej: 5s, 1m)</label>
        <input type="text" class="api-config-input" id="apiDuration" value="${msToReadable(durations.api)}" placeholder="5s">
      </div>
      
      <button class="api-config-save" id="saveConfigBtn">💾 Guardar Configuración</button>
      <button class="api-config-reset" id="resetConfigBtn">🔄 Restablecer valores predeterminados</button>
    `;
    
    document.body.appendChild(configPanel);
    
    // Eventos del panel principal
    panel.querySelector('.api-monitor-close').addEventListener('click', () => {
      panel.remove();
      configPanel.remove();
      document.getElementById('api-monitor-styles')?.remove();
      isApiMonitorActive = false;
    });
    
    const toggle = document.getElementById('apiToggle');
    toggle.addEventListener('click', () => {
      isMonitorEnabled = !isMonitorEnabled;
      localStorage.setItem('api_monitor_enabled', isMonitorEnabled);
      toggle.classList.toggle('active', isMonitorEnabled);
      
      window.showDevCenterXNotification(
        isMonitorEnabled ? 'Monitor activado' : 'Monitor desactivado',
        isMonitorEnabled ? 'success' : 'info'
      );
    });
    
    // Eventos del panel de configuración
    document.getElementById('showConfigBtn').addEventListener('click', () => {
      configPanel.classList.add('show');
    });
    
    configPanel.querySelector('.api-config-close').addEventListener('click', () => {
      configPanel.classList.remove('show');
    });
    
    document.getElementById('saveConfigBtn').addEventListener('click', () => {
      const newDurations = {
        loading: readableToMs(document.getElementById('loadingDuration').value) || 1000,
        success: readableToMs(document.getElementById('successDuration').value) || 3000,
        error: readableToMs(document.getElementById('errorDuration').value) || 4000,
        api: readableToMs(document.getElementById('apiDuration').value) || 5000
      };
      
      saveDurations(newDurations);
      configPanel.classList.remove('show');
      
      window.showDevCenterXNotification('Configuración guardada', 'success');
    });
    
    document.getElementById('resetConfigBtn').addEventListener('click', () => {
      saveDurations(defaultDurations);
      
      document.getElementById('loadingDuration').value = msToReadable(defaultDurations.loading);
      document.getElementById('successDuration').value = msToReadable(defaultDurations.success);
      document.getElementById('errorDuration').value = msToReadable(defaultDurations.error);
      document.getElementById('apiDuration').value = msToReadable(defaultDurations.api);
      
      window.showDevCenterXNotification('Valores restablecidos', 'success');
    });
    
    // Interceptar fetch global
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      
      if (isMonitorEnabled && typeof url === 'string' && url.includes('supabase.co')) {
        const endpoint = url.split('/').pop() || 'API';
        window.showDevCenterXNotification(`Solicitud a API: ${endpoint}`, 'api');
        
        apiCallCount++;
        const statsEl = document.getElementById('apiStats');
        if (statsEl) {
          statsEl.innerHTML = `
            Total: <strong>${apiCallCount}</strong><br>
            Última: ${endpoint}
          `;
        }
      }
      
      return originalFetch.apply(this, args);
    };
    
    console.log('🔍 Monitor de API activado');
  }
  
  // Hacer disponible globalmente
  window.initApiMonitor = initApiMonitor;
})();
// Reviews Handler - Sistema de reseñas para DevCenterX
// Usa la constante REVIEWS_BIN_ID ya definida en script.js

// Función para obtener el nombre del usuario actual desde localStorage
function getCurrentUserName() {
  return localStorage.getItem('current_user_name') || '';
}

// Función para guardar el nombre del usuario actual en localStorage
function setCurrentUserName(userName) {
  localStorage.setItem('current_user_name', userName.trim());
}

// Función para verificar si el usuario actual ya comentó en un proyecto
function hasUserCommented(projectTitle, userName) {
  if (!userName) return false;
  
  // Verificar si existe una reseña para este usuario en este proyecto
  return window.loadReviewsData().then(allReviews => {
    const projectReviews = allReviews.filter(review => {
      if (!review.proyecto) {
        return true; // Incluir reseñas sin proyecto específico
      }
      return review.proyecto.toLowerCase() === projectTitle.toLowerCase();
    });
    
    return projectReviews.some(review => 
      review.usuario && review.usuario.toLowerCase().trim() === userName.toLowerCase().trim()
    );
  });
}


// Caché de reseñas para evitar cargas repetidas
let reviewsCache = null;
let reviewsCacheTimestamp = 0;
const REVIEWS_CACHE_DURATION = 30000; // 30 segundos

// Función para cargar reseñas (incluye reseñas locales y del servidor, evita duplicados)
async function loadReviewsData(forceRefresh = false) {
  // Si hay caché válido y no se fuerza el refresco, usar el caché
  const now = Date.now();
  if (!forceRefresh && reviewsCache && (now - reviewsCacheTimestamp) < REVIEWS_CACHE_DURATION) {
    return reviewsCache;
  }
  
  let serverReviews = [];
  let localReviews = [];
  
  // Cargar reseñas del servidor
  if (typeof window.getAllReviews === 'function') {
    // Primero intentar usar las reseñas ya cargadas
    try {
      serverReviews = window.getAllReviews() || [];
      // Si no hay reseñas cargadas, cargar desde el servidor
      if (serverReviews.length === 0 && typeof window.loadReviews === 'function') {
        serverReviews = await window.loadReviews() || [];
      }
    } catch(error) {
      console.warn('Error obteniendo reseñas:', error);
      serverReviews = [];
    }
  }
  
  // Cargar reseñas locales del localStorage
  try {
    localReviews = JSON.parse(localStorage.getItem('local_reviews') || '[]');
  } catch(e) {
    localReviews = [];
  }
  
  // Crear un mapa para deduplicación más robusta
  const reviewMap = new Map();
  
  // Primero agregar reseñas del servidor (tienen prioridad)
  serverReviews.forEach(review => {
    const key = generateReviewKey(review);
    reviewMap.set(key, { ...review, _source: 'server' });
  });
  
  // Luego agregar reseñas locales solo si no existen ya en el servidor
  const validLocalReviews = [];
  localReviews.forEach(review => {
    const key = generateReviewKey(review);
    if (!reviewMap.has(key)) {
      reviewMap.set(key, { ...review, _source: 'local' });
      validLocalReviews.push(review);
    }
  });
  
  // Si hay reseñas locales que ya están en el servidor, limpiar localStorage
  if (localReviews.length > validLocalReviews.length) {
    console.log('[Reviews] Limpiando reseñas locales duplicadas del localStorage');
    localStorage.setItem('local_reviews', JSON.stringify(validLocalReviews));
  }
  
  const uniqueReviews = Array.from(reviewMap.values());
  
  // Actualizar caché
  reviewsCache = uniqueReviews;
  reviewsCacheTimestamp = now;
  
  console.log('[Reviews] Reseñas únicas cargadas:', uniqueReviews.length, '| Servidor:', serverReviews.length, '| Locales:', validLocalReviews.length);
  return uniqueReviews;
}

// Función para invalidar el caché de reseñas (usar después de agregar una reseña)
function invalidateReviewsCache() {
  reviewsCache = null;
  reviewsCacheTimestamp = 0;
}

// Función auxiliar para generar una clave única de reseña más robusta
// No incluye fecha para evitar duplicados cuando las fechas cambian entre envío local/servidor
function generateReviewKey(review) {
  const normalizedUser = (review.usuario || '').trim().toLowerCase();
  const normalizedComment = (review.comentario || '').trim().toLowerCase();
  const normalizedProject = (review.proyecto || '').trim().toLowerCase();
  
  return `${normalizedUser}|${normalizedComment}|${normalizedProject}`;
}

// Función para agregar estilos CSS si no existen
function addReviewStyles() {
  if (document.getElementById('review-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'review-styles';
  style.textContent = `
    /* Arreglar el problema de la descripción que desaparece */
    .panel-body {
      overflow: visible !important;
      flex: 1 !important;
      min-height: 0 !important;
      display: flex !important;
      flex-direction: column !important;
    }
    .panel-description {
      max-height: none !important;
      flex-shrink: 0 !important;
      overflow: visible !important;
    }
    .reviews-section {
      overflow: visible !important;
      max-height: none !important;
      flex-shrink: 0 !important;
    }
    .project-rating { display: flex; align-items: center; gap: 8px; margin: 8px 0 12px 0; flex-wrap: wrap; }
    .stars-container { display: flex; align-items: center; gap: 2px; }
    .star-filled { color: #facc15; font-size: 1rem; }
    .star-half { color: #facc15; font-size: 1rem; opacity: 0.6; }
    .star-empty { color: rgba(255,255,255,0.3); font-size: 1rem; }
    .rating-text { font-size: 0.9rem; color: rgba(255,255,255,0.7); font-weight: 500; }
    .reviews-section { margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; }
    .reviews-title { font-size: 1.1rem; font-weight: 600; color: #fff; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .review-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; margin-bottom: 12px; transition: all 0.3s ease; }
    .review-item:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
    .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px; }
    .review-user { font-weight: 600; color: #facc15; font-size: 0.95rem; }
    .review-date { font-size: 0.85rem; color: rgba(255,255,255,0.5); }
    .review-stars { margin: 6px 0; }
    .review-comment { color: rgba(255,255,255,0.9); line-height: 1.5; font-size: 0.95rem; word-wrap: break-word; overflow-wrap: break-word; margin-bottom: 8px; }
    .reply-btn { background: none; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.6); padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s; font-weight: 500; }
    .reply-btn:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.9); border-color: rgba(255,255,255,0.3); }
    .reply-btn svg { flex-shrink: 0; }
    .comment-container { margin-bottom: 16px; }
    .toggle-replies-btn { background: none; border: 1px solid rgba(102, 126, 234, 0.3); color: rgba(102, 126, 234, 0.9); padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s; margin: 8px 0 8px 20px; font-weight: 500; }
    .toggle-replies-btn:hover { background: rgba(102, 126, 234, 0.1); border-color: rgba(102, 126, 234, 0.5); }
    .toggle-replies-btn svg { flex-shrink: 0; transition: transform 0.2s; }
    .replies-container { margin-left: 20px; border-left: 3px solid rgba(102, 126, 234, 0.3); padding-left: 16px; margin-top: 8px; }
    .reply-item { margin-bottom: 12px; }
    .no-reviews { text-align: center; color: rgba(255,255,255,0.5); font-style: italic; padding: 20px; }
    .review-form { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin: 16px 0; }
    .review-form h3 { color: #facc15; margin-bottom: 16px; font-size: 1.1rem; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 8px; color: rgba(255,255,255,0.8); font-weight: 500; font-size: 0.9rem; }
    .form-group input, .form-group textarea { width: 100%; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; font-size: 0.9rem; box-sizing: border-box; }
    .form-group input:focus, .form-group textarea:focus { outline: none; border-color: #facc15; background: rgba(255,255,255,0.05); }
    .form-group textarea { min-height: 80px; resize: vertical; }
    .rating-input { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
    .star-button { background: none; border: none; font-size: 1.5rem; color: rgba(255,255,255,0.3); cursor: pointer; transition: color 0.2s; }
    .star-button:hover, .star-button.selected { color: #facc15; }
    .submit-btn { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s; width: 100%; }
    .submit-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3); }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .form-message { padding: 12px; border-radius: 8px; margin: 12px 0; font-size: 0.9rem; }
    .reply-form { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; margin-top: 10px; }
    .reply-form textarea { width: 100%; padding: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: white; font-size: 0.85rem; resize: vertical; min-height: 60px; box-sizing: border-box; }
    .reply-form textarea:focus { outline: none; border-color: #667eea; background: rgba(255,255,255,0.05); }
    .reply-submit-btn { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 6px 14px; border-radius: 5px; cursor: pointer; font-size: 0.8rem; font-weight: 500; }
    .reply-submit-btn:hover { opacity: 0.9; }
    .reply-cancel-btn { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 5px; cursor: pointer; font-size: 0.8rem; }
    .reply-cancel-btn:hover { background: rgba(255,255,255,0.08); color: white; }
    .form-message.success { background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
    .form-message.error { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
    
    @media (max-width: 768px) {
      .review-form { padding: 16px; }
      .review-form h3 { font-size: 1rem; }
      .form-group label { font-size: 0.85rem; }
      .form-group input, .form-group textarea { padding: 10px; font-size: 0.85rem; }
      .form-group textarea { min-height: 60px; }
      .star-button { font-size: 1.3rem; }
      .submit-btn { padding: 10px 20px; font-size: 0.95rem; }
    }
    
    @media (max-width: 480px) {
      .review-form { padding: 14px; }
      .review-form h3 { font-size: 0.95rem; margin-bottom: 12px; }
      .form-group { margin-bottom: 12px; }
      .form-group label { font-size: 0.8rem; }
      .form-group input, .form-group textarea { padding: 8px; font-size: 0.8rem; }
      .star-button { font-size: 1.2rem; }
      .submit-btn { padding: 9px 18px; font-size: 0.9rem; }
      .form-message { padding: 10px; font-size: 0.85rem; }
    }
    
    @media (prefers-color-scheme: light) {
      .star-empty { color: rgba(0,0,0,0.4) !important; }
      .rating-text { color: #000000 !important; font-weight: 700 !important; }
      .reviews-section { border-top: 3px solid rgba(0,0,0,0.35) !important; }
      .reviews-title { color: #000000 !important; font-weight: 800 !important; }
      .review-item { background: rgba(0,0,0,0.08) !important; border: 3px solid rgba(0,0,0,0.4) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; }
      .review-item:hover { background: rgba(0,0,0,0.12) !important; border-color: rgba(0,0,0,0.5) !important; box-shadow: 0 6px 16px rgba(0,0,0,0.2) !important; }
      .review-user { color: #ea580c !important; font-weight: 800 !important; }
      .review-date { color: rgba(0,0,0,0.75) !important; font-weight: 600 !important; }
      .review-comment { color: #000000 !important; font-weight: 600 !important; line-height: 1.7 !important; }
      .reply-btn { border-color: rgba(0,0,0,0.3) !important; color: rgba(0,0,0,0.7) !important; }
      .reply-btn:hover { background: rgba(0,0,0,0.05) !important; color: #000000 !important; border-color: rgba(0,0,0,0.5) !important; }
      .no-reviews { color: rgba(0,0,0,0.7) !important; font-weight: 600 !important; }
      .review-form { background: rgba(0,0,0,0.08) !important; border: 3px solid rgba(0,0,0,0.4) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; }
      .review-form h3 { color: #ea580c !important; font-weight: 800 !important; }
      .form-group label { color: #000000 !important; font-weight: 700 !important; }
      .form-group input, .form-group textarea { background: #ffffff !important; border: 3px solid rgba(0,0,0,0.45) !important; color: #000000 !important; font-weight: 600 !important; }
      .form-group input::placeholder, .form-group textarea::placeholder { color: rgba(0,0,0,0.6) !important; }
      .form-group input:focus, .form-group textarea:focus { border-color: #ea580c !important; background: #ffffff !important; box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.2) !important; }
      .star-button { color: rgba(0,0,0,0.4) !important; }
      .star-button:hover, .star-button.selected { color: #ea580c !important; }
      #ratingText { color: #000000 !important; font-weight: 700 !important; }
      .form-message.success { background: rgba(34, 197, 94, 0.25) !important; color: #14532d !important; border: 3px solid rgba(34, 197, 94, 0.6) !important; font-weight: 700 !important; }
      .form-message.error { background: rgba(239, 68, 68, 0.25) !important; color: #991b1b !important; border: 3px solid rgba(239, 68, 68, 0.6) !important; font-weight: 700 !important; }
      .reply-form { background: rgba(0,0,0,0.05) !important; border: 2px solid rgba(0,0,0,0.3) !important; }
      .reply-form textarea { background: #ffffff !important; border: 2px solid rgba(0,0,0,0.3) !important; color: #000000 !important; }
      .reply-form textarea:focus { border-color: #667eea !important; }
    }
    
    html.theme-light .star-empty { color: rgba(0,0,0,0.4) !important; }
    html.theme-light .rating-text { color: #000000 !important; font-weight: 700 !important; }
    html.theme-light .reviews-section { border-top: 3px solid rgba(0,0,0,0.35) !important; }
    html.theme-light .reviews-title { color: #000000 !important; font-weight: 800 !important; }
    html.theme-light .review-item { background: rgba(0,0,0,0.08) !important; border: 3px solid rgba(0,0,0,0.4) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; }
    html.theme-light .review-item:hover { background: rgba(0,0,0,0.12) !important; border-color: rgba(0,0,0,0.5) !important; box-shadow: 0 6px 16px rgba(0,0,0,0.2) !important; }
    html.theme-light .review-user { color: #ea580c !important; font-weight: 800 !important; }
    html.theme-light .review-date { color: rgba(0,0,0,0.75) !important; font-weight: 600 !important; }
    html.theme-light .review-comment { color: #000000 !important; font-weight: 600 !important; line-height: 1.7 !important; }
    html.theme-light .reply-btn { border-color: rgba(0,0,0,0.3) !important; color: rgba(0,0,0,0.7) !important; }
    html.theme-light .reply-btn:hover { background: rgba(0,0,0,0.05) !important; color: #000000 !important; border-color: rgba(0,0,0,0.5) !important; }
    html.theme-light .no-reviews { color: rgba(0,0,0,0.7) !important; font-weight: 600 !important; }
    html.theme-light .review-form { background: rgba(0,0,0,0.08) !important; border: 3px solid rgba(0,0,0,0.4) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; }
    html.theme-light .review-form h3 { color: #ea580c !important; font-weight: 800 !important; }
    html.theme-light .form-group label { color: #000000 !important; font-weight: 700 !important; }
    html.theme-light .form-group input, html.theme-light .form-group textarea { background: #ffffff !important; border: 3px solid rgba(0,0,0,0.45) !important; color: #000000 !important; font-weight: 600 !important; }
    html.theme-light .form-group input::placeholder, html.theme-light .form-group textarea::placeholder { color: rgba(0,0,0,0.6) !important; }
    html.theme-light .form-group input:focus, html.theme-light .form-group textarea:focus { border-color: #ea580c !important; background: #ffffff !important; box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.2) !important; }
    html.theme-light .star-button { color: rgba(0,0,0,0.4) !important; }
    html.theme-light .star-button:hover, html.theme-light .star-button.selected { color: #ea580c !important; }
    html.theme-light #ratingText { color: #000000 !important; font-weight: 700 !important; }
    html.theme-light .form-message.success { background: rgba(34, 197, 94, 0.25) !important; color: #14532d !important; border: 3px solid rgba(34, 197, 94, 0.6) !important; font-weight: 700 !important; }
    html.theme-light .form-message.error { background: rgba(239, 68, 68, 0.25) !important; color: #991b1b !important; border: 3px solid rgba(239, 68, 68, 0.6) !important; font-weight: 700 !important; }
    html.theme-light .reply-form { background: rgba(0,0,0,0.05) !important; border: 2px solid rgba(0,0,0,0.3) !important; }
    html.theme-light .reply-form textarea { background: #ffffff !important; border: 2px solid rgba(0,0,0,0.3) !important; color: #000000 !important; }
    html.theme-light .reply-form textarea:focus { border-color: #667eea !important; }
  `;
  document.head.appendChild(style);
}

// Función para generar HTML de estrellas con validación
function generateStarsHTML(rating) {
  // Limitar rating al rango válido [0,5]
  rating = Math.max(0, Math.min(5, rating || 0));
  
  let starsHTML = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const filledStarSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  const halfStarSVG = '<svg width="14" height="14" viewBox="0 0 24 24"><defs><linearGradient id="half-grad"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="rgba(255,255,255,0.3)"/></linearGradient></defs><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#half-grad)"/></svg>';
  const emptyStarSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  
  for (let i = 0; i < fullStars; i++) {
    starsHTML += `<span class="star-filled">${filledStarSVG}</span>`;
  }
  
  if (hasHalfStar) {
    starsHTML += `<span class="star-half">${halfStarSVG}</span>`;
  }
  
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    starsHTML += `<span class="star-empty">${emptyStarSVG}</span>`;
  }
  
  return starsHTML;
}

// Función para mostrar formulario de respuesta a una reseña
function showReplyForm(reviewDiv, review, projectTitle) {
  // Verificar si ya existe un formulario de respuesta
  const existingForm = reviewDiv.querySelector('.reply-form');
  if (existingForm) {
    existingForm.remove();
    return;
  }
  
  // Verificar si el usuario está autenticado
  const currentUser = currentSupabaseUser?.nombrepersona;
  if (!currentUser) {
    // Mostrar mensaje en lugar de alert
    const loginMessage = document.createElement('div');
    loginMessage.style.cssText = 'background: rgba(255, 99, 71, 0.1); padding: 10px; border-radius: 6px; margin: 8px 0; font-size: 0.85rem; color: rgba(255, 255, 255, 0.8); border-left: 3px solid rgba(255, 99, 71, 0.5);';
    loginMessage.textContent = 'Debes iniciar sesión para responder a comentarios';
    reviewDiv.appendChild(loginMessage);
    setTimeout(() => loginMessage.remove(), 3000);
    return;
  }
  
  const replyForm = document.createElement('div');
  replyForm.className = 'reply-form';
  
  // Crear elementos de forma segura para prevenir XSS
  const replyInfoDiv = document.createElement('div');
  replyInfoDiv.style.cssText = 'background: rgba(102, 126, 234, 0.1); padding: 8px; border-radius: 6px; margin-bottom: 8px; font-size: 0.8rem; color: rgba(255,255,255,0.7);';
  
  const replyInfoText = document.createTextNode('Respondiendo a ');
  const replyInfoStrong = document.createElement('strong');
  replyInfoStrong.style.color = '#facc15';
  replyInfoStrong.textContent = review.usuario || 'Usuario anónimo'; // SEGURIDAD: usar textContent
  
  replyInfoDiv.appendChild(replyInfoText);
  replyInfoDiv.appendChild(replyInfoStrong);
  
  const textarea = document.createElement('textarea');
  textarea.placeholder = 'Escribe tu respuesta...';
  textarea.maxLength = 300;
  
  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = 'font-size: 0.75rem; margin-top: 4px; display: none;';
  
  const buttonsDiv = document.createElement('div');
  buttonsDiv.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';
  
  const submitBtn = document.createElement('button');
  submitBtn.className = 'reply-submit-btn';
  submitBtn.textContent = 'Enviar';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'reply-cancel-btn';
  cancelBtn.textContent = 'Cancelar';
  
  buttonsDiv.appendChild(submitBtn);
  buttonsDiv.appendChild(cancelBtn);
  
  replyForm.appendChild(replyInfoDiv);
  replyForm.appendChild(textarea);
  replyForm.appendChild(messageDiv);
  replyForm.appendChild(buttonsDiv);
  
  // Las referencias ya existen como variables creadas arriba
  
  submitBtn.onclick = async () => {
    const replyText = textarea.value.trim();
    if (!replyText) {
      messageDiv.style.cssText = 'font-size: 0.75rem; margin-top: 4px; display: block; color: rgba(255, 99, 71, 0.8);';
      messageDiv.textContent = 'Por favor escribe una respuesta';
      return;
    }
    
    // Deshabilitar botón durante envío
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    messageDiv.style.display = 'none';
    
    // Preparar los datos de respondidoA con toda la información del comentario original
    const respondidoA = {
      nombre: review.usuario || 'Usuario anónimo',
      fecha: review.fecha || new Date().toISOString(),
      numero: review.numero || reviewDiv.dataset.commentNumber || 0,
      comentario: review.comentario || ''
    };
    
    console.log('📝 Enviando respuesta con respondidoA:', respondidoA);
    
    // Guardar la respuesta en Supabase
    const resultado = await agregarComentarioEnSupabase(projectTitle, {
      calificacion: 0, // Las respuestas no tienen calificación
      comentario: replyText,
      nombre: currentUser,
      respondidoA: respondidoA
    });
    
    if (resultado) {
      // Remover el formulario y recargar reseñas sin alert
      replyForm.remove();
      // Recargar las reseñas para mostrar la nueva respuesta
      await addReviewsToPanel(projectTitle);
    } else {
      messageDiv.style.cssText = 'font-size: 0.75rem; margin-top: 4px; display: block; color: rgba(255, 99, 71, 0.8);';
      messageDiv.textContent = 'Error al enviar. Intenta de nuevo.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar';
    }
  };
  
  cancelBtn.onclick = () => {
    replyForm.remove();
  };
  
  reviewDiv.appendChild(replyForm);
  textarea.focus();
}

// Función para crear el formulario de reseñas con autenticación
function createReviewForm(projectTitle) {
  const form = document.createElement('div');
  form.className = 'review-form';
  
  // Verificar si el usuario está autenticado
  const isAuthenticated = currentSupabaseUser && currentSupabaseUser.nombrepersona;
  
  if (!isAuthenticated) {
    // Mostrar mensaje para iniciar sesión
    const h3 = document.createElement('h3');
    h3.textContent = 'Escribir una reseña';
    
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = 'text-align: center; padding: 20px; background: rgba(255, 255, 255, 0.03); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);';
    
    const messageText = document.createElement('p');
    messageText.style.cssText = 'color: var(--text-secondary); margin-bottom: 12px; font-size: 14px;';
    messageText.textContent = 'Debes iniciar sesión para dejar una reseña';
    
    const loginBtn = document.createElement('button');
    loginBtn.style.cssText = 'background: var(--accent); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;';
    loginBtn.textContent = 'Iniciar sesión';
    loginBtn.onclick = () => {
      // Guardar la sección actual (apps) en localStorage para redirección
      localStorage.setItem('redirect_after_login', 'apps');
      // Redirigir a la página de inicio de sesión
      window.location.href = '/Creator/index.html';
    };
    
    messageDiv.appendChild(messageText);
    messageDiv.appendChild(loginBtn);
    form.appendChild(h3);
    form.appendChild(messageDiv);
    
    return form;
  }
  
  // Usuario autenticado - mostrar formulario
  const userName = currentSupabaseUser.nombrepersona;
  
  form.innerHTML = `
    <h3>Escribir una reseña</h3>
    <form id="reviewForm">
      <div class="form-group">
        <label for="userComment">Comentario:</label>
        <textarea id="userComment" name="userComment" required maxlength="500" placeholder="Comparte tu experiencia con este proyecto..."></textarea>
      </div>
      <div class="form-group">
        <label>Calificación:</label>
        <div class="rating-input" id="starRating">
          <button type="button" class="star-button" data-rating="1"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>
          <button type="button" class="star-button" data-rating="2"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>
          <button type="button" class="star-button" data-rating="3"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>
          <button type="button" class="star-button" data-rating="4"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>
          <button type="button" class="star-button" data-rating="5"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>
          <span id="ratingText" style="margin-left: 10px; color: var(--text-secondary); font-size: 0.85rem;">Selecciona una calificación</span>
        </div>
      </div>
      <button type="submit" class="submit-btn">Enviar Reseña</button>
      <div id="formMessage"></div>
    </form>
  `;
  
  const starButtons = form.querySelectorAll('.star-button');
  const ratingText = form.querySelector('#ratingText');
  let selectedRating = 0;
  
  // Función para resetear el rating
  form.resetRating = () => {
    selectedRating = 0;
    updateStarRating(starButtons, selectedRating, ratingText);
  };
  
  starButtons.forEach(button => {
    button.addEventListener('click', () => {
      selectedRating = parseInt(button.dataset.rating);
      updateStarRating(starButtons, selectedRating, ratingText);
    });
    
    button.addEventListener('mouseover', () => {
      const hoverRating = parseInt(button.dataset.rating);
      updateStarRating(starButtons, hoverRating, ratingText, true);
    });
  });
  
  form.addEventListener('mouseleave', () => {
    updateStarRating(starButtons, selectedRating, ratingText);
  });
  
  // Manejador de envío
  const reviewForm = form.querySelector('#reviewForm');
  reviewForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitReview(projectTitle, selectedRating, form);
  });
  
  return form;
}

// Función para actualizar la visualización de estrellas
function updateStarRating(starButtons, rating, ratingText, isHover = false) {
  starButtons.forEach((button, index) => {
    if (index < rating) {
      button.classList.add('selected');
    } else {
      button.classList.remove('selected');
    }
  });
  
  if (rating > 0) {
    const ratingLabels = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
    ratingText.textContent = `${rating}/5 - ${ratingLabels[rating]}`;
  } else {
    ratingText.textContent = 'Selecciona una calificación';
  }
}

// Función para enviar reseña al JSON Bin con validación y seguridad mejorada
async function submitReview(projectTitle, rating, formElement) {
  const userName = currentSupabaseUser?.nombrepersona || 'Usuario anónimo';
  const userComment = formElement.querySelector('#userComment').value.trim();
  const submitBtn = formElement.querySelector('.submit-btn');
  const messageDiv = formElement.querySelector('#formMessage');
  
  // Validación
  if (!userComment || rating === 0) {
    showFormMessage(messageDiv, 'Por favor completa el comentario y selecciona una calificación.', 'error');
    return;
  }
  
  // Validación adicional de seguridad
  if (userName.length > 50 || userComment.length > 500) {
    showFormMessage(messageDiv, 'Nombre o comentario demasiado largo.', 'error');
    return;
  }
  
  // Limitar calificación a rango válido
  rating = Math.max(1, Math.min(5, rating));
  
  // Deshabilitar botón durante envío
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';
  
  // Crear nueva reseña con datos sanitizados (definir fuera del try para usarla en catch)
  const reviewDate = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
  const newReview = {
    usuario: userName.substring(0, 50), // Limitar longitud
    proyecto: projectTitle,
    comentario: userComment.substring(0, 500), // Limitar longitud  
    estrellas: rating,
    fecha: reviewDate,
    // Agregar ID único para evitar duplicados incluso con mismo contenido
    _reviewId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  try {
    // Guardar comentario en Supabase
    const resultado = await agregarComentarioEnSupabase(projectTitle, {
      calificacion: rating,
      comentario: userComment,
      nombre: userName,
      respondidoA: null
    });
    
    if (resultado) {
      showFormMessage(messageDiv, 'Tu reseña se ha enviado correctamente. ¡Gracias por tu feedback!', 'success');
      
      // Limpiar formulario y resetear rating
      formElement.querySelector('#reviewForm').reset();
      formElement.querySelectorAll('.star-button').forEach(btn => btn.classList.remove('selected'));
      formElement.querySelector('#ratingText').textContent = 'Selecciona una calificación';
      
      if (formElement.resetRating) {
        formElement.resetRating();
      }
      
      // Invalidar caché de reseñas y actualizar vista inmediatamente
      invalidateReviewsCache();
      setTimeout(async () => {
        await addReviewsToPanel(projectTitle);
      }, 1500);
      
    } else {
      showFormMessage(messageDiv, 'Hubo un error al enviar tu reseña. Por favor intenta de nuevo.', 'error');
    }
    
  } catch (error) {
    console.error('Error enviando reseña:', error);
    
    // Como fallback, guardar localmente
    const fallbackReview = {
      usuario: userName.substring(0, 50),
      proyecto: projectTitle,
      comentario: userComment.substring(0, 500),
      estrellas: rating,
      fecha: reviewDate,
      _isLocal: true,
      _originalDate: reviewDate,
      _reviewId: newReview._reviewId // Usar el mismo ID
    };
    
    try {
      let localReviews = JSON.parse(localStorage.getItem('local_reviews') || '[]');
      localReviews.unshift(fallbackReview);
      localStorage.setItem('local_reviews', JSON.stringify(localReviews));
      
      showFormMessage(messageDiv, 'Tu reseña se ha guardado localmente. Hubo un problema con el servidor.', 'success');
      
      // Limpiar formulario
      formElement.querySelector('#reviewForm').reset();
      formElement.querySelectorAll('.star-button').forEach(btn => btn.classList.remove('selected'));
      formElement.querySelector('#ratingText').textContent = 'Selecciona una calificación';
      
      if (formElement.resetRating) {
        formElement.resetRating();
      }
      
      // Invalidar caché de reseñas y actualizar vista inmediatamente
      invalidateReviewsCache();
      await addReviewsToPanel(projectTitle);
      
    } catch(fallbackError) {
      showFormMessage(messageDiv, 'Hubo un error al enviar tu reseña. Por favor intenta de nuevo.', 'error');
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar Reseña';
  }
}

// Función para mostrar mensajes en el formulario
function showFormMessage(messageDiv, text, type) {
  messageDiv.textContent = text;
  messageDiv.className = `form-message ${type}`;
  messageDiv.style.display = 'block';
  
  // Auto ocultar después de 5 segundos
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 5000);
}

// Variable para evitar llamadas duplicadas
let addingReviews = false;

// Set para rastrear comentarios expandidos
const expandedReplies = new Set();

// Función para agregar reseñas al panel
async function addReviewsToPanel(projectTitle) {
  // Prevenir llamadas simultáneas
  if (addingReviews) {
    console.log('[Reviews] Ya se están agregando reseñas, ignorando llamada duplicada');
    return;
  }
  
  addingReviews = true;
  
  try {
    console.log('[Reviews] Agregando reseñas al panel para:', projectTitle);
    const panelBody = document.querySelector('.panel-body');
    if (!panelBody) {
      console.warn('[Reviews] No se encontró panel-body');
      return;
    }
    
    
    // Asegurar que los estilos estén cargados
    addReviewStyles();
    
    // Remover sección de reseñas anterior si existe (evitar duplicados)
    const existingSection = document.getElementById('reviewsSection');
    if (existingSection) {
      console.log('[Reviews] Removiendo sección anterior para evitar duplicados');
      existingSection.remove();
    }
    
    const allReviews = await loadReviewsData();
    const projectReviews = allReviews.filter(review => {
      // Si no tiene proyecto específico, asumir que es para el proyecto actual
      // (para compatibilidad con diferentes esquemas de datos)
      if (!review.proyecto) {
        return true; // Incluir reseñas sin proyecto específico
      }
      return review.proyecto.toLowerCase() === projectTitle.toLowerCase();
    });
    
    const reviewsSection = document.createElement('div');
    reviewsSection.id = 'reviewsSection';
    reviewsSection.className = 'reviews-section';
    
    const reviewsTitle = document.createElement('div');
    reviewsTitle.className = 'reviews-title';
    reviewsTitle.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-right: 6px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Reseñas y Comentarios';
    
    reviewsSection.appendChild(reviewsTitle);
    
    // Verificar si el usuario actual ya comentó
    const currentUser = getCurrentUserName();
    if (currentUser) {
      const userHasCommented = await hasUserCommented(projectTitle, currentUser);
      
      if (!userHasCommented) {
        // Si no ha comentado, mostrar el formulario
        const reviewForm = createReviewForm(projectTitle);
        reviewsSection.appendChild(reviewForm);
      }
      // Si ya comentó, no mostrar nada (queda vacío)
    } else {
      // Si no hay usuario guardado, mostrar el formulario
      const reviewForm = createReviewForm(projectTitle);
      reviewsSection.appendChild(reviewForm);
    }
    
    const reviewsContainer = document.createElement('div');
    reviewsContainer.className = 'reviews-container';
    
    if (projectReviews.length === 0) {
      const noReviewsDiv = document.createElement('div');
      noReviewsDiv.className = 'no-reviews';
      noReviewsDiv.textContent = 'No hay reseñas disponibles para este proyecto. ¡Sé el primero en escribir una!';
      reviewsContainer.appendChild(noReviewsDiv);
    } else {
      // Separar comentarios principales de respuestas
      const topLevelComments = projectReviews.filter(review => !review.respondidoA);
      const replies = projectReviews.filter(review => review.respondidoA);
      
      // Crear un mapa de respuestas por número de comentario
      const repliesByComment = {};
      replies.forEach(reply => {
        const parentNumber = reply.respondidoA?.numero;
        if (parentNumber) {
          if (!repliesByComment[parentNumber]) {
            repliesByComment[parentNumber] = [];
          }
          repliesByComment[parentNumber].push(reply);
        }
      });
      
      // Renderizar solo los comentarios principales
      topLevelComments.forEach((review, index) => {
        const commentNumber = review.numero || (index + 1);
        const reviewDate = review.fecha ? new Date(review.fecha).toLocaleDateString() : 'Fecha no disponible';
        
        // Contenedor del comentario principal
        const commentContainer = document.createElement('div');
        commentContainer.className = 'comment-container';
        commentContainer.dataset.commentNumber = commentNumber;
        
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-item';
        reviewDiv.dataset.commentNumber = commentNumber;
        reviewDiv.dataset.commentUser = review.usuario || 'Usuario anónimo';
        reviewDiv.dataset.commentDate = review.fecha || '';
        reviewDiv.dataset.commentText = review.comentario || '';
        
        // Crear elementos de forma segura para evitar XSS
        const reviewHeader = document.createElement('div');
        reviewHeader.className = 'review-header';
        
        const reviewUser = document.createElement('div');
        reviewUser.className = 'review-user';
        reviewUser.textContent = (review.usuario || 'Usuario anónimo').substring(0, 50);
        
        const reviewDateEl = document.createElement('div');
        reviewDateEl.className = 'review-date';
        reviewDateEl.textContent = reviewDate;
        
        // Solo mostrar estrellas si tiene calificación
        if (review.estrellas) {
          const reviewStars = document.createElement('div');
          reviewStars.className = 'review-stars';
          reviewStars.innerHTML = generateStarsHTML(review.estrellas || 0);
          reviewDiv.appendChild(reviewStars);
        }
        
        const reviewComment = document.createElement('div');
        reviewComment.className = 'review-comment';
        reviewComment.textContent = (review.comentario || 'Sin comentario').substring(0, 500);
        
        // Contenedor de acciones para botones
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'comment-actions';
        actionsContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;';
        
        // Botón de responder
        const replyBtn = document.createElement('button');
        replyBtn.className = 'reply-btn';
        replyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10h10a8 8 0 0 1 8 8v2M3 10l6 6m-6-6l6-6"/></svg> Responder';
        replyBtn.onclick = () => showReplyForm(reviewDiv, review, projectTitle);
        actionsContainer.appendChild(replyBtn);
        
        // Verificar si hay respuestas para este comentario
        const commentReplies = repliesByComment[commentNumber] || [];
        let toggleRepliesBtn = null;
        let repliesContainer = null;
        
        if (commentReplies.length > 0) {
          // Crear clave única por proyecto y comentario
          const commentKey = `${projectTitle}#${commentNumber}`;
          
          toggleRepliesBtn = document.createElement('button');
          toggleRepliesBtn.className = 'toggle-replies-btn';
          toggleRepliesBtn.setAttribute('aria-expanded', 'false');
          toggleRepliesBtn.setAttribute('aria-controls', `replies-${commentNumber}`);
          
          const isExpanded = expandedReplies.has(commentKey);
          toggleRepliesBtn.setAttribute('aria-expanded', String(isExpanded));
          
          const svgIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px; transition: transform 0.2s;"><polyline points="6 9 12 15 18 9"/></svg>';
          toggleRepliesBtn.innerHTML = svgIcon + `Ver respuestas (${commentReplies.length})`;
          
          // Añadir el botón al contenedor de acciones
          actionsContainer.appendChild(toggleRepliesBtn);
          
          repliesContainer = document.createElement('div');
          repliesContainer.id = `replies-${commentNumber}`;
          repliesContainer.className = 'replies-container';
          repliesContainer.style.display = isExpanded ? 'block' : 'none';
          
          // Renderizar las respuestas
          commentReplies.forEach(reply => {
            const replyDiv = document.createElement('div');
            replyDiv.className = 'review-item reply-item';
            
            const replyInfo = document.createElement('div');
            replyInfo.style.cssText = 'background: rgba(102, 126, 234, 0.1); padding: 6px 10px; border-radius: 6px; margin-bottom: 8px; font-size: 0.75rem; color: rgba(255,255,255,0.6);';
            
            const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgIcon.setAttribute('width', '12');
            svgIcon.setAttribute('height', '12');
            svgIcon.setAttribute('viewBox', '0 0 24 24');
            svgIcon.setAttribute('fill', 'none');
            svgIcon.setAttribute('stroke', 'currentColor');
            svgIcon.setAttribute('stroke-width', '2');
            svgIcon.style.cssText = 'vertical-align: middle; margin-right: 4px;';
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M3 10h10a8 8 0 0 1 8 8v2M3 10l6 6m-6-6l6-6');
            svgIcon.appendChild(path);
            
            const replyText = document.createTextNode('Respondiendo a ');
            const strongName = document.createElement('strong');
            strongName.style.color = '#facc15';
            strongName.textContent = reply.respondidoA.nombre;
            
            replyInfo.appendChild(svgIcon);
            replyInfo.appendChild(replyText);
            replyInfo.appendChild(strongName);
            
            const replyHeader = document.createElement('div');
            replyHeader.className = 'review-header';
            
            const replyUser = document.createElement('div');
            replyUser.className = 'review-user';
            replyUser.textContent = (reply.usuario || 'Usuario anónimo').substring(0, 50);
            
            const replyDate = document.createElement('div');
            replyDate.className = 'review-date';
            replyDate.textContent = reply.fecha ? new Date(reply.fecha).toLocaleDateString() : 'Fecha no disponible';
            
            const replyComment = document.createElement('div');
            replyComment.className = 'review-comment';
            replyComment.textContent = (reply.comentario || 'Sin comentario').substring(0, 500);
            
            replyHeader.appendChild(replyUser);
            replyHeader.appendChild(replyDate);
            
            replyDiv.appendChild(replyInfo);
            replyDiv.appendChild(replyHeader);
            replyDiv.appendChild(replyComment);
            
            repliesContainer.appendChild(replyDiv);
          });
          
          // Toggle expandir/colapsar respuestas
          toggleRepliesBtn.onclick = () => {
            const commentKey = `${projectTitle}#${commentNumber}`;
            const isCurrentlyExpanded = expandedReplies.has(commentKey);
            const svg = toggleRepliesBtn.querySelector('svg');
            
            if (isCurrentlyExpanded) {
              expandedReplies.delete(commentKey);
              repliesContainer.style.display = 'none';
              toggleRepliesBtn.setAttribute('aria-expanded', 'false');
              if (svg) svg.style.transform = 'rotate(0deg)';
            } else {
              expandedReplies.add(commentKey);
              repliesContainer.style.display = 'block';
              toggleRepliesBtn.setAttribute('aria-expanded', 'true');
              if (svg) svg.style.transform = 'rotate(180deg)';
            }
          };
          
          // Aplicar rotación inicial si está expandido
          if (isExpanded) {
            const svg = toggleRepliesBtn.querySelector('svg');
            if (svg) svg.style.transform = 'rotate(180deg)';
          }
        }
        
        reviewHeader.appendChild(reviewUser);
        reviewHeader.appendChild(reviewDateEl);
        
        reviewDiv.appendChild(reviewHeader);
        reviewDiv.appendChild(reviewComment);
        reviewDiv.appendChild(actionsContainer);
        
        commentContainer.appendChild(reviewDiv);
        
        // Agregar contenedor de respuestas si existe
        if (repliesContainer) {
          commentContainer.appendChild(repliesContainer);
        }
        
        reviewsContainer.appendChild(commentContainer);
      });
    }
    
    reviewsSection.appendChild(reviewsContainer);
    
    // Verificar si el proyecto pertenece al usuario actual
    const loggedInUser = localStorage.getItem('currentUser');
    console.log('[Reviews] Usuario actual:', loggedInUser);
    console.log('[Reviews] Título del proyecto:', projectTitle);
    
    if (loggedInUser) {
      const allUserProjects = JSON.parse(localStorage.getItem('user_projects') || '{}');
      const userProjects = allUserProjects[loggedInUser] || [];
      console.log('[Reviews] Proyectos del usuario:', userProjects);
      
      // Verificar si este proyecto pertenece al usuario
      const isOwner = userProjects.some(p => 
        (p.title || '').toLowerCase() === projectTitle.toLowerCase()
      );
      
      console.log('[Reviews] ¿Es propietario?:', isOwner);
    }
    
    panelBody.appendChild(reviewsSection);
    
    const panelEditBtn = document.getElementById('panelEditBtn');
    if (panelEditBtn) {
      panelBody.appendChild(panelEditBtn);
    }
    
  } catch (error) {
    console.error('[Reviews] Error agregando reseñas al panel:', error);
  } finally {
    addingReviews = false;
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  addReviewStyles();
  console.log('[Reviews] Sistema de reseñas inicializado');
});

// Exponer funciones globalmente
window.addReviewsToPanel = addReviewsToPanel;
window.loadReviewsData = loadReviewsData;class PromotionsManager {
  constructor() {
    this.config = null;
    this.viewsData = null;
    this.initialized = false;
  }

  async init() {
    try {
      const configResponse = await fetch('promotions-config.json');
      this.config = await configResponse.json();
      
      this.config.promotions = this.config.promotions.map((promo, index) => {
        if (!promo.id) {
          promo.id = this.generateId(promo.projectName, index);
        }
        return promo;
      });
      
      this.loadViewsFromLocalStorage();
      
      if (!this.viewsData || !this.viewsData.dailyViews) {
        this.viewsData = { dailyViews: [] };
        console.log('[Promociones] Datos de visualización inicializados vacíos');
      } else {
        console.log('[Promociones] Datos cargados desde localStorage:', this.viewsData.dailyViews.length, 'registros');
      }
      
      this.initialized = true;
      
      this.resetDailyCountersIfNeeded();
      
      console.log('[Promociones] Sistema inicializado con', this.config.promotions.length, 'promociones');
      return true;
    } catch (error) {
      console.error('[Promociones] Error al inicializar:', error);
      return false;
    }
  }

  generateId(projectName, index) {
    const slug = projectName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return `promo_${slug}_${index}`;
  }

  getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  resetDailyCountersIfNeeded() {
    const today = this.getTodayString();
    
    this.viewsData.dailyViews = this.viewsData.dailyViews.filter(view => {
      return view.date === today;
    });

    this.saveViews();
  }

  async saveViews() {
    try {
      localStorage.setItem('promotions_views', JSON.stringify(this.viewsData));
    } catch (error) {
      console.error('[Promociones] Error al guardar visualizaciones:', error);
    }
  }

  loadViewsFromLocalStorage() {
    try {
      const saved = localStorage.getItem('promotions_views');
      if (saved) {
        this.viewsData = JSON.parse(saved);
      }
    } catch (error) {
      console.error('[Promociones] Error al cargar desde localStorage:', error);
    }
  }

  isPromotionActive(promotion) {
    if (!promotion.active) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(promotion.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(promotion.endDate);
    endDate.setHours(23, 59, 59, 999);

    return today >= startDate && today <= endDate;
  }

  getViewCount(promotionId) {
    const today = this.getTodayString();
    const viewRecord = this.viewsData.dailyViews.find(
      v => v.promotionId === promotionId && v.date === today
    );
    return viewRecord ? viewRecord.count : 0;
  }

  hasReachedLimit(promotionId, dailyLimit) {
    const currentViews = this.getViewCount(promotionId);
    return currentViews >= dailyLimit;
  }

  incrementViewCount(promotionId) {
    const today = this.getTodayString();
    const viewRecord = this.viewsData.dailyViews.find(
      v => v.promotionId === promotionId && v.date === today
    );

    if (viewRecord) {
      viewRecord.count++;
    } else {
      this.viewsData.dailyViews.push({
        promotionId: promotionId,
        date: today,
        count: 1,
        lastResetAt: new Date().toISOString()
      });
    }

    this.saveViews();
  }

  getActivePromotions() {
    if (!this.initialized) {
      console.warn('[Promociones] Sistema no inicializado');
      return [];
    }

    const activePromotions = this.config.promotions
      .filter(promo => {
        const isActive = this.isPromotionActive(promo);
        const hasReachedLimit = this.hasReachedLimit(promo.id, promo.dailyViewLimit);
        
        return isActive && !hasReachedLimit;
      })
      .sort((a, b) => (a.priority || 999) - (b.priority || 999));

    activePromotions.forEach(promo => {
      this.incrementViewCount(promo.id);
    });

    const viewStats = activePromotions.map(p => ({
      id: p.id,
      views: this.getViewCount(p.id),
      limit: p.dailyViewLimit
    }));

    console.log('[Promociones] Promociones activas:', activePromotions.length);
    console.log('[Promociones] Estadísticas detalladas:', viewStats.map(v => `${v.id}: ${v.views}/${v.limit}`).join(', '));

    return activePromotions;
  }

  getPromotionStats() {
    if (!this.initialized) return [];

    return this.config.promotions.map(promo => {
      const viewCount = this.getViewCount(promo.id);
      const isActive = this.isPromotionActive(promo);
      const hasReachedLimit = this.hasReachedLimit(promo.id, promo.dailyViewLimit);

      return {
        id: promo.id,
        projectName: promo.projectName,
        promoLabel: promo.promoLabel,
        startDate: promo.startDate,
        endDate: promo.endDate,
        dailyViewLimit: promo.dailyViewLimit,
        currentViews: viewCount,
        isActive: isActive,
        hasReachedLimit: hasReachedLimit,
        status: !isActive ? 'Inactiva' : hasReachedLimit ? 'Límite alcanzado' : 'Activa'
      };
    });
  }
}

const promotionsManager = new PromotionsManager();
window.promotionsManager = promotionsManager;
// ==========================================
// INTEGRACIÓN CON SUPABASE PARA DEVCENTER
// ==========================================
// Sistema completo de gestión de usuarios con Supabase
//
// CONFIGURACIÓN:
// Las credenciales se cargan desde env-loader.js
// La "anon key" de Supabase es segura para uso público en el frontend
// porque Supabase protege los datos mediante Row Level Security (RLS)
// ==========================================

class SupabaseIntegration {
  constructor() {
    this.supabase = null;
    this.currentUserData = null;
    this.isInitialized = false;
    this.tableName = 'personas';
  }

  // Obtener configuración desde Secrets de Replit
  getConfig() {
    return {
      url: typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '',
      anonKey: typeof SUPABASE_ANON_KEY !== 'undefined' ? SUPABASE_ANON_KEY : ''
    };
  }

  // Verificar si la configuración está completa
  isConfigured() {
    const config = this.getConfig();
    return config.url && config.anonKey;
  }

  // Inicializar la conexión con Supabase
  async initialize() {
    try {
      // Verificar configuración
      if (!this.isConfigured()) {
        console.warn('⚠️ Supabase no configurado. Configura SUPABASE_URL y SUPABASE_ANON_KEY en Secrets');
        return false;
      }

      const config = this.getConfig();

      // Cargar la librería de Supabase desde CDN
      if (!window.supabase) {
        await this.loadSupabaseLibrary();
      }

      // Crear cliente de Supabase
      const { createClient } = window.supabase;
      this.supabase = createClient(config.url, config.anonKey);

      this.isInitialized = true;
      console.log('✅ Supabase inicializado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando Supabase:', error);
      return false;
    }
  }

  // Cargar la librería de Supabase dinámicamente
  async loadSupabaseLibrary() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Obtener usuario en Supabase - SOLO LEER (NO crear automáticamente)
  async getOrCreateUser(userName, userId = null) {
    if (!this.isInitialized) {
      console.warn('⚠️ Supabase no está inicializado');
      return null;
    }

    if (!userName || userName.trim() === '') {
      console.warn('⚠️ Nombre de usuario vacío');
      return null;
    }

    try {
      // Buscar usuario por nombrepersona
      const result = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('nombrepersona', userName.trim())
        .maybeSingle();
      
      const data = result.data;
      const error = result.error;

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Si el usuario existe, devolverlo
      if (data) {
        console.log('✅ Usuario encontrado en Supabase:', userName);
        this.currentUserData = data;
        return data;
      }

      // NO crear usuario automáticamente - solo cuando se registra
      console.log(`⚠️ Usuario ${userName} no encontrado en Supabase (se creará al registrarse)`);
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo usuario:', error);
      return null;
    }
  }

  // Actualizar el límite de uso de IA
  async updateUsageLimit(userName, increment = 5) {
    if (!this.isInitialized) return false;

    try {
      // Obtener límite actual
      const userData = await this.getOrCreateUser(userName);
      if (!userData) return false;

      const newLimit = Math.min((userData.limite || 0) + increment, 100);

      // Actualizar en Supabase
      const { error } = await this.supabase
        .from(this.tableName)
        .update({ limite: newLimit })
        .eq('nombrepersona', userName.trim());

      if (error) throw error;

      console.log(`✅ Límite actualizado para ${userName}: ${newLimit}%`);
      
      // Actualizar cache local
      if (this.currentUserData) {
        this.currentUserData.limite = newLimit;
      }

      return true;
    } catch (error) {
      console.error('❌ Error actualizando límite:', error);
      return false;
    }
  }

  // Agregar proyecto al usuario
  async addProject(userName, project) {
    if (!this.isInitialized) return false;

    try {
      const userData = await this.getOrCreateUser(userName);
      if (!userData) return false;

      const proyectos = userData.proyectos || [];
      
      // Validar que no exceda el límite de 10 proyectos
      if (proyectos.length >= 10) {
        console.warn('⚠️ El usuario ya tiene 10 proyectos (máximo alcanzado)');
        return false;
      }

      // Agregar nuevo proyecto con número automático - NUNCA guardar código
      const newProject = {
        numeroProyecto: proyectos.length + 1,
        titulo: project.titulo || '',
        inicialesTitulo: project.inicialesTitulo || this.generateInitials(project.titulo),
        tags: project.tags || '',
        descripcion: project.descripcion || '',
        link: project.link || ''
      };

      proyectos.push(newProject);

      // SIEMPRE eliminar código antes de guardar - código solo va en backup slots
      const proyectosParaGuardar = proyectos.map(p => {
        const { code, ...proyectoSinCode } = p;
        return proyectoSinCode;
      });

      // Actualizar en Supabase
      const { error } = await this.supabase
        .from(this.tableName)
        .update({ proyectos: proyectosParaGuardar })
        .eq('nombrepersona', userName.trim());

      if (error) throw error;

      console.log(`✅ Proyecto agregado para ${userName}:`, newProject.titulo);
      
      // Actualizar cache local
      if (this.currentUserData) {
        this.currentUserData.proyectos = proyectos;
      }

      return true;
    } catch (error) {
      console.error('❌ Error agregando proyecto:', error);
      return false;
    }
  }

  // Generar iniciales del título
  generateInitials(titulo) {
    if (!titulo) return '??';
    const words = titulo.trim().split(' ');
    if (words.length === 1) {
      return titulo.substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  // Obtener datos del usuario actual
  getCurrentUserData() {
    return this.currentUserData;
  }

  // Renderizar plan del usuario en el sidebar
  renderUserPlan(userData) {
    if (!userData) return;

    const planTitle = document.getElementById('userPlanTitle');
    const appsCount = document.getElementById('userAppsCount');
    const agentUsage = document.getElementById('userAgentUsage');
    const upgradeAgentBtn = document.getElementById('upgradeAgentBtn');
    
    // Obtener el plan del usuario desde PLANS_CONFIG (con fallback seguro)
    const statusCode = Math.min(userData.status || 0, 2);
    const userPlan = PLANS_CONFIG[statusCode] || PLANS_CONFIG[0];

    if (planTitle && userPlan) {
      planTitle.textContent = `Plan ${userPlan.name}`;
    }

    if (appsCount && userPlan) {
      const projectCount = userData.proyectos ? userData.proyectos.length : 0;
      appsCount.textContent = `${projectCount}/${userPlan.maxApps} created`;
    }

    if (agentUsage) {
      const limite = userData.limite || 0;
      agentUsage.textContent = `${limite}% used`;
    }
    
    // Ocultar botón de Upgrade para usuarios Ultimate (status >= 2)
    if (upgradeAgentBtn) {
      if (statusCode >= 2) {
        upgradeAgentBtn.style.display = 'none';
      } else {
        upgradeAgentBtn.style.display = '';
      }
    }

    console.log(`✅ Sidebar actualizado - Plan: ${userPlan?.name}, Apps: ${userData.proyectos?.length || 0}/${userPlan?.maxApps}`);
  }

  // Renderizar proyectos del usuario en la sección Apps
  renderUserProjects(userData, containerId = 'appsGrid') {
    const container = document.getElementById(containerId);
    if (!container || !userData) return;

    const proyectos = userData.proyectos || [];

    if (proyectos.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 60px 20px; text-align: center;">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 20px; opacity: 0.3;">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="9" y1="9" x2="15" y2="9"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <h3 style="font-size: 1.3rem; margin-bottom: 10px; color: var(--text-primary);">No tienes proyectos guardados</h3>
          <p style="color: var(--text-secondary);">Crea tu primer proyecto para comenzar</p>
        </div>
      `;
      return;
    }

    // Renderizar proyectos
    container.innerHTML = proyectos.map(proyecto => `
      <div class="project-card" data-project-number="${proyecto.numeroProyecto}">
        <div class="project-header">
          <div class="project-initials">${proyecto.inicialesTitulo || this.generateInitials(proyecto.titulo)}</div>
          <div class="project-info">
            <h3 class="project-title">${proyecto.titulo}</h3>
            <p class="project-description">${proyecto.descripcion || ''}</p>
          </div>
        </div>
        ${proyecto.tags ? `<div class="project-tags"><small>Tags: ${proyecto.tags}</small></div>` : ''}
        <div class="project-footer">
          ${proyecto.link ? `<a href="${proyecto.link}" target="_blank" class="project-link">Ver Proyecto →</a>` : ''}
        </div>
      </div>
    `).join('');
  }

  // Actualizar greeting con nombre de usuario
  setGreetingUsername(name) {
    const usernameSpan = document.getElementById('usernameSpan');
    if (usernameSpan && name) {
      usernameSpan.textContent = name;
      // Guardar en localStorage para persistencia
      localStorage.setItem('current_user_name', name);
      console.log('✅ Greeting actualizado con nombre:', name);
    }
  }

  // Actualizar UI completa del usuario
  async updateUserUI(userName, userId = null) {
    if (!userName) {
      console.warn('⚠️ No hay nombre de usuario para actualizar UI');
      return;
    }

    const userData = await this.getOrCreateUser(userName, userId);
    if (!userData) {
      console.warn('⚠️ No se pudo obtener datos del usuario');
      return;
    }

    // Actualizar greeting con nombre de usuario
    this.setGreetingUsername(userName);

    // Actualizar plan en sidebar
    this.renderUserPlan(userData);

    // No renderizar proyectos aquí, solo cuando se navegue a Apps
    console.log('✅ UI de usuario actualizada');
  }
}

// Crear instancia global
window.supabaseIntegration = new SupabaseIntegration();

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  const initialized = await window.supabaseIntegration.initialize();
  
  if (initialized) {
    // Verificar sesión de Supabase Auth (NO localStorage)
    const { data: { session } } = await window.supabaseIntegration.supabase.auth.getSession();
    
    if (session?.user) {
      try {
        const userEmail = session.user.email;
        
        // Obtener username desde la tabla "cuentas" usando email
        const { data: cuentaData } = await window.supabaseIntegration.supabase
          .from('cuentas')
          .select('usuario')
          .eq('email', userEmail)
          .maybeSingle();
        
        if (cuentaData?.usuario) {
          const userName = cuentaData.usuario;
          await window.supabaseIntegration.updateUserUI(userName);
        }
      } catch (e) {
        console.error('Error al verificar sesión:', e);
      }
    } else {
      // Si no hay sesión activa, intentar cargar nombre de localStorage
      const cachedName = localStorage.getItem('current_user_name');
      if (cachedName) {
        window.supabaseIntegration.setGreetingUsername(cachedName);
        console.log('✅ Greeting cargado desde caché:', cachedName);
      }
    }
  }
});

// Exponer funciones útiles globalmente
window.trackAIUsage = async (increment = 5) => {
  // Primero intentar obtener el nombre de localStorage
  const nombreUsuario = localStorage.getItem('supabase_nombrepersona') || localStorage.getItem('devcenter_user');
  
  if (nombreUsuario) {
    return await window.supabaseIntegration.updateUsageLimit(nombreUsuario, increment);
  }
  
  // Si no hay en localStorage, intentar desde sesión de Supabase
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.user) {
    try {
      const userEmail = session.user.email;
      
      // Obtener username desde la tabla "cuentas" usando email
      const { data: cuentaData } = await supabase
        .from('cuentas')
        .select('usuario')
        .eq('email', userEmail)
        .maybeSingle();
      
      if (cuentaData?.usuario) {
        return await window.supabaseIntegration.updateUsageLimit(cuentaData.usuario, increment);
      }
    } catch (e) {
      console.error('Error al obtener usuario:', e);
    }
  }
  return false;
};

console.log('📦 Supabase Integration cargado');

// ===== SIDEBAR TOGGLE =====
// NOTA: El código de sidebar toggle ahora está en index.html
// Este código antiguo ha sido comentado para evitar conflictos

/*
document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.getElementById('mainSidebar');
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  const openBtn = document.getElementById('sidebarOpenBtn');
  const mainContent = document.querySelector('.main-content');
  
  if (!sidebar || !toggleBtn || !openBtn) {
    console.warn('⚠️ No se encontraron elementos del sidebar toggle');
    return;
  }
  
  function closeSidebar() {
    sidebar.classList.add('sidebar-collapsed');
    openBtn.classList.add('visible');
    
    if (mainContent) {
      mainContent.style.marginLeft = '0';
    }
    
    const svg = toggleBtn.querySelector('svg path');
    if (svg) {
      svg.setAttribute('d', 'M9 18l6-6-6-6');
    }
    toggleBtn.title = 'Abrir panel';
    
    console.log('🔒 Sidebar cerrado');
  }
  
  function openSidebar() {
    sidebar.classList.remove('sidebar-collapsed');
    openBtn.classList.remove('visible');
    
    if (mainContent) {
      if (window.innerWidth > 768) {
        mainContent.style.marginLeft = 'var(--sidebar-width)';
      } else {
        mainContent.style.marginLeft = '0';
      }
    }
    
    const svg = toggleBtn.querySelector('svg path');
    if (svg) {
      svg.setAttribute('d', 'M15 18l-6-6 6-6');
    }
    toggleBtn.title = 'Cerrar panel';
    
    console.log('🔓 Sidebar abierto');
  }
  
  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (sidebar.classList.contains('sidebar-collapsed')) {
      openSidebar();
    } else {
      closeSidebar();
    }
  });
  
  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openSidebar();
  });
  
  window.addEventListener('resize', () => {
    if (!sidebar.classList.contains('sidebar-collapsed')) {
      if (window.innerWidth > 768) {
        if (mainContent) mainContent.style.marginLeft = 'var(--sidebar-width)';
      } else {
        if (mainContent) mainContent.style.marginLeft = '0';
      }
    }
  });
  
  console.log('✅ Sidebar toggle inicializado correctamente');
});
*/

console.log('✅ Sidebar toggle (nuevo) está en index.html');

// ==================== PUBLISHED APPS SECTION ====================

// Variables globales para las gráficas
let projectsChart = null;
let statsDonutChart = null;
let engagementChart = null;

async function loadUserProjectStats(projectTitles) {
  try {
    if (!projectTitles || projectTitles.length === 0) {
      console.log('⚠️ No hay títulos de proyectos para cargar estadísticas');
      return {};
    }

    const { data, error } = await supabase
      .from('proyectos_publicos')
      .select('nombre_proyecto, megustas, vistas, comentario')
      .in('nombre_proyecto', projectTitles);

    if (error) {
      console.error('❌ Error cargando estadísticas de proyectos:', error);
      return {};
    }

    const statsMap = {};
    data.forEach(row => {
      statsMap[row.nombre_proyecto] = {
        views: row.vistas || 0,
        likes: row.megustas || 0,
        comments: Array.isArray(row.comentario) ? row.comentario.length : 0
      };
    });

    console.log(`✅ Estadísticas cargadas para ${Object.keys(statsMap).length} proyectos`);
    return statsMap;
  } catch (err) {
    console.error('❌ Error en loadUserProjectStats:', err);
    return {};
  }
}

function initializeProjectStats(project, statsMap = {}) {
  const projectTitle = project.titulo || project.title;
  
  if (statsMap[projectTitle]) {
    project.stats = statsMap[projectTitle];
  } else {
    project.stats = {
      views: 0,
      likes: 0,
      comments: 0
    };
  }
  
  return project;
}

async function renderPublishedAppsSection() {
  const publishedLoginRequired = document.getElementById('publishedLoginRequired');
  const publishedContent = document.getElementById('publishedContent');
  const publishedGrid = document.getElementById('publishedGrid');
  const statsOverview = document.getElementById('statsOverview');
  
  if (!publishedLoginRequired || !publishedContent) return;
  
  const isLoggedIn = currentSupabaseUser !== null;
  
  if (!isLoggedIn) {
    publishedLoginRequired.style.display = 'block';
    publishedContent.style.display = 'none';
    console.log('⚠️ Usuario no logueado, mostrando mensaje de login');
    return;
  }
  
  publishedLoginRequired.style.display = 'none';
  publishedContent.style.display = 'block';
  
  // Mostrar spinner mientras se cargan los datos
  if (publishedGrid) {
    publishedGrid.innerHTML = createLoadingSpinner('Cargando aplicaciones publicadas...');
  }
  if (statsOverview) {
    statsOverview.innerHTML = createLoadingSpinner('Cargando estadísticas...', 'small');
  }
  
  const userProjects = await getSupabaseUserProjects();
  const publicProjects = userProjects.filter(p => p.devcenter === 'public');
  
  // Si no hay proyectos públicos, mostrar TODOS los proyectos del usuario sin estadísticas
  const hasNoPublicProjects = publicProjects.length === 0;
  const projectsToShow = hasNoPublicProjects ? userProjects : publicProjects;
  
  if (hasNoPublicProjects) {
    // Ocultar estadísticas y gráficas cuando no hay proyectos públicos
    if (statsOverview) statsOverview.innerHTML = '';
    const chartsContainer = document.querySelector('.charts-container');
    if (chartsContainer) chartsContainer.style.display = 'none';
    
    // Solo mostrar los proyectos con botones de acción
    const projectsWithStats = projectsToShow.map(p => initializeProjectStats(p, {}));
    renderPublishedProjects(projectsWithStats, true);
    console.log(`✅ ${projectsToShow.length} proyectos del usuario mostrados (sin estadísticas)`);
    return;
  }
  
  // Mostrar gráficas si estaban ocultas
  const chartsContainer = document.querySelector('.charts-container');
  if (chartsContainer) chartsContainer.style.display = '';
  
  const projectTitles = projectsToShow.map(p => p.titulo || p.title).filter(Boolean);
  
  const statsMap = await loadUserProjectStats(projectTitles);
  
  const projectsWithStats = projectsToShow.map(p => initializeProjectStats(p, statsMap));
  
  console.log(`✅ ${projectsToShow.length} proyectos públicos con estadísticas reales`);
  
  renderGlobalStats(projectsWithStats);
  
  renderCharts(projectsWithStats);
  
  renderPublishedProjects(projectsWithStats, false);
}

// Función para renderizar estadísticas globales
function renderGlobalStats(projects) {
  const statsOverview = document.getElementById('statsOverview');
  if (!statsOverview) return;
  
  // Calcular totales
  const totalViews = projects.reduce((sum, p) => sum + (p.stats?.views || 0), 0);
  const totalLikes = projects.reduce((sum, p) => sum + (p.stats?.likes || 0), 0);
  const totalComments = projects.reduce((sum, p) => sum + (p.stats?.comments || 0), 0);
  const totalProjects = projects.length;
  
  statsOverview.innerHTML = `
    <div class="stat-card" style="
      background: var(--bg-secondary);
      padding: 24px;
      border-radius: 12px;
      text-align: center;
      transition: transform 0.2s;
    ">
      <div style="font-size: 36px; font-weight: 700; color: var(--primary); margin-bottom: 8px;">
        ${totalProjects}
      </div>
      <div style="color: var(--text-secondary); font-size: 14px;">
        Proyectos Públicos
      </div>
    </div>
    
    <div class="stat-card" style="
      background: var(--bg-secondary);
      padding: 24px;
      border-radius: 12px;
      text-align: center;
      transition: transform 0.2s;
    ">
      <div style="font-size: 36px; font-weight: 700; color: #3b82f6; margin-bottom: 8px;">
        ${totalViews.toLocaleString()}
      </div>
      <div style="color: var(--text-secondary); font-size: 14px;">
        Vistas Totales
      </div>
    </div>
    
    <div class="stat-card" style="
      background: var(--bg-secondary);
      padding: 24px;
      border-radius: 12px;
      text-align: center;
      transition: transform 0.2s;
    ">
      <div style="font-size: 36px; font-weight: 700; color: #ef4444; margin-bottom: 8px;">
        ${totalLikes.toLocaleString()}
      </div>
      <div style="color: var(--text-secondary); font-size: 14px;">
        Me Gusta Totales
      </div>
    </div>
    
    <div class="stat-card" style="
      background: var(--bg-secondary);
      padding: 24px;
      border-radius: 12px;
      text-align: center;
      transition: transform 0.2s;
    ">
      <div style="font-size: 36px; font-weight: 700; color: #10b981; margin-bottom: 8px;">
        ${totalComments.toLocaleString()}
      </div>
      <div style="color: var(--text-secondary); font-size: 14px;">
        Comentarios Totales
      </div>
    </div>
  `;
  
  // Agregar efectos hover
  const statCards = statsOverview.querySelectorAll('.stat-card');
  statCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-4px)';
      card.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'none';
    });
  });
}

// Función para renderizar gráficas
function renderCharts(projects) {
  if (projects.length === 0) return;
  
  // Destruir gráficas existentes si las hay
  if (projectsChart) projectsChart.destroy();
  if (statsDonutChart) statsDonutChart.destroy();
  if (engagementChart) engagementChart.destroy();
  
  // Gráfica 1: Rendimiento por proyecto (Bar Chart)
  const projectsChartCanvas = document.getElementById('projectsChart');
  if (projectsChartCanvas) {
    const ctx = projectsChartCanvas.getContext('2d');
    projectsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: projects.map(p => p.title || ''),
        datasets: [
          {
            label: 'Vistas',
            data: projects.map(p => p.stats?.views || 0),
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2
          },
          {
            label: 'Me Gusta',
            data: projects.map(p => p.stats?.likes || 0),
            backgroundColor: 'rgba(239, 68, 68, 0.6)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 2
          },
          {
            label: 'Comentarios',
            data: projects.map(p => p.stats?.comments || 0),
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#333'
            }
          },
          title: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#666'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#666'
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }
  
  // Gráfica 2: Distribución de estadísticas (Doughnut Chart)
  const statsDonutChartCanvas = document.getElementById('statsDonutChart');
  if (statsDonutChartCanvas) {
    const ctx = statsDonutChartCanvas.getContext('2d');
    const totalViews = projects.reduce((sum, p) => sum + (p.stats?.views || 0), 0);
    const totalLikes = projects.reduce((sum, p) => sum + (p.stats?.likes || 0), 0);
    const totalComments = projects.reduce((sum, p) => sum + (p.stats?.comments || 0), 0);
    
    statsDonutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Vistas', 'Me Gusta', 'Comentarios'],
        datasets: [{
          data: [totalViews, totalLikes, totalComments],
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(16, 185, 129, 0.7)'
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(16, 185, 129, 1)'
          ],
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#333'
            }
          }
        },
        cutout: '60%'
      }
    });
  }
  
  // Gráfica 3: Engagement promedio (Bar Chart horizontal)
  const engagementChartCanvas = document.getElementById('engagementChart');
  if (engagementChartCanvas) {
    const ctx = engagementChartCanvas.getContext('2d');
    const avgViews = projects.reduce((sum, p) => sum + (p.stats?.views || 0), 0) / projects.length;
    const avgLikes = projects.reduce((sum, p) => sum + (p.stats?.likes || 0), 0) / projects.length;
    const avgComments = projects.reduce((sum, p) => sum + (p.stats?.comments || 0), 0) / projects.length;
    
    engagementChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Promedio Vistas', 'Promedio Me Gusta', 'Promedio Comentarios'],
        datasets: [{
          label: 'Engagement Promedio',
          data: [avgViews.toFixed(0), avgLikes.toFixed(0), avgComments.toFixed(0)],
          backgroundColor: [
            'rgba(59, 130, 246, 0.6)',
            'rgba(239, 68, 68, 0.6)',
            'rgba(16, 185, 129, 0.6)'
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(16, 185, 129, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#666'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#666'
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }
}

// Función para renderizar proyectos publicados con estadísticas
function renderPublishedProjects(projects, showUploadButtons = false) {
  const publishedGrid = document.getElementById('publishedGrid');
  if (!publishedGrid) return;
  
  if (projects.length === 0) {
    publishedGrid.innerHTML = `
      <div style="
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        color: var(--text-secondary);
      ">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 20px; opacity: 0.3;">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style="font-size: 18px;">No tienes proyectos todavía</p>
        <p style="font-size: 14px; margin-top: 8px;">Crea un proyecto para comenzar</p>
      </div>
    `;
    return;
  }
  
  publishedGrid.innerHTML = '';
  
  projects.forEach((project, index) => {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.style.animation = `fadeInUp 0.4s ease-out ${index * 0.08}s both`;
    
    const hasLink = project.link && project.link !== '' && project.link !== '#';
    const projectTitle = project.titulo || project.title || '';
    
    let actionButtonHtml = '';
    if (showUploadButtons) {
      if (hasLink) {
        actionButtonHtml = `
          <button class="upload-action-btn" data-project-id="${project.numeroProyecto}" data-has-link="true" style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 12px 20px;
            margin-top: 14px;
            background: linear-gradient(135deg, #a78bfa, #8b5cf6);
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s;
            width: 100%;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Subir a DevCenterX
          </button>
        `;
      } else {
        actionButtonHtml = `
          <button class="upload-action-btn" data-project-id="${project.numeroProyecto}" data-has-link="false" style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 12px 20px;
            margin-top: 14px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s;
            width: 100%;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="16 12 12 8 8 12"/>
              <line x1="12" y1="16" x2="12" y2="8"/>
            </svg>
            Subir a internet
          </button>
        `;
      }
    }
    
    card.innerHTML = `
      <div class="project-initials">${project.inicialesTitulo || project.initials || projectTitle.substring(0, 2).toUpperCase() || 'PR'}</div>
      <div class="project-title">${projectTitle}</div>
      <div class="project-description">${project.descripcion || project.description || ''}</div>
      
      <!-- Estadísticas del proyecto -->
      <div style="
        display: flex;
        gap: 16px;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--border);
        font-size: 14px;
      ">
        <div style="display: flex; align-items: center; gap: 6px; color: var(--text-secondary);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span style="font-weight: 600; color: var(--text-primary);">${(project.stats?.views || 0).toLocaleString()}</span>
        </div>
        
        <div style="display: flex; align-items: center; gap: 6px; color: var(--text-secondary);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span style="font-weight: 600; color: var(--text-primary);">${(project.stats?.likes || 0).toLocaleString()}</span>
        </div>
        
        <div style="display: flex; align-items: center; gap: 6px; color: var(--text-secondary);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span style="font-weight: 600; color: var(--text-primary);">${(project.stats?.comments || 0).toLocaleString()}</span>
        </div>
      </div>
      
      <div class="project-tags">
        ${(Array.isArray(project.tags) ? project.tags : (project.tags || '').split(',')).filter(t => t && t.trim()).map(tag => 
          `<span class="tag">${typeof tag === 'string' ? tag.trim() : tag}</span>`
        ).join('')}
      </div>
      
      <div class="project-footer">
        <span class="project-date">${project.fecha || project.date || 'Reciente'}</span>
        <span class="project-status ${(project.status || 'active').toLowerCase()}">${project.status || 'Active'}</span>
      </div>
      
      ${actionButtonHtml}
    `;
    
    // Agregar evento de click para el botón de acción
    const actionBtn = card.querySelector('.upload-action-btn');
    if (actionBtn) {
      actionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const projectId = actionBtn.dataset.projectId;
        window.location.href = `Programar/?proyecto=${projectId}`;
      });
      actionBtn.addEventListener('mouseenter', () => {
        actionBtn.style.transform = 'translateY(-2px)';
        actionBtn.style.boxShadow = actionBtn.dataset.hasLink === 'true' 
          ? '0 6px 16px rgba(139, 92, 246, 0.5)' 
          : '0 6px 16px rgba(102, 126, 234, 0.5)';
      });
      actionBtn.addEventListener('mouseleave', () => {
        actionBtn.style.transform = 'translateY(0)';
        actionBtn.style.boxShadow = 'none';
      });
    }
    
    // Agregar evento de click para la tarjeta
    card.addEventListener('click', () => {
      if (project.url || project.link) {
        const url = project.url || project.link;
        if (url && url !== '#') {
          window.open(url, '_blank');
        }
      }
    });
    
    publishedGrid.appendChild(card);
  });
  
  console.log(`✅ ${projects.length} proyectos publicados renderizados con estadísticas`);
}

// Función para pantalla completa de gráficas
window.toggleFullscreen = function(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const container = canvas.parentElement.parentElement;
  
  if (!document.fullscreenElement) {
    container.requestFullscreen().catch(err => {
      console.error('Error al entrar en pantalla completa:', err);
    });
  } else {
    document.exitFullscreen();
  }
};

// Escuchar cuando se cambia a la sección Published Apps
document.addEventListener('DOMContentLoaded', () => {
  // Observer para detectar cuando se activa la sección published
  const publishedSection = document.getElementById('published-section');
  if (publishedSection) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (publishedSection.classList.contains('active')) {
            console.log('📊 Sección Published Apps activada');
            renderPublishedAppsSection();
          }
        }
      });
    });
    
    observer.observe(publishedSection, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
  
  // Renderizar si la sección ya está activa al cargar
  if (publishedSection && publishedSection.classList.contains('active')) {
    renderPublishedAppsSection();
  }
});

console.log('✅ Published Apps system initialized');

// ==================== USAGE SECTION ====================
// Función para renderizar la sección de Usage
function renderUsageSection() {
  console.log('📊 Renderizando sección de Usage...');
  
  const usageLoginRequired = document.getElementById('usageLoginRequired');
  const usageContent = document.getElementById('usageContent');
  
  if (!usageLoginRequired || !usageContent) {
    console.error('❌ No se encontraron elementos de la sección Usage');
    return;
  }
  
  // Verificar si el usuario está logueado
  if (!currentSupabaseUser) {
    console.log('⚠️ Usuario no logueado, mostrando mensaje de login');
    usageLoginRequired.style.display = 'block';
    usageContent.style.display = 'none';
    return;
  }
  
  // Mostrar contenido de usage directamente (los datos ya están en currentSupabaseUser)
  usageLoginRequired.style.display = 'none';
  usageContent.style.display = 'block';
  
  renderUsageData();
}

// Función auxiliar para renderizar los datos de uso
function renderUsageData() {
  // Obtener datos del usuario y su plan
  const userStatus = currentSupabaseUser.status || 0;
  const userPlan = getUserPlan(userStatus);
  const agentLimit = currentSupabaseUser.limite || 0;
  const userProjects = currentSupabaseUser.proyectos || [];
  const totalApps = userProjects.length;
  const maxApps = userPlan.maxApps;
  
  // Actualizar Uso del Agente
  const usageAgentPercent = document.getElementById('usageAgentPercent');
  const usageAgentBar = document.getElementById('usageAgentBar');
  const usageAgentText = document.getElementById('usageAgentText');
  
  if (usageAgentPercent && usageAgentBar && usageAgentText) {
    usageAgentPercent.textContent = `${agentLimit}%`;
    usageAgentBar.style.width = `${Math.min(agentLimit, 100)}%`;
    
    const maxAgent = userPlan.maxAgentUsage;
    if (agentLimit === 0) {
      usageAgentText.textContent = 'Sin uso registrado';
    } else if (agentLimit < maxAgent * 0.5) {
      usageAgentText.textContent = 'Bajo uso del agente';
    } else if (agentLimit < maxAgent * 0.8) {
      usageAgentText.textContent = 'Uso moderado del agente';
    } else if (agentLimit < maxAgent) {
      usageAgentText.textContent = 'Alto uso del agente';
    } else {
      usageAgentText.textContent = 'Límite alcanzado';
    }
  }
  
  // Actualizar Apps Creadas con el límite del plan
  const usageAppsCount = document.getElementById('usageAppsCount');
  const usageAppsBar = document.getElementById('usageAppsBar');
  const usageAppsLimit = document.querySelector('#usageAppsCount + .usage-card-value-small');
  const usageAppsText = document.querySelector('.usage-card-apps .usage-progress-text');
  
  if (usageAppsCount && usageAppsBar) {
    usageAppsCount.textContent = totalApps;
    const appsPercentage = (totalApps / maxApps) * 100;
    usageAppsBar.style.width = `${Math.min(appsPercentage, 100)}%`;
    
    if (usageAppsLimit) {
      usageAppsLimit.textContent = `/${maxApps}`;
    }
    if (usageAppsText) {
      usageAppsText.textContent = `Límite del plan ${userPlan.name}`;
    }
  }
  
  // Actualizar nombre del plan y estilo
  const usagePlanName = document.getElementById('usagePlanName');
  const planIconContainer = document.getElementById('planIconContainer');
  
  if (usagePlanName) {
    usagePlanName.textContent = userPlan.name;
    usagePlanName.style.color = userPlan.color;
  }
  
  if (planIconContainer) {
    planIconContainer.classList.remove('plan-normal', 'plan-plus', 'plan-ultimate');
    planIconContainer.classList.add(`plan-${userPlan.name.toLowerCase()}`);
  }
  
  // Renderizar lista de beneficios
  const planBenefitsList = document.getElementById('planBenefitsList');
  if (planBenefitsList) {
    planBenefitsList.innerHTML = userPlan.benefits.map(benefit => {
      const iconSvg = benefit.icon === 'check' 
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      
      return `
        <li class="plan-benefit-item ${benefit.active ? 'active' : 'inactive'}">
          <div class="plan-benefit-icon ${benefit.icon}">${iconSvg}</div>
          <span class="plan-benefit-text">${benefit.text}</span>
        </li>
      `;
    }).join('');
  }
  
  // Renderizar detalles dinámicos del plan
  const usagePlanGrid = document.getElementById('usagePlanGrid');
  if (usagePlanGrid) {
    const planDetails = [
      {
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
        title: 'Aplicaciones',
        text: `Puedes crear hasta <strong>${userPlan.maxApps}</strong> aplicaciones. Actualmente tienes ${totalApps} de ${userPlan.maxApps}.`
      },
      {
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
        title: 'Agente',
        text: `Tu agente es <strong>${userPlan.agent}</strong>. Límite de uso: ${userPlan.maxAgentUsage}%.`
      },
      {
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
        title: 'Generación de Imágenes',
        text: userPlan.imageGeneration > 0 
          ? `Tienes <strong>${userPlan.imageGeneration}</strong> generaciones de imágenes disponibles.`
          : 'La generación de imágenes no está incluida en tu plan.'
      },
      {
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
        title: 'Instrucciones',
        text: `Tipo de instrucciones: <strong>${userPlan.instructions}</strong>.`
      },
      {
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
        title: 'Programación',
        text: `Modo de programación: <strong>${userPlan.programming}</strong>.`
      },
      {
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        title: 'Equipos',
        text: userPlan.teams > 0 
          ? `Puedes tener hasta <strong>${userPlan.teams} personas</strong> en tu equipo.`
          : 'Los equipos no están incluidos en tu plan.'
      },
      {
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        title: 'Soporte',
        text: `Tu tipo de soporte: <strong>${userPlan.support}</strong>.`
      },
      {
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
        title: 'Copias de Seguridad',
        text: `Tienes <strong>${userPlan.backups}</strong> copias de seguridad disponibles.`
      },
      {
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        title: 'Publicaciones',
        text: `Puedes realizar hasta <strong>${userPlan.publications}</strong> publicaciones.`
      }
    ];
    
    usagePlanGrid.innerHTML = planDetails.map(detail => `
      <div class="usage-plan-item">
        <div class="usage-plan-item-header">
          ${detail.icon}
          <span class="usage-plan-item-title">${detail.title}</span>
        </div>
        <p class="usage-plan-item-text">${detail.text}</p>
      </div>
    `).join('');
  }
  
  console.log(`✅ Sección Usage renderizada - Plan: ${userPlan.name}, Agente: ${agentLimit}%, Apps: ${totalApps}/${maxApps}`);
}

// Función para expandir/colapsar beneficios del plan
function togglePlanBenefits() {
  const planCard = document.getElementById('planCard');
  if (planCard) {
    planCard.classList.toggle('expanded');
  }
}

window.togglePlanBenefits = togglePlanBenefits;

// Escuchar cuando se cambia a la sección Usage
document.addEventListener('DOMContentLoaded', () => {
  // Observer para detectar cuando se activa la sección usage
  const usageSection = document.getElementById('usage-section');
  if (usageSection) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (usageSection.classList.contains('active')) {
            console.log('📊 Sección Usage activada');
            renderUsageSection();
          }
        }
      });
    });
    
    observer.observe(usageSection, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
  
  // Renderizar si la sección ya está activa al cargar
  if (usageSection && usageSection.classList.contains('active')) {
    renderUsageSection();
  }
});

console.log('✅ Usage section system initialized');
