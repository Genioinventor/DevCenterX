document.addEventListener('DOMContentLoaded', async () => {
    let currentUser = null;
    let selectedAvatar = 'color-1';
    let customAvatarUrl = null;

    const avatarGradients = {
        'color-1': 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        'color-2': 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
        'color-3': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        'color-4': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'color-5': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        'color-6': 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        'color-7': 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        'color-8': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
    };

    const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

    async function init() {
        const localUser = localStorage.getItem('devcenter_user');
        const localUserId = localStorage.getItem('devcenter_user_id');

        if (!localUser || !localUserId) {
            showNotLoggedIn();
            return;
        }

        try {
            const { data: cuenta, error } = await supabase
                .from('cuentas')
                .select('*')
                .eq('id', localUserId)
                .single();

            if (error || !cuenta) {
                throw new Error('No se encontro la cuenta');
            }

            currentUser = cuenta;
            displayProfile(cuenta);
            await loadUserStats();

        } catch (error) {
            console.error('Error cargando perfil:', error);
            showMessage('Error al cargar el perfil: ' + error.message, 'error');
            document.getElementById('loading').style.display = 'none';
            document.getElementById('profileContent').style.display = 'block';
        }
    }

    function showNotLoggedIn() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('notLoggedIn').style.display = 'block';
    }

    function displayProfile(cuenta) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('profileContent').style.display = 'block';

        const username = cuenta.usuario || 'Usuario';
        const email = cuenta.email || '';
        const initial = username[0].toUpperCase();

        document.getElementById('usuario').value = username;
        document.getElementById('email').value = email;
        document.getElementById('accountId').textContent = cuenta.id || '-';
        document.getElementById('usernameDisplay').textContent = username;
        document.getElementById('emailDisplay').textContent = email;

        if (cuenta.creado_en) {
            const date = new Date(cuenta.creado_en);
            document.getElementById('createdAt').textContent = date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        if (cuenta.custom_avatar && cuenta.custom_avatar.trim() !== '') {
            customAvatarUrl = cuenta.custom_avatar;
            showCustomAvatar(customAvatarUrl, initial);
            
            if (cuenta.avatar === 'custom') {
                selectedAvatar = 'custom';
                document.getElementById('avatarInitial').style.display = 'none';
                document.getElementById('customAvatarImg').style.display = 'block';
                document.getElementById('customAvatarImg').src = customAvatarUrl;
            } else if (cuenta.avatar && avatarGradients[cuenta.avatar]) {
                selectedAvatar = cuenta.avatar;
                document.getElementById('userAvatar').style.background = avatarGradients[cuenta.avatar];
                document.getElementById('avatarInitial').textContent = initial;
            } else {
                document.getElementById('avatarInitial').textContent = initial;
            }
        } else if (cuenta.avatar && avatarGradients[cuenta.avatar]) {
            selectedAvatar = cuenta.avatar;
            document.getElementById('userAvatar').style.background = avatarGradients[cuenta.avatar];
            document.getElementById('avatarInitial').textContent = initial;
        } else {
            document.getElementById('avatarInitial').textContent = initial;
        }

        document.querySelectorAll('.avatar-option:not(.custom-avatar-option)').forEach(opt => {
            opt.textContent = initial;
            if (opt.classList.contains(selectedAvatar)) {
                opt.classList.add('selected');
            }
        });

        if (selectedAvatar === 'custom') {
            document.getElementById('customAvatarOption').classList.add('selected');
        }
    }

    function showCustomAvatar(url, initial) {
        const customOption = document.getElementById('customAvatarOption');
        const customImg = document.getElementById('customOptionImg');
        
        if (customOption && customImg) {
            customOption.style.display = 'flex';
            customImg.src = url;
        }
    }

    async function loadUserStats() {
        try {
            const { data: proyectos, error } = await supabase
                .from('personas')
                .select('proyectos')
                .eq('nombrepersona', currentUser.usuario)
                .single();

            if (!error && proyectos && proyectos.proyectos) {
                const projectsArray = Array.isArray(proyectos.proyectos) ? proyectos.proyectos : [];
                document.getElementById('projectsCount').textContent = projectsArray.length;
            }
        } catch (e) {
            console.log('No se pudieron cargar estadisticas');
        }
    }

    window.toggleAvatarOptions = function() {
        const options = document.getElementById('avatarOptions');
        options.classList.toggle('active');
    };

    window.selectAvatar = function(color) {
        selectedAvatar = color;
        
        document.querySelectorAll('.avatar-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        if (color === 'custom' && customAvatarUrl) {
            document.getElementById('customAvatarImg').style.display = 'block';
            document.getElementById('customAvatarImg').src = customAvatarUrl;
            document.getElementById('avatarInitial').style.display = 'none';
            document.getElementById('userAvatar').style.background = 'var(--bg-tertiary)';
            document.getElementById('customAvatarOption').classList.add('selected');
        } else if (avatarGradients[color]) {
            document.getElementById('customAvatarImg').style.display = 'none';
            document.getElementById('avatarInitial').style.display = 'block';
            document.getElementById('userAvatar').style.background = avatarGradients[color];
            
            document.querySelectorAll('.avatar-option').forEach(opt => {
                if (opt.classList.contains(color)) {
                    opt.classList.add('selected');
                }
            });
        }
        
        document.getElementById('avatarOptions').classList.remove('active');
    };

    window.togglePassword = function() {
        const input = document.getElementById('contrasena');
        const icon = document.getElementById('passwordIcon');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    };

    function showMessage(text, type) {
        const msgEl = document.getElementById('message');
        const icon = type === 'success' 
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
        
        msgEl.innerHTML = `<div class="message ${type}">${icon}<span>${text}</span></div>`;
        setTimeout(() => msgEl.innerHTML = '', 5000);
    }

    function showRedeemMessage(text, type) {
        const msgEl = document.getElementById('redeemMessage');
        const icon = type === 'success' 
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
        
        msgEl.innerHTML = `<div class="message ${type}">${icon}<span>${text}</span></div>`;
        setTimeout(() => msgEl.innerHTML = '', 5000);
    }

    window.redeemCode = async function() {
        const codeInput = document.getElementById('redeemCode');
        const btn = document.getElementById('redeemBtn');
        const code = codeInput.value.trim().toUpperCase();

        if (!code) {
            showRedeemMessage('Por favor ingresa un codigo', 'error');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';

        try {
            const { data: codeData, error } = await supabase
                .from('codigos')
                .select('*')
                .eq('codigo', code)
                .single();

            if (error || !codeData) {
                throw new Error('Codigo invalido o no encontrado');
            }

            if (codeData.usado) {
                throw new Error('Este codigo ya ha sido utilizado');
            }

            if (codeData.expira && new Date(codeData.expira) < new Date()) {
                throw new Error('Este codigo ha expirado');
            }

            const { error: updateError } = await supabase
                .from('codigos')
                .update({ 
                    usado: true, 
                    usado_por: currentUser.id,
                    usado_en: new Date().toISOString()
                })
                .eq('id', codeData.id);

            if (updateError) throw updateError;

            if (codeData.beneficio) {
                showRedeemMessage(`Codigo canjeado: ${codeData.beneficio}`, 'success');
            } else {
                showRedeemMessage('Codigo canjeado exitosamente', 'success');
            }
            
            codeInput.value = '';

        } catch (error) {
            showRedeemMessage(error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Canjear';
        }
    };

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('saveBtn');
        const newPassword = document.getElementById('contrasena').value;
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

        try {
            const updateData = {
                avatar: selectedAvatar
            };

            if (newPassword && newPassword.length >= 6) {
                updateData.contrasena = newPassword;
            } else if (newPassword && newPassword.length < 6) {
                throw new Error('La contrasena debe tener al menos 6 caracteres');
            }

            const { error } = await supabase
                .from('cuentas')
                .update(updateData)
                .eq('id', currentUser.id);

            if (error) throw error;

            localStorage.setItem('devcenter_avatar', selectedAvatar);
            
            showMessage('Cambios guardados correctamente', 'success');
            document.getElementById('contrasena').value = '';

        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Guardar Cambios';
        }
    });

    window.handleLogout = function() {
        if (confirm('¿Estas seguro de que quieres cerrar sesion?')) {
            localStorage.removeItem('devcenter_user');
            localStorage.removeItem('devcenter_user_id');
            localStorage.removeItem('devcenter_email');
            localStorage.removeItem('devcenter_avatar');
            localStorage.removeItem('devcenter_datos');
            localStorage.removeItem('devcenter_login_time');
            localStorage.removeItem('supabase_nombrepersona');
            window.location.href = '/';
        }
    };

    document.getElementById('redeemCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            window.redeemCode();
        }
    });

    init();
});
