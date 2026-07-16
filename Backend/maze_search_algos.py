import pygame
from queue import PriorityQueue
from themes.colors import *
from themes.animations import *
from utils import *
from grid import *
import numpy as np
import threading

SCALE_FACTOR = 40

def reconstruct_path(came_from, start, current, draw, visited,  win, width, theme_type, grid, is_draw = True): 
    path = []
    c = 0
    while current in came_from:
        visit_animation(visited,theme_type)
        current = came_from[current]
        if current.is_weight():
            c+= 5
        else:
            c+=1
        if current in visited:
            visited.remove(current)
        if current != start:
            path.insert(0, current)
        current.make_path()
        if is_draw:
            for rows in grid:
                for node in rows:
                    node.draw(win)
            draw_grid(win, grid, width, theme_type)
            pygame.display.update()
    return path, c-1
        
def maze_bfs(draw,grid,start,end,output, win, width,theme_type,muted):
    queue = [start]
    visited = [start]
    came_from = {}
    vis = 0
    while queue:
        start.make_start()
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
        
        current = queue.pop(0)
        if current == end:
            path, inc = reconstruct_path(came_from, start, end, draw, visited, win, width, theme_type,grid)
            start.make_start()
            output.set_text4(f"""
                             1. Path Length: {inc}\n
                             2. Visited nodes: {vis}
                             """)
            
            if vis != 0:
                output.set_text4(f"""
                             1. Path Length: {inc}\n
                             2. Visited nodes: {vis}
                             3. Efficiency: {np.round(inc/vis, decimals=3)}
                             """)
            return visited, path
        c = 1
        
        for neighbor in current.neighbors: #*Check all the neighbors of the current node
            if not neighbor.is_barrier() and neighbor not in visited:  # Ensure the neighbor is not a barrier and not visited
                if neighbor.is_weight():
                    c = 5
                came_from[neighbor] = current
                if(neighbor == end): 
                    path,inc = reconstruct_path(came_from, start, end, draw, visited, win, width, theme_type,grid)
                    start = start.make_start()
                    output.set_text4(f"""
                             1. Path Length: {inc}\n
                             2. Visited nodes: {vis}
                             """)
                    if vis != 0:
                        output.set_text4(f"""
                             1. Path Length: {inc}\n
                             2. Visited nodes: {vis}
                             3. Efficiency: {np.round(inc/vis, decimals=3)}
                             """)
                    return visited, path
                queue.append(neighbor)
                visited.append(neighbor)
                neighbor.make_open()   
                if not muted:
                    distance = h_score(neighbor.get_pos(), end.get_pos())
                    sound_thread = threading.Thread(target=play_sound, args=(distance * SCALE_FACTOR,))
                    sound_thread.start()

        if current != start:
            vis+=c
            current.make_visit()

        visit_animation(visited,theme_type)

        for rows in grid:
            for node in rows:
                node.draw(win)
        draw_grid(win, grid, width,theme_type)
        pygame.display.update()
            
    return visited, False

def maze_dfs(draw, grid, start, end, output, win, width,theme_type,muted):
    stack = [start]
    visited = [start]
    came_from = {}
    vis = 0
    path = []  # Add this line to keep track of the current path

    while stack:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()

        current = stack.pop()
        path.append(current)  # Add the current node to the path

        if current == end:
            path, inc = reconstruct_path(came_from, start, end, draw, visited, win, width, theme_type,grid)
            start.make_start()
            output.set_text4(f"""
                             1. Path Length: {inc}\n
                             2. Visited nodes: {vis}
                             """)
            if vis != 0:
                output.set_text4(f"""
                             1. Path Length: {inc}\n
                             2. Visited nodes: {vis}
                             3. Efficiency: {np.round(inc/vis, decimals=3)}
                             """)
            return visited, path
        c = 1
        for neighbor in current.neighbors:
            if not neighbor.is_barrier() and neighbor not in visited and neighbor not in path:  # Check if the neighbor is in the path
                if neighbor.is_weight():
                    c = 5
                came_from[neighbor] = current
                stack.append(neighbor)
                visited.append(neighbor)
                neighbor.make_open()
                if (neighbor == end):
                    path, inc = reconstruct_path(came_from, start, end, draw, visited, win, width, theme_type,grid)
                    start = start.make_start()
                    output.set_text4(f"""
                             1. Path Length: {inc}\n
                             2. Visited nodes: {vis}
                             """)
                    if vis != 0:
                        output.set_text4(f"""
                             1. Path Length: {inc}\n
                             2. Visited nodes: {vis}
                             3. Efficiency: {np.round(inc/vis, decimals=3)}
                             """)
                    return visited, path
            if not muted:
                distance = h_score(neighbor.get_pos(), end.get_pos())
                sound_thread = threading.Thread(target=play_sound, args=(distance * SCALE_FACTOR,))
                sound_thread.start()
                # play_sound(distance * SCALE_FACTOR)  # Play a sound each time a new node is visited

        if current != start:
            vis += c
            current.make_visit()

        visit_animation(visited,theme_type)

        for rows in grid:
            for node in rows:
                node.draw(win)
        draw_grid(win, grid, width,theme_type)
        pygame.display.update()

    return visited, False

def maze_dijkstra(draw, grid, start, end, output, win, width,theme_type,muted):
    visited_list = []
    came_from = {}
    distances = {node: float('inf') for row in grid for node in row}
    distances[start] = 0
    priority_queue = PriorityQueue()
    priority_queue.put((0, start))

    while not priority_queue.empty():
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()

        current_node = priority_queue.get()[1]

        if current_node == end:
            path, inc = reconstruct_path(
                came_from, start, end, draw, visited_list, win, width, theme_type,grid)
            start.make_start()
            end.make_end()
            output.set_text4(f"""
                             1. Path Length: {inc}\n
                             2. Visited nodes: {len(visited_list)}
                             """)
            if len(visited_list) != 0:
                output.set_text4(f"""
                             1. Path Length: {inc}\n
                             2. Visited nodes: {len(visited_list)}
                             3. Efficiency: {np.round(inc/len(visited_list), decimals=3)}
                             """)
            # Send visited_list to visit_animation
            visit_animation(visited_list,theme_type)
            return visited_list, path

        if current_node in visited_list:
            continue

        visited_list.append(current_node)

        if current_node != start:
            current_node.make_visit()
        visit_animation(visited_list,theme_type)

        for neighbor in current_node.neighbors:
            if neighbor.is_barrier():
                continue
            if neighbor.is_weight():
                c = 5
            else:
                c = 1

            distance_to_neighbor = distances[current_node] + c

            if distance_to_neighbor < distances[neighbor]:
                came_from[neighbor] = current_node
                distances[neighbor] = distance_to_neighbor
                priority_queue.put((distance_to_neighbor, neighbor))
                neighbor.make_open()
            
            if not muted:
                distance = h_score(neighbor.get_pos(), end.get_pos())
                sound_thread = threading.Thread(target=play_sound, args=(distance * SCALE_FACTOR,))
                sound_thread.start()

                # play_sound(distance * SCALE_FACTOR)  # Play a sound each time a new node is visited

        for rows in grid:
            for node in rows:
                node.draw(win)
        draw_grid(win, grid, width,theme_type)
        pygame.display.update()

    return visited_list, False

def maze_astar(draw, grid, start, end, output, win, width,theme_type,muted):
    count = 0
    vis = 0
    open_set = PriorityQueue()
    open_set.put((0, count, start))
    came_from = {}
    g_score = {node: float("inf") for row in grid for node in row}
    g_score[start] = 0
    f_score = {node: float("inf") for row in grid for node in row}
    f_score[start] = h_score(start.get_pos(), end.get_pos())
    visited = []
    nebrs = []
    
    open_set_hash = {start}
    
    while not open_set.empty():
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
        
        current = open_set.get()[2]
        open_set_hash.remove(current)
        
        if current == end:
            path, inc = reconstruct_path(came_from, start, end, draw, visited, win, width, theme_type,grid)
            start.make_start()
            output.set_text4(f"""
                             1. Path Length: {inc}\n
                             2. Visited nodes: {vis}
                             """)
            if vis != 0:
                output.set_text4(f"""
                             1. Path Length: {inc}\n
                             2. Visited nodes: {vis}\n
                             3. Efficiency: {np.round(inc/vis, decimals=3)}
                             """)
            return visited, path
        c = 1      
        for neighbor in current.neighbors:
            if not neighbor.is_barrier():
                if neighbor.is_weight():
                    c = 5

                temp_g_score = g_score[current] + c
                temp_f_score = temp_g_score + h_score(neighbor.get_pos(), end.get_pos())
                if temp_g_score < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = temp_g_score
                    f_score[neighbor] = temp_f_score
                    if neighbor not in open_set_hash:
                        count+=1
                        open_set.put((f_score[neighbor], count, neighbor))
                        open_set_hash.add(neighbor)
                    if neighbor != end:
                        nebrs.append(neighbor)
                        neighbor.make_open()
                        
            if not muted:
                distance = h_score(neighbor.get_pos(), end.get_pos())
                sound_thread = threading.Thread(target=play_sound, args=(distance * SCALE_FACTOR,))
                sound_thread.start()
                # play_sound(distance * SCALE_FACTOR)  # Play a sound each time a new node is visited

        if current != start:
            vis+=c
            visited.append(current)
            current.make_visit()
        visit_animation(visited,theme_type)
        for rows in grid:
            for node in rows:
                node.draw(win)
        draw_grid(win, grid, width,theme_type)
        pygame.display.update()
            
    return False

def maze_idastar(draw, grid, start, end,output, win, width, theme_type, muted=False, threshold=100, moving_target= False, visited_old = []):
    if threshold < len(grid)**2:
        count = 0
        vis = 0
        open_set = PriorityQueue()
        open_set.put((0, count, start))
        came_from = {}
        g_score = {node: float("inf") for row in grid for node in row}
        g_score[start] = 0
        f_score = {node: float("inf") for row in grid for node in row}
        f_score[start] = h_score(start.get_pos(), end.get_pos())

        visited = []
        nebrs = []
        while not open_set.empty():
            if moving_target:
                li = [i for i in end.neighbors if i.is_neutral()]
                if len(li):
                    end.reset()
                    end = li[np.random.randint(len(li))]
                    end.make_end()
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()

            current = open_set.get()[2]

            if current == end:
                path, inc = reconstruct_path(came_from, start, end, draw, visited, win, width, theme_type,grid)
                start.make_start()
                output.set_text4(f"""
                             1. Path Length: {inc}\n
                             2. Visited nodes: {vis}\n
                             """)
                if vis != 0:
                    output.set_text4(f"""
                             1. Path Length: {inc}\n
                             2. Visited nodes: {vis}\n
                             3. Efficiency: {np.round(inc/vis, decimals=3)}
                             """)
                return visited, path
            
            c = 1
            if f_score[current] <= threshold:
                for neighbor in current.neighbors:
                    if not neighbor.is_barrier():
                        if neighbor.is_weight():
                            c = 5
                        temp_g_score = g_score[current] + c
                        temp_f_score = temp_g_score + h_score(neighbor.get_pos(), end.get_pos())
                        if temp_f_score < f_score[neighbor]:
                            came_from[neighbor] = current
                            g_score[neighbor] = temp_g_score
                            f_score[neighbor] = temp_f_score
                            count+=1
                            open_set.put((f_score[neighbor], count, neighbor))
                            if neighbor != end:
                                nebrs.append(neighbor)
                                neighbor.make_open()
                    if not muted:
                        distance = h_score(neighbor.get_pos(), end.get_pos())
                        sound_thread = threading.Thread(target=play_sound, args=(distance * SCALE_FACTOR,))
                        sound_thread.start()
                        # play_sound(distance * SCALE_FACTOR)  # Play a sound each time a new node is visited

            if current != start:
                visited.append(current)
                vis+=c
                current.make_visit()

            visit_animation(visited,theme_type)
            for rows in grid:
                for node in rows:
                    node.draw(win)
            draw_grid(win, grid, width,theme_type)
            pygame.display.update()
            
        if visited == visited_old:
            return visited, False
        return maze_idastar(draw, win, width, output ,grid, start, end, threshold+10, moving_target, visited)
    return [], False

def maze_bellman_ford(draw, grid, start, end, output, win, width, theme_type, muted=False):
    nodes = [node for row in grid for node in row]
    edges = [(node, neighbor) for node in nodes for neighbor in node.neighbors if not neighbor.is_barrier()]

    distances = {node: float('inf') for node in nodes}
    distances[start] = 0

    for _ in range(len(nodes) - 1):
        for node, neighbor in edges:
            if not neighbor.is_barrier():
                if neighbor.is_weight():
                    c = 5
                else:
                    c = 1
                if distances[node] + c < distances[neighbor]:
                    distances[neighbor] = distances[node] + c
                    if not neighbor.is_barrier():
                        neighbor.make_open()
                    
    # Reconstruct path
    came_from = {}
    node = end
    while node != start:
        came_from[node] = min((i for i in node.neighbors if not i.is_barrier()), key=distances.get)
        node = came_from[node]

    path, inc = reconstruct_path(came_from, start, end, draw, nodes, win, width, theme_type, grid)
    start.make_start()
    end.make_end()
    output.set_text4(f"""
                    1. Path Length: {inc}\n
                    2. Visited nodes: {len(nodes)}\n
                    """)
    if len(nodes) != 0:
        output.set_text4(f"""
                        1. Path Length: {inc}\n
                        2. Visited nodes: {len(nodes)}\n
                        3. Efficiency: {np.round(inc/len(nodes), decimals=3)}
                        """)
    visit_animation(nodes, theme_type)

    return nodes, path

def maze_bi_astar(draw, grid, start, end, output, win, width, theme_type, muted=False):
    count = 0
    vis = 0
    open_set_start = PriorityQueue()
    open_set_start.put((0, count, start))
    came_from_start = {}

    open_set_end = PriorityQueue()
    open_set_end.put((0, count, end))
    came_from_end = {}

    g_score_start = {node: float("inf") for row in grid for node in row}
    g_score_start[start] = 0
    f_score_start = {node: float("inf") for row in grid for node in row}
    f_score_start[start] = h_score(start.get_pos(), end.get_pos())
    
    g_score_end = {node: float("inf") for row in grid for node in row}
    g_score_end[end] = 0
    f_score_end = {node: float("inf") for row in grid for node in row}
    f_score_end[end] = h_score(start.get_pos(), end.get_pos())

    x1, y1 = start.get_pos()
    x2, y2 = end.get_pos()
    threshold = max((abs(x1-x2) + abs(y1-y2))//2, len(grid)//3)
    lock = False

    visited1 = []
    visited2 = []
    nebrs = []
    v1, v2 = [], []

    open_set_hash_start = {start}
    open_set_hash_end = {end}
    
    while len(open_set_hash_start) and len(open_set_hash_end):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()

        current = open_set_start.get()[2]
        open_set_hash_start.remove(current)

        c = 1
        for neighbor in current.neighbors:
            if not neighbor.is_barrier():
                if (neighbor.is_neutral() or neighbor.color == BROWN or neighbor.is_open()):
                    if neighbor.is_weight():
                        c = 5
                    temp_g_score = g_score_start[current] + c
                    temp_f_score = (
                        temp_g_score**(h_score(neighbor.get_pos(), end.get_pos())*temp_g_score))
                    if temp_f_score < f_score_start[neighbor]:
                        came_from_start[neighbor] = current
                        g_score_start[neighbor] = temp_g_score
                        f_score_start[neighbor] = temp_f_score
                        if neighbor not in open_set_hash_start:
                            count += 1
                            open_set_start.put(
                                (f_score_start[neighbor], count, neighbor))
                            open_set_hash_start.add(neighbor)
                            nebrs.append(neighbor)
                            neighbor.make_open()
                elif neighbor != start and neighbor not in v1:
                    neighbor.color = (254, 102, 1)
                    draw_grid(win, grid, width,theme_type)
                    pygame.display.update()
                    came_from_start[neighbor] = current
                    path1, inc1 = reconstruct_path(
                        came_from_start, start, neighbor, draw, visited1, win, width, theme_type,grid)
                    start.make_start()
                    path2, inc2 = reconstruct_path(
                        came_from_end, end, neighbor, draw, visited1, win, width, theme_type,grid)
                    end.make_end()
                    output.set_text4(f"""
                        1. Path Length: {inc1+inc2+1}\n
                        2. Visited nodes: {vis}\n
                        """)

                    if vis != 0:
                        output.set_text4(f"""
                        1. Path Length: {inc1+inc2+1}\n
                        2. Visited nodes: {vis}\n
                        3. Efficiency: {np.round(inc1+inc2+1/vis, decimals=3)}
                        """)
                    return visited1+visited2, path1+path2
                
            if not muted:
                distance = h_score(neighbor.get_pos(), end.get_pos())
                sound_thread = threading.Thread(target=play_sound, args=(distance * SCALE_FACTOR,))
                sound_thread.start()
                # play_sound(distance * SCALE_FACTOR)  # Play a sound each time a new node is visited

        if current != start:
            if current in visited1:
                visited1.remove(current)
            current.make_visit()
            v1.append(current)
            visited1.append(current)
            vis += c

        visit_animation(visited1,theme_type)
        for rows in grid:
            for node in rows:
                node.draw(win)
        draw_grid(win, grid, width,theme_type)
        pygame.display.update()
        if not lock:
            current = open_set_end.get()[2]
            open_set_hash_end.remove(current)
            if g_score_end[current] > threshold:
                lock = True
            c = 1
            for neighbor in current.neighbors:
                if not neighbor.is_barrier():
                    if (neighbor.is_neutral() or neighbor.color == BROWN or neighbor.is_open()):
                        if neighbor.is_weight():
                            c = 5
                        temp_g_score = g_score_end[current] + c
                        temp_f_score = temp_g_score
                        if temp_f_score < f_score_end[neighbor]:
                            came_from_end[neighbor] = current
                            g_score_end[neighbor] = temp_g_score
                            f_score_end[neighbor] = temp_f_score
                            if neighbor not in open_set_hash_end:
                                count += 1
                                open_set_end.put(
                                    (f_score_end[neighbor], count, neighbor))
                                open_set_hash_end.add(neighbor)
                                nebrs.append(neighbor)
                                neighbor.make_open()
                    elif neighbor != end and neighbor not in v2:
                        neighbor.color = (254, 102, 1)
                        draw_grid(win, grid, width,theme_type)
                        pygame.display.update()
                        came_from_end[neighbor] = current
                        path1, inc1 = reconstruct_path(
                            came_from_end, end, neighbor, draw, visited2, win, width, theme_type,grid)
                        end.make_end()
                        path2, inc2 = reconstruct_path(
                            came_from_start, start, neighbor, draw, visited2, win, width, theme_type,grid)
                        start.make_start()
                        output.set_text4(f"""
                        1. Path Length: {inc1+inc2+1}\n
                        2. Visited nodes: {vis}\n
                        """)
                        if vis != 0:
                            output.set_text4(f"""
                        1. Path Length: {inc1+inc2+1}\n
                        2. Visited nodes: {vis}\n
                        3. Efficiency: {np.round(inc1+inc2+1/vis, decimals=3)}
                        """)
                        return visited2+visited1, path1+path2
                if not muted:
                    distance = h_score(neighbor.get_pos(), end.get_pos())
                    sound_thread = threading.Thread(target=play_sound, args=(distance * SCALE_FACTOR,))
                    sound_thread.start()
                    # play_sound(distance * SCALE_FACTOR)  # Play a sound each time a new node is visited

            if current != end:
                if current in visited2:
                    visited2.remove(current)
                current.make_visit()
                v2.append(current)
                visited2.append(current)
                vis += c

            visit_animation(visited2,theme_type)
            for rows in grid:
                for node in rows:
                    node.draw(win)
            draw_grid(win, grid, width,theme_type)
            pygame.display.update()

    return visited2+visited1, False

def maze_bi_bfs(draw, grid, start, end, output, win, width,theme_type,muted=False):
    queue1 = [start]
    queue2 = [end]
    visited1 = [start]
    visited2 = [end]
    came_from1 = {}
    came_from2 = {}
    vis = 0
    while queue1 and queue2:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()

        current1 = queue1.pop(0)
        current2 = queue2.pop(0)

        if (current1 in visited2):
            path1, inc1 = reconstruct_path(
                came_from1, start, current1, draw, visited1, win, width, theme_type,grid)
            start.make_start()
            path2, inc2 = reconstruct_path(
                came_from2, end, current1, draw, visited2, win, width, theme_type,grid)
            end.make_end()
            current1.make_path()
            output.set_text4(f"""
                        1. Path Length: {inc1+inc2+1}\n
                        2. Visited nodes: {vis}\n
                        """)
            if vis != 0:
                output.set_text4(f"""
                        1. Path Length: {inc1+inc2+1}\n
                        2. Visited nodes: {vis}\n
                        3. Efficiency: {np.round(inc1+inc2+1/vis, decimals=3)}
                        """)
            return visited2+visited1, path1+path2

        elif (current2 in visited1):
            path1, inc1 = reconstruct_path(
                came_from1, start, current2, draw, visited1, win, width, theme_type,grid)
            start.make_start()
            path2, inc2 = reconstruct_path(
                came_from2, end, current2, draw, visited2, win, width, theme_type,grid)
            end.make_end()
            current2.make_path()
            output.set_text4(f"""
                        1. Path Length: {inc1+inc2+1}\n
                        2. Visited nodes: {vis}\n
                        """)
            if vis != 0:
                output.set_text4(f"""
                        1. Path Length: {inc1+inc2+1}\n
                        2. Visited nodes: {vis}\n
                        3. Efficiency: {np.round(inc1+inc2+1/vis, decimals=3)}
                        """)
            return visited1+visited2, path1 + path2

        if current1 == end:
            path, inc = reconstruct_path(
                came_from1, start, end, draw, visited1, win, width, theme_type,grid)
            start.make_start()
            output.set_text4(f"""
                        1. Path Length: {inc1+inc2+1}\n
                        2. Visited nodes: {vis}\n
                        """)
            if vis != 0:
                output.set_text4(f"""
                    1. Path Length: {inc}\n
                    2. Visited nodes: {vis}\n
                    3. Efficiency: {np.round(inc/vis, decimals=3)}
                    """)
            return visited1, path

        elif current2 == start:
            path, inc = reconstruct_path(
                came_from1, start, end, draw, visited2, win, width, theme_type,grid)
            start.make_start()
            output.set_text4(f"""
                        1. Path Length: {inc}\n
                        2. Visited nodes: {vis}\n
                        """)
            if vis != 0:
                output.set_text4(f"""
                        1. Path Length: {inc}\n
                        2. Visited nodes: {vis}\n
                        3. Efficiency: {np.round(inc/vis, decimals=3)}
                        """)
            return visited2, path

        c = 1

        for neighbor in current1.neighbors:  # *Check all the neighbors of the current node
            if not neighbor.is_barrier():
                if neighbor not in visited1:
                    came_from1[neighbor] = current1
                    # * If the neighbor node is the end node, then we reconstruct the path and return True
                    if (neighbor == end):
                        path1, inc1 = reconstruct_path(
                            came_from1, start, end, draw, visited1, win, width, theme_type,grid)
                        start.make_start()
                        output.set_text4(f"""
                        1. Path Length: {inc1}\n
                        2. Visited nodes: {vis}\n
                        3. Efficiency: {np.round(inc1/vis, decimals=3)}
                        """)
                        if vis != 0:
                            output.set_text4(f"""
                        1. Path Length: {inc1}\n
                        2. Visited nodes: {vis}\n
                        3. Efficiency: {np.round(inc1/vis, decimals=3)}
                        """)
                        return visited1, path1
                    queue1.append(neighbor)
                    visited1.append(neighbor)
                    neighbor.make_open()
            if not muted:
                distance = h_score(neighbor.get_pos(), end.get_pos())
                sound_thread = threading.Thread(target=play_sound, args=(distance * SCALE_FACTOR,))
                sound_thread.start()
                # play_sound(distance * SCALE_FACTOR)  # Play a sound each time a new node is visited

        for neighbor in current2.neighbors:
            if not neighbor.is_barrier():
                if neighbor not in visited2:
                    came_from2[neighbor] = current2
                    # * If the neighbor node is the end node, then we reconstruct the path and return True
                    if (neighbor == end):
                        path2, inc2 = reconstruct_path(
                            came_from1, start, end, draw, visited2, win, width, theme_type,grid)
                        start.make_start()
                        output.set_text4(f"""
                        1. Path Length: {inc2}\n
                        2. Visited nodes: {vis}\n
                        """)
                        if vis != 0:
                            output.set_text4(f"""
                        1. Path Length: {inc2}\n
                        2. Visited nodes: {vis}\n
                        3. Efficiency: {np.round(inc2/vis, decimals=3)}
                        """)
                        return visited2, path2
                    queue2.append(neighbor)
                    visited2.append(neighbor)
                    neighbor.make_open()
            if not muted:
                distance = h_score(neighbor.get_pos(), end.get_pos())
                sound_thread = threading.Thread(target=play_sound, args=(distance * SCALE_FACTOR,))
                sound_thread.start()
                # play_sound(distance * SCALE_FACTOR)  # Play a sound each time a new node is visited

        if current1 != start:
            vis += c
            current1.make_visit()
        visit_animation(visited1,theme_type)
        for rows in grid:
            for node in rows:
                node.draw(win)
        draw_grid(win, grid, width,theme_type)
        pygame.display.update()

        if current2 != end:
            vis += c
            current2.make_visit()
        visit_animation(visited2,theme_type)
        for rows in grid:
            for node in rows:
                node.draw(win)
        draw_grid(win, grid, width,theme_type)
        pygame.display.update()

    return visited1+visited2, False
