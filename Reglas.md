# Reglas de Desarrollo - DevCenter Agent

## 1. Gestión de Archivos

### 1.1 Prohibición de Nuevos Archivos
- **ESTRICTAMENTE PROHIBIDO** crear, generar o agregar archivos nuevos al proyecto
- Todas las modificaciones deben realizarse dentro de los archivos existentes
- Esta regla NO tiene excepciones

### 1.2 Modificación de Archivos Existentes
- Solo se permite editar archivos que ya existen en el proyecto
- Antes de modificar, verificar que el archivo existe usando las herramientas de lectura
- Mantener la estructura y organización actual del código

## 2. Gestión de API Keys y Seguridad

### 2.1 keys.js - Archivo de Claves
- **Única fuente de verdad** para todas las API keys del proyecto
- Solo puede modificarse cuando sea absolutamente necesario
- Únicamente se permite agregar o actualizar claves (keys)
- **PROHIBIDO** incluir:
  - Funciones
  - Lógica adicional
  - Configuraciones externas
  - Imports de otros módulos

### 2.2 Seguridad de API Keys
- No agregar medidas de seguridad adicionales (cifrado, protecciones automáticas, etc.)
- Las claves deben funcionar exactamente como están configuradas
- Todas las claves deben cargarse exclusivamente desde `keys.js`
- **PROHIBIDO** definir o importar keys en cualquier otro archivo

## 3. Estilo Visual y Diseño

### 3.1 Estética General
- Seguir el estilo tipo Replit: limpio, moderno y minimalista
- Mantener coherencia visual en todos los componentes
- Usar CSS custom properties (variables CSS) para temas

### 3.2 Iconos y Símbolos
- **PROHIBIDO** el uso de emojis en cualquier parte del código o interfaz
- Solo se permiten:
  - Iconos SVG
  - Librerías de iconos aprobadas: Lucide, FontAwesome
- Los iconos deben ser coherentes con el estilo general

### 3.3 Diseño Responsivo
- Todo diseño y componente debe ser completamente ajustable y adaptable
- Debe verse bien en cualquier tamaño de pantalla (desktop, tablet, mobile)
- Debe funcionar en cualquier forma de contenedor
- **PROHIBIDO**:
  - Desbordes de contenido
  - Deformaciones visuales
  - Elementos que rompan el layout
- Usar unidades flexibles (%, rem, vh, vw) en lugar de píxeles fijos cuando sea apropiado

## 4. Base de Datos y Datos

### 4.1 Supabase como Backend
- Supabase es el backend oficial del proyecto (PostgreSQL)
- Todas las operaciones de datos deben usar Supabase
- No usar localStorage para datos que deben persistir entre sesiones

### 4.2 Estructura de Datos
- Respetar la estructura de las tablas existentes:
  - `accounts`: Información de cuentas de usuario
  - `personas`: Perfiles de usuario con proyectos (JSONB)
  - `proyectos_publicos`: Metadata de proyectos públicos
- **USAR DATOS REALES**: Las estadísticas, contadores y métricas deben obtenerse de Supabase
- **PROHIBIDO** generar datos simulados o aleatorios para mostrar en la interfaz

### 4.3 Consultas a Base de Datos
- Optimizar consultas para minimizar llamadas a Supabase
- Usar consultas por lote cuando sea posible (ej: `.in()` en lugar de múltiples `.eq()`)
- Implementar manejo de errores adecuado

## 5. Código y Prácticas de Desarrollo

### 5.1 Calidad de Código
- Código limpio y bien comentado (solo cuando sea necesario)
- Nombres de variables y funciones descriptivos
- Evitar duplicación de código
- Seguir los patrones existentes en el proyecto

### 5.2 JavaScript
- Usar JavaScript moderno (ES6+)
- Preferir `async/await` sobre callbacks
- Manejar errores con try/catch
- Usar destructuring cuando sea apropiado

### 5.3 Funciones y Lógica
- Funciones pequeñas y con una sola responsabilidad
- Evitar funciones que hagan demasiadas cosas
- Documentar funciones complejas

## 6. Integración con APIs Externas

### 6.1 Google Gemini AI
- Usar para generación de código (HTML/CSS/JS)
- Mantener el modelo configurado: `gemini-2.5-pro`
- Optimizar prompts para mejores resultados

### 6.2 GitHub API
- Usar API REST v3 para operaciones de repositorio
- Implementar manejo de rate limits

## 7. Performance y Optimización

### 7.1 Carga de Datos
- Implementar sistema de caché cuando sea apropiado
- No hacer llamadas innecesarias a la base de datos
- Cargar datos solo cuando se necesiten

### 7.2 Renderizado
- Optimizar renderizado de listas largas
- Usar lazy loading cuando sea apropiado
- Evitar re-renders innecesarios

## 8. Reglas Específicas del Proyecto

### 8.1 Proyectos de Usuario
- Los proyectos se almacenan como JSONB en `personas.proyectos`
- Las estadísticas (vistas, likes, comentarios) están en `proyectos_publicos`
- Relacionar proyectos por el campo `titulo` / `nombre_proyecto`

### 8.2 Autenticación
- Sistema basado en Supabase Auth
- Verificar sesión antes de operaciones sensibles
- Manejar estados de login/logout correctamente

## 9. Prohibiciones Absolutas

- Crear nuevos archivos
- Usar emojis en código o interfaz
- Agregar lógica a keys.js
- Definir API keys fuera de keys.js
- Generar datos simulados o aleatorios para la interfaz
- Romper el diseño responsivo
- Ignorar errores de base de datos
- Usar localStorage para datos que deben persistir

## 10. Orden de Prioridades

1. **Datos Reales**: Siempre usar datos reales de Supabase
2. **No Romper**: No romper funcionalidad existente
3. **Coherencia**: Mantener coherencia con el código existente
4. **Performance**: Optimizar para rendimiento
5. **UX/UI**: Mantener experiencia de usuario fluida