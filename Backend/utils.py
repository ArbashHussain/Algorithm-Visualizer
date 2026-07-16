from themes.colors import *
import numpy as np
import simpleaudio as sa
from grid import *
from system import *

SCALE_FACTOR = 20

def h_score(p1, p2):
    """Calculate heuristic using Manhattan distance

    Args:
        p1 (x,y): coordinates of point1
        p2 (x,y): coordinates of point2
    """
    x1, y1 = p1
    x2, y2 = p2
    return abs(x2 - x1) + abs(y2 - y1)


def update_info_screen(win,obj,color=BLACK,text1="",text2="",text3=""):
    if text1 != "":
        obj.set_text1(text1)
    if text2 != "":
        obj.set_text2(text2)
    if text3 != "":
        obj.set_text3(text3)
    obj.draw(win,color)


        
def play_sound(frequency, duration=0.008):
    try:
        sample_rate = 44100
        t = np.linspace(0, duration, int(sample_rate * duration), False)
        tone = np.sin(frequency * t * 2 * np.pi)
        audio = tone * (2**15 - 1) / np.max(np.abs(tone))
        audio = audio.astype(np.int16)
        play_obj = sa.play_buffer(audio, 1, 2, sample_rate)
        play_obj.wait_done()
    except Exception as e:
        pass

def prepare_for_search(weighted,start,end,grid,algorithm,algorithms,index):
    if len(weighted):
        for node in weighted:
            node.mark_weight()
            
    if start and end:
        for row in grid:
            for node in row:
                node.update_neighbors(grid)
                if not node.is_neutral() and node != start and node != end and not node.is_barrier() and not node.is_weight():
                    node.reset()
                    
        search_algorithm = algorithm
                        
        algorithms[index].toggle_color()
        
        return search_algorithm
    
def prepare_for_maze(algorithm,output,win,grid,ROWS,width,algorithms,mazes,back_button,options,theme_type):
    start = None
    end = None
    output.set_text1("Instructions")
    output.set_text2("")
    output.set_text3("")
    output.set_text4("""
     1. Pick source node\n
     2. Pick destination node\n
     3. Select the search algorithm.\n
     """)
    maze_gen_algorithm = algorithm(lambda: draw(win, grid, ROWS, width, algorithms, mazes, back_button,
             options, output), width, grid, start, end, 0, ROWS, 0, ROWS, win,theme_type)
    return maze_gen_algorithm

def update_colors(grid,theme_type):
    for row in grid:
        for node in row:
            if theme_type == "Synth":
                node.theme_type = "Synth"
    return grid