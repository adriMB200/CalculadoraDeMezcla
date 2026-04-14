const { app, BrowserWindow, Menu, dialog, shell } = require("electron");
const path = require("path");

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "Enduronalon",
        icon: path.join(__dirname, "imagen/img.jpg"),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Carga tu archivo principal
    win.loadFile(path.join(__dirname, "index.html"));
}

// 1. Definimos el diseño del menú profesional
const templateMenu = [
    {
        label: 'App',
        submenu: [
            { label: 'Recargar', role: 'reload' },
            { label: 'Forzar Recarga', role: 'forceReload' },
            { type: 'separator' },
            {
                label: 'Ocultar',
                accelerator: 'CmdOrCtrl+H',
                role: 'hide'
            },
            { type: 'separator' },
            { label: 'Salir', role: 'quit' }
        ]
    },
    {
        label: 'Editar',
        submenu: [
            { label: 'Deshacer', role: 'undo' },
            { label: 'Rehacer', role: 'redo' },
            { type: 'separator' },
            { label: 'Cortar', role: 'cut' },
            { label: 'Copiar', role: 'copy' },
            { label: 'Pegar', role: 'paste' },
            { label: 'Seleccionar todo', role: 'selectAll' }
        ]
    },
    {
        label: 'Visualización',
        submenu: [
            { label: 'Pantalla Completa', role: 'togglefullscreen' },
            { type: 'separator' },
            { label: 'Acercar', role: 'zoomIn' },
            { label: 'Alejar', role: 'zoomOut' },
            { label: 'Restablecer Zoom', role: 'resetZoom' },
            { type: 'separator' },
            {
                label: 'Herramientas de Desarrollador',
                accelerator: 'F12',
                role: 'toggleDevTools'
            }
        ]
    },
    {
        label: 'Ayuda',
        submenu: [
            {
                label: 'Reportar un error',
                click: async () => {
                    await shell.openExternal('https://github.com/adriMB200/CalculadoraDeMezcla/issues');
                }
            },
            {
                label: 'Visitar Repositorio',
                click: async () => {
                    await shell.openExternal('https://github.com/adriMB200/CalculadoraDeMezcla');
                }
            },
            { type: 'separator' },
            {
                label: 'Acerca de Enduronalon',
                click: async () => {
                    const { response } = await dialog.showMessageBox({
                        type: 'info',
                        title: 'Acerca de la App',
                        message: 'Enduronalon v1.0.0',
                        detail: 'Una herramienta integral para la gestión de mezclas, mantenimientos y control de horas para motos de Enduro.\n\nDesarrollado con ❤️ por adriMB200.',
                        buttons: ['Cerrar', 'Ver GitHub del Autor'],
                        icon: path.join(__dirname, "imagen/img.jpg")
                    });

                    if (response === 1) {
                        await shell.openExternal('https://github.com/adriMB200');
                    }
                }
            }
        ]
    }
];

// 2. Inicialización de la aplicación
app.whenReady().then(() => {
    // Aplicamos el menú personalizado
    const menu = Menu.buildFromTemplate(templateMenu);
    Menu.setApplicationMenu(menu);

    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 3. Gestión de cierre de ventanas
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});