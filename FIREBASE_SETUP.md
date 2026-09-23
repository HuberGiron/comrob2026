# COMRob 2026 — Sistema de registros con Firebase

Esta versión implementa:

- registro de posters;
- registro a talleres;
- registro de equipos FutBot;
- estado inicial `pendiente`;
- panel administrativo protegido;
- validación manual de pago/registro;
- opción de regresar un registro a pendiente;
- eliminación de registros de prueba o erróneos;
- exportación a Excel;
- solicitud de nuevas cuentas administrativas;
- preparación del campo `correoValidacionEnviado` para automatizar correos posteriormente.

El sitio sigue siendo HTML/CSS/JS estático. No requiere Node.js ni un backend propio para esta primera etapa.

---

## 1. Archivos nuevos

### Formularios públicos

- `registro-posters.html`
- `registro-talleres.html`
- `registro-futbot.html`
- `en/registro-posters.html`
- `en/registro-talleres.html`
- `en/registro-futbot.html`

### Administración

- `admin-login.html`
- `admin-nuevo.html`
- `admin-registros.html`

No es necesario enlazar las páginas administrativas desde el sitio público.

### JavaScript

- `js/firebase-config.js`
- `js/firebase-core.js`
- `js/registro-publico.js`
- `js/admin-core.js`
- `js/admin-login.js`
- `js/admin-nuevo.js`
- `js/admin-registros.js`

### Firebase

- `firebase/firestore.rules`
- `firebase/firestore.indexes.json`

---

## 2. Páginas existentes modificadas

El ZIP incluye versiones actualizadas de:

- `posters.html`
- `en/call-for-posters.html`
- `talleres.html`
- `en/workshops.html`

Los botones de registro ya apuntan a los formularios nuevos.

La página actual de Competencia Robótica ya apunta a `registro-futbot.html`, por lo que no se reemplaza en este paquete para no pisar tus últimos cambios del repositorio.

---

## 3. Crear el proyecto Firebase

1. Entra a Firebase Console.
2. Crea un proyecto, por ejemplo `COMRob 2026`.
3. Agrega una aplicación **Web**.
4. Firebase mostrará un objeto parecido a:

```js
const firebaseConfig = {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
};
```

5. Copia esos valores a:

`js/firebase-config.js`

No cambies los nombres de las propiedades.

---

## 4. Habilitar Firebase Authentication

En Firebase Console:

**Authentication → Sign-in method**

Habilita:

1. **Anonymous**
2. **Email/Password**

Uso:

- Anonymous: formularios públicos.
- Email/Password: administradores.

---

## 5. Crear Firestore

En Firebase Console:

**Firestore Database → Create database**

Crea la base y después abre:

**Firestore Database → Rules**

Copia todo el contenido de:

`firebase/firestore.rules`

y presiona **Publish**.

Las reglas hacen lo siguiente:

### Visitante

Puede:

- crear un registro nuevo.

No puede:

- consultar registros;
- modificar registros;
- eliminar registros.

### Administrador autorizado

Puede:

- consultar;
- validar;
- regresar a pendiente;
- eliminar;
- exportar desde el navegador.

---

## 6. Configurar dominios autorizados

En Firebase Authentication revisa:

**Settings → Authorized domains**

Agrega el dominio real donde se publica COMRob.

Si haces pruebas locales, verifica que `localhost` también esté permitido.

---

## 7. Crear tu primer superadministrador

### Paso A — Crear la cuenta

Después de subir los archivos al sitio abre:

`admin-nuevo.html`

Crea tu cuenta con correo y contraseña.

Esto genera:

- el usuario en Firebase Authentication;
- `solicitudesAdmin/{UID}` en Firestore.

Todavía no tendrá privilegios administrativos.

### Paso B — Obtener tu UID

Firebase Console:

**Authentication → Users**

Copia el campo **User UID** de tu cuenta.

### Paso C — Autorizarlo manualmente

En Firestore crea la colección:

`administradores`

Dentro crea un documento cuyo **Document ID sea exactamente tu UID**.

Campos recomendados:

```text
activo    boolean    true
nombre    string     Tu nombre
email     string     tu-correo@ejemplo.mx
rol       string     superadmin
```

No uses un ID automático.

### Paso D — Iniciar sesión

Abre:

`admin-login.html`

El sistema comprobará que exista:

`administradores/{tu_UID}`

y que:

`activo == true`

---

## 8. Crear administradores posteriores

La persona entra a:

`admin-nuevo.html`

y crea su cuenta.

Tú revisas:

`solicitudesAdmin`

Luego:

1. verificas la solicitud;
2. copias su UID desde Authentication;
3. creas `administradores/{UID}`;
4. agregas `activo: true`.

Crear una cuenta nunca concede permisos por sí mismo.

---

## 9. Estructura de los registros

Todos se guardan en:

`registros/{documentId}`

Campos comunes:

```text
versionEsquema: 1
codigoRegistro

tipo:
    poster
    taller
    futbot

estado:
    pendiente
    validado

participante:
    nombre
    email
    institucion
    programa
    tipoParticipante
    articuloId

creadoPor
creadoEn
idioma
origenPagina
validadoEn
validadoPor
correoValidacionEnviado
```

Los códigos visibles tienen formato parecido a:

```text
POST-A12BC34
TALL-X98JK21
FUT-72KM4QZ
```

No se usa un contador global; se genera a partir del ID único de Firestore.

---

## 10. Posters

Además de los datos comunes se guarda:

```text
poster:
    nombreProyecto
    autoresAdicionales
```

---

## 11. Talleres

Además se guarda:

```text
talleres[]
talleresDetalle[]
esPonente
prioridad
```

Prioridad:

```text
1 = ponente/presentador
2 = participante general
```

El formulario impide seleccionar talleres que se empalman según el programa actual.

---

## 12. FutBot

Un documento corresponde a un equipo.

```text
equipo:
    nombre
    modalidad
    integrantes[]
    asesor
```

Se admiten de 2 a 5 integrantes.

`Modalidad de inscripción` queda temporalmente como texto libre hasta que se defina el catálogo oficial.

---

## 13. Validación administrativa

Al enviar un formulario se guarda:

```text
estado: "pendiente"
validadoEn: null
validadoPor: null
correoValidacionEnviado: false
```

Cuando el administrador presiona **Validar**:

```text
estado: "validado"
validadoEn: timestamp
validadoPor: UID del administrador
correoValidacionEnviado: false
```

También existe **Reabrir** para corregir una validación accidental.

---

## 14. Preparación para el futuro correo automático

El sistema deja listo:

```text
estado == "validado"
correoValidacionEnviado == false
```

Un futuro script/API podrá:

1. consultar registros con esos valores;
2. enviar el correo;
3. cambiar `correoValidacionEnviado` a `true`.

Todavía no se envía ningún correo automáticamente.

---

## 15. Exportación a Excel

`admin-registros.html` tiene:

### Exportar vista a Excel

Exporta solamente los registros que cumplen los filtros visibles.

### Exportar todo a Excel

Genera un `.xlsx` con tres hojas:

- Posters
- Talleres
- FutBot

La exportación se realiza en el navegador mediante SheetJS.

---

## 16. Prueba inicial recomendada

Después de configurar Firebase:

1. abre `registro-posters.html`;
2. crea un registro inventado;
3. confirma que aparezca el código `POST-...`;
4. abre `admin-login.html`;
5. entra como superadministrador;
6. verifica que aparezca el registro;
7. pulsa **Validar**;
8. exporta el Excel;
9. pulsa **Eliminar** sobre ese registro de prueba;
10. repite con Talleres y FutBot.

---

## 17. Seguridad adicional para la segunda etapa

Authentication anónima evita que Firestore esté abierto a escrituras completamente anónimas, pero una persona todavía podría automatizar la creación de cuentas anónimas.

Antes de abrir el registro públicamente a gran escala conviene habilitar **Firebase App Check**.

Tampoco se recomienda guardar en este sistema:

- contraseñas;
- identificaciones oficiales escaneadas;
- datos bancarios;
- comprobantes con información sensible.
