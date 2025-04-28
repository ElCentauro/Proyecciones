// js/app.js

(() => {
    'use strict';

    // --- 1. ESTADO DE LA APLICACIÓN ---
    const appState = {
        currentYear: new Date().getFullYear(),
        activeSection: 'dashboard',
        isSidebarHidden: false,
        config: {
            rubros: [
                { id: 'remuneraciones', nombre: 'Remuneraciones', pdfId: 1 }, { id: 'aportes_cargas', nombre: 'Aportes y Cargas Sociales', pdfId: 2 },
                { id: 'servicios_publicos', nombre: 'Servicios Públicos', pdfId: 3 }, { id: 'abonos', nombre: 'Abonos de Servicios', pdfId: 4 },
                { id: 'mantenimiento', nombre: 'Mantenimiento P. Comunes', pdfId: 5 }, { id: 'administracion', nombre: 'Gastos Administración', pdfId: 7 },
                { id: 'bancarios', nombre: 'Gastos Bancarios', pdfId: 8 }, { id: 'limpieza', nombre: 'Gastos Limpieza', pdfId: 9 },
                { id: 'seguridad', nombre: 'Seguridad', pdfId: 11 }, { id: 'legales', nombre: 'Legales', pdfId: 12 },
                { id: 'varios', nombre: 'Varios', pdfId: 13 }, { id: 'extraordinarios', nombre: 'Gastos Extraordinarios', pdfId: null },
            ],
            meses: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
            animationClassIn: 'fade-in',
        },
        datosAnuales: {},
        proyeccionCache: null,
        gestionFinanciera: { inversiones: { saldo: 0 }, cuentaCorriente: { saldo: 0 }, reservas: { saldo: 0, objetivo: 0 } },
        bootstrap: { toastInstance: null, importModalInstance: null }
    };

    // --- DATOS SIMULADOS PDF (MARZO 2025) ---
    const pdfDataMarzo2025 = { year: 2025, monthIndex: 2, mesNombre: "Marzo", saldoAnterior: 2761430.18, ingresos: { total: 31556213.26 }, egresos: { total: 28628717.49 }, saldoCierre: 5688925.95, totalIngresosMes: 31556213.26, gastosReales: 28628717.49, gastosDetalle: { 'remuneraciones': { total: 2741514.27, items: [{ desc: 'GONZALEZ LUCIANO...', val: 855722.81 }, { desc: 'SEGOVIA ESPINOLA...', val: 417595.92 }] }, 'aportes_cargas': { total: 2642728.94, items: [{ desc: 'AFIP (SUSS)...', val: 2398363.87 }, { desc: 'UTEDYC...', val: 187065.01 }] }, 'servicios_publicos': { total: 2445648.05, items: [{ desc: 'AYSA...', val: 108421.00 }, { desc: 'TELECENTRO...', val: 3328.36 }] }, 'abonos': { total: 472667.57, items: [{ desc: 'ADMINPROP...', val: 66812.00 }, { desc: 'DE SOUSA VALENTE...', val: 235400.00 }] }, 'mantenimiento': { total: 273000.00, items: [{ desc: 'SALAS, ROBERTO CARLOS...', val: 273000.00 }] }, 'administracion': { total: 998195.00, items: [{ desc: 'FEDERACION PATRONAL...', val: 68195.00 }, { desc: 'OCAMPO, CARLOS...', val: 480000.00 }] }, 'bancarios': { total: 384934.70, items: [{ desc: 'BANCO GALICIA - IMP DEBITOS...', val: 169797.47 }, { desc: 'BANCO GALICIA - IVA/IIBB...', val: 12196.00 }] }, 'limpieza': { total: 1111515.34, items: [{ desc: 'COOP MUNDO RECICLADO...', val: 149379.34 }, { desc: 'COVELLIA...', val: 962136.00 }] }, 'seguridad': { total: 17124415.60, items: [{ desc: 'ABELLA, IGNACIO...', val: 1700000.00 }, { desc: 'SCYTHIA S.A....', val: 3090714.38 }] }, 'legales': { total: 178430.00, items: [{ desc: 'PEÑA, CECILIA...', val: 178430.00 }] }, 'varios': { total: 255668.02, items: [{ desc: 'CASA ZAMBIAZZO...', val: 58817.34 }, { desc: 'MIRVAR S.A....', val: 160000.00 }] }, 'extraordinarios': { total: 0, items: [] } } };
    const pdfFinanzasMarzo2025 = { inversiones: { saldo: 18005079.55, vencimiento: 'N/A', tipo: 'FIMA PREMIUM CLASE A' }, cuentaCorriente: { saldo: 5687660.89, ultimoMov: '31/03/2025' }, reservas: { saldo: 0, objetivo: 0, proposito: 'N/A' } };


    // --- 2. SELECCIÓN DE ELEMENTOS DEL DOM ---
    const elements = { /* ... (IDs y selectores como en la versión anterior) ... */
        body: document.body, sidebar: document.getElementById('sidebar'), mainPanel: document.querySelector('.main-panel'),
        mainContent: document.getElementById('main-content'), sidebarToggle: document.getElementById('sidebarToggle'),
        sectionTitle: document.getElementById('sectionTitle'), currentYearSpan: document.getElementById('current-year'),
        footerYear: document.getElementById('footer-year'), appSections: document.querySelectorAll('.app-section'),
        // KPIs + Containers
        kpiSaldoContainer: document.querySelector('.kpi-saldo .kpi-value'), kpiIngresosContainer: document.querySelector('.kpi-ingresos .kpi-value'),
        kpiGastosContainer: document.querySelector('.kpi-gastos .kpi-value'), kpiProyeccionContainer: document.querySelector('.kpi-proyeccion .kpi-value'),
        kpiSaldoAcumulado: document.getElementById('kpi-saldo-acumulado'), kpiIngresosMes: document.getElementById('kpi-ingresos-mes'),
        kpiGastosMes: document.getElementById('kpi-gastos-mes'), kpiProyeccionCierre: document.getElementById('kpi-proyeccion-cierre'),
        kpiValueDivs: document.querySelectorAll('.kpi-widget .kpi-value'),
        // Tabla Mensual
        tablaMensualWidget: document.querySelector('.table-widget .widget__body--nopad'), tablaMensual: document.getElementById('tabla-mensual'),
        tablaMensualBody: document.getElementById('tabla-mensual-body'), tablaMensualEmpty: document.getElementById('tabla-mensual-empty'),
        tablaPlaceholders: document.querySelectorAll('#tabla-mensual-body .placeholder-row'),
        // Gráficos
        ingresosGastosChartContainer: document.querySelector('#ingresosGastosMensualChart').closest('.chart-container'),
        distribucionGastosChartContainer: document.querySelector('#distribucionGastosChart').closest('.chart-container'),
        proyeccionAnualChartContainer: document.querySelector('#proyeccionAnualChart').closest('.chart-container'),
        ingresosGastosChartCanvas: document.getElementById('ingresosGastosMensualChart'), distribucionGastosChartCanvas: document.getElementById('distribucionGastosChart'),
        proyeccionAnualChartCanvas: document.getElementById('proyeccionAnualChart'),
        // Acordeón Gastos
        accordionGastosWidgetBody: document.querySelector('#accordionGastos').parentElement, accordionGastos: document.getElementById('accordionGastos'),
        accordionPlaceholder: document.querySelector('.accordion-placeholder'), accordionGastosEmpty: document.getElementById('accordion-gastos-empty'),
        // Proyecciones
        formProyeccion: document.getElementById('form-proyeccion'), paramIPC: document.getElementById('param-ipc'),
        paramAumVig: document.getElementById('param-aum-vig'), paramAumMant: document.getElementById('param-aum-mant'),
        paramOptimizacion: document.getElementById('param-optimizacion'), btnCalcularProyeccion: document.getElementById('btn-calcular-proyeccion'),
        proyCierreEscenario: document.getElementById('proy-cierre-escenario'), proyImpacto: document.getElementById('proy-impacto'),
        // Reportes
        selectMesReporteVecino: document.getElementById('select-mes-reporte-vecino'), btnGenerarReporteVecinoPdf: document.getElementById('btn-generar-reporte-vecino-pdf'),
        selectMesReporteInterno: document.getElementById('select-mes-reporte-interno'), btnExportarExcel: document.getElementById('btn-exportar-excel'),
        btnExportarPdfDetallado: document.getElementById('btn-exportar-pdf-detallado'),
        // Gestión Financiera
        gestionInversionesValueContainer: document.querySelector('#gestion-inversiones-saldo').closest('.finance-value'),
        gestionCuentaValueContainer: document.querySelector('#gestion-cuenta-saldo').closest('.finance-value'),
        gestionReservasValueContainer: document.querySelector('#gestion-reservas-saldo').closest('.finance-value'),
        gestionInversionesSaldo: document.getElementById('gestion-inversiones-saldo'), gestionInversionesVenc: document.getElementById('gestion-inversiones-venc'),
        gestionCuentaSaldo: document.getElementById('gestion-cuenta-saldo'), gestionCuentaMov: document.getElementById('gestion-cuenta-mov'),
        gestionReservasSaldo: document.getElementById('gestion-reservas-saldo'), gestionReservasObj: document.getElementById('gestion-reservas-obj'),
        alertaPredictiva: document.getElementById('alerta-predictiva'), alertaPredictivaMensaje: document.getElementById('alerta-predictiva-mensaje'),
        // Configuración
        configWidgetBody: document.querySelector('.config-widget .widget__body'), rubrosListContainer: document.getElementById('rubros-list'),
        rubrosListPlaceholder: document.querySelector('#rubros-list .placeholder-glow'),
        // Modal Importar
        importModalEl: document.getElementById('importModal'), formImport: document.getElementById('form-import'),
        importMes: document.getElementById('import-mes'), importFile: document.getElementById('import-file'),
        importSaldoAnterior: document.getElementById('import-saldo-anterior'), btnConfirmImport: document.getElementById('btn-confirm-import'),
        importLoader: document.getElementById('import-loader'),
        // Toast
        toastEl: document.getElementById('appToast'), toastIcon: document.getElementById('toastIcon'),
        toastBody: document.getElementById('toastBody'),
     };

    // --- 3. GRÁFICOS (Chart.js Instances) ---
    let charts = { ingresosGastosMensual: null, distribucionGastos: null, proyeccionAnual: null };

    // --- 4. FUNCIONES HELPER ---
    const formatCurrency = (value) => typeof value === 'number' ? value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '$ 0,00';
    const formatPercentage = (value) => typeof value === 'number' && !isNaN(value) ? `${value > 0 ? '+' : ''}${value.toFixed(1).replace('.', ',')}%` : 'N/A';
    const getMonthData = (year, monthIndex) => appState.datosAnuales[year]?.find(m => m.mesIndex === monthIndex);
    const getLastAvailableMonth = (year) => { const d = appState.datosAnuales[year]; return d && d.length ? d.slice().sort((a, b) => a.mesIndex - b.mesIndex)[d.length - 1] : null; };
    const showToast = (message, type = 'info') => {
        if (!appState.bootstrap.toastInstance) { console.error("Toast instance not initialized!"); return; }
        elements.toastBody.textContent = message;
        const toastEl = elements.toastEl; const iconEl = elements.toastIcon;
        toastEl.className = 'toast align-items-center border-0'; // Reset classes
        iconEl.className = 'bi fs-5 me-2'; // Reset icon classes
        switch (type) {
            case 'success': toastEl.classList.add('bg-success', 'text-white'); iconEl.classList.add('bi-check-circle-fill'); break;
            case 'danger': toastEl.classList.add('bg-danger', 'text-white'); iconEl.classList.add('bi-exclamation-triangle-fill'); break;
            case 'warning': toastEl.classList.add('bg-warning', 'text-dark'); iconEl.classList.add('bi-exclamation-triangle-fill'); break;
            default: toastEl.classList.add('bg-primary', 'text-white'); iconEl.classList.add('bi-info-circle-fill'); break;
        }
        appState.bootstrap.toastInstance.show();
    };
    const setLoadingState = (containers, isLoading) => { /* ... (sin cambios) ... */ };
    const showEmptyState = (emptyElement, elementContainer = null) => { if (emptyElement) emptyElement.classList.remove('d-none'); if (elementContainer) elementContainer.classList.add('d-none'); };
    const hideEmptyState = (emptyElement, elementContainer = null) => { if (emptyElement) emptyElement.classList.add('d-none'); if (elementContainer) elementContainer.classList.remove('d-none'); };

    // --- 5. LÓGICA DE CÁLCULO ---
    const calculateYearData = (year) => { /* ... (sin cambios) ... */ };
    const calculateVariations = (year, monthIndex) => { /* ... (sin cambios) ... */ };

    // --- 6. FUNCIONES DE RENDERIZADO ---
    const renderDashboardKPIs = () => { /* ... (sin cambios, usa setLoadingState internamente) ... */ };
    const renderMonthlyTable = () => { /* ... (sin cambios, usa show/hide EmptyState) ... */ };
    const renderRubrosAccordion = (monthData = null) => { /* ... (sin cambios, usa show/hide EmptyState) ... */ };
    const renderGestionFinanciera = () => { /* ... (sin cambios, usa setLoadingState) ... */ };
    const renderConfiguracion = () => { /* ... (sin cambios) ... */ };
    const populateReportDropdowns = () => { /* ... (sin cambios, habilita/deshabilita botones) ... */ };

    // --- 7. LÓGICA DE GRÁFICOS ---
    const initCharts = () => { /* ... (sin cambios, usa setLoadingState) ... */ };
    const updateProyeccionChart = (labels, realData, projectedData) => { /* ... (sin cambios, usa setLoadingState al final) ... */ };
    const updateDistribucionGastosChart = (mesData) => { /* ... (sin cambios, maneja estado vacío/loader) ... */ };

    // --- 8. LÓGICA DE PROYECCIONES ---
    const calcularProyeccion = () => { /* ... (sin cambios) ... */ };

    // --- 9. LÓGICA DE IMPORTACIÓN ---
    const handleImportSubmit = (event) => {
        event.preventDefault();
        console.log("Submit import form triggered."); // LOG INICIAL

        if (!elements.formImport.checkValidity()) {
            elements.formImport.classList.add('was-validated');
            showToast('Datos incompletos', 'Revisa los campos marcados.', 'warning');
            return;
        }
        elements.formImport.classList.remove('was-validated');

        const mesAnio = elements.importMes.value;
        const fileInput = elements.importFile;
        const saldoAnteriorManual = parseFloat(elements.importSaldoAnterior.value);
        const [yearStr, monthStr] = mesAnio.split('-');
        const year = parseInt(yearStr);
        const monthIndex = parseInt(monthStr) - 1;
        const mesNombre = appState.config.meses[monthIndex];

        console.log(`Datos seleccionados: Mes=${mesNombre}, Año=${year}, Archivo=${fileInput.files[0]?.name || 'Ninguno'}, SaldoManual=${saldoAnteriorManual}`); // LOG DATOS

        // UI Feedback: Loading
        elements.importLoader.classList.remove('d-none'); // Mostrar loader
        elements.btnConfirmImport.disabled = true;
        elements.btnConfirmImport.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Procesando...`;

        // ** SIMULACIÓN ASÍNCRONA **
        // Usar Promise para manejar mejor la secuencia (aunque setTimeout funciona)
        new Promise((resolve) => {
             setTimeout(() => { // Simular delay
                console.log("Iniciando simulación dentro de setTimeout...");
                let importedData;
                let importedFinanzas = null;

                if (year === 2025 && monthIndex === 2) {
                    console.log("-> Detectado Marzo 2025: Usando datos del PDF simulado.");
                    importedData = JSON.parse(JSON.stringify(pdfDataMarzo2025)); // Deep copy
                    importedFinanzas = JSON.parse(JSON.stringify(pdfFinanzasMarzo2025));

                    if (!isNaN(saldoAnteriorManual)) {
                        console.log(` -> Ajustando saldo anterior manual: ${saldoAnteriorManual}`);
                        importedData.saldoAnterior = saldoAnteriorManual;
                        importedData.saldoCierre = saldoAnteriorManual + (importedData.ingresos?.total || 0) - (importedData.egresos?.total || 0);
                    }
                     importedData.totalIngresosMes = importedData.ingresos?.total || 0; // Asegurar campos
                     importedData.gastosReales = importedData.egresos?.total || 0;

                } else {
                    console.log("-> Otro mes/año: Generando datos aleatorios.");
                    // ... (Lógica de generación aleatoria igual que antes) ...
                    const ingresosSim = 500000 + Math.random() * 200000; let gastosSimDetalle = {}; let gastosSimTotal = 0;
                    appState.config.rubros.forEach(rubro => { const gastoRubro = Math.random() * 80000 + (rubro.id === 'remuneraciones' || rubro.id === 'seguridad' ? 100000 : 10000); gastosSimDetalle[rubro.id] = { total: gastoRubro, items: [{desc: 'Gasto Simulado', val: gastoRubro }] }; gastosSimTotal += gastoRubro;});
                    importedData = { year: year, monthIndex: monthIndex, mesNombre: mesNombre, saldoAnterior: isNaN(saldoAnteriorManual) ? undefined : saldoAnteriorManual, ingresos: { total: ingresosSim }, egresos: { total: gastosSimTotal }, gastosDetalle: gastosSimDetalle, totalIngresosMes: ingresosSim, gastosReales: gastosSimTotal, saldoCierre: 0 };
                }

                console.log(" -> Datos a importar (simulados):", JSON.stringify(importedData).substring(0, 300) + "..."); // Log corto

                // Actualizar estado AHORA
                if (!appState.datosAnuales[year]) appState.datosAnuales[year] = [];
                const existingIndex = appState.datosAnuales[year].findIndex(m => m.mesIndex === monthIndex);
                if (existingIndex > -1) {
                     console.log(` -> Reemplazando datos existentes para ${mesNombre} ${year}`);
                    appState.datosAnuales[year][existingIndex] = importedData;
                } else {
                    console.log(` -> Añadiendo nuevos datos para ${mesNombre} ${year}`);
                    appState.datosAnuales[year].push(importedData);
                }
                appState.currentYear = year; // Actualizar año activo
                if (importedFinanzas) {
                    console.log(" -> Actualizando datos financieros avanzados.");
                    appState.gestionFinanciera = importedFinanzas;
                }

                resolve(); // Indicar que la simulación terminó

             }, 1500); // Delay
        }).then(() => {
            // Esto se ejecuta DESPUÉS de que la simulación (setTimeout) terminó y el estado se actualizó

            console.log("Simulación terminada. Recalculando y renderizando...");

            // Recalcular y Renderizar
            calculateYearData(year);
            renderUI(); // <-- ¡¡LLAMADA CRÍTICA PARA VER LOS CAMBIOS!!
            populateReportDropdowns();

            // UI Feedback: Fin Loading
            elements.importLoader.classList.add('d-none');
            elements.btnConfirmImport.disabled = false;
            elements.btnConfirmImport.innerHTML = `<i class="bi bi-check-lg me-1"></i> Procesar Archivo`;
            appState.bootstrap.importModalInstance.hide();
            elements.formImport.reset();
            elements.formImport.classList.remove('was-validated');

            showToast(`Datos para ${mesNombre} ${year} procesados.`, 'success');
            console.log("Proceso de importación UI finalizado.");

        }).catch(error => {
             // Manejo de errores (si la Promise fallara, aunque aquí es improbable)
             console.error("Error durante la importación simulada:", error);
             showToast('Error inesperado durante la importación.', 'danger');
             // Resetear UI de carga
             elements.importLoader.classList.add('d-none');
             elements.btnConfirmImport.disabled = false;
             elements.btnConfirmImport.innerHTML = `<i class="bi bi-check-lg me-1"></i> Procesar Archivo`;
        });
    };


    // --- 10. LÓGICA DE GENERACIÓN DE REPORTES ---
    // (Sin cambios, pero verificar IDs de botones/selects si fallan)
     const generarPdfVecinos = () => { /* ... */ };
     const exportarExcel = () => { /* ... */ };
     const generarPdfDetallado = () => { /* ... */ };

    // --- 11. NAVEGACIÓN Y MANEJO DE UI ---
    const navigateToSection = (sectionId) => { /* ... (sin cambios) ... */ };
    const setupEventListeners = () => {
        // Navegación Sidebar
        document.querySelectorAll('.app-sidebar__nav .nav-link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => { /* ... (llama a navigateToSection) ... */ });
        });
        // Toggle Sidebar Button
        elements.sidebarToggle?.addEventListener('click', () => { /* ... (toggle class 'sidebar-hidden') ... */ });
        // Click outside sidebar
        document.addEventListener('click', (e) => { /* ... (cierra sidebar en móvil) ... */ });
        // ***** ASOCIAR AL SUBMIT DEL FORMULARIO *****
        elements.formImport.addEventListener('submit', handleImportSubmit);
        // Botones y Selects
        elements.btnCalcularProyeccion.addEventListener('click', calcularProyeccion);
        elements.btnGenerarReporteVecinoPdf.addEventListener('click', generarPdfVecinos);
        elements.btnExportarExcel.addEventListener('click', exportarExcel);
        elements.btnExportarPdfDetallado.addEventListener('click', generarPdfDetallado);
        elements.selectMesReporteVecino.addEventListener('change', () => { /* ... */ });
        elements.selectMesReporteInterno.addEventListener('change', () => { /* ... */ });
        // Detalle en tabla
        elements.tablaMensualBody.addEventListener('click', (event) => { /* ... (actualiza gráfico y acordeón) ... */ });
    };

    // --- 12. FUNCIÓN DE INICIALIZACIÓN PRINCIPAL ---
    const renderUI = (isInitialLoad = false) => {
        const kpiContainers = [elements.kpiSaldoContainer, /*...*/ elements.kpiProyeccionContainer];
        const financeContainers = [elements.gestionInversionesValueContainer, /*...*/ elements.gestionReservasValueContainer];
        const chartContainers = [elements.ingresosGastosChartContainer, /*...*/ elements.proyeccionAnualChartContainer];

        if (isInitialLoad) { // Mostrar todos los loaders/placeholders al inicio
            setLoadingState(kpiContainers, true); setLoadingState(financeContainers, true);
            elements.tablaPlaceholders.forEach(p => p.style.display = '');
            elements.accordionPlaceholder?.style.display = '';
            setLoadingState(chartContainers, true);
            elements.rubrosListPlaceholder?.style.display = '';
        } else { // Ocultar loaders/placeholders (render normal)
             setLoadingState(kpiContainers, false); setLoadingState(financeContainers, false);
             // Los de tabla y acordeón se manejan en sus propias funciones render*
             // Los de gráficos se manejan en initCharts/updateChart
        }
        // Renderizar contenido (llamará a helpers que quitan/muestran loading)
        renderDashboardKPIs(); renderMonthlyTable(); initCharts();
        renderRubrosAccordion(); renderGestionFinanciera(); renderConfiguracion();
    };

    const init = () => {
        console.log('Inicializando v3...');
        // Inicializar Bootstrap
        try {
            appState.bootstrap.toastInstance = new bootstrap.Toast(elements.toastEl, { delay: 4000 });
            appState.bootstrap.importModalInstance = new bootstrap.Modal(elements.importModalEl);
        } catch (e) { console.error("Error inicializando Bootstrap:", e); }

        elements.currentYearSpan.textContent = appState.currentYear;
        elements.footerYear.textContent = appState.currentYear;

        // 1. Mostrar UI inicial con placeholders
        renderUI(true);

        // 2. Carga simulada inicial y cálculo
        handleImportDataSimulation(pdfDataMarzo2025);
        calculateYearData(appState.currentYear);

        // 3. Renderizar con datos reales (quita placeholders) y poblar dropdowns
        setTimeout(() => {
            renderUI(false);
            populateReportDropdowns();
            if (getLastAvailableMonth(appState.currentYear)) calcularProyeccion(); // Calcular proyección si hay datos
        }, 350); // Delay un poco más largo

        // 4. Setup listeners y mostrar sección inicial
        setupEventListeners();
        navigateToSection(appState.activeSection);

        // 5. Quitar clase de pre-carga
        elements.body.classList.remove('app-loading');
        console.log('App lista.');
    };

    // Simulación inicial (sin cambios)
     const handleImportDataSimulation = (simulatedData) => { /* ... */ };

    // --- Ejecutar inicialización ---
    document.addEventListener('DOMContentLoaded', init);

})();