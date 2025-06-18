#!/usr/bin/env python3
import os
from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from brats_tumor_app.models.ai_doctor import AIDoctor
from datetime import datetime
import json
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

app = Flask(__name__, 
            template_folder='brats_tumor_app/templates',
            static_folder='brats_tumor_app/static')
CORS(app)

# 配置
app.config['SECRET_KEY'] = os.urandom(24)
app.config['UPLOAD_FOLDER'] = 'brats_tumor_app/static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

# 确保上传目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# 获取API密钥
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
if not ANTHROPIC_API_KEY:
    print("警告：未找到 ANTHROPIC_API_KEY 环境变量")
    ANTHROPIC_API_KEY = "your-api-key-here"

# 初始化AI医生
ai_doctor = AIDoctor(api_key=ANTHROPIC_API_KEY)

@app.route('/')
def index():
    return render_template('ai_doctor_enhanced.html')

@app.route('/api/diagnose', methods=['POST'])
def diagnose():
    try:
        data = request.json
        
        # 提取患者信息
        patient_info = {
            'age': data.get('age'),
            'gender': data.get('gender'),
            'medical_history': data.get('medical_history', '')
        }
        
        # 提取生命体征
        vital_signs = {}
        if data.get('blood_pressure'):
            vital_signs['血压'] = data['blood_pressure']
        if data.get('heart_rate'):
            vital_signs['心率'] = data['heart_rate']
        if data.get('temperature'):
            vital_signs['体温'] = data['temperature']
        if data.get('blood_oxygen'):
            vital_signs['血氧'] = data['blood_oxygen']
            
        # 提取检验结果
        lab_results = {}
        if data.get('blood_sugar'):
            lab_results['血糖'] = data['blood_sugar']
        if data.get('blood_routine'):
            lab_results['血常规'] = data['blood_routine']
            
        # 进行诊断
        diagnosis_result = ai_doctor.diagnose(
            symptoms=data.get('symptoms', ''),
            medical_history=patient_info['medical_history'],
            age=patient_info['age'],
            gender=patient_info['gender'],
            vital_signs=vital_signs if vital_signs else None,
            lab_results=lab_results if lab_results else None
        )
        
        return jsonify({
            'success': True,
            'diagnosis': diagnosis_result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/diagnose/stream', methods=['POST'])
def diagnose_stream():
    try:
        data = request.json
        
        # 提取患者信息
        patient_info = {
            'age': data.get('age'),
            'gender': data.get('gender'),
            'medical_history': data.get('medical_history', '')
        }
        
        # 提取生命体征
        vital_signs = {}
        if data.get('blood_pressure'):
            vital_signs['血压'] = data['blood_pressure']
        if data.get('heart_rate'):
            vital_signs['心率'] = data['heart_rate']
        if data.get('temperature'):
            vital_signs['体温'] = data['temperature']
        if data.get('blood_oxygen'):
            vital_signs['血氧'] = data['blood_oxygen']
            
        # 提取检验结果
        lab_results = {}
        if data.get('blood_sugar'):
            lab_results['血糖'] = data['blood_sugar']
        if data.get('blood_routine'):
            lab_results['血常规'] = data['blood_routine']
            
        def generate():
            for chunk in ai_doctor.diagnose_stream(
                symptoms=data.get('symptoms', ''),
                medical_history=patient_info['medical_history'],
                age=patient_info['age'],
                gender=patient_info['gender'],
                vital_signs=vital_signs if vital_signs else None,
                lab_results=lab_results if lab_results else None
            ):
                yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
                
        return app.response_class(
            generate(),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no'
            }
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/prescribe', methods=['POST'])
def prescribe():
    try:
        data = request.json
        
        prescription = ai_doctor.prescribe_medication(
            diagnosis=data.get('diagnosis', ''),
            patient_info=data.get('patient_info', {})
        )
        
        return jsonify({
            'success': True,
            'prescription': prescription
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/generate_report', methods=['POST'])
def generate_report():
    try:
        data = request.json
        
        report_path = ai_doctor.generate_medical_report(
            patient_info=data.get('patient_info', {}),
            diagnosis=data.get('diagnosis', {}),
            prescription=data.get('prescription', {}),
            format=data.get('format', 'pdf')
        )
        
        return send_file(report_path, as_attachment=True)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        history = ai_doctor.get_diagnosis_history()
        return jsonify({
            'success': True,
            'history': history
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print(f"🩺 AI智能医生诊断系统启动中...")
    print(f"📍 访问地址: http://localhost:5002")
    print(f"🔑 API密钥状态: {'已配置' if ANTHROPIC_API_KEY != 'your-api-key-here' else '未配置'}")
    print(f"💡 提示: 按 Ctrl+C 停止服务器\n")
    
    app.run(host='0.0.0.0', port=5002, debug=True)