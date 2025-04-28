```javascript
// js/app.js

(() => {
    'use strict';

    // --- 1. ESTADO DE LA APLICACIÓN ---
    const appState = {
        currentYear: 2024, // El PDF es de 2025, ajustaremos si importamos
        activeSection: 'dashboard', // Sección visible inicialmente
        config: {
            // Definición de Rubros (Coincidir con PDF y configuración deseada)
            rubros: [
                { id: 'remuneraciones', nombre: 'Remuneraciones', pdfId: 1 },
                { id: 'aportes_cargas', nombre: 'Aportes y Cargas Sociales', pdfId: 2 },
                { id: 'servicios_publicos', nombre: 'Servicios Públicos', pdfId: 3 },
                { id: 'abonos', nombre: 'Abonos de Servicios', pdfId: 4 },
                { id: 'mantenimiento', nombre: 'Mantenimiento P. Comunes', pdfId: 5 },
                // OJO: El PDF salta al 7
                { id: 'administracion', nombre: 'Gastos Administración', pdfId: 7 },
                { id: 'bancarios', nombre: 'Gastos Bancarios', pdfId: 8 },
                { id: 'limpieza', nombre: 'Gastos Limpieza', pdfId: 9 },
                 // OJO: El PDF salta al 11
                { id: 'seguridad', nombre: 'Seguridad', pdfId: 11 },
                { id: 'legales', nombre: 'Legales', pdfId: 12 },
                { id: 'varios', nombre: 'Varios', pdfId: 13 },
                 // Rubros no presentes en el PDF pero que podrían existir
                { id: 'extraordinarios', nombre: 'Gastos Extraordinarios', pdfId: null}, // Ejemplo
            ],
            meses: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
        },
        datosAnuales: {
            // Inicialmente vacío, se llena con importación o datos por defecto
        },
        proyeccionCache: null,
        gestionFinanciera: { // Valores de ejemplo actualizados
            inversiones: { saldo: 18005079.55, vencimiento: 'N/A', tipo: 'FIMA PREMIUM CLASE A' }, // Del PDF
            cuentaCorriente: { saldo: 5687660.89, ultimoMov: '31/03/2025' }, // Del PDF
            reservas: { saldo: 200000, objetivo: 500000, proposito: 'Fondo Obras Futuras' } // Ejemplo
        },
        toastInstance: null // Para guardar la instancia del Toast
    };

    // --- DATOS SIMULADOS DEL PDF (MARZO 2025) ---
    // Estos son los datos clave extraídos manualmente del OCR para la simulación
    const pdfDataMarzo2025 = {
        year: 2025,
        monthIndex: 2, // Marzo
        periodo: "03/2025",
        saldoAnterior: 2761430.18,
        ingresos: {
            pagosTermino: 24603844.48,
            pagosAdeudados: 1843270.17,
            intereses: 109098.61,
            otros: 5000000.00, // RESCATE FONDO FIMA
            total: 31556213.26 // Suma de ingresos
        },
        egresos: {
            gastosOrd: 28628717.49, // Total Gastos de pág 4
            gastosExt: 0,
            otros: 0,
            total: 28628717.49 // Suma de egresos
        },
        saldoCierre: 5688925.95, // = saldoAnt + ingresos.total - egresos.total
        gastosDetalle: { // Mapeado de rubros del PDF
            'remuneraciones': { total: 2741514.27, items: [ {desc: 'GONZALEZ LUCIANO...', val: 855722.81}, /* ...otros... */ {desc: 'SEGOVIA ESPINOLA...', val: 417595.92} ]},
            'aportes_cargas': { total: 2642728.94, items: [ {desc: 'AFIP (SUSS)...', val: 2398363.87}, /* ...otros... */ {desc: 'UTEDYC...', val: 187065.01} ]},
            'servicios_publicos': { total: 2445648.05, items: [ {desc: 'AYSA...', val: 108421.00}, /* ...otros... */ {desc: 'TELECENTRO...', val: 3328.36} ]},
            'abonos': { total: 472667.57, items: [ {desc: 'ADMINPROP...', val: 66812.00}, /* ...otros... */ {desc: 'DE SOUSA VALENTE...', val: 235400.00} ]},
            'mantenimiento': { total: 273000.00, items: [ {desc: 'SALAS, ROBERTO CARLOS...', val: 273000.00} ]},
            'administracion': { total: 998195.00, items: [ {desc: 'FEDERACION PATRONAL...', val: 68195.00}, /* ...otros... */ {desc: 'OCAMPO, CARLOS...', val: 480000.00} ]},
            'bancarios': { total: 384934.70, items: [ {desc: 'BANCO GALICIA - IMP DEBITOS...', val: 169797.47}, /* ...otros... */ {desc: 'BANCO GALICIA - IVA/IIBB...', val: 12196.00} ]},
            'limpieza': { total: 1111515.34, items: [ {desc: 'COOP MUNDO RECICLADO...', val: 149379.34}, {desc: 'COVELLIA...', val: 962136.00} ]},
            'seguridad': { total: 17124415.60, items: [ {desc: 'ABELLA, IGNACIO...', val: 1700000.00}, /* ...muchos otros... */ {desc: 'SCYTHIA S.A....', val: 3090714.38} ]},
            'legales': { total: 178430.00, items: [ {desc: 'PEÑA, CECILIA...', val: 178430.00} ]},
            'varios': { total: 255668.02, items: [ {desc: 'CASA ZAMBIAZZO - CAJA REFLEC...', val: 58817.34}, /* ...otros... */ {desc: 'MIRVAR S.A. - COMBUSTIBLE...', val: 160000.00} ]},
            'extraordinarios': { total: 0, items: [] } // Ejemplo
        }
    };

    // --- 2. SELECCIÓN DE ELEMENTOS DEL DOM ---
    const elements = {
        // Layout
        sidebar: document.getElementById('sidebar'),
        content: document.getElementById('content'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        wrapper: document.querySelector('.wrapper'), // Para el overlay en móvil
        // Nav Superior
        sectionTitle: document.getElementById('sectionTitle'),
        currentYearSpan: document.getElementById('current-year'),
        // Secciones
        appSections: document.querySelectorAll('.app-section'),
        // KPIs
        kpiSaldoAcumulado: document.getElementById('kpi-saldo-acumulado'),
        kpiIngresosMes: document.getElementById('kpi-ingresos-mes'),
        kpiGastosMes: document.getElementById('kpi-gastos-mes'),
        kpiProyeccionCierre: document.getElementById('kpi-proyeccion-cierre'),
        // Tabla Mensual
        tablaMensual: document.getElementById('tabla-mensual'),
        tablaMensualBody: document.getElementById('tabla-mensual-body'),
        tablaMensualEmpty: document.getElementById('tabla-mensual-empty'),
        // Gráficos (Canvas)
        ingresosGastosChartCanvas: document.getElementById('ingresosGastosMensualChart'),
        distribucionGastosChartCanvas: document.getElementById('distribucionGastosChart'),
        proyeccionAnualChartCanvas: document.getElementById('proyeccionAnualChart'),
        // Acordeón Gastos
        accordionGastos: document.getElementById('accordionGastos'),
        accordionGastosPlaceholder: document.getElementById('accordion-gastos-placeholder'),
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
        // Reportes
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
        // Modal Importar
        importModalEl: document.getElementById('importModal'), // Elemento
        importModal: null, // Instancia Bootstrap (se crea en init)
        formImport: document.getElementById('form-import'),
        importMes: document.getElementById('import-mes'),
        importFile: document.getElementById('import-file'),
        importSaldoAnterior: document.getElementById('import-saldo-anterior'),
        btnConfirmImport: document.getElementById('btn-confirm-import'),
        // Toast
        toastEl: document.getElementById('appToast'),
        toastTitle: document.getElementById('toastTitle'),
        toastBody: document.getElementById('toastBody'),
        toastTimestamp: document.getElementById('toastTimestamp'),
    };

    // --- 3. GRÁFICOS (Chart.js Instances) ---
    let charts = {
        ingresosGastosMensual: null,
        distribucionGastos: null,
        proyeccionAnual: null
    };

    // --- 4. FUNCIONES HELPER ---
    const formatCurrency = (value) => {
        return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatPercentage = (value) => {
        if (typeof value !== 'number' || isNaN(value)) return 'N/A';
        const sign = value > 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`;
    };

    const getMonthData = (year, monthIndex) => {
        return appState.datosAnuales[year]?.find(m => m.mesIndex === monthIndex);
    };

    const getLastAvailableMonth = (year) => {
        const yearData = appState.datosAnuales[year];
        if (!yearData || yearData.length === 0) return null;
        // Asegurarse de que estén ordenados por mes
        yearData.sort((a, b) => a.mesIndex - b.mesIndex);
        return yearData[yearData.length - 1];
    };

    // Mostrar Toast
    const showToast = (title, message, type = 'info') => {
        if (!appState.toastInstance) return;
        elements.toastTitle.textContent = title;
        elements.toastBody.innerHTML = message; // Usar innerHTML por si hay links
        elements.toastTimestamp.textContent = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

        // Cambiar icono/color según tipo
        const icon = elements.toastEl.querySelector('.toast-header i');
        icon.className = `bi ${type === 'success' ? 'bi-check-circle-fill text-success' : type === 'danger' ? 'bi-exclamation-triangle-fill text-danger' : 'bi-info-circle-fill text-primary'} rounded me-2`;

        appState.toastInstance.show();
    };

    // --- 5. LÓGICA DE CÁLCULO ---
    const calculateYearData = (year) => {
        const yearData = appState.datosAnuales[year];
        if (!yearData || yearData.length === 0) return;

        yearData.sort((a, b) => a.mesIndex - b.mesIndex); // Asegurar orden

        let saldoAcumuladoAnterior = 0;
        // Buscar saldo del último mes del año anterior si existe
        const prevYearData = appState.datosAnuales[year - 1];
        if (prevYearData && prevYearData.length > 0) {
            prevYearData.sort((a, b) => a.mesIndex - b.mesIndex);
            saldoAcumuladoAnterior = prevYearData[prevYearData.length - 1].saldoAcumulado;
        }

        yearData.forEach((mes, index) => {
            // Calcular gastos totales del mes (ya debería venir calculado de la importación)
            if (!mes.gastosReales) {
                mes.gastosReales = Object.values(mes.gastosDetalle || {}).reduce((sum, rubro) => sum + (rubro.total || 0), 0);
            }
            if (!mes.totalIngresosMes) {
                 mes.totalIngresosMes = Object.values(mes.ingresos || {}).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
            }
             // Calcular saldo del mes
             mes.saldoMes = mes.totalIngresosMes - mes.gastosReales;


            if (index === 0) {
                // Si es el primer mes, el saldo acumulado inicial es el saldoAnterior que trae el mes
                // o el calculado del año anterior.
                mes.saldoAcumulado = (mes.saldoAnterior ?? saldoAcumuladoAnterior) + mes.saldoMes;
            } else {
                mes.saldoAcumulado = yearData[index - 1].saldoAcumulado + mes.saldoMes;
            }
        });
    };

    // Calcular variaciones (sin cambios significativos)
    const calculateVariations = (year, monthIndex) => {
        const yearData = appState.datosAnuales[year];
        if (!yearData) return { vsMesAnt: NaN, vsAnoAnt: NaN };

        const mesActual = yearData.find(m => m.mesIndex === monthIndex);
        const mesAnterior = yearData.find(m => m.mesIndex === monthIndex - 1);
        const mesAnoAnterior = appState.datosAnuales[year - 1]?.find(m => m.mesIndex === monthIndex);

        let varMesAnt = NaN;
        if (mesActual && mesAnterior && mesAnterior.gastosReales !== 0) {
            varMesAnt = ((mesActual.gastosReales - mesAnterior.gastosReales) / Math.abs(mesAnterior.gastosReales)) * 100;
        }

        let varAnoAnt = NaN;
        if (mesActual && mesAnoAnterior && mesAnoAnterior.gastosReales !== 0) {
            varAnoAnt = ((mesActual.gastosReales - mesAnoAnterior.gastosReales) / Math.abs(mesAnoAnterior.gastosReales)) * 100;
        }

        return { vsMesAnt: varMesAnt, vsAnoAnt: varAnoAnt };
    };

    // --- 6. FUNCIONES DE RENDERIZADO ---
    const renderDashboardKPIs = () => {
        const year = appState.currentYear;
        const lastMonth = getLastAvailableMonth(year);

        if (!lastMonth) {
            elements.kpiSaldoAcumulado.textContent = formatCurrency(0);
            elements.kpiIngresosMes.textContent = formatCurrency(0);
            elements.kpiGastosMes.textContent = formatCurrency(0);
        } else {
            elements.kpiSaldoAcumulado.textContent = formatCurrency(lastMonth.saldoAcumulado);
            elements.kpiIngresosMes.textContent = formatCurrency(lastMonth.totalIngresosMes); // Usar total calculado
            elements.kpiGastosMes.textContent = formatCurrency(lastMonth.gastosReales);
        }
        // La proyección se actualiza por separado
        elements.currentYearSpan.textContent = year;
    };

    const renderMonthlyTable = () => {
        const year = appState.currentYear;
        const yearData = appState.datosAnuales[year];
        elements.tablaMensualBody.innerHTML = ''; // Limpiar tabla

        if (!yearData || yearData.length === 0) {
            elements.tablaMensual.classList.add('d-none'); // Ocultar tabla
            elements.tablaMensualEmpty.classList.remove('d-none'); // Mostrar mensaje vacío
            return;
        }

        elements.tablaMensual.classList.remove('d-none'); // Mostrar tabla
        elements.tablaMensualEmpty.classList.add('d-none'); // Ocultar mensaje vacío

        yearData.forEach(mes => {
            const variations = calculateVariations(year, mes.mesIndex);
            const getBadgeClass = (value) => {
                if (isNaN(value)) return 'bg-light text-dark';
                return value > 0 ? 'bg-danger-subtle text-danger-emphasis' : (value < 0 ? 'bg-success-subtle text-success-emphasis' : 'bg-secondary-subtle text-secondary-emphasis');
            };

            const row = `
                <tr>
                    <td>${mes.mesNombre || appState.config.meses[mes.mesIndex]}</td>
                    <td>${formatCurrency(mes.totalIngresosMes)}</td>
                    <td>${formatCurrency(mes.gastosReales)}</td>
                    <td class="${mes.saldoMes >= 0 ? 'text-success' : 'text-danger'} fw-medium">${formatCurrency(mes.saldoMes)}</td>
                    <td class="fw-semibold">${formatCurrency(mes.saldoAcumulado)}</td>
                    <td><span class="badge rounded-pill ${getBadgeClass(variations.vsMesAnt)}">${formatPercentage(variations.vsMesAnt)}</span></td>
                    <td><span class="badge rounded-pill ${getBadgeClass(variations.vsAnoAnt)}">${formatPercentage(variations.vsAnoAnt)}</span></td>
                    <td><button class="btn btn-outline-primary btn-sm" data-month-index="${mes.mesIndex}" title="Ver Detalle Gasto"><i class="bi bi-search"></i></button></td>
                </tr>
            `;
            elements.tablaMensualBody.insertAdjacentHTML('beforeend', row);
        });
    };

    const renderRubrosAccordion = (monthData = null) => {
        elements.accordionGastos.innerHTML = ''; // Limpiar
        const year = appState.currentYear;
        const dataToShow = monthData || getLastAvailableMonth(year); // Mostrar mes específico o el último

        elements.accordionGastosPlaceholder.classList.add('d-none'); // Ocultar placeholder

        if (!dataToShow || !dataToShow.gastosDetalle) {
             elements.accordionGastosEmpty.classList.remove('d-none'); // Mostrar vacío
             return;
        }
         elements.accordionGastosEmpty.classList.add('d-none'); // Ocultar vacío

        appState.config.rubros.forEach((rubroConfig) => {
            const rubroData = dataToShow.gastosDetalle[rubroConfig.id];
            // Solo mostrar rubros que tengan datos en el mes seleccionado
            if (!rubroData || !rubroData.total || rubroData.total === 0) return;

            const collapseId = `collapse${rubroConfig.id}`;
            const headingId = `heading${rubroConfig.id}`;

            let itemsHtml = '<p class="fst-italic text-muted small">No hay detalle de ítems disponible para este rubro.</p>';
            if (rubroData.items && rubroData.items.length > 0) {
                itemsHtml = '<ul class="list-group list-group-flush">';
                rubroData.items.forEach(item => {
                    itemsHtml += `
                        <li class="list-group-item d-flex justify-content-between align-items-center border-0 px-0 py-1">
                            <span class="text-break small">${item.desc || 'Item sin descripción'}</span>
                            <span class="badge bg-light text-dark rounded-pill fw-normal">${formatCurrency(item.val || 0)}</span>
                        </li>
                    `;
                });
                itemsHtml += '</ul>';
            }

            const accordionItem = `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="${headingId}">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                            ${rubroConfig.nombre}
                            <span class="ms-auto fw-bold">${formatCurrency(rubroData.total)}</span>
                        </button>
                    </h2>
                    <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headingId}" data-bs-parent="#accordionGastos">
                        <div class="accordion-body">
                            ${itemsHtml}
                        </div>
                    </div>
                </div>
            `;
            elements.accordionGastos.insertAdjacentHTML('beforeend', accordionItem);
        });
         // Si después de iterar no se añadió nada
        if(elements.accordionGastos.innerHTML === ''){
             elements.accordionGastosEmpty.classList.remove('d-none');
        }
    };

    const renderGestionFinanciera = () => {
        const data = appState.gestionFinanciera;
        elements.gestionInversionesSaldo.textContent = formatCurrency(data.inversiones.saldo);
        elements.gestionInversionesVenc.textContent = `Vencimiento: ${data.inversiones.vencimiento || 'N/A'}`;
        elements.gestionCuentaSaldo.textContent = formatCurrency(data.cuentaCorriente.saldo);
        elements.gestionCuentaMov.textContent = `Últ. Mov.: ${data.cuentaCorriente.ultimoMov || 'N/A'}`;
        elements.gestionReservasSaldo.textContent = formatCurrency(data.reservas.saldo);
        elements.gestionReservasObj.textContent = `Objetivo: ${formatCurrency(data.reservas.objetivo)}`;

        // Lógica de alerta predictiva (ejemplo simple)
        const lastMonth = getLastAvailableMonth(appState.currentYear);
        if (lastMonth && lastMonth.saldoAcumulado < 500000) { // Ejemplo: alerta si saldo baja de 500k
            elements.alertaPredictivaMensaje.textContent = `El saldo acumulado (${formatCurrency(lastMonth.saldoAcumulado)}) es bajo. Se recomienda revisar gastos futuros.`;
            elements.alertaPredictiva.classList.remove('d-none');
        } else {
            elements.alertaPredictiva.classList.add('d-none');
        }
    };

    const populateReportDropdowns = () => {
         // Misma lógica que antes, pero quizás con mejor manejo de vacío
          const year = appState.currentYear;
         const yearData = appState.datosAnuales[year] || [];
         elements.selectMesReporteVecino.innerHTML = '<option selected disabled value="">Seleccionar...</option>';
         elements.selectMesReporteInterno.innerHTML = '<option selected disabled value="">Seleccionar...</option>';


        if (yearData.length > 0) {
            yearData.sort((a, b) => b.mesIndex - a.mesIndex); // Ordenar por mes descendente
             // Opción para reporte anual interno
             elements.selectMesReporteInterno.innerHTML += `<option value="anual">Año ${year} Completo</option>`;
             // Opciones mensuales
            yearData.forEach(mes => {
                const optionText = `${mes.mesNombre || appState.config.meses[mes.mesIndex]} ${year}`;
                const optionValue = `${year}-${String(mes.mesIndex + 1).padStart(2, '0')}`;
                elements.selectMesReporteVecino.innerHTML += `<option value="${optionValue}">${optionText}</option>`;
                elements.selectMesReporteInterno.innerHTML += `<option value="${optionValue}">${optionText}</option>`;
            });
        } else {
             // Deshabilitar botones si no hay opciones
            elements.btnGenerarReporteVecinoPdf.disabled = true;
            elements.btnExportarExcel.disabled = true;
            elements.btnExportarPdfDetallado.disabled = true;
        }
    };

    // --- 7. LÓGICA DE GRÁFICOS ---
    // (La lógica de initCharts y updateProyeccionChart es similar, pero ajustar colores/opciones)
     const initCharts = () => {
        Object.values(charts).forEach(chart => chart?.destroy()); // Destruir anteriores

        const year = appState.currentYear;
        const yearData = appState.datosAnuales[year] || [];
        yearData.sort((a, b) => a.mesIndex - b.mesIndex); // Asegurar orden cronológico
        const labels = yearData.map(m => appState.config.meses[m.mesIndex].substring(0, 3)); // Mes abreviado
        const ingresosData = yearData.map(m => m.totalIngresosMes);
        const gastosData = yearData.map(m => m.gastosReales);

        const chartOptionsBase = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }, // Leyenda más limpia por defecto
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: '#e9ecef' }, ticks: { callback: (value) => formatCurrency(value).replace('ARS', '') } } // Formato moneda simplificado
            },
            interaction: { intersect: false, mode: 'index' }, // Tooltips mejorados
        };

        if (elements.ingresosGastosChartCanvas && yearData.length > 0) {
            const ctx1 = elements.ingresosGastosChartCanvas.getContext('2d');
            charts.ingresosGastosMensual = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Ingresos', data: ingresosData, borderColor: '#198754', backgroundColor: 'rgba(25, 135, 84, 0.1)', fill: true, tension: 0.3, pointRadius: 3, pointHoverRadius: 5 },
                        { label: 'Gastos', data: gastosData, borderColor: '#dc3545', backgroundColor: 'rgba(220, 53, 69, 0.1)', fill: true, tension: 0.3, pointRadius: 3, pointHoverRadius: 5 }
                    ]
                },
                options: { ...chartOptionsBase, plugins: { legend: { display: true, position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } } }
            });
        }

        const lastMonth = getLastAvailableMonth(year);
        if (elements.distribucionGastosChartCanvas && lastMonth?.gastosDetalle) {
            const ctx2 = elements.distribucionGastosChartCanvas.getContext('2d');
            const gastoLabels = [];
            const gastoData = [];
            const backgroundColors = ['#005A9C', '#007bff', '#6c757d', '#198754', '#ffc107', '#dc3545', '#0dcaf0', '#adb5bd', '#fd7e14', '#6610f2']; // Paleta
            let colorIndex = 0;

            appState.config.rubros.forEach(r => {
                 const totalRubro = lastMonth.gastosDetalle[r.id]?.total || 0;
                 if (totalRubro > 0) { // Solo incluir rubros con gasto > 0
                    gastoLabels.push(r.nombre);
                    gastoData.push(totalRubro);
                 }
            });

            charts.distribucionGastos = new Chart(ctx2, {
                type: 'doughnut', // Más moderno que pie
                data: {
                    labels: gastoLabels,
                    datasets: [{
                        data: gastoData,
                        backgroundColor: backgroundColors.slice(0, gastoLabels.length),
                        borderColor: var(--white-bg), // Borde blanco entre segmentos
                        borderWidth: 2,
                        hoverOffset: 8
                    }]
                },
                 options: {
                     responsive: true,
                     maintainAspectRatio: false,
                     cutout: '65%', // Hacer el donut más fino
                     plugins: {
                         legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 15 } },
                         tooltip: { callbacks: { label: (context) => `${context.label}: ${formatCurrency(context.raw)}` } }
                     }
                 }
            });
        }

        if (elements.proyeccionAnualChartCanvas) {
            const ctx3 = elements.proyeccionAnualChartCanvas.getContext('2d');
            const saldoAcumuladoReal = yearData.map(m => m.saldoAcumulado);
            charts.proyeccionAnual = new Chart(ctx3, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [ { label: 'Saldo Acumulado Real', data: saldoAcumuladoReal, borderColor: '#005A9C', backgroundColor: 'rgba(0, 90, 156, 0.1)', fill: true, tension: 0.3, pointRadius: 3, pointHoverRadius: 5 }]
                },
                options: chartOptionsBase
            });
        }
    };

    const updateProyeccionChart = (labels, realData, projectedData) => {
        // Lógica similar a la anterior, pero usando los nuevos estilos/colores
         if (!charts.proyeccionAnual) return;
         charts.proyeccionAnual.data.labels = labels.map(l => l.substring(0,3)); // Usar meses abreviados
         charts.proyeccionAnual.data.datasets = [
             { label: 'Saldo Real', data: realData, borderColor: '#005A9C', backgroundColor: 'rgba(0, 90, 156, 0.1)', fill: false, tension: 0.3, pointRadius: 3, pointHoverRadius: 5 },
             { label: 'Saldo Proyectado', data: projectedData, borderColor: '#ffc107', backgroundColor: 'rgba(255, 193, 7, 0.1)', borderDash: [5, 5], fill: false, tension: 0.3, pointRadius: 3, pointHoverRadius: 5 }
         ];
         charts.proyeccionAnual.update();
    };

    // --- 8. LÓGICA DE PROYECCIONES ---
    // (Sin cambios mayores en la lógica de cálculo, solo en la presentación del resultado)
    const calcularProyeccion = () => {
         const year = appState.currentYear;
        const dataReal = appState.datosAnuales[year] ? [...appState.datosAnuales[year]] : [];
        dataReal.sort((a, b) => a.mesIndex - b.mesIndex); // Asegurar orden
        const lastRealMonthIndex = dataReal.length > 0 ? dataReal[dataReal.length - 1].mesIndex : -1;
        const lastRealMonthData = dataReal.length > 0 ? dataReal[dataReal.length - 1] : null;
        let ultimoSaldoAcumulado = lastRealMonthData ? lastRealMonthData.saldoAcumulado : 0;
        let saldoAcumuladoBase = ultimoSaldoAcumulado; // Para comparación

        const ipcMensual = parseFloat(elements.paramIPC.value) / 100 || 0;
        const aumVigilancia = parseFloat(elements.paramAumVig.value) / 100 || 0;
        const aumMantenimiento = parseFloat(elements.paramAumMant.value) / 100 || 0;
        const escenarioOpt = elements.paramOptimizacion.value;

        const mesesProyectados = [];
        const todosLosMeses = appState.config.meses;

        // Calcular Proyección Base (sin ajustes de escenario) para comparación
        let cierreBaseProyectado = ultimoSaldoAcumulado;
         for (let i = lastRealMonthIndex + 1; i < 12; i++) {
             let gastosBase = lastRealMonthData?.gastosReales || 0;
             let ingresosBase = lastRealMonthData?.totalIngresosMes || 0;
              // Aplicar solo IPC a gastos base (simplificación)
             gastosBase *= (1 + ipcMensual * (i - lastRealMonthIndex));
             cierreBaseProyectado += (ingresosBase - gastosBase);
         }

        // Calcular Proyección con Escenario
        ultimoSaldoAcumulado = lastRealMonthData ? lastRealMonthData.saldoAcumulado : 0; // Resetear saldo
        for (let i = lastRealMonthIndex + 1; i < 12; i++) {
            const mesNombre = todosLosMeses[i];
            let ingresosEstimados = lastRealMonthData?.totalIngresosMes || 500000;
            let gastosEstimadosDetalle = {};
            const baseGastos = lastRealMonthData?.gastosDetalle || {};

            appState.config.rubros.forEach(rubroConfig => {
                let gastoBaseRubro = baseGastos[rubroConfig.id]?.total || 0;
                let gastoProyectado = gastoBaseRubro;
                // Aplicar IPC (ejemplo simple: acumulativo)
                 gastoProyectado *= (1 + ipcMensual * (i - lastRealMonthIndex));

                // Aplicar Aumentos Salariales Específicos (ejemplo: seguridad en rubro 'seguridad')
                 if (rubroConfig.id === 'seguridad') gastoProyectado *= (1 + aumVigilancia);
                 if (rubroConfig.id === 'mantenimiento' || rubroConfig.id === 'remuneraciones') gastoProyectado *= (1 + aumMantenimiento);

                // Aplicar Escenarios de Optimización
                 if (escenarioOpt === 'opt1' && rubroConfig.id === 'mantenimiento') gastoProyectado *= 0.95;
                 if (escenarioOpt === 'opt2' && rubroConfig.id === 'seguridad') gastoProyectado -= 10000;

                gastosEstimadosDetalle[rubroConfig.id] = { total: gastoProyectado, items: [] };
            });

            const gastosRealesProyectados = Object.values(gastosEstimadosDetalle).reduce((sum, rubro) => sum + rubro.total, 0);
            const saldoMesProyectado = ingresosEstimados - gastosRealesProyectados;
            ultimoSaldoAcumulado += saldoMesProyectado;

            mesesProyectados.push({
                mesIndex: i, mesNombre: mesNombre, ingresos: ingresosEstimados,
                gastosDetalle: gastosEstimadosDetalle, gastosReales: gastosRealesProyectados,
                saldoMes: saldoMesProyectado, saldoAcumulado: ultimoSaldoAcumulado, totalIngresosMes: ingresosEstimados // Añadir para consistencia
            });
        }

        const combinedData = [...dataReal, ...mesesProyectados];
        const projectionLabels = combinedData.map(m => m.mesNombre);
        const realSaldos = dataReal.map(m => m.saldoAcumulado);
        const projectedSaldos = [ ...Array(dataReal.length).fill(null), ...mesesProyectados.map(m => m.saldoAcumulado) ];
         if (realSaldos.length > 0 && projectedSaldos.length > realSaldos.length) {
            projectedSaldos[realSaldos.length -1] = realSaldos[realSaldos.length-1];
         }

        const cierreProyectado = ultimoSaldoAcumulado;
        elements.proyCierreEscenario.textContent = formatCurrency(cierreProyectado);

        // Impacto vs Base
        const impacto = cierreProyectado - cierreBaseProyectado;
        elements.proyImpacto.textContent = `${formatCurrency(impacto)} (${formatPercentage(impacto / cierreBaseProyectado * 100)})`;
        elements.proyImpacto.className = impacto >= 0 ? 'text-success' : 'text-danger';

        elements.kpiProyeccionCierre.textContent = formatCurrency(cierreProyectado);
        updateProyeccionChart(projectionLabels, realSaldos, projectedSaldos);
        appState.proyeccionCache = combinedData;

         showToast('Proyección Calculada', `El cierre anual proyectado es ${formatCurrency(cierreProyectado)}.`, 'success');
    };


    // --- 9. LÓGICA DE IMPORTACIÓN (SIMULADA CON DATOS PDF) ---
    const handleImportData = () => {
        const mesAnio = elements.importMes.value;
        const fileInput = elements.importFile;
        const saldoAnteriorManual = parseFloat(elements.importSaldoAnterior.value);

        if (!mesAnio || fileInput.files.length === 0) {
            showToast('Error de Importación', 'Selecciona mes/año y archivo.', 'danger');
            return;
        }

        const [yearStr, monthStr] = mesAnio.split('-');
        const year = parseInt(yearStr);
        const monthIndex = parseInt(monthStr) - 1;
        const mesNombre = appState.config.meses[monthIndex];

        console.log(`Simulando importación para ${mesNombre} ${year} desde ${fileInput.files[0].name}...`);
        // ** EN UNA APP REAL: ENVIAR fileInput.files[0] AL BACKEND AQUÍ **
        // fetch('/api/import', { method: 'POST', body: new FormData(elements.formImport) }) ...

        let importedData;
        // --- SIMULACIÓN: Si es Marzo 2025, usa los datos del PDF ---
        if (year === 2025 && monthIndex === 2) {
            console.log("Usando datos simulados del PDF para Marzo 2025");
            importedData = JSON.parse(JSON.stringify(pdfDataMarzo2025)); // Deep copy
            // Ajustar saldo anterior si se ingresó manualmente
             if (!isNaN(saldoAnteriorManual)) {
                 importedData.saldoAnterior = saldoAnteriorManual;
                  // Recalcular saldo de cierre basado en el manual
                 importedData.saldoCierre = saldoAnteriorManual + importedData.ingresos.total - importedData.egresos.total;
             }
             // Añadir totalIngresosMes y gastosReales para consistencia
             importedData.totalIngresosMes = importedData.ingresos.total;
             importedData.gastosReales = importedData.egresos.total;

        } else {
            // --- SIMULACIÓN: Para otros meses, genera datos aleatorios (como antes) ---
            console.log("Generando datos simulados aleatorios para", mesNombre, year);
             const ingresosSim = 500000 + Math.random() * 200000;
             let gastosSimDetalle = {};
             let gastosSimTotal = 0;
             appState.config.rubros.forEach(rubro => {
                const gastoRubro = Math.random() * 80000 + (rubro.id === 'remuneraciones' || rubro.id === 'seguridad' ? 100000 : 10000);
                gastosSimDetalle[rubro.id] = { total: gastoRubro, items: [{desc: 'Gasto Simulado', val: gastoRubro }] };
                gastosSimTotal += gastoRubro;
            });
             importedData = {
                year: year, monthIndex: monthIndex, mesNombre: mesNombre,
                saldoAnterior: isNaN(saldoAnteriorManual) ? undefined : saldoAnteriorManual, // Se calculará si es undefined
                ingresos: { total: ingresosSim }, // Simplificado para simulación
                egresos: { total: gastosSimTotal }, // Simplificado
                gastosDetalle: gastosSimDetalle,
                totalIngresosMes: ingresosSim,
                gastosReales: gastosSimTotal,
                saldoCierre: 0 // Se calculará
            };
        }

        // Añadir/Reemplazar en el estado
        if (!appState.datosAnuales[year]) appState.datosAnuales[year] = [];
        const existingIndex = appState.datosAnuales[year].findIndex(m => m.mesIndex === monthIndex);
        if (existingIndex > -1) {
            appState.datosAnuales[year][existingIndex] = importedData;
        } else {
            appState.datosAnuales[year].push(importedData);
        }
        // Actualizar año actual si cambió
        appState.currentYear = year;

        // Recalcular todo y actualizar UI
        calculateYearData(year);
        renderUI(); // Renderiza todo
        populateReportDropdowns(); // Actualizar dropdowns

        elements.importModal.hide();
        elements.formImport.reset();

        showToast('Importación Exitosa', `Datos para ${mesNombre} ${year} procesados correctamente (simulación).`, 'success');
    };

    // --- 10. LÓGICA DE GENERACIÓN DE REPORTES ---
    // (Lógica interna sin cambios mayores, pero revisar llamadas a jsPDF/SheetJS y formato)
      const generarPdfVecinos = () => {
        if (typeof jsPDF === 'undefined' || typeof jsPDF.API.autoTable === 'undefined') {
            return showToast('Error', 'Librerías PDF no cargadas.', 'danger');
        }
        const selectedValue = elements.selectMesReporteVecino.value;
        if (!selectedValue) return showToast('Error', 'Selecciona un mes para el reporte.', 'warning');

        const [yearStr, monthStr] = selectedValue.split('-');
        const year = parseInt(yearStr);
        const monthIndex = parseInt(monthStr) - 1;
        const mesData = getMonthData(year, monthIndex);

        if (!mesData) return showToast('Error', 'No hay datos para el mes seleccionado.', 'danger');

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const fechaReporte = new Date().toLocaleDateString('es-AR');
        const periodo = `${mesData.mesNombre || appState.config.meses[mesData.mesIndex]} ${year}`;
        const pageHeight = doc.internal.pageSize.height;
        let finalY = 0; // Track vertical position

        // Encabezado con AutoTable
        doc.autoTable({
            body: [
                [{ content: 'Barrio Privado El Centauro - Resumen Mensual', styles: { halign: 'center', fontSize: 16, fontStyle: 'bold' } }],
                [{ content: `Periodo: ${periodo} | Emisión: ${fechaReporte}`, styles: { halign: 'center', fontSize: 10 } }]
            ],
            theme: 'plain',
            styles: { textColor: '#000000' },
            startY: 15
        });
        finalY = doc.lastAutoTable.finalY + 10;

        // Resumen Financiero
        doc.setFontSize(12);
        doc.text("Resumen Financiero", 14, finalY);
        finalY += 5;
        const saldoInicialCalc = mesData.saldoAnterior ?? (getMonthData(year, monthIndex - 1)?.saldoAcumulado ?? 0);
        const resumenData = [
            ["Saldo Inicial del Mes:", formatCurrency(saldoInicialCalc)],
            ["Ingresos Totales del Mes:", formatCurrency(mesData.totalIngresosMes)],
            ["Gastos Totales del Mes:", formatCurrency(mesData.gastosReales)],
            ["Saldo al Cierre del Mes:", formatCurrency(mesData.saldoAcumulado)]
        ];
        doc.autoTable({
            startY: finalY,
            head: [['Concepto', 'Monto']], body: resumenData,
            theme: 'grid', headStyles: { fillColor: [0, 90, 156] }, // Primary color
            styles: { fontSize: 10, cellPadding: 2 },
            columnStyles: { 1: { halign: 'right' } }
        });
        finalY = doc.lastAutoTable.finalY + 10;

        // Desglose de Gastos por Rubro
        doc.setFontSize(12);
        doc.text("Desglose de Gastos por Rubro", 14, finalY);
        finalY += 5;
        const gastosBody = appState.config.rubros.map(rubroConfig => {
            const gasto = mesData.gastosDetalle?.[rubroConfig.id]?.total || 0;
            return [rubroConfig.nombre, gasto];
        }).filter(row => row[1] > 0) // Filtrar rubros con gasto 0
          .map(row => [row[0], formatCurrency(row[1])]); // Formatear moneda

        doc.autoTable({
            startY: finalY,
            head: [['Rubro', 'Monto Total']], body: gastosBody,
            theme: 'striped', headStyles: { fillColor: [108, 117, 125] }, // Secondary color
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: { 1: { halign: 'right' } }
        });
        finalY = doc.lastAutoTable.finalY;

         // Numeración de páginas (opcional)
         const pageCount = doc.internal.getNumberOfPages();
         for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 20, pageHeight - 10, { align: 'right' });
         }

        doc.save(`Resumen_ElCentauro_${periodo.replace(' ','_')}.pdf`);
        showToast('Reporte Generado', 'PDF para vecinos descargado.', 'success');
    };

    const exportarExcel = () => {
        if (typeof XLSX === 'undefined') return showToast('Error', 'Librería Excel no cargada.', 'danger');

        const selectedValue = elements.selectMesReporteInterno.value;
        if (!selectedValue) return showToast('Error', 'Selecciona un período para exportar.', 'warning');

        const wb = XLSX.utils.book_new();
        let fileName = '';
        const year = appState.currentYear;

        if (selectedValue === 'anual') {
            fileName = `Reporte_Financiero_Anual_${year}.xlsx`;
            const yearData = appState.datosAnuales[year] || [];
            if (yearData.length === 0) return showToast('Info', 'No hay datos anuales para exportar.', 'info');

            yearData.sort((a, b) => a.mesIndex - b.mesIndex); // Ordenar

            // Hoja 1: Resumen Anual
            let resumenAnualData = [ [ "Mes", "Ingresos", "Gastos Totales", "Saldo Mensual", "Saldo Acumulado" ] ];
            yearData.forEach(mes => resumenAnualData.push([
                 mes.mesNombre || appState.config.meses[mes.mesIndex], mes.totalIngresosMes, mes.gastosReales, mes.saldoMes, mes.saldoAcumulado
             ]));
            const wsResumen = XLSX.utils.aoa_to_sheet(resumenAnualData);
             // Aplicar formato (ejemplo básico)
             const rangeResumen = XLSX.utils.decode_range(wsResumen['!ref']);
             for(let C = 1; C <= rangeResumen.e.c; C++) { // Desde columna B
                 for(let R = 1; R <= rangeResumen.e.r; R++) {
                     const cell_ref = XLSX.utils.encode_cell({c:C, r:R});
                     if(wsResumen[cell_ref] && typeof wsResumen[cell_ref].v === 'number') {
                         wsResumen[cell_ref].t = 'n';
                         wsResumen[cell_ref].z = '$ #,##0.00';
                     }
                 }
             }
             wsResumen['!cols'] = [{wch:15}, {wch:18}, {wch:18}, {wch:18}, {wch:20}]; // Anchos estimados
            XLSX.utils.book_append_sheet(wb, wsResumen, `Resumen ${year}`);

             // Hoja 2: Detalle Gastos Anual por Rubro
             let detalleGastosData = [ ["Mes", ...appState.config.rubros.map(r => r.nombre)] ];
             yearData.forEach(mes => {
                let row = [mes.mesNombre || appState.config.meses[mes.mesIndex]];
                appState.config.rubros.forEach(rubro => {
                    row.push(mes.gastosDetalle?.[rubro.id]?.total || 0);
                });
                detalleGastosData.push(row);
             });
              const wsDetalle = XLSX.utils.aoa_to_sheet(detalleGastosData);
               // Aplicar formato
             const rangeDetalle = XLSX.utils.decode_range(wsDetalle['!ref']);
             for(let C = 1; C <= rangeDetalle.e.c; C++) { // Desde columna B
                 for(let R = 1; R <= rangeDetalle.e.r; R++) {
                      const cell_ref = XLSX.utils.encode_cell({c:C, r:R});
                     if(wsDetalle[cell_ref] && typeof wsDetalle[cell_ref].v === 'number') {
                         wsDetalle[cell_ref].t = 'n';
                         wsDetalle[cell_ref].z = '$ #,##0.00';
                     }
                 }
             }
              wsDetalle['!cols'] = [{wch:15}, ...appState.config.rubros.map(() => ({wch: 20}))];
             XLSX.utils.book_append_sheet(wb, wsDetalle, `Gastos Rubro ${year}`);

        } else {
            // Exportar detalle de un mes específico
            const [yearStr, monthStr] = selectedValue.split('-');
            const monthIndex = parseInt(monthStr) - 1;
            const mesData = getMonthData(parseInt(yearStr), monthIndex);

            if (!mesData) return showToast('Error', 'No hay datos para el mes seleccionado.', 'danger');

            const periodo = `${mesData.mesNombre || appState.config.meses[mesData.mesIndex]}_${yearStr}`;
            fileName = `Reporte_Detallado_${periodo}.xlsx`;

             // Hoja 1: Detalle Gasto Items
             let detalleItemsData = [ ['Rubro', 'Descripción Ítem', 'Valor'] ];
             appState.config.rubros.forEach(rubroConfig => {
                 const rubroData = mesData.gastosDetalle?.[rubroConfig.id];
                 if (rubroData && rubroData.items && rubroData.items.length > 0) {
                     rubroData.items.forEach(item => {
                         detalleItemsData.push([rubroConfig.nombre, item.desc || 'N/A', item.val || 0]);
                     });
                 } else if (rubroData && rubroData.total > 0) {
                     // Si no hay items pero sí total, añadir una fila resumen
                     detalleItemsData.push([rubroConfig.nombre, `Total Rubro (sin detalle)`, rubroData.total]);
                 }
             });
             const wsItems = XLSX.utils.aoa_to_sheet(detalleItemsData);
             // Aplicar formato
              const rangeItems = XLSX.utils.decode_range(wsItems['!ref']);
             for(let R = 1; R <= rangeItems.e.r; R++) {
                 const cell_ref = XLSX.utils.encode_cell({c:2, r:R}); // Columna C (Valor)
                 if(wsItems[cell_ref] && typeof wsItems[cell_ref].v === 'number') {
                     wsItems[cell_ref].t = 'n';
                     wsItems[cell_ref].z = '$ #,##0.00';
                 }
             }
              wsItems['!cols'] = [{wch:25}, {wch:50}, {wch:18}];
             XLSX.utils.book_append_sheet(wb, wsItems, `Detalle Gastos ${periodo}`);
        }

        XLSX.writeFile(wb, fileName);
        showToast('Reporte Generado', `Archivo Excel "${fileName}" descargado.`, 'success');
    };

    const generarPdfDetallado = () => {
         // Lógica similar a generarPdfVecinos pero incluyendo tablas con items de gasto
          if (typeof jsPDF === 'undefined' || typeof jsPDF.API.autoTable === 'undefined') {
             return showToast('Error', 'Librerías PDF no cargadas.', 'danger');
         }
          const selectedValue = elements.selectMesReporteInterno.value;
         if (!selectedValue || selectedValue === 'anual') return showToast('Error', 'Selecciona un mes específico para el PDF detallado.', 'warning');

         const [yearStr, monthStr] = selectedValue.split('-');
         const year = parseInt(yearStr);
         const monthIndex = parseInt(monthStr) - 1;
         const mesData = getMonthData(year, monthIndex);

         if (!mesData) return showToast('Error', 'No hay datos para el mes seleccionado.', 'danger');

         const { jsPDF } = window.jspdf;
         const doc = new jsPDF('p', 'pt'); // Usar puntos para más precisión con autotable
         const fechaReporte = new Date().toLocaleDateString('es-AR');
         const periodo = `${mesData.mesNombre || appState.config.meses[mesData.mesIndex]} ${year}`;
         const pageHeight = doc.internal.pageSize.height;
         let finalY = 80; // Start lower in points

        // Encabezado
         doc.setFontSize(18); doc.text("Reporte Financiero Detallado", doc.internal.pageSize.width / 2, 40, { align: 'center' });
         doc.setFontSize(10); doc.text(`Barrio Privado El Centauro | Periodo: ${periodo} | Emisión: ${fechaReporte}`, doc.internal.pageSize.width / 2, 60, { align: 'center' });

        // Resumen Financiero (opcional, similar a vecinos)
        // ...

        // Detalle Gastos por Rubro con Items
        doc.setFontSize(14); doc.text("Detalle de Gastos por Rubro e Ítem", 40, finalY); finalY += 20;

        appState.config.rubros.forEach(rubroConfig => {
            const rubroData = mesData.gastosDetalle?.[rubroConfig.id];
            if (rubroData && rubroData.total > 0) {
                // Título del Rubro
                doc.setFontSize(11);
                doc.setFont(undefined,'bold');
                doc.text(rubroConfig.nombre, 40, finalY);
                doc.setFont(undefined,'normal');
                 doc.text(`Total: ${formatCurrency(rubroData.total)}`, doc.internal.pageSize.width - 40, finalY, { align: 'right'});
                finalY += 15;

                let itemsTableBody = [];
                if (rubroData.items && rubroData.items.length > 0) {
                    itemsTableBody = rubroData.items.map(item => [item.desc || 'N/A', formatCurrency(item.val || 0)]);
                } else {
                     itemsTableBody.push(['Total Rubro (sin detalle)', formatCurrency(rubroData.total)]);
                }

                doc.autoTable({
                    startY: finalY,
                    head: [['Descripción Ítem', 'Valor']],
                    body: itemsTableBody,
                    theme: 'grid',
                    headStyles: { fillColor: [230, 230, 230], textColor: 50, fontSize: 9, fontStyle: 'bold' },
                    bodyStyles: { fontSize: 8, cellPadding: 3 },
                    columnStyles: { 1: { halign: 'right' } },
                    margin: { left: 40, right: 40 }
                });
                finalY = doc.lastAutoTable.finalY + 15; // Espacio entre rubros
            }
        });

        // Numeración de páginas
        const pageCount = doc.internal.getNumberOfPages();
         for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 40, pageHeight - 20, { align: 'right' });
         }

         doc.save(`Reporte_Detallado_ElCentauro_${periodo.replace(' ','_')}.pdf`);
         showToast('Reporte Generado', 'PDF detallado descargado.', 'success');
     };

    // --- 11. NAVEGACIÓN Y MANEJO DE UI ---
    const navigateToSection = (sectionId) => {
        // Ocultar todas las secciones
        elements.appSections.forEach(section => section.classList.remove('active'));
        // Mostrar la sección deseada
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            appState.activeSection = sectionId;
            // Actualizar título navbar
            const sectionLink = document.querySelector(`#sidebar .nav-link[data-section="${sectionId}"]`);
            elements.sectionTitle.textContent = sectionLink ? sectionLink.textContent.trim() : 'Detalle';
            // Actualizar link activo en sidebar
            document.querySelectorAll('#sidebar .nav-link').forEach(link => link.classList.remove('active'));
            if (sectionLink) sectionLink.classList.add('active');
            // Scroll al inicio de la sección (opcional)
             window.scrollTo(0, 0);
        }
    };

    const setupEventListeners = () => {
        // Navegación Sidebar
        document.querySelectorAll('#sidebar .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                if (sectionId) {
                    navigateToSection(sectionId);
                    // Cerrar sidebar en móvil si está abierta
                     if(window.innerWidth < 768) {
                         document.body.classList.remove('sidebar-toggled');
                     }
                }
            });
        });

         // Toggle Sidebar (Botón hamburguesa y overlay)
        elements.sidebarToggle?.addEventListener('click', () => {
             document.body.classList.toggle('sidebar-toggled');
        });
         // Cerrar sidebar si se hace clic fuera en móvil
         document.addEventListener('click', (e) => {
             if(window.innerWidth < 768 && document.body.classList.contains('sidebar-toggled')) {
                // Si el clic NO es dentro del sidebar NI en el botón de toggle
                if (!elements.sidebar.contains(e.target) && !elements.sidebarToggle.contains(e.target)) {
                    document.body.classList.remove('sidebar-toggled');
                 }
             }
         });


        // Botones y formularios
        elements.btnConfirmImport.addEventListener('click', handleImportData);
        elements.btnCalcularProyeccion.addEventListener('click', calcularProyeccion);
        elements.btnGenerarReporteVecinoPdf.addEventListener('click', generarPdfVecinos);
        elements.btnExportarExcel.addEventListener('click', exportarExcel);
        elements.btnExportarPdfDetallado.addEventListener('click', generarPdfDetallado);

        // Botón detalle en tabla
         elements.tablaMensualBody.addEventListener('click', (event) => {
             const button = event.target.closest('button[data-month-index]');
             if (button) {
                 const monthIndex = parseInt(button.dataset.monthIndex);
                 const year = appState.currentYear;
                 const mesData = getMonthData(year, monthIndex);
                 if (mesData) {
                     // Actualizar gráfico de torta Y acordeón para ese mes
                     updateDistribucionGastosChart(mesData);
                     renderRubrosAccordion(mesData); // Render acordeón con datos del mes clickeado
                     // Opcional: Navegar a la sección de detalle si no está visible
                     // navigateToSection('detalle-gastos');
                     showToast('Detalle Cargado', `Mostrando detalle de gastos para ${mesData.mesNombre || appState.config.meses[mesData.mesIndex]} ${year}.`, 'info');
                 }
             }
         });
    };

     // Función para actualizar el gráfico de torta (con título dinámico)
     const updateDistribucionGastosChart = (mesData) => {
         if (charts.distribucionGastos && mesData?.gastosDetalle) {
             const gastoLabels = [];
             const gastoData = [];
             appState.config.rubros.forEach(r => {
                  const totalRubro = mesData.gastosDetalle[r.id]?.total || 0;
                  if (totalRubro > 0) {
                     gastoLabels.push(r.nombre);
                     gastoData.push(totalRubro);
                  }
             });
             charts.distribucionGastos.data.labels = gastoLabels;
             charts.distribucionGastos.data.datasets[0].data = gastoData;
              // Actualizar colores si la cantidad de rubros cambia
             const backgroundColors = ['#005A9C', '#007bff', '#6c757d', '#198754', '#ffc107', '#dc3545', '#0dcaf0', '#adb5bd', '#fd7e14', '#6610f2'];
             charts.distribucionGastos.data.datasets[0].backgroundColor = backgroundColors.slice(0, gastoLabels.length);

             charts.distribucionGastos.options.plugins.title = {
                 display: true,
                 text: `Gastos - ${mesData.mesNombre || appState.config.meses[mesData.mesIndex]} ${appState.currentYear}`,
                 padding: { top: 5, bottom: 10 },
                 font: { weight: 'bold' }
             };
             charts.distribucionGastos.update();
         }
     };

    // --- 12. FUNCIÓN DE INICIALIZACIÓN PRINCIPAL ---
    const renderUI = () => {
        renderDashboardKPIs();
        renderMonthlyTable();
        initCharts(); // Reinicializar/actualizar gráficos
        renderRubrosAccordion(); // Renderiza con el último mes por defecto
        renderGestionFinanciera();
        // Calcular proyección base inicial (opcional)
        // calcularProyeccion(); // Podría calcularse al inicio si hay datos
    };

    const init = () => {
        console.log('Inicializando aplicación El Centauro Finanzas...');
        // Inicializar instancia de Modal y Toast de Bootstrap
        elements.importModal = new bootstrap.Modal(elements.importModalEl);
        appState.toastInstance = new bootstrap.Toast(elements.toastEl);

        // Simular carga inicial de datos (ej: último mes del año anterior o vacío)
        // O podrías cargar Marzo 2025 por defecto para demostración:
        handleImportDataSimulation(pdfDataMarzo2025); // Carga Marzo 2025 sin interacción

        // Calcular datos (saldos acumulados)
        calculateYearData(appState.currentYear);
        // Renderizar UI inicial
        renderUI();
        populateReportDropdowns();
        // Configurar listeners
        setupEventListeners();
        // Mostrar sección inicial
        navigateToSection(appState.activeSection);
        console.log('Aplicación lista.');
    };

     // Función auxiliar para cargar datos simulados sin pasar por el modal
     const handleImportDataSimulation = (simulatedData) => {
         const year = simulatedData.year;
         const monthIndex = simulatedData.monthIndex;
         if (!appState.datosAnuales[year]) appState.datosAnuales[year] = [];
          const existingIndex = appState.datosAnuales[year].findIndex(m => m.mesIndex === monthIndex);
         if (existingIndex > -1) {
             appState.datosAnuales[year][existingIndex] = simulatedData;
         } else {
             appState.datosAnuales[year].push(simulatedData);
         }
         appState.currentYear = year;
     };


    // --- Ejecutar inicialización ---
    document.addEventListener('DOMContentLoaded', init);

})(); // Fin del IIFE
```
