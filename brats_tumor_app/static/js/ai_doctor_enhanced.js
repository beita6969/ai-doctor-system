// 全局变量
let currentDiagnosis = null;
let currentPrescription = null;
let currentPatientInfo = null;

// 显示不同部分
function showSection(sectionName) {
    // 更新导航栏状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // 显示对应内容
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionName}-section`).classList.add('active');
    
    // 加载特定内容
    if (sectionName === 'history') {
        loadDiagnosisHistory();
    } else if (sectionName === 'prescription' && currentPrescription) {
        displayPrescription();
    }
}

// 添加症状
function addSymptom(symptom) {
    const symptomsTextarea = document.getElementById('symptoms');
    const currentText = symptomsTextarea.value.trim();
    
    if (currentText) {
        symptomsTextarea.value = currentText + '、' + symptom;
    } else {
        symptomsTextarea.value = symptom;
    }
}

// 显示加载状态
function showLoading(message) {
    const overlay = document.getElementById('loading-overlay');
    const messageEl = document.getElementById('loading-message');
    messageEl.textContent = message || '处理中...';
    overlay.style.display = 'flex';
}

// 隐藏加载状态
function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

// 执行诊断
async function performDiagnosis() {
    const symptoms = document.getElementById('symptoms').value.trim();
    
    if (!symptoms) {
        alert('请描述您的症状');
        return;
    }
    
    // 收集患者信息
    currentPatientInfo = {
        name: document.getElementById('patient-name').value || '未填写',
        age: parseInt(document.getElementById('patient-age').value) || null,
        gender: document.getElementById('patient-gender').value || '未填写',
        phone: document.getElementById('patient-phone').value || '未填写',
        symptoms: symptoms
    };
    
    // 收集生命体征
    const vitalSigns = {};
    const bloodPressure = document.getElementById('blood-pressure').value;
    if (bloodPressure) vitalSigns.blood_pressure = bloodPressure;
    
    const heartRate = document.getElementById('heart-rate').value;
    if (heartRate) vitalSigns.heart_rate = parseInt(heartRate);
    
    const temperature = document.getElementById('temperature').value;
    if (temperature) vitalSigns.temperature = parseFloat(temperature);
    
    const respiratoryRate = document.getElementById('respiratory-rate').value;
    if (respiratoryRate) vitalSigns.respiratory_rate = parseInt(respiratoryRate);
    
    const requestData = {
        symptoms: symptoms,
        medical_history: document.getElementById('medical-history').value,
        age: currentPatientInfo.age,
        gender: currentPatientInfo.gender,
        vital_signs: vitalSigns,
        lab_results: {}
    };
    
    try {
        // 显示诊断结果区域
        const resultsSection = document.getElementById('diagnosis-results');
        const contentDiv = document.getElementById('diagnosis-content');
        resultsSection.style.display = 'block';
        
        // 设置诊断时间
        const now = new Date();
        document.getElementById('diagnosis-time').textContent = 
            now.toLocaleString('zh-CN', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        
        // 初始化内容区域
        contentDiv.innerHTML = '<div class="streaming-diagnosis"><div class="diagnosis-text"></div></div>';
        const diagnosisTextDiv = contentDiv.querySelector('.diagnosis-text');
        
        // 使用流式接口
        const response = await fetch('/api/diagnose/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullDiagnosisText = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        
                        if (data.type === 'content') {
                            fullDiagnosisText += data.content;
                            diagnosisTextDiv.innerHTML = formatDiagnosisText(fullDiagnosisText);
                            // 自动滚动
                            diagnosisTextDiv.scrollTop = diagnosisTextDiv.scrollHeight;
                        } else if (data.type === 'error') {
                            alert('诊断失败：' + data.content);
                            return;
                        }
                    } catch (e) {
                        console.error('解析数据出错:', e);
                    }
                }
            }
        }
        
        // 保存诊断结果
        currentDiagnosis = {
            preliminary_diagnosis: fullDiagnosisText,
            patient_info: currentPatientInfo,
            diagnosis_time: now.toISOString()
        };
        
    } catch (error) {
        alert('诊断过程中出现错误：' + error.message);
    }
}

// 格式化Markdown文本（通用函数）
function formatMarkdown(text) {
    if (!text) return '';
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');  // 支持**加粗**语法
}

// 格式化诊断文本
function formatDiagnosisText(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // 支持**加粗**语法
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')
        .replace(/(\d+\.\s)/g, '<strong>$1</strong>')
        .replace(/(初步诊断|可能的病因分析|建议的检查项目|治疗建议|注意事项)[:：]/g, '<h3>$1</h3>');
}

// 生成处方
async function generatePrescription() {
    if (!currentDiagnosis) {
        alert('请先进行诊断');
        return;
    }
    
    const requestData = {
        diagnosis: currentDiagnosis.preliminary_diagnosis,
        patient_info: {
            age: currentPatientInfo.age,
            gender: currentPatientInfo.gender,
            allergies: '',
            current_medications: ''
        }
    };
    
    try {
        showLoading('正在生成处方...');
        
        const response = await fetch('/api/prescribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.error) {
            alert('生成处方失败：' + result.error);
            return;
        }
        
        currentPrescription = result;
        displayPrescription();
        
        // 切换到处方页面
        document.querySelector('.nav-item[onclick*="prescription"]').click();
        
    } catch (error) {
        hideLoading();
        alert('生成处方时出现错误：' + error.message);
    }
}

// 显示处方
function displayPrescription() {
    const contentDiv = document.getElementById('prescription-content');
    
    if (!currentPrescription || !currentPrescription.medications) {
        contentDiv.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-prescription-bottle-alt"></i>
                <p>暂无处方信息</p>
                <p class="text-muted">请先进行诊断后生成处方</p>
            </div>
        `;
        return;
    }
    
    let html = '<h3 class="card-title">处方详情</h3>';
    
    currentPrescription.medications.forEach((med, index) => {
        html += `
            <div class="prescription-item">
                <h4>${index + 1}. ${formatMarkdown(med.name)}</h4>
                <div class="med-details">
                    <div><strong>剂量：</strong> ${formatMarkdown(med.dosage)}</div>
                    <div><strong>频率：</strong> ${formatMarkdown(med.frequency)}</div>
                    <div><strong>疗程：</strong> ${formatMarkdown(med.duration)}</div>
                    <div><strong>用法：</strong> ${formatMarkdown(med.instructions)}</div>
                </div>
                ${med.warnings ? `<div class="med-warning"><i class="fas fa-exclamation-triangle"></i> ${formatMarkdown(med.warnings)}</div>` : ''}
            </div>
        `;
    });
    
    if (currentPrescription.drug_interactions && currentPrescription.drug_interactions.length > 0) {
        html += '<div class="card" style="background-color: #fff3cd; border-color: #ffeeba;"><h4>药物相互作用</h4><ul>';
        currentPrescription.drug_interactions.forEach(interaction => {
            html += `<li>${formatMarkdown(interaction)}</li>`;
        });
        html += '</ul></div>';
    }
    
    if (currentPrescription.follow_up) {
        html += `<div class="card" style="background-color: #d1ecf1; border-color: #bee5eb;">
            <strong>复诊建议：</strong> ${formatMarkdown(currentPrescription.follow_up)}
        </div>`;
    }
    
    contentDiv.innerHTML = html;
}

// 预览报告
async function previewReport() {
    if (!currentDiagnosis) {
        alert('请先进行诊断');
        return;
    }
    
    const modal = document.getElementById('report-preview-modal');
    const contentDiv = document.getElementById('report-preview-content');
    
    // 生成报告预览内容
    const reportHtml = generateReportHTML();
    contentDiv.innerHTML = reportHtml;
    
    modal.style.display = 'block';
}

// 生成报告HTML
function generateReportHTML() {
    const now = new Date();
    const reportDate = now.toLocaleDateString('zh-CN');
    
    let html = `
        <div class="medical-report">
            <div class="report-header">
                <h1 style="text-align: center; color: #2c5aa0; margin-bottom: 0.5rem;">
                    <i class="fas fa-hospital"></i> AI智能医生诊断报告
                </h1>
                <p style="text-align: center; color: #6c757d; font-size: 0.9rem;">
                    报告编号：${Date.now()} | 生成日期：${reportDate}
                </p>
            </div>
            
            <div class="report-section" style="margin-top: 2rem;">
                <h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 0.5rem;">
                    <i class="fas fa-user"></i> 患者信息
                </h2>
                <table style="width: 100%; margin-top: 1rem;">
                    <tr>
                        <td style="padding: 0.5rem; width: 25%;"><strong>姓名：</strong></td>
                        <td style="padding: 0.5rem;">${currentPatientInfo.name}</td>
                        <td style="padding: 0.5rem; width: 25%;"><strong>性别：</strong></td>
                        <td style="padding: 0.5rem;">${currentPatientInfo.gender}</td>
                    </tr>
                    <tr>
                        <td style="padding: 0.5rem;"><strong>年龄：</strong></td>
                        <td style="padding: 0.5rem;">${currentPatientInfo.age || '未填写'}岁</td>
                        <td style="padding: 0.5rem;"><strong>联系电话：</strong></td>
                        <td style="padding: 0.5rem;">${currentPatientInfo.phone}</td>
                    </tr>
                    <tr>
                        <td style="padding: 0.5rem;"><strong>就诊时间：</strong></td>
                        <td style="padding: 0.5rem;" colspan="3">${new Date(currentDiagnosis.diagnosis_time).toLocaleString('zh-CN')}</td>
                    </tr>
                </table>
            </div>
            
            <div class="report-section" style="margin-top: 2rem;">
                <h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 0.5rem;">
                    <i class="fas fa-notes-medical"></i> 主诉症状
                </h2>
                <p style="margin-top: 1rem; line-height: 1.8;">${currentPatientInfo.symptoms}</p>
            </div>
            
            <div class="report-section" style="margin-top: 2rem;">
                <h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 0.5rem;">
                    <i class="fas fa-stethoscope"></i> AI诊断结果
                </h2>
                <div style="margin-top: 1rem; line-height: 1.8; background-color: #f8f9fa; padding: 1rem; border-radius: 4px;">
                    ${formatDiagnosisText(currentDiagnosis.preliminary_diagnosis)}
                </div>
            </div>
    `;
    
    if (currentPrescription && currentPrescription.medications) {
        html += `
            <div class="report-section" style="margin-top: 2rem;">
                <h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 0.5rem;">
                    <i class="fas fa-pills"></i> 处方信息
                </h2>
                <table style="width: 100%; margin-top: 1rem; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 0.75rem; text-align: left; border: 1px solid #dee2e6;">药品名称</th>
                            <th style="padding: 0.75rem; text-align: left; border: 1px solid #dee2e6;">剂量</th>
                            <th style="padding: 0.75rem; text-align: left; border: 1px solid #dee2e6;">用法</th>
                            <th style="padding: 0.75rem; text-align: left; border: 1px solid #dee2e6;">疗程</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        currentPrescription.medications.forEach(med => {
            html += `
                <tr>
                    <td style="padding: 0.75rem; border: 1px solid #dee2e6;">${med.name}</td>
                    <td style="padding: 0.75rem; border: 1px solid #dee2e6;">${med.dosage}</td>
                    <td style="padding: 0.75rem; border: 1px solid #dee2e6;">${med.frequency}</td>
                    <td style="padding: 0.75rem; border: 1px solid #dee2e6;">${med.duration}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    html += `
            <div class="report-footer" style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 0.9rem;">
                <p><strong>声明：</strong>本报告由AI智能医生系统生成，仅供参考。请结合实际情况，必要时咨询专业医生。</p>
                <p style="margin-top: 0.5rem;">AI智能医生诊断系统 © 2024</p>
            </div>
        </div>
    `;
    
    return html;
}

// 关闭报告预览
function closeReportPreview() {
    document.getElementById('report-preview-modal').style.display = 'none';
}

// 生成报告
function generateReport() {
    closeReportPreview();
    document.getElementById('report-preview-modal').style.display = 'none';
    
    // 创建下载选项模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>选择下载格式</h2>
                <span class="close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</span>
            </div>
            <div class="modal-body" style="text-align: center;">
                <button class="btn btn-primary" onclick="downloadReport('pdf'); this.parentElement.parentElement.parentElement.remove();">
                    <i class="fas fa-file-pdf"></i> 下载PDF格式
                </button>
                <button class="btn btn-primary" onclick="downloadReport('docx'); this.parentElement.parentElement.parentElement.remove();">
                    <i class="fas fa-file-word"></i> 下载Word格式
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// 下载报告
async function downloadReport(format) {
    if (!currentDiagnosis) {
        alert('请先进行诊断');
        return;
    }
    
    const requestData = {
        patient_info: currentPatientInfo,
        diagnosis: currentDiagnosis,
        prescription: currentPrescription,
        format: format
    };
    
    try {
        showLoading('正在生成报告...');
        
        const response = await fetch('/api/generate_report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        hideLoading();
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `诊断报告_${currentPatientInfo.name}_${new Date().getTime()}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            const error = await response.json();
            alert('生成报告失败：' + error.error);
        }
        
    } catch (error) {
        hideLoading();
        alert('生成报告时出现错误：' + error.message);
    }
}

// 加载诊断历史
async function loadDiagnosisHistory() {
    try {
        const response = await fetch('/api/history');
        const result = await response.json();
        
        if (result.error) {
            console.error('加载历史记录失败：', result.error);
            return;
        }
        
        displayDiagnosisHistory(result.history);
        
    } catch (error) {
        console.error('加载历史记录时出现错误：', error.message);
    }
}

// 显示诊断历史
function displayDiagnosisHistory(history) {
    const historyDiv = document.getElementById('diagnosis-history');
    
    if (!history || history.length === 0) {
        historyDiv.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>暂无诊断历史记录</p>
                <p class="text-muted">您的诊断记录将显示在这里</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    history.forEach((record, index) => {
        const date = new Date(record.timestamp).toLocaleString('zh-CN');
        html += `
            <div class="history-item">
                <div class="history-date">
                    <i class="fas fa-calendar-alt"></i> ${date}
                </div>
                <div class="history-diagnosis">诊断记录 #${history.length - index}</div>
                <div class="history-symptoms">
                    <strong>症状：</strong>${record.symptoms}
                </div>
                ${record.patient_info.age ? `<div><strong>年龄：</strong>${record.patient_info.age}岁</div>` : ''}
                ${record.patient_info.gender ? `<div><strong>性别：</strong>${record.patient_info.gender}</div>` : ''}
            </div>
        `;
    });
    
    historyDiv.innerHTML = html;
}

// 文件相关变量
let selectedFile = null;

// 文件处理函数
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.nii') || fileName.endsWith('.nii.gz') || fileName.endsWith('.gz')) {
            selectedFile = file;
            document.getElementById('file-name').textContent = file.name;
            document.getElementById('file-info').style.display = 'flex';
            document.getElementById('analyze-btn').disabled = false;
            document.getElementById('upload-area').style.display = 'none';
        } else {
            alert('请上传 .nii 或 .nii.gz 格式的文件');
        }
    }
}

// 清除文件
function clearFile() {
    selectedFile = null;
    document.getElementById('file-input').value = '';
    document.getElementById('file-info').style.display = 'none';
    document.getElementById('upload-area').style.display = 'block';
    document.getElementById('analyze-btn').disabled = true;
}


// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 设置当前日期时间
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    // 添加回车键支持
    document.getElementById('symptoms').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            performDiagnosis();
        }
    });
    
});