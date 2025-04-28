// js/app.js

// Envolver todo en un IIFE para evitar contaminación del scope global
(() => {
    'use strict';

    // --- 1. ESTADO DE LA APLICACIÓN ---
    // Almacenará todos los datos financieros y configuración.
    // En una app real, esto vendría de un backend/API.
    const appState = {
        currentYear: 2024,
        config: {
            rubros: [ // Rubros personalizables
                { id: 'remuneraciones', nombre: 'Remuneraciones' },
                { id: 'seguridad', nombre: 'Seguridad' },
                { id: 'servicios_publicos', nombre: 'Servicios Públicos' },
                { id: 'mantenimiento', nombre: 'Mantenimiento' },
                { id: 'administracion', nombre: 'Administración' },
                { id: 'abonos', nombre: 'Abonos' },
                { id: 'limpieza', nombre: 'Limpieza' },
                { id: 'legales', nombre: 'Legales' },
                { id: 'bancarios', nombre: 'Bancarios' },
                { id: 'varios', nombre: 'Varios' },
            ],
            meses: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
        },
        datosAnuales: {
            // Ejemplo de datos para 2024 (rellenar con más meses o cargar dinámicamente)
            2024: [
                {
                    mesIndex: 0, // Enero
                    mesNombre: "Enero",
                    ingresos: 550000,
                    gastosDetalle: { // Gastos por rubro
                        remuneraciones: { total: 150000, items: [{ desc: 'Sueldo Encargado', val: 80000 }, { desc: 'Cargas Sociales', val: 70000 }] },
                        seguridad: { total: 120000, items: [{ desc: 'Servicio Vigilancia', val: 120000 }] },
                        servicios_publicos: { total: 35000, items: [{ desc: 'Luz Esp. Comunes', val: 25000 }, { desc: 'Agua Riego', val: 10000 }] },
                        mantenimiento: { total: 45000, items: [{ desc: 'Jardinería', val: 30000 }, { desc: 'Reparaciones Varias', val: 15000 }] },
                        administracion: { total: 25000, items: [{ desc: 'Honorarios Admin.', val: 25000 }] },
                        abonos: { total: 15000, items: [{ desc: 'Piletero', val: 15000 }] },
                        limpieza: { total: 10000, items: [{ desc: 'Insumos Limpieza', val: 10000 }] },
                        legales: { total: 0, items: [] },
                        bancarios: { total: 5000, items: [{ desc: 'Mantenimiento Cuenta', val: 5000 }] },
                        varios: { total: 2000, items: [{ desc: 'Gastos Librería', val: 2000 }] }
                    },
                    saldoMes: 0, // Se calculará
                    saldoAcumulado: 100000, // Saldo inicial del año (ejemplo)
                    gastosReales: 0, // Se calculará
                },
                {
                    mesIndex: 1, // Febrero
                    mesNombre: "Febrero",
                    ingresos: 560000,
                    gastosDetalle: {
                        remuneraciones: { total: 155000, items: [{ desc: 'Sueldo Encargado', val: 82000 }, { desc: 'Cargas Sociales', val: 73000 }] },
                        seguridad: { total: 120000, items: [{ desc: 'Servicio Vigilancia', val: 120000 }] },
                        servicios_publicos: { total: 38000, items: [{ desc: 'Luz Esp. Comunes', val: 27000 }, { desc: 'Agua Riego', val: 11000 }] },
                        mantenimiento: { total: 50000, items: [{ desc: 'Jardinería', val: 30000 }, { desc: 'Reparación Bomba', val: 20000 }] },
                        administracion: { total: 25000, items: [{ desc: 'Honorarios Admin.', val: 25000 }] },
                        abonos: { total: 15000, items: [{ desc: 'Piletero', val: 15000 }] },
                        limpieza: { total: 12000, items: [{ desc: 'Insumos Limpieza', val: 12000 }] },
                        legales: { total: 5000, items: [{ desc: 'Consulta Legal', val: 5000 }] },
                        bancarios: { total: 5000, items: [{ desc: 'Mantenimiento Cuenta', val: 5000 }] },
                        varios: { total: 3000, items: [{ desc: 'Gastos Varios', val: 3000 }] }
                    },
                    saldoMes: 0,
                    saldoAcumulado: 0, // Depende del mes anterior
                    gastosReales: 0,
                }
                // ... más meses
            ]
        },
        proyeccionCache: null, // Para guardar el resultado de la última proyección
        // --- Datos Financieros Avanzados (Ejemplos estáticos) ---
        gestionFinanciera: {
            inversiones: { saldo: 150000, vencimiento: '2024-12-15', tipo: 'Plazo Fijo UVA' },
            cuentaCorriente: { saldo: 85000, ultimoMov: '2024-11-05' },
            reservas: { saldo: 200000, objetivo: 500000, proposito: 'Fondo Obras Futuras' }
        }
    };

    // --- 2. SELECCIÓN DE ELEMENTOS DEL DOM ---
    // Guardar referencias a elementos usados frecuentemente
    const elements = {
        // KPIs
        kpiSaldoAcumulado: document.getElementById('kpi-saldo-acumulado'),
        kpiIngresosMes: document.getElementById('kpi-ingresos-mes'),
        kpiGastosMes: document.getElementById('kpi-gastos-mes'),
        kpiProyeccionCierre: document.getElementById('kpi-proyeccion-cierre'),
        currentYearSpan: document.getElementById('current-year'),
        // Tabla Mensual
        tablaMensualBody: document.getElementById('tabla-mensual-body'),
        // Gráficos (Canvas)
        ingresosGastosChartCanvas: document.getElementById('ingresosGastosMensualChart'),
        distribucionGastosChartCanvas: document.getElementById('distribucionGastosChart'),
        proyeccionAnualChartCanvas: document.getElementById('proyeccionAnualChart'),
        // Acordeón Gastos
        accordionGastos: document.getElementById('accordionGastos'),
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
        gestionInversionesSaldo: document.querySelector('#gestion-financiera .row > div:nth-child(1) p:nth-child(1)'),
        gestionInversionesVenc: document.querySelector('#gestion-financiera .row > div:nth-child(1) p:nth-child(2)'),
        gestionCuentaSaldo: document.querySelector('#gestion-financiera .row > div:nth-child(2) p:nth-child(1)'),
        gestionCuentaMov: document.querySelector('#gestion-financiera .row > div:nth-child(2) p:nth-child(2)'),
        gestionReservasSaldo: document.querySelector('#gestion-financiera .row > div:nth-child(3) p:nth-child(1)'),
        gestionReservasObj: document.querySelector('#gestion-financiera .row > div:nth-child(3) p:nth-child(2)'),
        alertaPredictiva: document.querySelector('#gestion-financiera .alert'),
        // Modal Importar
        importModal: new bootstrap.Modal(document.getElementById('importModal')), // Instancia del modal
        formImport: document.getElementById('form-import'),
        importMes: document.getElementById('import-mes'),
        importFile: document.getElementById('import-file'),
        importSaldoAnterior: document.getElementById('import-saldo-anterior'),
        btnConfirmImport: document.getElementById('btn-confirm-import'),
    };

    // --- 3. GRÁFICOS (Chart.js Instances) ---
    let charts = {
        ingresosGastosMensual: null,
        distribucionGastos: null,
        proyeccionAnual: null
    };

    // --- 4. FUNCIONES HELPER ---
    const formatCurrency = (value) => {
        if (typeof value !== 'number') return '$ 0.00';
        return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
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
        return yearData[yearData.length - 1];
    };

    // --- 5. LÓGICA DE CÁLCULO ---
    const calculateYearData = (year) => {
        const yearData = appState.datosAnuales[year];
        if (!yearData) return;

        let saldoAcumuladoAnterior = yearData[0]?.saldoAcumulado || 0; // Asume saldo inicial si no hay mes 0

        yearData.forEach((mes, index) => {
            // Calcular gastos totales del mes sumando los totales de cada rubro
            mes.gastosReales = Object.values(mes.gastosDetalle).reduce((sum, rubro) => sum + rubro.total, 0);
            mes.saldoMes = mes.ingresos - mes.gastosReales;

            if (index === 0) {
                // El saldo acumulado del primer mes es su saldo inicial (si existe) + saldo del mes
                 // Si no tiene saldoAcumulado propio, usamos el del año anterior (o 0)
                 if (typeof mes.saldoAcumulado !== 'number') {
                    // Aquí podríamos buscar el saldo del último mes del año anterior si existiera
                    mes.saldoAcumulado = saldoAcumuladoAnterior + mes.saldoMes;
                 } else {
                     // Usa el saldo acumulado ya definido para enero (podría venir de la importación)
                      mes.saldoAcumulado += mes.saldoMes; // Ajusta con el saldo del mes actual
                 }
            } else {
                mes.saldoAcumulado = yearData[index - 1].saldoAcumulado + mes.saldoMes;
            }
            saldoAcumuladoAnterior = mes.saldoAcumulado; // Actualizar para el siguiente mes
        });
    };

    const calculateVariations = (year, monthIndex) => {
        const yearData = appState.datosAnuales[year];
        if (!yearData) return { vsMesAnt: NaN, vsAnoAnt: NaN };

        const mesActual = yearData.find(m => m.mesIndex === monthIndex);
        const mesAnterior = yearData.find(m => m.mesIndex === monthIndex - 1);
        // const mesAnoAnterior = appState.datosAnuales[year - 1]?.find(m => m.mesIndex === monthIndex); // Necesitaría datos del año anterior

        let varMesAnt = NaN;
        if (mesActual && mesAnterior && mesAnterior.gastosReales > 0) {
            varMesAnt = ((mesActual.gastosReales - mesAnterior.gastosReales) / mesAnterior.gastosReales) * 100;
        }

        let varAnoAnt = NaN;
        // if (mesActual && mesAnoAnterior && mesAnoAnterior.gastosReales > 0) {
        //     varAnoAnt = ((mesActual.gastosReales - mesAnoAnterior.gastosReales) / mesAnoAnterior.gastosReales) * 100;
        // }
        // Simulación por falta de datos año anterior:
        if (monthIndex > 1) varAnoAnt = Math.random() * 10 - 5; // Valor aleatorio para demo

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
            // elements.kpiProyeccionCierre.textContent = formatCurrency(0); // Se calcula separado
            return;
        }

        elements.kpiSaldoAcumulado.textContent = formatCurrency(lastMonth.saldoAcumulado);
        elements.kpiIngresosMes.textContent = formatCurrency(lastMonth.ingresos);
        elements.kpiGastosMes.textContent = formatCurrency(lastMonth.gastosReales);
        elements.currentYearSpan.textContent = year;
    };

    const renderMonthlyTable = () => {
        const year = appState.currentYear;
        const yearData = appState.datosAnuales[year];
        elements.tablaMensualBody.innerHTML = ''; // Limpiar tabla

        if (!yearData) return;

        yearData.forEach(mes => {
            const variations = calculateVariations(year, mes.mesIndex);
            const varMesAntClass = variations.vsMesAnt > 0 ? 'bg-danger' : (variations.vsMesAnt < 0 ? 'bg-success' : 'bg-secondary');
            const varAnoAntClass = variations.vsAnoAnt > 0 ? 'bg-danger' : (variations.vsAnoAnt < 0 ? 'bg-success' : 'bg-secondary');

            const row = `
                <tr>
                    <td>${mes.mesNombre}</td>
                    <td>${formatCurrency(mes.ingresos)}</td>
                    <td>${formatCurrency(mes.gastosReales)}</td>
                    <td class="${mes.saldoMes >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(mes.saldoMes)}</td>
                    <td>${formatCurrency(mes.saldoAcumulado)}</td>
                    <td><span class="badge ${isNaN(variations.vsMesAnt) ? 'bg-light text-dark' : varMesAntClass}">${formatPercentage(variations.vsMesAnt)}</span></td>
                    <td><span class="badge ${isNaN(variations.vsAnoAnt) ? 'bg-light text-dark' : varAnoAntClass}">${formatPercentage(variations.vsAnoAnt)}</span></td>
                    <td><button class="btn btn-sm btn-outline-primary" data-month-index="${mes.mesIndex}" title="Ver Detalle Gasto"><i class="bi bi-search"></i></button></td>
                </tr>
            `;
            elements.tablaMensualBody.insertAdjacentHTML('beforeend', row);
        });
        // Añadir listeners a los botones de detalle (si es necesario un modal específico)
    };

    const renderRubrosAccordion = () => {
        elements.accordionGastos.innerHTML = ''; // Limpiar
        const year = appState.currentYear;
        const lastMonth = getLastAvailableMonth(year);

        if (!lastMonth) return;

        appState.config.rubros.forEach((rubroConfig, index) => {
            const rubroData = lastMonth.gastosDetalle[rubroConfig.id] || { total: 0, items: [] };
            const collapseId = `collapse${rubroConfig.id}`;
            const headingId = `heading${rubroConfig.id}`;

            let itemsHtml = '<p><em>No hay gastos detallados para este rubro en el último mes.</em></p>';
            if (rubroData.items && rubroData.items.length > 0) {
                itemsHtml = '<ul class="list-group list-group-flush">';
                rubroData.items.forEach(item => {
                    itemsHtml += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            ${item.desc || 'Item sin descripción'}
                            <span class="badge bg-secondary rounded-pill">${formatCurrency(item.val || 0)}</span>
                        </li>
                    `;
                });
                itemsHtml += '</ul>';
            }

            const accordionItem = `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="${headingId}">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                            ${rubroConfig.nombre} (${formatCurrency(rubroData.total)})
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
    };

    const renderGestionFinanciera = () => {
        const data = appState.gestionFinanciera;
        elements.gestionInversionesSaldo.textContent = `Saldo: ${formatCurrency(data.inversiones.saldo)}`;
        elements.gestionInversionesVenc.textContent = `Vencimiento Próximo: ${data.inversiones.vencimiento}`;
        elements.gestionCuentaSaldo.textContent = `Saldo Disponible: ${formatCurrency(data.cuentaCorriente.saldo)}`;
        elements.gestionCuentaMov.textContent = `Último Movimiento: ${data.cuentaCorriente.ultimoMov}`;
        elements.gestionReservasSaldo.textContent = `Saldo Actual: ${formatCurrency(data.reservas.saldo)}`;
        elements.gestionReservasObj.textContent = `Objetivo: ${formatCurrency(data.reservas.objetivo)}`;
        // La alerta predictiva es estática por ahora
        elements.alertaPredictiva.style.display = 'block'; // O 'none' si no hay alerta
    };

    const populateReportDropdowns = () => {
         const year = appState.currentYear;
         const yearData = appState.datosAnuales[year] || [];
         elements.selectMesReporteVecino.innerHTML = '';
         elements.selectMesReporteInterno.innerHTML = '';

        if (yearData.length === 0) {
             elements.selectMesReporteVecino.innerHTML = '<option disabled>No hay datos</option>';
             elements.selectMesReporteInterno.innerHTML = '<option disabled>No hay datos</option>';
            return;
        }

         // Opción para reporte anual interno
         elements.selectMesReporteInterno.innerHTML += `<option value="anual">Año ${year} Completo</option>`;

         // Opciones mensuales (del más reciente al más antiguo)
         [...yearData].reverse().forEach(mes => {
             const optionText = `${mes.mesNombre} ${year}`;
             const optionValue = `${year}-${String(mes.mesIndex + 1).padStart(2, '0')}`; // Formato YYYY-MM
             elements.selectMesReporteVecino.innerHTML += `<option value="${optionValue}">${optionText}</option>`;
             elements.selectMesReporteInterno.innerHTML += `<option value="${optionValue}">${optionText}</option>`;
         });
    };

    // --- 7. LÓGICA DE GRÁFICOS ---
    const initCharts = () => {
        // Destruir gráficos anteriores si existen
        Object.values(charts).forEach(chart => chart?.destroy());

        const year = appState.currentYear;
        const yearData = appState.datosAnuales[year] || [];
        const labels = yearData.map(m => m.mesNombre);
        const ingresosData = yearData.map(m => m.ingresos);
        const gastosData = yearData.map(m => m.gastosReales);

        // Gráfico Ingresos vs Gastos Mensual
        if (elements.ingresosGastosChartCanvas) {
            const ctx1 = elements.ingresosGastosChartCanvas.getContext('2d');
            charts.ingresosGastosMensual = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Ingresos',
                            data: ingresosData,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: false,
                            tension: 0.1
                        },
                        {
                            label: 'Gastos',
                            data: gastosData,
                            borderColor: 'rgba(255, 99, 132, 1)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            fill: false,
                            tension: 0.1
                        }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // Gráfico Distribución de Gastos (Último Mes)
        const lastMonth = getLastAvailableMonth(year);
        if (elements.distribucionGastosChartCanvas && lastMonth) {
            const ctx2 = elements.distribucionGastosChartCanvas.getContext('2d');
            const gastoLabels = appState.config.rubros.map(r => r.nombre);
            const gastoData = appState.config.rubros.map(r => lastMonth.gastosDetalle[r.id]?.total || 0);
            // Colores (puedes generar más si tienes muchos rubros)
             const backgroundColors = [
                '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
                '#858796', '#5a5c69', '#f8f9fc', '#5e72e4', '#fd7e14'
             ];

            charts.distribucionGastos = new Chart(ctx2, {
                type: 'pie', // o 'doughnut'
                data: {
                    labels: gastoLabels,
                    datasets: [{
                        label: 'Distribución de Gastos',
                        data: gastoData,
                        backgroundColor: backgroundColors.slice(0, gastoLabels.length),
                        hoverOffset: 4
                    }]
                },
                 options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }} }
            });
        }

        // Gráfico de Proyección (Inicialmente vacío o con datos base)
        if (elements.proyeccionAnualChartCanvas) {
            const ctx3 = elements.proyeccionAnualChartCanvas.getContext('2d');
             // Datos iniciales (quizás solo saldos acumulados reales)
            const saldoAcumuladoReal = yearData.map(m => m.saldoAcumulado);
            charts.proyeccionAnual = new Chart(ctx3, {
                type: 'line',
                data: {
                    labels: labels, // Inicialmente solo meses con datos reales
                    datasets: [
                         {
                            label: 'Saldo Acumulado Real',
                            data: saldoAcumuladoReal,
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            fill: false,
                            tension: 0.1
                        },
                        // Se añadirá el dataset de proyección dinámicamente
                    ]
                },
                 options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: false } } }
            });
        }
    };

     const updateProyeccionChart = (labels, realData, projectedData) => {
        if (!charts.proyeccionAnual) return;

        charts.proyeccionAnual.data.labels = labels;
        charts.proyeccionAnual.data.datasets = [
             {
                label: 'Saldo Acumulado Real',
                data: realData,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: false,
                tension: 0.1,
                pointRadius: 4, // Diferenciar puntos reales
             },
             {
                label: 'Saldo Acumulado Proyectado',
                data: projectedData,
                borderColor: 'rgba(255, 159, 64, 1)', // Naranja para proyección
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                borderDash: [5, 5], // Línea punteada
                fill: false,
                tension: 0.1,
                pointRadius: 3, // Puntos más pequeños
             }
        ];
        charts.proyeccionAnual.update();
    };


    // --- 8. LÓGICA DE PROYECCIONES ---
    const calcularProyeccion = () => {
        const year = appState.currentYear;
        const dataReal = appState.datosAnuales[year] ? [...appState.datosAnuales[year]] : []; // Copia para no modificar original
        const lastRealMonthIndex = dataReal.length > 0 ? dataReal[dataReal.length - 1].mesIndex : -1;
        const lastRealMonthData = dataReal.length > 0 ? dataReal[dataReal.length - 1] : null;
        let ultimoSaldoAcumulado = lastRealMonthData ? lastRealMonthData.saldoAcumulado : 0;

        // Obtener parámetros del formulario
        const ipcMensual = parseFloat(elements.paramIPC.value) / 100 || 0;
        const aumVigilancia = parseFloat(elements.paramAumVig.value) / 100 || 0;
        const aumMantenimiento = parseFloat(elements.paramAumMant.value) / 100 || 0;
        const escenarioOpt = elements.paramOptimizacion.value;

        const mesesProyectados = [];
        const todosLosMeses = appState.config.meses;

        for (let i = lastRealMonthIndex + 1; i < 12; i++) {
            const mesNombre = todosLosMeses[i];
            let ingresosEstimados = lastRealMonthData?.ingresos || 500000; // Usar último real o un default
            let gastosEstimadosDetalle = {};

            // Base de gastos: Usar el último mes real como referencia
            const baseGastos = lastRealMonthData?.gastosDetalle || {};

            // Aplicar estimaciones y ajustes
            appState.config.rubros.forEach(rubroConfig => {
                let gastoBaseRubro = baseGastos[rubroConfig.id]?.total || 0;
                let gastoProyectado = gastoBaseRubro;

                // 1. Aplicar IPC (a todos excepto quizás remuneraciones fijas)
                if (rubroConfig.id !== 'remuneraciones') { // Ejemplo: No aplicar IPC a sueldos base
                     gastoProyectado *= (1 + ipcMensual);
                }

                // 2. Aplicar Aumentos Salariales Específicos
                 if (rubroConfig.id === 'seguridad') { // Asumimos que vigilancia está en seguridad
                     gastoProyectado *= (1 + aumVigilancia);
                 }
                 if (rubroConfig.id === 'mantenimiento' || rubroConfig.id === 'remuneraciones') { // Incluir mantenimiento y sueldos
                      gastoProyectado *= (1 + aumMantenimiento);
                 }

                 // 3. Aplicar Escenarios de Optimización (Ejemplos)
                 if (escenarioOpt === 'opt1' && rubroConfig.id === 'mantenimiento') {
                     gastoProyectado *= 0.95; // Reducción 5%
                 }
                 if (escenarioOpt === 'opt2' && rubroConfig.id === 'seguridad') {
                     gastoProyectado -= 10000; // Reducción fija (ejemplo)
                 }

                gastosEstimadosDetalle[rubroConfig.id] = { total: gastoProyectado, items: [] }; // No detallamos items en proyección simple
            });

            const gastosRealesProyectados = Object.values(gastosEstimadosDetalle).reduce((sum, rubro) => sum + rubro.total, 0);
            const saldoMesProyectado = ingresosEstimados - gastosRealesProyectados;
            ultimoSaldoAcumulado += saldoMesProyectado;

            mesesProyectados.push({
                mesIndex: i,
                mesNombre: mesNombre,
                ingresos: ingresosEstimados,
                gastosDetalle: gastosEstimadosDetalle, // Guardamos detalle proyectado
                gastosReales: gastosRealesProyectados,
                saldoMes: saldoMesProyectado,
                saldoAcumulado: ultimoSaldoAcumulado
            });
        }

        // Combinar datos reales y proyectados para el gráfico
        const combinedData = [...dataReal, ...mesesProyectados];
        const projectionLabels = combinedData.map(m => m.mesNombre);
        const realSaldos = dataReal.map(m => m.saldoAcumulado);
        // Para la línea proyectada, necesitamos rellenar con null los meses reales
        const projectedSaldos = [
            ...Array(dataReal.length).fill(null), // Nulls para meses reales
            ...mesesProyectados.map(m => m.saldoAcumulado) // Saldos proyectados
        ];
        // Aseguramos que el último punto real conecte con el primero proyectado si existe
        if (realSaldos.length > 0 && projectedSaldos.length > realSaldos.length) {
            projectedSaldos[realSaldos.length -1] = realSaldos[realSaldos.length-1];
        }


        // Actualizar UI
        const cierreProyectado = ultimoSaldoAcumulado;
        elements.proyCierreEscenario.textContent = formatCurrency(cierreProyectado);

        // Calcular impacto vs. cierre base (proyección sin ajustes o con datos reales si ya terminó)
        const cierreReal = dataReal.length === 12 ? dataReal[11].saldoAcumulado : null; // Si ya terminó el año
        const impacto = cierreReal ? cierreProyectado - cierreReal : null; // O comparar vs proy. base
        if (impacto !== null) {
            elements.proyImpacto.textContent = `${formatCurrency(impacto)} (${formatPercentage(impacto/cierreReal*100)})`;
            elements.proyImpacto.className = impacto >= 0 ? 'text-success' : 'text-danger';
        } else {
             elements.proyImpacto.textContent = '(Comparación no disponible)';
             elements.proyImpacto.className = 'text-muted';
        }


        // Actualizar KPI de Proyección Cierre
        elements.kpiProyeccionCierre.textContent = formatCurrency(cierreProyectado);

        // Actualizar gráfico de proyección
        updateProyeccionChart(projectionLabels, realSaldos, projectedSaldos);

        // Guardar la proyección para posible uso en reportes
        appState.proyeccionCache = combinedData;
    };

    // --- 9. LÓGICA DE IMPORTACIÓN (SIMULADA) ---
    const handleImportData = () => {
        const mesAnio = elements.importMes.value; // Formato YYYY-MM
        const fileInput = elements.importFile;
        // const saldoAnteriorManual = elements.importSaldoAnterior.value; // Podría usarse

        if (!mesAnio || fileInput.files.length === 0) {
            alert('Por favor, selecciona el mes/año y un archivo.');
            return;
        }

        const [yearStr, monthStr] = mesAnio.split('-');
        const year = parseInt(yearStr);
        const monthIndex = parseInt(monthStr) - 1;

        console.log(`Simulando importación para ${appState.config.meses[monthIndex]} ${year}...`);
        // ** AQUÍ IRÍA LA LÓGICA REAL DE UPLOAD AL BACKEND Y PROCESAMIENTO **
        // fetch('/api/import', { method: 'POST', body: new FormData(elements.formImport) })
        // .then(response => response.json())
        // .then(processedData => { ... })

        // --- Inicio Simulación ---
        // Vamos a añadir/reemplazar datos de ejemplo para el mes seleccionado
        const nuevoMesData = {
            mesIndex: monthIndex,
            mesNombre: appState.config.meses[monthIndex],
            // Generar datos aleatorios o usar un preset
            ingresos: 500000 + Math.random() * 100000,
            gastosDetalle: {}, // Llenar con gastos simulados por rubro
            saldoMes: 0,
            saldoAcumulado: 0, // Se recalculará
            gastosReales: 0,
        };

        // Simular gastos por rubro
        let totalGastosSimulado = 0;
        appState.config.rubros.forEach(rubro => {
            const gastoRubro = Math.random() * 50000 + (rubro.id === 'remuneraciones' || rubro.id === 'seguridad' ? 80000 : 5000); // Más altos para algunos
            nuevoMesData.gastosDetalle[rubro.id] = { total: gastoRubro, items: [{desc: 'Gasto Simulado', val: gastoRubro }] };
            totalGastosSimulado += gastoRubro;
        });
         nuevoMesData.gastosReales = totalGastosSimulado;
         nuevoMesData.saldoMes = nuevoMesData.ingresos - totalGastosSimulado;

        // Añadir o reemplazar en el estado
        if (!appState.datosAnuales[year]) {
            appState.datosAnuales[year] = [];
        }
        const existingIndex = appState.datosAnuales[year].findIndex(m => m.mesIndex === monthIndex);
        if (existingIndex > -1) {
            appState.datosAnuales[year][existingIndex] = nuevoMesData; // Reemplaza
        } else {
            appState.datosAnuales[year].push(nuevoMesData); // Añade
             // Ordenar por mes si se añaden desordenados
             appState.datosAnuales[year].sort((a, b) => a.mesIndex - b.mesIndex);
        }

        // --- Fin Simulación ---

        // Recalcular todo y actualizar UI
        calculateYearData(year);
        renderDashboard(); // Función que renderiza todo
        populateReportDropdowns(); // Actualizar dropdowns

        elements.importModal.hide(); // Ocultar modal
        elements.formImport.reset(); // Limpiar formulario del modal

        // Mostrar feedback (usar un toast o alerta más elegante sería mejor)
        alert(`Datos para ${appState.config.meses[monthIndex]} ${year} importados/actualizados (simulación).`);
    };

    // --- 10. LÓGICA DE GENERACIÓN DE REPORTES (Client-Side) ---
    // ** Requiere incluir jsPDF y SheetJS (xlsx) **
    // <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    // <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"></script>
    // <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>

    const generarPdfVecinos = () => {
        if (typeof jsPDF === 'undefined') {
             alert('Error: Librería jsPDF no cargada.');
             return;
        }
        const { jsPDF } = window.jspdf; // Acceder a jsPDF global
        const selectedValue = elements.selectMesReporteVecino.value;
        if (!selectedValue) return;

        const [yearStr, monthStr] = selectedValue.split('-');
        const year = parseInt(yearStr);
        const monthIndex = parseInt(monthStr) - 1;
        const mesData = getMonthData(year, monthIndex);

        if (!mesData) {
             alert('No hay datos para el mes seleccionado.');
             return;
        }

        const doc = new jsPDF();
        const fechaReporte = new Date().toLocaleDateString('es-AR');
        const periodo = `${mesData.mesNombre} ${year}`;

        // Encabezado
        doc.setFontSize(18);
        doc.text("Barrio Privado El Centauro - Resumen Mensual", 14, 20);
        doc.setFontSize(12);
        doc.text(`Periodo: ${periodo}`, 14, 30);
        doc.text(`Fecha de Emisión: ${fechaReporte}`, 14, 36);

        // Resumen Financiero
        doc.setFontSize(14);
        doc.text("Resumen Financiero", 14, 50);
        doc.setFontSize(10);
        const resumenData = [
            ["Saldo Inicial del Mes:", formatCurrency(mesData.saldoAcumulado - mesData.saldoMes)], // Calculado
            ["Ingresos del Mes:", formatCurrency(mesData.ingresos)],
            ["Gastos Totales del Mes:", formatCurrency(mesData.gastosReales)],
            ["Saldo Final del Mes:", formatCurrency(mesData.saldoAcumulado)]
        ];
        // Usar autoTable para el resumen
        doc.autoTable({
            startY: 55,
            head: [['Concepto', 'Monto']],
            body: resumenData,
            theme: 'grid',
            headStyles: { fillColor: [52, 86, 139] }, // Azul primario
            styles: { fontSize: 10 },
        });

        // Desglose de Gastos por Rubro
        let finalY = doc.lastAutoTable.finalY || 80; // Obtener Y después de la tabla
        doc.setFontSize(14);
        doc.text("Desglose de Gastos por Rubro", 14, finalY + 10);
        const gastosBody = appState.config.rubros.map(rubroConfig => {
            const gasto = mesData.gastosDetalle[rubroConfig.id]?.total || 0;
            return [rubroConfig.nombre, formatCurrency(gasto)];
        }).filter(row => parseFloat(row[1].replace(/[^0-9,-]+/g,"").replace(',','.')) > 0); // Filtrar rubros con gasto 0

        doc.autoTable({
            startY: finalY + 15,
            head: [['Rubro', 'Monto Total']],
            body: gastosBody,
            theme: 'striped',
            headStyles: { fillColor: [90, 109, 124] }, // Gris secundario
            styles: { fontSize: 9 },
        });

        // Pie de página (opcional)
        // doc.setFontSize(8);
        // doc.text("Documento generado automáticamente.", 14, doc.internal.pageSize.height - 10);

        doc.save(`Resumen_ElCentauro_${periodo.replace(' ','_')}.pdf`);
    };

    const exportarExcel = () => {
        if (typeof XLSX === 'undefined') {
             alert('Error: Librería SheetJS (xlsx) no cargada.');
             return;
        }
        const selectedValue = elements.selectMesReporteInterno.value;
        if (!selectedValue) return;

        let dataToExport = [];
        let sheetName = '';
        let fileName = '';
        const year = appState.currentYear; // Podría ser seleccionable

        if (selectedValue === 'anual') {
            sheetName = `Resumen Anual ${year}`;
            fileName = `Reporte_Financiero_Anual_${year}.xlsx`;
            const yearData = appState.datosAnuales[year] || [];
            if (yearData.length === 0) {
                 alert('No hay datos para exportar para el año completo.');
                 return;
            }
            // Formato para tabla anual
             dataToExport.push([
                "Mes", "Ingresos", "Gastos Totales", "Saldo Mensual", "Saldo Acumulado",
                // Añadir columnas para cada rubro
                ...appState.config.rubros.map(r => `Gasto ${r.nombre}`)
            ]);
             yearData.forEach(mes => {
                const row = [
                    mes.mesNombre,
                    mes.ingresos,
                    mes.gastosReales,
                    mes.saldoMes,
                    mes.saldoAcumulado,
                     ...appState.config.rubros.map(r => mes.gastosDetalle[r.id]?.total || 0)
                ];
                dataToExport.push(row);
             });
        } else {
            // Exportar detalle de un mes específico
            const [yearStr, monthStr] = selectedValue.split('-');
            const monthIndex = parseInt(monthStr) - 1;
            const mesData = getMonthData(parseInt(yearStr), monthIndex);

            if (!mesData) {
                 alert('No hay datos para el mes seleccionado.');
                 return;
            }
            const periodo = `${mesData.mesNombre}_${yearStr}`;
            sheetName = `Detalle ${periodo}`;
            fileName = `Reporte_Detallado_${periodo}.xlsx`;

            // Hoja 1: Resumen Mensual
            dataToExport.push(['Concepto', 'Monto']);
            dataToExport.push(["Saldo Inicial", mesData.saldoAcumulado - mesData.saldoMes]);
            dataToExport.push(["Ingresos", mesData.ingresos]);
            dataToExport.push(["Gastos Totales", mesData.gastosReales]);
            dataToExport.push(["Saldo Final", mesData.saldoAcumulado]);
            dataToExport.push([]); // Fila vacía como separador
            dataToExport.push(['Rubro', 'Gasto Total']);
             appState.config.rubros.forEach(rubroConfig => {
                const gasto = mesData.gastosDetalle[rubroConfig.id]?.total || 0;
                if(gasto > 0) dataToExport.push([rubroConfig.nombre, gasto]);
            });

             // Podríamos crear una segunda hoja con el detalle ÍTEM por ÍTEM si estuviera disponible
             // let dataSheet2 = [['Rubro', 'Descripción Ítem', 'Valor']];
             // ... Llenar dataSheet2 ...
        }

        // Crear y descargar el archivo Excel
        const ws = XLSX.utils.aoa_to_sheet(dataToExport);
        // Aplicar formato de número a columnas relevantes (ejemplo)
        // Esto requiere un manejo más cuidadoso de las celdas,
        // aquí solo se exportan los valores. Podría requerir iterar
        // sobre las celdas en 'ws' y asignarles un formato 'z'.
        // Ejemplo básico (puede no funcionar perfecto para todas las columnas):
         const range = XLSX.utils.decode_range(ws['!ref']);
         for (let R = range.s.r + 1; R <= range.e.r; ++R) { // Saltar encabezado
             for (let C = range.s.c + 1; C <= range.e.c; ++C) { // Empezar desde segunda columna (montos)
                 const cell_address = { c: C, r: R };
                 const cell_ref = XLSX.utils.encode_cell(cell_address);
                 if (ws[cell_ref] && typeof ws[cell_ref].v === 'number') {
                      ws[cell_ref].t = 'n'; // Tipo número
                      ws[cell_ref].z = '$ #,##0.00'; // Formato moneda ARS
                 }
             }
         }


        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // Ajustar ancho de columnas (opcional, básico)
         const colWidths = dataToExport[0].map((_, i) => ({
             wch: dataToExport.reduce((max, row) => Math.max(max, String(row[i] || '').length), 10) + 2 // Ancho basado en contenido + margen
         }));
         ws['!cols'] = colWidths;

        XLSX.writeFile(wb, fileName);
    };

     const generarPdfDetallado = () => {
         // Similar a generarPdfVecinos pero con mucho más detalle
         // Podría incluir tablas por cada rubro con sus items, etc.
         // La implementación dependerá del nivel de detalle requerido.
          if (typeof jsPDF === 'undefined') {
             alert('Error: Librería jsPDF no cargada.');
             return;
         }
         alert('Funcionalidad "Exportar PDF Detallado" pendiente de implementación detallada.');
         // Aquí iría una lógica parecida a generarPdfVecinos pero más extensa,
         // posiblemente iterando sobre mesData.gastosDetalle[rubro].items y creando
         // múltiples tablas con jspdf-autotable.
     };


    // --- 11. INICIALIZACIÓN Y MANEJADORES DE EVENTOS ---
    const renderDashboard = () => {
        renderDashboardKPIs();
        renderMonthlyTable();
        initCharts(); // Reinicializar gráficos con datos actualizados
        renderRubrosAccordion();
        renderGestionFinanciera();
        // Calcular proyección base inicial (opcional)
        // calcularProyeccion();
    };

    const setupEventListeners = () => {
        elements.btnConfirmImport.addEventListener('click', handleImportData);
        elements.btnCalcularProyeccion.addEventListener('click', calcularProyeccion);
        elements.btnGenerarReporteVecinoPdf.addEventListener('click', generarPdfVecinos);
        elements.btnExportarExcel.addEventListener('click', exportarExcel);
        elements.btnExportarPdfDetallado.addEventListener('click', generarPdfDetallado);

        // Event listener para botones de detalle en tabla (si se necesita acción específica)
         elements.tablaMensualBody.addEventListener('click', (event) => {
             if (event.target.closest('button[data-month-index]')) {
                 const button = event.target.closest('button[data-month-index]');
                 const monthIndex = parseInt(button.dataset.monthIndex);
                 const year = appState.currentYear;
                 const mesData = getMonthData(year, monthIndex);
                 if (mesData) {
                      // Acción al hacer clic en detalle: por ejemplo, mostrar detalle en el acordeón
                      // O abrir un modal con el detalle completo de ese mes.
                      // Por ahora, solo logueamos
                      console.log(`Detalle solicitado para ${mesData.mesNombre} ${year}:`, mesData.gastosDetalle);
                      // Podríamos forzar la apertura del acordeón correspondiente (requiere más lógica)
                      // O actualizar el gráfico de torta para ESE mes
                      updateDistribucionGastosChart(mesData);
                 }
             }
         });
    };

     // Función para actualizar el gráfico de torta dinámicamente
     const updateDistribucionGastosChart = (mesData) => {
         if (charts.distribucionGastos && mesData) {
             const gastoLabels = appState.config.rubros.map(r => r.nombre);
             const gastoData = appState.config.rubros.map(r => mesData.gastosDetalle[r.id]?.total || 0);
             charts.distribucionGastos.data.labels = gastoLabels;
             charts.distribucionGastos.data.datasets[0].data = gastoData;
             charts.distribucionGastos.options.plugins.title = { // Añadir título dinámico
                 display: true,
                 text: `Distribución de Gastos - ${mesData.mesNombre} ${appState.currentYear}`
             };
             charts.distribucionGastos.update();
         }
     }


    // --- 12. FUNCIÓN DE INICIALIZACIÓN PRINCIPAL ---
    const init = () => {
        console.log('Inicializando aplicación El Centauro Finanzas...');
        // Calcular datos iniciales (saldos, etc.)
        calculateYearData(appState.currentYear);
        // Renderizar todos los componentes iniciales
        renderDashboard();
        populateReportDropdowns();
        // Configurar listeners
        setupEventListeners();
        console.log('Aplicación lista.');
    };

    // --- Ejecutar inicialización cuando el DOM esté listo ---
    document.addEventListener('DOMContentLoaded', init);

})(); // Fin del IIFE