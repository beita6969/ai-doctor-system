let currentDiagnosis = null;
let currentPrescription = null;
let currentTumorAnalysis = null;
let currentSlice = 0;
let totalSlices = 0;
let segmentationPath = '';

function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-button');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    buttons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'history') {
        loadDiagnosisHistory();
    }
}

function addSymptom(symptom) {
    const symptomsTextarea = document.getElementById('symptoms');
    const currentText = symptomsTextarea.value.trim();
    
    if (currentText) {
        symptomsTextarea.value = currentText + '、' + symptom;
    } else {
        symptomsTextarea.value = symptom;
    }
}

async function performDiagnosis() {
    const symptoms = document.getElementById('symptoms').value.trim();
    
    if (!symptoms) {
        alert('请描述您的症状');
        return;
    }
    
    const patientInfo = {
        name: document.getElementById('patient-name').value,
        age: parseInt(document.getElementById('patient-age').value) || null,
        gender: document.getElementById('patient-gender').value,
        phone: document.getElementById('patient-phone').value,
        symptoms: symptoms
    };
    
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
        age: patientInfo.age,
        gender: patientInfo.gender,
        vital_signs: vitalSigns,
        lab_results: {}
    };
    
    try {
        // 显示诊断结果区域并清空内容
        const resultsSection = document.getElementById('diagnosis-results');
        const contentDiv = document.getElementById('diagnosis-content');
        resultsSection.style.display = 'block';
        contentDiv.innerHTML = '<div class="streaming-diagnosis"><div class="diagnosis-text"></div></div>';
        
        const diagnosisTextDiv = contentDiv.querySelector('.diagnosis-text');
        
        // 创建EventSource连接
        const response = await fetch('/diagnose_stream', {
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
                            // 自动滚动到底部
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
            patient_info: patientInfo
        };
        
    } catch (error) {
        alert('诊断过程中出现错误：' + error.message);
    }
}

function formatDiagnosisText(text) {
    // 将文本格式化为HTML，保留换行和空格
    return text
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')
        .replace(/(\d+\.\s)/g, '<strong>$1</strong>')
        .replace(/(初步诊断|可能的病因分析|建议的检查项目|治疗建议|注意事项)[:：]/g, '<h3>$1</h3>');
}

function displayDiagnosisResults(diagnosis) {
    const resultsSection = document.getElementById('diagnosis-results');
    const contentDiv = document.getElementById('diagnosis-content');
    
    let html = `
        <div class="diagnosis-summary">
            <div class="diagnosis-item">
                <strong>初步诊断：</strong> ${diagnosis.preliminary_diagnosis}
            </div>
            <div class="diagnosis-item">
                <strong>严重程度：</strong> 
                <span class="severity-badge severity-${diagnosis.severity}">${diagnosis.severity}</span>
            </div>
        </div>
    `;
    
    if (diagnosis.possible_diseases && diagnosis.possible_diseases.length > 0) {
        html += '<div class="possible-diseases"><h3>可能的疾病</h3><ul>';
        diagnosis.possible_diseases.forEach(disease => {
            html += `<li>${disease.disease} (可能性：${disease.probability})</li>`;
        });
        html += '</ul></div>';
    }
    
    if (diagnosis.recommended_tests && diagnosis.recommended_tests.length > 0) {
        html += '<div class="recommended-tests"><h3>建议检查项目</h3><ul>';
        diagnosis.recommended_tests.forEach(test => {
            html += `<li>${test}</li>`;
        });
        html += '</ul></div>';
    }
    
    if (diagnosis.treatment_suggestions && diagnosis.treatment_suggestions.length > 0) {
        html += '<div class="treatment-suggestions"><h3>治疗建议</h3><ul>';
        diagnosis.treatment_suggestions.forEach(suggestion => {
            html += `<li>${suggestion}</li>`;
        });
        html += '</ul></div>';
    }
    
    if (diagnosis.precautions && diagnosis.precautions.length > 0) {
        html += '<div class="precautions"><h3>注意事项</h3><ul>';
        diagnosis.precautions.forEach(precaution => {
            html += `<li>${precaution}</li>`;
        });
        html += '</ul></div>';
    }
    
    if (diagnosis.referral_needed) {
        html += `<div class="referral-alert">
            <i class="fas fa-exclamation-triangle"></i> 
            建议转诊至：${diagnosis.referral_department || '专科门诊'}
        </div>`;
    }
    
    contentDiv.innerHTML = html;
    resultsSection.style.display = 'block';
}

async function generatePrescription() {
    if (!currentDiagnosis) {
        alert('请先进行诊断');
        return;
    }
    
    const requestData = {
        diagnosis: currentDiagnosis.preliminary_diagnosis,
        patient_info: {
            age: currentDiagnosis.patient_info.age,
            gender: currentDiagnosis.patient_info.gender,
            allergies: '',
            current_medications: ''
        }
    };
    
    try {
        showLoading('正在生成处方...');
        
        const response = await fetch('/prescribe', {
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
        displayPrescriptionResults(result);
        
    } catch (error) {
        hideLoading();
        alert('生成处方时出现错误：' + error.message);
    }
}

function displayPrescriptionResults(prescription) {
    const resultsSection = document.getElementById('prescription-results');
    const contentDiv = document.getElementById('prescription-content');
    
    let html = '<div class="prescription-list">';
    
    if (prescription.medications && prescription.medications.length > 0) {
        prescription.medications.forEach((med, index) => {
            html += `
                <div class="medication-item">
                    <h4>${index + 1}. ${med.name}</h4>
                    <div class="med-details">
                        <div><strong>剂量：</strong> ${med.dosage}</div>
                        <div><strong>频率：</strong> ${med.frequency}</div>
                        <div><strong>疗程：</strong> ${med.duration}</div>
                        <div><strong>用药说明：</strong> ${med.instructions}</div>
                        ${med.warnings ? `<div class="med-warning"><strong>注意：</strong> ${med.warnings}</div>` : ''}
                    </div>
                </div>
            `;
        });
    } else {
        html += '<p>暂无处方信息</p>';
    }
    
    if (prescription.drug_interactions && prescription.drug_interactions.length > 0) {
        html += '<div class="drug-interactions"><h3>药物相互作用</h3><ul>';
        prescription.drug_interactions.forEach(interaction => {
            html += `<li>${interaction}</li>`;
        });
        html += '</ul></div>';
    }
    
    if (prescription.follow_up) {
        html += `<div class="follow-up"><strong>复诊建议：</strong> ${prescription.follow_up}</div>`;
    }
    
    html += '</div>';
    
    contentDiv.innerHTML = html;
    resultsSection.style.display = 'block';
}

async function generateReport() {
    document.getElementById('report-modal').style.display = 'block';
}

async function downloadReport(format) {
    if (!currentDiagnosis) {
        alert('请先进行诊断');
        return;
    }
    
    const requestData = {
        patient_info: currentDiagnosis.patient_info,
        diagnosis: currentDiagnosis,
        prescription: currentPrescription,
        tumor_analysis: currentTumorAnalysis,
        format: format
    };
    
    try {
        showLoading('正在生成报告...');
        
        const response = await fetch('/generate_report', {
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
            a.download = `医疗诊断报告_${new Date().getTime()}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            closeModal();
        } else {
            const error = await response.json();
            alert('生成报告失败：' + error.error);
        }
        
    } catch (error) {
        hideLoading();
        alert('生成报告时出现错误：' + error.message);
    }
}

function closeModal() {
    document.getElementById('report-modal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
});

async function handleFileUpload(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        document.getElementById('tumor-loading').style.display = 'block';
        document.getElementById('tumor-results').style.display = 'none';
        
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        document.getElementById('tumor-loading').style.display = 'none';
        
        if (result.error) {
            alert('上传失败：' + result.error);
            return;
        }
        
        if (result.file_type === 'medical_scan') {
            segmentationPath = result.segmentation_path;
            totalSlices = result.num_slices;
            currentSlice = Math.floor(totalSlices / 2);
            
            displayTumorResults(result);
            
            const clinicalSymptoms = document.getElementById('clinical-symptoms').value;
            if (result.tumor_regions) {
                analyzeTumor(result.tumor_regions, clinicalSymptoms);
            }
        } else {
            alert('请上传医学影像文件（.nii, .nii.gz, .dcm）');
        }
        
    } catch (error) {
        document.getElementById('tumor-loading').style.display = 'none';
        alert('处理文件时出现错误：' + error.message);
    }
}

function displayTumorResults(results) {
    const resultsSection = document.getElementById('tumor-results');
    const statsDiv = document.getElementById('tumor-stats');
    
    updateSlice();
    
    const slider = document.getElementById('slice-slider');
    slider.max = totalSlices - 1;
    slider.value = currentSlice;
    
    let statsHtml = '<h3>肿瘤统计信息</h3>';
    statsHtml += `
        <div class="stat-item">
            <span class="stat-label">坏死/核心区域：</span>
            <span class="stat-value">${results.tumor_regions.necrotic_core} 体素</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">水肿区域：</span>
            <span class="stat-value">${results.tumor_regions.edema} 体素</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">增强区域：</span>
            <span class="stat-value">${results.tumor_regions.enhancing} 体素</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">总肿瘤体积：</span>
            <span class="stat-value">${results.tumor_regions.necrotic_core + results.tumor_regions.edema + results.tumor_regions.enhancing} 体素</span>
        </div>
    `;
    
    statsDiv.innerHTML = statsHtml;
    resultsSection.style.display = 'block';
}

async function analyzeTumor(tumorRegions, clinicalSymptoms) {
    try {
        const response = await fetch('/analyze_tumor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tumor_analysis: { tumor_regions: tumorRegions },
                clinical_symptoms: clinicalSymptoms
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            console.error('肿瘤分析失败：', result.error);
            return;
        }
        
        currentTumorAnalysis = result;
        displayTumorAnalysis(result);
        
    } catch (error) {
        console.error('肿瘤分析时出现错误：', error.message);
    }
}

function displayTumorAnalysis(analysis) {
    const analysisDiv = document.getElementById('tumor-analysis');
    
    let html = '<h3>AI分析结果</h3>';
    
    Object.entries(analysis).forEach(([key, value]) => {
        if (key !== 'error' && value) {
            const title = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            if (Array.isArray(value)) {
                html += `<div class="analysis-item"><strong>${title}：</strong><ul>`;
                value.forEach(item => {
                    html += `<li>${item}</li>`;
                });
                html += '</ul></div>';
            } else if (typeof value === 'object') {
                html += `<div class="analysis-item"><strong>${title}：</strong>`;
                Object.entries(value).forEach(([subKey, subValue]) => {
                    html += `<div>${subKey}: ${subValue}</div>`;
                });
                html += '</div>';
            } else {
                html += `<div class="analysis-item"><strong>${title}：</strong> ${value}</div>`;
            }
        }
    });
    
    analysisDiv.innerHTML = html;
}

function updateSlice() {
    const sliceImg = document.getElementById('tumor-slice');
    const sliceInfo = document.getElementById('slice-info');
    
    sliceImg.src = `/get_slice/${segmentationPath}/${currentSlice}`;
    sliceInfo.textContent = `切片 ${currentSlice + 1}/${totalSlices}`;
}

function changeSlice(direction) {
    currentSlice = Math.max(0, Math.min(totalSlices - 1, currentSlice + direction));
    document.getElementById('slice-slider').value = currentSlice;
    updateSlice();
}

async function generateTumorReport() {
    if (!currentTumorAnalysis) {
        alert('请先完成肿瘤分析');
        return;
    }
    
    currentDiagnosis = {
        preliminary_diagnosis: '脑肿瘤检测',
        patient_info: {
            name: document.getElementById('patient-name').value || '未提供',
            age: document.getElementById('patient-age').value || '未提供',
            gender: document.getElementById('patient-gender').value || '未提供',
            phone: document.getElementById('patient-phone').value || '未提供'
        }
    };
    
    document.getElementById('report-modal').style.display = 'block';
}

async function loadDiagnosisHistory() {
    try {
        const response = await fetch('/diagnosis_history');
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

function displayDiagnosisHistory(history) {
    const historyDiv = document.getElementById('diagnosis-history');
    
    if (!history || history.length === 0) {
        historyDiv.innerHTML = '<p>暂无诊断历史记录</p>';
        return;
    }
    
    let html = '';
    history.forEach((record, index) => {
        const date = new Date(record.timestamp).toLocaleString('zh-CN');
        html += `
            <div class="history-item">
                <div class="history-date">${date}</div>
                <div class="history-diagnosis">${record.diagnosis.preliminary_diagnosis}</div>
                <div class="history-symptoms">症状：${record.patient_info.symptoms}</div>
                ${record.patient_info.age ? `<div>年龄：${record.patient_info.age}岁</div>` : ''}
                ${record.patient_info.gender ? `<div>性别：${record.patient_info.gender}</div>` : ''}
            </div>
        `;
    });
    
    historyDiv.innerHTML = html;
}

function showLoading(message) {
    const loadingHtml = `
        <div class="loading-overlay">
            <div class="loading-content">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', loadingHtml);
}

function hideLoading() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const sliceSlider = document.getElementById('slice-slider');
    if (sliceSlider) {
        sliceSlider.addEventListener('input', function() {
            currentSlice = parseInt(this.value);
            updateSlice();
        });
    }
});

const style = document.createElement('style');
style.textContent = `
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    }
    
    .loading-content {
        background: white;
        padding: 30px;
        border-radius: 10px;
        text-align: center;
    }
    
    .diagnosis-summary {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
        padding: 15px;
        background: white;
        border-radius: 8px;
    }
    
    .severity-badge {
        padding: 5px 15px;
        border-radius: 20px;
        font-size: 0.9em;
    }
    
    .severity-轻度 { background: #d4edda; color: #155724; }
    .severity-中度 { background: #fff3cd; color: #856404; }
    .severity-重度 { background: #f8d7da; color: #721c24; }
    
    .possible-diseases, .recommended-tests, .treatment-suggestions, .precautions {
        margin-bottom: 20px;
    }
    
    .referral-alert {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
        padding: 15px;
        border-radius: 8px;
        margin-top: 20px;
    }
    
    .medication-item {
        background: white;
        padding: 20px;
        margin-bottom: 15px;
        border-radius: 8px;
        border: 1px solid #e9ecef;
    }
    
    .med-details {
        margin-top: 10px;
        padding-left: 20px;
    }
    
    .med-details > div {
        margin: 5px 0;
    }
    
    .med-warning {
        color: #dc3545;
        margin-top: 10px;
    }
    
    .drug-interactions {
        background: #fff3cd;
        padding: 15px;
        border-radius: 8px;
        margin-top: 20px;
    }
    
    .follow-up {
        background: #d1ecf1;
        padding: 15px;
        border-radius: 8px;
        margin-top: 20px;
        color: #0c5460;
    }
    
    .analysis-item {
        margin-bottom: 15px;
        padding: 10px;
        background: white;
        border-radius: 5px;
    }
    
    .streaming-diagnosis {
        background: white;
        padding: 20px;
        border-radius: 8px;
        min-height: 200px;
    }
    
    .diagnosis-text {
        max-height: 600px;
        overflow-y: auto;
        line-height: 1.6;
    }
    
    .diagnosis-text h3 {
        margin-top: 20px;
        margin-bottom: 10px;
        color: #2c3e50;
    }
    
    .diagnosis-text p {
        margin-bottom: 10px;
    }
`;
document.head.appendChild(style);