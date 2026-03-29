// OSMD 库加载器 - 自动尝试多个 CDN 源

(function() {
    const sources = [
        'https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.7/build/opensheetmusicdisplay.min.js',
        'https://unpkg.com/opensheetmusicdisplay@1.8.7/build/opensheetmusicdisplay.min.js',
        'https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.5/build/dist/opensheetmusicdisplay.min.js',
        'osmd/opensheetmusicdisplay.min.js'
    ];
    
    function loadOSMD(index) {
        if (index >= sources.length) {
            console.error('所有 OSMD CDN 源都加载失败');
            const statusEl = document.getElementById('status');
            if (statusEl) {
                statusEl.innerHTML = '错误: OSMD 库加载失败。<br>' +
                    '解决方案：<br>' +
                    '1. 检查网络连接<br>' +
                    '2. 或下载 OSMD 库到本地';
                statusEl.className = 'alert alert-danger';
            }
            return;
        }
        
        const script = document.createElement('script');
        script.src = sources[index];
        script.async = true;
        
        script.onload = function() {
            console.log('OSMD 加载成功，来源:', sources[index]);
            window.dispatchEvent(new Event('osmd-loaded'));
        };
        
        script.onerror = function() {
            console.warn('OSMD 加载失败，尝试下一个源:', sources[index]);
            loadOSMD(index + 1);
        };
        
        document.head.appendChild(script);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('开始加载 OSMD 库...');
            loadOSMD(0);
        });
    } else {
        console.log('开始加载 OSMD 库...');
        loadOSMD(0);
    }
})();
