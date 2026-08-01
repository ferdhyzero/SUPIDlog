from PIL import Image, ImageDraw
import math

# Create 512x512 transparent canvas for SUP Paddle Blade Icon
size = 512
img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Center points
cx = size // 2
cy = size // 2

# Draw SUP Paddle Blade (Teardrop-shaped paddle blade)
# Top shaft
shaft_w = 24
shaft_top = 40
shaft_bottom = 160

draw.rectangle(
    [cx - shaft_w // 2, shaft_top, cx + shaft_w // 2, shaft_bottom],
    fill=(2, 132, 199, 255)
)

# Paddle Blade body (Ergonomic teardrop blade for SUP)
blade_points = []
# Top transition
for t in range(0, 181):
    rad = math.radians(t)
    # Teardrop contour
    if t <= 90:
        x = cx + 130 * math.sin(rad) * (1 + 0.3 * math.cos(rad))
        y = 160 + 260 * (1 - math.cos(rad * 0.5))
    else:
        x = cx + 130 * math.sin(rad) * (1 - 0.3 * math.cos(rad))
        y = 160 + 260 * (1 - math.cos(rad * 0.5))
    blade_points.append((x, y))

# Draw smooth polygon blade
draw.polygon(blade_points, fill=(2, 132, 199, 255))

# Draw inner accent rib / spine along paddle blade
draw.line([cx, shaft_top, cx, 430], fill=(255, 255, 255, 200), width=8)

# Save to public directory
img.save("c:/xampp1/htdocs/SUPIDlog/public/sup-paddle-blade-icon.webp", "WEBP", quality=90)
print("SUP Paddle Blade icon created successfully!")
