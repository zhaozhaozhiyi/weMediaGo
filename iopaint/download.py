import os
from typing import List
from pathlib import Path

from iopaint.schema import ModelType, ModelInfo
from loguru import logger

from iopaint.const import DEFAULT_MODEL_DIR


def cli_download_model(model: str):
    from iopaint.model import models

    if model in models and models[model].is_erase_model:
        logger.info(f"Checking {model}...")
        if not models[model].is_downloaded():
            raise FileNotFoundError(
                f"Model {model} not found. Please ensure the model file is in the correct location."
            )
        logger.info("Model found.")
    else:
        logger.error(f"Unsupported model: {model}")


def scan_inpaint_models(model_dir: Path) -> List[ModelInfo]:
    res = []
    from iopaint.model import models

    for name, m in models.items():
        if m.is_erase_model and m.is_downloaded():
            res.append(
                ModelInfo(
                    name=name,
                    path=name,
                    model_type=ModelType.INPAINT,
                )
            )
    return res


def scan_models() -> List[ModelInfo]:
    model_dir = os.getenv("XDG_CACHE_HOME", DEFAULT_MODEL_DIR)
    available_models = []
    available_models.extend(scan_inpaint_models(model_dir))
    return available_models
