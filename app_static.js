// OSMD 应用主逻辑 - 静态网站版本
// 直接从本地 JSON 文件加载预处理的数据，不再需要后端 API

let osmdSystems = []; // 存储每个系统的OSMD实例
let currentData = null;
let tempoChart = null; // Chart.js 实例

// 获取深色主题配色
function isDarkMode() {
    return document.body.classList.contains('theme-dark');
}

function getChartColors() {
    const dark = isDarkMode();
    return {
        background: dark ? '#000000' : '#ffffff',  // 深色主题用纯黑
        text: dark ? '#e2e8f0' : '#212529',
        textMuted: dark ? '#888888' : '#6c757d',
        grid: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        line: dark ? '#84cc16' : 'rgb(33, 150, 243)',
        fill: dark ? 'rgba(132, 204, 22, 0.08)' : 'rgba(33, 150, 243, 0.08)',
    };
}

// 绘制速度曲线（Chart.js），兼容单点与多点数据
function drawTempoCurve() {
    const canvas = document.getElementById('tempoCurveCanvas');
    const chartCard = document.getElementById('curveChartCard') || document.getElementById('curveChart');
    if (!canvas) {
        console.warn('drawTempoCurve: tempoCurveCanvas 未找到');
        return;
    }

    if (!currentData || !currentData.tempo_curve || currentData.tempo_curve.length === 0) {
        // No data: ensure the card is visible and show a placeholder on the canvas
        if (tempoChart) {
            try { tempoChart.destroy(); } catch (e) {}
            tempoChart = null;
        }
        if (chartCard) chartCard.style.display = 'block';
        try {
            const width = canvas.width = canvas.offsetWidth || 600;
            const height = canvas.height = canvas.offsetHeight || 200;
            const ctx2 = canvas.getContext('2d');
            ctx2.clearRect(0, 0, width, height);
            // 根据主题设置背景色
            const isDark = document.body.classList.contains('theme-dark');
            ctx2.fillStyle = isDark ? '#000000' : '#f5f7fa';
            ctx2.fillRect(0, 0, width, height);
            ctx2.fillStyle = isDark ? '#888888' : '#777';
            ctx2.font = '14px Arial';
            ctx2.textAlign = 'center';
            ctx2.fillText((window.t ? window.t('no_tempo_data') : '暂无速度曲线数据'), width / 2, height / 2);
        } catch (e) {
            // ignore placeholder draw errors
        }
        return;
    }

    if (chartCard) chartCard.style.display = 'block';

    const tempoCurve = currentData.tempo_curve;
    const tempoIndices = currentData.tempo_curve_indices || [];
    const scoreTokens = currentData.score_tokens || [];
    const colors = getChartColors();

    const labels = tempoIndices.map((sidx) => {
        if (sidx >= 0 && sidx < scoreTokens.length) return scoreTokens[sidx].position.toFixed(1);
        return '';
    });

    const ctx = canvas.getContext('2d');
    if (tempoChart) {
        try { tempoChart.destroy(); } catch (e) {}
        tempoChart = null;
    }

    // Create Chart.js line chart
    try {
        tempoChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: (window.t ? window.t('chart_bpm_label') : '速度 (BPM)'),
                    data: tempoCurve,
                    borderColor: colors.line,
                    backgroundColor: colors.fill,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        display: true,
                        title: { display: true, text: (window.t ? window.t('label_position') : '位置 (节拍)'), color: colors.textMuted },
                        ticks: { color: colors.textMuted },
                        grid: { color: colors.grid }
                    },
                    y: {
                        display: true,
                        title: { display: true, text: 'BPM', color: colors.textMuted },
                        ticks: { color: colors.textMuted },
                        grid: { color: colors.grid }
                    }
                },
                plugins: {
                    legend: { display: false }
                },
            }
        });
    } catch (e) {
        // 如果 Chart.js 不可用则回退到简单 canvas 绘制
        console.warn('Chart.js 绘制失败，回退到 canvas 绘制：', e);
        const width = canvas.width = canvas.offsetWidth || 600;
        const height = canvas.height = canvas.offsetHeight || 200;
        const ctx2 = canvas.getContext('2d');
        ctx2.clearRect(0, 0, width, height);
        ctx2.fillStyle = colors.background;
        ctx2.fillRect(0, 0, width, height);
        const padding = 40;
        const plotWidth = width - 2 * padding;
        const plotHeight = height - 2 * padding;
        const minTempo = Math.min(...tempoCurve);
        const maxTempo = Math.max(...tempoCurve);
        const tempoRange = maxTempo - minTempo || 1;
        const denom = Math.max(1, tempoCurve.length - 1);
        ctx2.strokeStyle = colors.line;
        ctx2.lineWidth = 2;
        ctx2.beginPath();
        for (let i = 0; i < tempoCurve.length; i++) {
            const x = padding + (plotWidth * i / denom);
            const y = padding + plotHeight - (plotHeight * (tempoCurve[i] - minTempo) / tempoRange);
            if (i === 0) ctx2.moveTo(x, y); else ctx2.lineTo(x, y);
        }
        ctx2.stroke();
    }
}

// 内置曲目预设 - 直接指向本地文件
const piecePresets = {
    // ===== ASAP Mozart Piano Sonatas =====
    asap_8_1_rozanski: {
        label: 'K.310-1: Mozart Sonata 8-1 (Rozanski)',
        score_path: 'scores/8-1/xml_score.musicxml',
        data_file: 'data/asap_8_1_rozanski.json',
    },
    asap_8_1_bogdanovitch: {
        label: 'K.310-1: Mozart Sonata 8-1 (Bogdanovitch)',
        score_path: 'scores/8-1/xml_score.musicxml',
        data_file: 'data/asap_8_1_bogdanovitch.json',
    },
    asap_8_1_jia: {
        label: 'K.310-1: Mozart Sonata 8-1 (Jia)',
        score_path: 'scores/8-1/xml_score.musicxml',
        data_file: 'data/asap_8_1_jia.json',
    },
    asap_8_1_lo: {
        label: 'K.310-1: Mozart Sonata 8-1 (Lo)',
        score_path: 'scores/8-1/xml_score.musicxml',
        data_file: 'data/asap_8_1_lo.json',
    },
    asap_8_1_lee: {
        label: 'K.310-1: Mozart Sonata 8-1 (Lee)',
        score_path: 'scores/8-1/xml_score.musicxml',
        data_file: 'data/asap_8_1_lee.json',
    },
    asap_8_1_midi: {
        label: 'K.310-1: Mozart Sonata 8-1 (MIDI Score)',
        score_path: 'scores/8-1/xml_score.musicxml',
        data_file: 'data/asap_8_1_midi.json',
    },
    asap_11_3_stahievitch: {
        label: 'K.331-3: Mozart Sonata 11-3 (Stahievitch)',
        score_path: 'scores/11-3/xml_score.musicxml',
        data_file: 'data/asap_11_3_stahievitch.json',
    },
    asap_11_3_midi: {
        label: 'K.331-3: Mozart Sonata 11-3 (MIDI Score)',
        score_path: 'scores/11-3/xml_score.musicxml',
        data_file: 'data/asap_11_3_midi.json',
    },
    asap_12_1_adig: {
        label: 'K.332-1: Mozart Sonata 12-1 (Adig)',
        score_path: 'scores/12-1/xml_score.musicxml',
        data_file: 'data/asap_12_1_adig.json',
    },
    asap_12_1_muna: {
        label: 'K.332-1: Mozart Sonata 12-1 (MunA)',
        score_path: 'scores/12-1/xml_score.musicxml',
        data_file: 'data/asap_12_1_muna.json',
    },
    asap_12_1_tet: {
        label: 'K.332-1: Mozart Sonata 12-1 (TET)',
        score_path: 'scores/12-1/xml_score.musicxml',
        data_file: 'data/asap_12_1_tet.json',
    },
    asap_12_1_wuue: {
        label: 'K.332-1: Mozart Sonata 12-1 (WuuE)',
        score_path: 'scores/12-1/xml_score.musicxml',
        data_file: 'data/asap_12_1_wuue.json',
    },
    asap_12_1_midi: {
        label: 'K.332-1: Mozart Sonata 12-1 (MIDI Score)',
        score_path: 'scores/12-1/xml_score.musicxml',
        data_file: 'data/asap_12_1_midi.json',
    },
    asap_12_2_muna: {
        label: 'K.332-2: Mozart Sonata 12-2 (MunA)',
        score_path: 'scores/12-2/xml_score.musicxml',
        data_file: 'data/asap_12_2_muna.json',
    },
    asap_12_2_wuue: {
        label: 'K.332-2: Mozart Sonata 12-2 (WuuE)',
        score_path: 'scores/12-2/xml_score.musicxml',
        data_file: 'data/asap_12_2_wuue.json',
    },
    asap_12_2_midi: {
        label: 'K.332-2: Mozart Sonata 12-2 (MIDI Score)',
        score_path: 'scores/12-2/xml_score.musicxml',
        data_file: 'data/asap_12_2_midi.json',
    },
    asap_12_3_blinov: {
        label: 'K.332-3: Mozart Sonata 12-3 (Blinov)',
        score_path: 'scores/12-3/xml_score.musicxml',
        data_file: 'data/asap_12_3_blinov.json',
    },
    asap_12_3_muna: {
        label: 'K.332-3: Mozart Sonata 12-3 (MunA)',
        score_path: 'scores/12-3/xml_score.musicxml',
        data_file: 'data/asap_12_3_muna.json',
    },
    asap_12_3_wuue: {
        label: 'K.332-3: Mozart Sonata 12-3 (WuuE)',
        score_path: 'scores/12-3/xml_score.musicxml',
        data_file: 'data/asap_12_3_wuue.json',
    },
    asap_12_3_midi: {
        label: 'K.332-3: Mozart Sonata 12-3 (MIDI Score)',
        score_path: 'scores/12-3/xml_score.musicxml',
        data_file: 'data/asap_12_3_midi.json',
    },
};

let _presetListenerReady = false;

// 独立初始化曲目预设下拉
function initPiecePresetListener() {
    if (_presetListenerReady) return;
    const piecePresetEl = document.getElementById('piecePreset');
    if (!piecePresetEl) return;
    piecePresetEl.addEventListener('change', handlePiecePresetChange);
    _presetListenerReady = true;
}

function handlePiecePresetChange() {
    const piecePresetEl = document.getElementById('piecePreset');
    if (!piecePresetEl) return;
    const id = piecePresetEl.value;
    if (!id || !piecePresets[id]) {
        if (id === '') {
            updateStatus('请选择一个预设或手动输入', 'info');
        }
        return;
    }
    const preset = piecePresets[id];
    updateStatus(`已选择: ${preset.label}`, 'info', 'status_apply_preset');
}

// 初始化 - 等待 OSMD 库加载完成
function checkOSMDLoaded() {
    if (typeof opensheetmusicdisplay !== 'undefined' && opensheetmusicdisplay.OpenSheetMusicDisplay) {
        console.log('✅ OSMD 库已加载，初始化应用...');
        initializeOSMD();
        setupEventListeners();
        updateStatus('准备就绪。选择一个预设开始分析。', 'info', 'status_ready');
        return true;
    }
    return false;
}

// 主题初始化
function initThemeToggle() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    console.log('主题按钮元素:', themeToggleBtn, themeIcon);
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', (e) => {
            console.log('主题切换按钮被点击');
            e.preventDefault();
            e.stopPropagation();
            toggleTheme();
        });
    } else {
        console.error('找不到主题切换按钮');
    }

    // 初始化时恢复保存的主题
    const savedTheme = localStorage.getItem('appTheme') || 'light';
    console.log('恢复保存的主题:', savedTheme);
    applyTheme(savedTheme);
    updateThemeIcon(savedTheme);
    setTimeout(() => {
        drawTempoCurve();
    }, 50);
}

// 监听 OSMD 加载完成事件
window.addEventListener('osmd-loaded', function() {
    console.log('收到 OSMD 加载完成事件');
    setTimeout(() => {
        if (!checkOSMDLoaded()) {
            updateStatus('警告: OSMD 库可能未正确加载，请刷新页面重试', 'error', 'warning_osmd_load');
            console.error('opensheetmusicdisplay 未定义');
        }
    }, 100);
});

// 页面加载时也检查一次
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('页面加载完成，检查 OSMD 状态...');
        initThemeToggle();
        setTimeout(() => {
            if (!checkOSMDLoaded()) {
                console.log('等待 OSMD 加载事件...');
            }
        }, 500);
        initPiecePresetListener();
        window.addEventListener('resize', () => {
            if (osmdSystems.length > 0) {
                clearTimeout(window._resizeTimeout);
                window._resizeTimeout = setTimeout(() => {
                    console.log('窗口尺寸变化，重新渲染所有系统');
                    osmdSystems.forEach(system => {
                        if (system.osmd) {
                            try {
                                system.osmd.render();
                            } catch (e) {
                                console.warn('重新渲染系统失败:', e);
                            }
                        }
                    });
                }, 300);
            }
        });
    });
} else {
    initThemeToggle();
    setTimeout(() => {
        if (!checkOSMDLoaded()) {
            console.log('等待 OSMD 加载事件...');
        }
    }, 500);
    initPiecePresetListener();
}

function initializeOSMD() {
    console.log('OSMD 初始化完成');
}

function setupEventListeners() {
    try {
        // 加载按钮
        const loadBtn = document.getElementById('loadBtn');
        if (loadBtn) {
            loadBtn.addEventListener('click', handleLoadData);
        }

        // 曲目预设下拉
        initPiecePresetListener();

        // 层级选择器
        const levelSlider = document.getElementById('levelSlider');
        if (levelSlider) {
            levelSlider.addEventListener('input', () => {
                const nLevels = levelSlider.max || 1;
                const newLevel = levelSlider.value;
                
                const levelDisplay = document.getElementById('levelDisplay');
                if (levelDisplay) {
                    levelDisplay.textContent = `Level: ${newLevel} / ${nLevels}`;
                }
                
                if (!currentData || !currentData.minima_levels_mapped_to_beats) {
                    return;
                }
                
                osmdSystems.forEach(system => {
                    if (system.osmd && system.container) {
                        try {
                            drawFiveSplitLinesForSystem(
                                system.osmd,
                                system.container,
                                system.measures,
                                system.systemIndex,
                                system.measureStartIndex
                            );
                        } catch (e) {
                            console.warn('重新绘制节拍失败:', e);
                        }
                    }
                });
            });
        }

        // 初始化时绘制速度曲线（若无数据则显示占位）
        try {
            drawTempoCurve();
        } catch (e) {
            console.warn('init drawTempoCurve failed', e);
        }

        console.log('✅ 事件监听器注册完成');
        ensureSystemPlayerControls();
    } catch (error) {
        console.error('注册事件监听器时出错:', error);
        updateStatus(`${window.t ? window.t('status_init_failed') : '初始化失败'}: ${error.message}`, 'error');
    }
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.classList.contains('theme-dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('appTheme', newTheme);
    updateThemeIcon(newTheme);
    setTimeout(() => {
        drawTempoCurve();
    }, 50);
}

function applyTheme(theme) {
    const body = document.body;
    body.classList.remove('theme-dark', 'theme-minimal', 'theme-modern');
    if (theme === 'dark') {
        body.classList.add('theme-dark');
    } else if (theme === 'minimal') {
        body.classList.add('theme-minimal');
    } else {
        body.classList.add('theme-modern');
    }
}

function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        if (theme === 'dark') {
            themeIcon.className = 'bi bi-sun-fill';
        } else {
            themeIcon.className = 'bi bi-moon-fill';
        }
    }
}

// ----------------------- 系统逐条播放功能 -----------------------
let _currentSystemIndex = 0;

function ensureSystemPlayerControls() {
    if (document.getElementById('systemPlayerControls')) return;
    const sidebar = document.getElementById('sidebarCol') || document.body;
    const bodyArea = sidebar.querySelector('.card-body') || sidebar;

    const wrapper = document.createElement('div');
    wrapper.id = 'systemPlayerControls';

    const titleRow = document.createElement('div');
    titleRow.className = 'd-flex align-items-center mb-2';

    const titleIcon = document.createElement('i');
    titleIcon.className = 'bi bi-play-circle me-2 text-primary';

    const title = document.createElement('div');
    title.id = 'systemPlayerTitle';
    title.textContent = window.t ? window.t('system_player_title') : '系统播放';
    title.style.fontWeight = '600';
    title.style.fontSize = '0.95rem';

    titleRow.appendChild(titleIcon);
    titleRow.appendChild(title);

    const playBtn = document.createElement('button');
    playBtn.id = 'systemPlayBtn';
    playBtn.className = 'btn btn-primary btn-lg w-100 mb-2';
    playBtn.innerHTML = `<i class="bi bi-play-fill me-2"></i><span>${window.t ? window.t('btn_play') : '播放'}</span>`;
    playBtn.addEventListener('click', () => {
        if (!window.systemPlayer) startSystemPlayback(5000);
        else if (window.systemPlayer.playing) pauseSystemPlayback();
        else resumeSystemPlayback();
    });

    const navRow = document.createElement('div');
    navRow.className = 'd-flex gap-2';

    const btnPrev = document.createElement('button');
    btnPrev.id = 'systemPrevBtn';
    btnPrev.className = 'btn btn-outline-primary flex-fill';
    btnPrev.innerHTML = `<i class="bi bi-chevron-double-left me-1"></i><span>${window.t ? window.t('btn_prev_line') : '上一行'}</span>`;
    btnPrev.addEventListener('click', () => {
        stopSystemPlayback();
        prevSystem();
    });

    const btnNext = document.createElement('button');
    btnNext.id = 'systemNextBtn';
    btnNext.className = 'btn btn-outline-primary flex-fill';
    btnNext.innerHTML = `<span>${window.t ? window.t('btn_next_line') : '下一行'}</span><i class="bi bi-chevron-double-right ms-1"></i>`;
    btnNext.addEventListener('click', () => {
        stopSystemPlayback();
        nextSystem();
    });

    navRow.appendChild(btnPrev);
    navRow.appendChild(btnNext);

    const btnAll = document.createElement('button');
    btnAll.id = 'systemAllBtn';
    btnAll.className = 'btn btn-outline-secondary w-100 mt-2';
    btnAll.innerHTML = `<i class="bi bi-grid-3x3-gap me-2"></i><span>${window.t ? window.t('btn_show_all') : '显示全部'}</span>`;
    btnAll.addEventListener('click', showAllSystems);

    wrapper.appendChild(titleRow);
    wrapper.appendChild(playBtn);
    wrapper.appendChild(navRow);
    wrapper.appendChild(btnAll);
    bodyArea.appendChild(wrapper);

    document.addEventListener('lang-changed', updateSystemPlayerTexts);
}

function updateSystemPlayerTexts() {
    const title = document.getElementById('systemPlayerTitle');
    if (title) title.textContent = window.t ? window.t('system_player_title') : '系统播放';

    const btnPlay = document.getElementById('systemPlayBtn');
    const btnPrev = document.getElementById('systemPrevBtn');
    const btnNext = document.getElementById('systemNextBtn');

    if (btnPlay) {
        const icon = btnPlay.querySelector('i')?.outerHTML || '<i class="bi bi-play-fill me-2"></i>';
        if (window.systemPlayer?.playing) {
            const pauseIcon = '<i class="bi bi-pause-fill me-2"></i>';
            btnPlay.innerHTML = `${pauseIcon}<span>${window.t ? window.t('btn_pause') : '暂停'}</span>`;
        } else if (window.systemPlayer) {
            const resumeIcon = '<i class="bi bi-play-fill me-2"></i>';
            btnPlay.innerHTML = `${resumeIcon}<span>${window.t ? window.t('btn_resume') : '继续'}</span>`;
        } else {
            const playIcon = '<i class="bi bi-play-fill me-2"></i>';
            btnPlay.innerHTML = `${playIcon}<span>${window.t ? window.t('btn_play') : '播放'}</span>`;
        }
    }
    if (btnPrev) {
        btnPrev.innerHTML = `<i class="bi bi-chevron-double-left me-1"></i><span>${window.t ? window.t('btn_prev_line') : '上一行'}</span>`;
    }
    if (btnNext) {
        btnNext.innerHTML = `<span>${window.t ? window.t('btn_next_line') : '下一行'}</span><i class="bi bi-chevron-double-right ms-1"></i>`;
    }
    const btnAll = document.getElementById('systemAllBtn');
    if (btnAll) {
        btnAll.innerHTML = `<i class="bi bi-grid-3x3-gap me-2"></i><span>${window.t ? window.t('btn_show_all') : '显示全部'}</span>`;
    }
}

function showOnlySystem(idx) {
    const container = document.getElementById('osmdContainer');
    if (!container) return;
    if (Array.isArray(osmdSystems) && osmdSystems.length > 0) {
        osmdSystems.forEach((system, i) => {
            try {
                if (i === idx) {
                    system.container.style.display = 'block';
                    const svgEl = system.container.querySelector('svg');
                    if (svgEl) svgEl.style.pointerEvents = 'auto';
                    if (system.osmd && typeof system.osmd.render === 'function') {
                        try { system.osmd.render(); } catch (e) { console.warn('render visible system failed', e); }
                    }
                    system.container.scrollIntoView({behavior: 'smooth', block: 'center'});
                } else {
                    system.container.style.display = 'none';
                    const svgEl = system.container.querySelector('svg');
                    if (svgEl) svgEl.style.pointerEvents = 'none';
                }
            } catch (e) {
                console.warn('showOnlySystem error for index', i, e);
            }
        });
        return;
    }
    const children = Array.from(container.children);
    children.forEach((c, i) => {
        c.style.display = (i === idx) ? 'block' : 'none';
    });
    const el = children[idx];
    if (el) el.scrollIntoView({behavior: 'smooth', block: 'center'});
}

function startSystemPlayback(intervalMs = 5000) {
    if (!osmdSystems || osmdSystems.length === 0) return;
    stopSystemPlayback();
    window.systemPlayer = {
        currentIndex: 0,
        intervalMs: intervalMs,
        timer: null,
        playing: true
    };
    _currentSystemIndex = 0;
    showOnlySystem(0);
    window.systemPlayer.timer = setInterval(() => {
        if (!window.systemPlayer.playing) return;
        window.systemPlayer.currentIndex++;
        _currentSystemIndex = window.systemPlayer.currentIndex;
        if (window.systemPlayer.currentIndex >= osmdSystems.length) {
            stopSystemPlayback();
            return;
        }
        showOnlySystem(window.systemPlayer.currentIndex);
    }, intervalMs);
    updateSystemPlayerBtnPlay();
}

function updateSystemPlayerBtnPlay() {
    const playBtn = document.getElementById('systemPlayBtn');
    if (playBtn) {
        playBtn.innerHTML = `<i class="bi bi-pause-fill me-2"></i><span>${window.t ? window.t('btn_pause') : '暂停'}</span>`;
    }
}

function updateSystemPlayerBtnPause() {
    const playBtn = document.getElementById('systemPlayBtn');
    if (playBtn) {
        playBtn.innerHTML = `<i class="bi bi-play-fill me-2"></i><span>${window.t ? window.t('btn_resume') : '继续'}</span>`;
    }
}

function updateSystemPlayerBtnPlayText() {
    const playBtn = document.getElementById('systemPlayBtn');
    if (playBtn) {
        playBtn.innerHTML = `<i class="bi bi-play-fill me-2"></i><span>${window.t ? window.t('btn_play') : '播放'}</span>`;
    }
}

function pauseSystemPlayback() {
    if (!window.systemPlayer) return;
    window.systemPlayer.playing = false;
    updateSystemPlayerBtnPause();
}

function resumeSystemPlayback() {
    if (!window.systemPlayer) return;
    window.systemPlayer.playing = true;
    updateSystemPlayerBtnPlay();
}

function stopSystemPlayback() {
    if (!window.systemPlayer) return;
    clearInterval(window.systemPlayer.timer);
    window.systemPlayer = null;
    const container = document.getElementById('osmdContainer');
    if (container) Array.from(container.children).forEach(c => c.style.display = 'block');
    if (Array.isArray(osmdSystems) && osmdSystems.length > 0) {
        osmdSystems.forEach(system => {
            try {
                const svgEl = system.container.querySelector('svg');
                if (svgEl) svgEl.style.pointerEvents = 'auto';
                if (system.osmd && typeof system.osmd.render === 'function') {
                    try { system.osmd.render(); } catch (e) { /* ignore */ }
                }
            } catch (e) {}
        });
    }
    updateSystemPlayerBtnPlayText();
}

function nextSystem() {
    if (!osmdSystems || osmdSystems.length === 0) return;
    const idx = (_currentSystemIndex !== undefined ? _currentSystemIndex : 0) + 1;
    const nextIdx = Math.min(idx, osmdSystems.length - 1);
    _currentSystemIndex = nextIdx;
    showOnlySystem(nextIdx);
    if (window.systemPlayer) window.systemPlayer.currentIndex = nextIdx;
}

function showAllSystems() {
    stopSystemPlayback();
    const container = document.getElementById('osmdContainer');
    if (!container) return;
    container.querySelectorAll('.osmd-system').forEach(s => s.style.display = 'block');
    osmdSystems.forEach(system => {
        try {
            const svgEl = system.container.querySelector('svg');
            if (svgEl) svgEl.style.pointerEvents = 'auto';
            if (system.osmd && typeof system.osmd.render === 'function') system.osmd.render();
        } catch (e) {}
    });
    updateSystemPlayerBtnPlayText();
}

function prevSystem() {
    if (!osmdSystems || osmdSystems.length === 0) return;
    const idx = (_currentSystemIndex !== undefined ? _currentSystemIndex : 0) - 1;
    const prevIdx = Math.max(0, idx);
    _currentSystemIndex = prevIdx;
    showOnlySystem(prevIdx);
    if (window.systemPlayer) window.systemPlayer.currentIndex = prevIdx;
}

// ----------------------- end 系统逐条播放功能 -----------------------

// ==================== 静态版本：直接从本地加载数据 ====================

async function handleLoadData() {
    const piecePresetEl = document.getElementById('piecePreset');
    const presetId = piecePresetEl?.value;

    if (!presetId || !piecePresets[presetId]) {
        updateStatus('请从下拉菜单中选择一个曲目预设', 'error', 'status_fill_score_path');
        return;
    }

    const preset = piecePresets[presetId];

    // 显示加载模态框
    const loadingModalEl = document.getElementById('loadingModal');
    const loadingModal = loadingModalEl ? new bootstrap.Modal(loadingModalEl) : null;
    if (loadingModal) loadingModal.show();
    const loadingText = document.getElementById('loadingText');
    
    const btn = document.getElementById('loadBtn');
    if (btn) btn.disabled = true;

    try {
        loadingText.textContent = window.t ? window.t('loading_modal_analyzing') : '正在加载数据...';
        
        // 1. 加载分析数据（JSON）
        updateStatus('正在加载分析数据...', 'info');
        let dataResponse;
        try {
            dataResponse = await fetch(preset.data_file);
            if (!dataResponse.ok) {
                throw new Error(`数据文件加载失败: ${dataResponse.status}`);
            }
        } catch (e) {
            throw new Error(`无法加载数据文件 ${preset.data_file}: ${e.message}`);
        }
        
        currentData = await dataResponse.json();
        console.log('✅ 数据加载成功');

        // 2. 加载乐谱文件
        loadingText.textContent = window.t ? window.t('status_loading_score') : '正在加载乐谱...';
        updateStatus('正在加载乐谱...', 'info');
        
        let scoreResponse;
        try {
            scoreResponse = await fetch(preset.score_path);
            if (!scoreResponse.ok) {
                throw new Error(`乐谱文件加载失败: ${scoreResponse.status}`);
            }
        } catch (e) {
            throw new Error(`无法加载乐谱文件 ${preset.score_path}: ${e.message}`);
        }
        
        const xmlText = await scoreResponse.text();
        console.log('✅ 乐谱加载成功，长度:', xmlText.length);

        // 3. 更新层级选择器
        if (currentData && currentData.minima_levels_mapped_to_beats) {
            const nLevels = currentData.minima_levels_mapped_to_beats.length;
            
            const levelSlider = document.getElementById('levelSlider');
            const levelDisplay = document.getElementById('levelDisplay');
            if (levelSlider && nLevels > 0) {
                levelSlider.max = nLevels;
                levelSlider.value = 1;
                if (levelDisplay) {
                    levelDisplay.textContent = `Level: 1 / ${nLevels}`;
                }
            }
        }

        // 4. 渲染乐谱
        await renderScoreBySystems(xmlText);

        // 5. 隐藏模态框
        if (loadingModal) {
            loadingModal.hide();
            setTimeout(() => {
                const modalElement = document.getElementById('loadingModal');
                if (modalElement) {
                    modalElement.classList.remove('show');
                    modalElement.style.display = 'none';
                    document.body.classList.remove('modal-open');
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) backdrop.remove();
                }
            }, 100);
        }

        // 6. 绘制速度曲线
        drawTempoCurve();
        
        // 7. 开始单行播放模式
        startSystemPlayback(5000);
        updateStatus(`✅ ${preset.label} 加载完成`, 'success', 'status_single_line_mode');
        
    } catch (error) {
        if (loadingModal) {
            loadingModal.hide();
            setTimeout(() => {
                const modalElement = document.getElementById('loadingModal');
                if (modalElement) {
                    modalElement.classList.remove('show');
                    modalElement.style.display = 'none';
                    document.body.classList.remove('modal-open');
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) backdrop.remove();
                }
            }, 100);
        }
        updateStatus(`${window.t ? window.t('status_error') : '错误'}: ${error.message}`, 'error');
        console.error('加载错误:', error);
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function loadAndRenderScore(scorePath) {
    try {
        updateStatus('加载乐谱...', 'info', 'status_loading_score');
        
        const response = await fetch(scorePath);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('加载乐谱失败:', response.status, errorText);
            throw new Error(`无法加载乐谱文件: ${response.status}`);
        }
        const xmlText = await response.text();
        console.log('乐谱文件加载成功，长度:', xmlText.length);

        clearAllSystems();
        await renderScoreBySystems(xmlText);

        updateStatus('乐谱渲染完成！', 'success', 'status_score_rendered');
        try { drawTempoCurve(); } catch (e) { console.warn('drawTempoCurve failed', e); }
    } catch (error) {
        updateStatus(`${window.t ? window.t('status_score_load_failed') : '加载乐谱失败'}: ${error.message}`, 'error');
        console.error('加载乐谱错误详情:', error);
    }
}

// ==================== 以下代码与原版 app_modern.js 相同 ====================

async function renderScoreBySystems(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    const measures = xmlDoc.querySelectorAll('measure');
    if (measures.length === 0) {
        throw new Error('无法解析MusicXML中的小节');
    }

    const systems = [];
    let currentSystem = [];

    for (let i = 0; i < measures.length; i++) {
        const measure = measures[i];
        const printElement = measure.querySelector('print');

        if (printElement && printElement.getAttribute('new-system') === 'yes') {
            if (currentSystem.length > 0) {
                systems.push(currentSystem);
            }
            currentSystem = [measure];
        } else {
            currentSystem.push(measure);
        }
    }

    if (currentSystem.length > 0) {
        systems.push(currentSystem);
    }

    if (systems.length === 1 && systems[0].length === measures.length) {
        console.log('未找到 new-system 标记，使用固定分组方式（每行8个小节）');
        const measuresPerSystem = 8;
        const fallbackSystems = [];
        for (let i = 0; i < measures.length; i += measuresPerSystem) {
            fallbackSystems.push(Array.from(measures).slice(i, i + measuresPerSystem));
        }
        systems.splice(0, systems.length, ...fallbackSystems);
    }

    console.log(`将 ${measures.length} 个小节分为 ${systems.length} 个系统（基于 new-system 标记）`);

    const container = document.getElementById('osmdContainer');
    container.innerHTML = '';

    for (let systemIndex = 0; systemIndex < systems.length; systemIndex++) {
        const systemMeasures = systems[systemIndex];

        const systemDiv = document.createElement('div');
        systemDiv.className = 'osmd-system mb-3';
        systemDiv.style.width = '100%';
        systemDiv.style.minHeight = '100px';
        systemDiv.style.position = 'relative';
        systemDiv.style.overflow = 'visible';
        container.appendChild(systemDiv);

        const systemXml = createSystemXML(xmlDoc, systemMeasures, systemIndex);

        const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(systemDiv, {
            autoResize: false,
            backend: 'svg',
            drawTitle: false,
            drawComposer: systemIndex === 0,
            drawPartNames: systemIndex === 0,
            drawMeasureNumbers: true,
            measureNumberInterval: 1,
            disableCursor: false,
            pageFormat: 'Endless',
            disableAutomaticLineBreaks: true,
            newSystemFromXML: true,
        });

        await osmd.load(systemXml);
        await osmd.render();

        const svgElement = systemDiv.querySelector('svg');
        if (svgElement) {
            svgElement.style.pointerEvents = 'none';
            svgElement.style.position = 'static';
        }

        const measureStartIndex = systemIndex === 0 ? 0 : systems.slice(0, systemIndex).reduce((sum, arr) => sum + arr.length, 0);
        osmdSystems.push({
            osmd: osmd,
            container: systemDiv,
            measures: systemMeasures,
            systemIndex: systemIndex,
            measureStartIndex: measureStartIndex
        });

        console.log(`系统 ${systemIndex + 1} 渲染完成`);

        try {
            drawFiveSplitLinesForSystem(osmd, systemDiv, systemMeasures, systemIndex, measureStartIndex);

            const resizeHandler = () => {
                try {
                    osmd.render();
                } catch (e) {
                    console.warn('resizeHandler: osmd.render 失败', e);
                }
                drawFiveSplitLinesForSystem(osmd, systemDiv, systemMeasures, systemIndex, measureStartIndex);
            };
            window.addEventListener('resize', resizeHandler);

            const overlayObserver = new MutationObserver((mutationsList) => {
                try {
                    if (systemDiv._overlayUpdating) return;

                    const onlyOverlayChanges = mutationsList.every(m => {
                        const nodes = [...(m.addedNodes || []), ...(m.removedNodes || [])];
                        if (nodes.length === 0) return false;
                        return nodes.every(n => {
                            if (!(n instanceof Element)) return false;
                            return !!n.closest && !!n.closest('.minima-overlay');
                        });
                    });
                    if (onlyOverlayChanges) return;

                    clearTimeout(systemDiv._overlayRedrawTimeout);
                    systemDiv._overlayRedrawTimeout = setTimeout(() => {
                        drawFiveSplitLinesForSystem(osmd, systemDiv, systemMeasures, systemIndex, measureStartIndex);
                    }, 120);
                } catch (e) {
                    console.warn('overlayObserver callback 错误', e);
                }
            });
            overlayObserver.observe(systemDiv, { childList: true, subtree: true });

            const last = osmdSystems[osmdSystems.length - 1];
            if (last) {
                last._overlayResizeHandler = resizeHandler;
                last._overlayObserver = overlayObserver;
            }
        } catch (e) {
            console.warn('绘制等分竖线或注册监听失败:', e);
        }
    }
}

function createSystemXML(originalXmlDoc, measures, systemIndex) {
    const newXmlDoc = originalXmlDoc.cloneNode(true);

    const allMeasures = newXmlDoc.querySelectorAll('measure');
    allMeasures.forEach(measure => measure.remove());

    const parts = newXmlDoc.querySelectorAll('part');
    const originalParts = originalXmlDoc.querySelectorAll('part');
    const partAttributes = [];
    for (let p = 0; p < originalParts.length; p++) {
        const firstMeasure = originalParts[p].querySelector('measure');
        const attrs = firstMeasure ? firstMeasure.querySelector('attributes') : null;
        partAttributes.push(attrs ? attrs.cloneNode(true) : null);
    }

    parts.forEach((part, partIndex) => {
        let insertedAttrsForPart = false;
        const originalPart = originalXmlDoc.querySelectorAll('part')[partIndex];
        const fallbackAttrs = partAttributes[partIndex];

        let fallbackDivisions = 1;
        let fallbackBeats = 4;
        let fallbackStaves = 1;
        try {
            if (fallbackAttrs) {
                const dEl = fallbackAttrs.querySelector('divisions');
                if (dEl && dEl.textContent) fallbackDivisions = parseInt(dEl.textContent) || fallbackDivisions;
                const timeEl = fallbackAttrs.querySelector('time');
                if (timeEl) {
                    const bEl = timeEl.querySelector('beats');
                    if (bEl && bEl.textContent) fallbackBeats = parseInt(bEl.textContent) || fallbackBeats;
                }
                const stavesEl = fallbackAttrs.querySelector('staves');
                if (stavesEl && stavesEl.textContent) fallbackStaves = parseInt(stavesEl.textContent) || fallbackStaves;
            }
        } catch (e) {}

        measures.forEach((measure, mIdx) => {
            const measureNumber = measure.getAttribute && measure.getAttribute('number') ? measure.getAttribute('number') : String(mIdx + 1);
            let appended = false;

            if (originalPart) {
                const originalMeasure = originalPart.querySelector(`measure[number="${measureNumber}"]`);
                if (originalMeasure) {
                    const clonedMeasure = originalMeasure.cloneNode(true);
                    if (!insertedAttrsForPart && !clonedMeasure.querySelector('attributes')) {
                        if (fallbackAttrs) {
                            clonedMeasure.insertBefore(fallbackAttrs.cloneNode(true), clonedMeasure.firstChild);
                        }
                        insertedAttrsForPart = true;
                    }
                    part.appendChild(clonedMeasure);
                    appended = true;
                }
            }

            if (!appended) {
                const placeholder = newXmlDoc.createElement('measure');
                placeholder.setAttribute('number', measureNumber);

                if (!insertedAttrsForPart && fallbackAttrs) {
                    placeholder.appendChild(fallbackAttrs.cloneNode(true));
                    insertedAttrsForPart = true;
                }

                const durationValue = Math.max(1, (fallbackDivisions || 1) * (fallbackBeats || 4));
                for (let s = 1; s <= Math.max(1, fallbackStaves); s++) {
                    const note = newXmlDoc.createElement('note');
                    const rest = newXmlDoc.createElement('rest');
                    note.appendChild(rest);
                    const durationEl = newXmlDoc.createElement('duration');
                    durationEl.textContent = String(durationValue);
                    note.appendChild(durationEl);
                    const voiceEl = newXmlDoc.createElement('voice');
                    voiceEl.textContent = '1';
                    note.appendChild(voiceEl);
                    const typeEl = newXmlDoc.createElement('type');
                    typeEl.textContent = 'whole';
                    note.appendChild(typeEl);
                    if (s > 1) {
                        const staffEl = newXmlDoc.createElement('staff');
                        staffEl.textContent = String(s);
                        note.appendChild(staffEl);
                    }
                    placeholder.appendChild(note);
                }

                part.appendChild(placeholder);
            }
        });
    });

    const serializer = new XMLSerializer();
    let xmlString = serializer.serializeToString(newXmlDoc);

    if (!xmlString.startsWith('<?xml')) {
        xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString;
    }

    return xmlString;
}

function clearAllSystems() {
    osmdSystems.forEach(system => {
        try {
            if (system._overlayObserver && typeof system._overlayObserver.disconnect === 'function') {
                system._overlayObserver.disconnect();
            }
            if (system._overlayResizeHandler) {
                window.removeEventListener('resize', system._overlayResizeHandler);
            }
            if (system.container) {
                system.container.innerHTML = '';
            }
        } catch (e) {
            console.warn('clearAllSystems 清理单个 system 时出错:', e);
        }
    });
    osmdSystems = [];

    const container = document.getElementById('osmdContainer');
    if (container) {
        container.innerHTML = '';
    }
    try {
        const chartCard = document.getElementById('curveChartCard');
        if (chartCard) chartCard.style.display = 'none';
        if (tempoChart) {
            try { tempoChart.destroy(); } catch (e) {}
            tempoChart = null;
        }
    } catch (e) {}
}

let _statusBarI18n = null;

function updateStatus(message, type = 'info', i18nKey = null) {
    const statusEl = document.getElementById('status');
    if (!statusEl) return;

    const text = i18nKey ? (window.t ? window.t(i18nKey) : message) : message;
    if (i18nKey) {
        _statusBarI18n = { key: i18nKey, type };
    } else {
        _statusBarI18n = null;
    }

    statusEl.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} d-block`;
    statusEl.textContent = text;
    statusEl.classList.remove('d-none');

    if (type === 'success') {
        setTimeout(() => {
            statusEl.classList.add('d-none');
        }, 3000);
    }
}

function refreshStatusBarForLang() {
    if (!_statusBarI18n) return;
    const statusEl = document.getElementById('status');
    if (!statusEl || statusEl.classList.contains('d-none')) return;
    const { key, type } = _statusBarI18n;
    const text = window.t ? window.t(key) : key;
    statusEl.textContent = text;
    statusEl.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} d-block`;
}

document.addEventListener('lang-changed', refreshStatusBarForLang);

function drawFiveSplitLinesForSystem(osmd, systemDiv, systemMeasures, systemIndex, measureStartIndex = 0) {
    try {
        if (systemDiv) systemDiv._overlayUpdating = true;
        const svg = systemDiv.querySelector('svg');
        if (!svg) {
            console.warn('drawFiveSplitLinesForSystem: 未找到 SVG');
            return;
        }

        let currentLevelMinima = [];
        let nLevels = 1;
        let currentLevel = 1;
        
        if (currentData && currentData.minima_levels_mapped_to_beats) {
            nLevels = currentData.minima_levels_mapped_to_beats.length;
            const levelSlider = document.getElementById('levelSlider');
            currentLevel = levelSlider ? parseInt(levelSlider.value) || 1 : 1;
            
            if (currentLevel > 0 && currentLevel <= nLevels) {
                currentLevelMinima = currentData.minima_levels_mapped_to_beats[currentLevel - 1] || [];
            }
        }
        
        const BEATS_PER_MEASURE = 4;
        const minimaMeasureBeats = new Set();
        
        for (const minima of currentLevelMinima) {
            if (minima.beat_index !== null && minima.beat_index !== undefined) {
                const beatIdx = parseInt(minima.beat_index);
                const measureIndex = Math.floor(beatIdx / BEATS_PER_MEASURE);
                const beat = beatIdx % BEATS_PER_MEASURE;
                minimaMeasureBeats.add(`${measureIndex}-${beat}`);
            }
        }
        
        const shouldDrawMinimaOnly = minimaMeasureBeats.size > 0;

        let overlayGroup = svg.querySelector('g.minima-overlay');
        if (!overlayGroup) {
            overlayGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            overlayGroup.setAttribute('class', 'minima-overlay');
            overlayGroup.style.pointerEvents = 'none';
            let targetGroup = null;
            const groups = Array.from(svg.querySelectorAll('g'));
            for (const g of groups) {
                if (g.querySelector('path, rect, circle, ellipse, polygon, polyline, text')) {
                    targetGroup = g;
                    break;
                }
            }
            if (!targetGroup) targetGroup = svg;
            targetGroup.appendChild(overlayGroup);
        }

        while (overlayGroup.firstChild) {
            overlayGroup.removeChild(overlayGroup.firstChild);
        }

        try {
        } catch (e) {}
        while (overlayGroup.firstChild) overlayGroup.removeChild(overlayGroup.firstChild);

        let totalLines = 0;

        let osmdMinX = Infinity, osmdMinY = Infinity, osmdMaxX = -Infinity, osmdMaxY = -Infinity;
        
        const measureGraphics = [];
        
        for (let mi = 0; mi < systemMeasures.length; mi++) {
            const measuresAtIndex = findMeasuresAtIndex(osmd, mi, 0);
            
            for (let msIdx = 0; msIdx < measuresAtIndex.length; msIdx++) {
                const m = measuresAtIndex[msIdx];
                if (!m) continue;
                const pos = m.PositionAndShape && m.PositionAndShape.AbsolutePosition;
                const size = m.PositionAndShape && m.PositionAndShape.Size;
                if (!pos || !size) continue;
                measureGraphics.push({ m, pos, size, xmlNumber: mi + 1, musicSystemIndex: msIdx, staffLineIndex: 0 });
                
                osmdMinX = Math.min(osmdMinX, pos.x);
                osmdMinY = Math.min(osmdMinY, pos.y);
                osmdMaxX = Math.max(osmdMaxX, pos.x + size.width);
                osmdMaxY = Math.max(osmdMaxY, pos.y + size.height);
            }
        }
        
        const graphicsByRow = {};
        for (const mg of measureGraphics) {
            const rowIdx = mg.musicSystemIndex;
            if (!graphicsByRow[rowIdx]) graphicsByRow[rowIdx] = [];
            graphicsByRow[rowIdx].push(mg);
        }
        const rowIndices = Object.keys(graphicsByRow).map(Number).sort((a, b) => a - b);
        
        const rowYOffsets = {};
        for (const rowIdx of rowIndices) {
            const rowMeasures = graphicsByRow[rowIdx];
            let rowMinY = Infinity, rowMaxY = -Infinity;
            for (const mg of rowMeasures) {
                rowMinY = Math.min(rowMinY, mg.pos.y);
                rowMaxY = Math.max(rowMaxY, mg.pos.y + mg.size.height);
            }
            const rowHeight = rowMaxY - rowMinY;
            const offset = (rowIdx - 0.5) * rowHeight * 0.33;
            rowYOffsets[rowIdx] = -offset;
        }

        let appliedScaleX = 1;
        let appliedScaleY = 1;
        if (measureGraphics.length > 0) {
            try {
                let bbox = computeSystemUnionBBox(svg, osmdMinX, osmdMinY, osmdMaxX, osmdMaxY) || computeContentUnionBBox(svg);
                if (!bbox) {
                    const firstGraphic = svg.querySelector('path, rect, circle, ellipse, polygon, polyline, text');
                    if (firstGraphic && typeof firstGraphic.getBBox === 'function') {
                        bbox = firstGraphic.getBBox();
                    }
                }
                if (bbox) {
                    const osmdWidth = (osmdMaxX - osmdMinX) || 1;
                    const osmdHeight = (osmdMaxY - osmdMinY) || 1;
                    let scaleX = bbox.width / osmdWidth;
                    let scaleY = bbox.height > 0 ? (bbox.height / osmdHeight) : scaleX;
                    if (!isFinite(scaleX) || scaleX === 0) scaleX = 1;
                    if (!isFinite(scaleY) || scaleY === 0) scaleY = scaleX;
                    const e = bbox.x - scaleX * osmdMinX;
                    const f = bbox.y - scaleY * osmdMinY;
                    overlayGroup.setAttribute('transform', `matrix(${scaleX},0,0,${scaleY},${e},${f})`);
                    appliedScaleX = scaleX;
                    appliedScaleY = scaleY;
                }
            } catch (e) {}
        }

        const staffLineHeights = {};
        
        const rowData = {};
        for (const mEntry of measureGraphics) {
            const rowIdx = mEntry.musicSystemIndex;
            if (!rowData[rowIdx]) {
                rowData[rowIdx] = [];
            }
            const pos = mEntry.pos;
            const size = mEntry.size;
            if (pos && size) {
                rowData[rowIdx].push({
                    posY: pos.y,
                    sizeHeight: size.height
                });
            }
        }
        
        for (const rowIdx of Object.keys(rowData)) {
            const entries = rowData[rowIdx];
            if (entries.length === 0) continue;
            
            let sumPosY = 0, sumHeight = 0;
            for (const entry of entries) {
                sumPosY += entry.posY;
                sumHeight += entry.sizeHeight;
            }
            const avgPosY = sumPosY / entries.length;
            const avgHeight = sumHeight / entries.length;
            
            const staffSpan = avgHeight * 0.85;
            const staffCenterY = avgPosY + avgHeight * 0.5;
            
            staffLineHeights[rowIdx] = {
                staffTopY: staffCenterY - staffSpan / 2,
                staffBottomY: staffCenterY + staffSpan / 2,
                lineHeight: staffSpan
            };
        }
        
        for (let mi = 0; mi < measureGraphics.length; mi++) {
            const mEntry = measureGraphics[mi];
            const m = mEntry.m;
            var pos = mEntry.pos;
            var size = mEntry.size;
            
            const rowIdx = mEntry.musicSystemIndex;
            const staffHeightInfo = staffLineHeights[rowIdx] || { staffTopY: pos.y, staffBottomY: pos.y + 40 };
            
            let staffTopY = staffHeightInfo.staffTopY;
            let staffBottomY = staffHeightInfo.staffBottomY;
            
            const isSystemFirstMeasure = (mi === 0) || (mi > 0 && measureGraphics[mi].musicSystemIndex !== measureGraphics[mi - 1].musicSystemIndex);
            const isFirstMeasureInScore = (mi === 0);
            
            const desiredPixelOffset = isFirstMeasureInScore ? 90 : (isSystemFirstMeasure ? 60 : 0);
            let offsetInOsmd = 0;
            try {
                offsetInOsmd = desiredPixelOffset > 0 ? (desiredPixelOffset / Math.max(1e-6, appliedScaleX)) : 0;
            } catch (e) {
                offsetInOsmd = desiredPixelOffset;
            }
            const extraOffset = isSystemFirstMeasure ? Math.min(size.width * 0.22, offsetInOsmd) : 0;
            
            const measureStartX = pos.x + extraOffset;
            
            const rowYOffset = rowYOffsets[mEntry.musicSystemIndex] || 0;
            staffTopY += rowYOffset;
            staffBottomY += rowYOffset;
            
            const staffHeight = staffBottomY - staffTopY;
            
            const shrinkX = 0.02;
            
            let effectiveMeasureWidth = size.width;
            if (isSystemFirstMeasure && extraOffset > 0) {
                effectiveMeasureWidth = size.width - extraOffset;
            }
            
            for (let beat = 0; beat < 4; beat++) {
                const globalMeasureIndex = measureStartIndex + mi;
                if (shouldDrawMinimaOnly && !minimaMeasureBeats.has(`${globalMeasureIndex}-${beat}`)) {
                    continue;
                }
                
                const beatStartFrac = beat / 4.0;
                const beatEndFrac = (beat + 1) / 4.0;
                
                const effectiveStartFrac = beatStartFrac + shrinkX;
                const effectiveEndFrac = beatEndFrac - shrinkX;
                const effectiveWidth = effectiveEndFrac - effectiveStartFrac;
                
                const rectX = measureStartX + effectiveStartFrac * effectiveMeasureWidth;
                const rectWidth = effectiveWidth * effectiveMeasureWidth;
                
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', String(rectX));
                rect.setAttribute('y', String(staffTopY));
                rect.setAttribute('width', String(rectWidth));
                rect.setAttribute('height', String(staffHeight));
                
                const colors = [
                    'rgba(255, 100, 100, 0.15)',
                    'rgba(100, 255, 150, 0.15)',
                    'rgba(100, 150, 255, 0.15)',
                    'rgba(255, 200, 100, 0.15)'
                ];
                rect.setAttribute('fill', colors[beat]);
                rect.setAttribute('stroke', colors[beat].replace('0.15', '0.6'));
                rect.setAttribute('stroke-width', '1');
                rect.setAttribute('class', 'beat-rect');
                rect.style.pointerEvents = 'none';
                
                overlayGroup.appendChild(rect);
                totalLines++;
            }
        }
    } catch (error) {
        console.error('drawFiveSplitLinesForSystem 出错:', error);
    }
    finally {
        if (systemDiv) {
            systemDiv._overlayUpdating = false;
        }
    }
}

function findMeasureGraphic(osmd, measureNumber) {
    try {
        if (!osmd || !osmd.GraphicSheet || !osmd.GraphicSheet.MusicPages) return null;
        for (const page of osmd.GraphicSheet.MusicPages) {
            if (!page.MusicSystems) continue;
            for (const musicSystem of page.MusicSystems) {
                if (!musicSystem.StaffLines) continue;
                for (const staffLine of musicSystem.StaffLines) {
                    if (!staffLine.Measures) continue;
                    for (const measure of staffLine.Measures) {
                        if (measure.MeasureNumber === measureNumber) {
                            return measure;
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.error('findMeasureGraphic 出错:', e);
    }
    return null;
}

function findMeasureGraphicByStaffLineIndex(osmd, staffLineIndex, measureIndex) {
    try {
        if (!osmd || !osmd.GraphicSheet || !osmd.GraphicSheet.MusicPages) return null;
        for (const page of osmd.GraphicSheet.MusicPages) {
            if (!page.MusicSystems) continue;
            for (const musicSystem of page.MusicSystems) {
                if (!musicSystem.StaffLines || musicSystem.StaffLines.length <= staffLineIndex) continue;
                const staffLine = musicSystem.StaffLines[staffLineIndex];
                if (!staffLine.Measures || staffLine.Measures.length <= measureIndex) continue;
                return staffLine.Measures[measureIndex];
            }
        }
    } catch (e) {
        console.error('findMeasureGraphicByStaffLineIndex 出错:', e);
    }
    return null;
}

function getStaffLineCount(osmd) {
    try {
        if (!osmd || !osmd.GraphicSheet || !osmd.GraphicSheet.MusicPages) return 1;
        for (const page of osmd.GraphicSheet.MusicPages) {
            if (!page.MusicSystems) continue;
            for (const musicSystem of page.MusicSystems) {
                if (!musicSystem.StaffLines) continue;
                return musicSystem.StaffLines.length;
            }
        }
    } catch (e) {}
    return 1;
}

function findMeasuresAtIndex(osmd, measureIndex, staffLineIndex = 0) {
    const measures = [];
    try {
        if (!osmd || !osmd.GraphicSheet || !osmd.GraphicSheet.MusicPages) return measures;
        for (const page of osmd.GraphicSheet.MusicPages) {
            if (!page.MusicSystems) continue;
            for (const musicSystem of page.MusicSystems) {
                if (!musicSystem.StaffLines || musicSystem.StaffLines.length <= staffLineIndex) continue;
                const staffLine = musicSystem.StaffLines[staffLineIndex];
                if (!staffLine.Measures || staffLine.Measures.length <= measureIndex) continue;
                measures.push(staffLine.Measures[measureIndex]);
            }
        }
    } catch (e) {
        console.error('findMeasuresAtIndex 出错:', e);
    }
    return measures;
}

function findMusicSystemForMeasure(osmd, targetMeasure) {
    try {
        if (!osmd || !osmd.GraphicSheet || !osmd.GraphicSheet.MusicPages) return null;
        for (const page of osmd.GraphicSheet.MusicPages) {
            if (!page.MusicSystems) continue;
            for (const musicSystem of page.MusicSystems) {
                if (!musicSystem.StaffLines) continue;
                for (let si = 0; si < musicSystem.StaffLines.length; si++) {
                    const staffLine = musicSystem.StaffLines[si];
                    if (!staffLine.Measures) continue;
                    for (const measure of staffLine.Measures) {
                        if (measure === targetMeasure) {
                            return { musicSystem, staffIndex: si, staffLines: musicSystem.StaffLines };
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.error('findMusicSystemForMeasure 出错:', e);
    }
    return null;
}

function computeContentUnionBBox(svg) {
    try {
        const elems = Array.from(svg.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, text'));
        let union = null;
        for (const el of elems) {
            try {
                if (el.closest && el.closest('.minima-overlay')) continue;
                if (typeof el.getBBox !== 'function') continue;
                const b = el.getBBox();
                const ctm = el.getCTM ? el.getCTM() : svg.getCTM ? svg.getCTM() : null;
                const p = svg.createSVGPoint();
                const corners = [
                    { x: b.x, y: b.y },
                    { x: b.x + b.width, y: b.y },
                    { x: b.x, y: b.y + b.height },
                    { x: b.x + b.width, y: b.y + b.height }
                ];
                for (const c of corners) {
                    p.x = c.x; p.y = c.y;
                    const tp = ctm ? p.matrixTransform(ctm) : p;
                    if (!union) {
                        union = { x: tp.x, y: tp.y, x2: tp.x, y2: tp.y };
                    } else {
                        union.x = Math.min(union.x, tp.x);
                        union.y = Math.min(union.y, tp.y);
                        union.x2 = Math.max(union.x2, tp.x);
                        union.y2 = Math.max(union.y2, tp.y);
                    }
                }
            } catch (e) {
                continue;
            }
        }
        if (!union) return null;
        return { x: union.x, y: union.y, width: Math.max(0, union.x2 - union.x), height: Math.max(0, union.y2 - union.y) };
    } catch (e) {
        console.warn('computeContentUnionBBox failed', e);
        return null;
    }
}

function computeSystemUnionBBox(svg, osmdMinX, osmdMinY, osmdMaxX, osmdMaxY) {
    try {
        const svgCTM = svg.getScreenCTM();
        if (!svgCTM) return null;

        const pt = svg.createSVGPoint();
        const corners = [
            { x: osmdMinX, y: osmdMinY },
            { x: osmdMaxX, y: osmdMinY },
            { x: osmdMinX, y: osmdMaxY },
            { x: osmdMaxX, y: osmdMaxY }
        ].map(c => {
            pt.x = c.x; pt.y = c.y;
            const sp = pt.matrixTransform(svgCTM);
            return { x: sp.x, y: sp.y };
        });
        const sysScreenMinX = Math.min(...corners.map(c => c.x));
        const sysScreenMaxX = Math.max(...corners.map(c => c.x));
        const sysScreenMinY = Math.min(...corners.map(c => c.y));
        const sysScreenMaxY = Math.max(...corners.map(c => c.y));

        const elems = Array.from(svg.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, text'));
        let union = null;
        for (const el of elems) {
            try {
                if (el.closest && el.closest('.minima-overlay')) continue;
                const clientRect = el.getBoundingClientRect();
                if (clientRect.right < sysScreenMinX || clientRect.left > sysScreenMaxX ||
                    clientRect.bottom < sysScreenMinY || clientRect.top > sysScreenMaxY) {
                    continue;
                }

                if (typeof el.getBBox !== 'function') continue;
                const b = el.getBBox();
                const elCTM = el.getCTM ? el.getCTM() : null;
                const p = svg.createSVGPoint();
                const elCorners = [
                    { x: b.x, y: b.y },
                    { x: b.x + b.width, y: b.y },
                    { x: b.x, y: b.y + b.height },
                    { x: b.x + b.width, y: b.y + b.height }
                ];
                for (const c of elCorners) {
                    p.x = c.x; p.y = c.y;
                    const tp = elCTM ? p.matrixTransform(elCTM) : p;
                    if (!union) {
                        union = { x: tp.x, y: tp.y, x2: tp.x, y2: tp.y };
                    } else {
                        union.x = Math.min(union.x, tp.x);
                        union.y = Math.min(union.y, tp.y);
                        union.x2 = Math.max(union.x2, tp.x);
                        union.y2 = Math.max(union.y2, tp.y);
                    }
                }
            } catch (e) {
                continue;
            }
        }
        if (!union) return null;
        return { x: union.x, y: union.y, width: Math.max(0, union.x2 - union.x), height: Math.max(0, union.y2 - union.y) };
    } catch (e) {
        console.warn('computeSystemUnionBBox failed', e);
        return null;
    }
}
