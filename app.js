// js/app.js

(() => {
    'use strict';

    // --- 1. ESTADO DE LA APLICACIÓN ---
    const appState = {
        currentYear: new Date().getFullYear(), // Año actual por defecto
        activeSection: 'dashboard',
        isSidebarToggled: false, // Para estado del sidebar
        config: {
            rubros: [ // Mapeo consistente con CSS e importación simulada
                { id: 'remuneraciones', nombre: 'Remuneraciones', pdfId: 1 },
                { id: 'aportes_cargas', nombre: 'Aportes y Cargas Sociales', pdfId: 2 },
                { id: 'servicios_publicos', nombre: 'Servicios Públicos', pdfId: 3 },
                { id: 'abonos', nombre: 'Abonos de Servicios', pdfId: 4 },
                { id: 'mantenimiento', nombre: 'Mantenimiento P. Comunes', pdfId: 5 },
                { id: 'administracion', nombre: 'Gastos Administración', pdfId: 7 },
                { id: 'bancarios', nombre: 'Gastos Bancarios', pdfId: 8 },
                { id: 'limpieza', nombre: 'Gastos Limpieza', pdfId: 9 },
                { id: 'seguridad', nombre: 'Seguridad', pdfId: 11 },
                { id: 'legales', nombre: 'Legales', pdfId: 12 },
                { id: 'varios', nombre: 'Varios', pdfId: 13 },
                { id: 'extraordinarios', nombre: 'Gastos Extraordinarios', pdfId: null},
            ],
            meses: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
            animationClassIn: 'animate__fadeInUp', // Animación de entrada por defecto
            animationClassOut: 'animate__fadeOut', // Animación de salida (opcional)
        },
        datosAnuales: {},
        proyeccionCache: null,
        gestionFinanciera: { // Valores de ejemplo iniciales
            inversiones: { saldo: 0, vencimiento: null, tipo: null },
            cuentaCorriente: { saldo: 0, ultimoMov: null },
            reservas: { saldo: 0, objetivo: 0, proposito: null }
        },
        bootstrap: { // Instancias de componentes Bootstrap
            toastInstance: null,
            importModalInstance: null,
        }
    };

    // --- DATOS SIMULADOS DEL PDF (MARZO 2025) ---
    // (Mantenemos los datos extraídos del PDF para la simulación)
    const pdfDataMarzo2025 = {
        year: 2025, monthIndex: 2, mesNombre: "Marzo",
        saldoAnterior: 2761430.18,
        ingresos: { pagosTermino: 24603844.48, pagosAdeudados: 1843270.17, intereses: 109098.61, otros: 5000000.00, total: 31556213.26 },
        egresos: { gastosOrd: 28628717.49, gastosExt: 0, otros: 0, total: 28628717.49 },
        saldoCierre: 5688925.95,
        totalIngresosMes: 31556213.26, // Campo añadido para consistencia
        gastosReales: 28628717.49,     // Campo añadido
        gastosDetalle: {
            'remuneraciones': { total: 2741514.27, items: [ {desc: 'GONZALEZ LUCIANO...', val: 855722.81}, {desc: 'SEGOVIA ESPINOLA...', val: 417595.92} ]},
            'aportes_cargas': { total: 2642728.94, items: [ {desc: 'AFIP (SUSS)...', val: 2398363.87}, {desc: 'UTEDYC...', val: 187065.01} ]},
            'servicios_publicos': { total: 2445648.05, items: [ {desc: 'AYSA...', val: 108421.00}, {desc: 'TELECENTRO...', val: 3328.36} ]},
            'abonos': { total: 472667.57, items: [ {desc: 'ADMINPROP...', val: 66812.00}, {desc: 'DE SOUSA VALENTE...', val: 235400.00} ]},
            'mantenimiento': { total: 273000.00, items: [ {desc: 'SALAS, ROBERTO CARLOS...', val: 273000.00} ]},
            'administracion': { total: 998195.00, items: [ {desc: 'FEDERACION PATRONAL...', val: 68195.00}, {desc: 'OCAMPO, CARLOS...', val: 480000.00} ]},
            'bancarios': { total: 384934.70, items: [ {desc: 'BANCO GALICIA - IMP DEBITOS...', val: 169797.47}, {desc: 'BANCO GALICIA - IVA/IIBB...', val: 12196.00} ]},
            'limpieza': { total: 1111515.34, items: [ {desc: 'COOP MUNDO RECICLADO...', val: 149379.34}, {desc: 'COVELLIA...', val: 962136.00} ]},
            'seguridad': { total: 17124415.60, items: [ {desc: 'ABELLA, IGNACIO...', val: 1700000.00}, {desc: 'SCYTHIA S.A....', val: 3090714.38} ]},
            'legales': { total: 178430.00, items: [ {desc: 'PEÑA, CECILIA...', val: 178430.00} ]},
            'varios': { total: 255668.02, items: [ {desc: 'CASA ZAMBIAZZO - CAJA REFLEC...', val: 58817.34}, {desc: 'MIRVAR S.A. - COMBUSTIBLE...', val: 160000.00} ]},
            'extraordinarios': { total: 0, items: [] }
        }
    };
     // Simular datos financieros avanzados del PDF también
     appState.gestionFinanciera = {
         inversiones: { saldo: 18005079.55, vencimiento: 'N/A', tipo: 'FIMA PREMIUM CLASE A' },
         cuentaCorriente: { saldo: 5687660.89, ultimoMov: '31/03/2025' },
         reservas: { saldo: 0, objetivo: 0, proposito: 'N/A' } // El PDF no detalla reserva
     };


    // --- 2. SELECCIÓN DE ELEMENTOS DEL DOM ---
    // Seleccionar elementos clave una sola vez
    const elements = {
        body: document.body,
        sidebar: document.getElementById('sidebar'),
        mainContent: document.getElementById('main-content'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        sectionTitle: document.getElementById('sectionTitle'),
        currentYearSpan: document.getElementById('current-year'),
        appSections: document.querySelectorAll('.app-section'),
        footerYear: document.getElementById('footer-year'),
        // KPIs + Placeholders
        kpiSaldoAcumulado: document.getElementById('kpi-saldo-acumulado'),
        kpiIngresosMes: document.getElementById('kpi-ingresos-mes'),
        kpiGastosMes: document.getElementById('kpi-gastos-mes'),
        kpiProyeccionCierre: document.getElementById('kpi-proyeccion-cierre'),
        kpiPlaceholders: document.querySelectorAll('.kpi-value .placeholder'),
        // Tabla Mensual + Empty State
        tablaMensual: document.getElementById('tabla-mensual'),
        tablaMensualBody: document.getElementById('tabla-mensual-body'),
        tablaMensualEmpty: document.getElementById('tabla-mensual-empty'),
        tablaPlaceholders: document.querySelectorAll('#tabla-mensual-body .placeholder-glow'), // Seleccionar filas placeholder
        // Gráficos + Loaders
        ingresosGastosChartCanvas: document.getElementById('ingresosGastosMensualChart'),
        distribucionGastosChartCanvas: document.getElementById('distribucionGastosChart'),
        proyeccionAnualChartCanvas: document.getElementById('proyeccionAnualChart'),
        chartLoaders: document.querySelectorAll('.chart-loader'),
        // Acordeón Gastos + Placeholders/Empty
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
        rubrosListPlaceholder: document.querySelector('#configuracion .placeholder-glow'),
        rubrosListContainer: document.getElementById('rubros-list'),
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
    let charts = {
        ingresosGastosMensual: null,
        distribucionGastos: null,
        proyeccionAnual: null
    };

    // --- 4. FUNCIONES HELPER ---
    const formatCurrency = (value) => {
        if (typeof value !== 'number' || isNaN(value)) return '$ 0,00'; // Valor por defecto
        return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatPercentage = (value) => {
        if (typeof value !== 'number' || isNaN(value)) return 'N/A';
        const sign = value > 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`.replace('.', ','); // Usar coma decimal
    };

    const getMonthData = (year, monthIndex) => {
        return appState.datosAnuales[year]?.find(m => m.mesIndex === monthIndex);
    };

    const getLastAvailableMonth = (year) => {
        const yearData = appState.datosAnuales[year];
        if (!yearData || yearData.length === 0) return null;
        yearData.sort((a, b) => a.mesIndex - b.mesIndex);
        return yearData[yearData.length - 1];
    };

    // Mostrar Toast (adaptado a nueva estructura y tipos)
    const showToast = (message, type = 'info') => {
        if (!appState.bootstrap.toastInstance) return;

        elements.toastBody.textContent = message;
        const toastEl = elements.toastEl;
        const iconEl = elements.toastIcon;

        // Reset classes
        toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info', 'text-white', 'text-dark');
        iconEl.classList.remove('bi-check-circle-fill', 'bi-exclamation-triangle-fill', 'bi-info-circle-fill');

        switch (type) {
            case 'success':
                toastEl.classList.add('bg-success', 'text-white');
                iconEl.classList.add('bi-check-circle-fill');
                break;
            case 'danger':
                toastEl.classList.add('bg-danger', 'text-white');
                iconEl.classList.add('bi-exclamation-triangle-fill');
                break;
            case 'warning':
                toastEl.classList.add('bg-warning', 'text-dark'); // Texto oscuro para warning
                iconEl.classList.add('bi-exclamation-triangle-fill');
                break;
            default: // info
                toastEl.classList.add('bg-primary', 'text-white'); // Usar azul primario para info
                iconEl.classList.add('bi-info-circle-fill');
                break;
        }

        appState.bootstrap.toastInstance.show();
    };

    // --- 5. LÓGICA DE CÁLCULO ---
    // (Sin cambios en calculateYearData y calculateVariations respecto a la versión anterior)
    const calculateYearData = (year) => {
        const yearData = appState.datosAnuales[year];
        if (!yearData || yearData.length === 0) return;
        yearData.sort((a, b) => a.mesIndex - b.mesIndex);
        let saldoAcumuladoAnterior = appState.datosAnuales[year - 1] ? getLastAvailableMonth(year - 1)?.saldoAcumulado ?? 0 : 0;
        yearData.forEach((mes, index) => {
            if (mes.gastosReales === undefined) mes.gastosReales = Object.values(mes.gastosDetalle || {}).reduce((sum, rubro) => sum + (rubro.total || 0), 0);
            if (mes.totalIngresosMes === undefined) mes.totalIngresosMes = Object.values(mes.ingresos || {}).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
            mes.saldoMes = mes.totalIngresosMes - mes.gastosReales;
            if (index === 0) {
                mes.saldoAcumulado = (mes.saldoAnterior ?? saldoAcumuladoAnterior) + mes.saldoMes;
            } else {
                mes.saldoAcumulado = yearData[index - 1].saldoAcumulado + mes.saldoMes;
            }
        });
    };
    const calculateVariations = (year, monthIndex) => {
        const yearData = appState.datosAnuales[year]; if (!yearData) return { vsMesAnt: NaN, vsAnoAnt: NaN };
        const mesActual = getMonthData(year, monthIndex); const mesAnterior = getMonthData(year, monthIndex - 1);
        const mesAnoAnterior = appState.datosAnuales[year - 1] ? getMonthData(year - 1, monthIndex) : null;
        let varMesAnt = NaN; if (mesActual && mesAnterior && mesAnterior.gastosReales !== 0) { varMesAnt = ((mesActual.gastosReales - mesAnterior.gastosReales) / Math.abs(mesAnterior.gastosReales)) * 100; }
        let varAnoAnt = NaN; if (mesActual && mesAnoAnterior && mesAnoAnterior.gastosReales !== 0) { varAnoAnt = ((mesActual.gastosReales - mesAnoAnterior.gastosReales) / Math.abs(mesAnoAnterior.gastosReales)) * 100; }
        return { vsMesAnt: varMesAnt, vsAnoAnt: varAnoAnt };
    };

    // --- 6. FUNCIONES DE RENDERIZADO ---

    // Quitar Placeholders y Mostrar Contenido Real
    const revealContent = (element, value = '', isCurrency = true) => {
        if (!element) return;
        const placeholder = element.classList.contains('placeholder') ? element : element.querySelector('.placeholder');
        if (placeholder) {
            placeholder.classList.remove('placeholder', 'col-8', 'col-7', 'col-9'); // Remover clases placeholder
            placeholder.classList.add('animate__animated', 'animate__fadeIn'); // Añadir animación fade-in
            placeholder.textContent = isCurrency ? formatCurrency(value) : value;
             // Remover animación después de que ocurra
            placeholder.addEventListener('animationend', () => {
                 placeholder.classList.remove('animate__animated', 'animate__fadeIn');
             }, { once: true });
        } else {
             // Si no había placeholder, solo actualiza el contenido
            element.textContent = isCurrency ? formatCurrency(value) : value;
        }
    };

    const renderDashboardKPIs = () => {
        const year = appState.currentYear;
        const lastMonth = getLastAvailableMonth(year);

        if (!lastMonth) {
            // Si no hay datos, mantenemos los placeholders visibles
            elements.kpiPlaceholders.forEach(p => p.classList.add('placeholder'));
            elements.kpiSaldoAcumulado.textContent = '';
            elements.kpiIngresosMes.textContent = '';
            elements.kpiGastosMes.textContent = '';
            elements.kpiProyeccionCierre.textContent = ''; // La proyección se actualiza separado
        } else {
            // Si hay datos, revela el contenido
            revealContent(elements.kpiSaldoAcumulado, lastMonth.saldoAcumulado);
            revealContent(elements.kpiIngresosMes, lastMonth.totalIngresosMes);
            revealContent(elements.kpiGastosMes, lastMonth.gastosReales);
            // La proyección se actualiza en su propia lógica, pero podemos poner un valor inicial
            revealContent(elements.kpiProyeccionCierre, appState.proyeccionCache ? appState.proyeccionCache[11]?.saldoAcumulado ?? 0 : lastMonth.saldoAcumulado);
        }
        elements.currentYearSpan.textContent = year;
    };

    const renderMonthlyTable = () => {
        const year = appState.currentYear;
        const yearData = appState.datosAnuales[year];

        // Ocultar placeholders iniciales
        elements.tablaPlaceholders.forEach(p => p.closest('tr').remove());
        elements.tablaMensualBody.innerHTML = ''; // Limpiar por si acaso

        if (!yearData || yearData.length === 0) {
            elements.tablaMensual.parentElement.classList.add('d-none'); // Ocultar contenedor tabla
            elements.tablaMensualEmpty.classList.remove('d-none'); // Mostrar mensaje vacío
        } else {
            elements.tablaMensual.parentElement.classList.remove('d-none'); // Mostrar contenedor tabla
            elements.tablaMensualEmpty.classList.add('d-none'); // Ocultar mensaje vacío

            yearData.sort((a,b) => a.mesIndex - b.mesIndex); // Asegurar orden
            yearData.forEach(mes => {
                const variations = calculateVariations(year, mes.mesIndex);
                const getBadgeClass = (value) => { /* ... (misma lógica de badge) ... */
                    if (isNaN(value)) return 'bg-light text-dark';
                     return value > 0 ? 'bg-danger-subtle text-danger-emphasis' : (value < 0 ? 'bg-success-subtle text-success-emphasis' : 'bg-secondary-subtle text-secondary-emphasis');
                };
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
                    </tr>
                `;
                elements.tablaMensualBody.insertAdjacentHTML('beforeend', rowHtml);
            });
        }
    };

    const renderRubrosAccordion = (monthData = null) => {
        // Ocultar placeholders
        elements.accordionPlaceholders.forEach(p => p.closest('.accordion-item').remove());
        elements.accordionGastos.innerHTML = ''; // Limpiar contenido real

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
            const collapseId = `collapse${rubroConfig.id}${Date.now()}`; // ID único
            const headingId = `heading${rubroConfig.id}${Date.now()}`;

            let itemsHtml = '<p class="fst-italic text-muted small px-3">No hay detalle de ítems disponible.</p>';
            if (rubroData.items && rubroData.items.length > 0) {
                itemsHtml = '<ul class="list-group list-group-flush">';
                rubroData.items.forEach(item => {
                    itemsHtml += `
                        <li class="list-group-item d-flex justify-content-between align-items-center border-0 px-0 py-1">
                            <span class="text-break small">${item.desc || 'Item sin descripción'}</span>
                            <span class="badge bg-light text-dark rounded-pill fw-normal">${formatCurrency(item.val || 0)}</span>
                        </li>`;
                });
                itemsHtml += '</ul>';
            }

            const accordionItemHtml = `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="${headingId}">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                            ${rubroConfig.nombre}
                            <span class="ms-auto fw-bold text-primary">${formatCurrency(rubroData.total)}</span>
                        </button>
                    </h2>
                    <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headingId}" data-bs-parent="#accordionGastos">
                        <div class="accordion-body pt-0"> <!-- Quitar padding top del body -->
                            ${itemsHtml}
                        </div>
                    </div>
                </div>`;
            elements.accordionGastos.insertAdjacentHTML('beforeend', accordionItemHtml);
        });

        if (!hasContent) {
            elements.accordionGastosEmpty.classList.remove('d-none');
        }
    };

    const renderGestionFinanciera = () => {
        const data = appState.gestionFinanciera;
        revealContent(elements.gestionInversionesSaldo, data.inversiones.saldo);
        revealContent(elements.gestionInversionesVenc, `Vencimiento: ${data.inversiones.vencimiento || '--/--/----'}`, false);
        revealContent(elements.gestionCuentaSaldo, data.cuentaCorriente.saldo);
        revealContent(elements.gestionCuentaMov, `Últ. Mov.: ${data.cuentaCorriente.ultimoMov || '--/--/----'}`, false);
        revealContent(elements.gestionReservasSaldo, data.reservas.saldo);
        revealContent(elements.gestionReservasObj, `Objetivo: ${formatCurrency(data.reservas.objetivo)}`, false); // Mostrar objetivo

        // Lógica de alerta predictiva (ejemplo)
        const lastMonth = getLastAvailableMonth(appState.currentYear);
        if (lastMonth && lastMonth.saldoAcumulado < 1000000) { // Alerta si baja de 1M
            elements.alertaPredictivaMensaje.textContent = `El saldo acumulado (${formatCurrency(lastMonth.saldoAcumulado)}) es inferior al umbral de $1.000.000.`;
            elements.alertaPredictiva.classList.remove('d-none', 'animate__fadeOut');
            elements.alertaPredictiva.classList.add('animate__fadeIn');
        } else {
             if (!elements.alertaPredictiva.classList.contains('d-none')) {
                 elements.alertaPredictiva.classList.remove('animate__fadeIn');
                 elements.alertaPredictiva.classList.add('animate__fadeOut');
                  elements.alertaPredictiva.addEventListener('animationend', () => {
                     elements.alertaPredictiva.classList.add('d-none');
                 }, { once: true });
             }
        }
    };

    const renderConfiguracion = () => {
         // Renderizar lista de rubros
         elements.rubrosListContainer.innerHTML = ''; // Limpiar posible placeholder
         if (appState.config.rubros && appState.config.rubros.length > 0) {
             appState.config.rubros.forEach(rubro => {
                 const badge = `<span class="badge bg-secondary-subtle text-secondary-emphasis me-1 mb-1">${rubro.nombre}</span>`;
                 elements.rubrosListContainer.insertAdjacentHTML('beforeend', badge);
             });
         } else {
             elements.rubrosListContainer.innerHTML = '<p class="text-muted small">No hay rubros configurados.</p>';
         }
    };


    const populateReportDropdowns = () => {
        const year = appState.currentYear;
        const yearData = appState.datosAnuales[year] || [];
        const selVecino = elements.selectMesReporteVecino;
        const selInterno = elements.selectMesReporteInterno;

        selVecino.innerHTML = '<option selected disabled value="">Seleccionar Mes...</option>';
        selInterno.innerHTML = '<option selected disabled value="">Seleccionar Período...</option>';

        let hasData = false;
        if (yearData.length > 0) {
            hasData = true;
            yearData.sort((a, b) => b.mesIndex - a.mesIndex); // Más reciente primero
            selInterno.innerHTML += `<option value="anual">Año ${year} Completo</option>`;
            yearData.forEach(mes => {
                const optionText = `${mes.mesNombre || appState.config.meses[mes.mesIndex]} ${year}`;
                const optionValue = `${year}-${String(mes.mesIndex + 1).padStart(2, '0')}`;
                selVecino.innerHTML += `<option value="${optionValue}">${optionText}</option>`;
                selInterno.innerHTML += `<option value="${optionValue}">${optionText}</option>`;
            });
        }

        // Habilitar/deshabilitar botones según si hay opciones
        elements.btnGenerarReporteVecinoPdf.disabled = !hasData;
        elements.btnExportarExcel.disabled = !hasData;
        elements.btnExportarPdfDetallado.disabled = !hasData;

         // Añadir listeners para habilitar botones solo cuando se selecciona algo
         selVecino.onchange = () => elements.btnGenerarReporteVecinoPdf.disabled = !selVecino.value;
         selInterno.onchange = () => {
             elements.btnExportarExcel.disabled = !selInterno.value;
             elements.btnExportarPdfDetallado.disabled = !selInterno.value || selInterno.value === 'anual'; // Deshabilitar PDF detallado para anual
         };
    };

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

        const chartOptionsBase = { // Opciones base mejoradas
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)', titleFont: { weight: 'bold' }, bodyFont: { size: 11 },
                    padding: 10, cornerRadius: 4, displayColors: false, // Sin cuadraditos de color
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}`
                    }
                }
            },
            scales: {
                 x: { grid: { display: false }, ticks: { font: { size: 11, weight: '500' } } },
                 y: { beginAtZero: true, grid: { color: var(--border-color), borderDash: [3, 3] }, ticks: { font: { size: 10 }, callback: (value) => value > 1000 ? (value / 1000) + 'k' : value } } // Formato K para miles
            },
            interaction: { intersect: false, mode: 'index' },
        };

        // Gráfico Ingresos vs Gastos
        if (elements.ingresosGastosChartCanvas && yearData.length > 0) {
            const ctx1 = elements.ingresosGastosChartCanvas.getContext('2d');
            charts.ingresosGastosMensual = new Chart(ctx1, {
                type: 'line',
                data: { labels, datasets: [
                    { label: 'Ingresos', data: ingresosData, borderColor: var(--success-color), backgroundColor: 'rgba(5, 166, 96, 0.1)', tension: 0.4, pointBackgroundColor: var(--success-color), pointBorderWidth: 0, pointRadius: 0, pointHoverRadius: 5, fill: true },
                    { label: 'Gastos', data: gastosData, borderColor: var(--danger-color), backgroundColor: 'rgba(224, 49, 55, 0.1)', tension: 0.4, pointBackgroundColor: var(--danger-color), pointBorderWidth: 0, pointRadius: 0, pointHoverRadius: 5, fill: true }
                ]},
                options: { ...chartOptionsBase, plugins: { ...chartOptionsBase.plugins, legend: { display: true, position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 15, font: { size: 11 }}} } }
            });
            elements.ingresosGastosChartCanvas.nextElementSibling.style.display = 'none'; // Ocultar loader
        } else {
             elements.ingresosGastosChartCanvas?.nextElementSibling?.style.display = 'none'; // Ocultar si no hay datos
        }

        // Gráfico Distribución Gastos
        const lastMonth = getLastAvailableMonth(year);
        if (elements.distribucionGastosChartCanvas && lastMonth?.gastosDetalle) {
            const ctx2 = elements.distribucionGastosChartCanvas.getContext('2d');
             const gastoLabels = []; const gastoData = [];
             const backgroundColors = ['#2A5FFF', '#6f42c1', '#fd7e14', '#198754', '#ffc107', '#dc3545', '#0dcaf0', '#6c757d', '#ff6b6b', '#4dabf7'];
             appState.config.rubros.forEach(r => { if (lastMonth.gastosDetalle[r.id]?.total > 0) { gastoLabels.push(r.nombre); gastoData.push(lastMonth.gastosDetalle[r.id].total); }});

            if(gastoData.length > 0) {
                charts.distribucionGastos = new Chart(ctx2, {
                    type: 'doughnut',
                    data: { labels: gastoLabels, datasets: [{ data: gastoData, backgroundColor: backgroundColors, borderColor: var(--white-bg), borderWidth: 2, hoverOffset: 8 }] },
                    options: { responsive: true, maintainAspectRatio: false, cutout: '70%',
                        plugins: {
                            legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 10, font: { size: 10 } } },
                            tooltip: { ...chartOptionsBase.plugins.tooltip, callbacks: { label: (context) => `${context.label}: ${formatCurrency(context.raw)}` } }
                        }
                    }
                });
                 elements.distribucionGastosChartCanvas.nextElementSibling.style.display = 'none'; // Ocultar loader
            } else {
                 elements.distribucionGastosChartCanvas.nextElementSibling.style.display = 'none'; // Ocultar si no hay datos
            }
        } else {
            elements.distribucionGastosChartCanvas?.nextElementSibling?.style.display = 'none'; // Ocultar si no hay datos
        }

        // Gráfico Proyección (Inicial)
        if (elements.proyeccionAnualChartCanvas) {
            const ctx3 = elements.proyeccionAnualChartCanvas.getContext('2d');
            const saldoAcumuladoReal = yearData.map(m => m.saldoAcumulado);
            charts.proyeccionAnual = new Chart(ctx3, {
                type: 'line',
                data: { labels, datasets: [ { label: 'Saldo Real', data: saldoAcumuladoReal, borderColor: var(--primary-color), backgroundColor: 'rgba(42, 95, 255, 0.1)', tension: 0.4, pointBackgroundColor: var(--primary-color), pointRadius: 0, pointHoverRadius: 5, fill: true }] },
                options: { ...chartOptionsBase, plugins: { ...chartOptionsBase.plugins, tooltip: { ...chartOptionsBase.plugins.tooltip, callbacks: { label: (context) => `Saldo Acum.: ${formatCurrency(context.raw)}` } } } }
            });
             // No ocultar loader aquí, se oculta al calcular proyección
        }
    };

    const updateProyeccionChart = (labels, realData, projectedData) => {
        if (!charts.proyeccionAnual) return;
        charts.proyeccionAnual.data.labels = labels.map(l => l.substring(0, 3));
        charts.proyeccionAnual.data.datasets = [
             { label: 'Saldo Real', data: realData, borderColor: var(--primary-color), backgroundColor: 'rgba(42, 95, 255, 0.1)', tension: 0.4, pointBackgroundColor: var(--primary-color), pointRadius: 0, pointHoverRadius: 5, fill: true },
             { label: 'Saldo Proyectado', data: projectedData, borderColor: var(--warning-color), backgroundColor: 'rgba(255, 176, 6, 0.1)', borderDash: [4, 4], tension: 0.4, pointBackgroundColor: var(--warning-color), pointRadius: 0, pointHoverRadius: 5, fill: false } // Sin relleno para proyección
        ];
        charts.proyeccionAnual.update();
         // Ocultar loader del gráfico de proyección si existe
         elements.proyeccionAnualChartCanvas?.nextElementSibling?.style.display = 'none';
    };

    // --- 8. LÓGICA DE PROYECCIONES ---
    // (Sin cambios mayores en cálculo, usa showToast)
    const calcularProyeccion = () => { /* ... (Misma lógica de cálculo que antes) ... */
        // Al final, después de actualizar UI y gráfico:
        showToast(`Proyección calculada para el escenario: ${elements.paramOptimizacion.options[elements.paramOptimizacion.selectedIndex].text}`, 'success');
        // Asegurarse de llamar a updateProyeccionChart(...) con los datos correctos
        updateProyeccionChart(projectionLabels, realSaldos, projectedSaldos); // Asegurar que se llama
        appState.proyeccionCache = combinedData;
        elements.kpiProyeccionCierre.textContent = formatCurrency(cierreProyectado); // Actualizar KPI
    };

    // --- 9. LÓGICA DE IMPORTACIÓN ---
    const handleImportData = () => {
        // Validar formulario Bootstrap
        if (!elements.formImport.checkValidity()) {
            elements.formImport.classList.add('was-validated');
            showToast('Datos incompletos', 'Por favor, completa el mes/año y selecciona un archivo.', 'warning');
            return;
        }
        elements.formImport.classList.remove('was-validated'); // Limpiar validación

        const mesAnio = elements.importMes.value;
        const fileInput = elements.importFile;
        const saldoAnteriorManual = parseFloat(elements.importSaldoAnterior.value);
        const [yearStr, monthStr] = mesAnio.split('-');
        const year = parseInt(yearStr);
        const monthIndex = parseInt(monthStr) - 1;
        const mesNombre = appState.config.meses[monthIndex];
        const fileName = fileInput.files[0].name;

        // Mostrar loader y deshabilitar botón
        elements.importLoader.classList.remove('d-none');
        elements.btnConfirmImport.disabled = true;
        elements.btnConfirmImport.querySelector('.spinner-border')?.remove(); // Remover spinner anterior si existe
        elements.btnConfirmImport.insertAdjacentHTML('prepend', '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>');


        // ** SIMULACIÓN DE PROCESAMIENTO ASÍNCRONO **
        setTimeout(() => {
            console.log(`Simulando importación para ${mesNombre} ${year} desde ${fileName}...`);
            let importedData;
            // Lógica de simulación (PDF o aleatorio) - SIN CAMBIOS
            if (year === 2025 && monthIndex === 2) {
                console.log("Usando datos simulados del PDF para Marzo 2025");
                importedData = JSON.parse(JSON.stringify(pdfDataMarzo2025));
                if (!isNaN(saldoAnteriorManual)) {
                    importedData.saldoAnterior = saldoAnteriorManual;
                    // Recalcular saldo de cierre basado en el manual
                    importedData.saldoCierre = saldoAnteriorManual + importedData.ingresos.total - importedData.egresos.total;
                }
                 importedData.totalIngresosMes = importedData.ingresos.total;
                 importedData.gastosReales = importedData.egresos.total;
                 // Actualizar datos financieros avanzados si es Marzo 2025
                 appState.gestionFinanciera = {
                     inversiones: { saldo: 18005079.55, vencimiento: 'N/A', tipo: 'FIMA PREMIUM CLASE A' },
                     cuentaCorriente: { saldo: 5687660.89, ultimoMov: '31/03/2025' },
                     reservas: { saldo: 0, objetivo: 0, proposito: 'N/A' }
                 };

            } else {
                 console.log("Generando datos simulados aleatorios para", mesNombre, year);
                 const ingresosSim = 500000 + Math.random() * 200000; let gastosSimDetalle = {}; let gastosSimTotal = 0;
                 appState.config.rubros.forEach(rubro => { const gastoRubro = Math.random() * 80000 + (rubro.id === 'remuneraciones' || rubro.id === 'seguridad' ? 100000 : 10000); gastosSimDetalle[rubro.id] = { total: gastoRubro, items: [{desc: 'Gasto Simulado', val: gastoRubro }] }; gastosSimTotal += gastoRubro;});
                 importedData = { year: year, monthIndex: monthIndex, mesNombre: mesNombre, saldoAnterior: isNaN(saldoAnteriorManual) ? undefined : saldoAnteriorManual, ingresos: { total: ingresosSim }, egresos: { total: gastosSimTotal }, gastosDetalle: gastosSimDetalle, totalIngresosMes: ingresosSim, gastosReales: gastosSimTotal, saldoCierre: 0 };
            }

            // Añadir/Reemplazar en el estado
            if (!appState.datosAnuales[year]) appState.datosAnuales[year] = [];
            const existingIndex = appState.datosAnuales[year].findIndex(m => m.mesIndex === monthIndex);
            if (existingIndex > -1) appState.datosAnuales[year][existingIndex] = importedData;
            else appState.datosAnuales[year].push(importedData);
            appState.currentYear = year;

            // Ocultar loader, habilitar botón, cerrar modal
            elements.importLoader.classList.add('d-none');
            elements.btnConfirmImport.disabled = false;
            elements.btnConfirmImport.querySelector('.spinner-border')?.remove();
            appState.bootstrap.importModalInstance.hide();
            elements.formImport.reset();

            // Recalcular, renderizar y notificar
            calculateYearData(year);
            renderUI();
            populateReportDropdowns();
            showToast(`Datos para ${mesNombre} ${year} procesados.`, 'success');

        }, 1500); // Simular 1.5 segundos de procesamiento
    };


    // --- 10. LÓGICA DE GENERACIÓN DE REPORTES ---
    // (Sin cambios mayores, usan showToast)
    const generarPdfVecinos = () => { /* ... usa showToast ... */ };
    const exportarExcel = () => { /* ... usa showToast ... */ };
    const generarPdfDetallado = () => { /* ... usa showToast ... */ };
    // Asegurar que las funciones de reporte usan los selectores y lógica de habilitación correctos

    // --- 11. NAVEGACIÓN Y MANEJO DE UI ---
    const navigateToSection = (sectionId) => {
        const currentActiveSection = document.querySelector('.app-section.active');
        const targetSection = document.getElementById(sectionId);

        if (targetSection && sectionId !== appState.activeSection) {
            // Animar salida de sección actual (opcional)
            if (currentActiveSection) {
                currentActiveSection.classList.remove('active', appState.config.animationClassIn);
                // currentActiveSection.classList.add(appState.config.animationClassOut); // Podría causar parpadeo
                // currentActiveSection.addEventListener('animationend', () => {
                //     currentActiveSection.classList.remove(appState.config.animationClassOut);
                // }, { once: true });
            }

            // Preparar y mostrar nueva sección con animación
            targetSection.classList.remove(appState.config.animationClassOut); // Asegurar que no esté saliendo
            targetSection.classList.add('active', appState.config.animationClassIn);
            appState.activeSection = sectionId;

            // Actualizar título y sidebar link
            const sectionLink = document.querySelector(`#sidebar .nav-link[data-section="${sectionId}"]`);
            elements.sectionTitle.textContent = sectionLink?.querySelector('span')?.textContent || 'Detalle';
            document.querySelectorAll('#sidebar .nav-link').forEach(link => link.classList.remove('active'));
            sectionLink?.classList.add('active');

             // Scroll al inicio
             elements.mainContent.scrollTo(0, 0);
        }
    };

    const setupEventListeners = () => {
        // Navegación Sidebar
        document.querySelectorAll('#sidebar .nav-link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigateToSection(link.getAttribute('data-section'));
                if (window.innerWidth < 992) { // Cerrar sidebar en móvil/tablet
                    elements.body.classList.remove('sidebar-toggled');
                }
            });
        });

        // Toggle Sidebar Button
        elements.sidebarToggle?.addEventListener('click', () => {
            elements.body.classList.toggle('sidebar-toggled');
            appState.isSidebarToggled = elements.body.classList.contains('sidebar-toggled');
        });

        // Click outside sidebar to close on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 992 && appState.isSidebarToggled) {
                if (!elements.sidebar.contains(e.target) && !elements.sidebarToggle?.contains(e.target)) {
                    elements.body.classList.remove('sidebar-toggled');
                    appState.isSidebarToggled = false;
                }
            }
        });

        // Botón Confirmar Importación (AHORA FUNCIONA)
        elements.btnConfirmImport.addEventListener('click', handleImportData);

        // Otros botones
        elements.btnCalcularProyeccion.addEventListener('click', calcularProyeccion);
        elements.btnGenerarReporteVecinoPdf.addEventListener('click', generarPdfVecinos);
        elements.btnExportarExcel.addEventListener('click', exportarExcel);
        elements.btnExportarPdfDetallado.addEventListener('click', generarPdfDetallado);

        // Botón detalle en tabla (Actualiza acordeón y gráfico torta)
         elements.tablaMensualBody.addEventListener('click', (event) => {
             const button = event.target.closest('button[data-month-index]');
             if (button) {
                 const monthIndex = parseInt(button.dataset.monthIndex);
                 const year = appState.currentYear;
                 const mesData = getMonthData(year, monthIndex);
                 if (mesData) {
                     updateDistribucionGastosChart(mesData); // Actualizar gráfico torta
                     renderRubrosAccordion(mesData);       // Render acordeón con datos del mes
                     showToast(`Mostrando detalle de gastos para ${mesData.mesNombre || appState.config.meses[mesData.mesIndex]} ${year}.`, 'info');
                     // Opcional: forzar navegación a la sección de detalle
                     // navigateToSection('detalle-gastos');
                 }
             }
         });

          // Prevenir envío real del formulario de importación
         elements.formImport.addEventListener('submit', (e) => e.preventDefault());
    };

    // Función para actualizar el gráfico de torta (con título dinámico)
    const updateDistribucionGastosChart = (mesData) => {
        // Lógica similar a la anterior, asegurar que se actualice el título y datos
        if (charts.distribucionGastos && mesData?.gastosDetalle) {
            const gastoLabels = []; const gastoData = [];
            appState.config.rubros.forEach(r => { if (mesData.gastosDetalle[r.id]?.total > 0) { gastoLabels.push(r.nombre); gastoData.push(mesData.gastosDetalle[r.id].total); }});
            charts.distribucionGastos.data.labels = gastoLabels;
            charts.distribucionGastos.data.datasets[0].data = gastoData;
             const backgroundColors = ['#2A5FFF', '#6f42c1', '#fd7e14', '#198754', '#ffc107', '#dc3545', '#0dcaf0', '#6c757d', '#ff6b6b', '#4dabf7'];
            charts.distribucionGastos.data.datasets[0].backgroundColor = backgroundColors.slice(0, gastoLabels.length);
            charts.distribucionGastos.options.plugins.title = { display: true, text: `Gastos - ${mesData.mesNombre || appState.config.meses[mesData.mesIndex]} ${appState.currentYear}`, padding: { top: 0, bottom: 10 }, font: { weight: '600', size: 13 }, color: var(--text-dark) };
            charts.distribucionGastos.update();
            // Ocultar loader si estaba visible
            elements.distribucionGastosChartCanvas?.nextElementSibling?.style.display = 'none';
        } else if (charts.distribucionGastos) {
             // Limpiar gráfico si no hay datos
             charts.distribucionGastos.data.labels = [];
             charts.distribucionGastos.data.datasets[0].data = [];
             charts.distribucionGastos.options.plugins.title = { display: true, text: 'Sin datos de gastos para mostrar', color: var(--text-muted), font: {style: 'italic'} };
             charts.distribucionGastos.update();
             elements.distribucionGastosChartCanvas?.nextElementSibling?.style.display = 'none';
        }
    };

    // --- 12. FUNCIÓN DE INICIALIZACIÓN PRINCIPAL ---
    const renderUI = () => {
        renderDashboardKPIs();
        renderMonthlyTable();
        initCharts(); // Reinicializar/actualizar gráficos
        renderRubrosAccordion(); // Renderiza con el último mes por defecto
        renderGestionFinanciera();
        renderConfiguracion(); // Renderizar rubros en config
        // Podría calcular proyección inicial si hay datos
        // if(getLastAvailableMonth(appState.currentYear)) calcularProyeccion();
    };

    const init = () => {
        console.log('Inicializando Centauro Finanzas...');
        // Inicializar componentes Bootstrap
        appState.bootstrap.toastInstance = new bootstrap.Toast(elements.toastEl);
        appState.bootstrap.importModalInstance = new bootstrap.Modal(elements.importModalEl);

        // Establecer año actual en UI
        elements.currentYearSpan.textContent = appState.currentYear;
        elements.footerYear.textContent = appState.currentYear;

        // Carga simulada inicial de datos (Marzo 2025 para demo)
        handleImportDataSimulation(pdfDataMarzo2025);

        calculateYearData(appState.currentYear);
        renderUI(); // Render inicial (mostrará placeholders brevemente)
        populateReportDropdowns();
        setupEventListeners();
        navigateToSection(appState.activeSection); // Mostrar sección inicial

        // Quitar clase preload después de un breve delay para permitir render inicial
        setTimeout(() => {
            elements.body.classList.remove('preload');
            console.log('Aplicación lista.');
        }, 100); // Ajustar delay si es necesario
    };

    // Función auxiliar para simulación inicial
     const handleImportDataSimulation = (simulatedData) => {
         const year = simulatedData.year;
         const monthIndex = simulatedData.monthIndex;
         if (!appState.datosAnuales[year]) appState.datosAnuales[year] = [];
         appState.datosAnuales[year].push(simulatedData);
         appState.currentYear = year;
     };

    // --- Ejecutar inicialización ---
    document.addEventListener('DOMContentLoaded', init);

})(); // Fin del IIFE