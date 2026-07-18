import pygame
from grid import *
from themes.colors import *
from themes.animations import *
from system import *
from maze_search_algos import *
from maze_gen_algos import *
from gen_info import *
from search_info import *
import main_app
ICON_SIZE = (50,50)

def main(win, width):
    theme_type = 'Default'
    ROWS = 25
    w, ht = pygame.display.get_surface().get_size()
    width = ht
    grid = make_grid(ROWS, width, theme_type)
    delta = w - width

    top_start = ht/30
    but_height = ht//15
    but_width = delta//1.7
    horizontal_gap_factor = but_width-but_height  
    vertical_gap_factor = but_height
    start_factor = 3

    # Define your button
    back_button = {}
    mode_button = {}
    
    black_back_icon = pygame.image.load('assets/black_back.png')
    black_day_icon = pygame.image.load('assets/black_sun.png')
    
    white_back_icon = pygame.image.load('assets/white_back.png')
    white_night_icon = pygame.image.load('assets/white_moon.png')
    
    create_button(back_button, black_back_icon,((820), (ht//40)/2.5))
    create_button(mode_button, black_day_icon, ((1440), (ht//40)/2.5))
    
    algorithms = [
        button(width + start_factor, top_start + vertical_gap_factor,
               but_width-but_height, but_height, text='BFS',theme_type=theme_type),
    
        button(width + start_factor, top_start + (2*vertical_gap_factor),
               but_width-but_height, but_height, text='Bi-BFS',theme_type=theme_type),
    
        button(width + start_factor, top_start + (3*vertical_gap_factor),
               but_width-but_height, but_height, text='DFS',theme_type=theme_type),
        
        button(width + start_factor, top_start + (4*vertical_gap_factor), 
               but_width-but_height, but_height, text='Dijkstra',theme_type=theme_type),
        
        button(width + start_factor + horizontal_gap_factor,
               top_start + vertical_gap_factor, but_width-but_height, but_height, text="A*",theme_type=theme_type),

        button(width + start_factor + horizontal_gap_factor, top_start +
                (2*vertical_gap_factor), but_width-but_height, but_height, text='IDA*',theme_type=theme_type),

        button(width + start_factor + horizontal_gap_factor, top_start +
               (3*vertical_gap_factor), but_width-but_height, but_height, text='Bi-A*',theme_type=theme_type),
   
        button(width + start_factor + horizontal_gap_factor, top_start +
               (4*vertical_gap_factor), but_width-but_height, but_height, text='Bellman Ford',theme_type=theme_type),
    ]

    mazes = [
        button(width + start_factor, top_start + (7*vertical_gap_factor), but_width-but_height, but_height, text="DFS Maze",theme_type=theme_type),
    ]
    but_width = but_width//1.4
    horizontal_gap_factor = but_width-but_height
    options = [
        button(width + start_factor, top_start +
               (9*vertical_gap_factor), but_width-but_height, but_height, text="Clear",theme_type=theme_type),
        
        button(width + start_factor + horizontal_gap_factor, top_start +
               (9*vertical_gap_factor), but_width-but_height, but_height, text="Decrease Nodes",theme_type=theme_type),
        
        button(width + start_factor + (2*horizontal_gap_factor), top_start +
               (9*vertical_gap_factor), but_width-but_height, but_height, text="Increase Nodes",theme_type=theme_type),
    ]
    sc_start = ht-240
    sc_height = 250
    output = screen(width+start_factor, sc_start, 700,
                    sc_height, "Instructions",color=themes[theme_type]["output_screen_color"])
    output.set_label1(f"Rows: {ROWS}")
    output.set_text4("""
                     1. Pick source node\n
                     2. Pick destination node\n
                     3. Select the search algorithm.\n
                     """)

    start = None
    end = None

    run = True
    started = False
    visited = []
    weighted = []
    path = False
    search_algorithm = None
    maze_gen_algorithm = maze_gen_dfs
    while run:
        if len(visited):
            visit_animation(visited,theme_type)

        if path:
            path_animation(path,theme_type)

        draw(win, grid, ROWS, width, algorithms, mazes, back_button, mode_button, options, output, theme_type)
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                run = False

            if started:
                continue
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE:
                    if search_algorithm:
                        visited = []
                        path = []
                        output.set_text2("")
                        output.set_text3("")
                        output.set_text4("")
                        output.draw(win, outline=BLACK,theme_type=theme_type)
                        pygame.display.update()
                        visited, path = search_algorithm(lambda: draw(win, grid, ROWS, width, algorithms, mazes, back_button, mode_button, options, output, theme_type), grid, start, end, output, win, width, theme_type, True)
                        if not path:
                            output.set_text1("Path not available")
                    else:
                        continue

                elif algorithms[1].is_hover(pos):
                    algorithms[1].toggle_color()
                    output.set_text1("Bi-directional BFS")
                    output.set_text4(BI_BFS)
                    search_algorithm = prepare_for_search(weighted,start,end,grid,maze_bi_bfs,algorithms,1)

                elif algorithms[2].is_hover(pos):
                    algorithms[2].toggle_color()
                    output.set_text1("Depth First Search")
                    output.set_text4(DFS)
                    search_algorithm = prepare_for_search(weighted,start,end,grid,maze_dfs,algorithms,2)

                elif algorithms[3].is_hover(pos):
                    algorithms[3].toggle_color()
                    output.set_text1("Dijkstra")
                    output.set_text4(DIJKSTRA)
                    search_algorithm = prepare_for_search(weighted,start,end,grid,maze_dijkstra,algorithms,3)

                elif algorithms[4].is_hover(pos):
                    algorithms[4].toggle_color()
                    output.set_text1("A star")
                    output.set_text4(A_STAR)
                    search_algorithm = prepare_for_search(weighted,start,end,grid,maze_astar,algorithms,4)

                elif algorithms[5].is_hover(pos):
                    algorithms[5].toggle_color()
                    output.set_text1("Iterative Deepening A star")
                    output.set_text4(IDA_STAR)
                    search_algorithm = prepare_for_search(weighted,start,end,grid,maze_idastar,algorithms,5)

                elif algorithms[6].is_hover(pos):
                    algorithms[6].toggle_color()
                    output.set_text1("Bi-directional A star")
                    output.set_text4(BI_A_STAR)
                    search_algorithm = prepare_for_search(weighted,start,end,grid,maze_bi_astar,algorithms,6)
                
                elif algorithms[7].is_hover(pos):
                    algorithms[7].toggle_color()
                    output.set_text1("Bellman-Ford")
                    output.set_text4(FLOYD)
                    search_algorithm = prepare_for_search(weighted,start,end,grid,maze_bellman_ford,algorithms,7)
                    

                elif mazes[0].is_hover(pos):
                    output.set_text1("DFS Maze")
                    output.set_text4(DFS_GEN)
                    output.set_text2("")
                    output.draw(win, outline=BLACK,theme_type=theme_type)
                    pygame.display.update()
                    grid = make_grid(ROWS, width, theme_type)
                    start = None
                    end = None
                    maze_gen_algorithm = prepare_for_maze(maze_gen_dfs, output, win, grid, ROWS, width, algorithms, mazes, back_button, mode_button, options, theme_type)

                elif options[0].is_hover(pos):
                    output.set_text1("")
                    output.set_text2("")
                    output.set_text3("")
                    output.set_text4("""
                     1. Pick source node\n
                     2. Pick destination node\n
                     3. Select the search algorithm.\n
                     """)
                    output.draw(win, outline=BLACK,theme_type=theme_type)
                    pygame.display.update()
                    weighted = []
                    start = None
                    end = None
                    visited = []
                    path = []
                    weighted = []
                    for row in grid:
                        for node in row:
                            node.reset()

                elif options[1].is_hover(pos):
                    weighted = []
                    start = None
                    end = None
                    visited = []
                    path = []
                    weighted = []
                    for row in grid:
                        for node in row:
                            node.reset()
                    if ROWS > 5:
                        ROWS -= 1
                        grid = make_grid(ROWS, width, theme_type)
                    output.set_label1(f"Rows {ROWS}")

                elif options[2].is_hover(pos):
                    weighted = []
                    start = None
                    end = None
                    visited = []
                    path = []
                    weighted = []
                    for row in grid:
                        for node in row:
                            node.reset()
                    if ROWS < 100:
                        ROWS += 1
                        grid = make_grid(ROWS, width,theme_type)
                    output.set_label1(f"Rows {ROWS}")

            elif pygame.mouse.get_pressed()[1]:
                pos = pygame.mouse.get_pos()
                row, col = get_clicked_pos(pos, ROWS, width)
                if row >= 0 and row < ROWS and col < ROWS and col >= 0:
                    node = grid[row][col]
                    if node in visited:
                        visited.remove(node)
                    if path:
                        if node in path:
                            path.remove(node)
                    if not start and node != end:
                        if node in visited:
                            visited.remove(node)
                        start = node
                        start.make_start()
                    elif not end and node != start:
                        end = node
                        end.make_end()
                    elif node != end and node != start:
                        node.make_weight()
            
            elif pygame.mouse.get_pressed()[2]:
                pos = pygame.mouse.get_pos()
                row, col = get_clicked_pos(pos, ROWS, width)
                if row >= 0 and row < ROWS and col < ROWS and col >= 0:
                    node = grid[row][col]
                    if path:
                        if node in path:
                            path.remove(node)
                    if node in visited:
                        visited.remove(node)
                    if node in weighted:
                        weighted.remove(node)
                    node.reset()
                    if node == start:
                        start = None
                    elif node == end:
                        end = None

            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    run = False

    pygame.quit()


pygame.init()
WIDTH = 800
WIN = pygame.display.set_mode((WIDTH+700, WIDTH))
    
if __name__=="__main__":
    pygame.display.set_caption("Path finding Visualizer")
    main(WIN, WIDTH)
