import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = window.SUPABASE_URL;
const supabaseKey = window.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Las credenciales de Supabase no estan disponibles. Asegurate de que keys.js se cargue correctamente.');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

if (supabase) {
  console.log('Cliente Supabase inicializado en crear-app');
}

async function addProjectToSupabase(userName, projectData) {
  if (!supabase) {
    return { success: false, error: 'Supabase no esta configurado correctamente' };
  }

  if (!userName || typeof userName !== 'string') {
    return { success: false, error: 'Nombre de usuario invalido' };
  }

  const trimmedUserName = userName.trim();

  try {
    const { data: userData, error: fetchError } = await supabase
      .from("personas")
      .select("*")
      .eq("nombrepersona", trimmedUserName)
      .maybeSingle();

    if (fetchError) {
      console.error('Error buscando usuario:', fetchError);
      return { success: false, error: 'Error buscando usuario' };
    }

    if (!userData) {
      console.error('Usuario no encontrado:', trimmedUserName);
      return { success: false, error: 'Usuario no encontrado. Por favor inicia sesion nuevamente.' };
    }

    const proyectos = userData.proyectos || [];
    
    if (proyectos.length >= 10) {
      console.warn('El usuario ya tiene 10 proyectos (maximo alcanzado)');
      return { success: false, error: 'Has alcanzado el limite de 10 proyectos' };
    }

    const today = new Date();
    const fechaFormateada = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

    const newProject = {
      numeroProyecto: proyectos.length + 1,
      titulo: projectData.name || '',
      inicialesTitulo: projectData.initials || '??',
      tags: projectData.tags || [],
      descripcion: projectData.description || '',
      link: '',
      devcenter: 'private',
      tipo: 'web',
      status: projectData.status || 'Free',
      statusColor: projectData.statusColor || '#22c55e',
      fecha: fechaFormateada
    };

    proyectos.push(newProject);

    const { error: updateError } = await supabase
      .from("personas")
      .update({ proyectos })
      .eq('nombrepersona', trimmedUserName);

    if (updateError) {
      console.error('Error actualizando proyectos:', updateError);
      return { success: false, error: 'Error guardando proyecto' };
    }

    console.log(`Proyecto creado para ${trimmedUserName}:`, newProject.titulo);
    return { success: true, project: newProject };
  } catch (error) {
    console.error('Error agregando proyecto:', error);
    return { success: false, error: 'Error inesperado al crear el proyecto' };
  }
}

async function verifyUserSession() {
  const userName = localStorage.getItem('supabase_nombrepersona');
  
  if (!userName) {
    return { valid: false, error: 'No hay sesion activa' };
  }

  if (!supabase) {
    return { valid: false, error: 'Supabase no esta configurado' };
  }

  try {
    const { data: userData, error } = await supabase
      .from("personas")
      .select("nombrepersona")
      .eq("nombrepersona", userName.trim())
      .maybeSingle();

    if (error || !userData) {
      return { valid: false, error: 'Sesion invalida' };
    }

    return { valid: true, userName: userName.trim() };
  } catch (err) {
    return { valid: false, error: 'Error verificando sesion' };
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const appNameInput = document.getElementById('appName');
  const nameCount = document.getElementById('nameCount');
  const appDescription = document.getElementById('appDescription');
  const appInitialsInput = document.getElementById('appInitials');
  const initialsPreview = document.getElementById('initialsPreview');
  const tagInput = document.getElementById('tagInput');
  const tagsList = document.getElementById('tagsList');
  const tagCount = document.getElementById('tagCount');
  const descCount = document.getElementById('descCount');
  const statusNameInput = document.getElementById('statusName');
  const colorOptions = document.querySelectorAll('.color-option');
  const statusBadge = document.getElementById('statusBadge');
  const createBtn = document.getElementById('createBtn');
  const steps = document.querySelectorAll('.step');
  const backBtn = document.getElementById('backBtn');
  const enterHintBtn = document.getElementById('enterHintBtn');

  if (backBtn) {
    backBtn.addEventListener('click', function() {
      if (document.referrer && document.referrer.includes(window.location.origin)) {
        history.back();
      } else {
        window.location.href = '/index.html';
      }
    });
  }

  let tags = [];
  let selectedColor = '#22c55e';

  const urlParams = new URLSearchParams(window.location.search);
  const prefilledMessage = urlParams.get('message');
  if (prefilledMessage && appDescription) {
    appDescription.value = prefilledMessage;
    updateSteps();
  }

  if (appNameInput && nameCount) {
    appNameInput.addEventListener('input', function() {
      nameCount.textContent = this.value.length;
      updateSteps();
      
      if (!appInitialsInput.value && this.value.trim()) {
        const words = this.value.trim().split(' ');
        let autoInitials;
        if (words.length === 1) {
          autoInitials = this.value.substring(0, 2).toUpperCase();
        } else {
          autoInitials = (words[0][0] + words[1][0]).toUpperCase();
        }
        appInitialsInput.value = autoInitials;
        initialsPreview.textContent = autoInitials;
      }
    });
  }

  if (appDescription) {
    appDescription.addEventListener('input', function() {
      if (descCount) {
        descCount.textContent = this.value.length;
      }
      updateSteps();
    });
  }

  if (appInitialsInput) {
    appInitialsInput.addEventListener('input', function() {
      const value = this.value.toUpperCase();
      this.value = value;
      initialsPreview.textContent = value || '??';
    });
  }

  function addTag(tagText) {
    const trimmed = tagText.trim().substring(0, 10);
    if (tags.length >= 10) {
      showNotification('Maximo 10 tags permitidos', 'warning');
      return;
    }
    if (trimmed && !tags.includes(trimmed)) {
      tags.push(trimmed);
      renderTags();
      updateSteps();
    }
  }

  function removeTag(index) {
    tags.splice(index, 1);
    renderTags();
    updateSteps();
  }

  function renderTags() {
    tagsList.innerHTML = '';
    tags.forEach((tag, index) => {
      const tagEl = document.createElement('div');
      tagEl.className = 'tag-item';
      tagEl.innerHTML = `
        <span>${tag}</span>
        <button class="remove-tag" data-index="${index}">x</button>
      `;
      tagsList.appendChild(tagEl);
    });

    document.querySelectorAll('.remove-tag').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.dataset.index);
        removeTag(index);
      });
    });

    if (tagCount) {
      tagCount.textContent = tags.length;
    }
  }

  if (tagInput) {
    tagInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTag(this.value);
        this.value = '';
      }
    });
  }

  if (enterHintBtn && tagInput) {
    enterHintBtn.addEventListener('click', function() {
      if (tagInput.value.trim()) {
        addTag(tagInput.value);
        tagInput.value = '';
        tagInput.focus();
      }
    });
  }

  colorOptions.forEach(option => {
    option.addEventListener('click', function() {
      colorOptions.forEach(o => o.classList.remove('active'));
      this.classList.add('active');
      selectedColor = this.dataset.color;
      statusBadge.style.background = selectedColor;
    });
  });

  if (statusNameInput) {
    statusNameInput.addEventListener('input', function() {
      statusBadge.textContent = this.value || 'Status';
    });
  }

  function updateSteps() {
    const hasName = appNameInput && appNameInput.value.trim().length > 0;
    const hasDescription = appDescription && appDescription.value.trim().length > 0;
    const hasTags = tags.length > 0;

    steps.forEach((step, index) => {
      step.classList.remove('active', 'completed');
    });

    if (hasName) {
      steps[0].classList.add('completed');
      steps[1].classList.add('active');
    } else {
      steps[0].classList.add('active');
    }

    if (hasName && hasDescription) {
      steps[1].classList.add('completed');
      steps[2].classList.add('active');
    }

    if (hasName && hasDescription && hasTags) {
      steps[2].classList.add('completed');
    }
  }

  if (createBtn) {
    createBtn.addEventListener('click', async function() {
      const name = appNameInput ? appNameInput.value.trim() : '';
      const description = appDescription ? appDescription.value.trim() : '';
      const initials = appInitialsInput ? appInitialsInput.value.trim().toUpperCase() : '??';
      const status = statusNameInput ? statusNameInput.value.trim() : 'Free';

      if (!name) {
        showNotification('Por favor, ingresa un nombre para tu app', 'warning');
        appNameInput.focus();
        return;
      }

      if (!description) {
        showNotification('Por favor, describe tu idea', 'warning');
        appDescription.focus();
        return;
      }

      if (tags.length === 0) {
        showNotification('Por favor, agrega al menos un tag', 'warning');
        tagInput.focus();
        return;
      }

      this.innerHTML = `
        <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
        </svg>
        Verificando...
      `;
      this.disabled = true;

      const session = await verifyUserSession();
      
      if (!session.valid) {
        showNotification('Debes iniciar sesion para crear una app', 'error');
        this.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Finalizar de crear
        `;
        this.disabled = false;
        setTimeout(() => {
          window.location.href = '/index.html#login';
        }, 2000);
        return;
      }

      this.innerHTML = `
        <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
        </svg>
        Creando...
      `;

      const appData = {
        name: name,
        description: description,
        initials: initials.substring(0, 2) || '??',
        tags: tags,
        status: status || 'Free',
        statusColor: selectedColor,
        createdAt: new Date().toISOString()
      };

      console.log('Creando app:', appData);

      const result = await addProjectToSupabase(session.userName, appData);

      if (result.success) {
        showNotification('App creada exitosamente!', 'success');
        this.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Creado!
        `;
        
        const projectForStorage = {
          title: result.project.titulo,
          initials: result.project.inicialesTitulo,
          description: result.project.descripcion,
          tags: result.project.tags,
          status: result.project.status,
          statusColor: result.project.statusColor,
          numeroProyecto: result.project.numeroProyecto,
          fecha: result.project.fecha
        };
        localStorage.setItem('currentProject', JSON.stringify(projectForStorage));
        
        setTimeout(() => {
          window.location.href = '/Programar/index.html';
        }, 1500);
      } else {
        showNotification(result.error || 'Error al crear la app', 'error');
        this.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Finalizar de crear
        `;
        this.disabled = false;
      }
    });
  }

  function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${type === 'success' ? '<polyline points="20 6 9 17 4 12"/>' : 
          type === 'warning' ? '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' :
          type === 'error' ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>' :
          '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'}
      </svg>
      <span>${message}</span>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .notification {
        position: fixed;
        top: 24px;
        right: 24px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 24px;
        background: rgba(15, 20, 35, 0.98);
        border: 1px solid rgba(37, 99, 235, 0.3);
        border-radius: 12px;
        color: #e2e8f0;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(12px);
        z-index: 9999;
        animation: slideIn 0.3s ease;
      }
      .notification-success { border-color: #22c55e; }
      .notification-success svg { color: #22c55e; }
      .notification-warning { border-color: #f59e0b; }
      .notification-warning svg { color: #f59e0b; }
      .notification-error { border-color: #ef4444; }
      .notification-error svg { color: #ef4444; }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      .spinner {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  const templateCards = document.querySelectorAll('.template-card');
  templateCards.forEach(card => {
    card.addEventListener('click', function() {
      const templateName = this.querySelector('span').textContent;
      if (appNameInput) {
        appNameInput.value = templateName;
        nameCount.textContent = templateName.length;
        
        const words = templateName.trim().split(' ');
        let autoInitials;
        if (words.length === 1) {
          autoInitials = templateName.substring(0, 2).toUpperCase();
        } else {
          autoInitials = (words[0][0] + words[1][0]).toUpperCase();
        }
        appInitialsInput.value = autoInitials;
        initialsPreview.textContent = autoInitials;
      }
      if (appDescription) {
        const descriptions = {
          'Landing Page': 'Una landing page moderna y atractiva con secciones de hero, caracteristicas, testimonios y formulario de contacto.',
          'Dashboard': 'Un dashboard interactivo con graficas, estadisticas en tiempo real, tablas de datos y navegacion lateral.',
          'E-commerce': 'Una tienda en linea completa con catalogo de productos, carrito de compras, checkout y gestion de pedidos.',
          'Chat App': 'Una aplicacion de chat en tiempo real con mensajes, notificaciones, grupos y compartir archivos.'
        };
        appDescription.value = descriptions[templateName] || '';
      }
      updateSteps();
      showNotification(`Plantilla "${templateName}" seleccionada`, 'success');
    });
  });

  updateSteps();
});
