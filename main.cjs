const { app, BrowserWindow, Menu, dialog, shell } = require("electron");
const path = require("path");

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, "imagen/img.jpg"),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.loadFile(path.join(__dirname, "index.html"));
}

// 1. Definimos el diseño del menú
const templateMenu = [
    {
        label: 'App',
        submenu: [
            { label: 'Recargar', role: 'reload' },
            { label: 'Forzar Recarga', role: 'forceReload' },
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
            { label: 'Pegar', role: 'paste' }
        ]
    },
    {
        label: 'Ayuda',
        submenu: [
            {
                label: 'Acerca de Enduronalon',
                click: async () => {
                    const { response } = await dialog.showMessageBox({
                        type: 'info',
                        title: 'Información del Desarrollador',
                        message: 'Enduronalon App v1.0',
                        detail: 'Desarrollado por adriMB200.\n\nSoftware para la gestión de mezclas y mantenimiento de motos de Enduro.',
                        buttons: ['Cerrar', 'Visitar GitHub'],
                        icon: path.join(__dirname, "imagen/img.jpg") // Opcional: tu logo en pequeño
                    });

                    // Si hace clic en "Visitar GitHub" (botón en la posición 1)
                    if (response === 1) {
                        await shell.openExternal('https://github.com/adriMB200');
                    }
                }
            }
        ]
    }
];

app.whenReady().then(() => {
    // 2. Aplicamos el menú antes de crear la ventana
    const menu = Menu.buildFromTemplate(templateMenu);
    Menu.setApplicationMenu(menu);

    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});