// js/app.js

(() => {
    'use strict';

    // --- 1. ESTADO DE LA APLICACIÓN ---
    const appState = {
        currentYear: new Date().getFullYear(),
        activeSection: 'dashboard',
        isSidebarHidden: false, // Controla si el sidebar está oculto
        config: {
            rubros: [
                { id: 'remuneraciones', nombre: 'Remuneraciones', pdfId: 1 }, { id: 'aportes_cargas', nombre: 'Aportes y Cargas Sociales', pdfId: 2 },
                { id: 'servicios_publicos', nombre: 'Servicios Públicos', pdfId: 3 }, { id: 'abonos', nombre: 'Abonos de Servicios', pdfId: 4 },
                { id: 'mantenimiento', nombre: 'Mantenimiento P. Comunes', pdfId: 5 }, { id: 'administracion', nombre: 'Gastos Administración', pdfId: 7 },
                { id: 'bancarios', nombre: 'Gastos Bancarios', pdfId: 8 }, { id: 'limpieza', nombre: 'Gastos Limpieza', pdfId: 9 },
                { id: 'seguridad', nombre: 'Seguridad', pdfId: 11 }, { id: 'legales', nombre: 'Legales', pdfId: 12 },
                { id: 'varios', nombre: 'Varios', pdfId: 13 }, { id: 'extraordinarios', nombre: 'Gastos Extraordinarios', pdfId: null},
            ],
            meses: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
            animationClassIn: 'fade-in', // Usar la clase CSS simple
        },
        datosAnuales: {},
        proyeccionCache: null,
        gestionFinanciera: { // Valores iniciales
            inversiones: { saldo: 0, vencimiento: null, tipo: null }, cuentaCorriente: { saldo: 0, ultimoMov: null },
            reservas: { saldo: 0, objetivo: 0, proposito: null }
        },
        bootstrap: { toastInstance: null, importModalInstance: null }
    };

    // --- DATOS SIMULADOS PDF (MARZO 2025) ---
    // (Mantenemos la estructura para simulación)
    const pdfDataMarzo2025 = { /* ... (datos del PDF como en la versión anterior) ... */
        year: 2025, monthIndex: 2, mesNombre: "Marzo",
        saldoAnterior: 2761430.18,
        ingresos: { pagosTermino: 24603844.48, pagosAdeudados: 1843270.17, intereses: 109098.61, otros: 5000000.00, total: 31556213.26 },
        egresos: { gastosOrd: 28628717.49, gastosExt: 0, otros: 0, total: 28628717.49 },
        saldoCierre: 5688925.95,
        totalIngresosMes: 31556213.26, gastosReales: 28628717.49,
        gastosDetalle: { /* ... (detalles mapeados del PDF) ... */
            'remuneraciones': { total: 2741514.27, items: [ {desc: 'GONZALEZ LUCIANO...', val: 855722.81}, /*...*/ {desc: 'SEGOVIA ESPINOLA...', val: 417595.92} ]},
            'aportes_cargas': { total: 2642728.94, items: [ {desc: 'AFIP (SUSS)...', val: 2398363.87}, /*...*/ {desc: 'UTEDYC...', val: 187065.01} ]},
            'servicios_publicos': { total: 2445648.05, items: [ {desc: 'AYSA...', val: 108421.00}, /*...*/ {desc: 'TELECENTRO...', val: 3328.36} ]},
            'abonos': { total: 472667.57, items: [ {desc: 'ADMINPROP...', val: 66812.00}, /*...*/ {desc: 'DE SOUSA VALENTE...', val: 235400.00} ]},
            'mantenimiento': { total: 273000.00, items: [ {desc: 'SALAS, ROBERTO CARLOS...', val: 273000.00} ]},
            'administracion': { total: 998195.00, items: [ {desc: 'FEDERACION PATRONAL...', val: 68195.00}, /*...*/ {desc: 'OCAMPO, CARLOS...', val: 480000.00} ]},
            'bancarios': { total: 384934.70, items: [ {desc: 'BANCO GALICIA - IMP DEBITOS...', val: 169797.47}, /*...*/ {desc: 'BANCO GALICIA - IVA/IIBB...', val: 12196.00} ]},
            'limpieza': { total: 1111515.34, items: [ {desc: 'COOP MUNDO RECICLADO...', val: 149379.34}, {desc: 'COVELLIA...', val: 962136.00} ]},
            'seguridad': { total: 17124415.60, items: [ {desc: 'ABELLA, IGNACIO...', val: 1700000.00}, /*...*/ {desc: 'SCYTHIA S.A....', val: 3090714.38} ]},
            'legales': { total: 178430.00, items: [ {desc: 'PEÑA, CECILIA...', val: 178430.00} ]},
            'varios': { total: 255668.02, items: [ {desc: 'CASA ZAMBIAZZO - CAJA REFLEC...', val: 58817.34}, /*...*/ {desc: 'MIRVAR S.A. - COMBUSTIBLE...', val: 160000.00} ]},
            'extraordinarios': { total: 0, items: [] }
        }
    };

    // --- 2. SELECCIÓN DE ELEMENTOS DEL DOM ---
    const elements = {
        body: document.body,
        sidebar: document.getElementById('sidebar'),
        mainPanel: document.querySelector('.main-panel'),
        mainContent: document.querySelector('.main-content'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        sectionTitle: document.getElementById('sectionTitle'),
        currentYearSpan: document.getElementById('current-year'),
        footerYear: document.getElementById('footer-year'),
        appSections: document.querySelectorAll('.app-section'),
        // KPIs + Placeholders
        kpiSaldoAcumulado: document.getElementById('kpi-saldo-acumulado'),
        kpiIngresosMes: document.getElementById('kpi-ingresos-mes'),
        kpiGastosMes: document.getElementById('kpi-gastos-mes'),
        kpiProyeccionCierre: document.getElementById('kpi-proyeccion-cierre'),
        kpiValueDivs: document.querySelectorAll('.kpi-widget .kpi-value'), // Divs que contienen el span/placeholder
        // Tabla Mensual + Empty State + Placeholders
        tablaMensualWidget: document.querySelector('.table-widget'), // Contenedor de la tabla
        tablaMensual: document.getElementById('tabla-mensual'),
        tablaMensualBody: document.getElementById('tabla-mensual-body'),
        tablaMensualEmpty: document.getElementById('tabla-mensual-empty'),
        tablaPlaceholders: document.querySelectorAll('#tabla-mensual-body .placeholder-row'),
        // Gráficos + Loaders
        ingresosGastosChartCanvas: document.getElementById('ingresosGastosMensualChart'),
        distribucionGastosChartCanvas: document.getElementById('distribucionGastosChart'),
        proyeccionAnualChartCanvas: document.getElementById('proyeccionAnualChart'),
        chartLoaders: document.querySelectorAll('.chart-loader'),
        // Acordeón Gastos + Placeholders/Empty
        accordionGastosWidget: document.querySelector('.accordion-widget'), // Contenedor
        accordionGastos: document.getElementById('accordionGastos'),
        accordionPlaceholders: document.querySelectorAll('#accordionGastos .placeholder-glow'),
        accordionGastosEmpty: document.getElementById('accordion-gastos-empty'),
        // Proyecciones
        formProyeccion: document.getElementById('form-proyeccion'),
        paramIPC: document.getElementById('param-ipc'),
        paramAumVig: document.getElementById('param-aum-vig'),
        paramAumMant: document.getElementById('param-aum-mant'),
        paramOptimizacion: document.getElementById('param-optimizacion'),
        btnCalcularProyeccion: document.getElementById('btn-calcular-proyeccion'),
        proyCierreEscenario: document.getElementById('proy-cierre-escenario'),
        proyImpacto: document.getElementById('proy-impacto'),
        // Reportes + Buttons
        selectMesReporteVecino: document.getElementById('select-mes-reporte-vecino'),
        btnGenerarReporteVecinoPdf: document.getElementById('btn-generar-reporte-vecino-pdf'),
        selectMesReporteInterno: document.getElementById('select-mes-reporte-interno'),
        btnExportarExcel: document.getElementById('btn-exportar-excel'),
        btnExportarPdfDetallado: document.getElementById('btn-exportar-pdf-detallado'),
        // Gestión Financiera
        gestionInversionesSaldo: document.getElementById('gestion-inversiones-saldo'),
        gestionInversionesVenc: document.getElementById('gestion-inversiones-venc'),
        gestionCuentaSaldo: document.getElementById('gestion-cuenta-saldo'),
        gestionCuentaMov: document.getElementById('gestion-cuenta-mov'),
        gestionReservasSaldo: document.getElementById('gestion-reservas-saldo'),
        gestionReservasObj: document.getElementById('gestion-reservas-obj'),
        alertaPredictiva: document.getElementById('alerta-predictiva'),
        alertaPredictivaMensaje: document.getElementById('alerta-predictiva-mensaje'),
        // Configuración
        configWidget: document.querySelector('.config-widget'), // Contenedor
        rubrosListContainer: document.getElementById('rubros-list'),
        rubrosListPlaceholder: document.querySelector('#rubros-list .placeholder-glow'),
        // Modal Importar + Loader
        importModalEl: document.getElementById('importModal'),
        formImport: document.getElementById('form-import'),
        importMes: document.getElementById('import-mes'),
        importFile: document.getElementById('import-file'),
        importSaldoAnterior: document.getElementById('import-saldo-anterior'),
        btnConfirmImport: document.getElementById('btn-confirm-import'),
        importLoader: document.getElementById('import-loader'),
        // Toast
        toastEl: document.getElementById('appToast'),
        toastIcon: document.getElementById('toastIcon'),
        toastBody: document.getElementById('toastBody'),
    };

    // --- 3. GRÁFICOS (Chart.js Instances) ---
    let charts = { /* ... (sin cambios) ... */ };

    // --- 4. FUNCIONES HELPER ---
    const formatCurrency = (value) => { /* ... (sin cambios) ... */ };
    const formatPercentage = (value) => { /* ... (sin cambios) ... */ };
    const getMonthData = (year, monthIndex) => { /* ... (sin cambios) ... */ };
    const getLastAvailableMonth = (year) => { /* ... (sin cambios) ... */ };
    const showToast = (message, type = 'info') => { /* ... (sin cambios, usa nueva estructura) ... */ };

    // Helper para mostrar/ocultar placeholders/loaders
    const setElementLoading = (element, isLoading) => {
        if (!element) return;
        const placeholderOrLoader = element.querySelector('.placeholder, .chart-loader, .placeholder-row, .placeholder-glow');
        if (placeholderOrLoader) {
            placeholderOrLoader.style.display = isLoading ? '' : 'none';
            // Si es un loader de chart, también ocultar/mostrar el canvas
             if (element.classList.contains('chart-container')) {
                 element.querySelector('canvas').style.visibility = isLoading ? 'hidden' : 'visible';
             }
        }
        // Para KPIs (donde el valor y placeholder están juntos)
        if (element.classList.contains('kpi-value')) {
            const valueSpan = element.querySelector('span[id^="kpi-"]');
            if (valueSpan) valueSpan.style.display = isLoading ? 'none' : '';
            if (placeholderOrLoader) placeholderOrLoader.style.display = isLoading ? '' : 'none';
        }
    };

     // Helper para revelar contenido después de quitar placeholder (para KPIs)
    const revealKPIContent = (spanElement, value, isCurrency = true) => {
        if (!spanElement) return;
        const parentDiv = spanElement.parentElement; // El div .kpi-value
        const placeholder = parentDiv.querySelector('.placeholder');

        if (placeholder) {
             placeholder.style.display = 'none'; // Ocultar placeholder
             placeholder.classList.remove('placeholder','w-75','w-80','w-100'); // Limpiar clases por si acaso
        }
        spanElement.textContent = isCurrency ? formatCurrency(value) : value;
        spanElement.style.display = ''; // Mostrar el span con el valor
        // Añadir animación suave al span
        spanElement.classList.add('animate__animated', 'animate__fadeIn', 'animate__faster');
        spanElement.addEventListener('animationend', () => {
             spanElement.classList.remove('animate__animated', 'animate__fadeIn', 'animate__faster');
        }, { once: true });
    };


    // --- 5. LÓGICA DE CÁLCULO ---
    // (Sin cambios en calculateYearData y calculateVariations)
     const calculateYearData = (year) => { /* ... (sin cambios) ... */ };
     const calculateVariations = (year, monthIndex) => { /* ... (sin cambios) ... */ };

    // --- 6. FUNCIONES DE RENDERIZADO ---

    const renderDashboardKPIs = () => {
        const year = appState.currentYear;
        const lastMonth = getLastAvailableMonth(year);

        // Ocultar todos los placeholders de KPI inicialmente
        elements.kpiValueDivs.forEach(div => setElementLoading(div, false));

        if (!lastMonth) {
            // Si no hay datos, mostrar placeholders y limpiar valores
            elements.kpiValueDivs.forEach(div => setElementLoading(div, true));
            revealKPIContent(elements.kpiSaldoAcumulado, 0); // Mostrar $ 0,00 en lugar de placeholder vacío
            revealKPIContent(elements.kpiIngresosMes, 0);
            revealKPIContent(elements.kpiGastosMes, 0);
            revealKPIContent(elements.kpiProyeccionCierre, 0);
        } else {
            // Si hay datos, revela el contenido
            revealKPIContent(elements.kpiSaldoAcumulado, lastMonth.saldoAcumulado);
            revealKPIContent(elements.kpiIngresosMes, lastMonth.totalIngresosMes);
            revealKPIContent(elements.kpiGastosMes, lastMonth.gastosReales);
            const projectedClose = appState.proyeccionCache ? appState.proyeccionCache[11]?.saldoAcumulado ?? lastMonth.saldoAcumulado : lastMonth.saldoAcumulado;
             revealKPIContent(elements.kpiProyeccionCierre, projectedClose);
        }
        elements.currentYearSpan.textContent = year;
    };

    const renderMonthlyTable = () => {
        const year = appState.currentYear;
        const yearData = appState.datosAnuales[year];

        // Ocultar placeholders
        elements.tablaPlaceholders.forEach(pRow => pRow.remove());
        elements.tablaMensualBody.innerHTML = ''; // Limpiar

        if (!yearData || yearData.length === 0) {
            elements.tablaMensual.classList.add('d-none'); // Ocultar tabla real
            elements.tablaMensualEmpty.classList.remove('d-none'); // Mostrar mensaje vacío
        } else {
            elements.tablaMensual.classList.remove('d-none'); // Mostrar tabla real
            elements.tablaMensualEmpty.classList.add('d-none'); // Ocultar mensaje vacío
            yearData.sort((a,b) => a.mesIndex - b.mesIndex); // Ordenar
            yearData.forEach(mes => {
                const variations = calculateVariations(year, mes.mesIndex);
                const getBadgeClass = (value) => { /* ... (misma lógica de badge) ... */ };
                const rowHtml = `
                    <tr>
                        <td class="fw-medium">${mes.mesNombre || appState.config.meses[mes.mesIndex]}</td>
                        <td>${formatCurrency(mes.totalIngresosMes)}</td>
                        <td>${formatCurrency(mes.gastosReales)}</td>
                        <td class="${mes.saldoMes >= 0 ? 'text-success' : 'text-danger'} fw-semibold">${formatCurrency(mes.saldoMes)}</td>
                        <td class="fw-bold">${formatCurrency(mes.saldoAcumulado)}</td>
                        <td><span class="badge rounded-pill ${getBadgeClass(variations.vsMesAnt)}">${formatPercentage(variations.vsMesAnt)}</span></td>
                        <td><span class="badge rounded-pill ${getBadgeClass(variations.vsAnoAnt)}">${formatPercentage(variations.vsAnoAnt)}</span></td>
                        <td class="text-end">
                            <button class="btn btn-outline-primary btn-sm" data-month-index="${mes.mesIndex}" title="Ver Detalle Gasto ${mes.mesNombre || ''}">
                                <i class="bi bi-search"></i>
                            </button>
                        </td>
                    </tr>`;
                elements.tablaMensualBody.insertAdjacentHTML('beforeend', rowHtml);
            });
        }
    };

    const renderRubrosAccordion = (monthData = null) => {
        // Ocultar placeholders
        elements.accordionPlaceholders.forEach(pItem => pItem.remove());
        elements.accordionGastos.innerHTML = ''; // Limpiar

        const year = appState.currentYear;
        const dataToShow = monthData || getLastAvailableMonth(year);

        if (!dataToShow || !dataToShow.gastosDetalle || Object.keys(dataToShow.gastosDetalle).length === 0) {
            elements.accordionGastosEmpty.classList.remove('d-none');
            return;
        }
        elements.accordionGastosEmpty.classList.add('d-none');

        let hasContent = false;
        appState.config.rubros.forEach((rubroConfig) => {
            const rubroData = dataToShow.gastosDetalle[rubroConfig.id];
            if (!rubroData || !rubroData.total || rubroData.total === 0) return;
            hasContent = true;
            // ... (resto de la lógica del acordeón sin cambios, usando la nueva estructura HTML si es necesario) ...
            const collapseId = `collapse${rubroConfig.id}${Date.now()}`;
            const headingId = `heading${rubroConfig.id}${Date.now()}`;
            let itemsHtml = /* ... (igual que antes) ... */ ;
            const accordionItemHtml = `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="${headingId}">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                            ${rubroConfig.nombre}
                            <span class="ms-auto fw-bold text-primary">${formatCurrency(rubroData.total)}</span>
                        </button>
                    </h2>
                    <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headingId}" data-bs-parent="#accordionGastos">
                        <div class="accordion-body pt-0">
                            ${itemsHtml}
                        </div>
                    </div>
                </div>`;
             elements.accordionGastos.insertAdjacentHTML('beforeend', accordionItemHtml);
        });

        if (!hasContent) elements.accordionGastosEmpty.classList.remove('d-none');
    };

    const renderGestionFinanciera = () => {
         const data = appState.gestionFinanciera;
         // Usa revealContent pero adaptado para estos elementos si es necesario o simplemente actualiza
         elements.gestionInversionesSaldo.textContent = formatCurrency(data.inversiones.saldo);
         elements.gestionInversionesVenc.textContent = `Vence: ${data.inversiones.vencimiento || '--/--/----'}`;
         elements.gestionCuentaSaldo.textContent = formatCurrency(data.cuentaCorriente.saldo);
         elements.gestionCuentaMov.textContent = `Últ. Mov.: ${data.cuentaCorriente.ultimoMov || '--/--/----'}`;
         elements.gestionReservasSaldo.textContent = formatCurrency(data.reservas.saldo);
         elements.gestionReservasObj.textContent = `Objetivo: ${formatCurrency(data.reservas.objetivo)}`;
        // ... (lógica de alerta predictiva sin cambios) ...
    };

    const renderConfiguracion = () => {
        elements.rubrosListPlaceholder?.remove(); // Quitar placeholder
        elements.rubrosListContainer.innerHTML = '';
        if (appState.config.rubros && appState.config.rubros.length > 0) {
             appState.config.rubros.forEach(rubro => {
                 const badge = `<span class="badge text-bg-light border me-1 mb-1">${rubro.nombre}</span>`; // Estilo badge
                 elements.rubrosListContainer.insertAdjacentHTML('beforeend', badge);
             });
         } else { /* ... (mensaje vacío) ... */ }
    };

    const populateReportDropdowns = () => { /* ... (sin cambios, pero asegurar que habilita/deshabilita botones) ... */ };

    // --- 7. LÓGICA DE GRÁFICOS ---
    const initCharts = () => {
        Object.values(charts).forEach(chart => chart?.destroy());
        elements.chartLoaders.forEach(loader => loader.style.display = 'block'); // Mostrar loaders

        const year = appState.currentYear;
        const yearData = appState.datosAnuales[year] || [];
        yearData.sort((a, b) => a.mesIndex - b.mesIndex);
        const labels = yearData.map(m => appState.config.meses[m.mesIndex].substring(0, 3));
        const ingresosData = yearData.map(m => m.totalIngresosMes);
        const gastosData = yearData.map(m => m.gastosReales);

        const chartOptionsBase = { /* ... (Opciones base mejoradas de la versión anterior) ... */ };

        // Gráfico Ingresos vs Gastos
        if (elements.ingresosGastosChartCanvas) {
            if (yearData.length > 0) {
                const ctx1 = elements.ingresosGastosChartCanvas.getContext('2d');
                 charts.ingresosGastosMensual = new Chart(ctx1, { /* ... (config chart línea) ... */ });
                 elements.ingresosGastosChartCanvas.nextElementSibling.style.display = 'none'; // Ocultar loader
            } else {
                elements.ingresosGastosChartCanvas.nextElementSibling.style.display = 'none'; // Ocultar loader si no hay datos
                // Opcional: Mostrar mensaje de "sin datos" en el canvas
            }
        }

        // Gráfico Distribución Gastos
        const lastMonth = getLastAvailableMonth(year);
        if (elements.distribucionGastosChartCanvas) {
             if (lastMonth?.gastosDetalle) {
                 // ... (lógica para extraer labels y data > 0) ...
                 if(gastoData.length > 0) {
                     const ctx2 = elements.distribucionGastosChartCanvas.getContext('2d');
                     charts.distribucionGastos = new Chart(ctx2, { /* ... (config chart donut) ... */ });
                     elements.distribucionGastosChartCanvas.nextElementSibling.style.display = 'none';
                 } else {
                     elements.distribucionGastosChartCanvas.nextElementSibling.style.display = 'none';
                 }
             } else {
                  elements.distribucionGastosChartCanvas.nextElementSibling.style.display = 'none';
             }
        }

        // Gráfico Proyección (Inicial)
        if (elements.proyeccionAnualChartCanvas) {
            // ... (Crear gráfico inicial, NO ocultar loader aún) ...
             const ctx3 = elements.proyeccionAnualChartCanvas.getContext('2d');
             // ...
             elements.proyeccionAnualChartCanvas.nextElementSibling.style.display = 'block'; // Dejar loader visible
        }
    };

    const updateProyeccionChart = (labels, realData, projectedData) => {
        // ... (Lógica igual, pero ASEGURAR que oculta el loader al final) ...
        charts.proyeccionAnual.update();
        const loader = elements.proyeccionAnualChartCanvas?.nextElementSibling;
        if (loader) loader.style.display = 'none';
    };
    // (Igual para updateDistribucionGastosChart si se quiere loader)

    // --- 8. LÓGICA DE PROYECCIONES ---
    const calcularProyeccion = () => { /* ... (sin cambios en cálculo, usa showToast) ... */ };

    // --- 9. LÓGICA DE IMPORTACIÓN ---
    const handleImportSubmit = (event) => { // Renombrado para claridad
        event.preventDefault(); // Prevenir envío real del form

        // Validar
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
        const fileName = fileInput.files[0].name;

        // UI: Mostrar loader y deshabilitar botón
        elements.importLoader.classList.remove('d-none');
        elements.btnConfirmImport.disabled = true;
        elements.btnConfirmImport.querySelector('.spinner-border')?.remove(); // Limpiar por si acaso
        elements.btnConfirmImport.insertAdjacentHTML('afterbegin', '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> ');

        // ** SIMULACIÓN ASÍNCRONA **
        setTimeout(() => {
            console.log(`Simulando importación para ${mesNombre} ${year} desde ${fileName}...`);
            let importedData;
            // ... (Lógica de simulación PDF / Aleatorio como antes) ...
             if (year === 2025 && monthIndex === 2) { /* ... datos PDF ... */ }
             else { /* ... datos aleatorios ... */ }

            // Actualizar estado
             if (!appState.datosAnuales[year]) appState.datosAnuales[year] = [];
             const existingIndex = appState.datosAnuales[year].findIndex(m => m.mesIndex === monthIndex);
             if (existingIndex > -1) appState.datosAnuales[year][existingIndex] = importedData;
             else appState.datosAnuales[year].push(importedData);
             appState.currentYear = year;

              // Actualizar datos financieros si se importó Marzo 2025
             if (year === 2025 && monthIndex === 2) {
                appState.gestionFinanciera = {
                     inversiones: { saldo: 18005079.55, vencimiento: 'N/A', tipo: 'FIMA PREMIUM CLASE A' },
                     cuentaCorriente: { saldo: 5687660.89, ultimoMov: '31/03/2025' },
                     reservas: { saldo: 0, objetivo: 0, proposito: 'N/A' }
                };
             }


            // UI: Ocultar loader, habilitar botón, cerrar modal
            elements.importLoader.classList.add('d-none');
            elements.btnConfirmImport.disabled = false;
            elements.btnConfirmImport.querySelector('.spinner-border')?.remove();
            appState.bootstrap.importModalInstance.hide();
            elements.formImport.reset();
            elements.formImport.classList.remove('was-validated'); // Limpiar validación visual

            // Recalcular, renderizar y notificar
            calculateYearData(year);
            renderUI(); // Renderiza toda la UI con los nuevos datos
            populateReportDropdowns();
            showToast(`Datos para ${mesNombre} ${year} procesados con éxito.`, 'success');

        }, 1800); // Simular 1.8 segundos
    };


    // --- 10. LÓGICA DE GENERACIÓN DE REPORTES ---
    // (Sin cambios, usan showToast para feedback)
    const generarPdfVecinos = () => { /* ... (código anterior) ... */ };
    const exportarExcel = () => { /* ... (código anterior) ... */ };
    const generarPdfDetallado = () => { /* ... (código anterior) ... */ };

    // --- 11. NAVEGACIÓN Y MANEJO DE UI ---
    const navigateToSection = (sectionId) => {
        const currentActiveSection = document.querySelector('.app-section.active');
        const targetSection = document.getElementById(sectionId);

        if (targetSection && sectionId !== appState.activeSection) {
            if (currentActiveSection) {
                currentActiveSection.classList.remove('active', appState.config.animationClassIn);
            }

            targetSection.classList.remove('d-none'); // Asegurarse de que no esté oculta por display:none
            targetSection.classList.add('active', appState.config.animationClassIn);
            appState.activeSection = sectionId;

            const sectionLink = document.querySelector(`.sidebar-nav .nav-link[data-section="${sectionId}"]`);
            elements.sectionTitle.textContent = sectionLink?.querySelector('span')?.textContent || 'Detalle';
            document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => link.classList.remove('active'));
            sectionLink?.classList.add('active');

             elements.mainContent.scrollTo(0, 0); // Scroll al inicio del contenido
        }
    };

    const setupEventListeners = () => {
        // Navegación Sidebar
        document.querySelectorAll('.sidebar-nav .nav-link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigateToSection(link.getAttribute('data-section'));
                if (window.innerWidth < 992 && !appState.isSidebarHidden) { // Ocultar si no estaba oculta en móvil
                    elements.body.classList.add('sidebar-hidden');
                    appState.isSidebarHidden = true;
                }
            });
        });

        // Toggle Sidebar Button
        elements.sidebarToggle?.addEventListener('click', () => {
            elements.body.classList.toggle('sidebar-hidden');
            appState.isSidebarHidden = elements.body.classList.contains('sidebar-hidden');
        });

         // Click outside sidebar to close on mobile
         document.addEventListener('click', (e) => {
             if (window.innerWidth < 992 && !appState.isSidebarHidden) { // Solo si está VISIBLE
                if (!elements.sidebar.contains(e.target) && !elements.sidebarToggle?.contains(e.target)) {
                    elements.body.classList.add('sidebar-hidden');
                    appState.isSidebarHidden = true;
                 }
             }
         });


        // Submit del Formulario de Importación
        elements.formImport.addEventListener('submit', handleImportSubmit); // Asociar al SUBMIT

        // Otros botones
        elements.btnCalcularProyeccion.addEventListener('click', calcularProyeccion);
        elements.btnGenerarReporteVecinoPdf.addEventListener('click', generarPdfVecinos);
        elements.btnExportarExcel.addEventListener('click', exportarExcel);
        elements.btnExportarPdfDetallado.addEventListener('click', generarPdfDetallado);

        // Detalle en tabla
         elements.tablaMensualBody.addEventListener('click', (event) => { /* ... (sin cambios) ... */ });

         // Habilitar/deshabilitar botones de reporte al cambiar selección
         elements.selectMesReporteVecino.addEventListener('change', () => {
             elements.btnGenerarReporteVecinoPdf.disabled = !elements.selectMesReporteVecino.value;
         });
         elements.selectMesReporteInterno.addEventListener('change', () => {
              const isDisabled = !elements.selectMesReporteInterno.value;
              elements.btnExportarExcel.disabled = isDisabled;
              elements.btnExportarPdfDetallado.disabled = isDisabled || elements.selectMesReporteInterno.value === 'anual';
         });
    };

    // Actualizar gráfico torta (sin cambios mayores)
     const updateDistribucionGastosChart = (mesData) => { /* ... (código anterior) ... */ };


    // --- 12. FUNCIÓN DE INICIALIZACIÓN PRINCIPAL ---
    const renderUI = () => {
        renderDashboardKPIs();
        renderMonthlyTable();
        initCharts();
        renderRubrosAccordion();
        renderGestionFinanciera();
        renderConfiguracion();
    };

    const init = () => {
        console.log('Inicializando Centauro Finanzas Pro...');
        // Inicializar Bootstrap
        appState.bootstrap.toastInstance = new bootstrap.Toast(elements.toastEl);
        appState.bootstrap.importModalInstance = new bootstrap.Modal(elements.importModalEl);

        elements.currentYearSpan.textContent = appState.currentYear;
        elements.footerYear.textContent = appState.currentYear;

        // Carga simulada inicial (Marzo 2025)
        handleImportDataSimulation(pdfDataMarzo2025);

        calculateYearData(appState.currentYear);
        renderUI(); // Renderiza con placeholders/loaders inicialmente
        populateReportDropdowns();
        setupEventListeners();
        navigateToSection(appState.activeSection);

        // Quitar preload class
        setTimeout(() => elements.body.classList.remove('preload'), 50);
        console.log('Aplicación lista.');
    };

     // Simulación inicial (sin cambios)
     const handleImportDataSimulation = (simulatedData) => { /* ... (código anterior) ... */ };

    // --- Ejecutar inicialización ---
    document.addEventListener('DOMContentLoaded', init);

})(); // Fin del IIFE