// ==UserScript==
// @name         CloudCanal快速复制启动参数
// @namespace    http://tampermonkey.net/
// @version      0.1.20250521
// @description  在页面右下角显示数据任务相关信息，支持快速复制启动参数
// @author       Coolfan1024@Gmail.com
// @match        http://localhost:8111/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';


    // 默认模板
    const DEFAULT_TEMPLATE = `-Dcloudcanal.job.id=\${jobId}
-Dcloudcanal.task.id=\${taskId}
-Dcloudcanal.source.ds.type=\${sourceType}
-Dcloudcanal.target.ds.type=\${targetType}
-Dcloudcanal.task.name=\${dataTaskName}
-Dcloudcanal.llm.embedding.type=\${embeddingProvider}
-Dcloudcanal.llm.chat.type=\${llmProvider}
-Xms4096m
-Xmx4096m
-Xss1m
-XX:+UseParallelGC
-XX:-UseAdaptiveSizePolicy
-XX:SurvivorRatio=4
-XX:NewRatio=1
-XX:ParallelGCThreads=6
-XX:-OmitStackTraceInFastThrow
-XX:+DisableExplicitGC
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=~/logs/cloudcanal/tasks/local/heap
-Xloggc:~/logs/cloudcanal/tasks/local/gc.log
-Djava.awt.headless=true
-Djava.net.preferIPv4Stack=true
-Dfile.encoding=UTF-8`;

    // 获取保存的模板或使用默认模板
    let template = localStorage.getItem('cloudcanal_template') || DEFAULT_TEMPLATE;

    // 等待页面加载完成
    function init() {

        // 从URL中提取jobId
        const url = window.location.href;
        const match = url.match(/\/job\/(\d+)/);
        if (!match) {
            return;
        }

        const jobId = match[1];

        // 创建UI元素
        createFloatingPanel(jobId);

        // 获取数据
        fetchJobData(jobId);
    }

    // 创建浮动面板
    function createFloatingPanel(jobId) {

        const panelId = 'job-data-panel';
        const panelTitleId = 'job-data-panel-title-text';
        const panelContentId = 'panel-content';
        let panel = document.getElementById(panelId);

        if (panel) {
            panel.style.display = 'block';

            // 更新标题
            const titleElement = document.getElementById(panelTitleId);
            if (titleElement) {
                titleElement.textContent = '数据任务信息 ' + jobId;
            }

            // 重置内容区域为加载状态
            const content = document.getElementById(panelContentId);
            if (content) {
                content.innerHTML = ''; // 清空旧内容
                const loading = document.createElement('div');
                loading.textContent = '加载数据中...';
                Object.assign(loading.style, {
                    textAlign: 'center',
                    color: '#666',
                    padding: '10px'
                });
                content.appendChild(loading);
                content.style.display = 'block'; // 确保内容区域可见
            }

            // 如果折叠按钮存在，确保其状态正确 (如果之前是折叠的，现在展开)
            const toggle = document.getElementById('panel-toggle');
            if (toggle && content && content.style.display === 'block') {
                toggle.textContent = '−';
            }

            return; // 面板已存在并已更新，不需要重新创建
        }

        // --- 如果面板不存在，则执行下面的创建逻辑 ---

        // 创建主容器
        panel = document.createElement('div');
        panel.id = panelId;
        Object.assign(panel.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '380px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.15)',
            zIndex: '50',
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '14px',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            border: '1px solid #e0e0e0'
        });

        // 创建标题栏
        const header = document.createElement('div');
        header.id = 'panel-header';
        Object.assign(header.style, {
            padding: '12px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none'
        });

        // 标题文本
        const title = document.createElement('div');
        title.id = panelTitleId;
        title.textContent = '数据任务信息 ' + jobId;

        // 折叠/展开按钮
        const toggleBtn = document.createElement('div');
        toggleBtn.id = 'panel-toggle';
        toggleBtn.textContent = '−';
        toggleBtn.style.fontWeight = 'bold';

        header.appendChild(title);
        header.appendChild(toggleBtn);

        // 内容区域
        const content = document.createElement('div');
        content.id = panelContentId;
        Object.assign(content.style, {
            padding: '16px',
            maxHeight: '400px',
            overflowY: 'auto',
            backgroundColor: '#fafafa'
        });

        // 加载中提示
        const loading = document.createElement('div');
        loading.textContent = '加载数据中...';
        loading.style.textAlign = 'center';
        loading.style.color = '#666';
        loading.style.padding = '10px';
        content.appendChild(loading);

        // 添加折叠/展开功能
        header.addEventListener('click', function() {
            const content = document.getElementById('panel-content');
            const toggle = document.getElementById('panel-toggle');

            if (content.style.display === 'none') {
                content.style.display = 'block';
                toggle.textContent = '−';
            } else {
                content.style.display = 'none';
                toggle.textContent = '+';
            }
        });

        // 组装面板
        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);

    }

    // 获取任务数据
    function fetchJobData(jobId) {

        // 显示请求信息
        const requestUrl = 'http://localhost:8111/cloudcanal/console/api/v1/inner/datajob/queryjob';
        const requestBody = JSON.stringify({ jobId: parseInt(jobId) });


        fetch(requestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: requestBody,
            credentials: 'include' // 使用当前页面的cookie
        })
        .then(response => {
            return response.json();
        })
        .then(result => {

            if (result.data) {
                displayJobData(result.data, jobId);
            } else {
                showError('请求失败: ' + (result.message || '未知错误'));
            }
        })
        .catch(error => {
            console.error('请求异常:', error);
            showError('请求异常: ' + error.message);
        });
    }

    // 显示任务数据
    function displayJobData(data, jobId) {

        const content = document.getElementById('panel-content');
        if (!content) {
            console.error('找不到内容面板元素');
            return;
        }

        // 清空内容
        content.innerHTML = '';

        // 源和目标数据类型
        const sourceType = data.sourceDsVO?.dataSourceType || 'N/A';
        const targetType = data.targetDsVO?.dataSourceType || 'N/A';

        // 创建数据类型展示区域
        const typeContainer = document.createElement('div');
        Object.assign(typeContainer.style, {
            backgroundColor: '#ffffff',
            padding: '12px',
            borderRadius: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #eee',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });

        // 源类型
        const sourceEl = document.createElement('div');
        sourceEl.textContent = sourceType;
        Object.assign(sourceEl.style, {
            fontWeight: 'bold',
            color: '#1976d2',
            padding: '6px 10px',
            backgroundColor: '#e3f2fd',
            borderRadius: '4px'
        });

        // 箭头
        const arrowEl = document.createElement('div');
        arrowEl.innerHTML = '&#10230;'; // 右箭头Unicode
        Object.assign(arrowEl.style, {
            margin: '0 10px',
            fontSize: '18px',
            color: '#757575'
        });

        // 目标类型
        const targetEl = document.createElement('div');
        targetEl.textContent = targetType;
        Object.assign(targetEl.style, {
            fontWeight: 'bold',
            color: '#388e3c',
            padding: '6px 10px',
            backgroundColor: '#e8f5e9',
            borderRadius: '4px'
        });

        typeContainer.appendChild(sourceEl);
        typeContainer.appendChild(arrowEl);
        typeContainer.appendChild(targetEl);
        content.appendChild(typeContainer);

        // 添加模板编辑按钮
        const editTemplateBtn = document.createElement('button');
        editTemplateBtn.textContent = '编辑模板';
        Object.assign(editTemplateBtn.style, {
            padding: '6px 12px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '12px',
            fontSize: '12px'
        });

        editTemplateBtn.addEventListener('click', () => {
            showTemplateEditor();
        });

        content.appendChild(editTemplateBtn);

        // 添加数据任务ID列表
        const tasksContainer = document.createElement('div');
        Object.assign(tasksContainer.style, {
            backgroundColor: '#ffffff',
            padding: '12px',
            borderRadius: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #eee'
        });

        const tasksTitle = document.createElement('div');
        tasksTitle.textContent = '数据任务ID列表';
        Object.assign(tasksTitle.style, {
            fontWeight: 'bold',
            marginBottom: '10px',
            color: '#333',
            fontSize: '13px'
        });

        tasksContainer.appendChild(tasksTitle);

        if (data.dataTasks && data.dataTasks.length > 0) {
            const tasksList = document.createElement('div');

            data.dataTasks.forEach(task => {
                const taskItem = document.createElement('div');
                Object.assign(taskItem.style, {
                    padding: '8px 10px',
                    margin: '4px 0',
                    backgroundColor: '#f5f7fa',
                    borderRadius: '4px',
                    fontSize: '13px',
                    border: '1px solid #edf0f5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                });

                // 任务ID和类型容器
                const taskInfoContainer = document.createElement('div');
                Object.assign(taskInfoContainer.style, {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                });

                // 任务ID文本
                const taskIdText = document.createElement('div');
                taskIdText.textContent = task.dataTaskId;

                // 任务类型文本
                const taskTypeText = document.createElement('div');
                taskTypeText.textContent = `类型: ${task.dataTaskType || 'N/A'}`;
                Object.assign(taskTypeText.style, {
                    fontSize: '11px',
                    color: '#666'
                });

                taskInfoContainer.appendChild(taskIdText);
                taskInfoContainer.appendChild(taskTypeText);

                // 复制按钮
                const copyBtn = document.createElement('button');
                copyBtn.textContent = '复制';
                Object.assign(copyBtn.style, {
                    padding: '4px 8px',
                    backgroundColor: '#e0e0e0',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px'
                });

                copyBtn.addEventListener('click', () => {
                    const taskId = task.dataTaskId;
                    const dataTaskName = task.dataTaskName || '';
                    const dataTaskStatus = task.dataTaskStatus || '';
                    const dataTaskType = task.dataTaskType || '';
                    // 获取embeddingProvider，如果不存在则使用默认值'DashScope'
                    const embeddingProvider = data.llmEmbeddingConfig?.llmProvider || 'DashScope';
                    const llmProvider = data.llmChatConfig?.llmProvider || 'DashScope';

                    // 替换模板中的变量
                    const result = template
                        .replace(/\${jobId}/g, jobId)
                        .replace(/\${taskId}/g, taskId)
                        .replace(/\${sourceType}/g, sourceType)
                        .replace(/\${targetType}/g, targetType)
                        .replace(/\${dataTaskName}/g, dataTaskName)
                        .replace(/\${dataTaskStatus}/g, dataTaskStatus)
                        .replace(/\${dataTaskType}/g, dataTaskType)
                        .replace(/\${embeddingProvider}/g, embeddingProvider)
                        .replace(/\${llmProvider}/g, llmProvider);

                    navigator.clipboard.writeText(result)
                        .then(() => {
                            // 复制成功效果
                            copyBtn.textContent = '已复制!';
                            copyBtn.style.backgroundColor = '#4caf50';
                            copyBtn.style.color = 'white';

                            setTimeout(() => {
                                copyBtn.textContent = '复制';
                                copyBtn.style.backgroundColor = '#e0e0e0';
                                copyBtn.style.color = 'black';
                            }, 1500);
                        })
                        .catch(err => {
                            console.error('复制失败:', err);
                            copyBtn.textContent = '复制失败';
                            copyBtn.style.backgroundColor = '#f44336';
                            copyBtn.style.color = 'white';

                            setTimeout(() => {
                                copyBtn.textContent = '复制';
                                copyBtn.style.backgroundColor = '#e0e0e0';
                                copyBtn.style.color = 'black';
                            }, 1500);
                        });
                });

                taskItem.appendChild(taskInfoContainer);
                taskItem.appendChild(copyBtn);
                tasksList.appendChild(taskItem);
            });

            tasksContainer.appendChild(tasksList);
        } else {
            const noTasks = document.createElement('div');
            noTasks.textContent = '暂无数据任务';
            noTasks.style.color = '#999';
            noTasks.style.fontStyle = 'italic';
            tasksContainer.appendChild(noTasks);
        }

        content.appendChild(tasksContainer);
    }

    // 显示模板编辑器
    function showTemplateEditor() {
        // 创建模态框背景
        const modalOverlay = document.createElement('div');
        Object.assign(modalOverlay.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 50,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        });

        // 创建模态框内容
        const modalContent = document.createElement('div');
        Object.assign(modalContent.style, {
            width: '600px',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        });

        // 标题
        const title = document.createElement('h3');
        title.textContent = '编辑模板';
        Object.assign(title.style, {
            margin: '0 0 15px 0',
            color: '#333'
        });

        // 说明
        const description = document.createElement('p');
        description.innerHTML = '可用变量: <code>${jobId}</code>, <code>${taskId}</code>, <code>${sourceType}</code>, <code>${targetType}</code>, <code>${dataTaskName}</code>, <code>${dataTaskStatus}</code>, <code>${dataTaskType}</code>, <code>${embeddingProvider}</code>, <code>${llmProvider}</code>';
        Object.assign(description.style, {
            marginBottom: '15px',
            color: '#666',
            fontSize: '13px'
        });

        // 文本区域
        const textarea = document.createElement('textarea');
        textarea.value = template;
        Object.assign(textarea.style, {
            width: '100%',
            height: '300px',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '14px',
            resize: 'vertical',
            marginBottom: '15px'
        });

        // 按钮容器
        const buttonContainer = document.createElement('div');
        Object.assign(buttonContainer.style, {
            display: 'flex',
            justifyContent: 'space-between'
        });

        // 重置按钮
        const resetBtn = document.createElement('button');
        resetBtn.textContent = '恢复默认';
        Object.assign(resetBtn.style, {
            padding: '8px 16px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
        });

        // 保存按钮
        const saveBtn = document.createElement('button');
        saveBtn.textContent = '保存';
        Object.assign(saveBtn.style, {
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
        });

        // 取消按钮
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        Object.assign(cancelBtn.style, {
            padding: '8px 16px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginRight: '10px',
            cursor: 'pointer'
        });

        // 按钮事件
        resetBtn.addEventListener('click', () => {
            textarea.value = DEFAULT_TEMPLATE;
        });

        saveBtn.addEventListener('click', () => {
            template = textarea.value;
            localStorage.setItem('cloudcanal_template', template);
            document.body.removeChild(modalOverlay);
        });

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });

        // 组装模态框
        buttonContainer.appendChild(resetBtn);

        const rightButtons = document.createElement('div');
        rightButtons.appendChild(cancelBtn);
        rightButtons.appendChild(saveBtn);
        buttonContainer.appendChild(rightButtons);

        modalContent.appendChild(title);
        modalContent.appendChild(description);
        modalContent.appendChild(textarea);
        modalContent.appendChild(buttonContainer);

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
    }

    // 显示错误信息
    function showError(message) {

        const content = document.getElementById('panel-content');
        if (!content) {
            return;
        }

        content.innerHTML = '';

        const errorMsg = document.createElement('div');
        errorMsg.textContent = message;
        Object.assign(errorMsg.style, {
            color: '#d32f2f',
            padding: '12px',
            backgroundColor: '#ffebee',
            borderRadius: '4px',
            textAlign: 'center'
        });

        content.appendChild(errorMsg);
    }

    // 处理URL变化，适应单页应用 (Vue hash-based routing)
    let lastUrl = location.href; // 在这里初始化 lastUrl

    function handleUrlChange() {
        const currentUrl = window.location.href;

        // 使用正则精确判断是否为任务详情页：/job/ 后紧跟数字
        // 例如: http://localhost:8111/#/data/job/608
        const jobMatch = currentUrl.match(/\/job\/(\d+)/);

        if (jobMatch) {
            // 匹配成功，说明是任务详情页，执行初始化/显示逻辑
            init(); 
        } else {
            // 匹配失败（例如列表页、创建页 /job/create、或其他页面）
            // 强制隐藏面板
            const panel = document.getElementById('job-data-panel');
            if (panel) {
                panel.style.display = 'none';
            }
        }
    }

    // 使用轮询检查 URL 变化
    setInterval(function() {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            handleUrlChange();
        }
    }, 500); // 每 500 毫秒检查一次

    // 初始化执行
    // 延迟执行，确保页面已加载，并进行初次URL检查
    setTimeout(handleUrlChange, 1000);
})();
