#!/usr/bin/env python3
"""eduluck 로고 컨셉 B (사주 4기둥 그리드) PNG 생성.

생성 파일:
- assets/favicon.png      32×32 (Vercel favicon)
- assets/icon.png         1024×1024 (Expo app icon)
- assets/adaptive-icon.png 1024×1024 (Android adaptive icon)
- assets/splash.png       1242×2436 (iPhone X splash)
- assets/og-image.png     1200×630 (Vercel OG meta)
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)

# DESIGN v1.1 colors
SURFACE = (251, 248, 241, 255)           # #FBF8F1
PRIMARY = (74, 85, 104, 255)             # #4A5568
SECONDARY = (212, 165, 116, 255)         # #D4A574 (일간 강조)
OUTLINE = (226, 222, 213, 255)           # #E2DED5
TEXT_PRI = (45, 45, 45, 255)             # #2D2D2D
TEXT_SUB = (107, 107, 107, 255)          # #6B6B6B


def grid_logo(size: int, padding_ratio: float = 0.125, gap_ratio: float = 0.0625,
              bg: tuple = SURFACE) -> Image.Image:
    """4기둥 그리드 logo (단독 mark)."""
    img = Image.new("RGBA", (size, size), bg)
    draw = ImageDraw.Draw(img)
    pad = int(size * padding_ratio)
    gap = max(1, int(size * gap_ratio))
    cell = (size - 2 * pad - gap) // 2
    radius = max(2, int(cell * 0.15))

    # 좌상 (시주) — primary
    draw.rounded_rectangle((pad, pad, pad + cell, pad + cell),
                           radius=radius, fill=PRIMARY)
    # 우상 (일주) — secondary 골드 (일간 강조)
    draw.rounded_rectangle((pad + cell + gap, pad,
                            pad + cell + gap + cell, pad + cell),
                           radius=radius, fill=SECONDARY)
    # 좌하 (월주) — primary
    draw.rounded_rectangle((pad, pad + cell + gap,
                            pad + cell, pad + cell + gap + cell),
                           radius=radius, fill=PRIMARY)
    # 우하 (년주) — primary
    draw.rounded_rectangle((pad + cell + gap, pad + cell + gap,
                            pad + cell + gap + cell, pad + cell + gap + cell),
                           radius=radius, fill=PRIMARY)
    return img


def og_image(width: int = 1200, height: int = 630) -> Image.Image:
    """OG image — logo + brand name + tagline."""
    img = Image.new("RGBA", (width, height), SURFACE)
    draw = ImageDraw.Draw(img)

    # logo 좌측 (가운데 정렬)
    logo_size = 320
    logo = grid_logo(logo_size, padding_ratio=0.0, gap_ratio=0.04)
    logo_x = 160
    logo_y = (height - logo_size) // 2
    img.paste(logo, (logo_x, logo_y), logo)

    # text 우측
    text_x = logo_x + logo_size + 80
    # 시스템 폰트 fallback (정밀 디자인은 디자이너 작업)
    try:
        font_title = ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", 96)
        font_sub = ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", 36)
        font_body = ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", 28)
    except Exception:
        font_title = ImageFont.load_default()
        font_sub = font_title
        font_body = font_title

    draw.text((text_x, 180), "eduluck", fill=TEXT_PRI, font=font_title)
    draw.text((text_x, 300), "우리 아이 학운, 사주로 봅니다", fill=TEXT_SUB, font=font_sub)
    draw.text((text_x, 380), "학년대별 흐름 · 어머니 사주 합 분석", fill=TEXT_SUB, font=font_body)
    return img


def save(img: Image.Image, name: str):
    path = ASSETS / name
    img.save(path, "PNG", optimize=True)
    print(f"✓ {path.relative_to(ROOT)} ({img.width}×{img.height}, {path.stat().st_size} B)")


# Favicon (web)
save(grid_logo(32), "favicon.png")

# Expo app icon (square, padding 12.5%)
save(grid_logo(1024), "icon.png")

# Android adaptive icon (foreground — gradient bg 별도 처리)
save(grid_logo(1024, padding_ratio=0.25), "adaptive-icon.png")

# Splash (단순화 — 가운데 logo + 한지 배경)
splash_w, splash_h = 1242, 2436
splash = Image.new("RGBA", (splash_w, splash_h), SURFACE)
logo_sz = 400
logo_img = grid_logo(logo_sz, padding_ratio=0.0, gap_ratio=0.05)
splash.paste(logo_img, ((splash_w - logo_sz) // 2, (splash_h - logo_sz) // 2), logo_img)
save(splash, "splash.png")

# OG image (social meta)
save(og_image(), "og-image.png")

print("\n로고 컨셉 B (사주 4기둥 그리드) 생성 완료.")
