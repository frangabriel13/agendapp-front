# Agend App — Frontend

Panel de gestión de turnos para negocios (estéticas, peluquerías, etc).

## ¿Qué necesitás para arrancar?

Antes de tocar código, asegurate de tener instalado en tu computadora:

- **Node.js** versión 18 o superior → [descargar acá](https://nodejs.org)
- **VS Code** → [descargar acá](https://code.visualstudio.com)
- **Git** → [descargar acá](https://git-scm.com)

> Si usás Windows podés trabajar de dos formas:
> - **Windows nativo** (más fácil de arrancar): instalás Node.js para Windows directamente desde nodejs.org y listo.
> - **WSL2** (recomendado a largo plazo): Linux dentro de Windows, más rápido y más parecido al servidor de producción. Pedile ayuda a Franco para configurarlo.

---

## Cómo configurar el proyecto por primera vez

Abrí la terminal y seguí estos pasos **en orden**:

**1. Clonar el repositorio** (bajarte el código)
```bash
git clone [URL del repositorio]
```

**2. Entrar a la carpeta del proyecto**
```bash
cd agendapp-front
```

**3. Instalar las dependencias** (las librerías que usa el proyecto)
```bash
npm install
```

> Esto puede tardar unos minutos la primera vez. Es normal.

---

## Cómo correr el proyecto

```bash
npm run dev
```

Después abrí tu navegador en **http://localhost:3000**

Para detener el servidor: `Ctrl + C` en la terminal.

---

## Estructura de carpetas (qué va dónde)

```
agendapp-front/
├── app/                  → Las páginas de la aplicación
│   ├── (marketing)/      → Página principal (dominio.com)
│   ├── (admin)/          → Panel del dueño del negocio
│   ├── (tenant)/         → Portal de clientes del negocio
│   └── (superadmin)/     → Panel de administración general
│
├── components/
│   ├── ui/               → Componentes visuales base (botones, cards, etc)
│   └── common/           → Componentes compartidos entre secciones
│
├── features/             → Lógica agrupada por funcionalidad
│   ├── auth/             → Login, registro, sesión
│   ├── appointments/     → Turnos y agenda
│   └── businesses/       → Gestión de negocios
│
├── hooks/                → Funciones reutilizables de React
├── services/             → Llamadas al servidor (backend)
└── types/                → Definiciones de tipos de datos
```

---

## Flujo de trabajo con Git

Nunca trabajes directo en la rama `main`. Siempre seguí estos pasos:

**1. Antes de arrancar a trabajar, actualizate:**
```bash
git pull origin main
```

**2. Creá una rama nueva para tu tarea:**
```bash
git checkout -b nombre-de-tu-tarea
```
Ejemplo: `git checkout -b agregar-boton-login`

**3. Cuando terminás, guardá tus cambios:**
```bash
git add .
git commit -m "descripción corta de lo que hiciste"
```

**4. Subí tu rama:**
```bash
git push origin nombre-de-tu-tarea
```

**5. Avisale a Franco para que revise el código antes de integrarlo.**

---

## Comandos útiles

| Comando | Para qué sirve |
|---|---|
| `npm run dev` | Iniciar el proyecto en modo desarrollo |
| `npm run build` | Compilar el proyecto para producción |
| `git status` | Ver qué archivos modificaste |
| `git log --oneline` | Ver el historial de cambios |

---

## ¿Algo no funciona?

1. Revisá que hayas corrido `npm install`
2. Revisá que estés en la carpeta correcta (`agendapp-front/`)
3. Preguntale a Franco
