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
    const pdfDataMarzo2025 = { /* ... (datos exactos del PDF como en versiones anteriores) ... */
        year: 2025, monthIndex: 2, mesNombre: "Marzo", saldoAnterior: 2761430.18,
        ingresos: { total: 31556213.26, /*...otros detalles si son necesarios...*/ },
        egresos: { total: 28628717.49, /*...*/ }, saldoCierre: 5688925.95,
        totalIngresosMes: 31556213.26, gastosReales: 28628717.49,
        gastosDetalle: { /* ... (detalles mapeados) ... */
             'remuneraciones': { total: 2741514.27, items: [ {desc: 'GONZALEZ...', val: 855722.81}, {desc: 'SEGOVIA...', val: 417595.92} ]},
             // ... resto de rubros mapeados ...
             'varios': { total: 255668.02, items: [ {desc: 'CASA ZAMBIAZZO...', val: 58817.34}, {desc: 'MIRVAR...', val: 160000.00} ]},
        }
    };
    const pdfFinanzasMarzo2025 = { // Separado para claridad
        inversiones: { saldo: 18005079.55, vencimiento: 'N/A', tipo: 'FIMA PREMIUM CLASE A' },
        cuentaCorriente: { saldo: 5687660.89, ultimoMov: '31/03/2025' },
        reservas: { saldo: 0, objetivo: 0, proposito: 'N/A' } // Asumimos reserva 0
    };


    // --- 2. SELECCIÓN DE ELEMENTOS DEL DOM ---
    const elements = {
        body: document.body, sidebar: document.getElementById('sidebar'), mainPanel: document.querySelector('.main-panel'),
        mainContent: document.getElementById('main-content'), sidebarToggle: document.getElementById('sidebarToggle'),
        sectionTitle: document.getElementById('sectionTitle'), currentYearSpan: document.getElementById('current-year'),
        footerYear: document.getElementById('footer-year'), appSections: document.querySelectorAll('.app-section'),
        // KPIs + Containers
        kpiSaldoContainer: document.querySelector('.kpi-saldo .kpi-value'), kpiIngresosContainer: document.querySelector('.kpi-ingresos .kpi-value'),
        kpiGastosContainer: document.querySelector('.kpi-gastos .kpi-value'), kpiProyeccionContainer: document.querySelector('.kpi-proyeccion .kpi-value'),
        kpiSaldoAcumulado: document.getElementById('kpi-saldo-acumulado'), kpiIngresosMes: document.getElementById('kpi-ingresos-mes'),
        kpiGastosMes: document.getElementById('kpi-gastos-mes'), kpiProyeccionCierre: document.getElementById('kpi-proyeccion-cierre'),
        // Tabla Mensual
        tablaMensualWidget: document.querySelector('.table-widget .widget__body--nopad'), // Contenedor de tabla/empty
        tablaMensual: document.getElementById('tabla-mensual'), tablaMensualBody: document.getElementById('tabla-mensual-body'),
        tablaMensualEmpty: document.getElementById('tabla-mensual-empty'), tablaPlaceholders: document.querySelectorAll('#tabla-mensual-body .placeholder-row'),
        // Gráficos + Containers
        ingresosGastosChartContainer: document.querySelector('#ingresosGastosMensualChart').closest('.chart-container'),
        distribucionGastosChartContainer: document.querySelector('#distribucionGastosChart').closest('.chart-container'),
        proyeccionAnualChartContainer: document.querySelector('#proyeccionAnualChart').closest('.chart-container'),
        ingresosGastosChartCanvas: document.getElementById('ingresosGastosMensualChart'), distribucionGastosChartCanvas: document.getElementById('distribucionGastosChart'),
        proyeccionAnualChartCanvas: document.getElementById('proyeccionAnualChart'),
        // Acordeón Gastos
        accordionGastosWidgetBody: document.querySelector('#accordionGastos').parentElement,
        accordionGastos: document.getElementById('accordionGastos'), accordionPlaceholder: document.querySelector('.accordion-placeholder'),
        accordionGastosEmpty: document.getElementById('accordion-gastos-empty'),
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
        configWidgetBody: document.querySelector('.config-widget .widget__body'),
        rubrosListContainer: document.getElementById('rubros-list'), rubrosListPlaceholder: document.querySelector('#rubros-list .placeholder-glow'),
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
    const showToast = (message, type = 'info') => { /* ... (igual que antes, usa elements.toastEl, etc.) ... */ };

    // Helper UI: Establecer estado de carga (placeholders/loaders)
    const setLoadingState = (containers, isLoading) => {
        containers = Array.isArray(containers) ? containers : [containers];
        containers.forEach(container => {
            if (!container) return;
            if (isLoading) {
                container.classList.add('loading');
            } else {
                container.classList.remove('loading');
            }
        });
    };

     // Helper UI: Mostrar/Ocultar estado vacío
     const showEmptyState = (emptyElement, tableElementContainer = null) => {
        if (emptyElement) emptyElement.classList.remove('d-none');
        if (tableElementContainer) tableElementContainer.classList.add('d-none');
    };
    const hideEmptyState = (emptyElement, tableElementContainer = null) => {
        if (emptyElement) emptyElement.classList.add('d-none');
        if (tableElementContainer) tableElementContainer.classList.remove('d-none');
    };


    // --- 5. LÓGICA DE CÁLCULO ---
    const calculateYearData = (year) => { /* ... (sin cambios) ... */ };
    const calculateVariations = (year, monthIndex) => { /* ... (sin cambios) ... */ };

    // --- 6. FUNCIONES DE RENDERIZADO ---
    const renderDashboardKPIs = () => {
        const year = appState.currentYear;
        const lastMonth = getLastAvailableMonth(year);
        const kpiContainers = [elements.kpiSaldoContainer, elements.kpiIngresosContainer, elements.kpiGastosContainer, elements.kpiProyeccionContainer];

        setLoadingState(kpiContainers, false); // Quitar loading por defecto

        if (!lastMonth) {
             // Muestra $0.00 sin placeholders activos si no hay datos iniciales
             elements.kpiSaldoAcumulado.textContent = formatCurrency(0);
             elements.kpiIngresosMes.textContent = formatCurrency(0);
             elements.kpiGastosMes.textContent = formatCurrency(0);
             elements.kpiProyeccionCierre.textContent = formatCurrency(0);
        } else {
            elements.kpiSaldoAcumulado.textContent = formatCurrency(lastMonth.saldoAcumulado);
            elements.kpiIngresosMes.textContent = formatCurrency(lastMonth.totalIngresosMes);
            elements.kpiGastosMes.textContent = formatCurrency(lastMonth.gastosReales);
            const projectedClose = appState.proyeccionCache ? appState.proyeccionCache[11]?.saldoAcumulado ?? lastMonth.saldoAcumulado : lastMonth.saldoAcumulado;
            elements.kpiProyeccionCierre.textContent = formatCurrency(projectedClose);
        }
        elements.currentYearSpan.textContent = year;
    };

    const renderMonthlyTable = () => {
        const year = appState.currentYear;
        const yearData = appState.datosAnuales[year];

        elements.tablaPlaceholders.forEach(pRow => pRow.remove()); // Quitar placeholders
        elements.tablaMensualBody.innerHTML = ''; // Limpiar

        if (!yearData || yearData.length === 0) {
            showEmptyState(elements.tablaMensualEmpty, elements.tablaMensual.parentElement); // Muestra empty, oculta tabla
        } else {
            hideEmptyState(elements.tablaMensualEmpty, elements.tablaMensual.parentElement); // Oculta empty, muestra tabla
            yearData.sort((a,b) => a.mesIndex - b.mesIndex).forEach(mes => {
                 const variations = calculateVariations(year, mes.mesIndex);
                 const getBadgeClass = (value) => { /* ... */ }; // Misma lógica de clases
                const rowHtml = `
                    <tr>
                        <td class="fw-medium">${mes.mesNombre || appState.config.meses[mes.mesIndex]}</td>
                        <td>${formatCurrency(mes.totalIngresosMes)}</td><td>${formatCurrency(mes.gastosReales)}</td>
                        <td class="${mes.saldoMes >= 0 ? 'text-success' : 'text-danger'} fw-semibold">${formatCurrency(mes.saldoMes)}</td>
                        <td class="fw-bold">${formatCurrency(mes.saldoAcumulado)}</td>
                        <td><span class="badge rounded-pill ${getBadgeClass(variations.vsMesAnt)}">${formatPercentage(variations.vsMesAnt)}</span></td>
                        <td><span class="badge rounded-pill ${getBadgeClass(variations.vsAnoAnt)}">${formatPercentage(variations.vsAnoAnt)}</span></td>
                        <td class="text-end"><button class="btn btn-outline-primary btn-sm" data-month-index="${mes.mesIndex}"><i class="bi bi-search"></i></button></td>
                    </tr>`;
                 elements.tablaMensualBody.insertAdjacentHTML('beforeend', rowHtml);
            });
        }
    };

    const renderRubrosAccordion = (monthData = null) => {
        elements.accordionPlaceholder?.remove(); // Quitar placeholder visual
        elements.accordionGastos.innerHTML = ''; // Limpiar

        const dataToShow = monthData || getLastAvailableMonth(appState.currentYear);

        if (!dataToShow || !dataToShow.gastosDetalle || Object.keys(dataToShow.gastosDetalle).length === 0) {
            showEmptyState(elements.accordionGastosEmpty, elements.accordionGastos);
            return;
        }
        hideEmptyState(elements.accordionGastosEmpty, elements.accordionGastos);

        let hasContent = false;
        appState.config.rubros.forEach((rubroConfig) => { /* ... (Lógica interna igual, crea HTML para cada item) ... */ });
        if (!hasContent) showEmptyState(elements.accordionGastosEmpty, elements.accordionGastos);
    };

    const renderGestionFinanciera = () => {
         const data = appState.gestionFinanciera;
         const containers = [elements.gestionInversionesValueContainer, elements.gestionCuentaValueContainer, elements.gestionReservasValueContainer];
         setLoadingState(containers, false); // Quitar loading

         elements.gestionInversionesSaldo.textContent = formatCurrency(data.inversiones.saldo);
         elements.gestionInversionesVenc.textContent = `Vence: ${data.inversiones.vencimiento || '--/--/----'}`;
         elements.gestionCuentaSaldo.textContent = formatCurrency(data.cuentaCorriente.saldo);
         elements.gestionCuentaMov.textContent = `Últ. Mov.: ${data.cuentaCorriente.ultimoMov || '--/--/----'}`;
         elements.gestionReservasSaldo.textContent = formatCurrency(data.reservas.saldo);
         elements.gestionReservasObj.textContent = `Objetivo: ${formatCurrency(data.reservas.objetivo)}`;
         // ... (lógica de alerta predictiva) ...
    };

     const renderConfiguracion = () => {
         elements.rubrosListPlaceholder?.remove(); // Quitar placeholder
         elements.rubrosListContainer.innerHTML = '';
         if (appState.config.rubros?.length) {
             appState.config.rubros.forEach(rubro => {
                 const badge = `<span class="badge bg-secondary-subtle text-secondary-emphasis border me-1 mb-1">${rubro.nombre}</span>`;
                 elements.rubrosListContainer.insertAdjacentHTML('beforeend', badge);
             });
         } else { /* ... (mensaje vacío) ... */ }
     };


    const populateReportDropdowns = () => { /* ... (igual, habilita/deshabilita botones) ... */ };

    // --- 7. LÓGICA DE GRÁFICOS ---
    const initCharts = () => {
        Object.values(charts).forEach(chart => chart?.destroy());
        const chartContainers = [elements.ingresosGastosChartContainer, elements.distribucionGastosChartContainer, elements.proyeccionAnualChartContainer];
        setLoadingState(chartContainers, true); // Mostrar loaders

        const year = appState.currentYear;
        const yearData = appState.datosAnuales[year] || [];
        // ... (resto de la lógica de datos y opciones de Chart.js igual que antes) ...

        // Gráfico Ingresos vs Gastos
         if (elements.ingresosGastosChartCanvas) {
             if (yearData.length > 0) { /* ... Crear chart ... */ setLoadingState(elements.ingresosGastosChartContainer, false); }
             else { setLoadingState(elements.ingresosGastosChartContainer, false); /* Opcional: limpiar canvas */ }
         }
        // Gráfico Distribución Gastos
         const lastMonth = getLastAvailableMonth(year);
         if (elements.distribucionGastosChartCanvas) {
              if (lastMonth?.gastosDetalle) { /* ... Crear chart si hay datos > 0 ... */ setLoadingState(elements.distribucionGastosChartContainer, false); }
              else { setLoadingState(elements.distribucionGastosChartContainer, false); /* Opcional: limpiar canvas */ }
         }
         // Gráfico Proyección (Inicial) - Deja el loader activo
         if (elements.proyeccionAnualChartCanvas) {
             /* ... Crear chart inicial ... */
             // setLoadingState(elements.proyeccionAnualChartContainer, true); // Dejar loader activo
         }
    };

    const updateProyeccionChart = (labels, realData, projectedData) => {
         /* ... (igual que antes) ... */
         setLoadingState(elements.proyeccionAnualChartContainer, false); // Ocultar loader al actualizar
    };
    // const updateDistribucionGastosChart = (mesData) => { /* ... (igual que antes) ... */ };


    // --- 8. LÓGICA DE PROYECCIONES ---
    const calcularProyeccion = () => { /* ... (igual que antes, llama a updateProyeccionChart y showToast) ... */ };

    // --- 9. LÓGICA DE IMPORTACIÓN ---
    const handleImportSubmit = (event) => {
        event.preventDefault();
        if (!elements.formImport.checkValidity()) { /* ... (validación y toast) ... */ return; }

        // ... (obtener datos del form: mesAnio, fileInput, saldoAnteriorManual) ...
        const [yearStr, monthStr] = elements.importMes.value.split('-');
        const year = parseInt(yearStr), monthIndex = parseInt(monthStr) - 1;
        const mesNombre = appState.config.meses[monthIndex];

        // UI Feedback: Loading
        setLoadingState(elements.importLoader.parentElement, true); // Mostrar loader en modal
        elements.btnConfirmImport.disabled = true;
        elements.btnConfirmImport.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Procesando...`;

        // ** SIMULACIÓN ASÍNCRONA **
        setTimeout(() => {
            let importedData;
            let importedFinanzas = null;
            // ... (Lógica de simulación PDF/Aleatorio igual) ...
             if (year === 2025 && monthIndex === 2) {
                 importedData = JSON.parse(JSON.stringify(pdfDataMarzo2025));
                 importedFinanzas = JSON.parse(JSON.stringify(pdfFinanzasMarzo2025)); // Cargar finanzas también
                 // ... (ajuste saldo anterior manual si es necesario) ...
                 importedData.totalIngresosMes = importedData.ingresos.total;
                 importedData.gastosReales = importedData.egresos.total;
             } else { /* ... (generar datos aleatorios) ... */ }

            // Actualizar estado
             if (!appState.datosAnuales[year]) appState.datosAnuales[year] = [];
             const existingIndex = appState.datosAnuales[year].findIndex(m => m.mesIndex === monthIndex);
             if (existingIndex > -1) appState.datosAnuales[year][existingIndex] = importedData;
             else appState.datosAnuales[year].push(importedData);
             appState.currentYear = year;
             if(importedFinanzas) appState.gestionFinanciera = importedFinanzas; // Actualizar finanzas si venían

            // UI Feedback: Fin Loading
            setLoadingState(elements.importLoader.parentElement, false); // Ocultar loader
            elements.btnConfirmImport.disabled = false;
            elements.btnConfirmImport.innerHTML = `<i class="bi bi-check-lg me-1"></i> Procesar Archivo`; // Restaurar texto botón
            appState.bootstrap.importModalInstance.hide();
            elements.formImport.reset();
            elements.formImport.classList.remove('was-validated');

            // Recalcular, Renderizar, Notificar
            calculateYearData(year);
            renderUI(); // <--- LLAMADA CLAVE para actualizar TODA la interfaz
            populateReportDropdowns();
            showToast(`Datos para ${mesNombre} ${year} procesados.`, 'success');

        }, 1500);
    };

    // --- 10. LÓGICA DE GENERACIÓN DE REPORTES ---
    const generarPdfVecinos = () => { /* ... (sin cambios) ... */ };
    const exportarExcel = () => { /* ... (sin cambios) ... */ };
    const generarPdfDetallado = () => { /* ... (sin cambios) ... */ };

    // --- 11. NAVEGACIÓN Y MANEJO DE UI ---
    const navigateToSection = (sectionId) => {
        const currentActiveSection = document.querySelector('.app-section.active');
        const targetSection = document.getElementById(sectionId);

        if (targetSection && sectionId !== appState.activeSection) {
            // Ocultar sección actual sin animación de salida por simplicidad
            if (currentActiveSection) currentActiveSection.classList.remove('active');

            // Mostrar nueva sección y aplicar animación de entrada
            targetSection.classList.add('active', appState.config.animationClassIn);
            // Remover clase de animación después de que termine
            targetSection.addEventListener('animationend', () => {
                 targetSection.classList.remove(appState.config.animationClassIn);
            }, { once: true });

            appState.activeSection = sectionId;
            // ... (actualizar título y link activo sidebar) ...
             elements.mainContent.scrollTo(0, 0);
        }
    };

    const setupEventListeners = () => {
         // Navegación Sidebar
         document.querySelectorAll('.app-sidebar__nav .nav-link[data-section]').forEach(link => { /* ... (igual que antes) ... */ });
         // Toggle Sidebar Button
         elements.sidebarToggle?.addEventListener('click', () => {
              elements.body.classList.toggle('sidebar-hidden');
              appState.isSidebarHidden = elements.body.classList.contains('sidebar-hidden');
         });
         // Click outside sidebar (para cerrar en móvil/tablet)
          document.addEventListener('click', (e) => { /* ... (igual que antes) ... */ });
         // SUBMIT del Formulario de Importación
         elements.formImport.addEventListener('submit', handleImportSubmit);
         // Botones y Selects de Reporte
         elements.btnCalcularProyeccion.addEventListener('click', calcularProyeccion);
         elements.btnGenerarReporteVecinoPdf.addEventListener('click', generarPdfVecinos);
         elements.btnExportarExcel.addEventListener('click', exportarExcel);
         elements.btnExportarPdfDetallado.addEventListener('click', generarPdfDetallado);
         elements.selectMesReporteVecino.addEventListener('change', () => { elements.btnGenerarReporteVecinoPdf.disabled = !elements.selectMesReporteVecino.value; });
         elements.selectMesReporteInterno.addEventListener('change', () => { /* ... (habilita/deshabilita botones excel/pdf det) ... */ });
          // Detalle en tabla
         elements.tablaMensualBody.addEventListener('click', (event) => {
             const button = event.target.closest('button[data-month-index]');
             if (button) { /* ... (actualiza gráfico torta y acordeón) ... */ }
         });
    };

    // const updateDistribucionGastosChart = (mesData) => { /* ... (sin cambios) ... */ };

    // --- 12. FUNCIÓN DE INICIALIZACIÓN PRINCIPAL ---
    const renderUI = (isInitialLoad = false) => {
        const kpiContainers = [elements.kpiSaldoContainer, elements.kpiIngresosContainer, elements.kpiGastosContainer, elements.kpiProyeccionContainer];
        const financeContainers = [elements.gestionInversionesValueContainer, elements.gestionCuentaValueContainer, elements.gestionReservasValueContainer];
        const chartContainers = [elements.ingresosGastosChartContainer, elements.distribucionGastosChartContainer, elements.proyeccionAnualChartContainer];

        if (isInitialLoad) {
            // Mostrar todos los placeholders/loaders al inicio
            setLoadingState(kpiContainers, true);
            setLoadingState(financeContainers, true);
            elements.tablaPlaceholders.forEach(p => p.style.display = ''); // Mostrar placeholders tabla
            elements.accordionPlaceholder?.style.display = ''; // Mostrar placeholder acordeón
            setLoadingState(chartContainers, true); // Mostrar loaders gráficos
             elements.rubrosListPlaceholder?.style.display = ''; // Mostrar placeholder rubros
        }

        // Renderizar contenido (esto quitará placeholders/loaders si hay datos)
        renderDashboardKPIs();
        renderMonthlyTable();
        initCharts(); // Esto maneja sus propios loaders
        renderRubrosAccordion();
        renderGestionFinanciera();
        renderConfiguracion();
        // La proyección se renderiza por separado
    };

    const init = () => {
        console.log('Inicializando...');
        // Inicializar Bootstrap
        appState.bootstrap.toastInstance = new bootstrap.Toast(elements.toastEl, { delay: 4000 });
        appState.bootstrap.importModalInstance = new bootstrap.Modal(elements.importModalEl);

        elements.currentYearSpan.textContent = appState.currentYear;
        elements.footerYear.textContent = appState.currentYear;

        // 1. Mostrar UI Inicial con Placeholders/Loaders
        renderUI(true);

        // 2. Carga (simulada) de datos iniciales y cálculo
        handleImportDataSimulation(pdfDataMarzo2025); // Carga Marzo 2025
        calculateYearData(appState.currentYear); // Calcular saldos, etc.

        // 3. Renderizar con datos reales (quita placeholders/loaders) y poblar dropdowns
        // Usar un pequeño delay para que se vean los placeholders brevemente
        setTimeout(() => {
            renderUI(false);
            populateReportDropdowns();
            // Calcular proyección inicial si hay datos
            if (getLastAvailableMonth(appState.currentYear)) calcularProyeccion();
        }, 300); // Delay para efecto visual

        // 4. Configurar listeners y mostrar sección inicial
        setupEventListeners();
        navigateToSection(appState.activeSection);

        // 5. Quitar clase de pre-carga global
        elements.body.classList.remove('app-loading');
        console.log('Aplicación lista.');
    };

    // Simulación inicial (sin cambios)
     const handleImportDataSimulation = (simulatedData) => {
         const year = simulatedData.year;
         if (!appState.datosAnuales[year]) appState.datosAnuales[year] = [];
         appState.datosAnuales[year].push(simulatedData);
         appState.currentYear = year;
         // Cargar también los datos financieros asociados si existen
         if(year === 2025 && simulatedData.monthIndex === 2) { // Asumiendo que solo Marzo 25 trae datos financieros
              appState.gestionFinanciera = JSON.parse(JSON.stringify(pdfFinanzasMarzo2025));
         }
     };

    // --- Ejecutar inicialización ---
    document.addEventListener('DOMContentLoaded', init);

})();