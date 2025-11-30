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

# 检查模型文件是否存在
model_path = root_dir / 'models' / 'lama' / 'big-lama.pt'
if model_path.exists():
    model_size_mb = model_path.stat().st_size / (1024 * 1024)
    print(f"✅ 找到模型文件: {model_path.name} ({model_size_mb:.1f} MB)")
else:
    print(f"⚠️  警告: 模型文件 {model_path} 不存在，模型将不会被打包")

# 分析主入口文件
a = Analysis(
    ['main.py'],
    pathex=[str(root_dir)],
    binaries=[],
    datas=[
        # 包含前端静态文件
        (str(root_dir / 'iopaint' / 'web_app'), 'iopaint/web_app'),
        # ✅ 包含模型目录（模型文件已存在于项目中）
        (str(root_dir / 'models'), 'models') if model_path.exists() else None,
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

# 过滤 None 值（如果模型文件不存在）
a.datas = [d for d in a.datas if d is not None]

# 过滤不需要的文件
pyz = PYZ(a.pure, a.zipped_data, cipher=None)

# 根据平台设置可执行文件名称和配置
is_windows = platform.system() == 'Windows'
is_macos = platform.system() == 'Darwin'
is_linux = platform.system() == 'Linux'

# 可执行文件名称
exe_name = 'WeMediaGo'

# 创建基础可执行文件
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name=exe_name,
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True if not is_macos else False,  # macOS 不使用 UPX
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # True=显示控制台窗口, False=隐藏控制台（适合最终用户）
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    icon=None,  # 可以添加图标文件路径
    uac_admin=False,  # Windows: 是否需要管理员权限
)

# macOS: 包装成 .app 包（双击运行）
if is_macos:
    app = BUNDLE(
        exe,
        name='WeMediaGo.app',
        icon=None,  # macOS 图标: 'assets/icon.icns'
        bundle_identifier='com.wemediago.app',
        info_plist={
            'NSPrincipalClass': 'NSApplication',
            'NSHighResolutionCapable': 'True',
            'CFBundleShortVersionString': '1.0.0',
            'CFBundleVersion': '1.0.0',
            'LSMinimumSystemVersion': '10.13',
            'NSRequiresAquaSystemAppearance': 'False',
            'CFBundleName': 'WeMediaGo',
            'CFBundleDisplayName': 'WeMediaGo',
            'CFBundleExecutable': 'WeMediaGo',
        },
    )

