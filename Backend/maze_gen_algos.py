import pygame
import random
from grid import *
import numpy as np

def make_black(grid, win):
    for row in grid:
        for node in row:
            node.make_barrier()
            node.draw(win)
    pygame.display.update()

def maze_gen_dfs(draw, width, grid, start, end, left, right, top, bottom, win, theme_type, vertical=True):
    make_black(grid, win)
    x, y = 1, 1
    head = grid[x][y]
    head.looking_at()
    stack = [(x, y)]
    while True:
        neighbors = unvisited_n(grid, x, y)
        if len(neighbors) > 0:
            random_index = np.random.randint(len(neighbors))
            x, y = neighbors[random_index]
            head = grid[x][y]
            head.looking_at()
            stack.append((x, y))
            head.draw(win)
            draw_grid(win, grid, width, theme_type)
            pygame.display.update()
        else:
            if len(stack) > 0:
                x, y = stack.pop()
                grid[x][y].reset()
                grid[x][y].draw(win)
                draw_grid(win, grid, width, theme_type)
                pygame.display.update()
            if len(stack) > 0:
                x, y = stack[-1]
            else:
                break

def maze_gen_random(draw, width, grid, start, end, left, right, top, bottom, win, theme_type, vertical=True):
    make_black(grid,win)
    for row in range(len(grid)):
        for col in range(len(grid)):
            a = random.randint(1,10)
            if(a>4):
                head = grid[col][row]
                head.looking_at()
                head.draw(win)
                grid[col][row].reset()
                draw_grid(win, grid, width,theme_type)
        
            pygame.display.update()