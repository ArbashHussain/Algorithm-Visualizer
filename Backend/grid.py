import pygame 
from themes.colors import *
from themes.themes import themes

WIDTH = 800
WIN = pygame.display.set_mode((WIDTH, WIDTH))
pygame.display.set_caption("Path Finding Visualizer")


class Node:
    def __init__(self, row, col, width, total_rows, theme_type):
        self.last = pygame.time.get_ticks()
        self.row = row
        self.col = col
        self.x = row*width
        self.y = col*width
        self.theme_type = theme_type
        self.color = themes[self.theme_type]["plane_color"]
        self.width = width
        self.neighbors = []
        self.total_rows = total_rows
        self.weight = False
        self.dec_animation = False
        self.cooldown = 300
        self.distance = float('inf')
        self.t = 0
        
    def set_distance(self, distance):
        self.distance = distance

    def get_distance(self):
        return self.distance

    def get_pos(self):
        return self.row, self.col

    def is_visited(self):
        return self.color == themes[self.theme_type]["closed_color"]

    def is_open(self):
        return self.color == themes[self.theme_type]["open_color"]

    def is_barrier(self):
        return self.color == themes[self.theme_type]["barrier_color"]

    def is_weight(self):
        return self.weight

    def is_start(self):
        return self.color == themes[self.theme_type]["start_color"]

    def is_end(self):
        return self.color == themes[self.theme_type]["end_color"]

    def is_neutral(self):
        return self.color == themes[self.theme_type]["plane_color"]

    def is_looked(self):
        return self.color == themes[self.theme_type]["look_color"]

    def reset(self):
        self.color = themes[self.theme_type]["plane_color"]
        self.weight = False

    def make_visit(self):
        if not self.is_weight():
            self.color = themes[self.theme_type]["closed_color_2"]
        else:
            self.color = themes[self.theme_type]["closed_color_3"]

    def make_open(self):
        if not self.is_weight():
            self.color = themes[self.theme_type]["open_color_1"]
        else:
            self.color = themes[self.theme_type]["open_color_2"]

    def make_start(self):
        self.color = themes[self.theme_type]["start_color"]
        self.weight = False

    def make_barrier(self):
        if not self.is_start() and not self.is_end():
            self.color = themes[self.theme_type]["barrier_color"]
            self.weight = False

    def make_weight(self):
        if not self.is_start() and not self.is_end():
            self.color = themes[self.theme_type]["weight_color"]
            self.weight = True

    def make_end(self):
        self.color = themes[self.theme_type]["end_color"]
        self.weight = False

    def make_path(self):
        if not self.is_weight():
            self.color = themes[self.theme_type]["path_color_1"]
        else:
            self.color = themes[self.theme_type]["path_color_2"]

    def looking_at(self):
        self.color = themes[self.theme_type]["look_color"]

    def draw(self, win):
        pygame.draw.rect(win, self.color, (self.x, self.y, self.width, self.width))

    def update_neighbors(self, grid, diag=False):
        r = self.row
        c = self.col
        if r < self.total_rows-1 and not grid[r+1][c].is_barrier():
            self.neighbors.append(grid[r+1][c])

        if r > 0 and not grid[r-1][c].is_barrier():
            self.neighbors.append(grid[r-1][c])

        if c < self.total_rows-1 and not grid[r][c+1].is_barrier():
            self.neighbors.append(grid[r][c+1])

        if c > 0 and not grid[r][c-1].is_barrier():
            self.neighbors.append(grid[r][c-1])

        if diag:
            if r < self.total_rows-1 and c < self.total_rows-1 and not grid[r+1][c+1].is_barrier():
                self.neighbors.append(grid[r+1][c+1])

            if r > 0 and c < self.total_rows-1 and not grid[r-1][c+1].is_barrier():
                self.neighbors.append(grid[r-1][c+1])

            if r > 0 and c > 0 and not grid[r-1][c-1].is_barrier():
                self.neighbors.append(grid[r-1][c-1])

            if r < self.total_rows-1 and c > 0 and not grid[r+1][c-1].is_barrier():
                self.neighbors.append(grid[r+1][c-1])

    def __lt__(self, other):
        return False

def make_grid(rows, width, theme_type):
    grid = []
    node_width = width // rows
    for i in range(rows):
        grid.append([]) 
        for j in range(rows):
            node = Node(i, j, node_width, rows, theme_type=theme_type)
            grid[i].append(node)
    return grid

def lerp_color(color1, color2, t):
    return (int(color1[i] * (1 - t) + color2[i] * t) for i in range(3))


def draw_grid(win, grid, width, theme_type):
    rows = len(grid)

    gap = width // rows

    for i in range(rows+1):
        pygame.draw.line(win, themes[theme_type]["grid_color"], (0, i*gap), (rows*gap, i*gap))
        
        
    for i in range(rows+1):
        pygame.draw.line(win, themes[theme_type]["grid_color"], (i*gap, 0), (i*gap, rows*gap))

def get_clicked_pos(pos, rows, width):
    node_width = width//rows
    y, x = pos
    row = y // node_width
    col = x // node_width
    return row, col

def is_free(grid, x, y):
    count = 0
    if y+1 < len(grid) and grid[x][y+1].is_barrier():
        count += 1
    if y-1 >= 0 and grid[x][y-1].is_barrier():
        count += 1
    if x+1 < len(grid) and grid[x+1][y].is_barrier():
        count += 1
    if x-1 >= 0 and grid[x-1][y].is_barrier():
        count += 1
    if count >= 3:
        return True
    return False


def unvisited_n(grid, x, y):
    n = []
    if y+1 < len(grid) and grid[x][y+1].is_barrier() and is_free(grid, x, y+1):
        n.append((x, y+1))
    if y-1 >= 0 and grid[x][y-1].is_barrier() and is_free(grid, x, y-1):
        n.append((x, y-1))
    if x+1 < len(grid) and grid[x+1][y].is_barrier() and is_free(grid, x+1, y):
        n.append((x+1, y))
    if x-1 >= 0 and grid[x-1][y].is_barrier() and is_free(grid, x-1, y):
        n.append((x-1, y))
    return n