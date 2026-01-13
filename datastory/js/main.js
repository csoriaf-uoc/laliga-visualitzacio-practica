// ============================================
// ESTAT GLOBAL
// ============================================
const VIZ_CONSTANTS = {
    WIDTH: 1500,
    HEIGHT: 700,
    MARGIN: { top: 60, right: 180, bottom: 80, left: 80 },
    TRANSITION_DURATION: 800
};

const AppState = {
    selectedSeason: '2024-25',
    selectedTeam: null,
    hoveredTeam: null,
    activeSection: 0,
    data: {
        teams: [],
        allSeasons: []
    },
    yPositions: null
};

// Referència al tooltip HTML
const tooltip = d3.select('#tooltip');

// ============================================
// CÀRREGA DE DADES
// ============================================

// SECCIÓ 1
async function loadSection1Data() {
    const data = await d3.csv('data/section1_overview.csv');

    data.forEach(d => {
        d.xGPerGame = +d.xGPerGame;
        d.xGAPerGame = +d.xGAPerGame;
        d.goals = +d.goals;
        // La mètrica clau per a l'eix X
        d.performance = d.xGPerGame - d.xGAPerGame;
    });

    AppState.data.allSeasons = data;
    AppState.data.teams = [...new Set(data.map(d => d.team))].sort();
}

// SECCIÓ 2
async function loadSection2Data() {
    const data = await d3.csv('data/section2_efficiency.csv');

    data.forEach(d => {
        d.xG = +d.xG;
        d.goals = +d.goals;
        d.efficiency = d.goals - d.xG;
    });

    AppState.data.section2 = data;
}

// SECCIÓ 3
async function loadSection3Data() {
    const data = await d3.csv('data/section3_evolution.csv');

    data.forEach(d => {
        d.matchday = +d.matchday;
        d.points_cum = +d.points_cum;
        d.goal_diff_cum = +d.goal_diff_cum;
        d.xg_diff_cum = +d.xg_diff_cum;
    });

    AppState.data.section3 = data;
}

// SECCIÓ 4
async function loadSection4Data() {
    const data = await d3.csv('data/section4_style.csv');

    // Es converteixen totes les mètriques a número
    data.forEach(d => {
        Object.keys(d).forEach(k => {
            if (k !== 'season' && k !== 'team') {
                d[k] = +d[k];
            }
        });
    });

    AppState.data.section4 = data;
}

// SECCIÓ 5
async function loadSection5Data() {
    const data = await d3.csv('data/section5_summary.csv');

    data.forEach(d => {
        d.performance_xg = +d.performance_xg;
        d.efficiency = +d.efficiency;
    });

    AppState.data.section5 = data;
}



// ============================================
// SELECTORS
// ============================================
function initializeSelectors() {
    const seasonSelect = document.getElementById('season-select');
    const teamSelect = document.getElementById('team-select');

    AppState.data.teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamSelect.appendChild(option);
    });

    seasonSelect.addEventListener('change', e => {
        AppState.selectedSeason = e.target.value;

        // Renderitzar la secció activa
        if (AppState.activeSection === 1) {
            renderSection1(true);
        }
        if (AppState.activeSection === 2) {
            renderSection2(true);
        }
        if (AppState.activeSection === 3) {
            renderSection3(true);
        }
        renderSection5();
    });

    teamSelect.addEventListener('change', e => {
        AppState.selectedTeam = e.target.value || null;
        if (AppState.activeSection === 4) {
            renderSection4();
        }
        updateTeamHighlight();
        renderSection5();
    });
}

// ============================================
// SCROLL CONTROLLER
// ============================================
function initializeScrollController() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const newSection = +entry.target.dataset.section;
                if (AppState.activeSection !== newSection) {
                    AppState.activeSection = newSection;

                    if (AppState.activeSection === 1) {
                        renderSection1(false);
                    }
                    if (AppState.activeSection === 2) {
                        renderSection2(false);
                    }
                    if (AppState.activeSection === 3) {
                        renderSection3(false);
                    }
                    if (AppState.activeSection === 4) {
                        renderSection4();
                    }
                }
            }
        });
    }, { threshold: 0.05 });

    document.querySelectorAll('.section').forEach(s => observer.observe(s));
}


// ============================================
// SCROLL TO TOP
// ============================================

function initializeScrollToTop() {
    const scrollBtn = document.getElementById('scrollToTop');

    if (!scrollBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });

    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}


// ============================================
// RADARS CONFIG - SECCIÓ 4
// ============================================

const RADAR_CONFIG = {
    offensive: {
        svgId: '#radar-offensive',
        color: '#FF6B35',
        variables: [
            'possession_pct_norm',
            'xg_per90_norm',
            'shots_per90_norm',
            'touches_att_pen_area_per90_norm',
            'progressive_passes_per90_norm'
        ],
        labels: [
            'Possessió',
            'xG',
            'Tirs',
            'Tocs àrea rival',
            'Passades progressives'
        ]
    },

    defensive: {
        svgId: '#radar-defensive',
        color: '#1A73E8',
        variables: [
            'tackles_interceptions_per90_norm',
            'tackles_won_per90_norm',
            'blocks_per90_norm',
            'interceptions_per90_norm',
            'def_actions_att_third_per90_norm'
        ],
        labels: [
            'Tkl + Int',
            'Tkl guanyats',
            'Bloquejos',
            'Intercepcions',
            'Pressió alta'
        ]
    },

    progression: {
        svgId: '#radar-progression',
        color: '#2E7D32',
        variables: [
            'progressive_carries_per90_norm',
            'long_pass_pct_norm',
            'crosses_into_pen_area_per90_norm',
            'touches_per_possession_norm'
        ],
        labels: [
            'Conduccions',
            'Passada llarga',
            'Centres',
            'Ritme de joc'
        ]
    }
};



// ============================================
// TOOLTIP - SECCIÓ 1
// ============================================

function showTooltip(event, d) {
    const perf = d.performance.toFixed(2);
    const color = perf >= 0 ? '#FF6B35' : '#1A73E8'; // Colors del CSS

    tooltip.html(`
        <strong style="color: ${color};">${d.team} (${d.season})</strong>
        <hr style="border-color: ${color}; margin: 5px 0;">
        <p><strong>xG Favor:</strong> ${d.xGPerGame.toFixed(2)}</p>
        <p><strong>xG Contra:</strong> ${d.xGAPerGame.toFixed(2)}</p>
        <p><strong>Rendiment:</strong> <span style="color: ${color}; font-weight: bold;">${perf}</span></p>
    `)
    .style('left', (event.pageX + 15) + 'px')
    .style('top', (event.pageY - 28) + 'px')
    .classed('visible', true);
}

function hideTooltip() {
    tooltip.classed('visible', false);
}


// ============================================
// TOOLTIP - SECCIÓ 2 (Eficiència)
// ============================================

function showTooltipSection2(event, d) {
    const color = '#FF6B35';

    tooltip.html(`
        <strong style="color:${color};">${d.team} (${d.season})</strong>
        <hr style="border-color:${color}; margin:5px 0;">
        <p><strong>xG:</strong> ${d.xG.toFixed(1)}</p>
        <p><strong>Gols:</strong> ${d.goals}</p>
        <p><strong>Eficiència:</strong>
            <span style="color:${color}; font-weight:bold;">
                ${d.efficiency > 0 ? '+' : ''}${d.efficiency.toFixed(1)}
            </span>
        </p>
    `)
    .style('left', (event.pageX + 15) + 'px')
    .style('top', (event.pageY - 28) + 'px')
    .classed('visible', true);
}

function handleMouseOverSection2(event, d) {
    d3.select(this).attr('r', 12).attr('stroke-width', 3);
    showTooltipSection2(event, d);
}

function handleMouseMoveSection2(event, d) {
    showTooltipSection2(event, d);
}

function handleMouseLeaveSection2() {
    d3.select(this).attr('r', 10).attr('stroke-width', 1.5);
    hideTooltip();
}


// ============================================
// TOOLTIP - SECCIÓ 3
// ============================================

function showTooltipSection3(event, d) {
    const xgDiff = d.xg_diff_cum.toFixed(1);
    const color = '#FF6B35';

    tooltip.html(`
        <strong style="color: ${color};">${d.team}</strong>
        <hr style="border-color: ${color}; margin: 5px 0;">
        <p><strong>Jornada:</strong> ${d.matchday}</p>
        <p><strong>Punts:</strong> ${d.points_cum}</p>
        <p><strong>Gol Diff:</strong> ${d.goal_diff_cum > 0 ? '+' : ''}${d.goal_diff_cum}</p>
        <p><strong>xG Diff:</strong> <span style="color: ${color};">${xgDiff > 0 ? '+' : ''}${xgDiff}</span></p>
    `)
    .style('left', (event.pageX + 15) + 'px')
    .style('top', (event.pageY - 28) + 'px')
    .classed('visible', true);
}



// ============================================
// HANDLERS SECCIONS 1 I 2
// ============================================
function handleMouseOver(event, d) {
    d3.select(this).attr('r', 12).attr('stroke-width', 4);
    showTooltip(event, d);
}

function handleMouseMove(event, d) {
    showTooltip(event, d);
}

function handleMouseLeave(d) {
    if (d.team !== AppState.selectedTeam) {
        d3.select(this).attr('r', 10).attr('stroke-width', 1.5);
    }
    hideTooltip();
}

function handleClick(event, d) {
    AppState.selectedTeam = (AppState.selectedTeam === d.team) ? null : d.team;
    document.getElementById('team-select').value = AppState.selectedTeam || "";
    updateTeamHighlight();
    renderSection5();
}


// ============================================
// HANDLERS SECCIÓ 3
// ============================================
function handleMouseOverSection3(event, d) {
    d3.select(this).attr('r', 6).attr('stroke', '#FF6B35').attr('stroke-width', 2);
    showTooltipSection3(event, d);
}

function handleMouseMoveSection3(event, d) {
    showTooltipSection3(event, d);
}



// ============================================
// VISUALITZACIÓ SECCIÓ 1
// ============================================

function renderSection1(useTransition) {
    const { WIDTH, HEIGHT, MARGIN, TRANSITION_DURATION } = VIZ_CONSTANTS;
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    // Filtrem la data
    const seasonData = AppState.data.allSeasons.filter(
        d => d.season === AppState.selectedSeason
    );

    // Si no hi ha dades, sortim
    if (seasonData.length === 0) return;

    const svg = d3.select('#main-viz')
        .attr('width', WIDTH)
        .attr('height', HEIGHT);

    let g = svg.select('.main-group');
    if (g.empty()) {
        // Creació inicial del contenidor principal
        g = svg.append('g').attr('class', 'main-group')
            .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);
    }

    const t = useTransition ? svg.transition().duration(TRANSITION_DURATION) : svg;

    // --- ESCALES ---
    const performanceExtent = d3.extent(seasonData, d => d.performance);

    // Expandir el domini només si el 0 està fora
    let domainMin = performanceExtent[0];
    let domainMax = performanceExtent[1];

    // Si tots els valors són positius, incloure 0 a l'esquerra
    if (domainMin > 0) {
        domainMin = 0;
    }

    // Si tots els valors són negatius, incloure 0 a la dreta
    if (domainMax < 0) {
        domainMax = 0;
    }

    // Arrodonir els extrems respectant l'amplitud
    const xScale = d3.scaleLinear()
        .domain([domainMin, domainMax])
        .range([0, innerWidth])
        .nice();

    const colorScale = d3.scaleLinear()
        .domain([
            xScale.domain()[0],
            0,
            xScale.domain()[1]
        ])
        .range(['#0d47a1', '#64B5F6', '#FF6B35']);

    // --- POSICIONS Y (JITTER) ---
    if (!AppState.yPositions) {
        const yCenter = innerHeight / 2;
        AppState.yPositions = new Map(
            AppState.data.teams.map(team => [
                team,
                yCenter + (Math.random() - 0.5) * 220
            ])
        );
    }
    const yPositions = AppState.yPositions;

    // --- 1.a Eix X ---
    let xAxisGroup = g.select('.x-axis');
    if (xAxisGroup.empty()) {
        xAxisGroup = g.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${innerHeight})`);
    }

    if (useTransition) {
        xAxisGroup.transition().duration(TRANSITION_DURATION).call(d3.axisBottom(xScale));
    } else {
        xAxisGroup.call(d3.axisBottom(xScale));
    }

    // --- 1.b Label Eix X ---
    let xAxisLabel = g.select('.x-axis-label');

    if (xAxisLabel.empty()) {
        xAxisLabel = g.append('text')
            .attr('class', 'axis-label x-axis-label')
            .attr('text-anchor', 'middle');
    }

    // Posició (sempre actualitzada, però sense transició)
    xAxisLabel
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + MARGIN.bottom - 20)
        .text('Diferència xG (a favor − en contra)');


    // --- 2. Línia d'equilibri (xG = xGA) ---
    const zeroX = xScale(0);

    // Comprovar si el 0 està dins del rang visible
    const isZeroVisible = zeroX >= 0 && zeroX <= innerWidth;

    let balanceLine = g.select('.balance-line');
    if (balanceLine.empty()) {
        balanceLine = g.append('line').attr('class', 'balance-line')
             .attr('y1', 0)
             .attr('y2', innerHeight)
             .attr('stroke', 'rgba(255,255,255,0.4)')
             .attr('stroke-width', 2)
             .attr('stroke-dasharray', '5,5');
    }

    if (isZeroVisible) {
        balanceLine
            .style('display', 'block')
            .attr('x1', zeroX)
            .attr('x2', zeroX);

        if (useTransition) {
            balanceLine.transition().duration(TRANSITION_DURATION)
                .attr('x1', zeroX)
                .attr('x2', zeroX);
        }
    } else {
        // Ocultar la línia si el 0 està fora del rang
        balanceLine.style('display', 'none');
    }

    // --- 3. Etiqueta de la línia ---
    let balanceLabel = g.select('.balance-label');
    if (balanceLabel.empty()) {
        balanceLabel = g.append('text')
            .attr('class', 'axis-label balance-label')
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .text('Equilibri (xG = xGA)');
    }

    if (isZeroVisible) {
        balanceLabel
            .style('display', 'block')
            .attr('x', zeroX);

        if (useTransition) {
            balanceLabel.transition().duration(TRANSITION_DURATION)
                .attr('x', zeroX);
        }
    } else {
        balanceLabel.style('display', 'none');
    }


    // --- 4. Punts (Scatter Plot) ---
    const points = g.selectAll('.team-point')
        .data(seasonData, d => d.team)
        .join(
            enter => enter.append('circle')
                .attr('class', 'team-point')
                .attr('r', 10)
                .attr('cx', xScale(0))
                .attr('cy', d => yPositions.get(d.team))
                .attr('fill', d => colorScale(d.performance))
                .call(enter => enter.transition(t)
                    .attr('cx', d => xScale(d.performance))
                ),

            update => update.transition(t)
                .attr('cx', d => xScale(d.performance))
                .attr('fill', d => colorScale(d.performance)),

            exit => exit.transition(t)
                .attr('r', 0)
                .remove()
        )
        .on('mouseover', handleMouseOver)
        .on('mousemove', handleMouseMove)
        .on('mouseleave', handleMouseLeave)
        .on('click', handleClick);


    // --- 5. Labels (Text dels equips) ---
    g.selectAll('.team-label')
        .data(seasonData, d => d.team)
        .join(
            enter => enter.append('text')
                .attr('class', 'team-label')
                .attr('text-anchor', 'middle')
                .text(d => d.team)
                .attr('x', d => xScale(d.performance))
                .attr('y', d => yPositions.get(d.team) - 20),

            update => update.transition(t)
                .attr('x', d => xScale(d.performance)),

            exit => exit.remove()
        )
        .attr('opacity', 0);


    // --- 6. Llegenda de Color (Performance) ---

    const legendWidth = 20;
    const legendHeight = innerHeight * 0.7;
    const legendX = innerWidth + 40;
    const legendY = (innerHeight - legendHeight) / 2;

    // Contenidor de la llegenda
    let legend = g.select('.legend-group');
    if (legend.empty()) {
        legend = g.append('g').attr('class', 'legend-group');
    }

    // Títol
    let legendTitle = legend.select('.legend-title');
    if (legendTitle.empty()) {
        legendTitle = legend.append('text')
            .attr('class', 'legend-title')
            .attr('x', legendX)
            .attr('y', legendY - 15)
            .text('Rendiment');
    }

    // Creació del gradient (només una vegada)
    if (svg.select('#colorGradient').empty()) {
        const linearGradient = svg.append("defs")
            .append("linearGradient")
            .attr("id", "colorGradient")
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "0%")
            .attr("y2", "0%");

        // Stop 1: Mínim (Negatiu, Blau)
        linearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", colorScale.range()[0]);

        // Stop 2: Zero (Neutre, Blau Clar)
        linearGradient.append("stop")
            .attr("offset", d => {
                // Calculem on es troba el 0 respecte al domini (per a una escala lineal)
                const min = colorScale.domain()[0];
                const max = colorScale.domain()[2];
                return `${(0 - min) / (max - min) * 100}%`;
            })
            .attr("stop-color", colorScale.range()[1]);

        // Stop 3: Màxim (Positiu, Taronja)
        linearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", colorScale.range()[2]);
    }


    // Rectangle de color
    let legendRect = legend.select('.legend-rect');
    if (legendRect.empty()) {
        legendRect = legend.append('rect').attr('class', 'legend-rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .attr('fill', 'url(#colorGradient)');
    }
    legendRect
        .attr('x', legendX)
        .attr('y', legendY);


    // Etiquetes de Valors (Màxim, 0, Mínim)

    // 1. Etiqueta Màxima
    let maxLabel = legend.select('.max-label');
    if (maxLabel.empty()) {
        maxLabel = legend.append('text').attr('class', 'legend-label max-label')
            .attr('x', legendX + legendWidth + 10)
            .attr('text-anchor', 'start');
    }
    maxLabel.transition(t)
        .attr('y', legendY)
        .text('+' + performanceExtent[1].toFixed(2)); // El màxim positiu

    // 2. Etiqueta Zero
    let zeroLabel = legend.select('.zero-label');
    if (zeroLabel.empty()) {
        zeroLabel = legend.append('text').attr('class', 'legend-label zero-label')
            .attr('x', legendX + legendWidth + 10)
            .attr('text-anchor', 'start');
    }
    // Calculem la posició Y on el zero es projecta a l'escala.
    const zeroYPosition = legendY + (legendHeight * (1 - (0 - performanceExtent[0]) / (performanceExtent[1] - performanceExtent[0])));

    zeroLabel.transition(t)
        .attr('y', zeroYPosition)
        .text('0.00');

    // 3. Etiqueta Mínima
    let minLabel = legend.select('.min-label');
    if (minLabel.empty()) {
        minLabel = legend.append('text').attr('class', 'legend-label min-label')
            .attr('x', legendX + legendWidth + 10)
            .attr('text-anchor', 'start');
    }
    minLabel.transition(t)
        .attr('y', legendY + legendHeight)
        .text(performanceExtent[0].toFixed(2)); // El mínim negatiu

    // Aplica l'estat de highlight actual (ja sigui per selector o per click)
    updateTeamHighlight();
}


// ============================================
// VISUALITZACIÓ — SECCIÓ 2 (EFICIÈNCIA)
// ============================================

function renderSection2(useTransition) {
    const { WIDTH, HEIGHT, MARGIN, TRANSITION_DURATION } = VIZ_CONSTANTS;
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const data = AppState.data.section2.filter(
        d => d.season === AppState.selectedSeason
    );

    if (data.length === 0) return;

    const svg = d3.select('#viz-section-2')
        .attr('width', WIDTH)
        .attr('height', HEIGHT);

    let g = svg.select('.main-group');
    if (g.empty()) {
        g = svg.append('g')
            .attr('class', 'main-group')
            .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);
    }

    const t = useTransition ? svg.transition().duration(TRANSITION_DURATION) : svg;

    // --- Escales ---
    const maxVal = d3.max(data, d => Math.max(d.xG, d.goals));

    const xScale = d3.scaleLinear()
        .domain([0, maxVal])
        .range([0, innerWidth])
        .nice();

    const yScale = d3.scaleLinear()
        .domain([0, maxVal])
        .range([innerHeight, 0])
        .nice();

    // --- Escala de color (Eficiència: goals - xG) ---
    const efficiencyExtent = d3.extent(data, d => d.efficiency);

    const colorScale = d3.scaleLinear()
        .domain([
            efficiencyExtent[0],
            0,
            efficiencyExtent[1]
        ])
        .range(['#0d47a1', '#64B5F6', '#FF6B35']);

    // --- Eixos ---
    let xAxis = g.select('.x-axis');
    if (xAxis.empty()) {
        xAxis = g.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${innerHeight})`);
    }
    xAxis.transition(t).call(d3.axisBottom(xScale));

    let yAxis = g.select('.y-axis');
    if (yAxis.empty()) {
        yAxis = g.append('g')
            .attr('class', 'axis y-axis');
    }
    yAxis.transition(t).call(d3.axisLeft(yScale));

    // Etiqueta eix X
    let xLabel = g.select('.x-axis-label');
    if (xLabel.empty()) {
        xLabel = g.append('text')
            .attr('class', 'axis-label x-axis-label')
            .attr('text-anchor', 'middle')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight + 50)
            .text('Expected Goals (xG)');
    }

    // Etiqueta eix Y
    let yLabel = g.select('.y-axis-label');
    if (yLabel.empty()) {
        yLabel = g.append('text')
            .attr('class', 'axis-label y-axis-label')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerHeight / 2)
            .attr('y', -55)
            .text('Gols Marcats');
    }


    // --- Línia diagonal y = x ---
    let diagonal = g.select('.diagonal-line');
    if (diagonal.empty()) {
        diagonal = g.append('line')
            .attr('class', 'diagonal-line')
            .attr('stroke', 'rgba(255,255,255,0.4)')
            .attr('stroke-dasharray', '5,5');
    }

    diagonal.transition(t)
        .attr('x1', xScale(0))
        .attr('y1', yScale(0))
        .attr('x2', xScale(maxVal))
        .attr('y2', yScale(maxVal));

    // --- Punts ---
    g.selectAll('.team-point')
        .data(data, d => d.team)
        .join(
            enter => enter.append('circle')
                .attr('class', 'team-point')
                .attr('r', 10)
                .attr('cx', d => xScale(d.xG))
                .attr('cy', d => yScale(d.xG))
                .attr('fill', d => colorScale(d.efficiency))
                .call(enter => enter.transition(t)
                    .attr('cy', d => yScale(d.goals))
                ),
            update => update.transition(t)
                .attr('cx', d => xScale(d.xG))
                .attr('cy', d => yScale(d.goals))
                .attr('fill', d => colorScale(d.efficiency)),
            exit => exit.remove()
        )
        .on('mouseover', handleMouseOverSection2)
        .on('mousemove', handleMouseMoveSection2)
        .on('mouseleave', handleMouseLeaveSection2)
        .on('click', handleClick);

    // --- Labels d'equip ---
    g.selectAll('.team-label')
        .data(data, d => d.team)
        .join(
            enter => enter.append('text')
                .attr('class', 'team-label')
                .attr('text-anchor', 'middle')
                .text(d => d.team)
                .attr('x', d => xScale(d.xG))
                .attr('y', d => yScale(d.goals) - 18),

            update => update.transition(t)
                .attr('x', d => xScale(d.xG))
                .attr('y', d => yScale(d.goals) - 18),

            exit => exit.remove()
        )
        .attr('opacity', 0);

    // --- 6. Llegenda de Color (Performance) ---

    const legendWidth = 20;
    const legendHeight = innerHeight * 0.7;
    const legendX = innerWidth + 40;
    const legendY = (innerHeight - legendHeight) / 2;

    // Contenidor de la llegenda
    let legend = g.select('.legend-group');
    if (legend.empty()) {
        legend = g.append('g').attr('class', 'legend-group');
    }

    // Títol
    let legendTitle = legend.select('.legend-title');
    if (legendTitle.empty()) {
        legendTitle = legend.append('text')
            .attr('class', 'legend-title')
            .attr('x', legendX)
            .attr('y', legendY - 15)
            .text('Eficiència');
    }

    // Creació del gradient (només una vegada)
    if (svg.select('#colorGradient').empty()) {
        const linearGradient = svg.append("defs")
            .append("linearGradient")
            .attr("id", "colorGradient")
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "0%")
            .attr("y2", "0%");

        // Stop 1: Mínim (Negatiu, Blau)
        linearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", colorScale.range()[0]);

        // Stop 2: Zero (Neutre, Blau Clar)
        linearGradient.append("stop")
            .attr("offset", d => {
                // Calculem on es troba el 0 respecte al domini (per a una escala lineal)
                const min = colorScale.domain()[0];
                const max = colorScale.domain()[2];
                return `${(0 - min) / (max - min) * 100}%`;
            })
            .attr("stop-color", colorScale.range()[1]);

        // Stop 3: Màxim (Positiu, Taronja)
        linearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", colorScale.range()[2]);
    }


    // Rectangle de color
    let legendRect = legend.select('.legend-rect');
    if (legendRect.empty()) {
        legendRect = legend.append('rect').attr('class', 'legend-rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .attr('fill', 'url(#colorGradient)');
    }
    legendRect
        .attr('x', legendX)
        .attr('y', legendY);


    // Etiquetes de Valors (Màxim, 0, Mínim)

    // 1. Etiqueta Màxima
    let maxLabel = legend.select('.max-label');
    if (maxLabel.empty()) {
        maxLabel = legend.append('text').attr('class', 'legend-label max-label')
            .attr('x', legendX + legendWidth + 10)
            .attr('text-anchor', 'start');
    }
    maxLabel.transition(t)
        .attr('y', legendY)
        .text('+' + efficiencyExtent[1].toFixed(2)); // El màxim positiu

    // 2. Etiqueta Zero
    let zeroLabel = legend.select('.zero-label');
    if (zeroLabel.empty()) {
        zeroLabel = legend.append('text').attr('class', 'legend-label zero-label')
            .attr('x', legendX + legendWidth + 10)
            .attr('text-anchor', 'start');
    }
    // Calculem la posició Y on el zero es projecta a l'escala.
    const zeroYPosition = legendY + (legendHeight * (1 - (0 - efficiencyExtent[0]) / (efficiencyExtent[1] - efficiencyExtent[0])));

    zeroLabel.transition(t)
        .attr('y', zeroYPosition)
        .text('0.00');

    // 3. Etiqueta Mínima
    let minLabel = legend.select('.min-label');
    if (minLabel.empty()) {
        minLabel = legend.append('text').attr('class', 'legend-label min-label')
            .attr('x', legendX + legendWidth + 10)
            .attr('text-anchor', 'start');
    }
    minLabel.transition(t)
        .attr('y', legendY + legendHeight)
        .text(efficiencyExtent[0].toFixed(2)); // El mínim negatiu

    // Aplica l'estat de highlight actual
    updateTeamHighlight();
}


// ============================================
// VISUALITZACIÓ — SECCIÓ 3 (EVOLUCIÓ)
// ============================================

function renderSection3(useTransition = false) {
    const { WIDTH, HEIGHT, MARGIN, TRANSITION_DURATION } = VIZ_CONSTANTS;
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    // 1) Preparar SVG i contenidor (sense esborrar-ho TOT cada vegada)
    const svg = d3.select('#viz-section-3')
        .attr('width', WIDTH)
        .attr('height', HEIGHT);

    let g = svg.select('.main-group');
    if (g.empty()) {
        g = svg.append('g')
            .attr('class', 'main-group')
            .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);
    }

    // 2) Filtrar dades (temporada) + netejar invalids
    let data = (AppState.data.section3 || []).filter(d => d.season === AppState.selectedSeason);

    data = data.filter(d =>
        Number.isFinite(d.matchday) &&
        Number.isFinite(d.goal_diff_cum) &&
        Number.isFinite(d.xg_diff_cum)
    );

    // Si no hi ha dades, netejar contingut i sortir
    if (data.length === 0) {
        g.selectAll('*').remove();
        return;
    }

    // 3) Agrupar per equip (per dibuixar una línia per equip)
    const teamsGrouped = d3.group(data, d => d.team);

    // 4) Escales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.matchday))
        .range([0, innerWidth])
        .nice();

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.goal_diff_cum))
        .range([innerHeight, 0])
        .nice();

    // Color: blau (negatiu) -> taronja (positiu)
    const colorScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.xg_diff_cum))
        .range(['#1A73E8', '#FF6B35']);

    // Transició
    const t = useTransition ? svg.transition().duration(TRANSITION_DURATION) : null;

    // 5) Eixos
    let xAxisG = g.select('.x-axis');
    if (xAxisG.empty()) {
        xAxisG = g.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${innerHeight})`);
    }
    if (t) xAxisG.transition(t).call(d3.axisBottom(xScale));
    else xAxisG.call(d3.axisBottom(xScale));

    let yAxisG = g.select('.y-axis');
    if (yAxisG.empty()) {
        yAxisG = g.append('g').attr('class', 'axis y-axis');
    }
    if (t) yAxisG.transition(t).call(d3.axisLeft(yScale));
    else yAxisG.call(d3.axisLeft(yScale));

    // 6) Labels dels eixos
    let xLabel = g.select('.x-axis-label');
    if (xLabel.empty()) {
        xLabel = g.append('text')
            .attr('class', 'axis-label x-axis-label')
            .attr('text-anchor', 'middle')
            .attr('x', innerWidth / 2)
            .attr('y', innerHeight + 55)
            .text('Jornada');
    }

    let yLabel = g.select('.y-axis-label');
    if (yLabel.empty()) {
        yLabel = g.append('text')
            .attr('class', 'axis-label y-axis-label')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerHeight / 2)
            .attr('y', -55)
            .text('Diferència de gols acumulada');
    }

    // 7) Generador de línia
    const line = d3.line()
        .x(d => xScale(d.matchday))
        .y(d => yScale(d.goal_diff_cum));

    // 8) Línies: una per equip
    const linesSel = g.selectAll('.team-line')
        .data(Array.from(teamsGrouped), d => d[0]);

    linesSel.join(
        enter => enter.append('path')
            .attr('class', 'team-line')
            .attr('fill', 'none')
            .attr('stroke', 'rgba(255,255,255,0.20)')
            .attr('stroke-width', 1.5)
            .attr('d', ([team, values]) => line(values.slice().sort((a, b) => a.matchday - b.matchday))),
        update => {
            const u = t ? update.transition(t) : update;
            return u.attr('d', ([team, values]) => line(values.slice().sort((a, b) => a.matchday - b.matchday)));
        },
        exit => exit.remove()
    );

    // 9) Punts: cada jornada
    const pointsSel = g.selectAll('.team-point')
        .data(data, d => `${d.team}-${d.matchday}`);

    pointsSel.join(
        enter => enter.append('circle')
            .attr('class', 'team-point')
            .attr('r', 4)
            .attr('cx', d => xScale(d.matchday))
            .attr('cy', d => yScale(d.goal_diff_cum))
            .attr('fill', d => colorScale(d.xg_diff_cum))
            .attr('opacity', 0.85),
        update => {
            const u = t ? update.transition(t) : update;
            return u
                .attr('cx', d => xScale(d.matchday))
                .attr('cy', d => yScale(d.goal_diff_cum))
                .attr('fill', d => colorScale(d.xg_diff_cum));
        },
        exit => exit.remove()
    )
    // 10) Interacció: hover + tooltip + click
    .on('mouseover', function (event, d) {
        AppState.hoveredTeam = d.team;
        d3.select(this).attr('r', 6).attr('opacity', 1);

        // Tooltip reutilitzant el tooltip existent
        showTooltipSection3(event, d);

        updateTeamHighlightSection3();
    })
    .on('mousemove', function (event, d) {
        showTooltipSection3(event, d);
    })
    .on('mouseleave', function () {
        AppState.hoveredTeam = null;
        d3.select(this).attr('r', 4).attr('opacity', 0.85);
        hideTooltip();
        updateTeamHighlightSection3();
    })
    .on('click', function (event, d) {
        AppState.selectedTeam = (AppState.selectedTeam === d.team) ? null : d.team;
        document.getElementById('team-select').value = AppState.selectedTeam || "";
        updateTeamHighlight(); // (això ja crida section3 si toca)
    });

    // 11) LLEGENDA (Gradient xG diff)
    const legendWidth = 20;
    const legendHeight = innerHeight * 0.7;
    const legendX = innerWidth + 40;
    const legendY = (innerHeight - legendHeight) / 2;

    // Contenidor de la llegenda
    let legend = g.select('.legend-group');
    if (legend.empty()) {
        legend = g.append('g').attr('class', 'legend-group');
    }

    // Títol
    let legendTitle = legend.select('.legend-title');
    if (legendTitle.empty()) {
        legendTitle = legend.append('text')
            .attr('class', 'legend-title')
            .attr('x', legendX)
            .attr('y', legendY - 15)
            .text('Diferència gols esperats');
    }

    // Gradient
    if (svg.select('#xgDiffGradient').empty()) {
        const linearGradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'xgDiffGradient')
            .attr('x1', '0%')
            .attr('y1', '100%')
            .attr('x2', '0%')
            .attr('y2', '0%');

        linearGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#1A73E8'); // Blau (negatiu)

        linearGradient.append('stop')
            .attr('offset', '50%')
            .attr('stop-color', '#64B5F6'); // Neutre

        linearGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#FF6B35'); // Taronja (positiu)
    }

    // Rectangle gradient
    let legendRect = legend.select('.legend-rect');
    if (legendRect.empty()) {
        legendRect = legend.append('rect')
            .attr('class', 'legend-rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .attr('fill', 'url(#xgDiffGradient)');
    }

    legendRect
        .attr('x', legendX)
        .attr('y', legendY);

    // Etiquetes llegenda
    const colorExtent = d3.extent(data, d => d.xg_diff_cum);

    // Màxim
    let maxLabel = legend.select('.max-label');
    if (maxLabel.empty()) {
        maxLabel = legend.append('text')
            .attr('class', 'legend-label max-label')
            .attr('x', legendX + legendWidth + 10);
    }
    maxLabel
        .attr('y', legendY)
        .text('+' + colorExtent[1].toFixed(1));

    // Zero
    let zeroLabel = legend.select('.zero-label');
    if (zeroLabel.empty()) {
        zeroLabel = legend.append('text')
            .attr('class', 'legend-label zero-label')
            .attr('x', legendX + legendWidth + 10);
    }
    zeroLabel
        .attr('y', legendY + legendHeight / 2)
        .text('0.0');

    // Mínim
    let minLabel = legend.select('.min-label');
    if (minLabel.empty()) {
        minLabel = legend.append('text')
            .attr('class', 'legend-label min-label')
            .attr('x', legendX + legendWidth + 10);
    }
    minLabel
        .attr('y', legendY + legendHeight)
        .text(colorExtent[0].toFixed(1));

    // 12) Aplicar highlight final
    updateTeamHighlightSection3();
}



// ============================================
// VISUALITZACIÓ — SECCIÓ 4 (STYLES)
// ============================================

function renderRadarChart({ svgId, data, variables, labels, color }) {
    const size = 420;
    const radius = size / 2 - 70;
    const levels = 5;

    const svg = d3.select(svgId)
        .attr('width', size)
        .attr('height', size);

    svg.selectAll('*').remove();

    const g = svg.append('g')
        .attr('transform', `translate(${size / 2},${size / 2})`);

    const angleSlice = (Math.PI * 2) / variables.length;

    const rScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, radius]);

    /* Grids */
    d3.range(1, levels + 1).forEach(lvl => {
        g.append('circle')
            .attr('r', (radius / levels) * lvl)
            .attr('fill', 'none')
            .attr('stroke', 'rgba(255,255,255,0.12)');
    });

    /* Axes + labels */
    variables.forEach((v, i) => {
        const angle = i * angleSlice - Math.PI / 2;

        g.append('line')
            .attr('x2', rScale(1) * Math.cos(angle))
            .attr('y2', rScale(1) * Math.sin(angle))
            .attr('stroke', 'rgba(255,255,255,0.25)');

        g.append('text')
            .attr('x', (rScale(1) + 26) * Math.cos(angle))
            .attr('y', (rScale(1) + 26) * Math.sin(angle))
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '13px')
            .attr('fill', '#FFC7B3')
            .attr('font-family', 'Roboto')
            .attr('font-weight', 400)
            .text(labels[i]);
    });

    const radarLine = d3.lineRadial()
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice)
        .curve(d3.curveLinearClosed);

    const values = variables.map(v => ({ value: data[v] }));

    g.append('path')
        .datum(values)
        .attr('d', radarLine)
        .attr('fill', color)
        .attr('fill-opacity', 0.35)
        .attr('stroke', color)
        .attr('stroke-width', 2);
}

function renderSection4() {
    const data = AppState.data.section4;

    if (!data || !AppState.selectedTeam) return;

    const row = data.find(d =>
        d.season === AppState.selectedSeason &&
        d.team === AppState.selectedTeam
    );

    if (!row) return;

    Object.values(RADAR_CONFIG).forEach(cfg => {
        renderRadarChart({
            ...cfg,
            data: row
        });
    });
}


// ============================================
// VISUALITZACIÓ — SECCIÓ 5 (CONCLUSIONS / KPI)
// ============================================

function renderSection5() {
    const container = document.getElementById('kpi-cards');
    if (!container) return;

    // Reset visual
    container.querySelectorAll('.kpi-value').forEach(el => {
        el.textContent = '—';
        el.classList.remove('positive', 'negative', 'neutral');
    });

    if (!AppState.selectedTeam) return;

    const row = AppState.data.section5.find(d =>
        d.season === AppState.selectedSeason &&
        d.team === AppState.selectedTeam
    );

    if (!row) return;

    // Helper per set classes
    function setValue(el, value, status) {
        el.textContent = value;
        el.classList.remove('kpi-positive', 'kpi-negative', 'kpi-neutral');
        el.classList.add(
            status === 'positive' ? 'kpi-positive' :
            status === 'negative' ? 'kpi-negative' :
            'kpi-neutral'
        );
    }

    // KPI 1: Rendiment
    const perfEl = document.getElementById('kpi-performance');
    setValue(
        perfEl,
        row.performance_xg.toFixed(2),
        row.performance_xg > 0 ? 'positive' :
        row.performance_xg < 0 ? 'negative' : 'neutral'
    );

    // KPI 2: Eficiència
    const effEl = document.getElementById('kpi-efficiency');
    setValue(
        effEl,
        `${row.efficiency > 0 ? '+' : ''}${row.efficiency.toFixed(1)}`,
        row.efficiency > 0 ? 'positive' :
        row.efficiency < 0 ? 'negative' : 'neutral'
    );

    // KPI 3: Evolució
    const trendEl = document.getElementById('kpi-trend');
    setValue(
        trendEl,
        row.trend === 'up' ? '↗ CREIXENT' :
        row.trend === 'down' ? '↘ DESCENDENT' :
        '→ ESTABLE',
        row.trend === 'up' ? 'positive' :
        row.trend === 'down' ? 'negative' : 'neutral'
    );

    // KPI 4: Estil
    const styleEl = document.getElementById('kpi-style');
    styleEl.textContent = row.play_style;
    styleEl.classList.remove('kpi-positive', 'kpi-negative', 'kpi-neutral');
}



// ============================================
// HIGHLIGHT SECCIONS 1 I 2
// ============================================
function updateTeamHighlight() {
    const points = d3.selectAll('.team-point');
    const labels = d3.selectAll('.team-label');
    const selected = AppState.selectedTeam;

    if (!selected) {
        // Estat "Tots els equips"
        points.classed('dimmed', false)
              .classed('highlighted', false)
              .attr('r', 10) // Mida normal
              .attr('stroke-width', 1.5); // Vora normal

        labels.transition().duration(200).attr('opacity', 0);
        return;
    }

    // Estat "Equip Seleccionat"
    points.each(function(d) {
        const isHighlighted = d.team === selected;
        d3.select(this)
            .classed('highlighted', isHighlighted)
            .classed('dimmed', !isHighlighted)
            .attr('r', isHighlighted ? 14 : 10) // Més gran si destacat
            .attr('stroke-width', isHighlighted ? 3 : 1.5);
    });

    labels.each(function(d) {
        d3.select(this)
            .transition().duration(200)
            .attr('opacity', d.team === selected ? 1 : 0);
    });

    // Aplica highlight també a Secció 3 si està activa
    if (AppState.activeSection === 3) {
        updateTeamHighlightSection3();
    }
}


// ============================================
// HIGHLIGHT SECCIÓ 3
// ============================================
function updateTeamHighlightSection3() {
    const lines = d3.selectAll('.team-line');
    const points = d3.selectAll('#viz-section-3 .team-point');

    const activeTeam = AppState.selectedTeam || AppState.hoveredTeam;

    if (!activeTeam) {
        lines.attr('stroke', 'rgba(255,255,255,0.20)')
             .attr('stroke-width', 1.5);

        points
          .classed('dimmed', false)
          .classed('highlighted', false)
          .attr('r', 4)
          .attr('opacity', 0.85);

        return;
    }

    // Línies
    lines.each(function(d) {
        const team = d[0]; // perquè data = [team, values]
        const isActive = team === activeTeam;

        d3.select(this)
            .attr('stroke', isActive ? '#FF6B35' : 'rgba(255,255,255,0.10)')
            .attr('stroke-width', isActive ? 3 : 1);
    });

    // Punts
    points.each(function(d) {
        const isActive = d.team === activeTeam;

        d3.select(this)
            .classed('highlighted', isActive)
            .classed('dimmed', !isActive)
            .attr('r', isActive ? 6 : 3)
            .attr('opacity', isActive ? 1 : 0.15);
    });
}



// ============================================
// INIT
// ============================================
async function init() {
    // Carrega dades i inicialitza l'estat
    await loadSection1Data();
    await loadSection2Data();
    await loadSection3Data();
    await loadSection4Data();
    await loadSection5Data();

    // Inicialitza els selectors HTML
    initializeSelectors();

    // Controla l'scroll i la càrrega de seccions
    initializeScrollController();
    initializeScrollToTop();
}

document.addEventListener('DOMContentLoaded', init);