# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for WeMediaGo
Build command: pyinstaller wemediago.spec --clean --noconfirm
"""

import os
import sys
import platform
from pathlib import Path

# 获取项目根目录（spec文件所在目录）
root_dir = Path(os.getcwd())

# 检查前端文件是否存在
web_app_path = root_dir / 'iopaint' / 'web_app'
if not web_app_path.exists():
    print(f"警告: 前端文件目录 {web_app_path} 不存在，请先构建前端")

# 分析主入口文件
a = Analysis(
    ['main.py'],
    pathex=[str(root_dir)],
    binaries=[],
    datas=[
        # 包含前端静态文件
        (str(root_dir / 'iopaint' / 'web_app'), 'iopaint/web_app'),
        # 包含模型目录（如果需要打包模型文件，取消下面的注释）
        # (str(root_dir / 'models'), 'models'),
    ],
    hiddenimports=[
        'iopaint',
        'iopaint.api',
        'iopaint.cli',
        'iopaint.model',
        'iopaint.model.lama',
        'iopaint.plugins',
        'iopaint.runtime',
        'iopaint.schema',
        'iopaint.__init__',
        'fastapi',
        'uvicorn',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.loops.uvloop',
        'socketio',
        'typer',
        'typer_config',
        'rich',
        'loguru',
        'yacs',
        'piexif',
        'omegaconf',
        'easydict',
        'gradio',
        'torch',
        'torchvision',
        'cv2',
        'PIL',
        'PIL.Image',
        'diffusers',
        'transformers',
        'huggingface_hub',
        'accelerate',
        'peft',
        'safetensors',
        'pydantic',
        'numpy',
        'opencv-python',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # 排除不需要的模块以减少打包体积
        'matplotlib',
        'IPython',
        'jupyter',
        'notebook',
        'pytest',
        'setuptools',
        'tkinter',
    ],
    noarchive=False,
    optimize=0,
)

# 过滤不需要的文件
pyz = PYZ(a.pure, a.zipped_data, cipher=None)

# 根据平台设置可执行文件名称和配置
is_windows = platform.system() == 'Windows'
is_macos = platform.system() == 'Darwin'
is_linux = platform.system() == 'Linux'

# Windows需要.exe扩展名
exe_name = 'wemediago.exe' if is_windows else 'wemediago'

# 创建可执行文件
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name=exe_name.replace('.exe', ''),  # PyInstaller会自动添加.exe（Windows）
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True if not is_macos else False,  # macOS上UPX可能有问题
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # 显示控制台窗口，Web应用通常需要
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # 如果需要，可以添加图标文件路径
)

