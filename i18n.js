// Simple client-side i18n helper (Chinese <-> English)
(function(window){
    const STORAGE_KEY = 'nv_lang';
    const defaultLang = 'zh';

    // Translation entries: selector, attr ('text'|'html'|'placeholder'|'value'|'title'), zh, en
    const entries = [
        {s: 'title', attr: 'text', zh: '最小能量点查看器 - OSMD', en: 'Minima Viewer - OSMD'},
        {s: 'header h1, .navbar-brand strong', attr: 'text', zh: '音乐表现力分析系统', en: 'Expressiveness Analysis'},
        {s: '#scorePath', attr: 'placeholder', zh: 'score.mxl 或 score.musicxml', en: 'score.mxl or score.musicxml'},
        {s: '#midiPath', attr: 'placeholder', zh: 'perf.mid', en: 'perf.mid'},
        {s: '#alignmentFile', attr: 'placeholder', zh: 'alignment.json 或 alignment.csv 或 *.match', en: 'alignment.json or alignment.csv or *.match'},
        {s: '#analyzeBtn', attr: 'text', zh: '开始分析', en: 'Analyze'},
        {s: '#levelDisplay', attr: 'text', zh: 'Level: 1', en: 'Level: 1'},
        {s: '.card-header h5, header h1', attr: 'text', zh: '分析设置', en: 'Analysis Settings'},
        {s: '.nav-link[data-bs-target="#score-pane"]', attr: 'text', zh: '乐谱视图', en: 'Score View'},
        {s: '.nav-link[data-bs-target="#chart-pane"]', attr: 'text', zh: '速度曲线', en: 'Tempo Curve'},
        {s: '#helpModal .modal-title', attr: 'text', zh: '使用帮助', en: 'Help'},
        {s: '#helpModal h6:first-of-type', attr: 'text', zh: '功能说明', en: 'Features'},
        {s: '#helpModal .modal-footer button', attr: 'text', zh: '关闭', en: 'Close'},
        // small helper texts
        {s: '.form-text.text-muted, .control-group small', attr: 'text', zh: '支持 MusicXML (.xml/.mxl/.musicxml) 或 MIDI (.mid/.midi)', en: 'Supports MusicXML (.xml/.mxl/.musicxml) or MIDI (.mid/.midi)'},
    ];

    function getLang(){
        try {
            return localStorage.getItem(STORAGE_KEY) || defaultLang;
        } catch(e){ return defaultLang; }
    }
    function setLang(lang){
        try { localStorage.setItem(STORAGE_KEY, lang); } catch(e){}
        applyLang(lang);
    }

    function applyLang(lang){
        entries.forEach(entry => {
            const nodes = document.querySelectorAll(entry.s);
            nodes.forEach(node => {
                const text = lang === 'en' ? entry.en : entry.zh;
                if (!text) return;
                if (entry.attr === 'text') node.textContent = text;
                else if (entry.attr === 'html') node.innerHTML = text;
                else if (entry.attr === 'placeholder') node.setAttribute('placeholder', text);
                else if (entry.attr === 'value') node.value = text;
                else if (entry.attr === 'title') node.setAttribute('title', text);
            });
        });
        // Apply data-i18n attributes: supports data-i18n (textContent) and data-i18n-attr="placeholder|title|value|html"
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (!key) return;
            const translated = (lang === 'en' ? translations[key]?.en : translations[key]?.zh) || null;
            if (translated !== null && typeof translated !== 'undefined') {
                const attr = el.getAttribute('data-i18n-attr') || 'text';
                if (attr === 'text') el.textContent = translated;
                else if (attr === 'html') el.innerHTML = translated;
                else el.setAttribute(attr, translated);
            }
        });
        // update language selector UI if present
        const sel = document.getElementById('langSelect');
        if (sel) sel.value = lang;
        // notify app about language change
        try {
            document.dispatchEvent(new CustomEvent('lang-changed', { detail: { lang } }));
        } catch (e) {}
    }

    // shared translations map (keys used by data-i18n and t())
    const translations = {
        // Button labels
        'btn_analyze': {zh: '开始分析', en: 'Analyze'},
        'btn_analyze_text': {zh: '开始分析', en: 'Analyze'},
        'btn_analyzing': {zh: '分析中...', en: 'Analyzing...'},
        'btn_load': {zh: '加载数据', en: 'Load Data'},
        'btn_toggle_theme': {zh: '切换深色/浅色模式', en: 'Toggle dark/light theme'},
        'btn_fullscreen': {zh: '全屏', en: 'Fullscreen'},
        'btn_fullscreen_title': {zh: '全屏显示图表', en: 'Show chart in fullscreen'},
        // Navigation & modal
        'nav_help': {zh: '帮助', en: 'Help'},
        'nav_help_text': {zh: '帮助', en: 'Help'},
        'modal_close': {zh: '关闭', en: 'Close'},
        // Labels
        'label_level': {zh: 'Level', en: 'Level'},
        'label_analysis_settings': {zh: '分析设置', en: 'Analysis Settings'},
        'label_score_view': {zh: '乐谱视图', en: 'Score View'},
        'label_tempo_curve': {zh: '速度曲线', en: 'Tempo Curve'},
        'label_file_selection': {zh: '文件选择', en: 'File selection'},
        'label_piece_preset': {zh: '曲目预设', en: 'Piece preset'},
        'label_score_file': {zh: '乐谱文件', en: 'Score file'},
        'label_midi_file': {zh: 'MIDI 演奏文件', en: 'MIDI performance file'},
        'label_alignment_file': {zh: '对齐文件', en: 'Alignment file'},
        'label_annotation_file': {zh: '标注文件', en: 'Annotation file'},
        'label_hierarchy': {zh: '层级选择', en: 'Hierarchy'},
        'label_file_support': {zh: '文件格式支持', en: 'File formats supported'},
        'label_position': {zh: '位置 (节拍)', en: 'Position (beat)'},
        // Helper texts
        'helper_preset': {zh: '选择后自动填充乐谱 / MIDI / 对齐文件路径', en: 'Auto-fill score / MIDI / alignment files when selected'},
        'helper_score_support': {zh: '支持 MusicXML (.xml/.mxl/.musicxml) 或 MIDI (.mid/.midi)', en: 'Supports MusicXML (.xml/.mxl/.musicxml) or MIDI (.mid/.midi)'},
        'helper_alignment_support': {zh: '支持 JSON/CSV/TSV 或 ASAP .match 格式', en: 'Supports JSON/CSV/TSV or ASAP .match'},
        'badge_optional': {zh: '可选', en: 'Optional'},
        // Titles
        'title': {zh: '最小能量点查看器 - OSMD', en: 'Minima Viewer - OSMD'},
        'app_title': {zh: '音乐表现力分析系统', en: 'Expressiveness Analysis'},
        'helper_score_hint': {zh: '💡 提示：乐谱文件支持 MusicXML (.xml/.mxl) 或 MIDI (.mid/.midi)。若使用 MIDI 作为乐谱，系统会自动解析（适用于 ASAP 等数据集）。', en: 'Tip: score files can be MusicXML (.xml/.mxl) or MIDI (.mid/.midi). If using MIDI as score, the system will auto-parse (useful for ASAP dataset).'},
        'features_title': {zh: '功能说明', en: 'Features'},
        'feature_minima': {zh: '最小能量点分析：', en: 'Minima analysis:'},
        'feature_minima_text': {zh: '识别音乐结构中的能量最低点，这些点通常对应音乐的分段或呼吸点', en: 'Identifies low-energy points that often correspond to phrase boundaries or breaths.'},
        'feature_hierarchy': {zh: '层级结构：', en: 'Hierarchy:'},
        'feature_hierarchy_text': {zh: '通过递归分析生成多个层级的能量结构，Level 1 最细粒度，Level 越高越宏观', en: 'Recursively generate multiple energy levels; Level 1 is finest granularity.'},
        'feature_annotations': {zh: '演奏特征标注：', en: 'Annotation:'},
        'feature_annotations_text': {zh: '自动识别速度变化（Faster/Slower）和力度变化（Louder/Softer）', en: 'Automatically detect tempo and dynamic changes (Faster/Slower, Louder/Softer).'},
        'feature_tempo_curve': {zh: '速度曲线：', en: 'Tempo curve:'},
        'feature_tempo_curve_text': {zh: '可视化整个演奏的速度变化趋势', en: 'Visualize tempo changes across the performance.'},
        // Chart labels
        'chart_bpm_label': {zh: '速度 (BPM)', en: 'Tempo (BPM)'},
        'chart_x_label': {zh: '位置 (节拍)', en: 'Position (beat)'},
        // File support
        'file_support_score': {zh: '乐谱：MusicXML (.xml/.mxl/.musicxml) 或 MIDI (.mid/.midi)', en: 'Score: MusicXML (.xml/.mxl/.musicxml) or MIDI (.mid/.midi)'},
        'file_support_alignment': {zh: '对齐文件：JSON/CSV/TSV 或 ASAP .match 格式', en: 'Alignment: JSON/CSV/TSV or ASAP .match'},
        // Placeholders
        'placeholder_score_file': {zh: 'score.mxl 或 score.musicxml', en: 'score.mxl or score.musicxml'},
        'placeholder_midi_file': {zh: 'perf.mid', en: 'perf.mid'},
        'placeholder_alignment_file': {zh: 'alignment.json 或 *.match', en: 'alignment.json or *.match'},
        // Preset labels
        'preset_label_asap_8_1': {zh: 'ASAP 示例：Mozart Sonata 8-1', en: 'ASAP example: Mozart Sonata K. 332 (8-1)'},
        'preset_label_mephisto': {zh: 'Mephisto Waltz No.1, S.514', en: 'Mephisto Waltz No.1, S.514'},
        'preset_manual': {zh: '-- 手动选择 --', en: '-- Manual selection --'},
        'helper_preset': {zh: '选择后自动填充乐谱和对齐文件路径', en: 'Auto-fill score and alignment files when selected'},
        // System player controls
        'system_player_title': {zh: '系统播放', en: 'System Playback'},
        'btn_play': {zh: '播放', en: 'Play'},
        'btn_pause': {zh: '暂停', en: 'Pause'},
        'btn_resume': {zh: '继续', en: 'Resume'},
        'btn_prev_line': {zh: '上一行', en: 'Previous'},
        'btn_next_line': {zh: '下一行', en: 'Next'},
        'btn_show_all': {zh: '显示全部', en: 'Show All'},
        // Status messages
        'status_ready': {zh: '准备就绪。点击"开始分析"按钮开始。', en: 'Ready. Click "Analyze" to start.'},
        'status_loading_score': {zh: '加载乐谱...', en: 'Loading score...'},
        'status_analyzing': {zh: '正在分析，请稍候...', en: 'Analyzing, please wait...'},
        'status_analysis_done': {zh: '分析完成！', en: 'Analysis complete!'},
        'status_fill_paths': {zh: '请填写乐谱和 MIDI 文件路径', en: 'Please fill score and MIDI paths'},
        'status_single_line_mode': {zh: '✅ 单行播放模式已启动', en: '✅ Single-line playback mode started'},
        'status_apply_preset': {zh: '已应用预设', en: 'Applied preset'},
        'status_preset_failed': {zh: '应用预设失败', en: 'Failed to apply preset'},
        'status_fill_score_path': {zh: '请填写乐谱文件路径', en: 'Please fill in the score file path'},
        'status_init_failed': {zh: '初始化失败', en: 'Initialization failed'},
        'status_score_rendered': {zh: '乐谱渲染完成！', en: 'Score rendered!'},
        'status_score_load_failed': {zh: '加载乐谱失败', en: 'Failed to load score'},
        'status_analysis_warning': {zh: '分析警告', en: 'Analysis warning'},
        'status_analysis_failed': {zh: '分析失败', en: 'Analysis failed'},
        'status_continued_rendering': {zh: '已继续渲染乐谱（曲线可能为空）', en: 'Continued rendering score (curve may be empty)'},
        'status_error': {zh: '错误', en: 'Error'},
        'warning_osmd_load': {zh: '警告: OSMD 库可能未正确加载，请刷新页面重试', en: 'Warning: OSMD may not have loaded correctly — please refresh the page'},
        'osmd_init_failed': {zh: 'OSMD 初始化失败', en: 'OSMD initialization failed'},
        'asap_loaded': {zh: '已加载 ASAP 示例路径', en: 'ASAP example paths loaded'},
        // Other messages
        'no_boundaries': {zh: '当前模式下没有可用的乐句边界点', en: 'No boundary points available in current mode'},
        'status_displayed_minima': {zh: '已显示', en: 'Displayed'},
        'no_chart_data': {zh: '没有可显示的图表数据', en: 'No chart data available'},
        'no_minima': {zh: '没有最小能量点', en: 'no minima available'},
        'no_tempo_data': {zh: '暂无速度曲线数据', en: 'No tempo curve data'},
        'anno_faster': {zh: '变快', en: 'Faster'},
        'anno_slower': {zh: '变慢', en: 'Slower'},
        'anno_louder': {zh: '更响', en: 'Louder'},
        'anno_softer': {zh: '更弱', en: 'Softer'},
        'minima_label': {zh: '最小能量点', en: 'Minima'},
        // Loading modal
        'loading_modal_analyzing': {zh: '正在解析文件...', en: 'Parsing files...'},
        'loading': {zh: '加载中...', en: 'Loading...'},
        'analyzing': {zh: '正在分析...', en: 'Analyzing...'},
        'processing_request': {zh: '请稍候，正在处理您的请求', en: 'Please wait, processing your request'},
        // Fullscreen modal
        'tempo_curve_fullscreen_title': {zh: '速度曲线分析 - 全屏视图', en: 'Tempo Curve Analysis - Fullscreen'},
    };

    function t(key){
        const lang = getLang();
        return (translations[key] ? (lang === 'en' ? translations[key].en : translations[key].zh) : key);
    }

    // expose
    window.i18n = {getLang,setLang,t};
    window.t = t;

    // auto-init on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        applyLang(getLang());
        // wire up langSelect if exists
        const sel = document.getElementById('langSelect');
        if (sel){
            sel.addEventListener('change', (e)=> setLang(e.target.value));
        }
    });
})(window);


