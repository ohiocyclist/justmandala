# standalone Python Qt6 port of the simplest version, courtesy Copilot

import sys
import math
import random
from PyQt6.QtCore import Qt, QPoint
from PyQt6.QtGui import QPainter, QPen, QPixmap, QColor
from PyQt6.QtWidgets import (
    QApplication, QWidget, QLabel, QPushButton, QSlider,
    QHBoxLayout, QVBoxLayout, QGridLayout
)


class SymmetryCanvas(QWidget):
    def __init__(self, size=600, parent=None):
        super().__init__(parent)
        self.setFixedSize(size, size)
        self.symmetry = size
        self.center = QPoint(self.symmetry // 2, self.symmetry // 2)

        self.pixmap = QPixmap(self.size())
        self.pixmap.fill(Qt.GlobalColor.white)

        self.color = QColor("#1A202C")
        self.line_width = 4
        self.symmetry_count = 17
        self.fill_mode = "draw"   # fillOne, fillHalf, fillAll

        self.prev_pos = None
        self.setMouseTracking(True)

    def set_color(self, color_str: str):
        self.color = QColor(color_str)

    def set_line_width(self, w: int):
        self.line_width = max(1, w)

    def set_symmetry_count(self, n: int):
        self.symmetry_count = max(2, n)

    def set_fill_mode(self, mode: str):
        self.fill_mode = mode

    def reset(self):
        self.pixmap.fill(Qt.GlobalColor.white)
        self.prev_pos = None
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.drawPixmap(0, 0, self.pixmap)

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            if self.fill_mode in ("fillOne", "fillHalf", "fillAll"):
                self.fill_at_point(event.position().toPoint())
            else:
                self.prev_pos = event.position().toPoint()


    def mouseMoveEvent(self, event):
        if self.fill_mode != "draw":
            return
        
        if event.buttons() & Qt.MouseButton.LeftButton:
            current_pos = event.position().toPoint()
            if self.prev_pos is not None:
                painter = QPainter(self.pixmap)
                pen = QPen(self.color, self.line_width, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap)
                painter.setPen(pen)
                self.draw_line(self.prev_pos, current_pos, painter)
                painter.end()
                self.update()
            self.prev_pos = current_pos
        else:
            self.prev_pos = event.position().toPoint()

    def mouseReleaseEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.prev_pos = None

    def is_white(self, r, g, b, a):
        return r > 240 and g > 240 and b > 240 and a > 240

    def flood_fill(self, img: QImage, x: int, y: int):
        w = img.width()
        h = img.height()

        target = img.pixelColor(x, y)
        if not self.is_white(target.red(), target.green(), target.blue(), target.alpha()):
            return []

        stack = [(x, y)]
        visited = set()
        region = []

        while stack:
            px, py = stack.pop()
            if (px, py) in visited:
                continue
            visited.add((px, py))

            if px < 0 or px >= w or py < 0 or py >= h:
                continue

            c = img.pixelColor(px, py)
            if not self.is_white(c.red(), c.green(), c.blue(), c.alpha()):
                continue

            region.append((px, py))

            stack.extend([
                (px+1, py),
                (px-1, py),
                (px, py+1),
                (px, py-1)
            ])

        return region

    def fill_at_point(self, point: QPoint):
        img = self.pixmap.toImage()
        w = img.width()

        symmetric_points = self.get_symmetry_points(point)

        idx = 0
        for sp in symmetric_points:
            px, py = sp.x(), sp.y()

            # fillHalf → only every 4th region
            if self.fill_mode == "fillHalf" and idx % 4 != 0:
                idx += 1
                continue

            idx += 1

            region = self.flood_fill(img, px, py)
            if not region:
                continue

            for rx, ry in region:
                img.setPixelColor(rx, ry, self.color)

            if self.fill_mode == "fillOne":
                break

        self.pixmap = QPixmap.fromImage(img)
        self.update()    

    def get_symmetry_points(self, point: QPoint):
        ctrX = self.center.x()
        ctrY = self.center.y()
        relX = point.x() - ctrX
        relY = ctrY - point.y()

        dist = math.hypot(relX, relY)
        angle = math.atan2(relX, relY)  # radians

        result = []
        n = self.symmetry_count

        for i in range(n):
            theta = angle + ((math.pi * 2) / n) * i
            x = ctrX + math.sin(theta) * dist
            y = ctrY - math.cos(theta) * dist
            result.append(QPoint(int(x), int(y)))

            # mirror horizontally (like JS code's second push)
            x_m = ctrX - math.sin(theta) * dist
            result.append(QPoint(int(x_m), int(y)))

        return result

    def draw_line(self, p1: QPoint, p2: QPoint, painter: QPainter):
        start_points = self.get_symmetry_points(p1)
        end_points = self.get_symmetry_points(p2)

        for s, e in zip(start_points, end_points):
            painter.drawLine(s, e)


class SymmetryApp(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Symmetric Drawing - PyQt6")

        self.canvas = SymmetryCanvas(size=600)

        # Sliders
        self.width_slider = QSlider(Qt.Orientation.Horizontal)
        self.width_slider.setRange(1, 50)
        self.width_slider.setValue(4)
        self.width_label = QLabel("Line width: 4")

        self.sym_slider = QSlider(Qt.Orientation.Horizontal)
        self.sym_slider.setRange(1, 64)
        self.sym_slider.setValue(17)
        self.sym_label = QLabel("Symmetry count: 17")

        self.width_slider.valueChanged.connect(self.on_width_changed)
        self.sym_slider.valueChanged.connect(self.on_sym_changed)

        # Color buttons
        colors = [
            ("Red", "#FC8181"),
            ("Orange", "orange"),
            ("Blue", "#4383ED"),
            ("Green", "#2FD175"),
            ("Black", "#000000"),
            ("Purple", "#9F7AEA"),
            ("Eraser", "#FFFFFF"),
        ]

        color_layout = QHBoxLayout()
        for name, c in colors:
            btn = QPushButton(name)
            btn.clicked.connect(lambda _, col=c: self.canvas.set_color(col))
            color_layout.addWidget(btn)

        # Control buttons
        self.reset_btn = QPushButton("Reset")
        self.reset_btn.clicked.connect(self.canvas.reset)

        self.fill_all_btn = QPushButton("Fill All")
        self.fill_all_btn.clicked.connect(lambda: self.canvas.set_fill_mode("fillAll"))

        self.fill_half_btn = QPushButton("Fill Half")
        self.fill_half_btn.clicked.connect(lambda: self.canvas.set_fill_mode("fillHalf"))

        self.fill_one_btn = QPushButton("Fill One")
        self.fill_one_btn.clicked.connect(lambda: self.canvas.set_fill_mode("fillOne"))

        self.draw_btn = QPushButton("Draw Mode")
        self.draw_btn.clicked.connect(lambda: self.canvas.set_fill_mode("draw"))

        control_layout = QHBoxLayout()
        control_layout.addWidget(self.reset_btn)
        control_layout.addWidget(self.fill_all_btn)
        control_layout.addWidget(self.fill_half_btn)
        control_layout.addWidget(self.fill_one_btn)
        control_layout.addWidget(self.draw_btn)

        # Layout
        sliders_layout = QGridLayout()
        sliders_layout.addWidget(self.width_label, 0, 0)
        sliders_layout.addWidget(self.width_slider, 0, 1)
        sliders_layout.addWidget(self.sym_label, 1, 0)
        sliders_layout.addWidget(self.sym_slider, 1, 1)

        main_layout = QVBoxLayout()
        main_layout.addWidget(self.canvas)
        main_layout.addLayout(sliders_layout)
        main_layout.addLayout(color_layout)
        main_layout.addLayout(control_layout)

        self.setLayout(main_layout)

    def on_width_changed(self, value):
        self.width_label.setText(f"Line width: {value}")
        self.canvas.set_line_width(value)

    def on_sym_changed(self, value):
        self.sym_label.setText(f"Symmetry count: {value}")
        self.canvas.set_symmetry_count(value)


def main():
    app = QApplication(sys.argv)
    w = SymmetryApp()
    w.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
