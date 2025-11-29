import os
from pathlib import Path

import cv2
import numpy as np
import torch

from iopaint.helper import (
    norm_img,
    load_jit_model,
)
from iopaint.schema import InpaintRequest
from .base import InpaintModel

# 获取项目根目录（iopaint的父目录）
CURRENT_DIR = Path(__file__).parent.parent.parent.absolute()
LOCAL_MODEL_PATH = CURRENT_DIR / "models" / "lama" / "big-lama.pt"
# MD5校验值
LAMA_MODEL_MD5 = "e3aa4aaa15225a33ec84f9f4bc47e500"


class LaMa(InpaintModel):
    name = "lama"
    pad_mod = 8
    is_erase_model = True

    @staticmethod
    def download():
        # 模型已本地化，不需要下载
        if not LOCAL_MODEL_PATH.exists():
            raise FileNotFoundError(
                f"LaMa model not found at {LOCAL_MODEL_PATH}. "
                f"Please place big-lama.pt in the models/lama/ directory."
            )

    def init_model(self, device, **kwargs):
        if not LOCAL_MODEL_PATH.exists():
            raise FileNotFoundError(
                f"LaMa model not found at {LOCAL_MODEL_PATH}. "
                f"Please place big-lama.pt in the models/lama/ directory."
            )
        self.model = load_jit_model(str(LOCAL_MODEL_PATH), device, LAMA_MODEL_MD5).eval()

    @staticmethod
    def is_downloaded() -> bool:
        return LOCAL_MODEL_PATH.exists()

    def forward(self, image, mask, config: InpaintRequest):
        """Input image and output image have same size
        image: [H, W, C] RGB
        mask: [H, W]
        return: BGR IMAGE
        """
        image = norm_img(image)
        mask = norm_img(mask)

        mask = (mask > 0) * 1
        image = torch.from_numpy(image).unsqueeze(0).to(self.device)
        mask = torch.from_numpy(mask).unsqueeze(0).to(self.device)

        inpainted_image = self.model(image, mask)

        cur_res = inpainted_image[0].permute(1, 2, 0).detach().cpu().numpy()
        cur_res = np.clip(cur_res * 255, 0, 255).astype("uint8")
        cur_res = cv2.cvtColor(cur_res, cv2.COLOR_RGB2BGR)
        return cur_res
