// ==UserScript==
// @name         自动填充登录信息
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  当页面包含指定ICP备案号时自动填充登录表单
// @author       Claude Sonnet 4
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 成功标志位，防止重复执行
    let isSuccess = false;
    // 最大重试次数
    const maxRetries = 10;
    // 当前重试次数
    let currentRetry = 0;

    // 递归重试函数
    function attemptAutoFill() {
        // 如果已经成功或超过最大重试次数，停止尝试
        if (isSuccess || currentRetry >= maxRetries) {
            if (currentRetry >= maxRetries && !isSuccess) {
                console.log('达到最大重试次数，停止尝试自动填充');
            }
            return;
        }

        currentRetry++;
        console.log(`第${currentRetry}次尝试自动填充...`);

        // 检查页面是否存在指定的ICP备案号文本
        if (document.body.innerText.includes('浙ICP备20007605号-1') &&
            document.body.innerText.includes('主账号登录')&&
            document.body.innerText.includes('子账号登录')) {
            console.log('检测到目标页面，开始自动填充登录信息...');

            let successCount = 0;

            // 查找并填充邮箱/手机号输入框
            const emailInput = document.querySelector('input[placeholder="邮箱/手机号"]');
            if (emailInput) {
                emailInput.value = 'test@clougence.com';
                // 触发input事件，确保页面能正确识别输入
                emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                emailInput.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('邮箱/手机号已填充');
                successCount++;
            } else {
                console.log('未找到邮箱/手机号输入框');
            }

            // 查找并填充密码输入框
            const passwordInput = document.querySelector('input[placeholder="密码"]');
            if (passwordInput) {
                passwordInput.value = 'clougence2021';
                // 触发input事件，确保页面能正确识别输入
                passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('密码已填充');
                successCount++;
            } else {
                console.log('未找到密码输入框');
            }

            // 如果成功填充了任何字段，设置成功标志并显示提示
            if (successCount > 0) {
                isSuccess = true;
                console.log(`自动填充成功，共填充${successCount}个字段`);
                showSuccessNotification(`要不试试默认账号密码😛`);
                return; // 成功后立即返回，不再重试
            }
        }

        // 如果未成功，500ms后递归重试
        if (!isSuccess) {
            setTimeout(attemptAutoFill, 500);
        }
    }

    // 开始第一次尝试，延时0.5秒
    setTimeout(attemptAutoFill, 500);

    // 创建成功提示的函数
    function showSuccessNotification(message) {
        // 创建提示元素
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s ease;
        `;
        notification.textContent = message;

        // 添加到页面
        document.body.appendChild(notification);

        // 动画显示
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // 3秒后自动消失
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

})();
